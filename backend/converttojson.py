from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import hashlib
import json
from pathlib import Path
import time
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv
import jwt
import logging

# LangChain imports
from langchain_community.document_loaders import TextLoader
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="Document Chat API",
    description="A FastAPI backend for document-based chat with authentication and personalized recommendations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-this-in-production')
JWT_ALGORITHM = 'HS256'

# Configuration
CONFIG = {
    "USER_DB_FILE": "data/user_credentials.json",
    "CHAT_HISTORY_FILE": "data/chat_history.json",
    "VERIFICATION_TOKENS_FILE": "data/verification_tokens.json",
    "PASSWORD_RESET_TOKENS_FILE": "data/password_reset_tokens.json",
    "CHAT_SESSIONS_FILE": "data/chat_sessions.json",
    "EMAIL_REGEX": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    "TOKEN_EXPIRY_HOURS": 24,
    "PASSWORD_RESET_EXPIRY_HOURS": 1,
    "SMTP_SERVER": os.getenv('SMTP_SERVER'),
    "SMTP_PORT": int(os.getenv('SMTP_PORT', 587)),
    "SMTP_USERNAME": os.getenv('SMTP_USERNAME'),
    "SMTP_PASSWORD": os.getenv('SMTP_PASSWORD'),
    "EMAIL_FROM": os.getenv('EMAIL_FROM', os.getenv('SMTP_USERNAME')),
    "APP_URL": os.getenv('APP_URL', 'http://localhost:3000'),
    "GROQ_API_KEY": os.getenv('GROQ_API_KEY'),
    "DATA_DIR": "data",
    "PRODUCTS_FILE": "data/products.json",
    "TEXT_FILE": "h.txt"
}

# Ensure data directory exists
Path(CONFIG["DATA_DIR"]).mkdir(exist_ok=True)

# Pydantic models
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

# Preferences model
class Preferences(BaseModel):
    size: str
    colors: List[str]
    categories: List[str]

# Global variables for chat components
embeddings = None
vectors = None
text_splitter = None
final_documents = None
product_code_map = {}  # Maps product codes to numeric IDs

