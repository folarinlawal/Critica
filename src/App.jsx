import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "./supabase";
import ResultsSection from "./ResultsSection.jsx";
 
const PERSONAS = [
  { id: "first-time", label: "First-Time User", emoji: "🌱", description: "No prior context, discovering the product for the first time", traits: "Cautious, reads carefully, easily confused by jargon, needs clear signposting" },
  { id: "power-user", label: "Power User", emoji: "⚡", description: "Experienced, efficiency-driven, knows what they want", traits: "Impatient with friction, uses shortcuts, frustrated by unnecessary steps" },
  { id: "low-digital", label: "Low Digital Literacy", emoji: "🧭", description: "Infrequent tech user, relies on familiar patterns", traits: "Needs familiar UI patterns, avoids risk, easily lost without clear feedback" },
  { id: "mobile-first", label: "Mobile-First User", emoji: "📱", description: "Primarily on mobile, often in distracted contexts", traits: "Thumb navigation, short attention span, sensitive to load times and tap targets" },
  { id: "accessibility", label: "Accessibility Needs", emoji: "♿", description: "Uses assistive technology or has visual/motor constraints", traits: "Relies on labels, contrast, keyboard nav, and logical reading order" },
  { id: "custom", label: "Custom Persona", emoji: "✏️", description: "Define your own user", traits: "" }
];
const PRODUCT_TYPES = ["Mobile App", "Web App / SaaS", "E-commerce", "Marketing / Landing Page", "Onboarding Flow", "Other"];
const TEAM_SIZES = [
  { id: "solo", label: "Solo", desc: "Just me" },
  { id: "small", label: "Small", desc: "2–5 people" },
  { id: "medium", label: "Medium", desc: "6–15 people" },
  { id: "large", label: "Large", desc: "15+ people" }
];
const TIMELINE_OPTIONS = [
  { id: "this-week", label: "This week" },
  { id: "this-sprint", label: "This sprint" },
  { id: "this-quarter", label: "This quarter" },
  { id: "no-deadline", label: "No deadline" }
];
const SCOPE_LIMITS = [
  { id: "no-new-features", label: "No new features" },
  { id: "no-backend", label: "No backend changes" },
  { id: "visual-only", label: "Visual changes only" },
  { id: "copy-only", label: "Copy changes only" },
  { id: "no-limits", label: "No limits" }
];
 
const C = {
  bg: "#F7F6F3", surface: "#FFFFFF", surfaceAlt: "#F0EEE9",
  border: "rgba(0,0,0,0.08)", borderMed: "rgba(0,0,0,0.18)",
  text: "#1A1A1A", textMed: "#4A4A4A", textMuted: "#6B7280",
  accent: "#1A1A2E", indigo: "#4F46E5", indigoLight: "rgba(79,70,229,0.08)", indigoBorder: "rgba(79,70,229,0.2)",
  green: "#16A34A", greenLight: "rgba(22,163,74,0.08)", greenBorder: "rgba(22,163,74,0.2)",
  amber: "#D97706", amberLight: "rgba(217,119,6,0.08)", amberBorder: "rgba(217,119,6,0.2)",
  red: "#DC2626", redLight: "rgba(220,38,38,0.08)", redBorder: "rgba(220,38,38,0.2)",
};
 
const inputSt = {
  width: "100%", padding: "12px 14px", borderRadius: 8,
  border: `1.5px solid ${C.border}`, background: C.surface,
  color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box",
  fontFamily: "inherit", transition: "border-color 0.15s"
};
const chipSt = (active) => ({
  padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
  border: `1.5px solid ${active ? C.indigo : C.border}`,
  background: active ? C.indigoLight : "transparent",
  color: active ? C.indigo : C.textMuted, cursor: "pointer", transition: "all 0.15s"
});
const btnPrimary = { padding: "12px 24px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const btnGhost = { padding: "10px 18px", borderRadius: 8, border: `1.5px solid ${C.borderMed}`, background: "transparent", color: C.textMed, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const card = { background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "20px 24px" };
 
function Section({ label, sublabel, children }) {
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMuted }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{sublabel}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}
 
function AnalysingLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const messages = [
    "Simulating user experience...",
    "Analysing friction points...",
    "Evaluating clarity and confidence...",
    "Splitting findings by constraints...",
    "Almost there..."
  ];
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <svg width="56" height="56" viewBox="0 0 56 56" style={{ marginBottom: 24 }}>
        <circle cx="28" cy="28" r="22" fill="none" stroke="#E5E7EB" strokeWidth="4" />
        <circle cx="28" cy="28" r="22" fill="none" stroke="#1A1A2E" strokeWidth="4"
          strokeLinecap="round" strokeDasharray="138" strokeDashoffset="138"
          style={{ animation: "fillUp 2.5s ease-in-out infinite", transformOrigin: "center", transform: "rotate(-90deg)" }}
        />
      </svg>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: C.text }}>Running simulation...</div>
      <div style={{ color: C.textMuted, fontSize: 14, minHeight: 20 }}>{messages[msgIndex]}</div>
      <style>{`@keyframes fillUp{0%{stroke-dashoffset:138;opacity:1}70%{stroke-dashoffset:0;opacity:1}85%{stroke-dashoffset:0;opacity:0}100%{stroke-dashoffset:138;opacity:0}}`}</style>
    </div>
  );
}
 
function SimulationCard({ sim, onView, projectName }) {
  const date = new Date(sim.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const personaLabel = sim.persona === "Custom Persona" ? "Custom Persona" : sim.persona;
  return (
    <div style={{ ...card, padding: "22px 24px", cursor: "pointer", transition: "box-shadow 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
      onClick={() => onView(sim)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            {projectName && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: C.indigoLight, color: C.indigo, border: `1px solid ${C.indigoBorder}`, letterSpacing: "0.04em" }}>
                ◈ {projectName}
              </span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>{sim.name}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: C.surfaceAlt, color: C.textMed, border: `1px solid ${C.borderMed}` }}>{sim.product_type}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: C.surfaceAlt, color: C.textMed, border: `1px solid ${C.borderMed}` }}>{personaLabel}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.textMed, fontStyle: "italic" }}>"{sim.narrative}"</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: C.textMuted }}>{date}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>✓ {sim.act_now?.length || 0} to fix</span>
        <span style={{ fontSize: 11, color: C.amber, fontWeight: 600 }}>⊞ {sim.roadmap?.length || 0} on roadmap</span>
      </div>
    </div>
  );
}
 
