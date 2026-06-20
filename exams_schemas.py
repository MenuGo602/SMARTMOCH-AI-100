from typing import Any, List, Optional

from pydantic import BaseModel


class ExamCreate(BaseModel):
    title: str
    level: Optional[str] = None
    questions: List[Any] = []


class ExamResponse(BaseModel):
    id: int
    title: str
    level: Optional[str] = None
    questions: List[Any] = []

    class Config:
        from_attributes = True
