"""Parse an uploaded PDF resume into plain text."""
from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from pypdf import PdfReader

router = APIRouter()


@router.post("/resume")
async def upload_resume(file: UploadFile = File(...)):
    name = (file.filename or "").lower()
    content = await file.read()
    if name.endswith(".pdf"):
        try:
            reader = PdfReader(BytesIO(content))
            text = "\n".join((p.extract_text() or "") for p in reader.pages)
        except Exception as e:
            raise HTTPException(400, f"could not read PDF: {e}")
    elif name.endswith((".txt", ".md")):
        text = content.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(400, "upload a PDF, .txt, or .md file")
    text = text.strip()
    if not text:
        raise HTTPException(400, "no extractable text found")
    return {"resume": text, "chars": len(text)}
