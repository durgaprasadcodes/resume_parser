import os
import json
from pathlib import Path
from dotenv import load_dotenv
from schemas.schema import Resume
from langchain_groq import ChatGroq
from models.model import Users, Resumes
from tempfile import NamedTemporaryFile
from langchain_community.document_loaders import PyMuPDFLoader
from config import limiter, demo_job_description, SYSTEM_PROMPT, supabase
from langchain_text_splitters import RecursiveCharacterTextSplitter
from fastapi import UploadFile, File, status, HTTPException, APIRouter, Request

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
    api_key=GROQ_API_KEY,
)

agent_router = APIRouter(tags=["Hirelense Resume Parser"], prefix="/hirelense")

MAX_FILE_SIZE = 10 * 1024 * 1024


@agent_router.post("/upload_resume")
@limiter.limit("3/minutes")
async def upload_resume(request: Request, file: UploadFile = File(...)):

    file_extension = file.filename.split(".")
    
    if len(file_extension) == 1 :
        raise HTTPException(
            status_code=400,
            detail=f"please upload a valid pdf file ",
        )

    if file_extension[1] != "pdf":
        raise HTTPException(
            status_code=400,
            detail=f"invalid file type, {file_extension[1]}'s are not Allowed ",
        )

    if file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=(
                f"file size exceeds 10MB, upload file size is {file.size/ (1024 * 1024):.2f}MB"
            ),
        )

    try:

        file_bytes = await file.read()
        path = file.filename

        response = supabase.storage.from_("resumes").upload(
            path=path,
            file=file_bytes,
            file_options={"content-type": file.content_type, "upsert": "true"},
        )

        ONE_YEAR = 60 * 60 * 24 * 365

        signed = supabase.storage.from_("resumes").create_signed_url(path, ONE_YEAR )


        with NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(file_bytes)
            file_path = temp_file.name

        resume_text = split_documents(file_path=file_path)

        result = analyze_resume_vs_jd_groq(
            LLM.with_structured_output(Resume), resume_text, demo_job_description
        )

        return {    
            "message": "File uploaded successfully",
            "filename": path,
            "url": signed["signedURL"],
            "result": result,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if file_path:
            Path(file_path).unlink(missing_ok=True)