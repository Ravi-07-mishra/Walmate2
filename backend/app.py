from typing import Any, Dict, List

from auth import (AuthSystem, create_access_token, get_user_preferences,
                  verify_token)
from chat import (ChatSystem, generate_chat_id, get_user_chat_ids,
                  load_products_data, save_user_chat_id)
from config import CONFIG, logger
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from models import (ChatHistoryItem, ChatMessage, ChatResponse,
                    MessageResponse, PasswordReset, PasswordResetConfirm,
                    Preferences, TokenResponse, UserLogin, UserRegister)

# FastAPI app initialization
app = FastAPI(
    title="Smart Shopping Assistant API",
    description="AI-powered shopping assistant with natural conversation capabilities",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Routes
@app.post("/api/register", response_model=MessageResponse)
async def register(user: UserRegister):
    success, message = AuthSystem.register_user(user.username, user.email, user.password)
    if not success:
        raise HTTPException(status_code=400, detail=message)

    # Generate access token for the new user
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}



@app.post("/api/login", response_model=TokenResponse)
async def login(user: UserLogin):
    success, message = AuthSystem.authenticate_user(user.username, user.password)
    if not success:
        raise HTTPException(status_code=401, detail=message)

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/forgot-password", response_model=MessageResponse)
async def forgot_password(request: PasswordReset):
    success, message = AuthSystem.initiate_password_reset(request.email)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return MessageResponse(message=message, success=True)


@app.post("/api/reset-password", response_model=MessageResponse)
async def reset_password(request: PasswordResetConfirm):
    success, message = AuthSystem.reset_password(request.token, request.new_password)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return MessageResponse(message=message, success=True)


@app.get("/api/verify-email/{token}", response_model=MessageResponse)
async def verify_email(token: str):
    success, message = AuthSystem.verify_token_auth(token)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return MessageResponse(message=message, success=True)


@app.post("/api/preferences", response_model=MessageResponse)
async def save_preferences(
    prefs: Preferences,
    username: str = Depends(verify_token)
):
    # Load users
    users = AuthSystem.load_db(CONFIG["USER_DB_FILE"])
    user = users.get(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Save preferences in user record
    user['preferences'] = prefs.dict()
    AuthSystem.save_db(CONFIG["USER_DB_FILE"], users)

    return MessageResponse(message="Preferences saved successfully", success=True)


@app.get("/api/preferences", response_model=Preferences)
async def get_preferences(username: str = Depends(verify_token)):
    prefs = get_user_preferences(username)
    if not prefs:
        return Preferences(size="M", colors=[], categories=[])
    return prefs


@app.post("/api/chat", response_model=ChatResponse)
async def chat(message: ChatMessage, username: str = Depends(verify_token)):
    chat_id = message.chat_id
    if not chat_id:
        chat_id = generate_chat_id()
        save_user_chat_id(username, chat_id)

    # Pass username to include preferences in response
    response = ChatSystem.get_response(message.message, chat_id, username)

    # Save to history
    ChatSystem.add_to_history(chat_id, message.message, response["answer"])

    return ChatResponse(
        answer=response["answer"],
        context=response["context"],
        product_ids=response["product_ids"],
        response_time=response["response_time"],
        chat_id=chat_id
    )


@app.get("/api/chat-sessions", response_model=List[str])
async def get_chat_sessions(username: str = Depends(verify_token)):
    return get_user_chat_ids(username)


@app.get("/api/chat-history/{chat_id}", response_model=List[ChatHistoryItem])
async def get_chat_history(chat_id: str, username: str = Depends(verify_token)):
    # Verify user has access to this chat
    user_chats = get_user_chat_ids(username)
    if chat_id not in user_chats:
        raise HTTPException(status_code=403, detail="Access denied")

    history = ChatSystem.load_chat_history(chat_id)
    return [ChatHistoryItem(prompt=item["prompt"], response=item["response"]) for item in history]


@app.post("/api/new-chat", response_model=dict)
async def new_chat(username: str = Depends(verify_token)):
    chat_id = generate_chat_id()
    save_user_chat_id(username, chat_id)
    return {"chat_id": chat_id}


@app.delete("/api/chat/{chat_id}", response_model=MessageResponse)
async def delete_chat(chat_id: str, username: str = Depends(verify_token)):
    # Verify user has access to this chat
    user_chats = get_user_chat_ids(username)
    if chat_id not in user_chats:
        raise HTTPException(status_code=403, detail="Access denied")

    ChatSystem.clear_history(chat_id)

    # Remove from user's chat list
    sessions = AuthSystem.load_db(CONFIG["CHAT_SESSIONS_FILE"])
    if username in sessions:
        sessions[username] = [cid for cid in sessions[username] if cid != chat_id]
        AuthSystem.save_db(CONFIG["CHAT_SESSIONS_FILE"], sessions)

    return MessageResponse(message="Chat deleted successfully", success=True)


@app.get("/api/user-info")
async def get_user_info(username: str = Depends(verify_token)):
    users = AuthSystem.load_db(CONFIG["USER_DB_FILE"])
    user = users.get(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "username": username,
        "email": user["email"],
        "created_at": user["created_at"],
        "last_login": user["last_login"],
        "preferences": user.get("preferences", {})
    }


# Product endpoints
@app.get("/api/products", response_model=List[Dict[str, Any]])
async def get_all_products():
    return load_products_data()


@app.get("/api/products/{product_id}", response_model=Dict[str, Any])
async def get_product_by_id(product_id: str):
    products = load_products_data()

    # Try exact match first
    for product in products:
        if str(product["id"]) == product_id or str(product.get("product_code", "")).lower() == product_id.lower():
            return product

    # Try partial matches if needed
    for product in products:
        if product_id.lower() in str(product.get("product_code", "")).lower():
            return product
        if product_id.lower() in product["name"].lower():
            return product

    raise HTTPException(status_code=404, detail=f"Product {product_id} not found")


@app.get("/")
async def root():
    return {"message": "Smart Shopping Assistant API is running"}


# Run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

