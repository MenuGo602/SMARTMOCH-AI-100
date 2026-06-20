import hashlib
import hmac
import json
import os
from urllib.parse import parse_qsl

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.models import User

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")


def _verify_init_data(init_data: str) -> dict:
    """Telegram initData'ni HMAC-SHA256 orqali tekshiradi va parslangan
    ma'lumotlarni qaytaradi. Telegram rasmiy hujjatlaridagi algoritm:
    https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
    """
    if not BOT_TOKEN:
        raise HTTPException(status_code=500, detail="Server TELEGRAM_BOT_TOKEN sozlanmagan.")
    if not init_data:
        raise HTTPException(status_code=401, detail="initData topilmadi.")

    parsed = dict(parse_qsl(init_data, strict_parsing=False))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=401, detail="initData imzosi topilmadi.")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise HTTPException(status_code=401, detail="initData imzosi noto'g'ri.")

    return parsed


def get_current_telegram_user(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
) -> User:
    """Header'dan `Authorization: tma <initData>` ni o'qiydi, tekshiradi,
    va shu Telegram foydalanuvchisiga mos User qatorini topadi/yaratadi."""
    if not authorization.startswith("tma "):
        raise HTTPException(status_code=401, detail="Authorization header noto'g'ri formatda.")

    init_data = authorization[len("tma "):]
    parsed = _verify_init_data(init_data)

    user_json = parsed.get("user")
    if not user_json:
        raise HTTPException(status_code=401, detail="initData ichida foydalanuvchi topilmadi.")

    tg_user = json.loads(user_json)
    telegram_id = str(tg_user["id"])

    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        user = User(telegram_id=telegram_id, role=None, name=None)
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
