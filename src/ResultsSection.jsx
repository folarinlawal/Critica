import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabase";
 
const C = {
  bg: "#F7F6F3", surface: "#FFFFFF", surfaceAlt: "#F0EEE9",
  border: "rgba(0,0,0,0.08)", borderMed: "rgba(0,0,0,0.12)",
  text: "#1A1A1A", textMed: "#4A4A4A", textMuted: "#6B7280",
  accent: "#1A1A2E", indigo: "#4F46E5", indigoLight: "rgba(79,70,229,0.08)", indigoBorder: "rgba(79,70,229,0.2)",
  green: "#16A34A", greenLight: "rgba(22,163,74,0.08)", greenBorder: "rgba(22,163,74,0.2)",
  amber: "#D97706", amberLight: "rgba(217,119,6,0.08)", amberBorder: "rgba(217,119,6,0.2)",
  red: "#DC2626", redLight: "rgba(220,38,38,0.08)", redBorder: "rgba(220,38,38,0.2)",
};
 
const sevColor = (s) => ({ critical: C.red, high: C.amber, medium: "#CA8A04", low: C.green }[s] || C.textMuted);
const sevBorder = (s) => ({ critical: C.redBorder, high: C.amberBorder, medium: "rgba(202,138,4,0.2)", low: C.greenBorder }[s] || C.border);
const sevBg = (s) => ({ critical: C.redLight, high: C.amberLight, medium: "rgba(202,138,4,0.08)", low: C.greenLight }[s] || "rgba(0,0,0,0.02)");
 
const SIGNAL_LABELS = {
  clarity: "Clarity",
  friction: "Friction",
  confidence: "Confidence",
  recovery: "Recovery"
};
 
const SIGNAL_DESCRIPTIONS = {
  clarity: "How clearly the design communicates what users should do and why",
  friction: "How much effort users need to complete their goals",
  confidence: "How certain users feel as they navigate the design",
  recovery: "How easily users can recover when something goes wrong"
};
 
const RATING_STYLE = {
  "Good": { color: C.green, bg: C.greenLight, border: C.greenBorder },
  "Needs Attention": { color: C.amber, bg: C.amberLight, border: C.amberBorder },
  "Critical": { color: C.red, bg: C.redLight, border: C.redBorder }
};
 
const getSignalStyle = (rating) => {
  if (!rating) return RATING_STYLE["Needs Attention"];
  if (RATING_STYLE[rating]) return RATING_STYLE[rating];
  const r = rating.toLowerCase();
  if (["good", "clear", "smooth", "confident", "resilient", "high", "strong"].includes(r)) return RATING_STYLE["Good"];
  if (["critical", "unclear", "high friction", "lost", "brittle", "low"].includes(r)) return RATING_STYLE["Critical"];
  return RATING_STYLE["Needs Attention"];
};
 
const deriveAssessment = (signals) => {
  if (!signals) return null;
  let good = 0, critical = 0, total = 0;
  Object.values(signals).forEach(val => {
    if (!val?.rating) return;
    total++;
    const style = getSignalStyle(val.rating);
    if (style === RATING_STYLE["Good"]) good++;
    else if (style === RATING_STYLE["Critical"]) critical++;
  });
  if (total === 0) return null;
  if (critical === 0 && good >= total * 0.75) return {
    label: "Strong", icon: "strong",
    explanation: "The design performs well across all signals. Focus on polish and edge cases before shipping.",
    color: C.green, bg: C.greenLight, border: C.greenBorder
  };
  if (critical <= total * 0.25) return {
    label: "On Track", icon: "ontrack",
    explanation: "Most signals are positive but there are areas worth addressing before shipping.",
    color: C.amber, bg: C.amberLight, border: C.amberBorder
  };
  return {
    label: "Needs Work", icon: "needswork",
    explanation: "Several signals indicate friction or confusion for this persona. Prioritise the findings below before moving forward.",
    color: C.red, bg: C.redLight, border: C.redBorder
  };
};
 
