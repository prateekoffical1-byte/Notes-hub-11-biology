import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const AdminContext = createContext(null);
const STORAGE_KEY = "notes_hub_passcode";

export function AdminProvider({ children }) {
  const [passcode, setPasscode] = useState(() => sessionStorage.getItem(STORAGE_KEY) || "");
  const [verified, setVerified] = useState(false);
  const [prompting, setPrompting] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (passcode && !verified) {
      api.post("/passcode/verify", { passcode }).then(() => setVerified(true)).catch(() => {
        sessionStorage.removeItem(STORAGE_KEY);
        setPasscode("");
      });
    }
    // eslint-disable-next-line
  }, []);

  const requestUnlock = useCallback((onSuccess) => {
    if (verified) { onSuccess?.(passcode); return; }
    setPendingAction(() => onSuccess);
    setPrompting(true);
    setError("");
  }, [verified, passcode]);

  const submitPasscode = async (code) => {
    setError("");
    try {
      await api.post("/passcode/verify", { passcode: code });
      sessionStorage.setItem(STORAGE_KEY, code);
      setPasscode(code);
      setVerified(true);
      setPrompting(false);
      if (pendingAction) {
        const fn = pendingAction;
        setPendingAction(null);
        setTimeout(() => fn(code), 0);
      }
    } catch {
      setError("Wrong passcode. Try again.");
    }
  };

  const lock = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setPasscode("");
    setVerified(false);
  };

  const cancelPrompt = () => {
    setPrompting(false);
    setPendingAction(null);
    setError("");
  };

  return (
    <AdminContext.Provider value={{ verified, passcode, requestUnlock, lock }}>
      {children}
      {prompting && <PasscodeModal onSubmit={submitPasscode} onCancel={cancelPrompt} error={error} />}
    </AdminContext.Provider>
  );
}

function PasscodeModal({ onSubmit, onCancel, error }) {
  const [code, setCode] = useState("");
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 fade-in" data-testid="admin-passcode-modal" style={{ background: "rgba(31,42,31,0.6)" }}>
      <div className="bg-paper border border-ink max-w-md w-full p-6 sm:p-8 relative">
        <p className="font-mono-arch text-[11px] tracking-widest uppercase text-accent-green mb-2">Admin Action</p>
        <h2 className="font-serif-display text-2xl sm:text-3xl text-ink-dark mb-4">Enter passcode</h2>
        <p className="font-body text-sm text-ink-medium mb-6">
          Required for adding folders, deleting folders, or removing notes. Stays unlocked for this session.
        </p>
        <input
          type="password"
          className="input-line"
          placeholder="Passcode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSubmit(code); }}
          autoFocus
          data-testid="admin-passcode-input"
        />
        {error && (
          <div className="border border-line p-3 bg-paper-alt font-mono-arch text-xs uppercase tracking-widest text-accent-red mt-4">
            {error}
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <button onClick={() => onSubmit(code)} className="btn-primary" data-testid="admin-passcode-submit">Unlock</button>
          <button onClick={onCancel} className="btn-secondary" data-testid="admin-passcode-cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export const useAdmin = () => useContext(AdminContext);
