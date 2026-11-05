import os
import secrets
import logging
import hashlib
import httpx
from slowapi import Limiter
from dotenv import load_dotenv
from upstash_redis import Redis
from pwdlib import PasswordHash
from fastapi import Request, Response
from slowapi.util import get_remote_address
from supabase import create_client, Client

logger = logging.getLogger(__name__)

load_dotenv()

PassDriver = PasswordHash.recommended()

limiter = Limiter(key_func=get_remote_address)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def hash_password(password: str | int) -> str:
    return PassDriver.hash(str(password))


def verify_password(new_password: str, db_password: str) -> bool:
    return PassDriver.verify(new_password, db_password)


def generate_otp() -> str:
    """Generates a secure 6-digit numeric OTP."""
    return f"{secrets.randbelow(900000) + 100000:06d}"


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_reset_token():
    return secrets.token_urlsafe(32)


OTP_EXPIRY_SECONDS = 300
IS_PRODUCTION = os.getenv("ENV") == "production" or os.getenv("RENDER") is not None

SECREST_CODE = os.getenv("SECREST_CODE")
ALGORITH = os.getenv("ALGORITH")
ACCESS_TOKEN_EXPIRY_TIME = int(os.getenv("ACCESS_TOKEN_EXPIRY_TIME"))
REFRESH_TOKEN_EXPIRY_TIME = int(os.getenv("REFRESH_TOKEN_EXPIRY_TIME"))

GOOGLE_SESSION_SECRET = os.getenv("GOOGLE_SESSION_SECRET")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URL = os.getenv("GOOGLE_REDIRECT_URL", "")

NEON_DATABASE_URL = os.getenv("NEON_DATABASE_URL")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


REDIS_CLIENT = Redis(
    url=os.getenv("UPSTASH_REDIS_URL"), token=os.getenv("UPSTASH_REDIS_TOKEN")
)

FRONTEND_URL = os.getenv("FRONTEND_URL")

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME")


async def send_otp_email(recipient_email: str, otp: str, context: str):

    url = "https://api.brevo.com/v3/smtp/email"

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }

    if context == "Password changed successfully.":
        data = {
            "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
            "to": [{"email": recipient_email}],
            "subject": f"{context}",
            "htmlContent": f"""
            <html>
            <body>
                <h2>HireLense.ai Password Changed</h2>

                <p>Your password has been changed successfully.</p>

                <small>Thank's for using HireLense.ai</small>
            </body>
        </html>
        """,
        }
    else:
        data = {
            "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
            "to": [{"email": recipient_email}],
            "subject": f"{otp} is your {context}",
            "htmlContent": f"""
        <html>
            <body>
                <h2>HireLense.ai Email Verification</h2>

                <p>Your verification OTP is:</p>

                <h1>{otp}</h1>

                <p>This OTP will expire in 5 minutes.</p>

                <small>If you did not request this OTP,
                you can safely ignore this email.</small>
            </body>
        </html>
        """,
        }

    async with httpx.AsyncClient() as client:

        response = await client.post(url, headers=headers, json=data)

        response.raise_for_status()

        return response.json()


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    request: Request = None,
) -> dict[str, str]:
    """Sets only the refresh_token as an httpOnly cookie.
    Returns the access token for the JSON response to the frontend.
    """
    is_secure = (
        IS_PRODUCTION
        or (request is not None and request.url.scheme == "https")
        or (request is not None and request.headers.get("x-forwarded-proto") == "https")
    )
    samesite = "none" if is_secure else "lax"

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        max_age=60 * 60 * 24 * REFRESH_TOKEN_EXPIRY_TIME,
        samesite=samesite,
        path="/",
    )
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=is_secure,
        samesite=samesite,
        httponly=True,
    )

    return {"message": "refresh tokens send to cookies", "access_token": access_token}


def clear_auth_cookies(response: Response, request: Request = None):
    is_secure = (
        IS_PRODUCTION
        or (request is not None and request.url.scheme == "https")
        or (request is not None and request.headers.get("x-forwarded-proto") == "https")
    )
    samesite = "none" if is_secure else "lax"

    response.delete_cookie(
        key="refresh_token",
        path="/",
        secure=is_secure,
        samesite=samesite,
        httponly=True,
    )
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=is_secure,
        samesite=samesite,
        httponly=True,
    )


