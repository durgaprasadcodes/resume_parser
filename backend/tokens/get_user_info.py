from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from config import get_cached_user, cashe_user
from database import get_db
from models.model import Users
from tokens.jwt_token import decode_access_token


def serialize_user(user: Users) -> dict:
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "picture": user.picture,
        "is_verified": user.is_verified,
    }


def get_user_info(
    request: Request,
    db: Session = Depends(get_db),
):

    access_token = request.cookies.get("access_token")

    try:
        payload = decode_access_token(access_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )

    user_id = payload.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        )

    cashed_user = get_cached_user(user_id)
    if cashed_user:
        return cashed_user

    user = db.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    data = serialize_user(user)
    cashe_user(data)

    return data
