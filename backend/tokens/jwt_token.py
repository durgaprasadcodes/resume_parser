import uuid, secrets
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from config import (
    SECREST_CODE,
    ALGORITH,
    ACCESS_TOKEN_EXPIRY_TIME,
    hash_refresh_token,
)


def create_access_token(user_id, user_email) -> str:
    payload = {
        "user_id": str(user_id),
        "user_email": str(user_email),
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRY_TIME),
    }

    return jwt.encode(payload, SECREST_CODE, algorithm=ALGORITH)


def create_refresh_token():
    token = secrets.token_urlsafe(64)
    token_hash = hash_refresh_token(token)
    return token, token_hash


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECREST_CODE, algorithms=ALGORITH)

        if not payload.get("user_id"):
            raise ValueError("Invalid Access Token")
        if payload.get("type") != "access":
            raise ValueError("Invalid Token Given")
        return payload
    except JWTError:
        raise ValueError("Invalid Access Token")
