import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen, Headphones, PenTool, Mic, Plus, ChevronRight, ChevronLeft,
  X, Award, GraduationCap, ArrowLeft, Save, Send, Loader2, CheckCircle2,
  Clock, Trash2, Users, ClipboardCheck, MessageCircle, Square, Play,
  Sparkles, AlertCircle, RotateCcw, TrendingUp, Target, Zap,
} from "lucide-react";
import { api } from "./lib/api";
import { initTelegram, getUnsafeTelegramUser } from "./lib/telegram";

/* ---------- design tokens (from SmartMock AI brand) ---------- */
const C = {
  v1: "#8B6FF0",
  v2: "#4B2FBE",
  ink: "#1A1440",
  inkSoft: "#6B6489",
  paper: "#F5F3FC",
  paper2: "#FFFFFF",
  line: "#E5E0F5",
  ok: "#1FA152",
  okBg: "#E8F8EE",
  warn: "#E08A1E",
  warnBg: "#FCF0DD",
  bad: "#E0463F",
  badBg: "#FCE9E8",
  blue: "#3B6FE0",
  blueBg: "#E8EEFC",
  flagBlack: "#1A1440",
  flagRed: "#D6433C",
  flagGold: "#E0A93E",
};

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap');
      .sm-root, .sm-root * { box-sizing: border-box; }
      .sm-root { font-family: 'Inter', system-ui, sans-serif; min-height: 100dvh; }
      .sm-display { font-family: 'Poppins', system-ui, sans-serif; }
      .sm-mono { font-family: 'IBM Plex Mono', monospace; }
      .sm-root *::selection { background: ${C.v1}40; }
      @keyframes smFadeUp { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:none;} }
      @keyframes smPulse { 0%,100%{ box-shadow: 0 0 0 0 ${C.bad}55;} 50%{ box-shadow: 0 0 0 10px ${C.bad}00;} }
      @keyframes smSpin { to { transform: rotate(360deg); } }
      @keyframes smBar { from { width: 0; } }
      .sm-anim { animation: smFadeUp .35s ease both; }
      .sm-btn { transition: transform .15s ease, box-shadow .15s ease, background-color .15s ease, opacity .15s ease; }
      .sm-btn:active { transform: scale(0.97); }
      .sm-card { transition: box-shadow .2s ease, transform .2s ease; }
      .sm-card:hover { box-shadow: 0 8px 26px rgba(75,47,190,0.10); }
      .sm-focus:focus-visible { outline: 2px solid ${C.v1}; outline-offset: 2px; }
      .sm-scroll::-webkit-scrollbar { width: 8px; }
      .sm-scroll::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 4px; }
      .sm-spin { animation: smSpin 1s linear infinite; }
      .sm-recpulse { animation: smPulse 1.6s ease-in-out infinite; }
      .sm-barfill { animation: smBar .6s ease both; }
    `}</style>
  );
}

/* ---------- logo (hexagon, brand-matched) ---------- */
function Logo({ size = 40 }) {
  return (
    <div style={{
      width: size, height: size,
      clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)",
      background: `linear-gradient(155deg, ${C.v1}, ${C.v2})`,
      display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
      flexShrink: 0,
    }}>
      <GraduationCap size={size * 0.5} color="#fff" strokeWidth={2.2} />
      <div style={{
        position: "absolute", bottom: 0, left: "20%", right: "20%", height: "16%",
        background: `linear-gradient(90deg, ${C.flagBlack}, ${C.flagRed}, ${C.flagGold})`,
        borderRadius: 2,
      }} />
    </div>
  );
}

function Wordmark({ size = 18 }) {
  return (
    <div className="sm-display" style={{ display: "flex", alignItems: "baseline", gap: 0, fontSize: size, fontWeight: 700, lineHeight: 1 }}>
      <span style={{ color: C.ink }}>Smart</span>
      <span style={{ color: C.v2 }}>Mock</span>
      <span style={{
        marginLeft: 5, fontSize: size * 0.55, fontWeight: 700, color: "#fff", background: C.v2,
        padding: "2px 6px", borderRadius: 6,
      }}>AI</span>
    </div>
  );
}

/* ---------- shared bits ---------- */
function Btn({ children, onClick, variant = "primary", icon: Icon, style, disabled, type = "button" }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "11px 18px", borderRadius: 11, fontWeight: 600, fontSize: 14.5,
    border: "1px solid transparent", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
  };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${C.v1}, ${C.v2})`, color: "#fff" },
    ghost: { background: "transparent", color: C.ink, border: `1px solid ${C.line}` },
    danger: { background: "transparent", color: C.bad, border: `1px solid ${C.bad}55` },
    soft: { background: C.paper, color: C.v2, border: `1px solid ${C.line}` },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className="sm-btn sm-focus" style={{ ...base, ...variants[variant], ...style }}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function Card({ children, style, onClick, className = "" }) {
  return (
    <div onClick={onClick} className={`sm-card ${className}`} style={{
      background: C.paper2, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.inkSoft, display: "block", marginBottom: 6 }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11.5, color: C.inkSoft, display: "block", marginTop: 5 }}>{hint}</span>}
    </label>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.line}`,
  fontSize: 14.5, fontFamily: "inherit", background: C.paper2, color: C.ink,
};

function ScoreBar({ label, value, max, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
        <span style={{ color: C.inkSoft, fontWeight: 600 }}>{label}</span>
        <span className="sm-mono" style={{ color: C.ink, fontWeight: 700 }}>{value}/{max}</span>
      </div>
      <div style={{ height: 7, background: C.paper, borderRadius: 4, overflow: "hidden" }}>
        <div className="sm-barfill" style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }) {
  return (
    <Card style={{ textAlign: "center", padding: "40px 24px", border: `1px dashed ${C.line}` }}>
      <Icon size={26} color={C.inkSoft} style={{ marginBottom: 10 }} />
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.inkSoft, maxWidth: 320, margin: "0 auto" }}>{desc}</div>
    </Card>
  );
}

/* ---------- AI grading helpers ----------
   Eslatma: bu yerda endi to'g'ridan-to'g'ri AI provayderga (Claude/OpenAI)
   chaqiruv YO'Q. API key'ni frontendda saqlash xavfsiz emas. Buning o'rniga
   backend'dagi /grading/* endpoint'lariga so'rov yuboramiz — backend ichida
   OpenAI key bilan chaqiriladi. */
async function gradeWriting(prompt, answer, level) {
  return api.gradeWriting(prompt, answer, level);
}

async function gradeSpeaking(prompt, transcript, level) {
  return api.gradeSpeaking(prompt, transcript, level);
}

/* ============================================================= */

export default function SmartMockApp() {
  const [booting, setBooting] = useState(true);
  const [role, setRole] = useState(null);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [screen, setScreen] = useState("dashboard");
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const flash = (msg, tone = "ok") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    (async () => {
      initTelegram();
      const tgUser = getUnsafeTelegramUser();
      // Boshlang'ich render uchun tezkor (tekshirilmagan) ism/id — backend
      // javobi kelishi bilan pastda haqiqiysi bilan almashtiriladi.
      setUserId(tgUser?.id ? String(tgUser.id) : "");
      if (tgUser?.first_name) setUserName(`${tgUser.first_name}${tgUser.last_name ? " " + tgUser.last_name : ""}`);
      try {
        // Backend initData'ni HMAC-SHA256 orqali tekshiradi va haqiqiy
        // foydalanuvchi profilini ({role, name, userId}) qaytaradi.
        const me = await api.getMe();
        if (me?.role) setRole(me.role);
        if (me?.name) setUserName(me.name);
        if (me?.userId) setUserId(String(me.userId));
      } catch (e) {
        // Profil hali yaratilmagan bo'lishi mumkin (yangi foydalanuvchi) —
        // RoleScreen/NameScreen orqali keyinroq to'ldiriladi.
      }
      await refreshExams();
      await refreshSubmissions();
      setBooting(false);
    })();
  }, []);

  const refreshExams = useCallback(async () => {
    try { setExams((await api.listExams()) || []); }
    catch (e) { setExams([]); }
  }, []);
  const refreshSubmissions = useCallback(async () => {
    try { setSubmissions((await api.listSubmissions()) || []); }
    catch (e) { setSubmissions([]); }
  }, []);
  const chooseRole = async (r) => { await api.chooseRole(r); setRole(r); setScreen("dashboard"); };
  const saveName = async (name) => { await api.saveDisplayName(name); setUserName(name); };

  if (booting) {
    return (
      <div className="sm-root" style={{ background: C.paper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FontLoader />
        <Loader2 size={26} className="sm-spin" style={{ color: C.v2 }} />
      </div>
    );
  }
  if (!role) return <RoleScreen onChoose={chooseRole} />;
  if (!userName) return <NameScreen onSave={saveName} role={role} />;

  return (
    <div className="sm-root" style={{ background: C.paper, color: C.ink, display: "flex", flexDirection: "column" }}>
      <FontLoader />
      <Header role={role} userName={userName} onSwitchRole={() => setRole(null)} />
      {/* Eslatma: rol backendda ham saqlanadi (api.chooseRole orqali),
          shuning uchun "rol almashtirish" hozircha faqat shu seans uchun
          mahalliy holatni tozalaydi — RoleScreen qayta ko'rsatiladi. */}
      <div style={{ flex: 1, padding: "18px 16px 40px", maxWidth: 640, margin: "0 auto", width: "100%" }}>
        {toast && (
          <div className="sm-anim" style={{
            position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 50,
            background: toast.tone === "ok" ? C.ink : C.bad, color: "#fff", padding: "10px 16px",
            borderRadius: 10, fontSize: 13.5, fontWeight: 600, boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
          }}>{toast.msg}</div>
        )}

        {role === "teacher" && screen === "dashboard" && (
          <TeacherDashboard
            exams={exams} submissions={submissions} userName={userName}
            onCreate={() => setScreen("create")}
            onOpenReview={() => setScreen("review")}
            onDeleteExam={async (id) => { await api.deleteExam(id); await refreshExams(); flash("Imtihon o'chirildi"); }}
          />
        )}
        {role === "teacher" && screen === "create" && (
          <CreateExam
            onCancel={() => setScreen("dashboard")}
            saving={saving}
            onSave={async (exam) => {
              setSaving(true);
              await api.createExam(exam);
              await refreshExams();
              setSaving(false);
              flash("Imtihon yaratildi");
              setScreen("dashboard");
            }}
          />
        )}
        {role === "teacher" && screen === "review" && (
          <ReviewPanel
            submissions={submissions}
            onBack={() => setScreen("dashboard")}
            onUpdate={async (sub, patch) => {
              await api.updateSubmission(sub.id, patch);
              await refreshSubmissions();
              flash("Saqlandi");
            }}
          />
        )}

        {role === "student" && screen === "dashboard" && (
          <StudentDashboard
            exams={exams}
            submissions={submissions.filter((s) => s.userId === (userId || userName))}
            userName={userName}
            onStart={(exam) => { setActiveExam(exam); setScreen("exam"); }}
          />
        )}
        {role === "student" && screen === "exam" && activeExam && (
          <TakeExam
            exam={activeExam}
            onExit={() => { setActiveExam(null); setScreen("dashboard"); }}
            onDone={async (sub) => {
              await api.createSubmission(sub);
              await refreshSubmissions();
              setActiveExam(null);
              setScreen("dashboard");
              flash("Imtihon yakunlandi va AI tomonidan baholandi!");
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ================= shell screens ================= */

function Header({ role, userName, onSwitchRole }) {
  return (
    <div style={{
      borderBottom: `1px solid ${C.line}`, background: C.paper2, padding: "13px 16px",
      paddingTop: "max(72px, calc(13px + var(--tg-safe-top, env(safe-area-inset-top, 0px))))",
      display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Logo size={34} />
        <div>
          <Wordmark size={15} />
          <div style={{ fontSize: 10.5, color: C.inkSoft, letterSpacing: 0.4, textTransform: "uppercase", marginTop: 1 }}>
            {role === "teacher" ? "O'qituvchi paneli" : "Talaba paneli"}
          </div>
        </div>
      </div>
      <button onClick={onSwitchRole} className="sm-focus" style={{
        background: "transparent", border: "none", fontSize: 12.5, color: C.inkSoft, cursor: "pointer",
        textDecoration: "underline", textUnderlineOffset: 3,
      }}>{userName} · almashtirish</button>
    </div>
  );
}

function RoleScreen({ onChoose }) {
  return (
    <div className="sm-root" style={{ background: `linear-gradient(160deg, ${C.v2}, ${C.ink})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <FontLoader />
      <div className="sm-anim" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><Logo size={64} /></div>
        <Wordmark size={26} />
        <p style={{ color: "#D8D2F2", fontSize: 13, marginTop: 6, marginBottom: 30, letterSpacing: 0.3 }}>
          Sizning nemis tili imtihon platformangiz
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button onClick={() => onChoose("teacher")} className="sm-btn sm-focus" style={{
            background: "rgba(255,255,255,0.08)", border: `1px solid ${C.v1}55`, borderRadius: 16, padding: "22px 14px",
            color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          }}>
            <GraduationCap size={26} color={C.v1} />
            <span style={{ fontWeight: 600, fontSize: 14.5 }}>O'qituvchiman</span>
          </button>
          <button onClick={() => onChoose("student")} className="sm-btn sm-focus" style={{
            background: "rgba(255,255,255,0.08)", border: `1px solid ${C.v1}55`, borderRadius: 16, padding: "22px 14px",
            color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          }}>
            <Users size={26} color={C.v1} />
            <span style={{ fontWeight: 600, fontSize: 14.5 }}>Talabaman</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function NameScreen({ onSave, role }) {
  const [val, setVal] = useState("");
  return (
    <div className="sm-root" style={{ background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <FontLoader />
      <Card style={{ maxWidth: 380, width: "100%" }} className="sm-anim">
        <div className="sm-display" style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>
          {role === "teacher" ? "O'qituvchi" : "Talaba"}, ismingiz?
        </div>
        <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: 16 }}>Bu ism natijalarda va imtihonlarda ko'rinadi.</p>
        <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder="Ism Familiya" className="sm-focus" style={inputStyle}
          onKeyDown={(e) => e.key === "Enter" && val.trim() && onSave(val.trim())} />
        <Btn style={{ marginTop: 14, width: "100%" }} disabled={!val.trim()} onClick={() => onSave(val.trim())}>Davom etish</Btn>
      </Card>
    </div>
  );
}

