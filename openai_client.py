import json
import os

from openai import AsyncOpenAI

# .env yoki Railway Variables ichida OPENAI_API_KEY o'rnatilgan bo'lishi shart.
_client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

# Railway/serverda narxni nazorat qilish uchun model nomini env orqali ham
# o'zgartirish mumkin (masalan arzonroq model bilan sinash uchun).
MODEL = os.environ.get("OPENAI_GRADING_MODEL", "gpt-4o-mini")


async def call_openai_json(system: str, user: str) -> dict:
    """OpenAI'ga so'rov yuboradi va JSON formatdagi javobni dict qilib qaytaradi.
    response_format=json_object orqali model FAQAT valid JSON qaytarishga
    majburlanadi — eski (Claude-only) versiyadagi qo'lda backtick tozalashdan
    ko'ra ishonchliroq."""
    resp = await _client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
    )
    raw = resp.choices[0].message.content
    return json.loads(raw)


WRITING_SYSTEM_TEMPLATE = """Sen TELC uslubidagi nemis tili imtihonini baholovchi sun'iy intellekt ekspertisan. Talabaning "{level}" darajasidagi yozma ishini bahola.
FAQAT quyidagi JSON formatda javob qaytar, boshqa hech qanday matn yozma:
{{"inhalt": <0-5>, "aufbau": <0-5>, "wortschatz": <0-5>, "grammatik": <0-5>, "errors": [{{"original":"...", "corrected":"...", "note":"qisqa izoh o'zbek tilida"}}], "feedback": "2-3 gapli umumiy fikr-mulohaza, o'zbek tilida"}}
errors massivida ko'pi bilan 5 ta eng muhim xatoni ko'rsat. Baholarni 0 dan 5 gacha butun yoki .5 qadam bilan ber."""

SPEAKING_SYSTEM_TEMPLATE = """Sen TELC uslubidagi nemis tili og'zaki imtihonini baholovchi sun'iy intellekt ekspertisan. Talabaning "{level}" darajasidagi nutqi matnga aylantirilgan holda senga beriladi.
FAQAT quyidagi JSON formatda javob qaytar, boshqa hech narsa yozma:
{{"aussprache": <0-5>, "fluessigkeit": <0-5>, "grammatik": <0-5>, "wortschatz": <0-5>, "feedback": "2-3 gapli umumiy fikr-mulohaza, o'zbek tilida"}}
Eslatma: senga faqat matn transkripti berilgan, ovoz emas — "aussprache" (talaffuz) bahosini so'z tanlovi va jumla qurilishidan kelib chiqib taxminiy ber, buni feedbackda eslatma qilib aytma, faqat baho ber. Baholarni 0 dan 5 gacha butun yoki .5 qadam bilan ber."""

EMPTY_ANSWER_PLACEHOLDER = "(bo'sh)"


async def grade_writing(prompt: str, answer: str, level: str) -> dict:
    system = WRITING_SYSTEM_TEMPLATE.format(level=level)
    answer_text = answer or EMPTY_ANSWER_PLACEHOLDER
    user = f"Topshiriq: {prompt}\n\nTalaba javobi:\n{answer_text}"
    return await call_openai_json(system, user)


SPEAKING_SYSTEM_TEMPLATE = """Sen TELC uslubidagi nemis tili og'zaki imtihonini baholovchi sun'iy intellekt ekspertisan. Talabaning "{level}" darajasidagi nutqi matnga aylantirilgan holda senga beriladi.
FAQAT quyidagi JSON formatda javob qaytar, boshqa hech narsa yozma:
{{"aussprache": <0-5>, "fluessigkeit": <0-5>, "grammatik": <0-5>, "wortschatz": <0-5>, "feedback": "2-3 gapli umumiy fikr-mulohaza, o'zbek tilida"}}
Eslatma: senga faqat matn transkripti berilgan, ovoz emas — "aussprache" (talaffuz) bahosini so'z tanlovi va jumla qurilishidan kelib chiqib taxminiy ber, buni feedbackda eslatma qilib aytma, faqat baho ber. Baholarni 0 dan 5 gacha butun yoki .5 qadam bilan ber."""


