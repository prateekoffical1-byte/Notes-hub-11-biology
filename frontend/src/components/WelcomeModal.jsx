import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkle, X, Plant, PencilSimple, UploadSimple, BookOpen, Folders, DeviceMobile } from "@phosphor-icons/react";

const KEY = "notes_hub_welcome_seen_v1";

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(KEY);
    if (!seen) {
      // Delay a touch so the page is rendered first
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 fade-in"
      data-testid="welcome-modal"
      style={{ backgroundColor: "rgba(31, 42, 31, 0.55)" }}
      onClick={close}
    >
      <div
        className="bg-paper border-2 border-ink max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "10px 10px 0 0 var(--accent-green)" }}
      >
        <button
          onClick={close}
          data-testid="welcome-close"
          className="absolute right-3 top-3 sm:right-4 sm:top-4 w-9 h-9 flex items-center justify-center border border-line text-ink-medium hover:text-accent-red hover:border-accent-red transition-colors z-10"
          aria-label="Close"
        >
          <X size={18} weight="bold" />
        </button>

        {/* Header ribbon */}
        <div className="relative px-6 sm:px-10 pt-8 pb-6 border-b border-line overflow-hidden" style={{ background: "linear-gradient(135deg, var(--bg-paper-alt), var(--bg-default))" }}>
          <Sparkle className="absolute top-4 left-4 text-accent-yellow" size={22} weight="fill" />
          <Plant className="absolute bottom-4 right-8 text-accent-green opacity-50" size={36} weight="fill" />
          <p className="font-mono-arch text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-accent-green mb-3 flex items-center gap-2">
            <Sparkle size={12} weight="fill" className="text-accent-yellow" /> Welcome
          </p>
          <h2 className="font-serif-display text-3xl sm:text-4xl md:text-5xl text-ink-dark leading-tight">
            The Class XI <em className="italic text-accent-green">Biology</em> Notes Hub.
          </h2>
          <p className="font-body text-sm sm:text-base text-ink-medium mt-3">
            A blooming archive made by students, for students. No ads, no paywalls — just notes that help.
          </p>
        </div>

        {/* Features */}
        <div className="px-6 sm:px-10 py-6 sm:py-8">
          <p className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light mb-4">What you can do here</p>
          <ul className="space-y-4 font-body text-sm sm:text-base text-ink-dark">
            <li className="flex gap-3">
              <span className="shrink-0 mt-1 w-7 h-7 rounded-full bg-accent-green/10 flex items-center justify-center"><BookOpen size={16} weight="bold" className="text-accent-green" /></span>
              <span><strong className="font-serif-display text-lg">Browse</strong> hundreds of PDFs and diagrams contributed by classmates.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 mt-1 w-7 h-7 rounded-full bg-accent-pink/10 flex items-center justify-center"><UploadSimple size={16} weight="bold" className="text-accent-pink" /></span>
              <span><strong className="font-serif-display text-lg">Share</strong> your notes (PDF or pictures up to 100MB). Passcode-protected uploads.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 mt-1 w-7 h-7 rounded-full bg-accent-sky/10 flex items-center justify-center"><PencilSimple size={16} weight="bold" className="text-accent-sky" /></span>
              <span><strong className="font-serif-display text-lg">Sketch</strong> on the smartboard whiteboard — pen, highlighter, eraser, shapes — and save as a note.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 mt-1 w-7 h-7 rounded-full bg-accent-yellow/15 flex items-center justify-center"><Folders size={16} weight="bold" className="text-ink-dark" /></span>
              <span><strong className="font-serif-display text-lg">Organize</strong> with folders. One-click to add, delete, or unfile.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 mt-1 w-7 h-7 rounded-full bg-accent-green/10 flex items-center justify-center"><DeviceMobile size={16} weight="bold" className="text-accent-green" /></span>
              <span><strong className="font-serif-display text-lg">Install</strong> as an app on any device — phone, tablet, desktop, smartboard.</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="px-6 sm:px-10 pb-6 sm:pb-8 flex flex-wrap gap-3">
          <button onClick={close} className="btn-primary" data-testid="welcome-explore">
            <Sparkle size={14} weight="fill" /> Start exploring
          </button>
          <Link to="/whiteboard" onClick={close} className="btn-secondary" style={{ borderColor: "var(--accent-pink)", color: "var(--accent-pink)" }} data-testid="welcome-whiteboard">
            <PencilSimple size={14} weight="bold" /> Open Whiteboard
          </Link>
        </div>

        {/* Credit */}
        <div className="px-6 sm:px-10 py-5 border-t border-line bg-paper-alt text-center">
          <p className="font-serif-display italic text-lg sm:text-xl text-ink-dark">
            Coded by <span className="not-italic font-semibold text-accent-green">Prateek</span>
            <span className="text-accent-pink">.....</span>
          </p>
          <p className="font-mono-arch text-[9px] sm:text-[10px] tracking-widest uppercase text-ink-light mt-1">
            with love · for every Class XI student
          </p>
        </div>
      </div>
    </div>
  );
}
