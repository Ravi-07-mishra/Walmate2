# WalMate: Smart Shopping Assistant

WalMate is a modern e-commerce platform with an AI-powered shopping assistant, designed for efficient and personalized shopping.

## Tech Stack

### Frontend
* **Framework**: Next.js
* **Language**: TypeScript
* **UI Components**: Shadcn UI (Radix UI)
* **Styling**: Tailwind CSS
* **State Management**: React Context API

### Backend
* **Framework**: FastAPI (Python)
* **Authentication**: Custom JWT-based system
* **Data Storage**: JSON files
* **RAG Components**: Langchain, HuggingFaceEmbeddings, ChromaDB, ChatGroq (Llama3-8b-8192)

## RAG Chatbot Implementation

The AI shopping assistant leverages a Retrieval-Augmented Generation (RAG) pipeline:

1.  **Data Processing**: Product and textual data are loaded from `h.txt`, split into chunks, and converted into vector embeddings using `HuggingFaceEmbeddings`.
2.  **Vector Store**: These embeddings are stored in `ChromaDB` for efficient retrieval.
3.  **Contextual Retrieval**: When a user queries, relevant document chunks are retrieved from `ChromaDB`, augmented with user preferences and chat history.
4.  **Response Generation**: A `ChatGroq` (Llama3-8b-8192) LLM generates a response based on the combined context and query.
5.  **Structured Output**: Product IDs are strictly extracted and appended to the response in a defined format (e.g., `[RECOMMENDED: PID123, PID456]`) to ensure seamless integration with the frontend's product display.
