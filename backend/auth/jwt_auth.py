import json
from database import get_db
from tokens.get_user_info import get_user_info
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from models.model import Users, RefreshToken
from fastapi.responses import RedirectResponse
from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi import Depends, Request, HTTPException, status, Response
from schemas.schema import RegistrationSchema, LoginSchema, OTPVerificationSchema
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
    OTP_EXPIRY_SECONDS,
)

from tokens.jwt_token import create_access_token, create_refresh_token

router = APIRouter(tags=["Hirelense.ai Authentication Setup"], prefix="/auth")

MAX_OTP_ATTEMPTS = 5


@router.post("/register")
@limiter.limit("5/minute")
async def register(
    request: Request,
    user: RegistrationSchema,
    backgroundtasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    db_user = db.query(Users).filter(user.email == Users.email).first()

    if db_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="User already exists."
        )

    otp = generate_otp()
    REDIS_CLIENT.set(f"RESUME_PARSER_OTP_{user.email}", otp, ex=OTP_EXPIRY_SECONDS)

    user_data = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
    }

    REDIS_CLIENT.set(
        f"CURRENT_USER_DATA_{user.email}",
        json.dumps(user_data),
        ex=OTP_EXPIRY_SECONDS,
    )

    # Reset attempt counter on new OTP generation
    REDIS_CLIENT.delete(f"OTP_ATTEMPTS_{user.email}")

    backgroundtasks.add_task(send_email, user.email, otp)

    return {"message": "OTP sent successfully", "email": user.email}


@router.post("/login")
@limiter.limit("10/minute")
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
            detail="Email or password is incorrect",
        )

    if not db_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email is not verified",
        )

    access_token = create_access_token(db_user.id, db_user.email)

    refresh_token, hashed_refresh_token = create_refresh_token()

    refresh_token_record = RefreshToken(
        refresh_token=hashed_refresh_token,
        user_id=db_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRY_TIME),
    )

    db.add(refresh_token_record)
    db.commit()
    db.refresh(refresh_token_record)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        max_age=60 * ACCESS_TOKEN_EXPIRY_TIME,
        samesite="none" if IS_PRODUCTION else "lax",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=IS_PRODUCTION,
        max_age=60 * 60 * 24 * REFRESH_TOKEN_EXPIRY_TIME,
        samesite="none" if IS_PRODUCTION else "lax",
    )

    return {
        "message": "Login successful.",
        "email": db_user.email,
        "user": {
            "id": str(db_user.id),
            "name": db_user.name,
            "email": db_user.email,
        },
    }


@router.post("/verify-otp")
@limiter.limit("5/minute")
async def verify_otp(
    request: Request, response: Response, data: OTPVerificationSchema, db: Session = Depends(get_db)
):
    email = data.email
    entered_otp = data.otp

    otp_key = f"RESUME_PARSER_OTP_{email}"
    user_data_key = f"CURRENT_USER_DATA_{email}"
    attempts_key = f"OTP_ATTEMPTS_{email}"

    # 1. Check if OTP exists
    stored_otp = REDIS_CLIENT.get(otp_key)

    if stored_otp is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired or does not exist.",
        )

    # 2. Check attempt count — brute-force protection
    current_attempts = int(REDIS_CLIENT.get(attempts_key) or 0)
    if current_attempts >= MAX_OTP_ATTEMPTS:
        # Invalidate the OTP entirely after too many wrong attempts
        REDIS_CLIENT.delete(otp_key)
        REDIS_CLIENT.delete(user_data_key)
        REDIS_CLIENT.delete(attempts_key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. OTP has been invalidated. Please register again.",
        )

    # 3. Compare OTP
    if str(stored_otp) != str(entered_otp):
        REDIS_CLIENT.incr(attempts_key)
        REDIS_CLIENT.expire(attempts_key, OTP_EXPIRY_SECONDS)
        remaining = MAX_OTP_ATTEMPTS - current_attempts - 1
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP. {remaining} attempt(s) remaining.",
        )

    # 4. Get temporary registration data
    stored_user_data = REDIS_CLIENT.get(user_data_key)

    if stored_user_data is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration data expired. Please register again.",
        )

    try:
        user_data = json.loads(stored_user_data)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid registration data.",
        )

    # 5. Check database again
    existing_user = db.query(Users).filter(Users.email == email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists."
        )

    # 6. Create verified user
    new_user = Users(
        name=user_data["name"],
        email=user_data["email"],
        password=user_data["password"],
        is_verified=True,
    )

    # 7. Delete OTP, temporary registration data, and attempt counter
    REDIS_CLIENT.delete(user_data_key)
    REDIS_CLIENT.delete(otp_key)
    REDIS_CLIENT.delete(attempts_key)

    db.add(new_user)
    db.flush()

    access_token = create_access_token(new_user.id, new_user.email)
    refresh_token, hashed_refresh_token = create_refresh_token()

    refresh_token_record = RefreshToken(
        refresh_token=hashed_refresh_token,
        user_id=new_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRY_TIME),
    )

    db.add(refresh_token_record)

    db.commit()
    db.refresh(new_user)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        max_age=60 * ACCESS_TOKEN_EXPIRY_TIME,
        samesite="none" if IS_PRODUCTION else "lax",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=IS_PRODUCTION,
        max_age=60 * 60 * 24 * REFRESH_TOKEN_EXPIRY_TIME,
        samesite="none" if IS_PRODUCTION else "lax",
    )

    return {
        "message": "Account created successfully.",
        "email": new_user.email,
        "user": {
            "id": str(new_user.id),
            "name": new_user.name,
            "email": new_user.email,
        },
    }


@router.get("/me")
async def get_current_user(
    user: Users = Depends(get_user_info),
):
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "picture": user.picture,
        "is_verified": user.is_verified,
    }