export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ first_name: "", last_name: "" });
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState("login");
  const [authMode, setAuthMode] = useState("auth");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFirstName, setAuthFirstName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authMessage, setAuthMessage] = useState(null);
 
  const [view, setView] = useState("home");
  const [step, setStep] = useState("input");
  const [inputType, setInputType] = useState("screenshots");
  const [figmaUrl, setFigmaUrl] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [customPersona, setCustomPersona] = useState("");
  const [productType, setProductType] = useState("");
  const [context, setContext] = useState("");
  const [simName, setSimName] = useState("");
  const [teamSize, setTeamSize] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [scopeLimits, setScopeLimits] = useState([]);
  const [otherConstraints, setOtherConstraints] = useState("");
 
  const [critique, setCritique] = useState(null);
  const [currentSimId, setCurrentSimId] = useState(null);
  const [currentPMSummary, setCurrentPMSummary] = useState("");
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
 
  const [simulations, setSimulations] = useState([]);
  const [selectedSim, setSelectedSim] = useState(null);
  const [simConversations, setSimConversations] = useState({});
  const [deleteMessage, setDeleteMessage] = useState(null);
  const [showDetailMenu, setShowDetailMenu] = useState(false);
  const [confirmDeleteDetail, setConfirmDeleteDetail] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
 
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [projectMenuId, setProjectMenuId] = useState(null);
  const [renamingProjectId, setRenamingProjectId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
  const [simProjectId, setSimProjectId] = useState(null);
  const [settingsFirstName, setSettingsFirstName] = useState("");
  const [settingsLastName, setSettingsLastName] = useState("");
  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsPassword, setSettingsPassword] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);
 
  const fileInputRef = useRef();
 
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);
 
  useEffect(() => { if (user) { loadProjects(); loadSimulations(); } }, [user]);
 
  const loadProfile = (u) => {
    const meta = u.user_metadata || {};
    setProfile({ first_name: meta.first_name || "", last_name: meta.last_name || "" });
    setSettingsFirstName(meta.first_name || "");
    setSettingsLastName(meta.last_name || "");
    setSettingsEmail(u.email || "");
  };
 
  const greeting = () => profile.first_name ? `Hi ${profile.first_name}` : "Hi there";
 
  const handleAuth = async (type) => {
    setAuthLoading(true); setAuthError(null); setAuthMessage(null);
    try {
      if (type === "signup") {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { first_name: authFirstName } } });
        if (error) throw error;
        setAuthMessage("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
      }
    } catch (err) { setAuthError(err.message); }
    finally { setAuthLoading(false); }
  };
 
  const handleForgotPassword = async () => {
    setAuthLoading(true); setAuthError(null); setAuthMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, { redirectTo: window.location.origin });
      if (error) throw error;
      setAuthMessage("Check your email for a password reset link.");
    } catch (err) { setAuthError(err.message); }
    finally { setAuthLoading(false); }
  };
 
  const handleSignOut = async () => { await supabase.auth.signOut(); reset(); setShowAuth(false); };
 
  const saveSettings = async () => {
    setSettingsSaving(true); setSettingsMessage(null);
    try {
      const updates = { data: { first_name: settingsFirstName, last_name: settingsLastName } };
      if (settingsEmail !== user.email) updates.email = settingsEmail;
      if (settingsPassword) updates.password = settingsPassword;
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      setProfile({ first_name: settingsFirstName, last_name: settingsLastName });
      setSettingsPassword("");
      setSettingsMessage("Settings saved successfully!");
    } catch (err) { setSettingsMessage(`Error: ${err.message}`); }
    finally { setSettingsSaving(false); }
  };
 
  const loadProjects = async () => {
    if (!user) return;
    const { data } = await supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    if (data) setProjects(data);
  };

  const loadSimulations = async () => {
    if (!user) return;
    const { data } = await supabase.from("simulations").select("*, projects(name)").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setSimulations(data);
  };

  const createProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    const { data } = await supabase.from("projects").insert({ user_id: user.id, name }).select().single();
    if (data) {
      setProjects(prev => [...prev, data]);
      setNewProjectName("");
      setShowNewProjectInput(false);
    }
  };

  const renameProject = async (id) => {
    const name = renameValue.trim();
    if (!name) return;
    await supabase.from("projects").update({ name }).eq("id", id);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    setRenamingProjectId(null);
    setRenameValue("");
    setProjectMenuId(null);
  };

  const deleteProject = async (id) => {
    await supabase.from("simulations").delete().eq("project_id", id);
    await supabase.from("projects").delete().eq("id", id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setSimulations(prev => prev.filter(s => s.project_id !== id));
    setDeletingProjectId(null);
    setDeleteConfirmValue("");
    setProjectMenuId(null);
  };
 
  const loadSimulationDetail = async (sim) => {
    setSelectedSim(sim);
    setShowDetailMenu(false);
    setConfirmDeleteDetail(false);
    setDetailDrawerOpen(false);
    const { data } = await supabase.from("conversations").select("*").eq("simulation_id", sim.id);
    if (data) {
      const convMap = {};
      data.forEach(c => {
        convMap[c.finding_title] = c.messages;
        convMap[c.finding_title + "_resolved"] = c.resolved || false;
      });
      setSimConversations(convMap);
    }
    setView("detail");
  };
 
  const deleteSimulation = async (id) => {
    await supabase.from("conversations").delete().eq("simulation_id", id);
    await supabase.from("simulations").delete().eq("id", id);
    setSimulations(prev => prev.filter(s => s.id !== id));
    setDeleteMessage("Simulation deleted.");
    setTimeout(() => setDeleteMessage(null), 3000);
    reset();
  };
 
  const handleFiles = useCallback((newFiles) => {
    const arr = Array.from(newFiles);
    setFiles(prev => [...prev, ...arr].slice(0, inputType === "recording" ? 1 : 8));
  }, [inputType]);
 
  const toggleScope = (id) => setScopeLimits(prev =>
    id === "no-limits" ? ["no-limits"] :
    prev.includes(id) ? prev.filter(s => s !== id) : [...prev.filter(s => s !== "no-limits"), id]
  );
 
  const canProceedToConstraints = () => {
    const hasInput = inputType === "figma" ? figmaUrl.trim().length > 0 : files.length > 0;
    const hasPersona = selectedPersona && (selectedPersona !== "custom" || customPersona.trim().length > 0);
    return hasInput && hasPersona && productType.length > 0 && !!simProjectId;
  };
  const canAnalyse = () => teamSize && timeline && scopeLimits.length > 0;
 
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const extractFramesFromVideo = (file) => new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const MAX_FRAMES = 24;
    const SAMPLE_INTERVAL = 0.5;
    const CHANGE_THRESHOLD = 0.04;
    const COMPARE_SIZE = 32;

    const getPixelData = () => {
      const tmp = document.createElement("canvas");
      tmp.width = COMPARE_SIZE;
      tmp.height = COMPARE_SIZE;
      tmp.getContext("2d").drawImage(video, 0, 0, COMPARE_SIZE, COMPARE_SIZE);
      return tmp.getContext("2d").getImageData(0, 0, COMPARE_SIZE, COMPARE_SIZE).data;
    };

    const frameDiff = (a, b) => {
      let diff = 0;
      for (let i = 0; i < a.length; i += 4) {
        diff += Math.abs(a[i] - b[i]) + Math.abs(a[i+1] - b[i+1]) + Math.abs(a[i+2] - b[i+2]);
      }
      return diff / (a.length / 4 * 255 * 3);
    };

    video.addEventListener("loadedmetadata", () => {
      const MAX_DIM = 1000;
      const scale = Math.min(1, MAX_DIM / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const duration = video.duration;
      const times = [];
      for (let t = 0; t < duration; t += SAMPLE_INTERVAL) times.push(t);

      const capturedFrames = [];
      let lastPixelData = null;
      let timeIndex = 0;

      const seekNext = () => {
        if (timeIndex >= times.length || capturedFrames.length >= MAX_FRAMES) {
          URL.revokeObjectURL(url);
          resolve(capturedFrames);
          return;
        }
        video.currentTime = times[timeIndex++];
      };

      video.addEventListener("seeked", () => {
        const currentPixelData = getPixelData();
        const isChanged = !lastPixelData || frameDiff(lastPixelData, currentPixelData) > CHANGE_THRESHOLD;
        if (isChanged) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          capturedFrames.push(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
          lastPixelData = currentPixelData;
        }
        seekNext();
      });

      seekNext();
    });

    video.addEventListener("error", () => { URL.revokeObjectURL(url); resolve([]); });
    video.load();
  });
 
  const buildConstraintsSummary = () => {
    const ts = TEAM_SIZES.find(t => t.id === teamSize);
    const tl = TIMELINE_OPTIONS.find(t => t.id === timeline);
    const sl = scopeLimits.map(s => SCOPE_LIMITS.find(o => o.id === s)?.label).filter(Boolean);
    return JSON.stringify({ teamSize: ts?.label, timeline: tl?.label, scopeLimits: sl, otherConstraints, customPersonaDescription: selectedPersona === "custom" ? customPersona : null });
  };
 
  const getPersonaDesc = () => {
    const persona = PERSONAS.find(p => p.id === selectedPersona);
    return selectedPersona === "custom" ? customPersona : `${persona?.label} — ${persona?.description}. Traits: ${persona?.traits}`;
  };
 
  const generatePMSummaryFromData = (data, pType, pLabel) => [
    `DESIGN SIMULATION — ${pType?.toUpperCase()}`,
    `Persona Tested: ${pLabel}`,
    ``,
    `DESIGN SIGNALS`,
    data.signals ? [
      `Clarity: ${data.signals.clarity?.rating} — ${data.signals.clarity?.explanation}`,
      `Friction: ${data.signals.friction?.rating} — ${data.signals.friction?.explanation}`,
      `Confidence: ${data.signals.confidence?.rating} — ${data.signals.confidence?.explanation}`,
      `Recovery: ${data.signals.recovery?.rating} — ${data.signals.recovery?.explanation}`,
    ].join("\n") : "Signals not available",
    ``,
    `USER EXPERIENCE SUMMARY`,
    data.narrativeWalkthrough,
    ``,
    `PRIORITY FOCUS`,
    data.priorityFocus,
    ``,
    `ROADMAP OPPORTUNITIES (${data.roadmap?.length || 0} items)`,
    ...(data.roadmap || []).map((item, i) => [
      `${i + 1}. ${item.title} [${item.severity?.toUpperCase()}]`,
      `User Impact: ${item.userImpact}`,
      `Recommendation: ${item.recommendation}`,
      `PM Context: ${item.pmNote}`,
      ``
    ]).flat(),
    `WHAT WE'RE FIXING NOW`,
    ...(data.actNow || []).map((item, i) => `${i + 1}. ${item.title} — ${item.recommendation}`),
    ``,
    `Generated by Lens — AI User Simulation Tool`
  ].join("\n");
 
  const analyse = async () => {
    setStep("analysing"); setError(null);
    try {
      const personaDesc = getPersonaDesc();
      const inputDesc = inputType === "figma" ? `Prototype URL: ${figmaUrl}` : inputType === "screenshots" ? `${files.length} screenshot(s)` : "Screen recording";
      const constraintsSummary = buildConstraintsSummary();
      const persona = PERSONAS.find(p => p.id === selectedPersona);
      const personaLabel = selectedPersona === "custom" ? "Custom Persona" : persona?.label;
 
      const userMessage = `You are an expert UX design critic. Respond ONLY with raw JSON, no markdown.
 
Product: ${productType} | Input: ${inputDesc} | Persona: ${personaDesc} | Context: ${context || "none"}
Constraints: ${constraintsSummary}
${inputType === "recording" ? "The images are sequential frames extracted from a screen recording of a user flow. Analyse them as a connected journey — pay attention to navigation patterns, screen transitions, task completion paths, and how the experience unfolds across steps." : "Analyse the visuals carefully — examine layout, hierarchy, affordances, and clarity."}
 
Return this exact JSON (max 3 actNow, max 3 roadmap, all strings under 25 words):
{"narrativeWalkthrough":"2-3 sentences in first person as the persona","signals":{"clarity":{"rating":"Good|Needs Attention|Critical","explanation":"one sentence on clarity"},"friction":{"rating":"Good|Needs Attention|Critical","explanation":"one sentence — Good means smooth, Critical means high friction"},"confidence":{"rating":"Good|Needs Attention|Critical","explanation":"one sentence on user confidence"},"recovery":{"rating":"Good|Needs Attention|Critical","explanation":"one sentence on error recovery"}},"priorityFocus":"one sentence on the single most impactful change","actNow":[{"severity":"critical|high|medium|low","title":"short title","description":"one sentence","recommendation":"one sentence","effort":"low|medium|high"}],"roadmap":[{"severity":"critical|high|medium|low","title":"short title","description":"one sentence","recommendation":"one sentence","userImpact":"one sentence","pmNote":"one sentence"}],"strengths":["one sentence"]}`;
 
      const content = [];
      if (inputType === "screenshots" && files.length > 0) {
        for (const file of files.slice(0, 8)) {
          if (file.type.startsWith("image/")) {
            const b64 = await fileToBase64(file);
            content.push({ type: "image", source: { type: "base64", media_type: file.type, data: b64 } });
          }
        }
      } else if (inputType === "recording" && files.length > 0) {
        const frames = await extractFramesFromVideo(files[0]);
        for (const frame of frames) {
          content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: frame } });
        }
      }
      content.push({ type: "text", text: userMessage });
 
      const res = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 4000, messages: [{ role: "user", content }] })
      });
 
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `API error ${res.status}`);
 
      const rawText = (data.content || []).map(b => b.text || "").join("").trim();
      const jsonText = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
 
      let parsed;
      try { parsed = JSON.parse(jsonText); }
      catch {
        const start = jsonText.indexOf("{");
        if (start === -1) throw new Error("No JSON in response");
        let depth = 0, end = -1;
        for (let i = start; i < jsonText.length; i++) {
          if (jsonText[i] === "{") depth++;
          else if (jsonText[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
        }
        const fragment = end !== -1 ? jsonText.slice(start, end + 1) : jsonText.slice(start);
        try { parsed = JSON.parse(fragment); }
        catch { parsed = { narrativeWalkthrough: "Response too long — please try again.", signals: {}, actNow: [], roadmap: [], strengths: [], priorityFocus: "Please retry." }; }
      }
 
      const pmSummary = generatePMSummaryFromData(parsed, productType, personaLabel);
      const autoName = `${productType} — ${personaLabel} — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;
 
      const { data: simData } = await supabase.from("simulations").insert({
        user_id: user.id,
        project_id: simProjectId,
        name: simName || autoName,
        product_type: productType,
        input_type: inputType,
        persona: personaLabel,
        context: context || null,
        constraints: constraintsSummary,
        narrative: parsed.narrativeWalkthrough,
        priority_focus: parsed.priorityFocus,
        act_now: parsed.actNow,
        roadmap: parsed.roadmap,
        strengths: parsed.strengths,
        signals: parsed.signals,
        pm_summary: pmSummary
      }).select().single();
 
      if (simData) { setCurrentSimId(simData.id); setSimulations(prev => [simData, ...prev]); }
      setCurrentPMSummary(pmSummary);
      setCritique(parsed);
      setView("result");
      setStep("input");
    } catch (err) {
      setError(`Error: ${err.message}`);
      setStep("constraints");
    }
  };
 
  const reset = () => {
    setView("home"); setCritique(null); setFiles([]);
    setFigmaUrl(""); setSelectedPersona(null); setCustomPersona("");
    setProductType(""); setContext(""); setError(null); setSimName("");
    setTeamSize(null); setTimeline(null); setScopeLimits([]); setOtherConstraints("");
    setCurrentSimId(null); setStep("input"); setCurrentPMSummary("");
    setShowDetailMenu(false); setConfirmDeleteDetail(false); setDetailDrawerOpen(false);
    setSelectedProject(null); setSimProjectId(null);
    setProjectMenuId(null); setRenamingProjectId(null); setDeletingProjectId(null);
    setDeleteConfirmValue(""); setRenameValue("");
  };
 
  const personaDesc = selectedPersona ? getPersonaDesc() : "";
  const constraintsSummary = teamSize ? buildConstraintsSummary() : "{}";
  const initials = profile.first_name
    ? `${profile.first_name[0]}${profile.last_name?.[0] || ""}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";
 
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`* { box-sizing: border-box; } input:focus, textarea:focus { border-color: ${C.indigo} !important; }`}</style>
 
      {/* LANDING + AUTH */}
      {!user && (
        <div style={{ minHeight: "100vh", background: C.bg }}>
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => { setShowAuth(false); setAuthError(null); setAuthMessage(null); }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 14 }}>◎</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>Lens</span>
            </div>
            <button onClick={() => { setAuthView("login"); setShowAuth(true); }} style={{ ...btnGhost, padding: "8px 18px" }}>Log In</button>
          </div>
 
          {!showAuth ? (
            <>
              <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
                <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, background: C.indigoLight, border: `1px solid ${C.indigoBorder}`, color: C.indigo, fontSize: 12, fontWeight: 600, marginBottom: 24, letterSpacing: "0.04em", textTransform: "uppercase" }}>AI User Simulation</div>
                <h1 style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 20px", color: C.text, letterSpacing: "-0.03em" }}>Test your designs before your users do</h1>
                <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: C.textMed, lineHeight: 1.6, margin: "0 0 40px", maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>Simulate how real users experience your designs and surface problems early.</p>
                <button onClick={() => { setAuthView("signup"); setShowAuth(true); }} style={{ ...btnPrimary, padding: "14px 32px", fontSize: 15 }}>Get Started</button>
                <div style={{ marginTop: 12, fontSize: 12, color: C.textMuted }}>Free to use. No credit card required.</div>
              </div>
              <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 80px" }}>
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>How it works</h2>
                  <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>Three steps from design to actionable feedback.</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                  {[
                    { step: "01", title: "Upload your design", desc: "Share a prototype link, screenshots, or a screen recording of your flow." },
                    { step: "02", title: "Choose a user persona", desc: "Pick from research-backed personas or define your own target user." },
                    { step: "03", title: "Get actionable feedback", desc: "Receive findings split into what you can fix now and what goes on the roadmap." }
                  ].map(item => (
                    <div key={item.step} style={{ ...card, padding: "24px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, letterSpacing: "0.08em", marginBottom: 10 }}>{item.step}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: C.textMed, lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: C.accent, padding: "56px 24px", textAlign: "center" }}>
                <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Start simulating today</h2>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", margin: "0 0 28px" }}>Built for designers who want better feedback, faster.</p>
                <button onClick={() => { setAuthView("signup"); setShowAuth(true); }} style={{ padding: "14px 32px", borderRadius: 8, border: "none", background: "#fff", color: C.accent, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Create Free Account</button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
              <div style={{ width: "100%", maxWidth: 400 }}>
                <div style={{ ...card, padding: "28px 32px" }}>
                  {authMode === "forgot" ? (
                    <>
                      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>Reset password</h2>
                      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px" }}>We'll send a reset link to your email.</p>
                      {authMessage && <div style={{ padding: "10px 14px", borderRadius: 8, background: C.greenLight, border: `1px solid ${C.greenBorder}`, color: C.green, fontSize: 13, marginBottom: 16 }}>{authMessage}</div>}
                      {authError && <div style={{ padding: "10px 14px", borderRadius: 8, background: C.redLight, border: `1px solid ${C.redBorder}`, color: C.red, fontSize: 13, marginBottom: 16 }}>{authError}</div>}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email address" type="email" style={inputSt} />
                        <button onClick={handleForgotPassword} disabled={authLoading || !authEmail} style={{ ...btnPrimary, opacity: authLoading || !authEmail ? 0.5 : 1 }}>{authLoading ? "Sending..." : "Send Reset Link"}</button>
                        <button onClick={() => { setAuthMode("auth"); setAuthError(null); setAuthMessage(null); }} style={{ ...btnGhost, textAlign: "center" }}>← Back to Log In</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", gap: 2, marginBottom: 24, background: C.surfaceAlt, borderRadius: 8, padding: 3 }}>
                        {["login", "signup"].map(v => (
                          <button key={v} onClick={() => { setAuthView(v); setAuthError(null); setAuthMessage(null); }}
                            style={{ flex: 1, padding: "9px", borderRadius: 6, border: "none", background: authView === v ? C.surface : "transparent", color: authView === v ? C.text : C.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 600, boxShadow: authView === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                            {v === "login" ? "Log In" : "Sign Up"}
                          </button>
                        ))}
                      </div>
                      {authMessage && <div style={{ padding: "10px 14px", borderRadius: 8, background: C.greenLight, border: `1px solid ${C.greenBorder}`, color: C.green, fontSize: 13, marginBottom: 16 }}>{authMessage}</div>}
                      {authError && <div style={{ padding: "10px 14px", borderRadius: 8, background: C.redLight, border: `1px solid ${C.redBorder}`, color: C.red, fontSize: 13, marginBottom: 16 }}>{authError}</div>}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {authView === "signup" && <input value={authFirstName} onChange={e => setAuthFirstName(e.target.value)} placeholder="What should we call you? (optional)" style={inputSt} />}
                        <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email address" type="email" style={inputSt} />
                        <input value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" type="password" style={inputSt} />
                        <button onClick={() => handleAuth(authView)} disabled={authLoading || !authEmail || !authPassword} style={{ ...btnPrimary, opacity: authLoading || !authEmail || !authPassword ? 0.5 : 1 }}>
                          {authLoading ? "Please wait..." : authView === "login" ? "Log In" : "Create Account"}
                        </button>
                        {authView === "login" && <button onClick={() => { setAuthMode("forgot"); setAuthError(null); setAuthMessage(null); }} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12, cursor: "pointer", textAlign: "center", padding: "4px" }}>Forgot password?</button>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
 
      {/* MAIN APP */}
      {user && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 60px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 32px", borderBottom: `1px solid ${C.border}`, marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={reset}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 14 }}>◎</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>Lens</span>
            </div>
            <button onClick={() => { setView("settings"); setSettingsMessage(null); }} style={{ width: 34, height: 34, borderRadius: "50%", background: C.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {initials}
            </button>
          </div>
 
          {/* HOME */}
          {view === "home" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: "clamp(24px,4vw,34px)", fontWeight: 800, margin: "0 0 6px", color: C.text, letterSpacing: "-0.02em" }}>{greeting()} 👋</h1>
                  <p style={{ fontSize: 15, color: C.textMuted, margin: 0 }}>
                    {projects.length === 0 ? "Create a project to get started." : `${projects.length} project${projects.length === 1 ? "" : "s"}, ${simulations.length} simulation${simulations.length === 1 ? "" : "s"}.`}
                  </p>
                </div>
                <button onClick={() => setView("new")} style={{ ...btnPrimary, padding: "12px 20px", whiteSpace: "nowrap" }}>+ Run a Simulation</button>
              </div>

              {deleteMessage && (
                <div style={{ padding: "12px 16px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700 }}>✓</span> {deleteMessage}
                </div>
              )}

              {/* PROJECTS */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMuted, marginBottom: 16 }}>Projects</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>

                  {/* New Project card — always first */}
                  {!showNewProjectInput ? (
                    <div onClick={() => setShowNewProjectInput(true)}
                      style={{ borderRadius: 12, border: `1.5px dashed ${C.borderMed}`, background: "transparent", padding: "28px 24px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 140, transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.indigoLight; e.currentTarget.style.borderColor = C.indigo; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.borderMed; }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.surfaceAlt, border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: C.textMuted }}>+</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, textAlign: "center" }}>New Project</div>
                    </div>
                  ) : (
                    <div style={{ borderRadius: 12, border: `1.5px solid ${C.indigo}`, background: C.indigoLight, padding: "24px", display: "flex", flexDirection: "column", gap: 12, minHeight: 140, justifyContent: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.indigo, textTransform: "uppercase", letterSpacing: "0.08em" }}>New Project</div>
                      <input
                        autoFocus
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") createProject(); if (e.key === "Escape") { setShowNewProjectInput(false); setNewProjectName(""); } }}
                        placeholder="Project name..."
                        style={{ ...inputSt, fontSize: 13, padding: "9px 12px" }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={createProject} disabled={!newProjectName.trim()} style={{ ...btnPrimary, padding: "7px 14px", fontSize: 12, opacity: newProjectName.trim() ? 1 : 0.4 }}>Create</button>
                        <button onClick={() => { setShowNewProjectInput(false); setNewProjectName(""); }} style={{ ...btnGhost, padding: "7px 12px", fontSize: 12 }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Project cards */}
                  {projects.map(project => {
                    const projectSims = simulations.filter(s => s.project_id === project.id);
                    const lastRun = projectSims[0]?.created_at ? new Date(projectSims[0].created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;
                    const isMenuOpen = projectMenuId === project.id;
                    const isRenaming = renamingProjectId === project.id;
                    const isDeleting = deletingProjectId === project.id;
                    return (
                      <div key={project.id} style={{ borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, padding: "24px", display: "flex", flexDirection: "column", gap: 0, minHeight: 140, cursor: "pointer", transition: "box-shadow 0.15s", position: "relative" }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                        onClick={() => { if (!isMenuOpen && !isRenaming && !isDeleting) { setSelectedProject(project); setView("project"); } }}>

                        {/* Card header */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: "#fff", fontSize: 14 }}>◈</span>
                          </div>
                          <div style={{ position: "relative" }}>
                            <button onClick={e => { e.stopPropagation(); setProjectMenuId(isMenuOpen ? null : project.id); setRenamingProjectId(null); setDeletingProjectId(null); }}
                              style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                              {[0,1,2].map(i => <span key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: C.textMuted, display: "block" }} />)}
                            </button>
                            {isMenuOpen && (
                              <>
                                <div onClick={e => { e.stopPropagation(); setProjectMenuId(null); }} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                                <div style={{ position: "absolute", right: 0, top: 32, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 20, minWidth: 160, overflow: "hidden" }}>
                                  <button onClick={e => { e.stopPropagation(); setRenamingProjectId(project.id); setRenameValue(project.name); setProjectMenuId(null); }}
                                    style={{ width: "100%", padding: "10px 14px", border: "none", background: "transparent", textAlign: "left", fontSize: 13, color: C.text, cursor: "pointer" }}>
                                    ✏️ Rename
                                  </button>
                                  <button onClick={e => { e.stopPropagation(); setDeletingProjectId(project.id); setProjectMenuId(null); }}
                                    style={{ width: "100%", padding: "10px 14px", border: "none", borderTop: `1px solid ${C.border}`, background: "transparent", textAlign: "left", fontSize: 13, color: C.red, cursor: "pointer" }}>
                                    🗑 Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Rename input */}
                        {isRenaming ? (
                          <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                            <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") renameProject(project.id); if (e.key === "Escape") setRenamingProjectId(null); }}
                              style={{ ...inputSt, fontSize: 13, padding: "7px 10px" }} />
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => renameProject(project.id)} style={{ ...btnPrimary, padding: "5px 12px", fontSize: 12 }}>Save</button>
                              <button onClick={() => setRenamingProjectId(null)} style={{ ...btnGhost, padding: "5px 10px", fontSize: 12 }}>Cancel</button>
                            </div>
                          </div>
                        ) : isDeleting ? (
                          <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                            <div style={{ fontSize: 12, color: C.textMed, lineHeight: 1.5 }}>Type <strong>"{project.name}"</strong> to confirm deletion. This will delete all {simulations.filter(s => s.project_id === project.id).length} simulation{simulations.filter(s => s.project_id === project.id).length === 1 ? "" : "s"} inside.</div>
                            <input autoFocus value={deleteConfirmValue} onChange={e => setDeleteConfirmValue(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter" && deleteConfirmValue === project.name) deleteProject(project.id); if (e.key === "Escape") setDeletingProjectId(null); }}
                              placeholder={project.name}
                              style={{ ...inputSt, fontSize: 13, padding: "7px 10px" }} />
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => deleteProject(project.id)} disabled={deleteConfirmValue !== project.name}
                                style={{ ...btnPrimary, padding: "5px 12px", fontSize: 12, background: C.red, opacity: deleteConfirmValue === project.name ? 1 : 0.4 }}>Delete</button>
                              <button onClick={() => { setDeletingProjectId(null); setDeleteConfirmValue(""); }} style={{ ...btnGhost, padding: "5px 10px", fontSize: 12 }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{project.name}</div>
                            <div style={{ fontSize: 12, color: C.textMuted }}>{projectSims.length} simulation{projectSims.length === 1 ? "" : "s"}</div>
                            {lastRun && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Last run {lastRun}</div>}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RECENT SIMULATIONS */}
              {simulations.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMuted, marginBottom: 16 }}>Recent Simulations</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {simulations.slice(0, 5).map(sim => (
                      <SimulationCard key={sim.id} sim={sim} onView={loadSimulationDetail} projectName={sim.projects?.name} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
 
          {/* NEW SIMULATION — STEP 1 */}
          {view === "new" && step === "input" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              <div>
                <button onClick={reset} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 4 }}>← Home</button>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: C.text, letterSpacing: "-0.02em" }}>New Simulation</h2>
                <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>Simulate how a real user experiences your design.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {["Design", "Constraints", "Simulate"].map((s, i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: i === 0 ? C.accent : C.surfaceAlt, border: `1.5px solid ${i === 0 ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: i === 0 ? "#fff" : C.textMuted, fontWeight: 700 }}>{i + 1}</div>
                      <span style={{ fontSize: 12, color: i === 0 ? C.text : C.textMuted, fontWeight: i === 0 ? 600 : 400 }}>{s}</span>
                    </div>
                    {i < 2 && <div style={{ width: 20, height: 1, background: C.border }} />}
                  </div>
                ))}
              </div>
              <Section label="00 — Project">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  {projects.map(p => (
                    <button key={p.id} onClick={() => { setSimProjectId(p.id); setShowNewProjectInput(false); setNewProjectName(""); }}
                      style={{ padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${simProjectId === p.id ? C.indigo : C.border}`, background: simProjectId === p.id ? C.indigoLight : C.surface, color: simProjectId === p.id ? C.indigo : C.textMed, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12 }}>◈</span> {p.name}
                    </button>
                  ))}
                  {!showNewProjectInput && (
                    <button onClick={() => { setShowNewProjectInput(true); setSimProjectId(null); }}
                      style={{ padding: "8px 16px", borderRadius: 8, border: `1.5px dashed ${C.borderMed}`, background: "transparent", color: C.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      + New Project
                    </button>
                  )}
                </div>
                {showNewProjectInput && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                    <input
                      autoFocus
                      value={newProjectName}
                      onChange={e => setNewProjectName(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === "Enter" && newProjectName.trim()) {
                          const { data } = await supabase.from("projects").insert({ user_id: user.id, name: newProjectName.trim() }).select().single();
                          if (data) { setProjects(prev => [...prev, data]); setSimProjectId(data.id); setNewProjectName(""); setShowNewProjectInput(false); }
                        }
                        if (e.key === "Escape") { setShowNewProjectInput(false); setNewProjectName(""); }
                      }}
                      placeholder="Project name..."
                      style={{ ...inputSt, fontSize: 13, padding: "9px 12px", maxWidth: 260 }}
                    />
                    <button
                      disabled={!newProjectName.trim()}
                      onClick={async () => {
                        if (!newProjectName.trim()) return;
                        const { data } = await supabase.from("projects").insert({ user_id: user.id, name: newProjectName.trim() }).select().single();
                        if (data) { setProjects(prev => [...prev, data]); setSimProjectId(data.id); setNewProjectName(""); setShowNewProjectInput(false); }
                      }}
                      style={{ ...btnPrimary, padding: "9px 16px", fontSize: 13, opacity: newProjectName.trim() ? 1 : 0.4 }}>
                      Create
                    </button>
                    <button onClick={() => { setShowNewProjectInput(false); setNewProjectName(""); }} style={{ ...btnGhost, padding: "9px 14px", fontSize: 13 }}>Cancel</button>
                  </div>
                )}
              </Section>
              <Section label="01 — What are you analysing?">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                  {[{ id: "screenshots", icon: "⊞", label: "Screenshots" }, { id: "recording", icon: "◉", label: "Screen Recording" }].map(opt => (
                    <button key={opt.id} onClick={() => { setInputType(opt.id); setFiles([]); }}
                      style={{ padding: "14px 10px", borderRadius: 8, border: `1.5px solid ${inputType === opt.id ? C.indigo : C.border}`, background: inputType === opt.id ? C.indigoLight : C.surface, color: inputType === opt.id ? C.indigo : C.textMuted, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontSize: 20 }}>
                      <span>{opt.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{opt.label}</span>
                    </button>
                  ))}
                </div>
                {(inputType === "screenshots" || inputType === "recording") && (
                  <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: `1.5px dashed ${dragOver ? C.indigo : "rgba(0,0,0,0.12)"}`, borderRadius: 8, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? C.indigoLight : C.surfaceAlt }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{inputType === "recording" ? "🎬" : "🖼️"}</div>
                    <div style={{ color: C.textMuted, fontSize: 13 }}>{inputType === "recording" ? "Drop your screen recording (MP4, MOV)" : "Drop screenshots here or click to browse"}</div>
                    {files.length > 0 && <div style={{ marginTop: 8, color: C.indigo, fontSize: 13, fontWeight: 600 }}>{files.length} file{files.length > 1 ? "s" : ""} ready ✓</div>}
                    <input ref={fileInputRef} type="file" multiple={inputType === "screenshots"} accept={inputType === "recording" ? "video/*" : "image/*"} style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
                  </div>
                )}
              </Section>
              <Section label="02 — Product type">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {PRODUCT_TYPES.map(pt => <button key={pt} onClick={() => setProductType(pt)} style={chipSt(productType === pt)}>{pt}</button>)}
                </div>
              </Section>
              <Section label="03 — Who is your user?">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                  {PERSONAS.map(p => (
                    <button key={p.id} onClick={() => setSelectedPersona(p.id)}
                      style={{ padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${selectedPersona === p.id ? C.indigo : C.border}`, background: selectedPersona === p.id ? C.indigoLight : C.surface, color: selectedPersona === p.id ? C.text : C.textMed, cursor: "pointer", textAlign: "left" }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{p.emoji}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{p.label}</div>
                      <div style={{ fontSize: 11, lineHeight: 1.4, color: C.textMuted }}>{p.description}</div>
                    </button>
                  ))}
                </div>
                {selectedPersona === "custom" && <textarea value={customPersona} onChange={e => setCustomPersona(e.target.value)} placeholder="Describe your user: goals, tech comfort, context..." rows={3} style={{ ...inputSt, resize: "vertical" }} />}
              </Section>
              <Section label="04 — Additional context (optional)">
                <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. Checkout flow for a fashion app targeting 25–40 year olds." rows={3} style={{ ...inputSt, resize: "vertical" }} />
              </Section>
              <Section label="05 — Simulation name (optional)" sublabel="Leave blank to auto-generate from product type, persona and date">
                <input value={simName} onChange={e => setSimName(e.target.value)} placeholder="e.g. Checkout Flow — Mobile, v2" style={inputSt} />
              </Section>
              <button disabled={!canProceedToConstraints()} onClick={() => setStep("constraints")} style={{ ...btnPrimary, width: "100%", opacity: canProceedToConstraints() ? 1 : 0.4 }}>
                Next — Set Constraints
              </button>
            </div>
          )}
 
          {/* CONSTRAINTS */}
          {view === "new" && step === "constraints" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              <div>
                <button onClick={() => setStep("input")} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 4 }}>← Back</button>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: C.text, letterSpacing: "-0.02em" }}>Set Constraints</h2>
                <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>The simulation will split findings into what you can fix now vs what goes on the roadmap.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {["Design", "Constraints", "Simulate"].map((s, i) => {
                  const active = i === 1; const done = i === 0;
                  return (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? C.indigo : active ? C.accent : C.surfaceAlt, border: `1.5px solid ${done || active ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: done || active ? "#fff" : C.textMuted, fontWeight: 700 }}>{done ? "✓" : i + 1}</div>
                        <span style={{ fontSize: 12, color: active ? C.text : done ? C.indigo : C.textMuted, fontWeight: active ? 600 : 400 }}>{s}</span>
                      </div>
                      {i < 2 && <div style={{ width: 20, height: 1, background: done ? C.indigo : C.border }} />}
                    </div>
                  );
                })}
              </div>
              <Section label="01 — Team size">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {TEAM_SIZES.map(t => (
                    <button key={t.id} onClick={() => setTeamSize(t.id)}
                      style={{ padding: "12px 8px", borderRadius: 8, border: `1.5px solid ${teamSize === t.id ? C.indigo : C.border}`, background: teamSize === t.id ? C.indigoLight : C.surface, color: teamSize === t.id ? C.text : C.textMed, cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </Section>
              <Section label="02 — Timeline">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {TIMELINE_OPTIONS.map(t => <button key={t.id} onClick={() => setTimeline(t.id)} style={chipSt(timeline === t.id)}>{t.label}</button>)}
                </div>
              </Section>
              <Section label="03 — Scope limits" sublabel="What can't you change right now?">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {SCOPE_LIMITS.map(s => <button key={s.id} onClick={() => toggleScope(s.id)} style={chipSt(scopeLimits.includes(s.id))}>{s.label}</button>)}
                </div>
              </Section>
              <Section label="04 — Anything else? (optional)">
                <textarea value={otherConstraints} onChange={e => setOtherConstraints(e.target.value)} placeholder="e.g. In code freeze until next month. PM must approve nav changes." rows={2} style={{ ...inputSt, resize: "vertical" }} />
              </Section>
              {error && <div style={{ padding: "12px 14px", borderRadius: 8, background: C.redLight, border: `1px solid ${C.redBorder}`, color: C.red, fontSize: 13 }}>{error}</div>}
              <button disabled={!canAnalyse()} onClick={analyse} style={{ ...btnPrimary, width: "100%", opacity: canAnalyse() ? 1 : 0.4 }}>Run Simulation</button>
            </div>
          )}
 
          {/* ANALYSING */}
          {step === "analysing" && <AnalysingLoader />}
 
          {/* RESULTS */}
          {view === "result" && critique && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: C.text, letterSpacing: "-0.02em" }}>
                  {simName || "Simulation Results"}
                </h2>
                <button onClick={reset} style={{ ...btnPrimary, whiteSpace: "nowrap" }}>Save & Return Home</button>
              </div>
              <ResultsSection
                critique={critique}
                simulationId={currentSimId}
                inputType={inputType}
                productType={productType}
                personaDesc={selectedPersona === "custom" ? "Custom Persona" : personaDesc}
                constraintsSummary={constraintsSummary}
                context={context}
                pmSummary={currentPMSummary}
                simConversations={{}}
                simName={simName}
                date={new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              />
            </div>
          )}
 
          {/* DETAIL */}
          {view === "detail" && selectedSim && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <button onClick={reset} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 4 }}>← Home</button>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", color: C.text, letterSpacing: "-0.02em" }}>{selectedSim.name}</h2>
                    <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.textMuted }}>{new Date(selectedSim.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  </div>
 
                  {/* ⋯ menu */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <button onClick={() => setShowDetailMenu(m => !m)}
                      style={{ width: 44, height: 44, borderRadius: 10, border: "1.5px solid rgba(0,0,0,0.2)", background: C.surface, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.textMed, display: "block" }} />
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.textMed, display: "block" }} />
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.textMed, display: "block" }} />
                    </button>
                    {showDetailMenu && (
                      <>
                        <div onClick={() => setShowDetailMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                        <div style={{ position: "absolute", right: 0, top: 48, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 20, minWidth: 180, overflow: "hidden" }}>
                          <button onClick={() => { setShowDetailMenu(false); setDetailDrawerOpen(true); }}
                            style={{ width: "100%", padding: "11px 16px", border: "none", background: "transparent", textAlign: "left", fontSize: 13, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                            📋 View Summary
                          </button>
                          {!confirmDeleteDetail ? (
                            <button onClick={() => setConfirmDeleteDetail(true)}
                              style={{ width: "100%", padding: "11px 16px", border: "none", borderTop: `1px solid ${C.border}`, background: "transparent", textAlign: "left", fontSize: 13, color: C.red, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                              🗑 Delete Simulation
                            </button>
                          ) : (
                            <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
                              <div style={{ fontSize: 12, color: C.textMed, marginBottom: 10 }}>This cannot be undone. Are you sure?</div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => deleteSimulation(selectedSim.id)}
                                  style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "none", background: C.red, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                                <button onClick={() => setConfirmDeleteDetail(false)}
                                  style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMed, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
 
              </div>
 
              <ResultsSection
                critique={{
                  narrativeWalkthrough: selectedSim.narrative,
                  priorityFocus: selectedSim.priority_focus,
                  actNow: selectedSim.act_now,
                  roadmap: selectedSim.roadmap,
                  strengths: selectedSim.strengths,
                  signals: selectedSim.signals
                }}
                simulationId={selectedSim.id}
                inputType={selectedSim.input_type}
                productType={selectedSim.product_type}
                personaDesc={selectedSim.persona}
                constraintsSummary={selectedSim.constraints || "{}"}
                context={selectedSim.context}
                pmSummary={selectedSim.pm_summary}
                simConversations={simConversations}
                simName={selectedSim.name}
                date={new Date(selectedSim.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                externalDrawerOpen={detailDrawerOpen}
                onExternalDrawerClose={() => setDetailDrawerOpen(false)}
              />
            </div>
          )}
 
          {/* PROJECT VIEW */}
          {view === "project" && selectedProject && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <div>
                <button onClick={reset} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 4 }}>← Home</button>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: C.text, letterSpacing: "-0.02em" }}>{selectedProject.name}</h2>
                    <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>
                      {simulations.filter(s => s.project_id === selectedProject.id).length} simulation{simulations.filter(s => s.project_id === selectedProject.id).length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button onClick={() => { setSimProjectId(selectedProject.id); setView("new"); }} style={{ ...btnPrimary, padding: "12px 20px", whiteSpace: "nowrap" }}>+ Run a Simulation</button>
                </div>
              </div>
              {simulations.filter(s => s.project_id === selectedProject.id).length === 0 ? (
                <div style={{ ...card, textAlign: "center", padding: "48px 32px", background: C.surfaceAlt, border: `1px dashed rgba(0,0,0,0.12)` }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.textMed, marginBottom: 6 }}>No simulations yet</div>
                  <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>Run your first simulation for this project.</div>
                  <button onClick={() => { setSimProjectId(selectedProject.id); setView("new"); }} style={btnPrimary}>Run a Simulation</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {simulations.filter(s => s.project_id === selectedProject.id).map(sim => (
                    <SimulationCard key={sim.id} sim={sim} onView={loadSimulationDetail} />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* SETTINGS */}
          {view === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 520 }}>
              <div>
                <button onClick={reset} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12, marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 4 }}>← Home</button>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: C.text, letterSpacing: "-0.02em" }}>Settings</h2>
                <p style={{ fontSize: 14, color: C.textMuted, margin: 0 }}>Manage your profile and account details.</p>
              </div>
              <div style={card}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.textMuted, marginBottom: 16 }}>Profile</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.textMed, display: "block", marginBottom: 4 }}>First name</label>
                      <input value={settingsFirstName} onChange={e => setSettingsFirstName(e.target.value)} placeholder="First name" style={inputSt} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.textMed, display: "block", marginBottom: 4 }}>Last name</label>
                      <input value={settingsLastName} onChange={e => setSettingsLastName(e.target.value)} placeholder="Last name" style={inputSt} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: C.textMed, display: "block", marginBottom: 4 }}>Email address</label>
                    <input value={settingsEmail} onChange={e => setSettingsEmail(e.target.value)} type="email" style={inputSt} />
                  </div>
                </div>
              </div>
              <div style={card}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.textMuted, marginBottom: 16 }}>Change Password</div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textMed, display: "block", marginBottom: 4 }}>New password</label>
                  <input value={settingsPassword} onChange={e => setSettingsPassword(e.target.value)} type="password" placeholder="Leave blank to keep current password" style={inputSt} />
                </div>
              </div>
              {settingsMessage && (
                <div style={{ padding: "12px 14px", borderRadius: 8, background: settingsMessage.startsWith("Error") ? C.redLight : C.greenLight, border: `1px solid ${settingsMessage.startsWith("Error") ? C.redBorder : C.greenBorder}`, color: settingsMessage.startsWith("Error") ? C.red : C.green, fontSize: 13 }}>
                  {settingsMessage}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={saveSettings} disabled={settingsSaving} style={{ ...btnPrimary, opacity: settingsSaving ? 0.6 : 1 }}>{settingsSaving ? "Saving..." : "Save Changes"}</button>
                <button onClick={handleSignOut} style={{ ...btnGhost, color: C.red, borderColor: C.redBorder }}>Sign Out</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}