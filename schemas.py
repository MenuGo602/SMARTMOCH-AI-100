from typing import List, Optional
from pydantic import BaseModel, Field


class WritingGradeRequest(BaseModel):
    prompt: str
    answer: str
    level: str  # masalan: "A1", "A2", "B1", "B2"


class SpeakingGradeRequest(BaseModel):
    prompt: str
    transcript: str
    level: str


class ErrorItem(BaseModel):
    original: str
    corrected: str
    note: str


class WritingGradeResponse(BaseModel):
    inhalt: float = Field(ge=0, le=5)
    aufbau: float = Field(ge=0, le=5)
    wortschatz: float = Field(ge=0, le=5)
    grammatik: float = Field(ge=0, le=5)
    errors: List[ErrorItem] = []
    feedback: str


class SpeakingGradeResponse(BaseModel):
    aussprache: float = Field(ge=0, le=5)
    fluessigkeit: float = Field(ge=0, le=5)
    grammatik: float = Field(ge=0, le=5)
    wortschatz: float = Field(ge=0, le=5)
    feedback: str
