from database import get_db
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from models.model import Users, RefreshToken
from slowapi.errors import RateLimitExceeded
from fastapi.responses import RedirectResponse
from slowapi import _rate_limit_exceeded_handler
from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi import Depends, Request, HTTPException, status, Response
from schemas.schema import RegistrationSchema, LoginSchema
from config import (
    hash_password,
    verify_password,
    ACCESS_TOKEN_EXPIRY_TIME,
    REFRESH_TOKEN_EXPIRY_TIME,
    hash_refresh_token,
)
from config import (
    limiter,
    send_email,
    generate_otp,
    REDIS_CLIENT,
    FRONTEND_URL,
    IS_PRODUCTION,
)

from tokens.jwt_token import create_access_token, create_refresh_token

router = APIRouter(tags=["Authentication"], prefix="/auth")

router.state.limit = limiter

router.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@router.post("/register")
@limiter.limit("5/minutes")
async def register(
    request: Request,
    response: Response,
    user: RegistrationSchema,
    db: Session = Depends(get_db),
    backgroundtasks: BackgroundTasks = None,
):
    db_user = db.query(Users).filter(user.email == Users.email).first()

    if db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User Exsited Already"
        )

    new_user = Users(
        name=user.name, email=user.email, password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh()

    access_token = create_access_token(new_user.id, new_user.email)
    refresh_token, hashed_refresh_token = create_refresh_token()

    refresh_token_record = RefreshToken(
        refresh_token=hashed_refresh_token,
        user_id=new_user.id,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRY_TIME),
        revoked_at=datetime.utcnow(),
    )

    db.add(refresh_token_record)
    db.commit()
    db.refresh(refresh_token_record)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="none" if IS_PRODUCTION else "lax",
        max_age=60 * ACCESS_TOKEN_EXPIRY_TIME,
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="none" if IS_PRODUCTION else "lax",
        max_age=60 * 60 * 24 * REFRESH_TOKEN_EXPIRY_TIME,
    )

    otp = generate_otp()
    REDIS_CLIENT.set(f"RESUME_PARSER_OTP_{user.email}", otp)
    backgroundtasks.add(send_email, user.email, otp)

    # return RedirectResponse(url=f"{FRONTEND_URL}/{user.email}/{otp}")

    return {"message": f"{user.name} Regsitered Successfully"}


@router.post("/login")
async def login(
    request: Request,
    response: Response,
    user: LoginSchema,
    db: Session = Depends(get_db),
):
    db_user = db.query(Users).filter(Users.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Credentials Given",
        )
