import { useCallback, useEffect, useState } from "react";

// The three things every Workshop tool does with the Workbench, in one place:
// take a held signal in, download the session, and bank it onto the signal if
// the operator chooses. Banking is never automatic.

const newKey = (moduleKey) => `${moduleKey}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

export function downloadText(filename, text, type = "text/markdown") {
  const b = new Blob([text], { type });
  const u = URL.createObjectURL(b);
  const a = document.createElement("a");
  a.href = u;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(u);
}

export const slug = (text, fallback = "session") =>
  String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || fallback;

// A plain record a tool can bank: named answers, and a synthesis if it has one.
export function sessionOutput({ title, fields = [], synthesis = "", extra = {} }) {
  const clean = fields.filter((f) => f && String(f.value || "").trim()).map((f) => ({ label: f.label, value: String(f.value).trim() }));
  return {
    kind: "session",
    summary: title,
    detail: { title, fields: clean, synthesis: String(synthesis || "").trim(), ...extra },
  };
}

export function sessionMarkdown({ title, tool, fields = [], synthesis = "" }) {
  const date = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  return [
    `# ${title}`,
    "",
    `${tool}, ${date}`,
    "",
    ...fields.filter((f) => f && String(f.value || "").trim()).map((f) => `## ${f.label}\n\n${String(f.value).trim()}\n`),
    String(synthesis || "").trim() ? `## Synthesis\n\n${String(synthesis).trim()}\n` : null,
  ].filter((l) => l !== null).join("\n");
}

/**
 * @param asu        the app's store instance (never a second instance)
 * @param moduleKey  the tool's key, e.g. "console"
 * @param source     how a signal created by banking is described, e.g. "the Console"
 */
export function useSignalSession(asu, moduleKey, source) {
  const [carried] = useState(() => asu?.get_carried?.() || null);
  const [signalId, setSignalId] = useState(carried?.signalId || null);
  const [signalText, setSignalText] = useState(carried?.text || null);
  const [sessionKey, setSessionKey] = useState(() => newKey(moduleKey));
  const [bankedTo, setBankedTo] = useState(null);

  // The signal has arrived; it should not follow the operator into the next tool.
  useEffect(() => { asu?.clear_carried?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Writes the session onto the carried signal, or onto a new held signal
  // named `title`. Banking the same session again updates the one reading.
  const bank = useCallback(({ title, output, key, signalId: preferred }) => {
    if (!asu?.attach_reading || !output) return null;
    const useKey = key || sessionKey;
    const signals = asu.get_signals?.() || [];
    const textOf = (id) => signals.find((s) => s.id === id)?.text || null;
    let target = signalId;
    let targetText = signalText;
    // A session that already lives on a signal stays there: the one it was
    // saved with, or the one this same session was banked to before.
    const earlier = (asu.get_flow_lane?.() || []).find((it) => it.key === useKey)?.signalId;
    for (const candidate of [preferred, target ? null : earlier]) {
      if (candidate && textOf(candidate)) { target = candidate; targetText = textOf(candidate); break; }
    }
    if (!target) {
      const held = asu.hold_signal(title, { source });
      if (!held) return null;
      target = held.id;
      targetText = held.text;
      setSignalId(held.id);
      setSignalText(held.text);
    }
    asu.attach_reading({ signalId: target, key: useKey, moduleKey, label: title, output });
    setBankedTo(targetText || textOf(target) || title);
    return target;
  }, [asu, moduleKey, source, signalId, signalText, sessionKey]);

  // A fresh session: nothing carried, nothing banked.
  const reset = useCallback(() => {
    setSignalId(null);
    setSignalText(null);
    setSessionKey(newKey(moduleKey));
    setBankedTo(null);
  }, [moduleKey]);

  // Continue a session that was banked earlier.
  const adopt = useCallback(({ signalId: id, key }) => {
    setSignalId(id || null);
    setSignalText(null);
    setSessionKey(key || newKey(moduleKey));
    setBankedTo(null);
  }, [moduleKey]);

  const clearBanked = useCallback(() => setBankedTo(null), []);

  return { carried, signalId, sessionKey, bankedTo, bank, reset, adopt, clearBanked };
}
