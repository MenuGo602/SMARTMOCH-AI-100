import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen, Headphones, PenTool, Mic, Plus, ChevronRight, ChevronLeft,
  X, Award, GraduationCap, ArrowLeft, Save, Send, Loader2, CheckCircle2,
  Clock, Trash2, Users, ClipboardCheck, MessageCircle, Square, Play,
  Sparkles, AlertCircle, RotateCcw,
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
      .sm-root { font-family: 'Inter', system-ui, sans-serif; }
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
      <div className="sm-root" style={{ minHeight: 500, background: C.paper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FontLoader />
        <Loader2 size={26} className="sm-spin" style={{ color: C.v2 }} />
      </div>
    );
  }
  if (!role) return <RoleScreen onChoose={chooseRole} />;
  if (!userName) return <NameScreen onSave={saveName} role={role} />;

  return (
    <div className="sm-root" style={{ minHeight: 600, background: C.paper, color: C.ink, display: "flex", flexDirection: "column" }}>
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
            exams={exams} submissions={submissions}
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
    <div className="sm-root" style={{ minHeight: 600, background: `linear-gradient(160deg, ${C.v2}, ${C.ink})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
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
    <div className="sm-root" style={{ minHeight: 600, background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
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

function TeacherDashboard({ exams, submissions, onCreate, onOpenReview, onDeleteExam }) {
  const total = submissions.length;
  const avg = total ? Math.round(submissions.reduce((a, s) => a + s.overallPct, 0) / total) : 0;
  return (
    <div className="sm-anim">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 10 }}>
        <div>
          <div className="sm-display" style={{ fontSize: 21, fontWeight: 700 }}>Boshqaruv paneli</div>
          <div style={{ fontSize: 13, color: C.inkSoft }}>{exams.length} ta imtihon · {total} ta urinish</div>
        </div>
        <Btn icon={Plus} onClick={onCreate}>Yangi imtihon</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[["Imtihonlar", exams.length], ["Urinishlar", total], ["O'rtacha", total ? `${avg}%` : "—"]].map(([l, v]) => (
          <Card key={l} style={{ padding: 14, textAlign: "center" }}>
            <div className="sm-mono" style={{ fontSize: 20, fontWeight: 700, color: C.v2 }}>{v}</div>
            <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 2 }}>{l}</div>
          </Card>
        ))}
      </div>

      <Card onClick={onOpenReview} style={{ marginBottom: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.blueBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ClipboardCheck size={18} color={C.blue} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>Natijalarni ko'rish</div>
            <div style={{ fontSize: 12.5, color: C.inkSoft }}>AI baholagan ishlarni tekshiring</div>
          </div>
        </div>
        <ChevronRight size={18} color={C.inkSoft} />
      </Card>

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

const emptyMCQ = () => ({ id: uid(), question: "", options: ["", "", "", ""], correct: 0 });

function MCQBuilder({ title, icon: Icon, items, onAdd, onUpdate, onRemove }) {
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
            <input className="sm-focus" style={{ ...inputStyle, marginBottom: 8 }} placeholder="Savol matni" value={q.question} onChange={(e) => onUpdate(q.id, { question: e.target.value })} />
            {q.options.map((opt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <button onClick={() => onUpdate(q.id, { correct: i })} title="To'g'ri javob" className="sm-focus" style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${q.correct === i ? C.ok : C.line}`, background: q.correct === i ? C.ok : "transparent", cursor: "pointer",
                }} />
                <input className="sm-focus" style={{ ...inputStyle, padding: "7px 10px", fontSize: 13.5 }} placeholder={`Variant ${String.fromCharCode(65 + i)}`}
                  value={opt} onChange={(e) => { const opts = [...q.options]; opts[i] = e.target.value; onUpdate(q.id, { options: opts }); }} />
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateExam({ onCancel, onSave, saving }) {
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("B1");
  const [lesenPassage, setLesenPassage] = useState("");
  const [lesenQ, setLesenQ] = useState([]);
  const [audioUrl, setAudioUrl] = useState("");
  const [hörenQ, setHörenQ] = useState([]);
  const [sprachQ, setSprachQ] = useState([]);
  const [schreibenPrompt, setSchreibenPrompt] = useState("");
  const [sprechenPrompt, setSprechenPrompt] = useState("");
  const [step, setStep] = useState(0);
  const steps = ["Asosiy", "Lesen", "Hören", "Sprachbausteine", "Schreiben", "Sprechen"];

  const mk = (list, setFn) => ({
    onAdd: () => setFn([...list, emptyMCQ()]),
    onUpdate: (id, patch) => setFn(list.map((q) => (q.id === id ? { ...q, ...patch } : q))),
    onRemove: (id) => setFn(list.filter((q) => q.id !== id)),
  });

  const canSave = title.trim() && (lesenQ.length + hörenQ.length + sprachQ.length > 0) && schreibenPrompt.trim() && sprechenPrompt.trim();

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
          <Field label="Daraja">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                <button key={l} onClick={() => setLevel(l)} className="sm-focus sm-mono" style={{
                  padding: "8px 14px", borderRadius: 10, fontWeight: 700, fontSize: 13,
                  border: `1px solid ${level === l ? C.v2 : C.line}`, background: level === l ? `${C.v1}20` : "transparent", color: C.ink, cursor: "pointer",
                }}>{l}</button>
              ))}
            </div>
          </Field>
        </Card>
      )}

      {step === 1 && (
        <>
          <Card style={{ marginBottom: 14 }}>
            <Field label="O'qish matni (Lesen)"><textarea className="sm-focus" style={{ ...inputStyle, minHeight: 110, resize: "vertical" }} value={lesenPassage} onChange={(e) => setLesenPassage(e.target.value)} placeholder="Talaba o'qiydigan matn..." /></Field>
          </Card>
          <MCQBuilder title="Lesen savollari" icon={BookOpen} items={lesenQ} {...mk(lesenQ, setLesenQ)} />
        </>
      )}

      {step === 2 && (
        <>
          <Card style={{ marginBottom: 14 }}>
            <Field label="Audio havola" hint="YouTube, Telegram fayl link va h.k."><input className="sm-focus" style={inputStyle} value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://..." /></Field>
          </Card>
          <MCQBuilder title="Hören savollari" icon={Headphones} items={hörenQ} {...mk(hörenQ, setHörenQ)} />
        </>
      )}

      {step === 3 && (
        <MCQBuilder title="Sprachbausteine (grammatika/lug'at)" icon={Sparkles} items={sprachQ} {...mk(sprachQ, setSprachQ)} />
      )}

      {step === 4 && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><PenTool size={16} color={C.v2} /><span style={{ fontWeight: 600, fontSize: 14.5 }}>Schreiben topshirig'i</span></div>
          <Field label="Talabaga ko'rsatiladigan topshiriq">
            <textarea className="sm-focus" style={{ ...inputStyle, minHeight: 110, resize: "vertical" }} value={schreibenPrompt} onChange={(e) => setSchreibenPrompt(e.target.value)} placeholder="Masalan: Do'stingizga oxirgi sayohatingiz haqida xat yozing." />
          </Field>
          <div style={{ fontSize: 12, color: C.inkSoft, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={13} color={C.v1} /> AI avtomatik baholaydi: Inhalt, Aufbau, Wortschatz, Grammatik</div>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><Mic size={16} color={C.v2} /><span style={{ fontWeight: 600, fontSize: 14.5 }}>Sprechen topshirig'i</span></div>
          <Field label="Talabaga ko'rsatiladigan mavzu/savol">
            <textarea className="sm-focus" style={{ ...inputStyle, minHeight: 110, resize: "vertical" }} value={sprechenPrompt} onChange={(e) => setSprechenPrompt(e.target.value)} placeholder="Masalan: O'zingiz haqingizda gapirib bering." />
          </Field>
          <div style={{ fontSize: 12, color: C.inkSoft, display: "flex", alignItems: "center", gap: 6 }}><Sparkles size={13} color={C.v1} /> Talaba gapiradi, AI transkriptga asoslanib Aussprache, Flüssigkeit, Grammatik, Wortschatz bo'yicha baholaydi</div>
        </Card>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
        <Btn variant="ghost" icon={ChevronLeft} disabled={step === 0} onClick={() => setStep(step - 1)}>Orqaga</Btn>
        {step < steps.length - 1 ? (
          <Btn onClick={() => setStep(step + 1)} icon={ChevronRight} style={{ flexDirection: "row-reverse" }}>Keyingisi</Btn>
        ) : (
          <Btn icon={Save} disabled={!canSave || saving} onClick={() => onSave({
            id: uid(), title: title.trim(), level,
            sections: {
              lesen: { passage: lesenPassage.trim(), questions: lesenQ.filter((q) => q.question.trim()) },
              hören: { audioUrl: audioUrl.trim(), questions: hörenQ.filter((q) => q.question.trim()) },
              sprachbausteine: { questions: sprachQ.filter((q) => q.question.trim()) },
              schreiben: { prompt: schreibenPrompt.trim() },
              sprechen: { prompt: sprechenPrompt.trim() },
            },
          })}>{saving ? "Saqlanmoqda..." : "Imtihonni saqlash"}</Btn>
        )}
      </div>
      {!canSave && step === steps.length - 1 && (
        <div style={{ fontSize: 12, color: C.bad, marginTop: 8, textAlign: "right" }}>Nom, kamida bitta test savoli, Schreiben va Sprechen topshirig'i to'ldirilishi kerak.</div>
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

function StudentDashboard({ exams, submissions, onStart }) {
  return (
    <div className="sm-anim">
      <div className="sm-display" style={{ fontSize: 21, fontWeight: 700, marginBottom: 4 }}>Imtihonlar</div>
      <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 18 }}>Ustozingiz tomonidan tayyorlangan mock imtihonlar</div>

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
