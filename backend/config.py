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
from email.message import EmailMessage
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)

load_dotenv()

PassDriver = PasswordHash.recommended()

limiter = Limiter(key_func=get_remote_address)


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
) -> str:
    """Sets only the refresh_token as an httpOnly cookie.
    Returns the access_token so callers can include it in the JSON response
    for the frontend to store in localStorage.
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
        # max_age=60 * 60 * 24 * REFRESH_TOKEN_EXPIRY_TIME,
        max_age=90,
        samesite=samesite,
        path="/",
    )

    return access_token


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


ats_score_description = """
Compute the ATS compatibility score (integer 0-100) of the resume against the Job Description (JD). Be strict, evidence-based and deterministic: the same normalized resume + same JD must always give exactly the same score. Never vary the score because of wording, randomness, reasoning order, re-uploads, repeated evaluation or explanation differences. No subjective impressions: score only resume evidence vs JD requirements.

Rubric (max points):
1. Required skills/technologies (30): match languages, frameworks, libraries, databases, platforms, tools. Required skills outweigh preferred. No points for skills the resume does not support.
2. Responsibility alignment (20): compare JD responsibilities with demonstrated projects/experience/work. Points only with evidence.
3. Project relevance (20): relevance to JD, technical depth, implementation, deployment, scale, outcomes. No extra points for multiple projects using the same technology.
4. Experience alignment (15): relevant internships/professional experience weighs far more than unrelated. Education is NOT professional experience. No relevant experience = no points; never invent it.
5. Education & certifications (10): only JD-relevant ones count; generic/unrelated certifications earn little.
6. Keyword alignment (5): JD terms must appear naturally with evidence of real use. No credit for keyword stuffing.

Bands: 90-100 exceptional (major requirements strongly met, substantial evidence); 80-89 strong (most important requirements met, minor gaps); 70-79 good/moderate (many met, noticeable gaps); 60-69 limited (several important requirements missing/weak); 40-59 poor (major requirements missing/unsupported); 0-39 very poor (little evidence of suitability).

Rules: Do not inflate for a generally impressive resume; score only fit to this JD. Do not penalize absence of things the JD neither requires nor prefers. Never invent experience, skills, projects, certifications or achievements.
"""
