from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth_router
from app.routers import auth_router, chat_router

# Dynamic Auto-Creation: automatic creates tables 
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Topic-Specific Chatbot API")

# CORS setup --- communicate to frontend (react)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(chat_router.router)

@app.get("/")
def read_root():
    return {"message": "Chatbot Backend API Running Successfully!"}