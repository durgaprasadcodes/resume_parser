import os
import json
import uuid, pymupdf
from datetime import datetime, timezone
from pathlib import Path
from database import get_db
from dotenv import load_dotenv
from schemas.schema import Resume
from langchain_groq import ChatGroq
from models.model import Resumes, Users
from tempfile import NamedTemporaryFile
from sqlalchemy.orm import Session
from config import limiter, SYSTEM_PROMPT, supabase
from fastapi import (
    UploadFile,
    File,
    Form,
    HTTPException,
    APIRouter,
    Request,
    Depends,
    Query,
)
from tokens.get_user_info import get_user_info

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


def get_text(file_path):

    doc = pymupdf.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text


def analyze_resume_vs_jd_groq(structured_llm, resume_text, jd_text: str) -> Resume:

    system_prompt = SYSTEM_PROMPT
    system_prompt += (
        "\n\nReturn ONLY a JSON object matching this JSON schema:\n"
        + json.dumps(Resume.model_json_schema())
    )

    messages = [
        ("system", system_prompt),
        (
            "human",
            f"JOB DESCRIPTION:\n{jd_text}\n\nRESUME TEXT:\n{resume_text}",
        ),
    ]
    result = structured_llm.invoke(messages)
    return json.dumps(result.model_dump(), indent=2)


# --------------------------- usage in bot.py ---------------------------


LLM = ChatGroq(
    model="qwen/qwen3.8-27b",
    temperature=0.3,
    max_retries=5,
    api_key=GROQ_API_KEY,
)

agent_router = APIRouter(tags=["Hirelense Resume Parser"], prefix="/hirelense")

MAX_FILE_SIZE = 10 * 1024 * 1024


@agent_router.post("/upload_resume")
@limiter.limit("3/minutes")
async def upload_resume(
    request: Request,
    user_id: str,
    jd: str = Form(default=""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_user_info),
):
    if user_id != current_user["id"]:
        raise HTTPException(
            status_code=403, detail="User ID does not match authenticated user"
        )
    user_uuid = uuid.UUID(user_id)
    if jd == "":
        raise HTTPException(status_code=413, detail="Job Description Not Found")

    file_path = None

    filename = file.filename or ""
    extension = Path(filename).suffix.lower()

    if extension != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    if file.size is None:
        raise HTTPException(status_code=400, detail="Unable to determine file size")

    if file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File size exceeds 10MB")

    try:
        file_bytes = await file.read()

        if not file_bytes.startswith(b"%PDF"):
            raise HTTPException(status_code=400, detail="Invalid PDF file")

        with NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(file_bytes)
            file_path = temp_file.name

        resume_text = get_text(file_path)

        result = analyze_resume_vs_jd_groq(
            LLM.with_structured_output(Resume), resume_text, jd
        )

        storage_path = f"{user_id}/{uuid.uuid4()}.pdf"

        supabase.storage.from_("resumes").upload(
            path=storage_path,
            file=file_bytes,
            file_options={
                "content-type": "application/pdf",
                "upsert": False,
            },
        )

        resume_record = (
            db.query(Resumes)
            .filter(Resumes.resume_name == filename, Resumes.user_id == user_uuid)
            .first()
        )

        if resume_record:
            resume_record.uploaded_at = datetime.now(timezone.utc)
        else:
            resume_record = Resumes(resume_name=filename, user_id=user_uuid)
            db.add(resume_record)

        db.commit()
        db.refresh(resume_record)

        return {
            "message": "File uploaded successfully",
            "filename": filename,
            "result": result,
        }

    except HTTPException:
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500, detail="Failed to upload and analyze resume"
        )

    finally:
        if file_path:
            Path(file_path).unlink(missing_ok=True)


@agent_router.get("/get_resumes")
async def get_upload_resume(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=5, ge=1, le=5),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_user_info),
):
    user_id = uuid.UUID(current_user["id"])
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    resumes_query = db.query(Resumes).filter(Resumes.user_id == user_id)
    total_resumes = resumes_query.count()
    resumes = (
        resumes_query.order_by(Resumes.uploaded_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "success": True,
        "member_since": user.created_at.isoformat() if user.created_at else None,
        "total_resumes": total_resumes,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total_resumes + page_size - 1) // page_size),
        "resumes": [
            {
                "id": str(resume.id),
                "resume_name": resume.resume_name,
                "uploaded_at": (
                    resume.uploaded_at.isoformat() if resume.uploaded_at else None
                ),
            }
            for resume in resumes
        ],
    }
