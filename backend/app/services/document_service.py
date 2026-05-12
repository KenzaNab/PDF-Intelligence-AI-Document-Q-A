import fitz
import os
import openai
from typing import Dict, List

documents_store: Dict[str, dict] = {}


def extract_text(file_bytes: bytes, filename: str) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


def chunk_text(text: str, chunk_size: int = 3000, overlap: int = 200) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks


def find_relevant_chunks(query: str, chunks: List[str], top_k: int = 3) -> str:
    query_lower = query.lower()
    scored = []
    for chunk in chunks:
        score = sum(1 for word in query_lower.split() if word in chunk.lower())
        scored.append((score, chunk))
    scored.sort(key=lambda x: x[0], reverse=True)
    return "\n\n---\n\n".join(c for _, c in scored[:top_k])


def answer_question(doc_id: str, question: str) -> str:
    if doc_id not in documents_store:
        raise ValueError(f"Document {doc_id} not found")

    doc = documents_store[doc_id]
    context = find_relevant_chunks(question, doc["chunks"])

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return f"[Demo mode — no API key] Based on the document '{doc['filename']}', here is a simulated answer to: '{question}'. Set OPENAI_API_KEY for real AI responses."

    client = openai.OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that answers questions based on document content. Be precise and cite relevant parts."},
            {"role": "user", "content": f"Document context:\n{context}\n\nQuestion: {question}"}
        ],
        max_tokens=500,
    )
    return response.choices[0].message.content


def store_document(doc_id: str, filename: str, text: str, page_count: int):
    documents_store[doc_id] = {
        "id": doc_id,
        "filename": filename,
        "text": text,
        "chunks": chunk_text(text),
        "page_count": page_count,
        "char_count": len(text),
    }


def get_document(doc_id: str) -> dict | None:
    return documents_store.get(doc_id)


def list_documents() -> List[dict]:
    return [{"id": v["id"], "filename": v["filename"], "page_count": v["page_count"], "char_count": v["char_count"]}
            for v in documents_store.values()]


def delete_document(doc_id: str) -> bool:
    if doc_id in documents_store:
        del documents_store[doc_id]
        return True
    return False
