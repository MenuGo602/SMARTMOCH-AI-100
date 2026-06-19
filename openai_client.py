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


async def grade_speaking(prompt: str, transcript: str, level: str) -> dict:
    system = SPEAKING_SYSTEM_TEMPLATE.format(level=level)
    transcript_text = transcript or EMPTY_ANSWER_PLACEHOLDER
    user = f"Mavzu: {prompt}\n\nTalaba nutqi transkripti:\n{transcript_text}"
    return await call_openai_json(system, user)
