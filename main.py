import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.auth.router import router as auth_router
from app.bot.router import router as bot_router, set_webhook
from app.core.database import Base, engine
from app.exams.router import router as exams_router
from app.grading.router import router as grading_router
from app.payments.router import router as payments_router
from app.submissions.router import router as submissions_router
from app.uploads.router import router as uploads_router, UPLOAD_DIR

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Mockify Backend")

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    Base.metadata.create_all(bind=engine)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    # Webhook'ni o'rnatamiz — Railway'da PUBLIC_URL o'zgaruvchisi bo'lishi kerak
    # yoki backend domenini BACKEND_URL sifatida qo'yish kerak.
    backend_url = os.environ.get("BACKEND_URL", "").rstrip("/")
    if backend_url:
        await set_webhook(backend_url)
    else:
        logger.warning("BACKEND_URL yo'q — webhook o'rnatilmadi. Railway Variables'ga qo'shing.")


app.include_router(auth_router, prefix="/api/v1")
app.include_router(exams_router, prefix="/api/v1")
app.include_router(submissions_router, prefix="/api/v1")
app.include_router(grading_router, prefix="/api/v1")
app.include_router(uploads_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(bot_router, prefix="/api/v1")

os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")


@app.get("/")
async def health():
    return {"status": "ok", "app": "Mockify"}


@app.get("/admin", response_class=HTMLResponse)
async def admin_page():
    html_path = os.path.join(os.path.dirname(__file__), "admin", "admin_page.html")
    with open(html_path, encoding="utf-8") as f:
        return f.read()
