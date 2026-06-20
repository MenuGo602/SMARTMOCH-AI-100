import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.core.database import Base, engine
from app.exams.router import router as exams_router
from app.grading.router import router as grading_router
from app.submissions.router import router as submissions_router

app = FastAPI(title="SmartMock AI Backend")

# Railway/lokal devda frontend manzilini shu yerdan boshqaring.
# Production'da "*" o'rniga frontend domeningizni yozing (masalan https://smartmock.up.railway.app)
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Jadvallar mavjud bo'lmasa, avtomatik yaratadi (oddiy loyihalar uchun yetarli;
    # katta o'zgarishlar uchun keyinroq Alembic kabi migratsiya vositasiga o'tish tavsiya etiladi).
    Base.metadata.create_all(bind=engine)


app.include_router(auth_router, prefix="/api/v1")
app.include_router(exams_router, prefix="/api/v1")
app.include_router(submissions_router, prefix="/api/v1")
app.include_router(grading_router, prefix="/api/v1")


@app.get("/")
async def health():
    return {"status": "ok"}
