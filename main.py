import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.auth.router import router as auth_router
from app.core.database import Base, engine
from app.exams.router import router as exams_router
from app.grading.router import router as grading_router
from app.payments.router import router as payments_router
from app.submissions.router import router as submissions_router
from app.uploads.router import router as uploads_router, UPLOAD_DIR

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
    # Jadvallar mavjud bo'lmasa, avtomatik yaratadi.
    Base.metadata.create_all(bind=engine)
    # Yuklangan fayllar uchun papka mavjudligini ta'minlaydi (Volume ulangan bo'lsa shu yerga yoziladi).
    os.makedirs(UPLOAD_DIR, exist_ok=True)


app.include_router(auth_router, prefix="/api/v1")
app.include_router(exams_router, prefix="/api/v1")
app.include_router(submissions_router, prefix="/api/v1")
app.include_router(grading_router, prefix="/api/v1")
app.include_router(uploads_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")

# Papka StaticFiles mount qilinishidan OLDIN yaratilishi shart — startup event'i
# app.mount() chaqirilgandan keyin ishga tushadi, shuning uchun bu yerda darhol yaratamiz.
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Yuklangan audio fayllarga to'g'ridan-to'g'ri URL orqali kirish: /files/<filename>
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")


@app.get("/")
async def health():
    return {"status": "ok"}


@app.get("/admin", response_class=HTMLResponse)
async def admin_page():
    # Admin panel: backend domeningiz + /admin orqali ochiladi (masalan
    # https://sizning-backend.up.railway.app/admin). Parol bilan himoyalangan.
    html_path = os.path.join(os.path.dirname(__file__), "admin", "admin_page.html")
    with open(html_path, encoding="utf-8") as f:
        return f.read()