/* ================= teacher: dashboard / create / review ================= */

function TeacherDashboard({ exams, submissions, userName, onCreate, onOpenReview, onDeleteExam }) {
  const total = submissions.length;
  const avg = total ? Math.round(submissions.reduce((a, s) => a + s.overallPct, 0) / total) : 0;
  const recentExams = exams.slice().reverse().slice(0, 3);
  const today = new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long", weekday: "long" });

  // Daraja bo'yicha imtihonlar soni (TELC A1–C1)
  const byLevel = ["A1", "A2", "B1", "B2", "C1"].map((lvl) => ({
    level: lvl, count: exams.filter((e) => e.level === lvl).length,
  }));

  return (
    <div className="sm-anim">
      {/* Gradient banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.v1}, ${C.v2})`, borderRadius: 18, padding: 22, marginBottom: 16, color: "#fff",
      }}>
        <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Assalomu alaykum{userName ? `, ${userName}` : ""}! 👋</div>
        <div style={{ fontSize: 13, opacity: 0.9, textTransform: "capitalize" }}>Bugun {today}</div>
      </div>

      {/* Statistika kartochkalari */}
      <div className="sm-display" style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        Statistika
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { icon: BookOpen, label: "Imtihonlar", value: exams.length, color: C.v1 },
          { icon: ClipboardCheck, label: "Urinishlar", value: total, color: C.blue },
          { icon: TrendingUp, label: "O'rtacha natija", value: total ? `${avg}%` : "—", color: C.ok },
          { icon: Award, label: "Daraja(lar)", value: byLevel.filter((l) => l.count > 0).length, color: C.warn },
        ].map((s) => (
          <Card key={s.label} style={{ padding: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div className="sm-mono" style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Tezkor amallar */}
      <div className="sm-display" style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Tezkor amallar</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
        <Card onClick={onCreate} style={{ cursor: "pointer", textAlign: "center", padding: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.v1, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
            <Plus size={20} color="#fff" />
          </div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>Yangi imtihon</div>
          <div style={{ fontSize: 11.5, color: C.inkSoft }}>Yaratish</div>
        </Card>
        <Card onClick={onOpenReview} style={{ cursor: "pointer", textAlign: "center", padding: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.okBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
            <ClipboardCheck size={20} color={C.ok} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>Natijalar</div>
          <div style={{ fontSize: 11.5, color: C.inkSoft }}>Tekshirish</div>
        </Card>
      </div>

      {/* Oxirgi faoliyat */}
      {recentExams.length > 0 && (
        <>
          <div className="sm-display" style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={15} color={C.inkSoft} /> Oxirgi yaratilgan imtihonlar
          </div>
          <div style={{ display: "grid", gap: 8, marginBottom: 22 }}>
            {recentExams.map((ex) => (
              <Card key={ex.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <GraduationCap size={15} color={C.v1} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{ex.title}</div>
                <span className="sm-mono" style={{ fontSize: 11, color: C.inkSoft }}>{ex.level}</span>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Imtihonlar */}
      <div className="sm-display" style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Barcha imtihonlar</div>
      {exams.length === 0 ? (
        <EmptyState icon={BookOpen} title="Hali imtihon yo'q" desc="Birinchi mock imtihoningizni yarating: Lesen, Hören, Sprachbausteine, Schreiben, Sprechen bo'limlari bilan." />
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {exams.map((ex) => (
            <Card key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{ex.title}</div>
                <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>Daraja {ex.level}</div>
              </div>
              <button onClick={() => onDeleteExam(ex.id)} className="sm-focus" style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}>
                <Trash2 size={16} color={C.bad} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// TELC rasmiy imtihon strukturasi (A1–C1), rasmga asoslangan.
// Har bir daraja uchun: qaysi bo'limlar mavjud, har bo'limda nechta "Teil" va ular qanday turda.
// type: "mcq" (variantli savol), "truefalse" (richtig/falsch), "gapfill" (bo'sh joy to'ldirish), "text" (erkin matn topshiriq)
const TELC_LEVELS = {
  A1: {
    lesen: { label: "Lesen", teils: [
      { name: "Teil 1 — Zuordnen (moslashtirish)", type: "matching" },
      { name: "Teil 2 — Richtig/Falsch", type: "truefalse" },
      { name: "Teil 3 — Multiple Choice", type: "mcq" },
    ]},
    sprachbausteine: null,
    hören: { label: "Hören", teils: [
      { name: "Teil 1 — Rasmlar va dialoglar", type: "mcq" },
      { name: "Teil 2 — Richtig/Falsch", type: "truefalse" },
      { name: "Teil 3 — Multiple Choice", type: "mcq" },
    ]},
    schreiben: { label: "Schreiben", hint: "Qisqa xabar yozish (SMS, Email, Notiz va h.k.)" },
    sprechen: { label: "Sprechen", teils: ["Sich vorstellen (o'zini tanishtirish)", "Fragen stellen und beantworten", "Gemeinsam etwas machen"] },
  },
  A2: {
    lesen: { label: "Lesen", teils: [
      { name: "Teil 1 — Zuordnen (moslashtirish)", type: "matching" },
      { name: "Teil 2 — Richtig/Falsch", type: "truefalse" },
      { name: "Teil 3 — Multiple Choice", type: "mcq" },
    ]},
    sprachbausteine: null,
    hören: { label: "Hören", teils: [
      { name: "Teil 1 — Dialoglar", type: "mcq" },
      { name: "Teil 2 — Richtig/Falsch", type: "truefalse" },
      { name: "Teil 3 — Multiple Choice", type: "mcq" },
    ]},
    schreiben: { label: "Schreiben", hint: "Email yoki xat yozish" },
    sprechen: { label: "Sprechen", teils: ["Sich vorstellen (o'zini tanishtirish)", "Über ein Thema sprechen", "Gemeinsam planen"] },
  },
  B1: {
    lesen: { label: "Lesen", teils: [
      { name: "Teil 1 — Zuordnen (moslashtirish)", type: "matching" },
      { name: "Teil 2 — Richtig/Falsch", type: "truefalse" },
      { name: "Teil 3 — Multiple Choice", type: "mcq" },
    ]},
    sprachbausteine: { label: "Sprachbausteine", teils: [
      { name: "Teil 1 — Bo'sh joylarni to'ldirish", type: "gapfill" },
      { name: "Teil 2 — Bo'sh joylarni to'ldirish", type: "gapfill" },
    ]},
    hören: { label: "Hören", teils: [
      { name: "Teil 1 — Richtig/Falsch", type: "truefalse" },
      { name: "Teil 2 — Multiple Choice", type: "mcq" },
      { name: "Teil 3 — Zuordnen (moslashtirish)", type: "mcq" },
    ]},
    schreiben: { label: "Schreiben", hint: "Email / Brief (xat yozish)" },
    sprechen: { label: "Sprechen", teils: ["Sich vorstellen (o'zini tanishtirish)", "Thema präsentieren", "Gemeinsam planen"] },
  },
  B2: {
    lesen: { label: "Lesen", teils: [
      { name: "Teil 1 — Zuordnen (moslashtirish)", type: "matching" },
      { name: "Teil 2 — Multiple Choice", type: "mcq" },
      { name: "Teil 3 — Detailverständnis (batafsil tushunish)", type: "mcq" },
    ]},
    sprachbausteine: { label: "Sprachbausteine", teils: [
      { name: "Teil 1 — Bo'sh joylarni to'ldirish", type: "gapfill" },
      { name: "Teil 2 — Bo'sh joylarni to'ldirish", type: "gapfill" },
    ]},
    hören: { label: "Hören", teils: [
      { name: "Teil 1 — Dialoglar", type: "mcq" },
      { name: "Teil 2 — Intervyu yoki reportaj", type: "mcq" },
      { name: "Teil 3 — Diskussion (munozara)", type: "mcq" },
    ]},
    schreiben: { label: "Schreiben", hint: "Formeller Brief / Stellungnahme (rasmiy xat / fikr bildirish)" },
    sprechen: { label: "Sprechen", teils: ["Präsentation (taqdimot)", "Diskussion (munozara)", "Problemlösung (muammoni hal qilish)"] },
  },
  C1: {
    lesen: { label: "Lesen", teils: [
      { name: "Teil 1 — Murakkab matnlarni tushunish", type: "mcq" },
      { name: "Teil 2 — Multiple Choice", type: "mcq" },
      { name: "Teil 3 — Zuordnen (moslashtirish)", type: "matching" },
    ]},
    sprachbausteine: { label: "Sprachbausteine", teils: [
      { name: "Teil 1 — Bo'sh joylarni to'ldirish", type: "gapfill" },
      { name: "Teil 2 — Bo'sh joylarni to'ldirish", type: "gapfill" },
    ]},
    hören: { label: "Hören", teils: [
      { name: "Teil 1 — Vortrag (ma'ruza)", type: "mcq" },
      { name: "Teil 2 — Interview (intervyu)", type: "mcq" },
      { name: "Teil 3 — Diskussion (munozara)", type: "mcq" },
    ]},
    schreiben: { label: "Schreiben", hint: "Argumentativer Text / Stellungnahme / Bericht (dalillovchi matn, fikr bildirish, hisobot)" },
    sprechen: { label: "Sprechen", teils: ["Präsentation (taqdimot)", "Fachliche Diskussion (kasbiy munozara)", "Gemeinsame Problemlösung (birgalikda muammo yechish)"] },
  },
};

const emptyMCQ = (type = "mcq") =>
  type === "truefalse"
    ? { id: uid(), question: "", options: ["Richtig", "Falsch"], correct: 0, type }
    : { id: uid(), question: "", options: ["", "", "", ""], correct: 0, type };

const emptyMatching = () => ({
  situations: [],
  ads: [],
});
const emptySituation = () => ({ id: uid(), text: "", correctAdId: null });
const emptyAd = () => ({ id: uid(), title: "", body: "" });

function MatchingBuilder({ title, icon: Icon, data, onChange }) {
  const value = data && data.situations ? data : emptyMatching();
  const { situations, ads } = value;

  const update = (patch) => onChange({ ...value, ...patch });
  const addSituation = () => update({ situations: [...situations, emptySituation()] });
  const updateSituation = (id, patch) => update({ situations: situations.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const removeSituation = (id) => update({ situations: situations.filter((s) => s.id !== id) });
  const addAd = () => update({ ads: [...ads, emptyAd()] });
  const updateAd = (id, patch) => update({ ads: ads.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  const removeAd = (id) => update({
    ads: ads.filter((a) => a.id !== id),
    situations: situations.map((s) => (s.correctAdId === id ? { ...s, correctAdId: null } : s)),
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Icon size={16} color={C.v2} /><span style={{ fontWeight: 600, fontSize: 14.5 }}>{title}</span>
      </div>

      {/* E'lonlar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="sm-mono" style={{ fontSize: 11.5, color: C.inkSoft }}>E'LONLAR ({ads.length})</span>
          <Btn variant="soft" icon={Plus} onClick={addAd}>E'lon</Btn>
        </div>
        {ads.length === 0 && <div style={{ fontSize: 12.5, color: C.inkSoft, padding: "6px 2px" }}>Hali e'lon yo'q. Avval e'lonlarni qo'shing, keyin vaziyatlarni ularga moslang.</div>}
        <div style={{ display: "grid", gap: 8 }}>
          {ads.map((ad, idx) => (
            <Card key={ad.id} style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className="sm-mono" style={{ fontSize: 11, color: C.v1, fontWeight: 700 }}>{String.fromCharCode(97 + idx)})</span>
                <button onClick={() => removeAd(ad.id)} className="sm-focus" style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={13} color={C.bad} /></button>
              </div>
              <input className="sm-focus" style={{ ...inputStyle, marginBottom: 6, fontSize: 13.5 }} placeholder="E'lon sarlavhasi" value={ad.title} onChange={(e) => updateAd(ad.id, { title: e.target.value })} />
              <textarea className="sm-focus" style={{ ...inputStyle, fontSize: 13, minHeight: 50, resize: "vertical" }} placeholder="E'lon matni" value={ad.body} onChange={(e) => updateAd(ad.id, { body: e.target.value })} />
            </Card>
          ))}
        </div>
      </div>

      {/* Vaziyatlar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span className="sm-mono" style={{ fontSize: 11.5, color: C.inkSoft }}>VAZIYATLAR ({situations.length})</span>
          <Btn variant="soft" icon={Plus} onClick={addSituation}>Vaziyat</Btn>
        </div>
        {situations.length === 0 && <div style={{ fontSize: 12.5, color: C.inkSoft, padding: "6px 2px" }}>Hali vaziyat yo'q.</div>}
        <div style={{ display: "grid", gap: 10 }}>
          {situations.map((s, idx) => (
            <Card key={s.id} style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className="sm-mono" style={{ fontSize: 11.5, color: C.inkSoft }}>VAZIYAT {idx + 1}</span>
                <button onClick={() => removeSituation(s.id)} className="sm-focus" style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={13} color={C.bad} /></button>
              </div>
              <input className="sm-focus" style={{ ...inputStyle, marginBottom: 8, fontSize: 13.5 }} placeholder="Vaziyat matni (masalan: Siz kitob do'konini izlayapsiz...)" value={s.text} onChange={(e) => updateSituation(s.id, { text: e.target.value })} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ads.map((ad, adIdx) => (
                  <button key={ad.id} onClick={() => updateSituation(s.id, { correctAdId: ad.id })} className="sm-focus" style={{
                    padding: "5px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                    border: `1.5px solid ${s.correctAdId === ad.id ? C.ok : C.line}`,
                    background: s.correctAdId === ad.id ? `${C.ok}15` : "transparent", color: s.correctAdId === ad.id ? C.ok : C.inkSoft,
                  }}>{String.fromCharCode(97 + adIdx)}</button>
                ))}
                <button onClick={() => updateSituation(s.id, { correctAdId: "x" })} className="sm-focus" style={{
                  padding: "5px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${s.correctAdId === "x" ? C.warn : C.line}`,
                  background: s.correctAdId === "x" ? `${C.warn}15` : "transparent", color: s.correctAdId === "x" ? C.warn : C.inkSoft,
                }} title="Hech qaysi e'lon mos kelmaydi">x</button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function MCQBuilder({ title, icon: Icon, items, onAdd, onUpdate, onRemove, type = "mcq" }) {
  const isFixedOptions = type === "truefalse";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon size={16} color={C.v2} /><span style={{ fontWeight: 600, fontSize: 14.5 }}>{title}</span></div>
        <Btn variant="soft" icon={Plus} onClick={onAdd}>Savol</Btn>
      </div>
      {items.length === 0 && <div style={{ fontSize: 12.5, color: C.inkSoft, padding: "10px 2px" }}>Hali savol yo'q.</div>}
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((q, idx) => (
          <Card key={q.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="sm-mono" style={{ fontSize: 11.5, color: C.inkSoft }}>SAVOL {idx + 1}</span>
              <button onClick={() => onRemove(q.id)} className="sm-focus" style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={14} color={C.bad} /></button>
            </div>
            <input className="sm-focus" style={{ ...inputStyle, marginBottom: 8 }} placeholder={type === "gapfill" ? "Gap qoldirilgan jumla (masalan: Ich ___ nach Berlin.)" : "Savol matni"} value={q.question} onChange={(e) => onUpdate(q.id, { question: e.target.value })} />
            {q.options.map((opt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <button onClick={() => onUpdate(q.id, { correct: i })} title="To'g'ri javob" className="sm-focus" style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${q.correct === i ? C.ok : C.line}`, background: q.correct === i ? C.ok : "transparent", cursor: "pointer",
                }} />
                {isFixedOptions ? (
                  <div style={{ ...inputStyle, padding: "7px 10px", fontSize: 13.5, background: C.paper, color: C.inkSoft }}>{opt}</div>
                ) : (
                  <input className="sm-focus" style={{ ...inputStyle, padding: "7px 10px", fontSize: 13.5 }} placeholder={`Variant ${String.fromCharCode(65 + i)}`}
                    value={opt} onChange={(e) => { const opts = [...q.options]; opts[i] = e.target.value; onUpdate(q.id, { options: opts }); }} />
                )}
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

// Berilgan daraja konfiguratsiyasiga mos bo'sh savollar tuzilmasini yaratadi:
// { lesen: [[], [], []], sprachbausteine: [[], []] yoki yo'q, hören: [[], [], []] }
function makeEmptyTeilAnswers(cfg) {
  const result = {};
  ["lesen", "sprachbausteine", "hören"].forEach((key) => {
    if (cfg[key]) result[key] = cfg[key].teils.map((t) => (t.type === "matching" ? emptyMatching() : []));
  });
  return result;
}

function CreateExam({ onCancel, onSave, saving }) {
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("B1");
  const cfg = TELC_LEVELS[level];

  const [lesenPassage, setLesenPassage] = useState("");
  // Har bir bo'lim uchun Teil-bo'yicha savollar: { lesen: [[teil1 savollari], [teil2], [teil3]], ... }
  const [teilAnswers, setTeilAnswers] = useState(() => makeEmptyTeilAnswers(cfg));
  const [audioUrl, setAudioUrl] = useState("");
  const [schreibenPrompt, setSchreibenPrompt] = useState("");
  const [sprechenNotes, setSprechenNotes] = useState(() => (cfg.sprechen.teils || []).map(() => ""));
  const [step, setStep] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Daraja o'zgarganda Teil strukturasi ham o'zgaradi — savollarni qayta boshlash kerak.
  const onLevelChange = (newLevel) => {
    setLevel(newLevel);
    const newCfg = TELC_LEVELS[newLevel];
    setTeilAnswers(makeEmptyTeilAnswers(newCfg));
    setSprechenNotes((newCfg.sprechen.teils || []).map(() => ""));
    setStep(0);
  };

  const sectionKeys = ["lesen", "sprachbausteine", "hören", "schreiben", "sprechen"].filter((k) => cfg[k]);
  const steps = ["Asosiy", ...sectionKeys.map((k) => cfg[k].label)];

  // AI javobidagi bitta savolni frontend MCQ/truefalse/gapfill formatiga o'giradi.
  const aiQuestionToLocal = (q, teilType) => {
    if (teilType === "truefalse") {
      return { id: uid(), question: q.question || "", options: ["Richtig", "Falsch"], correct: q.correctIndex === 1 ? 1 : 0, type: "truefalse" };
    }
    const opts = Array.isArray(q.options) && q.options.length ? q.options : ["", "", "", ""];
    return { id: uid(), question: q.question || "", options: opts, correct: typeof q.correctIndex === "number" ? q.correctIndex : 0, type: teilType };
  };

  // AI javobidagi matching ma'lumotini frontend {situations, ads} formatiga o'giradi.
  const aiMatchingToLocal = (m) => {
    const ads = (m?.ads || []).map((a) => ({ id: uid(), title: a.title || "", body: a.body || "" }));
    const situations = (m?.situations || []).map((s) => {
      const idx = typeof s.correctAdIndex === "number" ? s.correctAdIndex : -1;
      const correctAdId = idx >= 0 && idx < ads.length ? ads[idx].id : (idx === -1 ? "x" : null);
      return { id: uid(), text: s.text || "", correctAdId };
    });
    return { ads, situations };
  };

  // AI orqali butun imtihonni (Hörendan tashqari) generatsiya qiladi va formani to'ldiradi.
  const generateWithAI = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const lesenTeilTypes = cfg.lesen ? cfg.lesen.teils.map((t) => t.type) : [];
      const sprachTeilTypes = cfg.sprachbausteine ? cfg.sprachbausteine.teils.map((t) => t.type) : [];
      const sprechenCount = (cfg.sprechen.teils || []).length;

      const result = await api.generateExam(level, lesenTeilTypes, sprachTeilTypes, sprechenCount);

      if (result.title) setTitle(result.title);
      if (result.lesen?.passage) setLesenPassage(result.lesen.passage);
      if (result.schreiben?.prompt) setSchreibenPrompt(result.schreiben.prompt);
      if (Array.isArray(result.sprechen?.teils)) {
        setSprechenNotes(result.sprechen.teils.map((t) => t.prompt || ""));
      }

      setTeilAnswers((prev) => {
        const next = { ...prev };
        if (cfg.lesen && Array.isArray(result.lesen?.teils)) {
          next.lesen = cfg.lesen.teils.map((t, i) => {
            const aiTeil = result.lesen.teils[i];
            if (!aiTeil) return prev.lesen[i];
            if (t.type === "matching") return aiMatchingToLocal(aiTeil.matching);
            return (aiTeil.questions || []).map((q) => aiQuestionToLocal(q, t.type));
          });
        }
        if (cfg.sprachbausteine && Array.isArray(result.sprachbausteine?.teils)) {
          next.sprachbausteine = cfg.sprachbausteine.teils.map((t, i) => {
            const aiTeil = result.sprachbausteine.teils[i];
            if (!aiTeil) return prev.sprachbausteine[i];
            return (aiTeil.questions || []).map((q) => aiQuestionToLocal(q, t.type));
          });
        }
        return next;
      });
    } catch (e) {
      setAiError("AI generatsiya qilishda xatolik yuz berdi. Qaytadan urinib ko'ring yoki qo'lda to'ldiring.");
    }
    setAiLoading(false);
  };

  const updateTeil = (sectionKey, teilIdx, value) => {
    setTeilAnswers((prev) => ({ ...prev, [sectionKey]: prev[sectionKey].map((t, i) => (i === teilIdx ? value : t)) }));
  };
  const mk = (sectionKey, teilIdx) => {
    const value = teilAnswers[sectionKey][teilIdx];
    const isMatching = cfg[sectionKey].teils[teilIdx].type === "matching";
    if (isMatching) {
      return { onChange: (next) => updateTeil(sectionKey, teilIdx, next) };
    }
    return {
      onAdd: () => updateTeil(sectionKey, teilIdx, [...value, emptyMCQ(cfg[sectionKey].teils[teilIdx].type)]),
      onUpdate: (id, patch) => updateTeil(sectionKey, teilIdx, value.map((q) => (q.id === id ? { ...q, ...patch } : q))),
      onRemove: (id) => updateTeil(sectionKey, teilIdx, value.filter((q) => q.id !== id)),
    };
  };

  const totalTestQuestions = ["lesen", "sprachbausteine", "hören"]
    .filter((k) => cfg[k])
    .reduce((sum, k) => sum + teilAnswers[k].reduce((s, t) => s + (Array.isArray(t) ? t.length : (t.situations || []).length), 0), 0);

  const serializeTeil = (sectionKey, i, t) => {
    const value = teilAnswers[sectionKey][i];
    if (t.type === "matching") {
      const v = value && value.situations ? value : emptyMatching();
      return {
        name: t.name, type: t.type,
        matching: {
          ads: v.ads.filter((a) => a.title.trim()),
          situations: v.situations.filter((s) => s.text.trim() && s.correctAdId),
        },
      };
    }
    return { name: t.name, type: t.type, questions: value.filter((q) => q.question.trim()) };
  };

  const canSave = title.trim() && totalTestQuestions > 0 && schreibenPrompt.trim() && sprechenNotes.every((n) => n.trim());

  const sectionIcon = { lesen: BookOpen, sprachbausteine: Sparkles, hören: Headphones, schreiben: PenTool, sprechen: Mic };

  return (
    <div className="sm-anim">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onCancel} className="sm-focus" style={{ background: "transparent", border: "none", cursor: "pointer" }}><ArrowLeft size={20} /></button>
        <div className="sm-display" style={{ fontSize: 19, fontWeight: 700 }}>Yangi imtihon</div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, overflowX: "auto" }}>
        {steps.map((s, i) => (
          <button key={s} onClick={() => setStep(i)} className="sm-focus" style={{
            padding: "6px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap",
            border: `1px solid ${i === step ? C.v2 : C.line}`, background: i === step ? C.v2 : "transparent",
            color: i === step ? "#fff" : C.inkSoft, cursor: "pointer",
          }}>{i + 1}. {s}</button>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <Field label="Imtihon nomi"><input className="sm-focus" style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: B1 Mock Imtihon — Iyun" /></Field>
          <Field label="Daraja (TELC)" hint="Daraja o'zgartirilsa, bo'limlar TELC rasmiy strukturasiga moslab qayta tuziladi">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.keys(TELC_LEVELS).map((l) => (
                <button key={l} onClick={() => onLevelChange(l)} className="sm-focus sm-mono" style={{
                  padding: "8px 14px", borderRadius: 10, fontWeight: 700, fontSize: 13,
                  border: `1px solid ${level === l ? C.v2 : C.line}`, background: level === l ? `${C.v1}20` : "transparent", color: C.ink, cursor: "pointer",
                }}>{l}</button>
              ))}
            </div>
          </Field>
          {!cfg.sprachbausteine && (
            <div style={{ fontSize: 12, color: C.inkSoft, display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <Sparkles size={13} color={C.v1} /> {level} darajasida Sprachbausteine bo'limi TELC formatida mavjud emas.
            </div>
          )}

          <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
            <button onClick={generateWithAI} disabled={aiLoading} className="sm-focus sm-btn" style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: `linear-gradient(135deg, ${C.v1}, ${C.v2})`, color: "#fff", border: "none",
              borderRadius: 12, padding: "13px 16px", fontSize: 14, fontWeight: 700,
              cursor: aiLoading ? "default" : "pointer", opacity: aiLoading ? 0.7 : 1,
            }}>
              {aiLoading ? <Loader2 size={17} className="sm-spin" /> : <Sparkles size={17} />}
              {aiLoading ? "AI imtihonni tuzmoqda..." : "AI bilan to'liq imtihon yaratish"}
            </button>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 6, textAlign: "center" }}>
              Lesen, Sprachbausteine, Schreiben va Sprechen avtomatik to'ldiriladi. Hören bo'limi qo'lda to'ldiriladi (audio talab qilingani uchun).
            </div>
            {aiError && (
              <div style={{ fontSize: 12, color: C.bad, marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={13} /> {aiError}
              </div>
            )}
          </div>
        </Card>
      )}

      {sectionKeys.map((sectionKey, sIdx) => {
        if (step !== sIdx + 1) return null;
        const section = cfg[sectionKey];
        const Icon = sectionIcon[sectionKey];

        if (sectionKey === "schreiben") {
          return (
            <Card key={sectionKey}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><Icon size={16} color={C.v2} /><span style={{ fontWeight: 600, fontSize: 14.5 }}>Schreiben topshirig'i</span></div>
              <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 10 }}>TELC {level} formati: {section.hint}</div>
              <Field label="Talabaga ko'rsatiladigan topshiriq">
                <textarea className="sm-focus" style={{ ...inputStyle, minHeight: 110, resize: "vertical" }} value={schreibenPrompt} onChange={(e) => setSchreibenPrompt(e.target.value)} placeholder="Masalan: Do'stingizga oxirgi sayohatingiz haqida xat yozing." />
              </Field>
              <div style={{ fontSize: 12, color: C.inkSoft, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={13} color={C.v1} /> AI avtomatik baholaydi: Inhalt, Aufbau, Wortschatz, Grammatik</div>
            </Card>
          );
        }

        if (sectionKey === "sprechen") {
          return (
            <Card key={sectionKey}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><Icon size={16} color={C.v2} /><span style={{ fontWeight: 600, fontSize: 14.5 }}>Sprechen — TELC {level} (3 Teil)</span></div>
              {section.teils.map((teilName, i) => (
                <Field key={i} label={`Teil ${i + 1} — ${teilName}`}>
                  <textarea className="sm-focus" style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={sprechenNotes[i] || ""}
                    onChange={(e) => setSprechenNotes((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                    placeholder="Talabaga ko'rsatiladigan mavzu/savol/topshiriq..." />
                </Field>
              ))}
              <div style={{ fontSize: 12, color: C.inkSoft, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={13} color={C.v1} /> Talaba gapiradi, AI transkriptga asoslanib Aussprache, Flüssigkeit, Grammatik, Wortschatz bo'yicha baholaydi</div>
            </Card>
          );
        }

        // lesen / sprachbausteine / hören — har biri bir nechta Teil'dan iborat, har Teil alohida savollar to'plami
        return (
          <div key={sectionKey}>
            {sectionKey === "lesen" && (
              <Card style={{ marginBottom: 14 }}>
                <Field label="O'qish matni (Lesen)"><textarea className="sm-focus" style={{ ...inputStyle, minHeight: 110, resize: "vertical" }} value={lesenPassage} onChange={(e) => setLesenPassage(e.target.value)} placeholder="Talaba o'qiydigan matn..." /></Field>
              </Card>
            )}
            {sectionKey === "hören" && (
              <Card style={{ marginBottom: 14 }}>
                <Field label="Audio havola" hint="YouTube, Telegram fayl link va h.k."><input className="sm-focus" style={inputStyle} value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://..." /></Field>
              </Card>
            )}
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkSoft, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
              TELC {level} — {section.label} ({section.teils.length} Teil)
            </div>
            {section.teils.map((teil, tIdx) => (
              <div key={tIdx} style={{ marginBottom: 18 }}>
                {teil.type === "matching" ? (
                  <MatchingBuilder title={teil.name} icon={Icon} data={teilAnswers[sectionKey][tIdx]} {...mk(sectionKey, tIdx)} />
                ) : (
                  <MCQBuilder title={teil.name} icon={Icon} items={teilAnswers[sectionKey][tIdx]} type={teil.type} {...mk(sectionKey, tIdx)} />
                )}
              </div>
            ))}
          </div>
        );
      })}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
        <Btn variant="ghost" icon={ChevronLeft} disabled={step === 0} onClick={() => setStep(step - 1)}>Orqaga</Btn>
        {step < steps.length - 1 ? (
          <Btn onClick={() => setStep(step + 1)} icon={ChevronRight} style={{ flexDirection: "row-reverse" }}>Keyingisi</Btn>
        ) : (
          <Btn icon={Save} disabled={!canSave || saving} onClick={() => onSave({
            id: uid(), title: title.trim(), level,
            sections: {
              lesen: cfg.lesen ? { passage: lesenPassage.trim(), teils: cfg.lesen.teils.map((t, i) => serializeTeil("lesen", i, t)) } : null,
              sprachbausteine: cfg.sprachbausteine ? { teils: cfg.sprachbausteine.teils.map((t, i) => serializeTeil("sprachbausteine", i, t)) } : null,
              hören: cfg.hören ? { audioUrl: audioUrl.trim(), teils: cfg.hören.teils.map((t, i) => serializeTeil("hören", i, t)) } : null,
              schreiben: { prompt: schreibenPrompt.trim() },
              sprechen: { teils: cfg.sprechen.teils.map((name, i) => ({ name, prompt: sprechenNotes[i].trim() })) },
            },
          })}>{saving ? "Saqlanmoqda..." : "Imtihonni saqlash"}</Btn>
        )}
      </div>
      {!canSave && step === steps.length - 1 && (
        <div style={{ fontSize: 12, color: C.bad, marginTop: 8, textAlign: "right" }}>Nom, kamida bitta test savoli, Schreiben va barcha Sprechen Teil'lari to'ldirilishi kerak.</div>
      )}
    </div>
  );
}

function ReviewPanel({ submissions, onBack }) {
  const [open, setOpen] = useState(null);
  if (open) return <ResultDetail sub={open} onBack={() => setOpen(null)} />;
  return (
    <div className="sm-anim">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} className="sm-focus" style={{ background: "transparent", border: "none", cursor: "pointer" }}><ArrowLeft size={20} /></button>
        <div className="sm-display" style={{ fontSize: 19, fontWeight: 700 }}>Natijalar</div>
      </div>
      {submissions.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Hali urinish yo'q" desc="Talabalar imtihon topshirgach shu yerda paydo bo'ladi." />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {submissions.slice().reverse().map((s) => (
            <Card key={s.id} onClick={() => setOpen(s)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{s.userName}</div>
                <div style={{ fontSize: 12.5, color: C.inkSoft }}>{s.examTitle} · {s.examLevel}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="sm-mono" style={{ fontWeight: 700, color: s.overallPct >= 60 ? C.ok : C.bad }}>{Math.round(s.overallPct)}%</span>
                <ChevronRight size={18} color={C.inkSoft} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultDetail({ sub, onBack }) {
  const sections = [
    ["Lesen", sub.lesenScore, sub.lesenMax, C.blue],
    ["Hören", sub.hörenScore, sub.hörenMax, C.blue],
    ["Sprachbausteine", sub.sprachScore, sub.sprachMax, C.blue],
  ];
  return (
    <div className="sm-anim">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} className="sm-focus" style={{ background: "transparent", border: "none", cursor: "pointer" }}><ArrowLeft size={20} /></button>
        <div className="sm-display" style={{ fontSize: 19, fontWeight: 700 }}>{sub.userName}</div>
      </div>

      <Card style={{ textAlign: "center", marginBottom: 14 }}>
        <div className="sm-mono" style={{ fontSize: 34, fontWeight: 700, color: sub.overallPct >= 60 ? C.ok : C.bad }}>{Math.round(sub.overallPct)}%</div>
        <div style={{ fontSize: 12.5, color: C.inkSoft }}>{sub.examTitle} · {sub.examLevel}</div>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        {sections.map(([l, v, m, c]) => m > 0 && <ScoreBar key={l} label={l} value={v} max={m} color={c} />)}
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><PenTool size={15} color={C.v2} /><span style={{ fontWeight: 600, fontSize: 14 }}>Schreiben — AI baholash</span></div>
        {sub.writing ? (
          <>
            <ScoreBar label="Inhalt" value={sub.writing.inhalt} max={5} color={C.ok} />
            <ScoreBar label="Aufbau" value={sub.writing.aufbau} max={5} color={C.warn} />
            <ScoreBar label="Wortschatz" value={sub.writing.wortschatz} max={5} color={C.bad} />
            <ScoreBar label="Grammatik" value={sub.writing.grammatik} max={5} color={C.blue} />
            <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 8, lineHeight: 1.5 }}>{sub.writing.feedback}</div>
            <details style={{ marginTop: 10 }}>
              <summary style={{ fontSize: 12.5, fontWeight: 600, cursor: "pointer", color: C.v2 }}>Javobni ko'rish</summary>
              <div style={{ fontSize: 13, whiteSpace: "pre-wrap", background: C.paper, padding: 10, borderRadius: 8, marginTop: 8 }}>{sub.writingAnswer}</div>
            </details>
          </>
        ) : <div style={{ fontSize: 12.5, color: C.inkSoft }}>Mavjud emas</div>}
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><Mic size={15} color={C.v2} /><span style={{ fontWeight: 600, fontSize: 14 }}>Sprechen — AI baholash</span></div>
        {sub.speaking ? (
          <>
            <ScoreBar label="Aussprache" value={sub.speaking.aussprache} max={5} color={C.ok} />
            <ScoreBar label="Flüssigkeit" value={sub.speaking.fluessigkeit} max={5} color={C.warn} />
            <ScoreBar label="Grammatik" value={sub.speaking.grammatik} max={5} color={C.blue} />
            <ScoreBar label="Wortschatz" value={sub.speaking.wortschatz} max={5} color={C.bad} />
            <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 8, lineHeight: 1.5 }}>{sub.speaking.feedback}</div>
            <details style={{ marginTop: 10 }}>
              <summary style={{ fontSize: 12.5, fontWeight: 600, cursor: "pointer", color: C.v2 }}>Transkriptni ko'rish</summary>
              <div style={{ fontSize: 13, whiteSpace: "pre-wrap", background: C.paper, padding: 10, borderRadius: 8, marginTop: 8 }}>{sub.speakingAnswer}</div>
            </details>
          </>
        ) : <div style={{ fontSize: 12.5, color: C.inkSoft }}>Mavjud emas</div>}
      </Card>
    </div>
  );
}

/* ================= student: dashboard ================= */

function StudentDashboard({ exams, submissions, userName, onStart }) {
  const totalDone = submissions.length;
  const avgPct = totalDone ? Math.round(submissions.reduce((a, s) => a + s.overallPct, 0) / totalDone) : null;
  const pendingExams = exams.filter((ex) => !submissions.find((s) => s.examId === ex.id));
  const nextExam = pendingExams[0];
  const level = exams[0]?.level || submissions[0]?.examLevel || null;

  // Bo'lim bo'yicha o'rtacha foizlar — haqiqiy submissions asosida hisoblanadi.
  const sectionAvg = (key, maxKey) => {
    const relevant = submissions.filter((s) => s[maxKey] > 0);
    if (!relevant.length) return null;
    const pct = relevant.reduce((a, s) => a + (s[key] / s[maxKey]) * 100, 0) / relevant.length;
    return Math.round(pct);
  };
  const writingAvg = (() => {
    const withWriting = submissions.filter((s) => s.writing);
    if (!withWriting.length) return null;
    const pct = withWriting.reduce((a, s) => {
      const w = s.writing;
      return a + ((w.inhalt + w.aufbau + w.wortschatz + w.grammatik) / 20) * 100;
    }, 0) / withWriting.length;
    return Math.round(pct);
  })();
  const speakingAvg = (() => {
    const withSpeaking = submissions.filter((s) => s.speaking);
    if (!withSpeaking.length) return null;
    const pct = withSpeaking.reduce((a, s) => {
      const sp = s.speaking;
      return a + ((sp.aussprache + sp.fluessigkeit + sp.grammatik + sp.wortschatz) / 20) * 100;
    }, 0) / withSpeaking.length;
    return Math.round(pct);
  })();

  const sections = [
    { icon: BookOpen, label: "Lesen", value: sectionAvg("lesenScore", "lesenMax"), color: C.v1 },
    { icon: Headphones, label: "Hören", value: sectionAvg("hörenScore", "hörenMax"), color: C.blue },
    { icon: PenTool, label: "Schreiben", value: writingAvg, color: C.ok },
    { icon: Mic, label: "Sprechen", value: speakingAvg, color: C.warn },
  ];

  return (
    <div className="sm-anim">
      {/* Gradient banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.v1}, ${C.v2})`, borderRadius: 18, padding: 22, marginBottom: 16, color: "#fff",
      }}>
        <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 2 }}>👋 Salom{userName ? `, ${userName}` : ""}!</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 14 }}>{level ? `TELC ${level} tayyorgarlik` : "TELC imtihoniga tayyorgarlik"}</div>
        {level && (
          <span style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", borderRadius: 999, padding: "5px 12px", fontSize: 12.5, fontWeight: 600 }}>
            Daraja: {level}
          </span>
        )}
        {nextExam && (
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 12, marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11.5, opacity: 0.85 }}>Keyingi imtihon</div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{nextExam.title}</div>
            </div>
            <ChevronRight size={18} />
          </div>
        )}
      </div>

      {/* Mock imtihonni boshlash tugmasi */}
      {nextExam && (
        <button onClick={() => onStart(nextExam)} className="sm-focus sm-btn" style={{
          width: "100%", background: `linear-gradient(135deg, ${C.v2}, ${C.ink})`, color: "#fff", border: "none",
          borderRadius: 14, padding: "15px 18px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 14.5, fontWeight: 700, cursor: "pointer",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}><Zap size={18} /> Mock imtihonni boshlash</span>
          <ChevronRight size={18} />
        </button>
      )}

      {/* Bo'lim statistikasi */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
        {sections.map((s) => (
          <Card key={s.label} style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <s.icon size={16} color={s.color} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</span>
            </div>
            <div className="sm-mono" style={{ fontSize: 22, fontWeight: 700, color: s.value === null ? C.inkSoft : C.ink }}>
              {s.value === null ? "—" : `${s.value}%`}
            </div>
            <div style={{ height: 4, background: C.paper, borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.value || 0}%`, background: s.color, borderRadius: 2 }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Umumiy progress */}
      {avgPct !== null && (
        <Card style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: avgPct >= 60 ? C.okBg : C.warnBg,
          }}>
            <TrendingUp size={22} color={avgPct >= 60 ? C.ok : C.warn} />
          </div>
          <div>
            <div className="sm-mono" style={{ fontSize: 20, fontWeight: 700 }}>{avgPct}%</div>
            <div style={{ fontSize: 12.5, color: C.inkSoft }}>{totalDone} ta imtihon yakunlangan o'rtacha natija</div>
          </div>
        </Card>
      )}

      {/* Imtihonlar ro'yxati */}
      <div className="sm-display" style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Imtihonlar</div>
      {exams.length === 0 ? (
        <EmptyState icon={BookOpen} title="Hozircha imtihon yo'q" desc="Ustozingiz yangi imtihon yaratganda shu yerda ko'rinadi." />
      ) : (
        <div style={{ display: "grid", gap: 12, marginBottom: 26 }}>
          {exams.map((ex) => {
            const done = submissions.find((s) => s.examId === ex.id);
            return (
              <Card key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{ex.title}</div>
                  <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>Daraja {ex.level}</div>
                </div>
                {done ? (
                  <span className="sm-mono" style={{ fontWeight: 700, fontSize: 16, color: done.overallPct >= 60 ? C.ok : C.bad }}>{Math.round(done.overallPct)}%</span>
                ) : (
                  <Btn onClick={() => onStart(ex)}>Boshlash</Btn>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {submissions.length > 0 && (
        <>
          <div className="sm-display" style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Natijalarim</div>
          <div style={{ display: "grid", gap: 12 }}>
            {submissions.slice().reverse().map((s) => (
              <Card key={s.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{s.examTitle}</div>
                  <span className="sm-mono" style={{ fontWeight: 700, fontSize: 17, color: s.overallPct >= 60 ? C.ok : C.bad }}>{Math.round(s.overallPct)}%</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12 }}>
                  {s.lesenMax > 0 && <div style={{ color: C.inkSoft }}>Lesen: <b style={{ color: C.ink }}>{s.lesenScore}/{s.lesenMax}</b></div>}
                  {s.hörenMax > 0 && <div style={{ color: C.inkSoft }}>Hören: <b style={{ color: C.ink }}>{s.hörenScore}/{s.hörenMax}</b></div>}
                  {s.sprachMax > 0 && <div style={{ color: C.inkSoft }}>Sprachbausteine: <b style={{ color: C.ink }}>{s.sprachScore}/{s.sprachMax}</b></div>}
                  {s.writing && <div style={{ color: C.inkSoft }}>Schreiben: <b style={{ color: C.ink }}>{(s.writing.inhalt + s.writing.aufbau + s.writing.wortschatz + s.writing.grammatik).toFixed(1)}/20</b></div>}
                  {s.speaking && <div style={{ color: C.inkSoft }}>Sprechen: <b style={{ color: C.ink }}>{(s.speaking.aussprache + s.speaking.fluessigkeit + s.speaking.grammatik + s.speaking.wortschatz).toFixed(1)}/20</b></div>}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ================= student: take exam ================= */

function ExamSection({ icon: Icon, title, questions, answers, onAnswer }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Icon size={17} color={C.v2} /><span className="sm-display" style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {questions.map((q, i) => (
          <Card key={q.id}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{i + 1}. {q.question}</div>
            <div style={{ display: "grid", gap: 7 }}>
              {q.options.map((opt, oi) => opt.trim() && (
                <button key={oi} onClick={() => onAnswer(q.id, oi)} className="sm-focus sm-btn" style={{
                  textAlign: "left", padding: "9px 12px", borderRadius: 10, fontSize: 13.5,
                  border: `1px solid ${answers[q.id] === oi ? C.v2 : C.line}`,
                  background: answers[q.id] === oi ? `${C.v1}1A` : "transparent", cursor: "pointer", color: C.ink,
                }}>
                  <span className="sm-mono" style={{ marginRight: 8, color: C.inkSoft }}>{String.fromCharCode(65 + oi)}</span>{opt}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SpeakingRecorder({ value, onChange }) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = "de-DE";
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = value || "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + " ";
        else interim += t;
      }
      onChange((finalText + interim).trim());
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    recRef.current = rec;
    return () => { try { rec.stop(); } catch (e) {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    if (!recRef.current) return;
    if (recording) { recRef.current.stop(); setRecording(false); }
    else { try { recRef.current.start(); setRecording(true); } catch (e) {} }
  };

  return (
    <div>
      {supported ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <button onClick={toggle} className="sm-focus sm-btn" style={{
            width: 76, height: 76, borderRadius: "50%", border: "none", cursor: "pointer",
            background: recording ? C.bad : `linear-gradient(135deg, ${C.v1}, ${C.v2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }} className={recording ? "sm-recpulse" : ""}>
            {recording ? <Square size={24} color="#fff" /> : <Mic size={28} color="#fff" />}
          </button>
          <span style={{ fontSize: 12.5, color: C.inkSoft, fontWeight: 600 }}>
            {recording ? "Yozilmoqda... bosib to'xtating" : "Gapirish uchun bosing"}
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.warnBg, color: C.warn, padding: 10, borderRadius: 9, fontSize: 12.5, marginBottom: 12 }}>
          <AlertCircle size={15} /> Brauzeringiz ovozni matnga aylantirishni qo'llab-quvvatlamaydi. Quyiga qo'lda yozing.
        </div>
      )}
      <textarea
        className="sm-focus" style={{ ...inputStyle, minHeight: 130, resize: "vertical" }}
        placeholder="Nutqingiz transkripti shu yerda chiqadi (yoki qo'lda yozing)..."
        value={value} onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TakeExam({ exam, onExit, onDone }) {
  const s = exam.sections;
  const stages = ["intro",
    s.lesen.questions.length ? "lesen" : null,
    s.hören.questions.length ? "hören" : null,
    s.sprachbausteine.questions.length ? "sprachbausteine" : null,
    "schreiben", "sprechen", "grading", "review"].filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [lesenAns, setLesenAns] = useState({});
  const [hörenAns, setHörenAns] = useState({});
  const [sprachAns, setSprachAns] = useState({});
  const [writingAnswer, setWritingAnswer] = useState("");
  const [speakingAnswer, setSpeakingAnswer] = useState("");
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState("");
  const [result, setResult] = useState(null);
  const stage = stages[idx];
  const score = (qs, ans) => qs.reduce((acc, q) => acc + (ans[q.id] === q.correct ? 1 : 0), 0);
  const next = () => setIdx(Math.min(stages.length - 1, idx + 1));
  const prev = () => setIdx(Math.max(0, idx - 1));

  const runGrading = async () => {
    setGrading(true);
    setGradeError("");
    try {
      const [writing, speaking] = await Promise.all([
        gradeWriting(s.schreiben.prompt, writingAnswer, exam.level),
        gradeSpeaking(s.sprechen.prompt, speakingAnswer, exam.level),
      ]);
      const lesenScore = score(s.lesen.questions, lesenAns), lesenMax = s.lesen.questions.length;
      const hörenScore = score(s.hören.questions, hörenAns), hörenMax = s.hören.questions.length;
      const sprachScore = score(s.sprachbausteine.questions, sprachAns), sprachMax = s.sprachbausteine.questions.length;
      const writingPct = ((writing.inhalt + writing.aufbau + writing.wortschatz + writing.grammatik) / 20) * 100;
      const speakingPct = ((speaking.aussprache + speaking.fluessigkeit + speaking.grammatik + speaking.wortschatz) / 20) * 100;
      const pcts = [];
      if (lesenMax) pcts.push((lesenScore / lesenMax) * 100);
      if (hörenMax) pcts.push((hörenScore / hörenMax) * 100);
      if (sprachMax) pcts.push((sprachScore / sprachMax) * 100);
      pcts.push(writingPct, speakingPct);
      const overallPct = pcts.reduce((a, b) => a + b, 0) / pcts.length;
      setResult({ lesenScore, lesenMax, hörenScore, hörenMax, sprachScore, sprachMax, writing, speaking, overallPct });
      setIdx(stages.indexOf("review"));
    } catch (e) {
      setGradeError("AI baholashda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    }
    setGrading(false);
  };

  useEffect(() => { if (stage === "grading") runGrading(); /* eslint-disable-next-line */ }, [stage]);

  const finish = () => {
    onDone({
      id: uid(), examId: exam.id, examTitle: exam.title, examLevel: exam.level,
      writingAnswer, speakingAnswer, ...result, submittedAt: Date.now(),
    });
  };

  return (
    <div className="sm-anim">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <button onClick={onExit} className="sm-focus" style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.inkSoft, fontSize: 13 }}><X size={16} /> Chiqish</button>
        <div className="sm-mono" style={{ fontSize: 12, color: C.inkSoft }}>{Math.min(idx + 1, stages.length)} / {stages.length}</div>
      </div>
      <div style={{ height: 4, background: C.line, borderRadius: 2, marginBottom: 22, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((idx + 1) / stages.length) * 100}%`, background: `linear-gradient(90deg, ${C.v1}, ${C.v2})`, transition: "width .3s ease" }} />
      </div>

      {stage === "intro" && (
        <Card style={{ textAlign: "center", padding: "32px 22px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Logo size={48} /></div>
          <div className="sm-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{exam.title}</div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 22 }}>Daraja {exam.level}. Lesen → Hören → Sprachbausteine → Schreiben → Sprechen.</div>
          <Btn onClick={next}>Boshlash</Btn>
        </Card>
      )}

      {stage === "lesen" && (
        <div>
          {s.lesen.passage && <Card style={{ marginBottom: 14, fontSize: 13.5, lineHeight: 1.6, background: C.paper2 }}>{s.lesen.passage}</Card>}
          <ExamSection icon={BookOpen} title="Lesen" questions={s.lesen.questions} answers={lesenAns} onAnswer={(id, i) => setLesenAns({ ...lesenAns, [id]: i })} />
        </div>
      )}

      {stage === "hören" && (
        <div>
          {s.hören.audioUrl && (
            <Card style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <Headphones size={18} color={C.v2} />
              <a href={s.hören.audioUrl} target="_blank" rel="noreferrer" style={{ color: C.ink, fontSize: 13.5, fontWeight: 600, textDecoration: "underline" }}>Audio yozuvni eshitish</a>
            </Card>
          )}
          <ExamSection icon={Headphones} title="Hören" questions={s.hören.questions} answers={hörenAns} onAnswer={(id, i) => setHörenAns({ ...hörenAns, [id]: i })} />
        </div>
      )}

      {stage === "sprachbausteine" && (
        <ExamSection icon={Sparkles} title="Sprachbausteine" questions={s.sprachbausteine.questions} answers={sprachAns} onAnswer={(id, i) => setSprachAns({ ...sprachAns, [id]: i })} />
      )}

      {stage === "schreiben" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><PenTool size={16} color={C.v2} /><span style={{ fontWeight: 600, fontSize: 15 }}>Schreiben</span></div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, background: C.paper, padding: 12, borderRadius: 10, marginBottom: 12 }}>{s.schreiben.prompt}</div>
          <textarea className="sm-focus" style={{ ...inputStyle, minHeight: 180, resize: "vertical" }} placeholder="Javobingizni shu yerga yozing..." value={writingAnswer} onChange={(e) => setWritingAnswer(e.target.value)} />
          <div className="sm-mono" style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 6, textAlign: "right" }}>{writingAnswer.trim().split(/\s+/).filter(Boolean).length} so'z</div>
        </Card>
      )}

      {stage === "sprechen" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><Mic size={16} color={C.v2} /><span style={{ fontWeight: 600, fontSize: 15 }}>Sprechen</span></div>
          <div style={{ fontSize: 13.5, lineHeight: 1.55, background: C.paper, padding: 12, borderRadius: 10, marginBottom: 14 }}>{s.sprechen.prompt}</div>
          <SpeakingRecorder value={speakingAnswer} onChange={setSpeakingAnswer} />
        </Card>
      )}

      {stage === "grading" && (
        <Card style={{ textAlign: "center", padding: "40px 22px" }}>
          <Loader2 size={28} className="sm-spin" style={{ color: C.v2, marginBottom: 14 }} />
          <div className="sm-display" style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>AI baholamoqda...</div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: gradeError ? 14 : 0 }}>Schreiben va Sprechen javoblaringiz tahlil qilinmoqda</div>
          {gradeError && (
            <>
              <div style={{ color: C.bad, fontSize: 12.5, marginBottom: 12 }}>{gradeError}</div>
              <Btn icon={RotateCcw} variant="ghost" onClick={runGrading}>Qaytadan urinish</Btn>
            </>
          )}
        </Card>
      )}

      {stage === "review" && result && (
        <div>
          <Card style={{ textAlign: "center", padding: "26px 20px", marginBottom: 14 }}>
            <CheckCircle2 size={26} color={C.ok} style={{ marginBottom: 8 }} />
            <div className="sm-mono" style={{ fontSize: 32, fontWeight: 700, color: result.overallPct >= 60 ? C.ok : C.bad }}>{Math.round(result.overallPct)}%</div>
            <div style={{ fontSize: 12.5, color: C.inkSoft }}>{exam.level} daraja · Yakuniy natija</div>
          </Card>
          <Card style={{ marginBottom: 12 }}>
            {result.lesenMax > 0 && <ScoreBar label="Lesen" value={result.lesenScore} max={result.lesenMax} color={C.blue} />}
            {result.hörenMax > 0 && <ScoreBar label="Hören" value={result.hörenScore} max={result.hörenMax} color={C.blue} />}
            {result.sprachMax > 0 && <ScoreBar label="Sprachbausteine" value={result.sprachScore} max={result.sprachMax} color={C.blue} />}
          </Card>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>Schreiben</div>
            <ScoreBar label="Inhalt" value={result.writing.inhalt} max={5} color={C.ok} />
            <ScoreBar label="Aufbau" value={result.writing.aufbau} max={5} color={C.warn} />
            <ScoreBar label="Wortschatz" value={result.writing.wortschatz} max={5} color={C.bad} />
            <ScoreBar label="Grammatik" value={result.writing.grammatik} max={5} color={C.blue} />
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 6 }}>{result.writing.feedback}</div>
          </Card>
          <Card style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>Sprechen</div>
            <ScoreBar label="Aussprache" value={result.speaking.aussprache} max={5} color={C.ok} />
            <ScoreBar label="Flüssigkeit" value={result.speaking.fluessigkeit} max={5} color={C.warn} />
            <ScoreBar label="Grammatik" value={result.speaking.grammatik} max={5} color={C.blue} />
            <ScoreBar label="Wortschatz" value={result.speaking.wortschatz} max={5} color={C.bad} />
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 6 }}>{result.speaking.feedback}</div>
          </Card>
          <Btn icon={Send} style={{ width: "100%" }} onClick={finish}>Yakunlash</Btn>
        </div>
      )}

      {!["grading", "review"].includes(stage) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
          <Btn variant="ghost" icon={ChevronLeft} disabled={idx === 0} onClick={prev}>Orqaga</Btn>
          <Btn onClick={next} icon={ChevronRight} style={{ flexDirection: "row-reverse" }}>{stage === "sprechen" ? "Yuborish" : "Keyingisi"}</Btn>
        </div>
      )}
    </div>
  );
}