function AssessmentIcon({ type, color }) {
  if (type === "strong") return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="36" fill={color} fillOpacity="0.08"/>
      <circle cx="36" cy="36" r="28" fill={color} fillOpacity="0.12"/>
      <circle cx="36" cy="36" r="18" fill={color} fillOpacity="0.2"/>
      <circle cx="36" cy="36" r="8" fill={color}/>
    </svg>
  );
  if (type === "ontrack") return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="36" fill={color} fillOpacity="0.08"/>
      <path d="M36 8 A28 28 0 0 1 64 36 A28 28 0 0 1 36 64" stroke={color} strokeWidth="0" fill={color} fillOpacity="0.12"/>
      <path d="M36 16 A20 20 0 0 1 56 36 A20 20 0 0 1 36 56" stroke={color} strokeWidth="0" fill={color} fillOpacity="0.18"/>
      <path d="M36 26 A10 10 0 0 1 46 36 A10 10 0 0 1 36 46" stroke={color} strokeWidth="0" fill={color} fillOpacity="0.9"/>
      <circle cx="36" cy="36" r="4" fill={color}/>
    </svg>
  );
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="36" fill={color} fillOpacity="0.06"/>
      <path d="M12 36 A24 24 0 0 1 36 12 A24 24 0 0 1 60 36" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.3"/>
      <path d="M18 36 A18 18 0 0 1 36 18 A18 18 0 0 1 54 36" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.5"/>
      <path d="M24 36 A12 12 0 0 1 36 24 A12 12 0 0 1 48 36" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none"/>
      <circle cx="36" cy="36" r="4" fill={color}/>
    </svg>
  );
}
 
