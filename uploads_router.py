import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.auth.dependencies import get_current_telegram_user
from app.core.models import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

# Railway'da Volume shu papkaga ulanadi (Settings → Volumes → Mount Path: /data/uploads).
# Volume ulanmasa, fayllar konteyner qayta ishga tushganda yo'qoladi — shuni nazarda tuting.
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/data/uploads")

ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".m4a", ".wav", ".ogg", ".oga", ".aac", ".webm"}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


@router.post("/audio")
async def upload_audio(
    file: UploadFile = File(...),
    user: User = Depends(get_current_telegram_user),
):
    # Faqat o'qituvchilar audio yuklay oladi.
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Faqat o'qituvchilar uchun.")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Faqat audio fayllar qabul qilinadi (mp3, m4a, wav, ogg, aac, webm).")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Fayl hajmi 25 MB dan oshmasligi kerak.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    # Frontend shu URL'ni to'g'ridan-to'g'ri <audio> tegida ishlatadi.
    return {"url": f"/files/{filename}"}