class AuthSystem:
    @staticmethod
    def is_valid_email(email):
        return re.fullmatch(CONFIG["EMAIL_REGEX"], email)

    @staticmethod
    def generate_token():
        return str(uuid.uuid4())

    @staticmethod
    def send_email(to_email, subject, body):
        msg = MIMEMultipart()
        msg['From'] = CONFIG["EMAIL_FROM"]
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        try:
            with smtplib.SMTP(CONFIG["SMTP_SERVER"], CONFIG["SMTP_PORT"]) as server:
                server.starttls()
                server.login(CONFIG["SMTP_USERNAME"], CONFIG["SMTP_PASSWORD"])
                server.send_message(msg)
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    @staticmethod
    def load_db(filename):
        try:
            if not Path(filename).exists():
                return {}
            with open(filename, "r") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading {filename}: {str(e)}")
            return {}

    @staticmethod
    def save_db(filename, data):
        try:
            with open(filename, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving {filename}: {str(e)}")

    @staticmethod
    def hash_password(password):
        return hashlib.sha256(password.encode()).hexdigest()

    @classmethod
    def register_user(cls, username, email, password):
        users = cls.load_db(CONFIG["USER_DB_FILE"])
        tokens = cls.load_db(CONFIG["VERIFICATION_TOKENS_FILE"])

        if username in users:
            return False, "Username already exists"

        if any(user.get("email") == email for user in users.values()):
            return False, "Email already registered"

        if not cls.is_valid_email(email):
            return False, "Invalid email format"

        if len(password) < 8:
            return False, "Password must be at least 8 characters"

        users[username] = {
            "email": email,
            "password_hash": cls.hash_password(password),
            "created_at": datetime.now().isoformat(),
            "verified": True,
            "last_login": datetime.now().isoformat(),
            "preferences": None
        }
        cls.save_db(CONFIG["USER_DB_FILE"], users)
        return True, "Account created and verified (DEV MODE)"

    @classmethod
    def verify_token(cls, token):
        tokens = cls.load_db(CONFIG["VERIFICATION_TOKENS_FILE"])
        users = cls.load_db(CONFIG["USER_DB_FILE"])
        
        if token not in tokens:
            return False, "Invalid or expired token"
        
        token_data = tokens[token]
        if datetime.fromisoformat(token_data["expires_at"]) < datetime.now():
            return False, "Token has expired"
        
        username = token_data["username"]
        users[username] = {
            "email": token_data["email"],
            "password_hash": token_data["password_hash"],
            "created_at": token_data["created_at"],
            "verified": True,
            "last_login": datetime.now().isoformat(),
            "preferences": None
        }
        
        del tokens[token] 
        cls.save_db(CONFIG["USER_DB_FILE"], users)
        cls.save_db(CONFIG["VERIFICATION_TOKENS_FILE"], tokens)
        
        return True, "Email verified successfully! You can now log in."

    @classmethod
    def authenticate_user(cls, username, password):
        users = cls.load_db(CONFIG["USER_DB_FILE"])
        user = users.get(username)
        
        if not user:
            return False, "User not found"
        if not user.get("verified", False):
            return False, "Email not verified. Please check your inbox."
        if user["password_hash"] != cls.hash_password(password):
            return False, "Invalid password"
        
        # Update last login
        user["last_login"] = datetime.now().isoformat()
        cls.save_db(CONFIG["USER_DB_FILE"], users)
        
        return True, "Login successful"

    @classmethod
    def initiate_password_reset(cls, email):
        users = cls.load_db(CONFIG["USER_DB_FILE"])
        tokens = cls.load_db(CONFIG["PASSWORD_RESET_TOKENS_FILE"])
        
        user = next((u for u in users.values() if u.get("email") == email), None)
        if not user:
            return False, "Email not found"
        
        token = cls.generate_token()
        tokens[token] = {
            "email": email,
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(hours=CONFIG["PASSWORD_RESET_EXPIRY_HOURS"])).isoformat()
        }
        
        cls.save_db(CONFIG["PASSWORD_RESET_TOKENS_FILE"], tokens)
        
        reset_link = f"{CONFIG['APP_URL']}/?reset_token={token}"
        email_body = f"""Password Reset Request
        
To reset your password, click this link:
{reset_link}

This link will expire in {CONFIG['PASSWORD_RESET_EXPIRY_HOURS']} hours.

If you didn't request this, please ignore this email.
"""
        if cls.send_email(email, "Password Reset Request", email_body):
            return True, "Password reset email sent"
        return False, "Failed to send reset email"

    @classmethod
    def reset_password(cls, token, new_password):
        reset_tokens = cls.load_db(CONFIG["PASSWORD_RESET_TOKENS_FILE"])
        users = cls.load_db(CONFIG["USER_DB_FILE"])
        
        if token not in reset_tokens:
            return False, "Invalid or expired token"
        
        token_data = reset_tokens[token]
        if datetime.fromisoformat(token_data["expires_at"]) < datetime.now():
            return False, "Token has expired"
        
        email = token_data["email"]
        user = next((u for u in users.values() if u.get("email") == email), None)
        if not user:
            return False, "User not found"
        
        if len(new_password) < 8:
            return False, "Password must be at least 8 characters"
        
        user["password_hash"] = cls.hash_password(new_password)
        del reset_tokens[token]
        
        cls.save_db(CONFIG["USER_DB_FILE"], users)
        cls.save_db(CONFIG["PASSWORD_RESET_TOKENS_FILE"], reset_tokens)
        
        return True, "Password reset successfully"

def generate_chat_id():
    return f"chat_{uuid.uuid4().hex[:8]}"

def get_user_chat_ids(username):
    sessions = AuthSystem.load_db(CONFIG["CHAT_SESSIONS_FILE"])
    return sessions.get(username, [])

def save_user_chat_id(username, chat_id):
    sessions = AuthSystem.load_db(CONFIG["CHAT_SESSIONS_FILE"])
    if username not in sessions:
        sessions[username] = []
    if chat_id not in sessions[username]:
        sessions[username].append(chat_id)
    AuthSystem.save_db(CONFIG["CHAT_SESSIONS_FILE"], sessions)

