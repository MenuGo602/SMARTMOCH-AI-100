import os

from fastapi import Header, HTTPException

# Railway Variables ichida ADMIN_PASSWORD o'rnatilishi shart.
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")


def verify_admin_password(x_admin_password: str = Header(default="")):
    """Admin panel so'rovlari shu header orqali tasdiqlanadi: X-Admin-Password.
    Oddiy, lekin Railway Variables'da saqlanadigan parol bilan himoyalangan."""
    if not ADMIN_PASSWORD:
        raise HTTPException(status_code=500, detail="Server ADMIN_PASSWORD sozlanmagan.")
    if not x_admin_password or x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Noto'g'ri admin parol.")
    return True
