import { useState } from "react";
import { Link } from "react-router-dom";
import { FilePdf, Image as ImageIcon, CalendarBlank, Trash, X, Lock } from "@phosphor-icons/react";
import { API } from "@/lib/api";
import api, { formatApiError } from "@/lib/api";

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return ""; }
}

export default function NoteCard({ note, index = 0, onDelete }) {
  const isPdf = note.file_type === "pdf";
  const [showConfirm, setShowConfirm] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const openConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
    setPasscode("");
    setError("");
  };

  const closeConfirm = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowConfirm(false);
    setError("");
    setPasscode("");
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!passcode.trim()) { setError("Enter the passcode"); return; }
    setDeleting(true);
    setError("");
    try {
      await api.delete(`/notes/${note.id}`, { params: { passcode: passcode.trim() } });
      if (onDelete) onDelete(note.id);
    } catch (err) {
      setError(formatApiError(err));
      setDeleting(false);
    }
  };

  return (
    <div className="relative" data-testid={`note-card-${note.id}`}>
      <Link
        to={`/notes/${note.id}`}
        className="note-card group fade-in block"
        style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      >
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <span className="tag-arch" data-testid="note-chapter-tag">{note.chapter || "Biology"}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light flex items-center gap-1.5">
              {isPdf
                ? <FilePdf size={14} weight="thin" className="text-accent-red" />
                : <ImageIcon size={14} weight="thin" className="text-accent-sky" />}
              {note.file_ext}
            </span>
            <button
              onClick={openConfirm}
              title="Delete note"
              data-testid="delete-note-btn"
              className="p-1 text-ink-light hover:text-accent-red transition-colors"
            >
              <Trash size={14} weight="bold" />
            </button>
          </div>
        </div>

        {!isPdf && (
          <div className="mb-4 border border-line bg-paper-alt overflow-hidden aspect-[4/3]">
            <img
              src={`${API}/notes/${note.id}/file`}
              alt={note.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {isPdf && (
          <div className="mb-4 border border-line bg-paper-alt aspect-[4/3] flex items-center justify-center relative overflow-hidden">
            <FilePdf size={72} weight="thin" className="text-accent-green opacity-70" />
            <div className="absolute bottom-2 right-2 font-mono-arch text-[9px] tracking-widest uppercase text-ink-light">
              {(note.size_bytes / 1024).toFixed(1)} KB
            </div>
          </div>
        )}

        <div className="flex-1">
          <h3 className="font-serif-display text-xl md:text-2xl leading-tight text-ink-dark mb-2 group-hover:text-accent-green transition-colors" data-testid="note-title">
            {note.title}
          </h3>
          {note.description && (
            <p className="font-body text-sm text-ink-medium leading-relaxed line-clamp-3">
              {note.description}
            </p>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-line flex items-center justify-between font-mono-arch text-[10px] tracking-widest uppercase text-ink-light">
          <span className="flex items-center gap-1.5">
            <CalendarBlank size={12} weight="thin" /> {formatDate(note.created_at)}
          </span>
          <span className="truncate max-w-[50%]">{note.uploader_name || "Anonymous"}</span>
        </div>
      </Link>

      {showConfirm && (
        <div
          className="absolute inset-0 z-10 bg-paper border border-line flex flex-col justify-center p-5 fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-mono-arch text-[11px] uppercase tracking-widest text-accent-red mb-1">Delete Note</p>
              <p className="font-serif-display text-lg text-ink-dark leading-snug line-clamp-2">{note.title}</p>
            </div>
            <button onClick={closeConfirm} className="text-ink-light hover:text-ink-dark ml-2 mt-0.5">
              <X size={16} weight="bold" />
            </button>
          </div>

          <p className="font-body text-xs text-ink-medium mb-4">Enter the upload passcode to confirm deletion. This cannot be undone.</p>

          <div className="relative mb-3">
            <Lock size={14} weight="thin" className="absolute left-0 top-3 text-ink-light" />
            <input
              type="password"
              placeholder="Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDelete(e)}
              className="input-line pl-6 text-sm w-full"
              autoFocus
            />
          </div>

          {error && <p className="font-mono-arch text-[10px] text-accent-red uppercase tracking-widest mb-3">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-primary text-xs py-2 flex-1"
              style={{ background: "#c0392b", borderColor: "#c0392b" }}
            >
              <Trash size={12} weight="bold" /> {deleting ? "Deleting..." : "Delete"}
            </button>
            <button onClick={closeConfirm} className="btn-secondary text-xs py-2">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
