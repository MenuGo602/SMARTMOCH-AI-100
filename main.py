import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.grading.router import router as grading_router

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

app.include_router(grading_router, prefix="/api/v1")


@app.get("/")
async def health():
    return {"status": "ok"}
