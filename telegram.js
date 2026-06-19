// Telegram WebApp bilan ishlash uchun yordamchi funksiyalar.
// Bot ichida ochilganda window.Telegram.WebApp obyekti avtomatik mavjud bo'ladi.

export function getTelegram() {
  return window?.Telegram?.WebApp || null;
}

// Mini App'ni ishga tushirish: ready() + expand() chaqiradi.
export function initTelegram() {
  const tg = getTelegram();
  if (!tg) return null;
  try {
    tg.ready();
    tg.expand();
  } catch (e) {
    /* brauzerda (Telegram tashqarisida) test qilinayotgan bo'lishi mumkin */
  }
  return tg;
}

// Backendga yuboriladigan "initData" — bu Telegram tomonidan imzolangan satr,
// backend buni HMAC-SHA256 orqali tekshirib, foydalanuvchini autentifikatsiya qiladi.
// E'tibor bering: bu initDataUnsafe emas — xom, imzolangan string.
export function getInitData() {
  const tg = getTelegram();
  return tg?.initData || "";
}

// Tezkor UI uchun (ism, id ko'rsatish) — bu tekshirilmagan ma'lumot,
// xavfsizlik uchun emas, faqat boshlang'ich render uchun ishlatiladi.
// Haqiqiy autentifikatsiya har doim backend tomonida initData orqali bo'ladi.
export function getUnsafeTelegramUser() {
  const tg = getTelegram();
  return tg?.initDataUnsafe?.user || null;
}

export function showTelegramAlert(message) {
  const tg = getTelegram();
  if (tg?.showAlert) tg.showAlert(message);
  else window.alert(message);
}