import json

USER_CACHE_TTL = 600


def get_cached_user(user_id) -> None:

    user_key = f"_USER_{user_id}"
    user = REDIS_CLIENT.get(user_key)
    if user:
        print("CASHED USER TAKEN FROM REDIS")
        return json.loads(user)
    return None


def cashe_user(user: dict) -> None:
    REDIS_CLIENT.set(
        f"_USER_{user["id"]}",
        json.dumps(user),
        ex=USER_CACHE_TTL,
    )
    print("CASHING THE USER TO REDIS")


def invalidate_user(user_id) -> None:
    REDIS_CLIENT.delete(f"_USER_{user_id}")


ats_score_description = """

Compute the ATS Score for this resume for job descrition with this techinic
WEIGHTS = {
    "technical_skills": 0.35,
    "experience": 0.25,
    "projects": 0.20,
    "education": 0.10,
    "keywords": 0.10,
}
score = (
        data.technical_skills * WEIGHTS["technical_skills"]
        + data.experience * WEIGHTS["experience"]
        + data.projects * WEIGHTS["projects"]
        + data.education * WEIGHTS["education"]
        + data.keywords * WEIGHTS["keywords"]
    )
    
give the final score as ATS Score

"""

SYSTEM_PROMPT = """You are an expert ATS/HR analyst. Compare the resume to the Job Description (JD) and fill the required structured output. Use only evidence in the resume and requirements in the JD. Never invent experience, skills, projects, certifications or achievements.

ATS SCORE (integer 0-100): strict, evidence-based, deterministic. Same resume + same JD must always give the same score; no subjective impressions.
Rubric: required skills/technologies 30 (required > preferred; no points for unsupported skills); responsibility alignment 20; project relevance 20 (depth, deployment, scale, outcomes; no extra points for many projects on the same tech); experience alignment 15 (education is NOT experience; none relevant = 0 points); education/certifications 10 (only JD-relevant); keyword alignment 5 (needs evidence of real use; no keyword-stuffing credit).
Bands: 90-100 exceptional; 80-89 strong; 70-79 moderate; 60-69 limited; 40-59 poor; 0-39 very poor.
Do not inflate for a generally impressive resume. Do not penalize absence of things the JD does not require or prefer.

SKILLS: matched = JD skills the resume clearly shows; unmatched = important JD skills not explicitly shown or implied.

NEGATIVES (critical but fair; each item states WHAT is wrong, WHY it matters for this role, WHAT to change; no generic advice; every point grounded in resume/JD evidence; distinguish a real deficiency from something merely unmentioned). Check: JD requirement/responsibility gaps; skills listed but never demonstrated; summary misaligned, vague or missing JD strengths; low-relevance projects and why; repetitive projects (e.g. several regression ML projects) and missing categories (classification, NLP, CV, RAG/LLM, backend, cloud, real-time, data engineering) only if the repetition is actually present; suspicious or unvalidated metrics (very high R2/accuracy without methodology) as a potential concern for overfitting/leakage, never asserted as fact; shallow/tutorial-like projects and missing engineering details (deployment, testing, auth, scalability, DB/API design, CI/CD, cloud); no or unrelated or poorly described professional experience (never count education as experience); generic/outdated certifications (do not penalize one only for not being in the JD); vague wording, weak verbs, missing measurable outcomes; missing JD terms that could truthfully be added, keyword stuffing.

POSITIVES (specific, resume-based, explain WHY each strengthens the application; do not just list keywords): JD-aligned skills shown in projects/experience; summary alignment; relevant projects (complexity, deployment, APIs, databases, ML/AI, cloud) and credible metrics; useful project diversity; relevant experience; relevant certifications; credibility evidence (deployed apps, measurable outcomes, production-like architecture); ATS/recruiter value.

LENGTH LIMITS (keep the response compact and always complete): at most 6 negatives and 5 positives, each at most 2 sentences; project_value at most 2 sentences; empty list when there is no work experience. Respond only with the structured output."""
