from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import documents, health

app = FastAPI(title="PDF Intelligence API", version="1.0.0",
              description="Upload PDFs and ask questions using AI")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"],
                   allow_methods=["*"], allow_headers=["*"])

app.include_router(health.router)
app.include_router(documents.router, prefix="/api/documents")
