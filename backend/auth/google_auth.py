import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, status, Depends, Response
from fastapi.responses import HTMLResponse
from database import get_db
from sqlalchemy.orm import Session
from config import (
    set_auth_cookies,
    FRONTEND_URL,
    REFRESH_TOKEN_EXPIRY_TIME,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URL,
)
from starlette.requests import Request
from models.model import Users, RefreshToken
from tokens.jwt_token import create_access_token, create_refresh_token
from authlib.integrations.starlette_client import OAuth
from authlib.integrations.base_client.errors import OAuthError

oauth = OAuth()

oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url=(
        "https://accounts.google.com/.well-known/openid-configuration"
    ),
    client_kwargs={"scope": "openid email profile"},
)

google_router = APIRouter(tags=["Google Authentication"], prefix="/google")


@google_router.get("/login")
async def google_login(request: Request):

    return await oauth.google.authorize_redirect(request, GOOGLE_REDIRECT_URL)


@google_router.get("/callback")
async def google_callback(
    request: Request, response: Response, db: Session = Depends(get_db)
):
    google_error = request.query_params.get("error")
    if google_error:
        error_desc = request.query_params.get(
            "error_description", "Google authentication was cancelled or access denied."
        )
        raise HTTPException(status_code=403,detail=error_desc)

    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as err:
        err_msg = err.description or err.error or "Google authentication failed."
        raise HTTPException(status_code=403,detail=err_msg)
    except Exception as err:
        raise HTTPException(
            status_code=403,detail=f"Google authentication failed: {str(err)}"
        )

    user_info = token.get("userinfo") if token else None

    if not user_info:
        raise HTTPException(status_code=403,detail="Unable to retrieve Google user information")

    if not user_info.get("email_verified"):
        raise HTTPException(status_code=403, detail="Google Email Is Not Verified")

    google_id = user_info.get("sub")
    email = user_info.get("email")
    name = user_info.get("name")
    picture = user_info.get("picture")

    # 4. Check Google ID
    google_user = db.query(Users).filter(Users.google_id == google_id).first()

    if google_user:

        google_user.name = name
        google_user.email = email
        google_user.google_id = google_id
        google_user.picture = picture
        google_user.is_verified = True

        db.commit()
        db.refresh(google_user)

        set_auth_cookies(response, google_user.email, google_user.id)

        return {"name":name,"email":email,"picture":picture}

    # 5. Check if email already exists
    email_user = db.query(Users).filter(Users.email == email).first()

    if email_user:

        email_user.picture = picture
        email_user.google_id = google_id
        email_user.is_verified = True

        db.commit()
        db.refresh(email_user)

        set_auth_cookies(response, email_user.email, email_user.id)

        return {"name":name,"email":email,"picture":picture}

    # 6. Create new user
    new_user_record = Users(
        name=name, email=email, google_id=google_id, picture=picture, is_verified=True
    )

    db.add(new_user_record)
    db.commit()
    db.refresh(new_user_record)

    # 7. Login newly created user
    set_auth_cookies(response, new_user_record.email, new_user_record.id)

    return {"name":name,"email":email,"picture":picture}
