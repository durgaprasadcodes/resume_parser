from pydantic import EmailStr, field_validator, BaseModel, Field
from typing import List, Optional, Literal
from models.model import Users
import re
from config import ats_score_description


class RegistrationSchema(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 100:
            raise ValueError("Name must be between 1 and 100 characters.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit.")
        return v


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class OTPVerificationSchema(BaseModel):
    email: EmailStr
    otp: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class ChangePasswordRequest(BaseModel):
    email: EmailStr
    password: str
    reset_token: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit.")
        return v


class ProjectDescription(BaseModel):
    name: str = Field(description="Name of the project")
    description: str = Field(
        description="Brief summary of the project, its technical implementation, and what was achieved"
    )
    project_value: str = Field(description=ats_score_description)
    score: int = Field(
        ge=0,
        le=100,
        description="Relevance and quality score for this individual project from 0 to 100",
    )


class Project(BaseModel):
    projects: ProjectDescription
    final_score: int = Field(
        ge=0,
        le=100,
        description="Overall project score from 0 to 100, considering all projects collectively",
    )


class SkillAnalysis(BaseModel):
    matched: List[str] = Field(description="Skills in both the JD and the resume")
    unmatched: List[str] = Field(
        description="Important JD skills missing from the resume"
    )
    final_score: int = Field(
        description="Give me the Final Evalutes score for Skills with mathed skills divided by total skills from resume out of 100"
    )


class Classification(BaseModel):
    positives: List[str] = Field(
        description="Specific strengths of the resume for this JD, per system rules"
    )
    negatives: List[str] = Field(
        description="Specific weaknesses and fixes for this JD, per system rules"
    )


class Certifications(BaseModel):
    certificates: List[str] = Field(
        description="Licenses, certifications or courses in the resume"
    )
    final_score: int = Field(
        description="Give me the Final Evalutes score for Certifications out of 100"
    )


class Improvement(BaseModel):
    priority: Literal["HIGH", "MEDIUM", "LOW"] = Field(
        description="Priority of this improvement based on how strongly it affects the candidate's alignment with the job description"
    )

    area: str = Field(
        description="Specific resume area or skill that needs improvement, such as Summary,Projects,Experince,Achiements,Certifications,font-selection or any other Suspicous things in resume"
    )

    problem: str = Field(
        description="Specific gap or weakness identified in the resume compared with the job description"
    )

    reason: str = Field(
        description="Explain why this gap matters for the target job description"
    )


class Resume(BaseModel):
    name: str = Field(description="Full name of the candidate")
    ats_score: int = Field(
        description="ATS score 0-100 using the system-prompt rubric", ge=0, le=100
    )
    profession: str = Field(description="Current professional title")
    summary: str = Field(description="Short resume summary")
    skills: SkillAnalysis
    projects: List[Project]
    experience: List[str] = Field(
        description="Work history with companies and roles. Never list colleges or schools."
    )
    certifications: Certifications
    resume_quality: Classification
    impreovements: list[Improvement] = Field(
        description="Prioritized and actionable improvements that would increase the resume's alignment with the job description"
    )
