from fastapi import APIRouter, Depends, HTTPException

from app.grading.openai_client import grade_speaking, grade_writing
from app.grading.schemas import (
    SpeakingGradeRequest,
    SpeakingGradeResponse,
    WritingGradeRequest,
    WritingGradeResponse,
)

# TODO: bu joyga sizning mavjud auth dependency'ingizni ulang
# (masalan: from app.auth import get_current_telegram_user)
# Bu Telegram initData'ni HMAC-SHA256 orqali tekshiradigan dependency bo'lishi kerak,
# shunda faqat tizimga kirgan foydalanuvchilar baholash so'rovini yubora oladi.

router = APIRouter(prefix="/grading", tags=["grading"])


@router.post("/writing", response_model=WritingGradeResponse)
async def grade_writing_endpoint(payload: WritingGradeRequest):
    try:
        result = await grade_writing(payload.prompt, payload.answer, payload.level)
        return WritingGradeResponse(**result)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="AI baholashda xatolik yuz berdi.") from exc


@router.post("/speaking", response_model=SpeakingGradeResponse)
async def grade_speaking_endpoint(payload: SpeakingGradeRequest):
    try:
        result = await grade_speaking(payload.prompt, payload.transcript, payload.level)
        return SpeakingGradeResponse(**result)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="AI baholashda xatolik yuz berdi.") from exc
