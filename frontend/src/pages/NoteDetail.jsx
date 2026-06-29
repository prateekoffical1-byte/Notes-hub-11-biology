import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { API, formatApiError } from "@/lib/api";
import {
  DownloadSimple, FilePdf, Image as ImageIcon, ArrowLeft, Trash,
  CalendarBlank, User, BookmarkSimple, Lock, X, ArrowsOutSimple, PencilSimple,
} from "@phosphor-icons/react";
import ImageAnnotator from "@/components/ImageAnnotator";

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDelete, setShowDelete] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [lightbox, setLightbox] = useState(false);
  const [annotate, setAnnotate] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/notes/${id}`)
      .then((r) => setNote(r.data))
      .catch((e) => setError(formatApiError(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    try {
      const res = await api.get(`/notes/${id}/file`, { responseType: "blob" });
      api.post(`/notes/${id}/download`).catch(() => {});
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = note.original_name || `${note.title}.${(note.file_ext || "").toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const openDelete = () => {
    setShowDelete(true);
    setPasscode("");
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!passcode.trim()) { setDeleteError("Please enter the passcode"); return; }
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/notes/${id}`, { params: { passcode: passcode.trim() } });
      navigate("/notes");
    } catch (e) {
      setDeleteError(formatApiError(e));
      setDeleting(false);
    }
  };

  if (loading) return <div className="py-24 sm:py-32 text-center font-mono-arch text-xs uppercase tracking-widest text-ink-medium">Loading...</div>;
  if (error || !note) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center" data-testid="note-not-found">
        <h2 className="font-serif-display text-3xl sm:text-4xl text-ink-dark mb-4">Note not found.</h2>
        <p className="font-body text-ink-medium mb-6">{error || "This entry may have been removed."}</p>
        <Link to="/notes" className="btn-secondary"><ArrowLeft size={14} weight="bold" /> Back to archive</Link>
      </div>
    );
  }

  const isPdf = note.file_type === "pdf";
  const imgSrc = `${API}/notes/${note.id}/file`;

  return (
    <>
      {(lightbox || annotate) && !isPdf && (
        annotate
          ? <ImageAnnotator src={imgSrc} alt={note.title} onClose={() => setAnnotate(false)} />
          : (
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black"
              onClick={() => setLightbox(false)}
              data-testid="image-lightbox"
            >
              <button
                className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 border border-white/30 text-white hover:border-white transition-all"
                onClick={() => setLightbox(false)}
              >
                <X size={18} weight="bold" />
              </button>
              <button
                className="absolute top-4 right-16 z-10 flex items-center gap-1.5 px-3 h-10 border border-white/30 text-white/80 hover:border-white hover:text-white transition-all font-mono-arch text-[10px] uppercase tracking-widest"
                onClick={(e) => { e.stopPropagation(); setLightbox(false); setAnnotate(true); }}
              >
                <PencilSimple size={14} weight="bold" /> Edit
              </button>
              <img
                src={imgSrc}
                alt={note.title}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
                data-testid="lightbox-image"
              />
              <p className="absolute bottom-4 left-0 right-0 text-center font-mono-arch text-[10px] uppercase tracking-widest text-white/40">
                Click outside to close · press Edit to annotate
              </p>
            </div>
          )
      )}

      <div className="relative z-10 fade-in" data-testid="note-detail-page">
        <div className="max-w-6xl container-arch mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-10">
          <Link to="/notes" className="font-mono-arch text-[11px] uppercase tracking-widest text-accent-green hover:text-ink-dark inline-flex items-center gap-2 mb-6 sm:mb-8" data-testid="back-link">
            <ArrowLeft size={14} weight="bold" /> Back to archive
          </Link>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-7">
              <div className={`border border-line bg-paper-alt ${!isPdf ? "cursor-zoom-in" : ""}`}>
                {isPdf ? (
                  <div className="aspect-[3/4]">
                    <iframe
                      src={imgSrc}
                      title={note.title}
                      className="w-full h-full"
                      data-testid="pdf-preview"
                    />
                  </div>
                ) : (
                  <div className="relative group">
                    <img
                      src={imgSrc}
                      alt={note.title}
                      className="w-full h-auto"
                      onClick={() => setLightbox(true)}
                      data-testid="image-preview"
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.35)" }}
                    >
                      <button
                        onClick={() => setLightbox(true)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-white text-white font-mono-arch text-[10px] uppercase tracking-widest hover:bg-white hover:text-ink-dark transition-all"
                      >
                        <ArrowsOutSimple size={14} weight="bold" /> Full Screen
                      </button>
                      <button
                        onClick={() => setAnnotate(true)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-white text-white font-mono-arch text-[10px] uppercase tracking-widest hover:bg-white hover:text-ink-dark transition-all"
                        data-testid="annotate-btn"
                      >
                        <PencilSimple size={14} weight="bold" /> Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <p className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light mt-3 text-right">
                {isPdf
                  ? <FilePdf size={12} weight="thin" className="inline text-accent-red" />
                  : <ImageIcon size={12} weight="thin" className="inline text-accent-sky" />}
                {" "}{note.file_ext} · {(note.size_bytes / 1024).toFixed(1)} KB
                {!isPdf && (
                  <span className="ml-3 text-accent-green cursor-pointer hover:underline" onClick={() => setAnnotate(true)}>
                    · annotate
                  </span>
                )}
              </p>
            </div>

            <div className="lg:col-span-5">
              <span className="tag-arch" data-testid="detail-chapter">{note.chapter}</span>
              <h1 className="font-serif-display text-3xl sm:text-4xl md:text-5xl text-ink-dark mt-4 sm:mt-5 leading-tight" data-testid="detail-title">
                {note.title}
              </h1>
              {note.description && (
                <p className="font-body text-base sm:text-lg text-ink-medium mt-5 sm:mt-6 leading-relaxed" data-testid="detail-description">
                  {note.description}
                </p>
              )}

              <div className="mt-8 divider-rule" />
              <dl className="mt-6 space-y-4 font-mono-arch text-xs uppercase tracking-widest">
                <div className="flex items-center justify-between">
                  <dt className="text-ink-light flex items-center gap-2"><User size={14} weight="thin" /> Shared by</dt>
                  <dd className="text-ink-dark" data-testid="detail-uploader">{note.uploader_name || "Anonymous"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-light flex items-center gap-2"><CalendarBlank size={14} weight="thin" /> Date</dt>
                  <dd className="text-ink-dark">{new Date(note.created_at).toLocaleDateString()}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-light flex items-center gap-2"><BookmarkSimple size={14} weight="thin" /> Chapter</dt>
                  <dd className="text-ink-dark text-right max-w-[60%]">{note.chapter}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-light flex items-center gap-2">
                    {isPdf ? <FilePdf size={14} weight="thin" /> : <ImageIcon size={14} weight="thin" />} Format
                  </dt>
                  <dd className="text-ink-dark">{note.file_ext}</dd>
                </div>
              </dl>

              <div className="mt-8 sm:mt-10 flex flex-wrap gap-3">
                <button onClick={handleDownload} className="btn-primary" data-testid="download-btn">
                  <DownloadSimple size={16} weight="bold" /> Download
                </button>
                {!isPdf && (
                  <button onClick={() => setAnnotate(true)} className="btn-secondary" data-testid="edit-btn">
                    <PencilSimple size={14} weight="bold" /> Edit
                  </button>
                )}
                <button onClick={openDelete} className="btn-secondary" data-testid="delete-btn">
                  <Trash size={14} weight="bold" /> Delete
                </button>
              </div>

              {showDelete && (
                <div className="mt-6 border border-line bg-paper-alt p-5 fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-mono-arch text-[11px] uppercase tracking-widest text-accent-red">Confirm Deletion</p>
                    <button onClick={() => setShowDelete(false)} className="text-ink-light hover:text-ink-dark">
                      <X size={14} weight="bold" />
                    </button>
                  </div>
                  <p className="font-body text-sm text-ink-medium mb-4">
                    Enter the upload passcode to permanently delete <strong>"{note.title}"</strong>. This cannot be undone.
                  </p>
                  <div className="relative mb-3">
                    <Lock size={14} weight="thin" className="absolute left-0 top-3 text-ink-light" />
                    <input
                      type="password"
                      placeholder="Upload passcode"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleDelete()}
                      className="input-line pl-6 w-full"
                      autoFocus
                      data-testid="delete-passcode-input"
                    />
                  </div>
                  {deleteError && (
                    <p className="font-mono-arch text-[10px] text-accent-red uppercase tracking-widest mb-3">{deleteError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="btn-primary text-sm"
                      style={{ background: "#c0392b", borderColor: "#c0392b" }}
                      data-testid="confirm-delete-btn"
                    >
                      <Trash size={14} weight="bold" /> {deleting ? "Deleting..." : "Delete forever"}
                    </button>
                    <button onClick={() => setShowDelete(false)} className="btn-secondary text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
