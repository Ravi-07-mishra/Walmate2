import hashlib
import json
import smtplib
import uuid
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any, Dict, List, Optional

import jwt
from config import CONFIG, JWT_ALGORITHM, JWT_SECRET, logger
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from models import Preferences

security = HTTPBearer()


class AuthSystem:
    @staticmethod
    def is_valid_email(email):
        return re.fullmatch(CONFIG["EMAIL_REGEX"], email)

    @staticmethod
    def generate_token():
        return str(uuid.uuid4())

    @staticmethod
    def send_email(to_email, subject, body):
        msg = MIMIMultipart()
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
    def verify_token_auth(cls, token):
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
