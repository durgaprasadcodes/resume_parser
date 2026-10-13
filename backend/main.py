from fastapi import FastAPI, BackgroundTasks
from auth.jwt_auth import router
from auth.google_auth import google_router
from pydantic import EmailStr
from fastapi.middleware.cors import CORSMiddleware
from config import limiter, FRONTEND_URL, GOOGLE_SESSION_SECRET
from starlette.middleware.sessions import SessionMiddleware

app = FastAPI(
    title="Hirelense.ai API",
    description="Resume Parser & Candidate Assessment Backend API",
    version="1.0.0",
)

allowed_origins = [
    "http://localhost:5173",
    "https://hirelense-ai.vercel.app",
]
if FRONTEND_URL and FRONTEND_URL not in allowed_origins:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=GOOGLE_SESSION_SECRET)


@app.get("/")
async def root():
    return {"status": "Healthy", "message": "Hirelense.ai Backend Running Successfully"}


app.state.limiter = limiter

app.include_router(router)

app.include_router(google_router)
