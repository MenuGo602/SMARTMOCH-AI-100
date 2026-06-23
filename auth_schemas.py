from typing import Optional

from pydantic import BaseModel


class MeResponse(BaseModel):
    userId: str
    role: Optional[str] = None
    name: Optional[str] = None
    pendingTeacherRequest: bool = False
    examQuota: int = 0


class ChooseRoleRequest(BaseModel):
    role: str  # "teacher" | "student"


class SaveProfileRequest(BaseModel):
    name: str
