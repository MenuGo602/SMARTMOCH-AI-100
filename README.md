# SmartMock AI — Railway'ga deploy qilish

Bu repo ikkita alohida xizmatdan iborat:

```
smartmock/
├── frontend/   ← React + Vite, Nginx orqali serve qilinadi
└── backend/    ← FastAPI, OpenAI orqali baholaydi
```

Railway'da **ikkita alohida Service** sifatida deploy qilinadi (bitta loyiha ichida).

---

## 1. GitHub'ga yuklash

Bu papkani (`smartmock/`) repo qilib GitHub'ga push qiling. Ikkala xizmat ham
shu bitta repodan, lekin har xil **Root Directory** bilan ishga tushadi.

## 2. Backend xizmatini yaratish

1. Railway loyihangizda **+ New → GitHub Repo** → shu repo'ni tanlang
2. Xizmat sozlamalarida **Root Directory** = `backend`
3. **Variables** bo'limiga qo'shing (`backend/.env.example`'ga qarang):
   - `OPENAI_API_KEY=sk-...`
   - `OPENAI_GRADING_MODEL=gpt-4o-mini` (ixtiyoriy)
   - `ALLOWED_ORIGINS=` — frontend deploy qilingach, uning URL'ini shu yerga yozasiz
4. Deploy qiling. Muvaffaqiyatli bo'lsa, `https://<backend-nomi>.up.railway.app/`
   ochilganda `{"status": "ok"}` ko'rinishi kerak.

## 3. Frontend xizmatini yaratish

1. Yana **+ New → GitHub Repo** → xuddi shu repo
2. **Root Directory** = `frontend`
3. **Variables** ga qo'shing:
   - `VITE_API_URL=https://<backend-nomi>.up.railway.app/api/v1`
   (bu build-vaqtida ARG sifatida ishlatiladi — Dockerfile'ga qarang)
4. Deploy qiling.

## 4. Backend'ning ALLOWED_ORIGINS'ini yangilang

Frontend domeni ma'lum bo'lgach, backend xizmatining `ALLOWED_ORIGINS`
o'zgaruvchisini frontend URL'iga o'zgartirib, qayta deploy qiling (aks holda
CORS xatosi chiqadi).

## 5. Muhim — hali bajarilmagan ishlar

- **Auth**: `backend/app/grading/router.py` ichidagi endpointlar hozircha
  **ochiq** (autentifikatsiyasiz). Production'ga chiqarishdan oldin Telegram
  `initData`'ni HMAC-SHA256 orqali tekshiradigan dependency qo'shing — aks
  holda har kim OpenAI hisobingizdan bepul foydalana oladi.
- **`/auth/me`, `/exams`, `/submissions` kabi endpointlar**: `frontend/src/api.js`
  bularni kutadi, lekin backend'da hali mavjud emas — faqat `/grading/writing`
  va `/grading/speaking` ishlaydi. Qolganlarini backend'ga qo'shish kerak.
- Telegram botini BotFather orqali sozlab, Mini App URL'ini frontend domeningizga
  ko'rsatishni unutmang.

## Lokal ishga tushirish

**Backend:**
```bash
cd backend
pip install -r requirements.txt
export OPENAI_API_KEY=sk-...
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
