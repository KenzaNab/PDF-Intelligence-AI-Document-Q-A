from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.services.document_service import (
    extract_text, store_document, answer_question,
    list_documents, get_document, delete_document
)
import fitz
import uuid

router = APIRouter()


class QuestionRequest(BaseModel):
    question: str


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported")
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 20MB)")
    try:
        doc = fitz.open(stream=content, filetype="pdf")
        page_count = len(doc)
        doc.close()
        text = extract_text(content, file.filename)
    except Exception as e:
        raise HTTPException(400, f"Could not parse PDF: {str(e)}")
    if not text.strip():
        raise HTTPException(400, "PDF appears to be image-only or empty")
    doc_id = str(uuid.uuid4())
    store_document(doc_id, file.filename, text, page_count)
    return {"id": doc_id, "filename": file.filename, "page_count": page_count, "char_count": len(text)}


@router.get("/")
def get_documents():
    return list_documents()


@router.get("/{doc_id}")
def get_document_info(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    return {"id": doc["id"], "filename": doc["filename"], "page_count": doc["page_count"], "char_count": doc["char_count"]}


@router.post("/{doc_id}/ask")
def ask_question(doc_id: str, req: QuestionRequest):
    if not req.question.strip():
        raise HTTPException(400, "Question cannot be empty")
    try:
        answer = answer_question(doc_id, req.question)
        return {"question": req.question, "answer": answer, "doc_id": doc_id}
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.delete("/{doc_id}")
def remove_document(doc_id: str):
    if not delete_document(doc_id):
        raise HTTPException(404, "Document not found")
    return {"message": "Deleted"}
