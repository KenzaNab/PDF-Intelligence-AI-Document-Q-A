# PDF Intelligence — AI Document Q&A

Upload any PDF and ask questions about it. Powered by OpenAI GPT-4o-mini with RAG (Retrieval Augmented Generation).

> Python · FastAPI · PyMuPDF · OpenAI · React · Docker

## Features
- PDF upload (max 20MB)
- Text extraction with PyMuPDF
- Smart chunking + relevant context retrieval
- AI-powered Q&A (works in demo mode without API key)
- Multiple documents, chat per document
- Drag & drop upload

## Quick start
```bash
cd backend
pip install -r requirements.txt
echo "OPENAI_API_KEY=your_key" > .env
uvicorn app.main:app --reload --port 8000

cd frontend
npm install && npm start
```

