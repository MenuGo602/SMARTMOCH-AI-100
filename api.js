import { getInitData, getUnsafeTelegramUser } from "./telegram";

// Backend manzili build-vaqtida beriladi (Dockerfile'dagi VITE_API_URL ARG'ga qarang).
// Lokal devda .env faylga VITE_API_URL=http://localhost:8000/api/v1 deb yozing.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// ─────────────────────────────────────────────────────────────────────────
// VAQTINCHALIK REJIM: backendda hali /auth, /exams, /submissions endpointlari
// yo'q (faqat /grading/writing va /grading/speaking mavjud). Shuning uchun
// profil/imtihon/submission ma'lumotlari hozircha localStorage'da saqlanadi.
// Backend tayyor bo'lgach, quyidagi LOCAL_* funksiyalarni qayta `request(...)`
// chaqiruvlariga almashtiring (eski versiya git tarixida saqlangan).
// ─────────────────────────────────────────────────────────────────────────

const LS_KEYS = {
  profile: "smartmock:profile",
  exams: "smartmock:exams",
  submissions: "smartmock:submissions",
};

function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage mavjud bo'lmasa (xususiy rejim va h.k.) jim o'tib ketamiz
  }
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const ENDPOINTS = {
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
  // ---- Profil / rol (vaqtincha: localStorage) ----
  getMe: async () => {
    const profile = lsGet(LS_KEYS.profile, null);
    if (profile) return profile;
    const tgUser = getUnsafeTelegramUser();
    return tgUser?.id ? { userId: String(tgUser.id), role: null, name: null } : null;
  },
  chooseRole: async (role) => {
    const profile = lsGet(LS_KEYS.profile, {}) || {};
    const updated = { ...profile, role };
    lsSet(LS_KEYS.profile, updated);
    return updated;
  },
  saveDisplayName: async (name) => {
    const profile = lsGet(LS_KEYS.profile, {}) || {};
    const updated = { ...profile, name };
    lsSet(LS_KEYS.profile, updated);
    return updated;
  },

  // ---- Imtihonlar (vaqtincha: localStorage) ----
  listExams: async () => lsGet(LS_KEYS.exams, []),
  createExam: async (exam) => {
    const exams = lsGet(LS_KEYS.exams, []);
    const newExam = { ...exam, id: exam.id || uid() };
    lsSet(LS_KEYS.exams, [...exams, newExam]);
    return newExam;
  },
  deleteExam: async (id) => {
    const exams = lsGet(LS_KEYS.exams, []);
    lsSet(LS_KEYS.exams, exams.filter((e) => e.id !== id));
    return null;
  },

  // ---- Topshiriqlar / submission'lar (vaqtincha: localStorage) ----
  listSubmissions: async () => lsGet(LS_KEYS.submissions, []),
  createSubmission: async (sub) => {
    const subs = lsGet(LS_KEYS.submissions, []);
    const newSub = { ...sub, id: sub.id || uid() };
    lsSet(LS_KEYS.submissions, [...subs, newSub]);
    return newSub;
  },
  updateSubmission: async (id, patch) => {
    const subs = lsGet(LS_KEYS.submissions, []);
    const updated = subs.map((s) => (s.id === id ? { ...s, ...patch } : s));
    lsSet(LS_KEYS.submissions, updated);
    return updated.find((s) => s.id === id) || null;
  },

  // ---- AI baholash (haqiqiy backend, OpenAI orqali) ----
  gradeWriting: (prompt, answer, level) =>
    request(ENDPOINTS.gradeWriting, { method: "POST", body: { prompt, answer, level } }),
  gradeSpeaking: (prompt, transcript, level) =>
    request(ENDPOINTS.gradeSpeaking, { method: "POST", body: { prompt, transcript, level } }),
};
