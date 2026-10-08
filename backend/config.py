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

FRONTEND_URL = os.getenv("FRONTEND_URL")

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME")


async def send_otp_email(recipient_email: str, otp: str):
    print("BREVO API KEY PREFIX:", BREVO_API_KEY[:10] if BREVO_API_KEY else None)
    print("BREVO SENDER:", BREVO_SENDER_EMAIL)

    url = "https://api.brevo.com/v3/smtp/email"

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }

    data = {
        "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        "to": [{"email": recipient_email}],
        "subject": f"{otp} is Your HireLense.ai OTP",
        "htmlContent": f"""
        <html>
            <body>
                <h2>HireLense.ai Email Verification</h2>

                <p>Your verification OTP is:</p>

                <h1>{otp}</h1>

                <p>This OTP will expire in 5 minutes.</p>

                <p>If you did not request this OTP,
                you can safely ignore this email.</p>
            </body>
        </html>
        """,
    }

    async with httpx.AsyncClient() as client:

        response = await client.post(url, headers=headers, json=data)

        response.raise_for_status()

        return response.json()
