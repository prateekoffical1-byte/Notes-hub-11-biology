import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, PencilSimple, Highlighter, Eraser, TextT, LineSegment, Rectangle,
  Circle, ArrowCounterClockwise, ArrowClockwise, DownloadSimple,
  Trash, ArrowsInSimple,
} from "@phosphor-icons/react";

const COLORS = [
  { name: "Ink",      value: "#1F2A1F" },
  { name: "Leaf",     value: "#3A7D44" },
  { name: "Cherry",   value: "#E8748B" },
  { name: "Sky",      value: "#74B6D6" },
  { name: "Daffodil", value: "#F5C443" },
  { name: "Tulip",    value: "#C04A2B" },
  { name: "Violet",   value: "#7B4FAB" },
  { name: "White",    value: "#FFFFFF" },
];
const SIZES = [2, 4, 8, 14, 24];
const TOOLS = { PEN: "pen", HIGHLIGHTER: "highlighter", ERASER: "eraser", LINE: "line", RECT: "rect", CIRCLE: "circle", TEXT: "text" };

export default function ImageAnnotator({ src, alt, onClose }) {
  const canvasRef  = useRef(null);
  const previewRef = useRef(null);
  const imgRef     = useRef(null);
  const wrapRef    = useRef(null);
  const drawingRef = useRef(false);
  const startPt    = useRef(null);
  const lastPt     = useRef(null);
  const undoStack  = useRef([]);
  const redoStack  = useRef([]);

  const [tool,    setTool]    = useState(TOOLS.PEN);
  const [color,   setColor]   = useState(COLORS[1].value);
  const [size,    setSize]    = useState(4);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(true);

  const getCtx = () => canvasRef.current?.getContext("2d");

  const syncCanvasSize = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const preview = previewRef.current;
    if (!wrap || !canvas || !preview) return;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    [canvas, preview].forEach((c) => {
      c.width  = w * dpr;
      c.height = h * dpr;
      c.style.width  = `${w}px`;
      c.style.height = `${h}px`;
      const ctx = c.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    });
  }, []);

  const pushUndo = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    undoStack.current.push(c.toDataURL("image/png"));
    if (undoStack.current.length > 40) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  const restoreCanvas = useCallback((dataURL) => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve();
      const ctx = canvas.getContext("2d");
      const w = parseInt(canvas.style.width);
      const h = parseInt(canvas.style.height);
      const img = new Image();
      img.onload = () => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const dpr = window.devicePixelRatio || 1;
        ctx.scale(dpr, dpr);
        ctx.drawImage(img, 0, 0, w, h);
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        resolve();
      };
      img.src = dataURL;
    });
  }, []);

  const initCanvas = useCallback(() => {
    syncCanvasSize();
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    const w = parseInt(canvas.style.width);
    const h = parseInt(canvas.style.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pushUndo();
  }, [syncCanvasSize, pushUndo]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (imgLoaded) initCanvas();
  }, [imgLoaded, initCanvas]);

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
    const ctx = getCtx();
    if (!ctx) return;

    if ([TOOLS.PEN, TOOLS.HIGHLIGHTER, TOOLS.ERASER].includes(tool)) {
      if (tool === TOOLS.ERASER) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.lineWidth = size * 4;
      } else if (tool === TOOLS.HIGHLIGHTER) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.38;
        ctx.strokeStyle = color;
        ctx.lineWidth = size * 5;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
      }
      ctx.beginPath();
      ctx.moveTo(lastPt.current.x, lastPt.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastPt.current = p;
    } else if ([TOOLS.LINE, TOOLS.RECT, TOOLS.CIRCLE].includes(tool)) {
      const prev = previewRef.current?.getContext("2d");
      if (!prev) return;
      const w = parseInt(previewRef.current.style.width);
      const h = parseInt(previewRef.current.style.height);
      prev.clearRect(0, 0, w * (window.devicePixelRatio || 1), h * (window.devicePixelRatio || 1));
      prev.globalAlpha = 1; prev.globalCompositeOperation = "source-over";
      prev.strokeStyle = color; prev.lineWidth = size;
      const sx = startPt.current.x, sy = startPt.current.y;
      prev.beginPath();
      if (tool === TOOLS.LINE) { prev.moveTo(sx, sy); prev.lineTo(p.x, p.y); }
      else if (tool === TOOLS.RECT) prev.rect(sx, sy, p.x - sx, p.y - sy);
      else if (tool === TOOLS.CIRCLE) { prev.arc(sx, sy, Math.hypot(p.x - sx, p.y - sy), 0, Math.PI * 2); }
      prev.stroke();
    }
  };

  const end = (e) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const p = lastPt.current || (e && getPos(e)) || startPt.current;
    if ([TOOLS.LINE, TOOLS.RECT, TOOLS.CIRCLE].includes(tool)) {
      const ctx = getCtx();
      const prev = previewRef.current?.getContext("2d");
      if (prev) {
        const w = parseInt(previewRef.current.style.width) * (window.devicePixelRatio || 1);
        const h = parseInt(previewRef.current.style.height) * (window.devicePixelRatio || 1);
        prev.clearRect(0, 0, w, h);
      }
      if (ctx && p) {
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color; ctx.lineWidth = size;
        const sx = startPt.current.x, sy = startPt.current.y;
        ctx.beginPath();
        if (tool === TOOLS.LINE) { ctx.moveTo(sx, sy); ctx.lineTo(p.x, p.y); }
        else if (tool === TOOLS.RECT) ctx.rect(sx, sy, p.x - sx, p.y - sy);
        else if (tool === TOOLS.CIRCLE) { ctx.arc(sx, sy, Math.hypot(p.x - sx, p.y - sy), 0, Math.PI * 2); }
        ctx.stroke();
      }
    }
    pushUndo();
  };

  const handleCanvasClick = (e) => {
    if (tool !== TOOLS.TEXT) return;
    const p = getPos(e);
    const text = window.prompt("Type your text:");
    if (!text) return;
    const ctx = getCtx();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = color;
    ctx.font = `${Math.max(16, size * 5)}px "Cormorant Garamond", Georgia, serif`;
    ctx.textBaseline = "top";
    ctx.fillText(text, p.x, p.y);
    pushUndo();
  };

  const undo = async () => {
    if (undoStack.current.length <= 1) return;
    const cur = undoStack.current.pop();
    redoStack.current.push(cur);
    await restoreCanvas(undoStack.current[undoStack.current.length - 1]);
  };

  const redo = async () => {
    if (!redoStack.current.length) return;
    const next = redoStack.current.pop();
    undoStack.current.push(next);
    await restoreCanvas(next);
  };

  const clearAnnotations = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    pushUndo();
  };

  const downloadAnnotated = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const out = document.createElement("canvas");
    out.width  = img.naturalWidth;
    out.height = img.naturalHeight;
    const ctx = out.getContext("2d");
    ctx.drawImage(img, 0, 0);
    ctx.drawImage(canvas, 0, 0, out.width, out.height);
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = `annotated-${Date.now()}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const ToolBtn = ({ value, icon, label }) => (
    <button
      onClick={() => setTool(value)}
      title={label}
      className={`flex items-center justify-center w-9 h-9 border transition-all ${tool === value ? "border-white bg-white/20 text-white" : "border-white/20 text-white/70 hover:border-white/60 hover:text-white"}`}
    >
      {icon}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black" data-testid="image-annotator">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        onLoad={() => setImgLoaded(true)}
        style={{ zIndex: 0 }}
      />

      <div ref={wrapRef} className="absolute inset-0" style={{ zIndex: 10 }}>
        <canvas
          ref={canvasRef}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
          onClick={handleCanvasClick}
          style={{
            position: "absolute", inset: 0, touchAction: "none",
            cursor: tool === TOOLS.TEXT ? "text" : tool === TOOLS.ERASER ? "cell" : "crosshair",
          }}
        />
        <canvas
          ref={previewRef}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />
      </div>

      <div
        className="absolute top-0 left-0 right-0 flex items-center gap-2 px-4 py-3 flex-wrap"
        style={{ zIndex: 20, background: "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)" }}
      >
        <button onClick={onClose} title="Close (Esc)" className="flex items-center justify-center w-9 h-9 border border-white/30 text-white hover:border-white transition-all mr-2">
          <ArrowsInSimple size={16} weight="bold" />
        </button>

        <div className="h-6 border-l border-white/20 mx-1" />

        <ToolBtn value={TOOLS.PEN}         icon={<PencilSimple size={16} weight={tool===TOOLS.PEN?"fill":"thin"} />}        label="Pen" />
        <ToolBtn value={TOOLS.HIGHLIGHTER} icon={<Highlighter  size={16} weight={tool===TOOLS.HIGHLIGHTER?"fill":"thin"} />} label="Highlighter" />
        <ToolBtn value={TOOLS.ERASER}      icon={<Eraser       size={16} weight={tool===TOOLS.ERASER?"fill":"thin"} />}      label="Eraser" />
        <ToolBtn value={TOOLS.TEXT}        icon={<TextT        size={16} weight={tool===TOOLS.TEXT?"fill":"thin"} />}        label="Text" />
        <ToolBtn value={TOOLS.LINE}        icon={<LineSegment  size={16} weight={tool===TOOLS.LINE?"fill":"thin"} />}        label="Line" />
        <ToolBtn value={TOOLS.RECT}        icon={<Rectangle   size={16} weight={tool===TOOLS.RECT?"fill":"thin"} />}        label="Rectangle" />
        <ToolBtn value={TOOLS.CIRCLE}      icon={<Circle      size={16} weight={tool===TOOLS.CIRCLE?"fill":"thin"} />}      label="Circle" />

        <div className="h-6 border-l border-white/20 mx-1" />

        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              title={c.name}
              className={`w-6 h-6 border-2 transition-transform ${color === c.value ? "border-white scale-125" : "border-transparent scale-100"}`}
              style={{ backgroundColor: c.value, borderRadius: 0 }}
            />
          ))}
        </div>

        <div className="h-6 border-l border-white/20 mx-1" />

        <div className="flex items-center gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              title={`Size ${s}`}
              className={`flex items-center justify-center w-8 h-8 border transition-all ${size === s ? "border-white bg-white/20" : "border-white/20 hover:border-white/60"}`}
            >
              <span className="rounded-full bg-white" style={{ width: Math.min(s, 18), height: Math.min(s, 18) }} />
            </button>
          ))}
        </div>

        <div className="h-6 border-l border-white/20 mx-1" />

        <button onClick={undo}              title="Undo" className="flex items-center justify-center w-9 h-9 border border-white/20 text-white/70 hover:border-white hover:text-white transition-all"><ArrowCounterClockwise size={15} weight="bold" /></button>
        <button onClick={redo}              title="Redo" className="flex items-center justify-center w-9 h-9 border border-white/20 text-white/70 hover:border-white hover:text-white transition-all"><ArrowClockwise size={15} weight="bold" /></button>
        <button onClick={clearAnnotations}  title="Clear annotations" className="flex items-center justify-center w-9 h-9 border border-white/20 text-white/70 hover:border-red-400 hover:text-red-400 transition-all"><Trash size={15} weight="bold" /></button>
        <button onClick={downloadAnnotated} title="Download annotated image" className="flex items-center gap-1.5 px-3 h-9 border border-white/30 text-white/80 hover:border-white hover:text-white transition-all font-mono-arch text-[10px] uppercase tracking-widest ml-auto">
          <DownloadSimple size={14} weight="bold" /> Save PNG
        </button>
        <button onClick={onClose} title="Close" className="flex items-center justify-center w-9 h-9 border border-white/20 text-white/70 hover:border-white hover:text-white transition-all">
          <X size={16} weight="bold" />
        </button>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-3 pt-8"
        style={{ zIndex: 20, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)" }}
      >
        <p className="font-mono-arch text-[10px] tracking-widest uppercase text-white/50">
          {tool === TOOLS.TEXT ? "Click anywhere to add text" : "Draw freely · Esc to close"}
        </p>
      </div>
    </div>
  );
}
