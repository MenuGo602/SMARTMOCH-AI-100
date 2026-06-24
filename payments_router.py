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

EXAM_QUOTA_PER_PAYMENT = 5  # Har bir to'lovda berilادigan imtihon soni


@router.post("/payments/request-teacher")
async def request_teacher(
    receipt: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    """Foydalanuvchi chek rasmini yuklaydi va 'To'lov qildim' ni bosadi."""
    receipt_url = None

    if receipt and receipt.filename:
        ext = os.path.splitext(receipt.filename or "")[1].lower() or ".jpg"
        allowed = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
        if ext not in allowed:
            raise HTTPException(status_code=400, detail=f"Faqat rasm fayllari qabul qilinadi. Kelgan kengaytma: {ext}")
        contents = await receipt.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Rasm 10 MB dan kichik bo'lishi kerak.")
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        filename = f"receipt_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(contents)
        receipt_url = f"/files/{filename}"

    # Avvalgi pending so'rov bo'lsa, chekni yangilaymiz
    existing = db.query(TeacherRequest).filter(
        TeacherRequest.user_id == user.id, TeacherRequest.status == "pending"
    ).first()
    if existing:
        if receipt_url:
            existing.receipt_url = receipt_url
            db.commit()
        return {"status": "pending"}

    req = TeacherRequest(user_id=user.id, status="pending", receipt_url=receipt_url)
    db.add(req)
    db.commit()
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
