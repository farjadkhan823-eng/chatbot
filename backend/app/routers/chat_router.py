from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, ChatHistory
from app.schemas import ChatRequest, ChatResponse
from app.auth import get_current_user
from app.chatbot import generate_bot_response

router = APIRouter(prefix="/chat", tags=["Chatbot"])


# --- SEND MESSAGE & GET BOT RESPONSE ---
@router.post("/send", response_model=ChatResponse)
def send_chat_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. User ka message DB mein save karein
    user_chat = ChatHistory(
        user_id=current_user.id,
        sender="user",
        message=payload.message
    )
    db.add(user_chat)
    db.commit()

    # 2. User ki pichli conversation (last 10 messages) fetch karein context ke liye
    past_history = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.timestamp.asc())
        .all()
    )

    # 3. Gemini API se Guardrailed response lein
    bot_reply_text = generate_bot_response(
        user_message=payload.message,
        chat_history_list=past_history[:-1] # Current message chhor kar purana history
    )

    # 4. Bot ka response DB mein save karein
    bot_chat = ChatHistory(
        user_id=current_user.id,
        sender="bot",
        message=bot_reply_text
    )
    db.add(bot_chat)
    db.commit()
    db.refresh(bot_chat)

    return bot_chat


# --- GET FULL CHAT HISTORY FOR LOGGED IN USER ---
@router.get("/history", response_model=List[ChatResponse])
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.timestamp.asc())
        .all()
    )
    return history