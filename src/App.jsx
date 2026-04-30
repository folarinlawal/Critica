import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "./supabase";
 
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
 
const sev = (s) => ({ critical: "#FF3B30", high: "#FF9500", medium: "#FFCC00", low: "#34C759" }[s] || "#888");
const sevBg = (s) => ({ critical: "rgba(255,59,48,0.08)", high: "rgba(255,149,0,0.08)", medium: "rgba(255,204,0,0.08)", low: "rgba(52,199,89,0.08)" }[s] || "rgba(136,136,136,0.08)");
const effortColor = (e) => ({ low: "#34C759", medium: "#FF9500", high: "#FF3B30" }[e] || "#888");
 
const inputStyle = {
  width: "100%", padding: "14px 16px", borderRadius: 10,
  border: "1.5px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)", color: "#E8E8F0",
  fontSize: 14, outline: "none", boxSizing: "border-box"
};
const chipBtn = (active) => ({
  padding: "8px 14px", borderRadius: 999,
  border: `1.5px solid ${active ? "#6366F1" : "rgba(255,255,255,0.08)"}`,
  background: active ? "rgba(99,102,241,0.12)" : "transparent",
  color: active ? "#E8E8F0" : "#6B7280", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s"
});
 
function Section({ label, sublabel, children }) {
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7280" }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: "#4B5563", marginTop: 3 }}>{sublabel}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  );
}
 
function FindingThread({ finding, type, productType, personaDesc, constraintsSummary, simulationId, savedMessages }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(savedMessages || []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
 
  const saveConversation = async (updatedMessages) => {
    if (!simulationId) return;
    await supabase.from("conversations").upsert({
      simulation_id: simulationId,
      finding_title: finding.title,
      finding_type: type,
      messages: updatedMessages
    }, { onConflict: "simulation_id,finding_title" });
  };
 
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
 
    try {
      const systemPrompt = `You are an expert UX design critic having a focused conversation about one specific design finding. Stay anchored to this finding only. Be concise — 2-4 sentences per reply. When the designer provides context or constraints, acknowledge them and either revise your thinking, suggest a workaround within those constraints, or validate their reasoning. Never repeat the original finding back verbatim.
 
ORIGINAL FINDING:
Title: ${finding.title}
Severity: ${finding.severity}
Description: ${finding.description}
Recommendation: ${finding.recommendation}
${finding.userImpact ? `User Impact: ${finding.userImpact}` : ""}
 
DESIGN CONTEXT:
Product: ${productType}
Persona: ${personaDesc}
Constraints: ${constraintsSummary}`;
 
      const apiMessages = newMessages.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
 
      const res = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 400,
          system: systemPrompt,
          messages: apiMessages
        })
      });
 
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `API error ${res.status}`);
      const reply = (data.content || []).map(b => b.text || "").join("").trim();
      const updatedMessages = [...newMessages, { role: "ai", text: reply }];
      setMessages(updatedMessages);
      await saveConversation(updatedMessages);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };
 
  const accentColor = type === "now" ? sev(finding.severity) : "#FF9500";
 
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${accentColor}33`, background: sevBg(finding.severity) }}>
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: sev(finding.severity), padding: "3px 9px", borderRadius: 999, background: `${sev(finding.severity)}18`, border: `1px solid ${sev(finding.severity)}44` }}>
            {finding.severity}
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{finding.title}</span>
          {finding.effort && (
            <span style={{ fontSize: 10, fontWeight: 700, color: effortColor(finding.effort), padding: "2px 8px", borderRadius: 999, background: `${effortColor(finding.effort)}15`, border: `1px solid ${effortColor(finding.effort)}33` }}>
              {finding.effort} effort
            </span>
          )}
        </div>
        <p style={{ margin: "0 0 8px", fontSize: 13, lineHeight: 1.6, color: "#9CA3AF" }}>{finding.description}</p>
        {finding.userImpact && (
          <div style={{ marginBottom: 8, padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>User impact </span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{finding.userImpact}</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <span style={{ color: type === "now" ? "#34C759" : "#FF9500", fontSize: 14, flexShrink: 0 }}>→</span>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#D1D5DB" }}>{finding.recommendation}</p>
        </div>
        <button onClick={() => setOpen(o => !o)}
          style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.1)", background: open ? "rgba(99,102,241,0.1)" : "transparent", color: open ? "#6366F1" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>{open ? "▾" : "▸"}</span>
          {messages.length > 0 ? `${messages.length} repl${messages.length === 1 ? "y" : "ies"}` : "Discuss this finding"}
        </button>
      </div>
 
      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ maxHeight: 300, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ color: "#4B5563", fontSize: 13, fontStyle: "italic", textAlign: "center", padding: "12px 0" }}>
                Add context, push back, or ask for alternatives — the critique will adapt.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, background: m.role === "user" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${m.role === "user" ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                  {m.role === "user" ? "👤" : "⬡"}
                </div>
                <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: m.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px", background: m.role === "user" ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${m.role === "user" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.07)"}`, fontSize: 13, lineHeight: 1.65, color: m.role === "user" ? "#C7D2FE" : "#D1D5DB" }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", animation: "pulse 1s ease-in-out infinite" }}>⬡</div>
                <div style={{ padding: "10px 14px", borderRadius: "4px 12px 12px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 13, color: "#6B7280" }}>Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: "12px 20px 16px", display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Add context, push back, or ask for an alternative..."
              style={{ ...inputStyle, padding: "10px 14px", fontSize: 13 }} />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: input.trim() && !loading ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "rgba(255,255,255,0.05)", color: input.trim() && !loading ? "#fff" : "#4B5563", fontSize: 13, fontWeight: 700, cursor: input.trim() && !loading ? "pointer" : "not-allowed", whiteSpace: "nowrap", flexShrink: 0 }}>
              Send
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
    </div>
  );
}
 
