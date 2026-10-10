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


OTP_EXPIRY_SECONDS = 300
IS_PRODUCTION = os.getenv("ENV") == "production" or os.getenv("RENDER") is not None

SECREST_CODE = os.getenv("SECREST_CODE")
ALGORITH = os.getenv("ALGORITH")
ACCESS_TOKEN_EXPIRY_TIME = int(os.getenv("ACCESS_TOKEN_EXPIRY_TIME"))
REFRESH_TOKEN_EXPIRY_TIME = int(os.getenv("REFRESH_TOKEN_EXPIRY_TIME"))


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
):
    is_secure = (
        IS_PRODUCTION
        or (request is not None and request.url.scheme == "https")
        or (request is not None and request.headers.get("x-forwarded-proto") == "https")
    )
    samesite = "none" if is_secure else "lax"

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_secure,
        max_age=60 * ACCESS_TOKEN_EXPIRY_TIME,
        samesite=samesite,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        max_age=60 * 60 * 24 * REFRESH_TOKEN_EXPIRY_TIME,
        samesite=samesite,
        path="/",
    )


def clear_auth_cookies(response: Response, request: Request = None):
    is_secure = (
        IS_PRODUCTION
        or (request is not None and request.url.scheme == "https")
        or (request is not None and request.headers.get("x-forwarded-proto") == "https")
    )
    samesite = "none" if is_secure else "lax"

    response.delete_cookie(
        key="access_token",
        path="/",
        secure=is_secure,
        samesite=samesite,
        httponly=True,
    )
    response.delete_cookie(
        key="refresh_token",
        path="/",
        secure=is_secure,
        samesite=samesite,
        httponly=True,
    )
