from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_telegram_user
from app.auth.schemas import ChooseRoleRequest, MeResponse, SaveProfileRequest
from app.core.database import get_db
from app.core.models import TeacherRequest, User

router = APIRouter(prefix="/auth", tags=["auth"])


def _has_pending_request(db: Session, user_id: int) -> bool:
    return db.query(TeacherRequest).filter(
        TeacherRequest.user_id == user_id, TeacherRequest.status == "pending"
    ).first() is not None


@router.get("/me", response_model=MeResponse)
async def get_me(user: User = Depends(get_current_telegram_user), db: Session = Depends(get_db)):
    return MeResponse(
        userId=user.telegram_id, role=user.role, name=user.name,
        pendingTeacherRequest=_has_pending_request(db, user.id),
    )


@router.post("/role", response_model=MeResponse)
async def choose_role(
    payload: ChooseRoleRequest,
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    # Talaba roli darhol beriladi — hech qanday tasdiqlash kerak emas.
    # O'qituvchi roli esa to'lov tasdiqlanmaguncha berilmaydi (/payments/request-teacher orqali so'raladi).
    if payload.role == "student":
        user.role = "student"
        db.commit()
        db.refresh(user)
    elif payload.role != "teacher":
        raise HTTPException(status_code=400, detail="Noto'g'ri rol.")

    return MeResponse(
        userId=user.telegram_id, role=user.role, name=user.name,
        pendingTeacherRequest=_has_pending_request(db, user.id),
    )


@router.post("/profile", response_model=MeResponse)
async def save_profile(
    payload: SaveProfileRequest,
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    user.name = payload.name
    db.commit()
    db.refresh(user)
    return MeResponse(
        userId=user.telegram_id, role=user.role, name=user.name,
        pendingTeacherRequest=_has_pending_request(db, user.id),
    )
