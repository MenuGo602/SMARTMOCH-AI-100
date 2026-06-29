"""
Telegram bot webhook handler — aiogram 3.x

Ikki xil to'lov usuli:
1. Karta orqali — foydalanuvchi chek yuboradi, admin tasdiqlaydi
2. Telegram Stars orqali — avtomatik, 100 Stars = 5 ta imtihon kvotasi
"""
import os
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup,
    LabeledPrice, Message, PreCheckoutQuery, Update,
)
from fastapi import APIRouter, Request
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.models import TeacherRequest, User

logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
ADMIN_CHAT_ID = int(os.environ.get("ADMIN_CHAT_ID", "7543974922"))
EXAM_QUOTA_PER_PAYMENT = 5
STARS_AMOUNT = 100  # Telegram Stars narxi

bot = Bot(token=BOT_TOKEN) if BOT_TOKEN else None
dp = Dispatcher()
router = APIRouter(tags=["bot"])


def get_db() -> Session:
    db = SessionLocal()
    try:
        return db
    except Exception:
        db.close()
        raise


# ── /start ────────────────────────────────────────────────────────────────
@dp.message(F.text.startswith("/start"))
async def start_command(message: Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text=f"⭐ {STARS_AMOUNT} Stars bilan to'lash",
            callback_data="pay_stars"
        ),
        InlineKeyboardButton(
            text="💳 Karta orqali to'lash",
            callback_data="pay_card"
        ),
    ]])
    await message.answer(
        "👋 Salom! <b>Mockify</b> botiga xush kelibsiz!\n\n"
        "O'qituvchi bo'lish uchun <b>5 ta imtihon kvotasi</b> sotib olishingiz mumkin:\n\n"
        f"⭐ <b>Telegram Stars</b>: {STARS_AMOUNT} Stars (tezkor, avtomatik)\n"
        "💳 <b>Karta orqali</b>: 99 000 so'm (1-2 soat)\n\n"
        "Qaysi usulni tanlaysiz?",
        parse_mode="HTML",
        reply_markup=keyboard,
    )


# ── Stars to'lovi — invoice yuborish ──────────────────────────────────────
@dp.callback_query(F.data == "pay_stars")
async def pay_stars_callback(call: CallbackQuery):
    await call.answer()
    await bot.send_invoice(
        chat_id=call.message.chat.id,
        title="Mockify — O'qituvchi kvotasi",
        description=f"5 ta imtihon yaratish huquqi. {STARS_AMOUNT} Telegram Stars.",
        payload="teacher_quota_5",
        currency="XTR",  # Telegram Stars uchun XTR
        prices=[LabeledPrice(label="5 ta imtihon kvotasi", amount=STARS_AMOUNT)],
        provider_token="",  # Stars uchun bo'sh bo'ladi
    )


# ── Stars to'lovi — pre-checkout (majburiy tasdiqlash) ────────────────────
@dp.pre_checkout_query()
async def pre_checkout_handler(pre_checkout: PreCheckoutQuery):
    """Telegram to'lovdan oldin shu handlerni chaqiradi — 10 soniya ichida javob kerak."""
    await pre_checkout.answer(ok=True)


# ── Stars to'lovi — muvaffaqiyatli to'lov ────────────────────────────────
@dp.message(F.successful_payment)
async def successful_payment_handler(message: Message):
    """Stars to'lovi muvaffaqiyatli bo'ldi — avtomatik kvota beramiz."""
    if not message.from_user:
        return

    tg_id = str(message.from_user.id)
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == tg_id).first()
        if not user:
            await message.answer(
                "Foydalanuvchi topilmadi. Iltimos, avval ilovani oching va ro'yxatdan o'ting."
            )
            return

        # Avtomatik o'qituvchi roli va kvota berish
        user.role = "teacher"
        user.exam_quota = (user.exam_quota or 0) + EXAM_QUOTA_PER_PAYMENT

        # Eski pending so'rovni bekor qilamiz (agar bo'lsa)
        pending = db.query(TeacherRequest).filter(
            TeacherRequest.user_id == user.id, TeacherRequest.status == "pending"
        ).first()
        if pending:
            pending.status = "approved"

        db.commit()

        stars = message.successful_payment.total_amount
        await message.answer(
            f"🎉 <b>To'lov muvaffaqiyatli!</b>\n\n"
            f"⭐ {stars} Stars qabul qilindi.\n"
            f"✅ Sizga <b>{EXAM_QUOTA_PER_PAYMENT} ta imtihon</b> yaratish huquqi berildi.\n\n"
            "📱 Ilovani qayta oching va o'qituvchi paneliga kiring!",
            parse_mode="HTML",
        )

        # Adminga xabar (ixtiyoriy)
        name = user.name or message.from_user.full_name or "Noma'lum"
        await bot.send_message(
            chat_id=ADMIN_CHAT_ID,
            text=(
                f"⭐ <b>Stars to'lovi keldi</b>\n\n"
                f"👤 {name} (<code>{tg_id}</code>)\n"
                f"💫 {stars} Stars\n"
                f"✅ Avtomatik tasdiqlandi (+{EXAM_QUOTA_PER_PAYMENT} kvota)"
            ),
            parse_mode="HTML",
        )
    finally:
        db.close()


# ── Karta to'lovi yo'riqnomasi ────────────────────────────────────────────
@dp.callback_query(F.data == "pay_card")
async def pay_card_callback(call: CallbackQuery):
    await call.answer()
    await call.message.answer(
        "💳 <b>Karta orqali to'lash</b>\n\n"
        "Quyidagi kartaga <b>99 000 so'm</b> o'tkazing:\n\n"
        "<code>9860 0266 3396 5079</code>\n\n"
        "To'lovdan so'ng chek rasmini (screenshot) <b>shu yerga</b> yuboring. "
        "Admin 1-2 soat ichida tekshiradi.",
        parse_mode="HTML",
    )