def load_products_data():
    file_path = CONFIG["PRODUCTS_FILE"]
    default_products = [
        {
            "id": "prod_001",
            "name": "Sample Product",
            "description": "This is a sample product",
            "price": 9.99,
            "category": "Sample",
            "stock": 100,
            "imageUrl": "https://via.placeholder.com/300x300?text=Product+Image"
        }
    ]
    
    try:
        if not Path(file_path).exists():
            with open(file_path, 'w') as f:
                json.dump(default_products, f, indent=2)
            return default_products
            
        with open(file_path, 'r') as f:
            products = json.load(f)
            
        # Validate product images
        for product in products:
            if "imageUrl" not in product or not product["imageUrl"]:
                product["imageUrl"] = "https://via.placeholder.com/300x300?text=Product+Image"
                
        # Build product code map
        global product_code_map
        product_code_map = {}  # Reset to ensure no stale data
        for product in products:
            # Map both numeric ID and product_code to the same ID string
            if "id" in product:
                product_code_map[str(product["id"])] = str(product["id"])
            if "product_code" in product:
                product_code_map[product["product_code"]] = str(product["id"])
            # Add mapping for PID format
            if "product_code" in product and product["product_code"].startswith("PID"):
                numeric_part = product["product_code"][3:]
                product_code_map[numeric_part] = str(product["id"])
        
        return products
    except Exception as e:
        logger.error(f"Error loading products: {str(e)}")
        return default_products

def get_user_preferences(username: str) -> Optional[Preferences]:
    """Retrieve user preferences from database"""
    users = AuthSystem.load_db(CONFIG["USER_DB_FILE"])
    user = users.get(username)
    if not user:
        return None
    prefs = user.get("preferences")
    if not prefs:
        return None
    try:
        # Validate preferences structure
        return Preferences(
            size=prefs.get("size", "M"),
            colors=prefs.get("colors", []),
            categories=prefs.get("categories", [])
        )
    except Exception as e:
        logger.error(f"Error parsing preferences for {username}: {str(e)}")
        return None