async def grade_speaking(prompt: str, transcript: str, level: str) -> dict:
    system = SPEAKING_SYSTEM_TEMPLATE.format(level=level)
    transcript_text = transcript or EMPTY_ANSWER_PLACEHOLDER
    user = f"Mavzu: {prompt}\n\nTalaba nutqi transkripti:\n{transcript_text}"
    return await call_openai_json(system, user)


EXAM_GENERATION_SYSTEM = """Sen TELC uslubidagi rasmiy nemis tili imtihonlarini tuzuvchi sun'iy intellekt ekspertisan.
"{level}" darajasi uchun to'liq mock imtihon mazmuni yarat. FAQAT quyidagi JSON formatda javob qaytar, boshqa hech qanday matn yozma.

JSON tuzilmasi:
{{
  "title": "Imtihon nomi (masalan: '{level} Mock Imtihon — <mavzu>')",
  "lesen": {{
    "passage": "Lesen Teil 2 uchun o'qish matni (nemis tilida, 150-250 so'z, {level} darajaga mos)",
    "teils": [
      {{ "type": "matching yoki mcq yoki truefalse (berilgan Teil turiga qarab)",
         "questions": [
           {{ "question": "savol matni (nemis tilida)", "options": ["variant1","variant2","variant3","variant4"], "correctIndex": 0 }}
         ],
         "matching": {{ "ads": [{{"title":"...","body":"..."}}], "situations": [{{"text":"...","correctAdIndex":0}}] }}
      }}
    ]
  }},
  "sprachbausteine": {{
    "teils": [
      {{ "type": "gapfill",
         "questions": [
           {{ "question": "Gap qoldirilgan jumla, gap o'rniga ___ belgisi bilan", "options": ["variant1","variant2","variant3"], "correctIndex": 0 }}
         ]
      }}
    ]
  }},
  "schreiben": {{ "prompt": "Schreiben topshirig'i matni (o'zbek yoki nemis tilida, {level} darajaga mos vaziyat)" }},
  "sprechen": {{ "teils": [ {{ "prompt": "Sprechen Teil uchun mavzu/savol matni" }} ] }}
}}

QOIDALAR:
- truefalse turidagi savollarda "options" maydonini chiqarma, faqat "correctIndex" 0 (richtig) yoki 1 (falsch) bo'lsin.
- matching turidagi Teil'larda "questions" massivini bo'sh qoldir, "matching" maydonini to'ldir: kamida 4 ta vaziyat va 6 ta e'lon, har bir vaziyatga mos e'lon indeksi (yoki -1 agar mos kelmasa).
- Har bir mcq/truefalse/gapfill Teil uchun aniq 5 ta savol yarat (matching uchun bu qoidaga amal qilma).
- Matnlar tabiiy, xatosiz, rasmiy TELC uslubiga mos bo'lsin.
- sprechen va lesen.teils, sprachbausteine.teils massivlarining uzunligi senga user xabarida ko'rsatilgan Teil sonlariga aniq mos kelishi shart.
"""


async def generate_exam_content(level: str, lesen_teil_types: list, sprachbausteine_teil_types: list, sprechen_count: int) -> dict:
    system = EXAM_GENERATION_SYSTEM.format(level=level)
    user = (
        f"Lesen bo'limida {len(lesen_teil_types)} ta Teil bor, turlari tartib bilan: {lesen_teil_types}.\n"
        f"Sprachbausteine bo'limida {len(sprachbausteine_teil_types)} ta Teil bor, turlari: {sprachbausteine_teil_types}.\n"
        f"Sprechen bo'limida {sprechen_count} ta Teil bor.\n"
        f"Shu sonlarga aniq mos JSON yarat."
    )
    return await call_openai_json(system, user)