function SignalCard({ signalKey, rating, explanation }) {
  const style = getSignalStyle(rating);
  const label = SIGNAL_LABELS[signalKey];
  const desc = SIGNAL_DESCRIPTIONS[signalKey];
  if (!label) return null;
  const ratingLabel = Object.keys(RATING_STYLE).find(k => RATING_STYLE[k] === style) || rating;
  return (
    <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>{desc}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: style.color, padding: "4px 12px", borderRadius: 999, background: style.bg, border: `1px solid ${style.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>
          {ratingLabel}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: C.textMed, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>{explanation}</p>
    </div>
  );
}
 
function SummaryDrawer({ open, onClose, summary, simName }) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  const copy = () => { navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const download = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${simName || "lens-summary"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const lines = summary.split("\n");
  const sections = [];
  let current = null;
  lines.forEach(line => {
    if (!line.trim()) { if (current) { sections.push(current); current = null; } return; }
    if (line === line.toUpperCase() && line.trim().length > 2) {
      if (current) sections.push(current);
      current = { heading: line, body: [] };
    } else {
      if (!current) current = { heading: null, body: [] };
      current.body.push(line);
    }
  });
  if (current) sections.push(current);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px, 92vw)", background: C.surface, zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)" }}>
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Summary</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Ready to share with your PM or stakeholders</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${C.border}`, background: "transparent", cursor: "pointer", fontSize: 18, color: C.textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {sections.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textMuted, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
                  {section.heading}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {section.body.map((line, j) => (
                  <p key={j} style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: line.match(/^\d+\./) ? C.text : C.textMed, fontWeight: line.match(/^\d+\./) ? 600 : 400 }}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 28px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
          <button onClick={download} style={{ flex: 1, padding: "11px 16px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Download Summary
          </button>
          <button onClick={copy} style={{ padding: "11px 16px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: "transparent", color: copied ? C.green : C.textMed, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            {copied ? "✓ Copied" : "Copy text"}
          </button>
        </div>
      </div>
    </>
  );
}
 
function FindingThread({ finding, type, productType, personaDesc, constraintsSummary, simulationId, savedMessages, savedResolved, onResolveChange }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(savedMessages || []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState(savedResolved || false);
  const bottomRef = useRef();
 
  const saveConversation = async (updatedMessages, isResolved) => {
    if (!simulationId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("conversations").upsert({
      simulation_id: simulationId,
      finding_title: finding.title,
      finding_type: type,
      messages: updatedMessages,
      resolved: isResolved,
      user_id: user.id
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
      const systemPrompt = `You are an expert UX critic in a focused discussion about one specific design finding. Stay anchored to this finding only. Be concise — 2-4 sentences. When the designer provides context or constraints, acknowledge them and either revise your thinking, suggest a workaround, or validate their reasoning. Never repeat the original finding verbatim.
 
FINDING: ${finding.title} [${finding.severity}]
${finding.description}
Recommendation: ${finding.recommendation}
${finding.userImpact ? `User Impact: ${finding.userImpact}` : ""}
CONTEXT: Product: ${productType} | Persona: ${personaDesc} | Constraints: ${constraintsSummary}`;
 
      const apiMessages = newMessages.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
      const res = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 400, system: systemPrompt, messages: apiMessages })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `API error ${res.status}`);
      const reply = (data.content || []).map(b => b.text || "").join("").trim();
      const updatedMessages = [...newMessages, { role: "ai", text: reply }];
      setMessages(updatedMessages);
      await saveConversation(updatedMessages, resolved);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: `Something went wrong: ${err.message}` }]);
    } finally { setLoading(false); }
  };
 
  const toggleResolved = async () => {
    const newResolved = !resolved;
    setResolved(newResolved);
    await saveConversation(messages, newResolved);
    if (onResolveChange) onResolveChange(finding.title, newResolved);
  };
 
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)", background: resolved ? C.surfaceAlt : C.surface, opacity: resolved ? 0.65 : 1, transition: "all 0.2s" }}>
      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "lowercase", color: resolved ? C.textMuted : sevColor(finding.severity), padding: "2px 8px", borderRadius: 999, background: resolved ? "transparent" : sevBg(finding.severity), border: `1px solid ${resolved ? C.border : sevBorder(finding.severity)}` }}>
            {finding.severity}
          </span>
          {finding.effort && !resolved && (
            <span style={{ fontSize: 10, fontWeight: 500, color: "#78716C", padding: "2px 8px", borderRadius: 999, background: "rgba(120,113,108,0.07)", border: "1px solid rgba(120,113,108,0.18)" }}>
              {finding.effort} effort
            </span>
          )}
          {resolved && (
            <span style={{ fontSize: 10, fontWeight: 700, color: C.green, padding: "2px 8px", borderRadius: 999, background: C.greenLight, border: `1px solid ${C.greenBorder}` }}>✓ resolved</span>
          )}
        </div>
        <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", lineHeight: 1.4, color: resolved ? C.textMuted : C.text, textDecoration: resolved ? "line-through" : "none" }}>
          {finding.title}
        </h4>
        {!resolved && (
          <>
            <p style={{ margin: "0 0 8px", fontSize: 13, lineHeight: 1.65, color: C.textMed }}>{finding.description}</p>
            {finding.userImpact && (
              <div style={{ marginBottom: 10, padding: "7px 12px", borderRadius: 6, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>User impact </span>
                <span style={{ fontSize: 12, color: C.textMed }}>{finding.userImpact}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span style={{ color: type === "now" ? C.green : C.amber, fontSize: 15, flexShrink: 0 }}>→</span>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: C.text, fontWeight: 500 }}>{finding.recommendation}</p>
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setOpen(o => !o)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${C.border}`, background: open ? C.surfaceAlt : "transparent", color: C.textMed, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11 }}>{open ? "▾" : "▸"}</span>
            {messages.length > 0 ? `${messages.length} repl${messages.length === 1 ? "y" : "ies"}` : "Discuss"}
          </button>
          {messages.length > 0 && (
            <button onClick={toggleResolved} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${resolved ? C.border : C.greenBorder}`, background: resolved ? "transparent" : C.greenLight, color: resolved ? C.textMuted : C.green, cursor: "pointer" }}>
              {resolved ? "Mark unresolved" : "✓ Mark as resolved"}
            </button>
          )}
        </div>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, background: C.surfaceAlt }}>
          <div style={{ maxHeight: 320, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0", color: C.textMuted, fontSize: 13 }}>
                Add context, push back, or ask for alternatives.<br />
                <span style={{ fontSize: 12 }}>Once discussed you can mark this as resolved.</span>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8, flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: m.role === "user" ? C.accent : C.surface, color: m.role === "user" ? "#fff" : C.textMuted, border: `1px solid ${m.role === "user" ? "transparent" : C.border}` }}>
                  {m.role === "user" ? "U" : "L"}
                </div>
                <div style={{ maxWidth: "76%", padding: "10px 14px", borderRadius: m.role === "user" ? "12px 3px 12px 12px" : "3px 12px 12px 12px", background: m.role === "user" ? C.accent : C.surface, border: `1px solid ${m.role === "user" ? "transparent" : C.border}`, fontSize: 13, lineHeight: 1.65, color: m.role === "user" ? "#fff" : C.text }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: C.surface, color: C.textMuted, border: `1px solid ${C.border}` }}>L</div>
                <div style={{ padding: "10px 14px", borderRadius: "3px 12px 12px 12px", background: C.surface, border: `1px solid ${C.border}`, display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: C.textMuted, animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: "10px 18px 14px", display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Add context, push back, or ask for alternatives..."
              rows={2}
              style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.5 }} />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: !input.trim() || loading ? C.surfaceAlt : C.accent, color: !input.trim() || loading ? C.textMuted : "#fff", fontSize: 13, fontWeight: 600, cursor: !input.trim() || loading ? "not-allowed" : "pointer", flexShrink: 0 }}>
              Send
            </button>
          </div>
        </div>
      )}
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}
 