class ChatSystem:
    @staticmethod
    def load_chat_history(chat_id):
        history = AuthSystem.load_db(CONFIG["CHAT_HISTORY_FILE"])
        return history.get(chat_id, [])

    @staticmethod
    def save_chat_history(chat_id, history):
        all_history = AuthSystem.load_db(CONFIG["CHAT_HISTORY_FILE"])
        all_history[chat_id] = history
        AuthSystem.save_db(CONFIG["CHAT_HISTORY_FILE"], all_history)

    @staticmethod
    def add_to_history(chat_id, prompt, response):
        history = ChatSystem.load_chat_history(chat_id)
        history.append({
            "prompt": prompt,
            "response": response
        })
        ChatSystem.save_chat_history(chat_id, history)

    @staticmethod
    def clear_history(chat_id):
        ChatSystem.save_chat_history(chat_id, [])

    @staticmethod
    def initialize_chat_components():
        global embeddings, vectors, text_splitter, final_documents
        
        if vectors is None:
            try:
                # Preload products to build mapping
                load_products_data()
                
                model_name = "sentence-transformers/all-MiniLM-L6-v2"
                embeddings = HuggingFaceEmbeddings(
                    model_name=model_name,
                    model_kwargs={'device': 'cpu'}
                )
                
                # Load from h.txt file
                txt_path = CONFIG["TEXT_FILE"]
                loader = TextLoader(txt_path)
                docs = loader.load()
                
                text_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000,
                    chunk_overlap=200
                )
                final_documents = text_splitter.split_documents(docs)
                
                # Create vector store from text content
                vectors = Chroma.from_documents(final_documents, embeddings)
                
                logger.info("Vector store initialized from h.txt")
            except Exception as e:
                logger.error(f"Error initializing chat components: {str(e)}")
                raise RuntimeError("Failed to initialize chat components") from e

    @staticmethod
    def get_response(prompt_input: str, chat_id: str, username: str): 
        try:
            ChatSystem.initialize_chat_components()

            llm = ChatGroq(
                groq_api_key=CONFIG["GROQ_API_KEY"],
                model_name="Llama3-8b-8192"
            )

            # Get user preferences
            preferences = get_user_preferences(username)
            prefs_text = ""
            if preferences:
                prefs_text = (
                    f"User Preferences:\n"
                    f"- Size: {preferences.size}\n"
                    f"- Colors: {', '.join(preferences.colors) or 'Any'}\n"
                    f"- Categories: {', '.join(preferences.categories) or 'All'}\n\n"
                )
            else:
                prefs_text = "User Preferences: None\n\n"

            # IMPROVED PROMPT WITH BETTER CONTEXT HANDLING
            prompt_template = """You are a helpful shopping assistant for Walmart. Follow these guidelines:
1. If the user greets you or asks non-product questions, respond politely and DO NOT return any product IDs
2. For product-related queries:
   - Recommend only products explicitly mentioned in the context
   - Prioritize products that match the user's preferences
   - If no matching products exist, clearly state that
3. When returning product IDs:
   - MUST use format: [PID123, PID456]
   - Only include products from context
   - For non-product responses, return: []
4. Maintain conversation context from recent history

{preferences}
Response format MUST BE EXACTLY:
Answer: [response text]
Product IDs: [comma-separated IDs or empty list]

Recent Conversation History:
{history}

Current Context:
{context}

Current Question: {input}"""
            prompt = ChatPromptTemplate.from_template(prompt_template)

            document_chain = create_stuff_documents_chain(llm, prompt)
            retriever = vectors.as_retriever(search_kwargs={"k": 5})
            retrieval_chain = create_retrieval_chain(retriever, document_chain)

            # Get recent history (last 3 exchanges)
            history = ChatSystem.load_chat_history(chat_id)
            recent_history = ""
            if history:
                # Take last 3 Q/A pairs (6 messages)
                for item in history[-6:]:
                    recent_history += f"User: {item['prompt']}\nAssistant: {item['response']}\n"

            start = time.time()
            response = retrieval_chain.invoke({
                "input": prompt_input,
                "history": recent_history.strip(),  # Pass history to the prompt
                "preferences": prefs_text  # Pass preferences to the prompt
            })
            response_time = time.time() - start

            # ROBUST RESPONSE PARSING
            answer_text = response['answer']
            product_ids = []
            
            # Parse using strict pattern matching
            id_pattern = r'Product IDs:\s*\[([^\]]*)\]'
            match = re.search(id_pattern, answer_text)
            
            if match:
                id_section = match.group(1)
                # Extract all PID values
                id_matches = re.findall(r'PID\d{3}', id_section)
                product_ids = list(set(id_matches))  # Remove duplicates
                
                # Remove product IDs section from answer
                answer_text = re.sub(id_pattern, '', answer_text).strip()
                # Clean up any trailing newlines
                answer_text = re.sub(r'\n+$', '', answer_text)
            else:
                # Fallback to entire response
                answer_text = answer_text.replace("Answer:", "").strip()

            # Validate extracted IDs
            valid_ids = []
            for pid in product_ids:
                if pid in product_code_map:
                    valid_ids.append(product_code_map[pid])
                else:
                    logger.warning(f"Unmapped product ID: {pid}")

            return {
                "answer": answer_text,
                "context": [{"page_content": doc.page_content} for doc in response["context"]],
                "product_ids": valid_ids,
                "response_time": response_time
            }
        except Exception as e:
            logger.error(f"Error getting response: {str(e)}")
            return {
                "answer": "I encountered an error processing your request. Please try again.",
                "context": [],
                "product_ids": [],
                "response_time": 0.0
            }

# JWT Token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return username
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# API Routes
@app.post("/api/register", response_model=MessageResponse)
async def register(user: UserRegister):
    success, message = AuthSystem.register_user(user.username, user.email, user.password)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return MessageResponse(message=message, success=True)

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
    success, message = AuthSystem.verify_token(token)
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
    users = AuthSystem.load_db(CONFIG["USER_DB_FILE"])
    user = users.get(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    prefs = user.get("preferences", {})
    return Preferences(
        size=prefs.get("size", "M"),
        colors=prefs.get("colors", []),
        categories=prefs.get("categories", [])
    )
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
    return {"message": "Document Chat API is running"}

# Run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)