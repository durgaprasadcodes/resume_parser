import json
from database import get_db
from tokens.get_user_info import get_user_info
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from models.model import Users, RefreshToken
from fastapi.responses import JSONResponse
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
    send_otp_email,
    generate_otp,
    REDIS_CLIENT,
    FRONTEND_URL,
    IS_PRODUCTION,
    OTP_EXPIRY_SECONDS,
)

from pydantic import BaseModel
from tokens.jwt_token import create_access_token, create_refresh_token


class RefreshTokenRequest(BaseModel):
    refresh_token: str | None = None


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    request: Request = None,
):
    is_secure = (
        IS_PRODUCTION
        or (request is not None and request.url.scheme == "https")
        or (
            request is not None
            and request.headers.get("x-forwarded-proto") == "https"
        )
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
        or (
            request is not None
            and request.headers.get("x-forwarded-proto") == "https"
        )
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


router = APIRouter(tags=["Hirelense.ai Authentication Setup"], prefix="/auth")


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

    otp_key = f"CURRENT_USER_DATA_{user.email}"
    REDIS_CLIENT.set(
        otp_key,
        json.dumps(user_data),
        ex=OTP_EXPIRY_SECONDS,
    )

    # Reset attempt counter on new OTP generation
    REDIS_CLIENT.delete(f"OTP_ATTEMPTS_{user.email}")

    backgroundtasks.add_task(send_otp_email, user.email, otp)

    print("========== REGISTER DEBUG ==========", flush=True)
    print("OTP KEY:", otp_key, flush=True)
    print("OTP EXISTS:", REDIS_CLIENT.exists(otp_key), flush=True)
    print("OTP TTL:", REDIS_CLIENT.ttl(otp_key), flush=True)
    print("====================================", flush=True)

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
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=REFRESH_TOKEN_EXPIRY_TIME),
        revoked=False,
        revoked_by_id=None
    )

    db.add(refresh_token_record)
    db.commit()
    db.refresh(refresh_token_record)

    set_auth_cookies(response, access_token, refresh_token, request)

    return {
        "message": "Login successful.",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "email": db_user.email,
        "user": {
            "id": str(db_user.id),
            "name": db_user.name,
            "email": db_user.email,
            "picture": db_user.picture,
            "is_verified": db_user.is_verified,
        },
    }


@router.post("/verify-otp")
async def verify_otp(
    request: Request,
    response: Response,
    data: OTPVerificationSchema,
    db: Session = Depends(get_db),
):
    email = data.email
    entered_otp = data.otp

    otp_key = f"RESUME_PARSER_OTP_{email}"
    user_data_key = f"CURRENT_USER_DATA_{email}"

    # 1. Check if OTP exists
    stored_otp = REDIS_CLIENT.get(otp_key)

    if stored_otp is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired or does not exist.",
        )

    # 3. Compare OTP
    if str(stored_otp) != str(entered_otp):
        REDIS_CLIENT.delete(otp_key)
        REDIS_CLIENT.delete(user_data_key)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP.",
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

    db.add(new_user)
    db.flush()

    access_token = create_access_token(new_user.id, new_user.email)
    refresh_token, hashed_refresh_token = create_refresh_token()

    refresh_token_record = RefreshToken(
        refresh_token=hashed_refresh_token,
        user_id=new_user.id,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRY_TIME),
    )

    db.add(refresh_token_record)

    db.commit()
    db.refresh(new_user)

    set_auth_cookies(response, access_token, refresh_token, request)

    return {
        "message": "Account created successfully.",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "email": new_user.email,
        "user": {
            "id": str(new_user.id),
            "name": new_user.name,
            "email": new_user.email,
            "picture": new_user.picture,
            "is_verified": new_user.is_verified,
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


@router.post("/refresh")
async def refresh_token_rotation(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    # 1. Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is missing.",
        )

    # 2. Hash the incoming token
    hashed_token = hash_refresh_token(refresh_token)

    # 3. Find the existing refresh-token record
    refresh_token_record = (
        db.query(RefreshToken)
        .filter(RefreshToken.refresh_token == hashed_token)
        .first()
    )

    if not refresh_token_record or refresh_token_record.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid or revoked.",
        )

    # 4. Check expiration safely
    now = datetime.now(timezone.utc) if refresh_token_record.expires_at.tzinfo else datetime.utcnow()
    if refresh_token_record.expires_at < now:
        refresh_token_record.revoked_at = datetime.utcnow()
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is expired.",
        )

    # 5. Get user
    user = (
        db.query(Users)
        .filter(Users.id == refresh_token_record.user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    # 6. Create new access token
    access_token = create_access_token(user.id, user.email)

    # 7. Rotate refresh token
    new_refresh_token, hashed_new_refresh_token = create_refresh_token()

    # 8. Revoke old refresh token
    refresh_token_record.revoked_at = datetime.utcnow()

    # 9. Create new refresh token record
    new_refresh_token_record = RefreshToken(
        refresh_token=hashed_new_refresh_token,
        user_id=user.id,
        expires_at=refresh_token_record.expires_at,
        revoked_by_id=refresh_token_record.id,
        created_at=datetime.utcnow()
    )

    db.add(new_refresh_token_record)
    db.commit()

    set_auth_cookies(response, access_token, new_refresh_token, request)

    return {
        "message": "Refresh token rotated successfully.",
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "picture": user.picture,
            "is_verified": user.is_verified,
        },
    }


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    payload: RefreshTokenRequest = None,
    db: Session = Depends(get_db),
):
    refresh_token = None
    if payload and payload.refresh_token:
        refresh_token = payload.refresh_token
    if not refresh_token:
        refresh_token = request.cookies.get("refresh_token")

    if refresh_token:
        hashed_token = hash_refresh_token(refresh_token)
        record = (
            db.query(RefreshToken)
            .filter(RefreshToken.refresh_token == hashed_token)
            .first()
        )
        if record and not record.revoked_at:
            record.revoked_at = datetime.utcnow()
            db.commit()

    clear_auth_cookies(response, request)
    return {"message": "Logout successful."}


@router.get("/test-brevo")
async def test_brevo():

    result = await send_otp_email(
        recipient_email="durgaprasad04289@gmail.com", otp="123456"
    )

    return {"message": "Email sent successfully", "brevo": result}
