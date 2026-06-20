from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_telegram_user
from app.core.database import get_db
from app.core.models import Exam, User
from app.exams.schemas import ExamCreate, ExamResponse

router = APIRouter(prefix="/exams", tags=["exams"])


@router.get("", response_model=list[ExamResponse])
async def list_exams(
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    # O'qituvchi o'z imtihonlarini, talaba esa barcha mavjud imtihonlarni ko'radi.
    if user.role == "teacher":
        return db.query(Exam).filter(Exam.teacher_id == user.id).all()
    return db.query(Exam).all()


@router.post("", response_model=ExamResponse)
async def create_exam(
    payload: ExamCreate,
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    exam = Exam(
        teacher_id=user.id,
        title=payload.title,
        level=payload.level,
        questions=payload.questions,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


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
