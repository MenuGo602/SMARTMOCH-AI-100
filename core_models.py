from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class TeacherRequest(Base):
    """O'qituvchi bo'lish uchun to'lov so'rovi."""
    __tablename__ = "teacher_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")  # pending | approved | rejected
    receipt_url = Column(String, nullable=True)  # to'lov cheki rasmi URL'i
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    user = relationship("User")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=True)  # "teacher" | "student" | None
    name = Column(String, nullable=True)
    exam_quota = Column(Integer, default=0)  # nechta imtihon yaratish huquqi qolgan
    created_at = Column(DateTime, default=datetime.utcnow)

    exams = relationship("Exam", back_populates="teacher", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="student", cascade="all, delete-orphan")


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    level = Column(String, nullable=True)
    questions = Column(JSON, nullable=False, default=list)  # savollar ro'yxati JSON sifatida
    invite_code = Column(String, unique=True, index=True, nullable=False)  # talaba kirish havolasi uchun noyob kod
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("User", back_populates="exams")
    submissions = relationship("Submission", back_populates="exam", cascade="all, delete-orphan")


class ExamAccess(Base):
    """Talaba imtihon havolasi orqali 'qo'shilgandan' keyin shu yerda yozuv paydo bo'ladi.
    Talaba faqat shu jadvalda yozuvi bor imtihonlarni ko'radi (umumiy ro'yxat emas)."""
    __tablename__ = "exam_access"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    answers = Column(JSON, nullable=True)
    score = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    status = Column(String, default="submitted")  # submitted | reviewed
    created_at = Column(DateTime, default=datetime.utcnow)

    exam = relationship("Exam", back_populates="submissions")
    student = relationship("User", back_populates="submissions")
