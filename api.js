import { getInitData } from "./telegram";

// Backend manzili build-vaqtida beriladi (Dockerfile'dagi VITE_API_URL ARG'ga qarang).
// Lokal devda .env faylga VITE_API_URL=http://localhost:8000/api/v1 deb yozing.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// TODO: quyidagi yo'llarni (endpoint path'larni) backenddagi haqiqiy
// router nomlariga moslang — hozircha mantiqiy taxmin bilan yozilgan.
const ENDPOINTS = {
  me: "/auth/me",
  role: "/auth/role",
  profile: "/auth/profile",
  exams: "/exams",
  submissions: "/submissions",
  gradeWriting: "/grading/writing",
  gradeSpeaking: "/grading/speaking",
};

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      // Telegram'ning tavsiya etilgan auth sxemasi: imzolangan initData
      // har bir so'rov bilan yuboriladi, backend uni HMAC-SHA256 orqali tekshiradi.
      Authorization: `tma ${getInitData()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(text || `So'rov muvaffaqiyatsiz: ${res.status}`, res.status);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // ---- Profil / rol ----
  // Backend initData'ni tekshiradi va foydalanuvchini topadi/yaratadi,
  // { role, name, userId } qaytaradi (role topilmasa null).
  getMe: () => request(ENDPOINTS.me),
  chooseRole: (role) => request(ENDPOINTS.role, { method: "POST", body: { role } }),
  saveDisplayName: (name) => request(ENDPOINTS.profile, { method: "POST", body: { name } }),

  // ---- Imtihonlar ----
  listExams: () => request(ENDPOINTS.exams),
  createExam: (exam) => request(ENDPOINTS.exams, { method: "POST", body: exam }),
  deleteExam: (id) => request(`${ENDPOINTS.exams}/${id}`, { method: "DELETE" }),

  // ---- Topshiriqlar (submission'lar) ----
  listSubmissions: () => request(ENDPOINTS.submissions),
  createSubmission: (sub) => request(ENDPOINTS.submissions, { method: "POST", body: sub }),
  updateSubmission: (id, patch) => request(`${ENDPOINTS.submissions}/${id}`, { method: "PATCH", body: patch }),

  // ---- AI baholash ----
  // Bular endi to'g'ridan-to'g'ri OpenAI/Claude'ga emas, backendga boradi.
  // Backend ichida OpenAI key bilan chaqiriladi (xavfsiz, key frontendda yo'q).
  gradeWriting: (prompt, answer, level) =>
    request(ENDPOINTS.gradeWriting, { method: "POST", body: { prompt, answer, level } }),
  gradeSpeaking: (prompt, transcript, level) =>
    request(ENDPOINTS.gradeSpeaking, { method: "POST", body: { prompt, transcript, level } }),
};
