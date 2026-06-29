import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  UploadSimple, FilePdf, Image as ImageIcon, CheckCircle, X, Lock,
  FolderSimple, Camera, ImagesSquare, Files, ShareNetwork,
} from "@phosphor-icons/react";

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passcode, setPasscode] = useState("");
  const [folderId, setFolderId] = useState("");
  const [folders, setFolders] = useState([]);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const pdfRef = useRef(null);
  const anyRef = useRef(null);

  useEffect(() => {
    api.get("/folders").then((r) => setFolders(r.data.folders)).catch(() => {});
  }, []);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setError("");
    if (!f) { setFile(null); return; }
    const ok = /\.(pdf|png|jpg|jpeg|webp)$/i.test(f.name) || /^image\//.test(f.type) || f.type === "application/pdf";
    if (!ok) { setError("Allowed: PDF, PNG, JPG, JPEG, WEBP"); return; }
    if (f.size > 100 * 1024 * 1024) { setError("File too large (max 100MB)"); return; }
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Please add a title"); return; }
    if (!file) { setError("Please choose a file"); return; }
    if (!passcode.trim()) { setError("Please enter the upload passcode"); return; }

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("description", description.trim());
    fd.append("passcode", passcode.trim());
    if (folderId) fd.append("folder_id", folderId);
    fd.append("file", file);

    setSubmitting(true);
    setProgress(0);
    try {
      const { data } = await api.post("/notes", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total));
        },
      });
      setDone(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center fade-in" data-testid="upload-success">
        <CheckCircle size={56} weight="thin" className="mx-auto text-accent-green mb-4" />
        <h1 className="font-serif-display text-4xl sm:text-5xl text-ink-dark mb-4">Filed in the archive.</h1>
        <p className="font-body text-lg text-ink-medium mb-10">
          Your note is now part of the Class XI Biology library. Thank you for contributing.
        </p>
        <div className="flex justify-center flex-wrap gap-4">
          <Link to={`/notes/${done.id}`} className="btn-primary" data-testid="view-uploaded-btn">View your note</Link>
          <button
            onClick={() => { setDone(null); setTitle(""); setDescription(""); setPasscode(""); setFile(null); setProgress(0); }}
            className="btn-secondary"
            data-testid="upload-another-btn"
          >
            Upload another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 fade-in" data-testid="upload-page">
      <section className="border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16">
          <p className="font-mono-arch text-xs tracking-[0.25em] uppercase text-accent-green mb-4">Contribute</p>
          <h1 className="font-serif-display text-4xl sm:text-5xl md:text-6xl text-ink-dark">Share a note.</h1>
          <p className="font-body text-base sm:text-lg text-ink-medium mt-4 max-w-2xl">
            Add a PDF or image to the archive. Pick from your camera, gallery, files — even WhatsApp or Drive.{" "}
            {user ? (
              <span className="text-ink-dark">Signed in as {user.name}, so this entry will be credited to you.</span>
            ) : (
              <><Link to="/login" className="link-underline">Sign in</Link> to keep track of your uploads.</>
            )}
          </p>
        </div>
      </section>

      <section>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-12">
          <form onSubmit={submit} className="space-y-8 sm:space-y-10">

            {/* Quick source picker */}
            <div>
              <label className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light block mb-3">Source · Camera · Gallery · Files · WhatsApp · Drive (max 100MB)</label>
              {!file ? (
                <div data-testid="upload-source-picker">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <SourceTile icon={<Camera size={26} weight="thin" />} label="Camera" sub="Snap a page" onClick={() => cameraRef.current?.click()} testid="src-camera" tint="var(--accent-pink)" />
                    <SourceTile icon={<ImagesSquare size={26} weight="thin" />} label="Gallery" sub="Photos" onClick={() => galleryRef.current?.click()} testid="src-gallery" tint="var(--accent-sky)" />
                    <SourceTile icon={<FilePdf size={26} weight="thin" />} label="PDF" sub="Docs" onClick={() => pdfRef.current?.click()} testid="src-pdf" tint="var(--accent-green)" />
                    <SourceTile icon={<ShareNetwork size={26} weight="thin" />} label="Other App" sub="WhatsApp · Drive" onClick={() => anyRef.current?.click()} testid="src-any" tint="var(--accent-yellow)" />
                  </div>

                  <input ref={cameraRef} type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFile} data-testid="file-input-camera" />
                  <input ref={galleryRef} type="file" className="hidden" accept="image/*" onChange={handleFile} data-testid="file-input-gallery" />
                  <input ref={pdfRef} type="file" className="hidden" accept=".pdf,application/pdf" onChange={handleFile} data-testid="file-input-pdf" />
                  <input ref={anyRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf,*/*" onChange={handleFile} data-testid="file-input-any" />

                  <label className="border border-dashed border-line p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer hover:border-accent-green hover:bg-paper-alt transition-all" data-testid="file-dropzone">
                    <UploadSimple size={28} weight="thin" className="text-ink-medium mb-2" />
                    <span className="font-body text-sm sm:text-base text-ink-medium">or drop / pick any file here</span>
                    <span className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light mt-1">PDF · PNG · JPG · WEBP</span>
                    <input type="file" className="hidden" onChange={handleFile} accept=".pdf,.png,.jpg,.jpeg,.webp" data-testid="file-input" />
                  </label>
                </div>
              ) : (
                <div className="border border-line bg-paper-alt p-5 flex items-center justify-between gap-4" data-testid="file-selected">
                  <div className="flex items-center gap-4 min-w-0">
                    {/\.pdf$/i.test(file.name) || file.type === "application/pdf"
                      ? <FilePdf size={28} weight="thin" className="text-ink-dark shrink-0" />
                      : <ImageIcon size={28} weight="thin" className="text-ink-dark shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-serif-display text-lg sm:text-xl text-ink-dark truncate">{file.name || "captured-image.jpg"}</div>
                      <div className="font-mono-arch text-[11px] uppercase tracking-widest text-ink-light">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setFile(null)} className="text-ink-medium hover:text-accent-red" data-testid="remove-file-btn">
                    <X size={20} weight="thin" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light block mb-2">Title</label>
              <input
                data-testid="upload-title-input"
                className="input-line"
                placeholder="e.g. Mitosis Diagrams"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
            </div>

            <div>
              <label className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light block mb-2">Description (optional)</label>
              <textarea
                data-testid="upload-description-input"
                className="input-line resize-none"
                rows={3}
                placeholder="A brief note about what's inside..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={400}
              />
            </div>

            <div>
              <label className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light block mb-2">Folder (optional)</label>
              <select
                data-testid="upload-folder-select"
                className="input-line bg-transparent cursor-pointer"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
              >
                <option value="">— Unfiled —</option>
                {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <p className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light mt-2 flex items-center gap-1">
                <FolderSimple size={12} weight="thin" /> Use the folder icon in the header to create new folders
              </p>
            </div>

            {/* Passcode gate */}
            <div className="border p-5 sm:p-6" data-testid="passcode-section" style={{ borderColor: "var(--accent-yellow)", background: "var(--bg-paper-alt)" }}>
              <div className="flex items-center gap-2 font-mono-arch text-[10px] tracking-widest uppercase text-accent-green mb-2">
                <Lock size={14} weight="fill" /> Upload Passcode Required
              </div>
              <input
                data-testid="upload-passcode-input"
                type="password"
                className="input-line"
                placeholder="Enter the secret passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoComplete="off"
              />
              <p className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light mt-2">
                Ask the archive owner if you don&apos;t know the passcode.
              </p>
            </div>

            {submitting && (
              <div data-testid="upload-progress">
                <div className="flex justify-between font-mono-arch text-[11px] uppercase tracking-widest text-ink-light mb-2">
                  <span>Uploading…</span><span>{progress}%</span>
                </div>
                <div className="h-[3px] w-full bg-paper-dark relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-accent-green transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {error && (
              <div className="border border-line p-4 bg-paper-alt font-mono-arch text-xs uppercase tracking-widest text-accent-red" data-testid="upload-error">
                {error}
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              <button type="submit" className="btn-primary" disabled={submitting} data-testid="upload-submit-btn">
                <UploadSimple size={16} weight="bold" /> {submitting ? "Uploading…" : "Submit to Archive"}
              </button>
              <Link to="/notes" className="font-mono-arch text-xs uppercase tracking-widest text-ink-medium hover:text-ink-dark">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function SourceTile({ icon, label, sub, onClick, testid, tint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className="border border-line bg-paper hover:bg-paper-alt transition-all p-4 flex flex-col items-center text-center group"
      style={{ borderLeft: `3px solid ${tint}` }}
    >
      <span className="group-hover:scale-110 transition-transform" style={{ color: tint }}>
        {icon}
      </span>
      <span className="font-serif-display text-base sm:text-lg text-ink-dark mt-2">{label}</span>
      <span className="font-mono-arch text-[9px] tracking-widest uppercase text-ink-light mt-0.5">{sub}</span>
    </button>
  );
}
