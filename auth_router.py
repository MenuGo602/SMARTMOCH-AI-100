from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_telegram_user
from app.auth.schemas import ChooseRoleRequest, MeResponse, SaveProfileRequest
from app.core.database import get_db
from app.core.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=MeResponse)
async def get_me(user: User = Depends(get_current_telegram_user)):
    return MeResponse(userId=user.telegram_id, role=user.role, name=user.name)


@router.post("/role", response_model=MeResponse)
async def choose_role(
    payload: ChooseRoleRequest,
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return MeResponse(userId=user.telegram_id, role=user.role, name=user.name)


@router.post("/profile", response_model=MeResponse)
async def save_profile(
    payload: SaveProfileRequest,
    user: User = Depends(get_current_telegram_user),
    db: Session = Depends(get_db),
):
    user.name = payload.name
    db.commit()
    db.refresh(user)
    return MeResponse(userId=user.telegram_id, role=user.role, name=user.name)
