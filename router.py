from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_telegram_user
from app.core.models import User
from app.grading.openai_client import generate_exam_content, grade_speaking, grade_writing
from app.grading.schemas import (
    ExamGenerateRequest,
    SpeakingGradeRequest,
    SpeakingGradeResponse,
    WritingGradeRequest,
    WritingGradeResponse,
)

router = APIRouter(prefix="/grading", tags=["grading"])


@router.post("/writing", response_model=WritingGradeResponse)
async def grade_writing_endpoint(
    payload: WritingGradeRequest,
    user: User = Depends(get_current_telegram_user),
):
    try:
        result = await grade_writing(payload.prompt, payload.answer, payload.level)
        return WritingGradeResponse(**result)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="AI baholashda xatolik yuz berdi.") from exc


@router.post("/speaking", response_model=SpeakingGradeResponse)
async def grade_speaking_endpoint(
    payload: SpeakingGradeRequest,
    user: User = Depends(get_current_telegram_user),
):
    try:
        result = await grade_speaking(payload.prompt, payload.transcript, payload.level)
        return SpeakingGradeResponse(**result)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="AI baholashda xatolik yuz berdi.") from exc


@router.post("/generate-exam")
async def generate_exam_endpoint(
    payload: ExamGenerateRequest,
    user: User = Depends(get_current_telegram_user),
):
    # Faqat o'qituvchilar imtihon generatsiya qila oladi.
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="Faqat o'qituvchilar uchun.")
    try:
        result = await generate_exam_content(
            level=payload.level,
            lesen_teil_types=payload.lesenTeilTypes,
            sprachbausteine_teil_types=payload.sprachbausteineTeilTypes,
            sprechen_count=payload.sprechenCount,
        )
        return result
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="AI imtihon generatsiyasida xatolik yuz berdi.") from exc