// ── History Card ──
function SimulationCard({ sim, onView }) {
  const date = new Date(sim.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const scoreColor = sim.overall_score >= 7 ? "#34C759" : sim.overall_score >= 5 ? "#FF9500" : "#FF3B30";
  return (
    <div onClick={() => onView(sim)}
      style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#E8E8F0", marginBottom: 8 }}>{sim.name}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "rgba(99,102,241,0.12)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.2)" }}>{sim.product_type}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.05)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.08)" }}>{sim.persona}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#9CA3AF", fontStyle: "italic" }}>"{sim.narrative}"</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{sim.overall_score}<span style={{ fontSize: 14, color: "#4B5563" }}>/10</span></div>
          <div style={{ fontSize: 11, color: "#4B5563", marginTop: 4 }}>{date}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <span style={{ fontSize: 11, color: "#34C759" }}>✓ {sim.act_now?.length || 0} to fix</span>
        <span style={{ fontSize: 11, color: "#FF9500" }}>⊞ {sim.roadmap?.length || 0} on roadmap</span>
      </div>
    </div>
  );
}
 
export default function App() {
  const [view, setView] = useState("home"); // home | new | result | history | detail
  const [step, setStep] = useState("input");
  const [inputType, setInputType] = useState("figma");
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
  const [activeTab, setActiveTab] = useState("now");
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [simulations, setSimulations] = useState([]);
  const [selectedSim, setSelectedSim] = useState(null);
  const [simConversations, setSimConversations] = useState({});
  const fileInputRef = useRef();
 
  useEffect(() => {
    if (view === "history") loadSimulations();
  }, [view]);
 
  const loadSimulations = async () => {
    const { data } = await supabase.from("simulations").select("*").order("created_at", { ascending: false });
    if (data) setSimulations(data);
  };
 
  const loadSimulationDetail = async (sim) => {
    setSelectedSim(sim);
    const { data } = await supabase.from("conversations").select("*").eq("simulation_id", sim.id);
    if (data) {
      const convMap = {};
      data.forEach(c => { convMap[c.finding_title] = c.messages; });
      setSimConversations(convMap);
    }
    setView("detail");
  };
 
  const handleFiles = useCallback((newFiles) => {
    const arr = Array.from(newFiles);
    setFiles(prev => [...prev, ...arr].slice(0, inputType === "recording" ? 1 : 8));
  }, [inputType]);
 
  const toggleScope = (id) => {
    setScopeLimits(prev =>
      id === "no-limits" ? ["no-limits"] :
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev.filter(s => s !== "no-limits"), id]
    );
  };
 
  const canProceedToConstraints = () => {
    const hasInput = inputType === "figma" ? figmaUrl.trim().length > 0 : files.length > 0;
    const hasPersona = selectedPersona && (selectedPersona !== "custom" || customPersona.trim().length > 0);
    return hasInput && hasPersona && productType.length > 0;
  };
 
  const canAnalyse = () => teamSize && timeline && scopeLimits.length > 0;
 
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
 
  const buildConstraintsSummary = () => {
    const ts = TEAM_SIZES.find(t => t.id === teamSize);
    const tl = TIMELINE_OPTIONS.find(t => t.id === timeline);
    const sl = scopeLimits.map(s => SCOPE_LIMITS.find(o => o.id === s)?.label).filter(Boolean);
    return `Team: ${ts?.label}. Timeline: ${tl?.label}. Scope limits: ${sl.join(", ")}. ${otherConstraints ? `Other: ${otherConstraints}` : ""}`;
  };
 
  const getPersonaDesc = () => {
    const persona = PERSONAS.find(p => p.id === selectedPersona);
    return selectedPersona === "custom" ? customPersona : `${persona?.label} — ${persona?.description}. Traits: ${persona?.traits}`;
  };
 
  const analyse = async () => {
    setStep("analysing");
    setError(null);
    try {
      const personaDesc = getPersonaDesc();
      const inputDesc = inputType === "figma" ? `Figma URL: ${figmaUrl}` : inputType === "screenshots" ? `${files.length} screenshot(s)` : "Screen recording";
      const constraintsSummary = buildConstraintsSummary();
      const persona = PERSONAS.find(p => p.id === selectedPersona);
      const personaLabel = selectedPersona === "custom" ? customPersona.slice(0, 30) : persona?.label;
 
      const userMessage = `UX design critic. Respond ONLY with raw JSON, no markdown. Keep ALL string values under 25 words.
 
Product: ${productType} | Input: ${inputDesc} | Persona: ${personaDesc} | Context: ${context || "none"}
Constraints: ${constraintsSummary}
${inputType === "figma" ? "No visuals — use common UX patterns for this product/persona." : "Analyse the visuals."}
 
Max 3 actNow items, max 3 roadmap items. Raw JSON only:
{"narrativeWalkthrough":"1-2 sentences as persona","overallScore":7,"actNow":[{"severity":"high","title":"title","description":"one sentence","recommendation":"one sentence","effort":"low"}],"roadmap":[{"severity":"high","title":"title","description":"one sentence","recommendation":"one sentence","userImpact":"one sentence","pmNote":"one sentence"}],"strengths":["one sentence"],"priorityFocus":"one sentence"}`;
 
      const content = [];
      if (inputType === "screenshots" && files.length > 0) {
        for (const file of files.slice(0, 4)) {
          if (file.type.startsWith("image/")) {
            const b64 = await fileToBase64(file);
            content.push({ type: "image", source: { type: "base64", media_type: file.type, data: b64 } });
          }
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
        catch { parsed = { narrativeWalkthrough: "Response too long — please try again.", overallScore: 0, actNow: [], roadmap: [], strengths: [], priorityFocus: "Please retry." }; }
      }
 
      // Save to Supabase
      const pmSummary = generatePMSummaryFromData(parsed, productType, personaLabel);
      const { data: simData } = await supabase.from("simulations").insert({
        name: simName || `${productType} — ${personaLabel} — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
        product_type: productType,
        input_type: inputType,
        persona: personaLabel,
        context: context || null,
        constraints: { teamSize, timeline, scopeLimits, otherConstraints },
        overall_score: parsed.overallScore,
        narrative: parsed.narrativeWalkthrough,
        priority_focus: parsed.priorityFocus,
        act_now: parsed.actNow,
        roadmap: parsed.roadmap,
        strengths: parsed.strengths,
        pm_summary: pmSummary
      }).select().single();
 
      if (simData) setCurrentSimId(simData.id);
      setCritique(parsed);
      setActiveTab("now");
      setView("result");
      setStep("input");
    } catch (err) {
      setError(`Error: ${err.message}`);
      setStep("constraints");
    }
  };
 
  const generatePMSummaryFromData = (data, pType, pLabel) => {
    return [
      `DESIGN REVIEW — ${pType?.toUpperCase()}`,
      `Persona Tested: ${pLabel}`,
      `UX Score: ${data.overallScore}/10`,
      ``,
      `USER EXPERIENCE SUMMARY`,
      data.narrativeWalkthrough,
      ``,
      `ROADMAP OPPORTUNITIES (${data.roadmap?.length || 0} items)`,
      `Issues identified during design review that fall outside current sprint constraints.`,
      ``,
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
      `Generated by Critica — AI Design Critique Tool`
    ].join("\n");
  };
 
  const generatePMSummary = () => {
    if (!critique) return "";
    const persona = PERSONAS.find(p => p.id === selectedPersona);
    const personaLabel = selectedPersona === "custom" ? customPersona.slice(0, 30) : persona?.label;
    return generatePMSummaryFromData(critique, productType, personaLabel);
  };
 
  const reset = () => {
    setView("home"); setCritique(null); setFiles([]);
    setFigmaUrl(""); setSelectedPersona(null); setCustomPersona("");
    setProductType(""); setContext(""); setError(null);
    setTeamSize(null); setTimeline(null); setScopeLimits([]); setOtherConstraints("");
    setCurrentSimId(null); setStep("input"); setSimName("");
  };
 
  const personaDesc = selectedPersona ? getPersonaDesc() : "";
  const constraintsSummary = teamSize ? buildConstraintsSummary() : "";
 
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#E8E8F0", fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 60%)" }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
 
      <div style={{ position: "relative", maxWidth: 780, margin: "0 auto", padding: "48px 24px" }}>
 
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={reset}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⬡</div>
              <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366F1" }}>Critica</span>
            </div>
            {view !== "history" ? (
              <button onClick={() => setView("history")}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.08)", background: "transparent", color: "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                History →
              </button>
            ) : (
              <button onClick={reset}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.08)", background: "transparent", color: "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                ← New Critique
              </button>
            )}
          </div>
 
          {view === "home" && (
            <>
              <h1 style={{ fontSize: "clamp(28px,5vw,40px)", fontWeight: 700, lineHeight: 1.1, margin: 0, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #E8E8F0 0%, #9CA3AF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                AI Design Critique
              </h1>
              <p style={{ color: "#6B7280", marginTop: 10, fontSize: 15, lineHeight: 1.6 }}>
                Simulate how real users experience your designs. Get feedback that fits your constraints.
              </p>
              <button onClick={() => setView("new")}
                style={{ marginTop: 24, padding: "14px 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 24px rgba(99,102,241,0.3)" }}>
                Start New Critique →
              </button>
            </>
          )}
 
          {view === "history" && (
            <h1 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 700, lineHeight: 1.1, margin: 0, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #E8E8F0 0%, #9CA3AF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Simulation History
            </h1>
          )}
 
          {(view === "new") && (step === "input" || step === "constraints") && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
              {["Design", "Constraints", "Critique"].map((s, i) => {
                const stepIndex = step === "input" ? 0 : 1;
                const active = i === stepIndex;
                const done = i < stepIndex;
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? "#6366F1" : active ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)", border: `1.5px solid ${done || active ? "#6366F1" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: done ? "#fff" : active ? "#6366F1" : "#4B5563", fontWeight: 700 }}>
                        {done ? "✓" : i + 1}
                      </div>
                      <span style={{ fontSize: 12, color: active ? "#E8E8F0" : done ? "#6366F1" : "#4B5563", fontWeight: active ? 600 : 400 }}>{s}</span>
                    </div>
                    {i < 2 && <div style={{ width: 24, height: 1, background: done ? "#6366F1" : "rgba(255,255,255,0.08)" }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
 
        {/* ── HOME ── */}
        {view === "home" && simulations.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#4B5563", fontSize: 14 }}>
            No simulations yet. Run your first critique to get started.
          </div>
        )}
 
        {/* ── NEW CRITIQUE: STEP 1 ── */}
        {view === "new" && step === "input" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <Section label="01 — What are you analysing?">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {[{ id: "figma", icon: "◈", label: "Figma Link" }, { id: "screenshots", icon: "⊞", label: "Screenshots" }, { id: "recording", icon: "◉", label: "Screen Recording" }].map(opt => (
                  <button key={opt.id} onClick={() => { setInputType(opt.id); setFiles([]); }}
                    style={{ padding: "16px 12px", borderRadius: 12, border: `1.5px solid ${inputType === opt.id ? "#6366F1" : "rgba(255,255,255,0.07)"}`, background: inputType === opt.id ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.02)", color: inputType === opt.id ? "#E8E8F0" : "#6B7280", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, fontSize: 22 }}>
                    <span>{opt.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{opt.label}</span>
                  </button>
                ))}
              </div>
              {inputType === "figma" && (
                <input value={figmaUrl} onChange={e => setFigmaUrl(e.target.value)} placeholder="https://www.figma.com/proto/..." style={inputStyle} />
              )}
              {(inputType === "screenshots" || inputType === "recording") && (
                <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: `1.5px dashed ${dragOver ? "#6366F1" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "32px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.01)" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{inputType === "recording" ? "🎬" : "🖼️"}</div>
                  <div style={{ color: "#9CA3AF", fontSize: 14 }}>{inputType === "recording" ? "Drop your screen recording (MP4, MOV)" : "Drop screenshots here or click to browse"}</div>
                  {files.length > 0 && <div style={{ marginTop: 12, color: "#6366F1", fontSize: 13, fontWeight: 600 }}>{files.length} file{files.length > 1 ? "s" : ""} ready ✓</div>}
                  <input ref={fileInputRef} type="file" multiple={inputType === "screenshots"} accept={inputType === "recording" ? "video/*" : "image/*"} style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
                </div>
              )}
            </Section>
            <Section label="02 — Product type">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PRODUCT_TYPES.map(pt => <button key={pt} onClick={() => setProductType(pt)} style={chipBtn(productType === pt)}>{pt}</button>)}
              </div>
            </Section>
            <Section label="03 — Who is your user?">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                {PERSONAS.map(p => (
                  <button key={p.id} onClick={() => setSelectedPersona(p.id)}
                    style={{ padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${selectedPersona === p.id ? "#6366F1" : "rgba(255,255,255,0.07)"}`, background: selectedPersona === p.id ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.02)", color: selectedPersona === p.id ? "#E8E8F0" : "#9CA3AF", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{p.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{p.label}</div>
                    <div style={{ fontSize: 11, lineHeight: 1.4, opacity: 0.7 }}>{p.description}</div>
                  </button>
                ))}
              </div>
              {selectedPersona === "custom" && (
                <textarea value={customPersona} onChange={e => setCustomPersona(e.target.value)} placeholder="Describe your user: goals, tech comfort, context..." rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
              )}
            </Section>
            <Section label="04 — Additional context (optional)">
              <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. Checkout flow for a fashion app targeting 25–40 year olds." rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            </Section>
            <Section label="05 — Simulation name (optional)" sublabel="Leave blank to auto-generate from product type, persona and date">
              <input value={simName} onChange={e => setSimName(e.target.value)} placeholder="e.g. Anchor — Checkout Flow v2" style={inputStyle} />
            </Section>
            <button disabled={!canProceedToConstraints()} onClick={() => setStep("constraints")}
              style={{ padding: "16px 32px", borderRadius: 12, border: "none", background: canProceedToConstraints() ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "rgba(255,255,255,0.05)", color: canProceedToConstraints() ? "#fff" : "#4B5563", fontSize: 15, fontWeight: 700, cursor: canProceedToConstraints() ? "pointer" : "not-allowed", boxShadow: canProceedToConstraints() ? "0 4px 24px rgba(99,102,241,0.3)" : "none" }}>
              Next — Set Constraints →
            </button>
          </div>
        )}
 
        {/* ── STEP 2: CONSTRAINTS ── */}
        {view === "new" && step === "constraints" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <div style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>
              Tell us what you're working with. The critique will split findings into what you can <strong style={{ color: "#E8E8F0" }}>fix now</strong> vs what belongs on the <strong style={{ color: "#E8E8F0" }}>roadmap</strong>.
            </div>
            <Section label="01 — Team size">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {TEAM_SIZES.map(t => (
                  <button key={t.id} onClick={() => setTeamSize(t.id)}
                    style={{ padding: "14px 10px", borderRadius: 12, border: `1.5px solid ${teamSize === t.id ? "#6366F1" : "rgba(255,255,255,0.07)"}`, background: teamSize === t.id ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.02)", color: teamSize === t.id ? "#E8E8F0" : "#9CA3AF", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{t.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </Section>
            <Section label="02 — Timeline for changes">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TIMELINE_OPTIONS.map(t => <button key={t.id} onClick={() => setTimeline(t.id)} style={chipBtn(timeline === t.id)}>{t.label}</button>)}
              </div>
            </Section>
            <Section label="03 — Scope limits" sublabel="What can't you change right now?">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SCOPE_LIMITS.map(s => <button key={s.id} onClick={() => toggleScope(s.id)} style={chipBtn(scopeLimits.includes(s.id))}>{s.label}</button>)}
              </div>
            </Section>
            <Section label="04 — Anything else? (optional)">
              <textarea value={otherConstraints} onChange={e => setOtherConstraints(e.target.value)} placeholder="e.g. In code freeze until next month. PM must approve nav changes." rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            </Section>
            {error && <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.25)", color: "#FF6B6B", fontSize: 13, lineHeight: 1.6 }}>{error}</div>}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep("input")} style={{ padding: "14px 24px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)", background: "transparent", color: "#9CA3AF", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← Back</button>
              <button disabled={!canAnalyse()} onClick={analyse} style={{ flex: 1, padding: "16px 32px", borderRadius: 12, border: "none", background: canAnalyse() ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "rgba(255,255,255,0.05)", color: canAnalyse() ? "#fff" : "#4B5563", fontSize: 15, fontWeight: 700, cursor: canAnalyse() ? "pointer" : "not-allowed", boxShadow: canAnalyse() ? "0 4px 24px rgba(99,102,241,0.3)" : "none" }}>Run Critique →</button>
            </div>
          </div>
        )}
 
        {/* ── ANALYSING ── */}
        {step === "analysing" && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 24, animation: "spin 2s linear infinite" }}>⬡</div>
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Analysing your design...</div>
            <div style={{ color: "#6B7280", fontSize: 14 }}>Filtering findings against your constraints</div>
            <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
          </div>
        )}
 
        {/* ── RESULTS ── */}
        {view === "result" && critique && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Overall Score</div>
                <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: critique.overallScore >= 7 ? "#34C759" : critique.overallScore >= 5 ? "#FF9500" : "#FF3B30" }}>
                  {critique.overallScore}<span style={{ fontSize: 22, color: "#4B5563" }}>/10</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Persona Walkthrough</div>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: "#D1D5DB", margin: 0, fontStyle: "italic" }}>"{critique.narrativeWalkthrough}"</p>
              </div>
            </div>
 
            <div style={{ background: "rgba(99,102,241,0.08)", borderRadius: 14, padding: "18px 22px", border: "1.5px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366F1", marginBottom: 6 }}>★ Priority Focus</div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{critique.priorityFocus}</p>
            </div>
 
            <div>
              <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4 }}>
                {[{ id: "now", label: "Act Now", count: critique.actNow?.length || 0, color: "#34C759" }, { id: "roadmap", label: "Roadmap", count: critique.roadmap?.length || 0, color: "#FF9500" }, { id: "pm", label: "PM Export", count: null, color: "#6366F1" }].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: "none", background: activeTab === tab.id ? "rgba(255,255,255,0.07)" : "transparent", color: activeTab === tab.id ? "#E8E8F0" : "#6B7280", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {tab.label}
                    {tab.count !== null && <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 999, background: activeTab === tab.id ? tab.color + "22" : "rgba(255,255,255,0.05)", color: activeTab === tab.id ? tab.color : "#4B5563", fontWeight: 700 }}>{tab.count}</span>}
                  </button>
                ))}
              </div>
 
              {activeTab === "now" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.5 }}>Click <strong style={{ color: "#6B7280" }}>Discuss this finding</strong> on any card to push back, add context, or ask for alternatives.</div>
                  {(critique.actNow || []).length === 0
                    ? <div style={{ padding: "32px", textAlign: "center", color: "#4B5563", fontSize: 14 }}>No immediate actions — check the Roadmap tab.</div>
                    : (critique.actNow || []).map((fp, i) => <FindingThread key={i} finding={fp} type="now" productType={productType} personaDesc={personaDesc} constraintsSummary={constraintsSummary} simulationId={currentSimId} savedMessages={[]} />)}
                </div>
              )}
 
              {activeTab === "roadmap" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(255,149,0,0.06)", border: "1px solid rgba(255,149,0,0.15)", fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>
                    Outside your current constraints. Use <strong style={{ color: "#E8E8F0" }}>PM Export</strong> to share these.
                  </div>
                  {(critique.roadmap || []).length === 0
                    ? <div style={{ padding: "32px", textAlign: "center", color: "#4B5563", fontSize: 14 }}>Nothing for the roadmap — everything fits your constraints.</div>
                    : (critique.roadmap || []).map((fp, i) => <FindingThread key={i} finding={fp} type="roadmap" productType={productType} personaDesc={personaDesc} constraintsSummary={constraintsSummary} simulationId={currentSimId} savedMessages={[]} />)}
                </div>
              )}
 
              {activeTab === "pm" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", fontSize: 12, color: "#9CA3AF", lineHeight: 1.6 }}>
                    Formatted for your product manager — framed around user impact and business value.
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: "20px", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "monospace", fontSize: 12, lineHeight: 1.8, color: "#9CA3AF", whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto" }}>
                    {generatePMSummary()}
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(generatePMSummary()); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }}
                    style={{ padding: "14px 24px", borderRadius: 12, border: "none", background: copySuccess ? "rgba(52,199,89,0.15)" : "linear-gradient(135deg, #6366F1, #8B5CF6)", color: copySuccess ? "#34C759" : "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                    {copySuccess ? "✓ Copied!" : "Copy PM Summary"}
                  </button>
                </div>
              )}
            </div>
 
            {(critique.strengths || []).length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B7280", marginBottom: 12 }}>Strengths</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {critique.strengths.map((s, i) => (
                    <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(52,199,89,0.06)", border: "1px solid rgba(52,199,89,0.15)", fontSize: 13, lineHeight: 1.6, color: "#D1D5DB", display: "flex", gap: 10 }}>
                      <span style={{ color: "#34C759", flexShrink: 0 }}>✓</span>{s}
                    </div>
                  ))}
                </div>
              </div>
            )}
 
            <button onClick={reset} style={{ padding: "14px 28px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)", background: "transparent", color: "#9CA3AF", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              ← Back to Home
            </button>
          </div>
        )}
 
        {/* ── HISTORY ── */}
        {view === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {simulations.length === 0
              ? <div style={{ textAlign: "center", padding: "60px 0", color: "#4B5563", fontSize: 14 }}>No simulations yet. Run your first critique to get started.</div>
              : simulations.map(sim => <SimulationCard key={sim.id} sim={sim} onView={loadSimulationDetail} />)}
          </div>
        )}
 
        {/* ── DETAIL VIEW ── */}
        {view === "detail" && selectedSim && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Overall Score</div>
                <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: selectedSim.overall_score >= 7 ? "#34C759" : selectedSim.overall_score >= 5 ? "#FF9500" : "#FF3B30" }}>
                  {selectedSim.overall_score}<span style={{ fontSize: 22, color: "#4B5563" }}>/10</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Persona Walkthrough</div>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: "#D1D5DB", margin: 0, fontStyle: "italic" }}>"{selectedSim.narrative}"</p>
              </div>
            </div>
 
            <div style={{ background: "rgba(99,102,241,0.08)", borderRadius: 14, padding: "18px 22px", border: "1.5px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6366F1", marginBottom: 6 }}>★ Priority Focus</div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{selectedSim.priority_focus}</p>
            </div>
 
            <div>
              <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4 }}>
                {[{ id: "now", label: "Act Now", count: selectedSim.act_now?.length || 0, color: "#34C759" }, { id: "roadmap", label: "Roadmap", count: selectedSim.roadmap?.length || 0, color: "#FF9500" }, { id: "pm", label: "PM Export", count: null, color: "#6366F1" }].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: "none", background: activeTab === tab.id ? "rgba(255,255,255,0.07)" : "transparent", color: activeTab === tab.id ? "#E8E8F0" : "#6B7280", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {tab.label}
                    {tab.count !== null && <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 999, background: activeTab === tab.id ? tab.color + "22" : "rgba(255,255,255,0.05)", color: activeTab === tab.id ? tab.color : "#4B5563", fontWeight: 700 }}>{tab.count}</span>}
                  </button>
                ))}
              </div>
 
              {activeTab === "now" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(selectedSim.act_now || []).map((fp, i) => (
                    <FindingThread key={i} finding={fp} type="now"
                      productType={selectedSim.product_type}
                      personaDesc={selectedSim.persona}
                      constraintsSummary={JSON.stringify(selectedSim.constraints)}
                      simulationId={selectedSim.id}
                      savedMessages={simConversations[fp.title] || []} />
                  ))}
                </div>
              )}
 
              {activeTab === "roadmap" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(selectedSim.roadmap || []).map((fp, i) => (
                    <FindingThread key={i} finding={fp} type="roadmap"
                      productType={selectedSim.product_type}
                      personaDesc={selectedSim.persona}
                      constraintsSummary={JSON.stringify(selectedSim.constraints)}
                      simulationId={selectedSim.id}
                      savedMessages={simConversations[fp.title] || []} />
                  ))}
                </div>
              )}
 
              {activeTab === "pm" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: "20px", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "monospace", fontSize: 12, lineHeight: 1.8, color: "#9CA3AF", whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto" }}>
                    {selectedSim.pm_summary}
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(selectedSim.pm_summary); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }}
                    style={{ padding: "14px 24px", borderRadius: 12, border: "none", background: copySuccess ? "rgba(52,199,89,0.15)" : "linear-gradient(135deg, #6366F1, #8B5CF6)", color: copySuccess ? "#34C759" : "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                    {copySuccess ? "✓ Copied!" : "Copy PM Summary"}
                  </button>
                </div>
              )}
            </div>
 
            <button onClick={() => { setView("history"); setActiveTab("now"); }}
              style={{ padding: "14px 28px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.1)", background: "transparent", color: "#9CA3AF", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              ← Back to History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
 