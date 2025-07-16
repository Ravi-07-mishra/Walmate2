# chat.py

import json
import re
import time
import uuid
from pathlib import Path 
from typing import Any, Dict, List

from auth import AuthSystem, get_user_preferences
from config import CONFIG, logger
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings  

# Global variables for chat components
embeddings = None
vectors = None
text_splitter = None
final_documents = None
product_code_map = {}  # Maps product codes to numeric IDs


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


def extract_product_ids(context_docs):
    """Extract product IDs from context documents - FIXED VERSION"""
    product_ids = set()
    for doc in context_docs:
        content = doc.page_content
        # Robust pattern matching for product IDs
        patterns = [
            r'\bPID(\d{3})\b',  # PID followed by 3 digits
            r'\*Product ID\*:\s*(\w+)',
            r'\*Product Code\*:\s*(\w+)',
            r'\[PID(\d{3})\]',  # [PID123] format
            r'\b(\d{3})\s*[-.]'  # 123 - at start of line
        ]

        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for pid in matches:
                # Prepend "PID" if it's numeric only
                normalized_pid = f"PID{pid}" if pid.isdigit() else pid
                mapped_id = product_code_map.get(normalized_pid, normalized_pid)
                if mapped_id:
                    product_ids.add(mapped_id)

    return list(product_ids)


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

            # --- START: Changes here to load prompt from file ---
            prompt_file_path = CONFIG["PROMPT_TEMPLATE_FILE"]
            try:
                with open(prompt_file_path, 'r') as f:
                    template_content = f.read()
            except FileNotFoundError:
                logger.error(f"Prompt template file not found: {prompt_file_path}")
                # Fallback to a default or raise an error
                template_content = """You are a smart, friendly shopping assistant for WalMate.
Follow these rules strictly:
1. Only recommend products when explicitly asked or when appropriate to answer the question
2. When recommending products, include them at the end in format: [RECOMMENDED: PID123, PID456]
3. For greetings or general questions, don't recommend any products

{preferences}
<context>
{context}
</context>
Current Question: {input}"""


            prompt = ChatPromptTemplate.from_template(template_content)
            # --- END: Changes here ---

            document_chain = create_stuff_documents_chain(llm, prompt)
            retriever = vectors.as_retriever()
            retrieval_chain = create_retrieval_chain(retriever, document_chain)

            input_data = {
                "input": prompt_input,
                "context": "",
                "preferences": prefs_text
            }

            start = time.time()
            response = retrieval_chain.invoke(input_data)
            response_time = time.time() - start

            answer_text = response['answer']
            product_ids = []

            # Only extract product IDs if they're explicitly recommended
            recommendation_marker = "[RECOMMENDED:"
            if recommendation_marker in answer_text:
                try:
                    # Extract the recommended products section
                    start_idx = answer_text.index(recommendation_marker) + len(recommendation_marker)
                    end_idx = answer_text.index("]", start_idx)
                    recommended_ids = answer_text[start_idx:end_idx].strip()

                    # Remove the recommendation section from the answer
                    answer_text = answer_text[:answer_text.index(recommendation_marker)].strip()

                    # Process the product IDs
                    for pid in [x.strip() for x in recommended_ids.split(",")]:
                        if pid in product_code_map:
                            product_ids.append(product_code_map[pid])
                        else:
                            logger.warning(f"Unmapped product ID: {pid}")
                except Exception as e:
                    logger.error(f"Error parsing recommended products: {str(e)}")

            # Clean up the response text
            answer_text = answer_text.replace("Answer:", "").strip()

            if not answer_text.strip():
                answer_text = "I couldn't find information about that. Could you try asking in a different way?"

            return {
                "answer": answer_text,
                "context": [{"page_content": doc.page_content} for doc in response["context"]],
                "product_ids": product_ids,
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
