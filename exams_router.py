import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_telegram_user
from app.core.database import get_db
from app.core.models import Exam, ExamAccess, User
from app.exams.schemas import ExamCreate, ExamResponse

router = APIRouter(prefix="/exams", tags=["exams"])


def _generate_invite_code(db: Session) -> str:
    # 8 ta belgidan iborat, taxmin qilish qiyin bo'lgan kod (URL-safe).
    while True:
        code = secrets.token_urlsafe(6)[:8]
        if not db.query(Exam).filter(Exam.invite_code == code).first():
            return code


@router.get("", response_model=list[ExamResponse])
async def list_exams(
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    # O'qituvchi faqat o'z imtihonlarini ko'radi.
    if user.role == "teacher":
        exams = db.query(Exam).filter(Exam.teacher_id == user.id).all()
    else:
        # Talaba faqat havola orqali "qo'shilgan" imtihonlarni ko'radi — umumiy ro'yxat emas.
        exam_ids = [a.exam_id for a in db.query(ExamAccess).filter(ExamAccess.student_id == user.id).all()]
        exams = db.query(Exam).filter(Exam.id.in_(exam_ids)).all()
    return [ExamResponse.from_orm_with_alias(e) for e in exams]


@router.post("", response_model=ExamResponse)
async def create_exam(
    payload: ExamCreate,
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    # Kvota tekshiruvi — o'qituvchi faqat to'lov tasdiqlanganda kvota oladi.
    if (user.exam_quota or 0) <= 0:
        raise HTTPException(
            status_code=403,
            detail="Imtihon yaratish kvotangiz tugagan. Yangi to'lov qilishingiz kerak."
        )
    exam = Exam(
        teacher_id=user.id,
        title=payload.title,
        level=payload.level,
        questions=payload.questions,
        invite_code=_generate_invite_code(db),
    )
    db.add(exam)
    user.exam_quota = (user.exam_quota or 0) - 1
    db.commit()
    db.refresh(exam)
    return ExamResponse.from_orm_with_alias(exam)


@router.post("/join/{invite_code}", response_model=ExamResponse)
async def join_exam(
    invite_code: str,
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    """Talaba Telegram havolasi (?start=invite_code) orqali kirganda chaqiriladi.
    Imtihonni topadi va shu talaba uchun kirish huquqini (ExamAccess) yaratadi."""
    exam = db.query(Exam).filter(Exam.invite_code == invite_code).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Bunday havola bilan imtihon topilmadi.")

    existing = db.query(ExamAccess).filter(
        ExamAccess.exam_id == exam.id, ExamAccess.student_id == user.id
    ).first()
    if not existing:
        db.add(ExamAccess(exam_id=exam.id, student_id=user.id))
        db.commit()

    return ExamResponse.from_orm_with_alias(exam)


@router.delete("/{exam_id}", status_code=204)
async def delete_exam(
    exam_id: int,
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.teacher_id == user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Imtihon topilmadi.")
    db.delete(exam)
    db.commit()
    return None
