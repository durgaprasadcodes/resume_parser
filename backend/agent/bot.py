import os
import json
import uuid
from pathlib import Path
from database import get_db
from dotenv import load_dotenv
from schemas.schema import Resume
from langchain_groq import ChatGroq
from models.model import Users, Resumes
from tempfile import NamedTemporaryFile
from sqlalchemy.orm import Session
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import limiter, demo_job_description, SYSTEM_PROMPT, supabase
from fastapi import UploadFile, File, status, HTTPException, APIRouter, Request, Depends
from tokens.get_user_info import get_user_info

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PGVECTOR_DATABASE_API_KEY = os.getenv("PGVECTOR_DATABASE_API_KEY")


def docs_to_text(docs) -> str:

    if isinstance(docs, str):
        return docs
    return "\n".join(d.page_content for d in docs)


def split_documents(file_path):

    loader = PyMuPDFLoader(file_path)
    document = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=75)
    chunks = splitter.split_documents(document)

    return chunks


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
            f"JOB DESCRIPTION:\n{jd_text}\n\nRESUME TEXT:\n{docs_to_text(resume_text)}",
        ),
    ]
    result = structured_llm.invoke(messages)
    return json.dumps(result.model_dump(), indent=2)


# --------------------------- usage in bot.py ---------------------------


LLM = ChatGroq(
    model="qwen/qwen3.8-27b",
    temperature=0.3,
    max_retries=5,
    # max_tokens=1000,
    api_key=GROQ_API_KEY,
)

agent_router = APIRouter(tags=["Hirelense Resume Parser"], prefix="/hirelense")

MAX_FILE_SIZE = 10 * 1024 * 1024


@agent_router.post("/upload_resume")
@limiter.limit("3/minutes")
async def upload_resume(
    request: Request,
    user_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_user_info),
):
    if user_id != current_user["id"]:
        raise HTTPException(
            status_code=403, detail="User ID does not match authenticated user"
        )

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

        resume_text = split_documents(file_path)

        result = analyze_resume_vs_jd_groq(
            LLM.with_structured_output(Resume), resume_text, demo_job_description
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

        ONE_YEAR = 60 * 60 * 24 * 365

        signed = supabase.storage.from_("resumes").create_signed_url(
            storage_path, ONE_YEAR
        )

        supabase_url = signed["signedURL"]

        resume_name = Path(filename).stem

        resume_record = (
            db.query(Resumes)
            .filter(Resumes.resume_name == resume_name, Resumes.user_id == user_id)
            .first()
        )

        if resume_record:
            resume_record.resume_url = supabase_url
        else:
            resume_record = Resumes(
                resume_name=resume_name, resume_url=supabase_url, user_id=user_id
            )
            db.add(resume_record)

        db.commit()
        db.refresh(resume_record)

        return {
            "message": "File uploaded successfully",
            "filename": filename,
            "url": supabase_url,
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
