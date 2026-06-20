from typing import Any, Optional

from pydantic import BaseModel


class SubmissionCreate(BaseModel):
    examId: int
    answers: Any = None


class SubmissionPatch(BaseModel):
    score: Optional[int] = None
    feedback: Optional[str] = None
    status: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: int
    examId: int
    userId: str
    answers: Any = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    status: str

    class Config:
        from_attributes = True
