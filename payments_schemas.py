from typing import Optional

from pydantic import BaseModel


class TeacherRequestResponse(BaseModel):
    id: int
    userId: str
    userName: Optional[str] = None
    status: str
    createdAt: str

    class Config:
        from_attributes = True


class AdminLoginRequest(BaseModel):
    password: str
