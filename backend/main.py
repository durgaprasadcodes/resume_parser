from fastapi import FastAPI, BackgroundTasks
from pydantic import EmailStr
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Hirelense.ai API",
    description="Resume Parser & Candidate Assessment Backend API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "Healthy", "message": "Hirelense.ai Backend Running Successfully"}
