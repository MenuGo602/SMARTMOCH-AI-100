from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_telegram_user
from app.core.database import get_db
from app.core.models import Exam, Submission, User
from app.submissions.schemas import SubmissionCreate, SubmissionPatch, SubmissionResponse

router = APIRouter(prefix="/submissions", tags=["submissions"])


def _to_response(sub: Submission) -> SubmissionResponse:
    return SubmissionResponse(
        id=sub.id,
        examId=sub.exam_id,
        userId=sub.student.telegram_id,
        answers=sub.answers,
        score=sub.score,
        feedback=sub.feedback,
        status=sub.status,
    )


@router.get("", response_model=list[SubmissionResponse])
async def list_submissions(
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    if user.role == "teacher":
        # O'qituvchi o'z imtihonlariga tushgan barcha submission'larni ko'radi.
        exam_ids = [e.id for e in db.query(Exam).filter(Exam.teacher_id == user.id).all()]
        subs = db.query(Submission).filter(Submission.exam_id.in_(exam_ids)).all()
    else:
        subs = db.query(Submission).filter(Submission.student_id == user.id).all()
    return [_to_response(s) for s in subs]


@router.post("", response_model=SubmissionResponse)
async def create_submission(
    payload: SubmissionCreate,
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    exam = db.query(Exam).filter(Exam.id == payload.examId).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Imtihon topilmadi.")

    sub = Submission(
        exam_id=payload.examId,
        student_id=user.id,
        answers=payload.answers,
        status="submitted",
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return _to_response(sub)


@router.patch("/{submission_id}", response_model=SubmissionResponse)
async def update_submission(
    submission_id: int,
    payload: SubmissionPatch,
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission topilmadi.")

    if payload.score is not None:
        sub.score = payload.score
    if payload.feedback is not None:
        sub.feedback = payload.feedback
    if payload.status is not None:
        sub.status = payload.status

    db.commit()
    db.refresh(sub)
    return _to_response(sub)
