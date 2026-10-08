from pydantic import EmailStr, field_validator, BaseModel
from models.model import Users
import re


class RegistrationSchema(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginSchema(BaseModel):
    email: EmailStr
    password: str