# ── Karta cheki — foydalanuvchi rasm yuboradi ────────────────────────────
@dp.message(F.photo)
async def handle_receipt_photo(message: Message):
    if not message.from_user:
        return

    tg_id = str(message.from_user.id)
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.telegram_id == tg_id).first()
        if not user:
            await message.answer(
                "Avval ilovani oching va ro'yxatdan o'ting, so'ng chekni yuboring."
            )
            return

        # Pending so'rovni topamiz yoki yangisini yaratamiz
        req = db.query(TeacherRequest).filter(
            TeacherRequest.user_id == user.id, TeacherRequest.status == "pending"
        ).first()

        file_id = message.photo[-1].file_id

        if req:
            req.receipt_url = f"tg://{file_id}"
        else:
            from app.core.models import TeacherRequest as TR
            req = TR(user_id=user.id, status="pending", receipt_url=f"tg://{file_id}")
            db.add(req)

        db.commit()

        # Adminga xabar + inline tugmalar
        name = user.name or message.from_user.full_name or "Ism yo'q"
        caption = (
            f"💳 <b>Yangi to'lov so'rovi (karta)</b>\n\n"
            f"👤 {name}\n"
            f"🆔 <code>{tg_id}</code>\n"
            f"📋 So'rov ID: <code>{req.id}</code>"
        )
        keyboard = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text=f"✅ Tasdiqlash (+{EXAM_QUOTA_PER_PAYMENT} kvota)",
                callback_data=f"approve:{req.id}"
            ),
            InlineKeyboardButton(
                text="❌ Rad etish",
                callback_data=f"reject:{req.id}"
            ),
        ]])

        await bot.send_photo(
            chat_id=ADMIN_CHAT_ID,
            photo=file_id,
            caption=caption,
            reply_markup=keyboard,
            parse_mode="HTML",
        )

        await message.answer(
            "✅ Chekingiz qabul qilindi!\n\n"
            "Admin 1-2 soat ichida tekshiradi. "
            "Tasdiqlangach, botdan xabar olasiz. 🎉",
        )
    finally:
        db.close()


# ── Admin: Tasdiqlash ──────────────────────────────────────────────────────
@dp.callback_query(F.data.startswith("approve:"))
async def approve_callback(call: CallbackQuery):
    req_id = int(call.data.split(":")[1])
    db: Session = SessionLocal()
    try:
        req = db.query(TeacherRequest).filter(TeacherRequest.id == req_id).first()
        if not req:
            await call.answer("So'rov topilmadi!", show_alert=True)
            return
        if req.status != "pending":
            await call.answer(f"Allaqachon: {req.status}", show_alert=True)
            return

        req.status = "approved"
        req.user.role = "teacher"
        req.user.exam_quota = (req.user.exam_quota or 0) + EXAM_QUOTA_PER_PAYMENT
        db.commit()

        await bot.send_message(
            chat_id=int(req.user.telegram_id),
            text=(
                "🎉 <b>Tabriklaymiz!</b>\n\n"
                "To'lovingiz tasdiqlandi. Siz endi <b>o'qituvchi</b> sifatida "
                f"<b>{EXAM_QUOTA_PER_PAYMENT} ta imtihon</b> yarata olasiz.\n\n"
                "📱 Ilovani qayta oching!"
            ),
            parse_mode="HTML",
        )

        await call.message.edit_caption(
            caption=(call.message.caption or "") +
                    f"\n\n✅ <b>Tasdiqlandi</b> (+{EXAM_QUOTA_PER_PAYMENT} kvota)",
            parse_mode="HTML",
        )
        await call.answer("Tasdiqlandi ✅")
    finally:
        db.close()


# ── Admin: Rad etish ──────────────────────────────────────────────────────
@dp.callback_query(F.data.startswith("reject:"))
async def reject_callback(call: CallbackQuery):
    req_id = int(call.data.split(":")[1])
    db: Session = SessionLocal()
    try:
        req = db.query(TeacherRequest).filter(TeacherRequest.id == req_id).first()
        if not req:
            await call.answer("So'rov topilmadi!", show_alert=True)
            return
        if req.status != "pending":
            await call.answer(f"Allaqachon: {req.status}", show_alert=True)
            return

        req.status = "rejected"
        db.commit()

        await bot.send_message(
            chat_id=int(req.user.telegram_id),
            text=(
                "❌ <b>To'lovingiz tasdiqlanmadi.</b>\n\n"
                "Sabab: chek noto'g'ri yoki summa mos kelmadi.\n"
                "Qayta urinib ko'ring yoki /start orqali Stars bilan to'lang."
            ),
            parse_mode="HTML",
        )

        await call.message.edit_caption(
            caption=(call.message.caption or "") + "\n\n❌ <b>Rad etildi</b>",
            parse_mode="HTML",
        )
        await call.answer("Rad etildi ❌")
    finally:
        db.close()


# ── Webhook endpoint ──────────────────────────────────────────────────────
@router.post("/bot/webhook")
async def telegram_webhook(request: Request):
    if not bot:
        return {"ok": False, "error": "BOT_TOKEN yo'q"}
    data = await request.json()
    update = Update(**data)
    await dp.feed_update(bot, update)
    return {"ok": True}


async def set_webhook(base_url: str):
    if not bot:
        logger.warning("BOT_TOKEN yo'q — bot ishlamaydi")
        return
    webhook_url = f"{base_url}/api/v1/bot/webhook"
    await bot.set_webhook(webhook_url)
    logger.info(f"Webhook o'rnatildi: {webhook_url}")
