import os
import redis
import secrets
import logging
import hashlib
import httpx
from dotenv import load_dotenv
from pwdlib import PasswordHash
from email.message import EmailMessage
from slowapi.util import get_remote_address
from slowapi import Limiter

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
IS_PRODUCTION = os.getenv("ENV") == "production"

SECREST_CODE = os.getenv("SECREST_CODE")
ALGORITH = os.getenv("ALGORITH")
ACCESS_TOKEN_EXPIRY_TIME = int(os.getenv("ACCESS_TOKEN_EXPIRY_TIME"))
REFRESH_TOKEN_EXPIRY_TIME = int(os.getenv("REFRESH_TOKEN_EXPIRY_TIME"))


NEON_DATABASE_URL = os.getenv("NEON_DATABASE_URL")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")
REDIS_PORT = int(os.getenv("REDIS_PORT"))

REDIS_CLIENT = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True,
    username="default",
    password=REDIS_PASSWORD,
)

EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT"))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


FRONTEND_URL = os.getenv("FRONTEND_URL")

BREVO_API_KEY = os.environ.get("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.environ.get("BREVO_SENDER_EMAIL")


async def send_email(user_email: str, otp: str | int) -> bool:

    if not BREVO_API_KEY or not BREVO_SENDER_EMAIL:
        logger.error(
            "Missing Brevo Configuration: Ensure BREVO_API_KEY and BREVO_SENDER_EMAIL are set in environment variables."
        )
        return False

    url = "https://brevo.com"

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": BREVO_API_KEY,
    }

    html_content = f"""<html><body style="margin:0;padding:20px;background:#f6f7f9;font-family:Arial,sans-serif;color:#111827;"><div style="max-width:400px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;text-align:center;"><h3 style="margin:0 0 10px;">Verify your email</h3><p style="margin:0 0 18px;color:#6b7280;font-size:14px;">Your verification code is</p><div style="display:inline-block;background:#f3f4f6;padding:10px 18px;border-radius:6px;font-size:26px;font-weight:700;letter-spacing:5px;">{otp}</div><p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">Expires in 5 minutes. If you didn't request this, ignore this email.</p></div></body></html>"""

    # 2. Build the Brevo JSON payload structure
    payload = {
        "sender": {"name": "Hirelense.ai", "email": BREVO_SENDER_EMAIL},
        "to": [{"email": user_email}],
        "subject": f"{otp} is your verification code - Hirelense.ai",
        "htmlContent": html_content,
    }

    try:
        # 3. Asynchronously push to Brevo with a strict timeout limit
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, json=payload, headers=headers, timeout=10.0
            )

        if response.status_code == 201:
            logger.info(f"OTP email sent successfully to {user_email} via Brevo API")
            return True
        else:
            logger.error(
                f"Brevo API error: Status {response.status_code} - Response: {response.text}"
            )
            return False

    except Exception as e:
        logger.error(
            f"Error sending OTP email via Brevo to {user_email}: {str(e)}",
            exc_info=True,
        )
        return False
