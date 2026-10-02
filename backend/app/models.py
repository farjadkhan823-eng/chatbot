from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"  # Table name is "user" in PostgreSQL

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship: single user can mutliple chats
    chats = relationship("ChatHistory", back_populates="owner")


class ChatHistory(Base):
    __tablename__ = "chat_history"  # Table name 

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Foreign Key Link
    sender = Column(String, nullable=False)  # 'user' or 'bot'
    message = Column(Text, nullable=False)   # Message text
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationship back link to User
    owner = relationship("User", back_populates="chats")