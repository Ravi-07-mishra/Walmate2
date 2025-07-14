from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class UserRegister(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class PasswordReset(BaseModel):
    email: str


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class ChatMessage(BaseModel):
    message: str
    chat_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    context: List[Dict[str, Any]]
    product_ids: List[str]
    response_time: float
    chat_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class MessageResponse(BaseModel):
    message: str
    success: bool


class ChatHistoryItem(BaseModel):
    prompt: str
    response: str


class ChatSession(BaseModel):
    chat_id: str
    history: List[ChatHistoryItem]


class Preferences(BaseModel):
    size: str
    colors: List[str]
    categories: List[str]
