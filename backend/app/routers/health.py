from fastapi import APIRouter
router = APIRouter()
@router.get("/health")
def health(): return {"status": "ok", "app": "PDF Intelligence API"}
