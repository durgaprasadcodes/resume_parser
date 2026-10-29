from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from authlib.integrations.base_client.errors import OAuthError
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from starlette.requests import Request

from config import (
    FRONTEND_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URL,
    REFRESH_TOKEN_EXPIRY_TIME,
    set_auth_cookies,
)
from database import get_db
from models.model import RefreshToken, Users
from tokens.jwt_token import create_access_token, create_refresh_token

oauth = OAuth()

oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

google_router = APIRouter(tags=["Google Authentication"], prefix="/google")


def _frontend_redirect(
    error: str | None = None,
    access_token: str | None = None,
    user_name: str | None = None,
    user_email: str | None = None,
    user_picture: str | None = None,
) -> RedirectResponse:
    if not FRONTEND_URL:
        raise HTTPException(
            status_code=500, detail="Frontend URL is not configured for Google login."
        )

    frontend_url = FRONTEND_URL.rstrip("/")
    if error:
        url = f"{frontend_url}/login?{urlencode({'error': error})}"
    elif access_token:
        # Pass access_token and user info via URL hash fragment.
        # Hash fragments are never sent to the server, keeping the token client-side only.
        params = urlencode(
            {
                "name": user_name or "",
                "email": user_email or "",
                "picture": user_picture or "",
            }
        )
        url = f"{frontend_url}/#oauth-callback?{params}"
    else:
        url = f"{frontend_url}/"

    return RedirectResponse(url, status_code=303)


@google_router.get("/login")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(request, GOOGLE_REDIRECT_URL)


@google_router.get("/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    google_error = request.query_params.get("error")
    if google_error:
        error_desc = request.query_params.get(
            "error_description", "Google authentication was cancelled or access denied."
        )
        return _frontend_redirect(error_desc)

    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as err:
        return _frontend_redirect(
            err.description or err.error or "Google authentication failed."
        )

    user_info = token.get("userinfo") if token else None
    if not user_info:
        return _frontend_redirect("Unable to retrieve Google user information.")

    if not user_info.get("email_verified"):
        return _frontend_redirect("Your Google email address is not verified.")

    google_id = user_info.get("sub")
    email = user_info.get("email")
    if not google_id or not email:
        return _frontend_redirect(
            "Google did not provide the required account details."
        )

    # 1. Try to find user by Google ID
    user = db.query(Users).filter(Users.google_id == google_id).first()

    if user:
        # Existing Google account
        user.name = user_info.get("name") or user.name
        user.picture = user_info.get("picture") or user.picture
        user.is_verified = True

    else:
        # 2. Google ID not found → try email
        user = db.query(Users).filter(Users.email == email).first()

        if user:
            # Existing email account → link Google account
            user.google_id = google_id
            user.picture = user_info.get("picture") or user.picture
            user.is_verified = True

        else:
            # 3. Neither Google ID nor email exists → create new user
            user = Users(
                name=user_info.get("name") or email.split("@")[0],
                email=email,
                google_id=google_id,
                picture=user_info.get("picture"),
                is_verified=True,
            )

            db.add(user)

    db.flush()
    access_token = create_access_token(user.id, user.email)
    refresh_token, hashed_refresh_token = create_refresh_token()
    db.add(
        RefreshToken(
            refresh_token=hashed_refresh_token,
            user_id=user.id,
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=REFRESH_TOKEN_EXPIRY_TIME),
        )
    )
    db.commit()
    db.refresh(user)

    response = _frontend_redirect(
        access_token=access_token,
        user_name=user.name,
        user_email=user.email,
        user_picture=user.picture,
    )
    set_auth_cookies(response, access_token, refresh_token, request)
    return response
