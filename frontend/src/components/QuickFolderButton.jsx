import { useState } from "react";
import api from "@/lib/api";
import { useAdmin } from "@/contexts/AdminContext";
import { FolderSimplePlus, X, Check } from "@phosphor-icons/react";

export default function QuickFolderButton({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { requestUnlock } = useAdmin();

  const submit = () => {
    if (!name.trim()) return;
    setErr("");
    requestUnlock(async (passcode) => {
      setBusy(true);
      try {
        const { data } = await api.post("/folders", { name: name.trim(), passcode });
        setName("");
        setOpen(false);
        onCreated?.(data);
      } catch (e) {
        setErr(e?.response?.data?.detail || "Failed");
      } finally { setBusy(false); }
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Create a new folder"
        data-testid="header-new-folder"
        className="w-10 h-10 sm:w-11 sm:h-11 border border-line hover:border-accent-green hover:bg-paper-alt flex items-center justify-center transition-all group"
      >
        <FolderSimplePlus size={18} weight="bold" className="text-accent-green group-hover:scale-110 transition-transform" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 z-50 bg-paper border border-ink p-4 fade-in" data-testid="quick-folder-popover" style={{ boxShadow: "4px 4px 0 0 var(--accent-green)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono-arch text-[10px] tracking-widest uppercase text-accent-green">New folder</p>
            <button onClick={() => setOpen(false)} className="text-ink-light hover:text-ink-dark" aria-label="Close">
              <X size={14} weight="bold" />
            </button>
          </div>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Folder name"
            className="input-line text-sm"
            data-testid="quick-folder-name"
          />
          {err && <p className="font-mono-arch text-[10px] uppercase tracking-widest text-accent-red mt-2">{err}</p>}
          <button onClick={submit} disabled={busy || !name.trim()} className="btn-primary w-full justify-center mt-3" data-testid="quick-folder-create">
            <Check size={14} weight="bold" /> {busy ? "Creating…" : "Create"}
          </button>
        </div>
      )}
    </div>
  );
}