const TEAM_SIZE_LABELS = {
  solo: "Solo (just me)",
  small: "Small (2–5 people)",
  medium: "Medium (6–15 people)",
  large: "Large (15+ people)"
};

const INPUT_TYPE_LABELS = {
  figma: "Prototype Link",
  screenshots: "Screenshots",
  recording: "Screen Recording"
};

function SimulationDetailsSidebar({ inputType, productType, personaDesc, constraintsSummary, context, date }) {
  let constraints = {};
  try { constraints = JSON.parse(constraintsSummary); } catch {}
  const isCustomPersona = personaDesc === "Custom Persona";
  const customPersonaDescription = constraints.customPersonaDescription || null;
  const scopeLabels = Array.isArray(constraints.scopeLimits) ? constraints.scopeLimits : [];
  const teamSizeLabel = TEAM_SIZE_LABELS[constraints.teamSize?.toLowerCase()] || constraints.teamSize;

  const Row = ({ label, value }) => value ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{value}</div>
    </div>
  ) : null;

  const Divider = () => <div style={{ height: 1, background: C.border }} />;

  return (
    <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "20px", display: "flex", flexDirection: "column", gap: 0, position: "sticky", top: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMuted, paddingBottom: 16, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
        Simulation Details
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Input */}
        {inputType && <Row label="Input" value={INPUT_TYPE_LABELS[inputType] || inputType} />}

        {/* Product Type */}
        <Row label="Product Type" value={productType} />

        <Divider />

        {/* Persona */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Persona</div>
          {isCustomPersona ? (
            <>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>Custom Persona</div>
              {customPersonaDescription && (
                <div style={{ fontSize: 12, color: C.textMed, lineHeight: 1.65, fontStyle: "italic", padding: "10px 12px", background: C.surfaceAlt, borderRadius: 8, border: `1px solid ${C.border}`, marginTop: 2 }}>
                  "{customPersonaDescription}"
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: C.text }}>{personaDesc}</div>
          )}
        </div>

        {/* Additional Context */}
        {context && (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Additional Context</div>
            <div style={{ fontSize: 13, color: C.textMed, lineHeight: 1.6 }}>{context}</div>
          </div>
        )}

        <Divider />

        {/* Constraints */}
        {teamSizeLabel && <Row label="Team Size" value={teamSizeLabel} />}
        {constraints.timeline && <Row label="Timeline" value={constraints.timeline} />}
        {scopeLabels.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Scope Limits</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {scopeLabels.map((s, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: C.surfaceAlt, color: C.textMed, border: `1px solid ${C.border}` }}>{s}</span>
              ))}
            </div>
          </div>
        )}
        {constraints.otherConstraints && <Row label="Additional Notes" value={constraints.otherConstraints} />}

        {date && (
          <>
            <Divider />
            <Row label="Run On" value={date} />
          </>
        )}

      </div>
    </div>
  );
}
 
