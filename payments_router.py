import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.admin.dependencies import verify_admin_password
from app.auth.dependencies import get_current_telegram_user
from app.core.database import get_db
from app.core.models import TeacherRequest, User
from app.payments.schemas import TeacherRequestResponse
from app.uploads.router import UPLOAD_DIR

router = APIRouter(tags=["payments"])

EXAM_QUOTA_PER_PAYMENT = 5


@router.post("/payments/request-teacher")
async def request_teacher(
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    """Foydalanuvchi 'To'lov qildim' tugmasini bosadi.
    Bot foydalanuvchiga chek yuborishni so'raydi."""
    if user.role == "teacher" and (user.exam_quota or 0) > 0:
        raise HTTPException(status_code=400, detail="Sizda hali imtihon kvotasi bor.")

    existing = db.query(TeacherRequest).filter(
        TeacherRequest.user_id == user.id, TeacherRequest.status == "pending"
    ).first()

    if not existing:
        req = TeacherRequest(user_id=user.id, status="pending")
        db.add(req)
        db.commit()

    # Bot orqali foydalanuvchiga xabar yuboramiz
    try:
        from app.bot.router import bot
        if bot:
            await bot.send_message(
                chat_id=int(user.telegram_id),
                text=(
                    "💳 <b>To'lov chekini yuboring</b>\n\n"
                    "Kartaga <b>99 000 so'm</b> o'tkazganingizni tasdiqlash uchun "
                    "to'lov cheki rasmini (screenshot) <b>shu yerga</b> yuboring.\n\n"
                    "📸 Chekni yuborish uchun pastdagi 📎 tugmasini bosing."
                ),
                parse_mode="HTML",
            )
    except Exception:
        pass  # Bot ishlamasa ham so'rov yaratiladi

    return {"status": "pending"}


@router.get("/admin/teacher-requests", response_model=list[TeacherRequestResponse])
async def list_teacher_requests(
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_password),
):
    reqs = (db.query(TeacherRequest)
            .filter(TeacherRequest.status == "pending")
            .order_by(TeacherRequest.created_at)
            .all())
    return [
        TeacherRequestResponse(
            id=r.id,
            userId=r.user.telegram_id,
            userName=r.user.name,
            status=r.status,
            createdAt=r.created_at.isoformat(),
            receiptUrl=r.receipt_url,
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
    req.user.exam_quota = (req.user.exam_quota or 0) + EXAM_QUOTA_PER_PAYMENT
    db.commit()
    return {"status": "approved", "exam_quota": req.user.exam_quota}


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
