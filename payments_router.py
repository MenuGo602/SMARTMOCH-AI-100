from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.admin.dependencies import verify_admin_password
from app.auth.dependencies import get_current_telegram_user
from app.core.database import get_db
from app.core.models import TeacherRequest, User
from app.payments.schemas import TeacherRequestResponse

router = APIRouter(tags=["payments"])


@router.post("/payments/request-teacher")
async def request_teacher(
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    """Foydalanuvchi 'To'lov qildim' tugmasini bosganda chaqiriladi.
    Bir vaqtning o'zida faqat bitta 'pending' so'rov bo'lishi mumkin."""
    if user.role == "teacher":
        raise HTTPException(status_code=400, detail="Siz allaqachon o'qituvchisiz.")

    existing = db.query(TeacherRequest).filter(
        TeacherRequest.user_id == user.id, TeacherRequest.status == "pending"
    ).first()
    if existing:
        return {"status": "pending"}

    req = TeacherRequest(user_id=user.id, status="pending")
    db.add(req)
    db.commit()
    return {"status": "pending"}


@router.get("/admin/teacher-requests", response_model=list[TeacherRequestResponse])
async def list_teacher_requests(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_password),
):
    reqs = db.query(TeacherRequest).filter(TeacherRequest.status == "pending").order_by(TeacherRequest.created_at).all()
    return [
        TeacherRequestResponse(
            id=r.id, userId=r.user.telegram_id, userName=r.user.name,
            status=r.status, createdAt=r.created_at.isoformat(),
        )
        for r in reqs
    ]


@router.post("/admin/teacher-requests/{request_id}/approve")
async def approve_teacher_request(
    request_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_password),
):
    req = db.query(TeacherRequest).filter(TeacherRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="So'rov topilmadi.")
    req.status = "approved"
    req.user.role = "teacher"
    db.commit()
    return {"status": "approved"}


@router.post("/admin/teacher-requests/{request_id}/reject")
async def reject_teacher_request(
    request_id: int,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_password),
):
    req = db.query(TeacherRequest).filter(TeacherRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="So'rov topilmadi.")
    req.status = "rejected"
    db.commit()
    return {"status": "rejected"}