export default function ResultsSection({ critique, simulationId, inputType, productType, personaDesc, constraintsSummary, context, pmSummary, simConversations, simName, date, externalDrawerOpen, onExternalDrawerClose }) {
  const [activeTab, setActiveTab] = useState("now");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resolvedMap, setResolvedMap] = useState(() => {
    const map = {};
    Object.keys(simConversations || {}).forEach(k => {
      if (k.endsWith("_resolved")) map[k.replace("_resolved", "")] = simConversations[k];
    });
    return map;
  });

  const isDrawerOpen = drawerOpen || externalDrawerOpen || false;
  const closeDrawer = () => { setDrawerOpen(false); if (onExternalDrawerClose) onExternalDrawerClose(); };

  const actNow = critique.actNow || critique.act_now || [];
  const roadmap = critique.roadmap || [];
  const strengths = critique.strengths || [];
  const signals = critique.signals || {};
  const narrative = critique.narrativeWalkthrough || critique.narrative || "";
  const priorityFocus = critique.priorityFocus || critique.priority_focus || "";
  const summary = pmSummary || critique.pm_summary || "";
  const assessment = deriveAssessment(signals);
  const findings = activeTab === "now" ? actNow : roadmap;

  const handleResolveChange = (title, isResolved) => {
    setResolvedMap(prev => ({ ...prev, [title]: isResolved }));
  };

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <SummaryDrawer open={isDrawerOpen} onClose={closeDrawer} summary={summary} simName={simName} />

      {/* LEFT — main output column */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Overall Assessment card */}
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "32px" }}>
          {assessment && (
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMuted, marginBottom: 24 }}>Overall Assessment</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: assessment.color, padding: "5px 16px", borderRadius: 999, background: assessment.bg, border: `1px solid ${assessment.border}` }}>
                  {assessment.label}
                </span>
                <p style={{ margin: "16px 0 0", fontSize: 14, lineHeight: 1.7, color: C.textMed }}>{assessment.explanation}</p>
              </div>
              <div style={{ flexShrink: 0, paddingTop: 4 }}>
                <AssessmentIcon type={assessment.icon} color={assessment.color} />
              </div>
            </div>
          )}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Persona Walkthrough</div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: C.textMed, margin: 0, fontStyle: "italic" }}>"{narrative}"</p>
          </div>
        </div>

        {/* Design signals 2x2 */}
        {Object.keys(signals).length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMuted, marginBottom: 16 }}>Design Signals</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {Object.entries(SIGNAL_LABELS).map(([key]) => {
                const sig = signals[key];
                if (!sig) return null;
                return <SignalCard key={key} signalKey={key} rating={sig.rating} explanation={sig.explanation} />;
              })}
            </div>
          </div>
        )}

        {/* Priority focus */}
        {priorityFocus && (
          <div style={{ background: C.indigoLight, borderRadius: 10, border: `1px solid ${C.indigoBorder}`, padding: "20px 24px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.indigo, marginBottom: 12 }}>★ Priority Focus</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: C.text }}>{priorityFocus}</p>
          </div>
        )}

        {/* Findings tabs */}
        {(actNow.length > 0 || roadmap.length > 0) && (
          <div>
            <div style={{ display: "flex", borderBottom: `2px solid ${C.border}`, marginBottom: 20 }}>
              {[
                { id: "now", label: "Act Now", count: actNow.length },
                { id: "roadmap", label: "Roadmap", count: roadmap.length }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "12px 16px", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500, color: activeTab === tab.id ? C.text : C.textMuted, borderBottom: activeTab === tab.id ? `2px solid ${C.accent}` : "2px solid transparent", marginBottom: "-2px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" }}>
                  {tab.label}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 999, background: activeTab === tab.id ? C.accent : "transparent", color: activeTab === tab.id ? "#fff" : C.textMuted, border: activeTab === tab.id ? "none" : "1.5px solid rgba(0,0,0,0.25)", minWidth: 20, textAlign: "center" }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20, padding: "10px 14px", background: C.surfaceAlt, borderRadius: 6 }}>
              {activeTab === "now"
                ? "These findings are within your current constraints. Discuss any finding to add context, then mark it as resolved."
                : "These findings fall outside your current constraints. Use the Summary to share them with your PM."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {findings.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: C.textMuted, fontSize: 14 }}>
                  {activeTab === "now" ? "No immediate actions — check the Roadmap tab." : "Nothing for the roadmap — everything fits your constraints."}
                </div>
              ) : findings.map((fp, i) => (
                <FindingThread key={i} finding={fp} type={activeTab}
                  productType={productType} personaDesc={personaDesc} constraintsSummary={constraintsSummary}
                  simulationId={simulationId}
                  savedMessages={simConversations?.[fp.title] || []}
                  savedResolved={resolvedMap[fp.title] || false}
                  onResolveChange={handleResolveChange}
                />
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMuted, marginBottom: 10 }}>Strengths</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {strengths.map((s, i) => (
                <div key={i} style={{ padding: "12px 16px", borderRadius: 8, background: C.greenLight, border: `1px solid ${C.greenBorder}`, fontSize: 13, lineHeight: 1.65, color: C.text, display: "flex", gap: 10 }}>
                  <span style={{ color: C.green, flexShrink: 0 }}>✓</span>{s}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT — simulation details sidebar */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <SimulationDetailsSidebar
          inputType={inputType}
          productType={productType}
          personaDesc={personaDesc}
          constraintsSummary={constraintsSummary}
          context={context}
          date={date}
        />
      </div>
    </div>
  );
}
 