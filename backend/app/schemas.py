from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    email: EmailStr  # Automatic validate the format that is it email
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True  # SQLAlchemy models convert into pydantic jsons

# --- AUTH SCHEMAS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- CHAT SCHEMAS ---
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    id: int
    sender: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True