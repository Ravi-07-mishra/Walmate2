import logging
import os
import re
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    "TEXT_FILE": "h.txt",
    "PROMPT_TEMPLATE_FILE": "data/prompt_template.txt"

}

# Ensure data directory exists
Path(CONFIG["DATA_DIR"]).mkdir(exist_ok=True)

# Security
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-this-in-production')
JWT_ALGORITHM = 'HS256'
