import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  PencilSimple, Eraser, Highlighter, TextT, Rectangle, Circle, LineSegment,
  ArrowCounterClockwise, ArrowClockwise, Trash, FloppyDisk, DownloadSimple,
  X, Sparkle, Square, GridFour, Notebook, ArrowsOutSimple, ArrowsInSimple,
} from "@phosphor-icons/react";

const COLORS = [
  { name: "Ink", value: "#1F2A1F" },
  { name: "Leaf", value: "#3A7D44" },
  { name: "Cherry", value: "#E8748B" },
  { name: "Sky", value: "#74B6D6" },
  { name: "Daffodil", value: "#F5C443" },
  { name: "Tulip", value: "#C04A2B" },
  { name: "Violet", value: "#7B4FAB" },
  { name: "Slate", value: "#5A6B7B" },
];
const SIZES = [2, 4, 8, 14, 24];
const BG_COLOR = "#FBFCF7";

const TOOLS = { PEN: "pen", HIGHLIGHTER: "highlighter", ERASER: "eraser", LINE: "line", RECT: "rect", CIRCLE: "circle", TEXT: "text" };

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const wrapRef = useRef(null);
  const drawingRef = useRef(false);
  const startPt = useRef(null);
  const lastPt = useRef(null);
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  const { user } = useAuth();
  const nav = useNavigate();

  const [color, setColor] = useState(COLORS[1].value);
  const [size, setSize] = useState(4);
  const [tool, setTool] = useState(TOOLS.PEN);
  const [background, setBackground] = useState("blank");
  const [fullscreen, setFullscreen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const setupCanvas = (c) => {
      if (!c) return null;
      const wrap = wrapRef.current;
      const dpr = window.devicePixelRatio || 1;
      const rect = wrap.getBoundingClientRect();
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
      c.style.width = `${rect.width}px`;
      c.style.height = `${rect.height}px`;
      const ctx = c.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      return { ctx, w: rect.width, h: rect.height };
    };
    const main = setupCanvas(canvasRef.current);
    setupCanvas(previewRef.current);
    if (main) {
      main.ctx.fillStyle = BG_COLOR;
      main.ctx.fillRect(0, 0, main.w, main.h);
      pushUndo();
    }
    // eslint-disable-next-line
  }, [fullscreen]);

  const pushUndo = () => {
    const c = canvasRef.current;
    if (!c) return;
    undoStack.current.push(c.toDataURL("image/png"));
    if (undoStack.current.length > 40) undoStack.current.shift();
    redoStack.current = [];
  };

  const restoreFromDataURL = (url, canvas) => {
    const ctx = canvas.getContext("2d");
    const w = parseInt(canvas.style.width);
    const h = parseInt(canvas.style.height);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const dpr = window.devicePixelRatio || 1;
        ctx.scale(dpr, dpr);
        ctx.fillStyle = BG_COLOR;
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        resolve();
      };
      img.src = url;
    });
  };

  const undo = async () => {
    if (undoStack.current.length <= 1) return;
    const cur = undoStack.current.pop();
    redoStack.current.push(cur);
    const prev = undoStack.current[undoStack.current.length - 1];
    await restoreFromDataURL(prev, canvasRef.current);
  };

  const redo = async () => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop();
    undoStack.current.push(next);
    await restoreFromDataURL(next, canvasRef.current);
  };

  const clearAll = () => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    const w = parseInt(c.style.width);
    const h = parseInt(c.style.height);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);
    pushUndo();
  };

  const getPos = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (e) => {
    if (tool === TOOLS.TEXT) return;
    e.preventDefault();
    drawingRef.current = true;
    startPt.current = getPos(e);
    lastPt.current = startPt.current;
  };

  const move = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const p = getPos(e);
    if (tool === TOOLS.PEN || tool === TOOLS.HIGHLIGHTER || tool === TOOLS.ERASER) {
      const ctx = canvasRef.current.getContext("2d");
      if (tool === TOOLS.ERASER) {
        ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
        ctx.strokeStyle = BG_COLOR; ctx.lineWidth = size * 3;
      } else if (tool === TOOLS.HIGHLIGHTER) {
        ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = 0.35;
        ctx.strokeStyle = color; ctx.lineWidth = size * 4;
      } else {
        ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
        ctx.strokeStyle = color; ctx.lineWidth = size;
      }
      ctx.beginPath();
      ctx.moveTo(lastPt.current.x, lastPt.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastPt.current = p;
    } else if ([TOOLS.LINE, TOOLS.RECT, TOOLS.CIRCLE].includes(tool)) {
      const prev = previewRef.current.getContext("2d");
      const w = parseInt(previewRef.current.style.width);
      const h = parseInt(previewRef.current.style.height);
      prev.clearRect(0, 0, w, h);
      prev.globalAlpha = 1; prev.globalCompositeOperation = "source-over";
      prev.strokeStyle = color; prev.lineWidth = size;
      const sx = startPt.current.x, sy = startPt.current.y;
      prev.beginPath();
      if (tool === TOOLS.LINE) { prev.moveTo(sx, sy); prev.lineTo(p.x, p.y); }
      else if (tool === TOOLS.RECT) prev.rect(sx, sy, p.x - sx, p.y - sy);
      else if (tool === TOOLS.CIRCLE) { const r = Math.hypot(p.x - sx, p.y - sy); prev.arc(sx, sy, r, 0, Math.PI * 2); }
      prev.stroke();
    }
  };

  const end = (e) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const p = lastPt.current || (e && getPos(e)) || startPt.current;
    if ([TOOLS.LINE, TOOLS.RECT, TOOLS.CIRCLE].includes(tool)) {
      const ctx = canvasRef.current.getContext("2d");
      const prev = previewRef.current.getContext("2d");
      const w = parseInt(previewRef.current.style.width);
      const h = parseInt(previewRef.current.style.height);
      prev.clearRect(0, 0, w, h);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color; ctx.lineWidth = size;
      const sx = startPt.current.x, sy = startPt.current.y;
      ctx.beginPath();
      if (tool === TOOLS.LINE) { ctx.moveTo(sx, sy); ctx.lineTo(p.x, p.y); }
      else if (tool === TOOLS.RECT) ctx.rect(sx, sy, p.x - sx, p.y - sy);
      else if (tool === TOOLS.CIRCLE) { const r = Math.hypot(p.x - sx, p.y - sy); ctx.arc(sx, sy, r, 0, Math.PI * 2); }
      ctx.stroke();
    }
    pushUndo();
  };

  const handleCanvasClick = (e) => {
    if (tool !== TOOLS.TEXT) return;
    const p = getPos(e);
    const text = window.prompt("Type your text:");
    if (!text) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = color;
    ctx.font = `${Math.max(14, size * 5)}px "Cormorant Garamond", Georgia, serif`;
    ctx.textBaseline = "top";
    ctx.fillText(text, p.x, p.y);
    pushUndo();
  };

  const downloadPng = () => {
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = `whiteboard-${Date.now()}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const saveAsNote = async () => {
    if (!title.trim()) { setError("Add a title for your note"); return; }
    if (!passcode.trim()) { setError("Enter the upload passcode"); return; }
    setError(""); setSaving(true);
    try {
      const blob = await new Promise((res) => canvasRef.current.toBlob(res, "image/png", 0.95));
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description.trim() || "Whiteboard sketch");
      fd.append("passcode", passcode.trim());
      fd.append("file", blob, `whiteboard-${Date.now()}.png`);
      const { data } = await api.post("/notes", fd, { headers: { "Content-Type": "multipart/form-data" } });
      nav(`/notes/${data.id}`);
    } catch (e) { setError(formatApiError(e)); }
    finally { setSaving(false); }
  };

  const bgPattern = background === "grid"
    ? { backgroundImage: "linear-gradient(to right, rgba(58,125,68,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(58,125,68,0.10) 1px, transparent 1px)", backgroundSize: "32px 32px" }
    : background === "ruled"
      ? { backgroundImage: "linear-gradient(to bottom, transparent 31px, rgba(58,125,68,0.18) 32px)", backgroundSize: "100% 32px" }
      : {};

  const ToolBtn = ({ value, icon, label, testid }) => (
    <button
      onClick={() => setTool(value)}
      data-testid={testid}
      title={label}
      className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 border transition-all ${tool === value ? "border-ink bg-paper-alt" : "border-line hover:border-accent-green"}`}
    >
      {icon}
    </button>
  );

  const containerClass = fullscreen ? "fixed inset-0 z-50 bg-paper flex flex-col" : "relative z-10 fade-in";

  return (
    <div className={containerClass} data-testid="whiteboard-page">
      <section className={`border-b border-line ${fullscreen ? "" : "bg-paper-alt"}`}>
        <div className={`${fullscreen ? "" : "max-w-7xl mx-auto"} px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex items-center justify-between gap-4 flex-wrap`}>
          {!fullscreen && (
            <div>
              <p className="font-mono-arch text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-accent-green mb-1 sm:mb-2 flex items-center gap-2">
                <Sparkle size={14} weight="fill" className="text-accent-yellow" /> Smartboard Studio
              </p>
              <h1 className="font-serif-display text-2xl sm:text-3xl md:text-4xl text-ink-dark leading-tight">
                Sketch it. Save it. <em className="italic text-accent-green">Share it.</em>
              </h1>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button onClick={undo} className="btn-secondary" data-testid="wb-undo"><ArrowCounterClockwise size={14} weight="bold" /></button>
            <button onClick={redo} className="btn-secondary" data-testid="wb-redo"><ArrowClockwise size={14} weight="bold" /></button>
            <button onClick={clearAll} className="btn-secondary" data-testid="wb-clear"><Trash size={14} weight="bold" /> Clear</button>
            <button onClick={() => setFullscreen((v) => !v)} className="btn-secondary" data-testid="wb-fullscreen">
              {fullscreen ? <ArrowsInSimple size={14} weight="bold" /> : <ArrowsOutSimple size={14} weight="bold" />}
            </button>
            <button onClick={downloadPng} className="btn-secondary" data-testid="wb-download"><DownloadSimple size={14} weight="bold" /> PNG</button>
            <button onClick={() => setShowSave(true)} className="btn-primary" data-testid="wb-save-open"><FloppyDisk size={14} weight="bold" /> Save as Note</button>
          </div>
        </div>
      </section>

      <section className={fullscreen ? "flex-1 overflow-hidden" : ""}>
        <div className={`${fullscreen ? "h-full" : "max-w-7xl mx-auto"} px-4 sm:px-6 md:px-8 py-5 sm:py-6 grid lg:grid-cols-12 gap-5 ${fullscreen ? "h-full" : ""}`}>
          <aside className="lg:col-span-2 border border-line bg-paper p-4 sm:p-5 flex lg:flex-col flex-row flex-wrap gap-5" data-testid="wb-palette">
            <div>
              <p className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light mb-2">Tools</p>
              <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
                <ToolBtn value={TOOLS.PEN} icon={<PencilSimple size={18} weight={tool === TOOLS.PEN ? "fill" : "thin"} />} label="Pen" testid="wb-tool-pen" />
                <ToolBtn value={TOOLS.HIGHLIGHTER} icon={<Highlighter size={18} weight={tool === TOOLS.HIGHLIGHTER ? "fill" : "thin"} />} label="Highlighter" testid="wb-tool-highlighter" />
                <ToolBtn value={TOOLS.ERASER} icon={<Eraser size={18} weight={tool === TOOLS.ERASER ? "fill" : "thin"} />} label="Eraser" testid="wb-tool-eraser" />
                <ToolBtn value={TOOLS.TEXT} icon={<TextT size={18} weight={tool === TOOLS.TEXT ? "fill" : "thin"} />} label="Text" testid="wb-tool-text" />
                <ToolBtn value={TOOLS.LINE} icon={<LineSegment size={18} weight={tool === TOOLS.LINE ? "fill" : "thin"} />} label="Line" testid="wb-tool-line" />
                <ToolBtn value={TOOLS.RECT} icon={<Rectangle size={18} weight={tool === TOOLS.RECT ? "fill" : "thin"} />} label="Rectangle" testid="wb-tool-rect" />
                <ToolBtn value={TOOLS.CIRCLE} icon={<Circle size={18} weight={tool === TOOLS.CIRCLE ? "fill" : "thin"} />} label="Circle" testid="wb-tool-circle" />
              </div>
            </div>

            <div>
              <p className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light mb-2">Colour</p>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    title={c.name}
                    data-testid={`wb-color-${c.name.toLowerCase()}`}
                    className={`w-7 h-7 sm:w-8 sm:h-8 border-2 transition-all ${color === c.value ? "border-ink scale-110" : "border-line"}`}
                    style={{ backgroundColor: c.value, borderRadius: 0 }}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light mb-2">Brush size</p>
              <div className="flex items-center gap-1.5">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    data-testid={`wb-size-${s}`}
                    className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 border ${size === s ? "border-ink bg-paper-alt" : "border-line"}`}
                  >
                    <span className="rounded-full bg-ink-dark" style={{ width: s, height: s }} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light mb-2">Background</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setBackground("blank")} className={`flex items-center justify-center w-full h-9 border ${background === "blank" ? "border-ink bg-paper-alt" : "border-line"}`} title="Blank" data-testid="wb-bg-blank"><Square size={16} weight="thin" /></button>
                <button onClick={() => setBackground("grid")} className={`flex items-center justify-center w-full h-9 border ${background === "grid" ? "border-ink bg-paper-alt" : "border-line"}`} title="Grid" data-testid="wb-bg-grid"><GridFour size={16} weight="thin" /></button>
                <button onClick={() => setBackground("ruled")} className={`flex items-center justify-center w-full h-9 border ${background === "ruled" ? "border-ink bg-paper-alt" : "border-line"}`} title="Ruled" data-testid="wb-bg-ruled"><Notebook size={16} weight="thin" /></button>
              </div>
            </div>
          </aside>

          <div className={`lg:col-span-10 ${fullscreen ? "h-full" : ""}`}>
            <div ref={wrapRef} className="border-2 border-line bg-paper relative" style={{ height: fullscreen ? "calc(100vh - 220px)" : "70vh", minHeight: 420, touchAction: "none", ...bgPattern }}>
              <canvas
                ref={canvasRef}
                onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
                onTouchStart={start} onTouchMove={move} onTouchEnd={end}
                onClick={handleCanvasClick}
                data-testid="wb-canvas"
                style={{ position: "absolute", inset: 0, cursor: tool === TOOLS.TEXT ? "text" : tool === TOOLS.ERASER ? "cell" : "crosshair", touchAction: "none", background: "transparent" }}
              />
              <canvas ref={previewRef} data-testid="wb-preview" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "transparent" }} />
            </div>
            <p className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light mt-3 flex flex-wrap items-center justify-between gap-2">
              <span>Pen · Highlighter · Eraser · Text · Shapes</span>
              <span>Stylus · Touch · Mouse · Smartboard ready</span>
            </p>
          </div>
        </div>
      </section>

      {showSave && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 fade-in" data-testid="wb-save-modal" style={{ background: "rgba(31,42,31,0.6)" }}>
          <div className="bg-paper border border-ink max-w-lg w-full p-6 sm:p-8 relative">
            <button onClick={() => setShowSave(false)} className="absolute right-4 top-4 text-ink-medium hover:text-accent-red" data-testid="wb-save-close">
              <X size={20} weight="thin" />
            </button>
            <p className="font-mono-arch text-[11px] tracking-widest uppercase text-accent-green mb-2">Save to Archive</p>
            <h2 className="font-serif-display text-2xl sm:text-3xl text-ink-dark mb-6">Name your sketch</h2>
            {!user && <p className="font-body text-sm text-ink-medium mb-4">You&apos;re not signed in — sketch will be saved anonymously.</p>}
            <div className="space-y-5">
              <div>
                <label className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light block mb-1">Title</label>
                <input className="input-line" value={title} onChange={(e) => setTitle(e.target.value)} data-testid="wb-save-title" />
              </div>
              <div>
                <label className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light block mb-1">Description (optional)</label>
                <input className="input-line" value={description} onChange={(e) => setDescription(e.target.value)} data-testid="wb-save-description" />
              </div>
              <div className="border p-4" style={{ borderColor: "var(--accent-yellow)", background: "var(--bg-paper-alt)" }}>
                <label className="font-mono-arch text-[10px] tracking-widest uppercase text-accent-green block mb-1 flex items-center gap-1"><FloppyDisk size={12} weight="fill" /> Upload Passcode</label>
                <input type="password" className="input-line" placeholder="Enter passcode" value={passcode} onChange={(e) => setPasscode(e.target.value)} data-testid="wb-save-passcode" autoComplete="off" />
              </div>
              {error && <div className="border border-line p-3 bg-paper-alt font-mono-arch text-xs uppercase tracking-widest text-accent-red" data-testid="wb-save-error">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button onClick={saveAsNote} disabled={saving} className="btn-primary" data-testid="wb-save-submit">
                  <FloppyDisk size={14} weight="bold" /> {saving ? "Saving..." : "Save Sketch"}
                </button>
                <button onClick={() => setShowSave(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
