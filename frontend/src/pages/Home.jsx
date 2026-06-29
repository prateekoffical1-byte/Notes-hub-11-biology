import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import NoteCard from "@/components/NoteCard";
import { UploadSimple, ArrowRight, MagnifyingGlass, Flower, BookOpen, FilePdf, Image as ImageIcon, GraduationCap, Sparkle } from "@phosphor-icons/react";

export default function Home() {
  const [stats, setStats] = useState({ categories: 1, notes: 0, pdfs: 0, pictures: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/stats"),
      api.get("/notes", { params: { sort: "recent", limit: 6 } }),
    ])
      .then(([s, r]) => { setStats(s.data); setRecent(r.data); })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Subject", value: "Biology", dot: "var(--accent-green)", testid: "stat-subject" },
    { label: "Total Notes", value: stats.notes, dot: "var(--accent-yellow)", testid: "stat-notes" },
    { label: "PDF Notes", value: stats.pdfs, dot: "var(--accent-red)", icon: FilePdf, testid: "stat-pdfs" },
    { label: "Pictures", value: stats.pictures, dot: "var(--accent-sky)", icon: ImageIcon, testid: "stat-pictures" },
  ];

  return (
    <div className="relative z-10" data-testid="home-page">
      <section className="border-b border-line relative overflow-hidden">
        <Flower size={48} weight="thin" className="petal text-accent-pink absolute top-12 left-[6%]" style={{ animationDelay: "0s" }} />
        <Sparkle size={28} weight="thin" className="petal text-accent-yellow absolute bottom-16 left-[4%]" style={{ animationDelay: "2.5s" }} />
        <Flower size={36} weight="thin" className="petal text-accent-green absolute top-32 right-[4%] hidden lg:block" style={{ animationDelay: "1.2s" }} />

        <div className="max-w-7xl container-arch mx-auto px-4 sm:px-6 md:px-12 py-14 sm:py-20 md:py-28 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8">
            <p className="font-mono-arch text-[10px] sm:text-xs tracking-[0.25em] uppercase text-accent-green mb-5 sm:mb-6 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2">
                <Flower size={16} weight="thin" /> Open Spring Archive
              </span>
              <span className="hidden sm:inline">·</span>
              <span>Est. MMXXVI</span>
            </p>
            <h1 className="font-serif-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light leading-[0.95] tracking-tight text-ink-dark">
              The Class XI
              <br className="hidden sm:block" />{" "}
              <em className="italic font-medium text-accent-green">Biology</em> Notes Hub.
            </h1>
            <p className="font-body text-base sm:text-lg md:text-xl text-ink-medium mt-6 sm:mt-8 max-w-2xl leading-relaxed">
              A community archive of student-shared PDFs, sketches, and diagrams — built in spring, for students of every season.
              <span className="block mt-2 font-mono-arch text-[10px] sm:text-xs uppercase tracking-widest text-ink-light">
                No paywalls · No login required for downloads · Works on smartboards, desktops, tablets &amp; phones
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-8 sm:mt-10">
              <Link to="/upload" className="btn-primary" data-testid="hero-share-btn">
                <UploadSimple size={16} weight="bold" /> Share a Note
              </Link>
              <Link to="/notes" className="btn-secondary" data-testid="hero-browse-btn">
                <MagnifyingGlass size={14} weight="bold" /> Browse Archive
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 hidden lg:block">
            <div className="border border-line bg-paper-alt aspect-[3/4] overflow-hidden relative">
              <img
                src="https://images.pexels.com/photos/9350689/pexels-photo-9350689.jpeg"
                alt="Botanical sketch"
                className="w-full h-full object-cover"
                style={{ filter: "saturate(0.7) hue-rotate(-10deg)" }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 60%, rgba(58, 125, 68, 0.18))" }} />
            </div>
            <p className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light mt-3 text-right">
              Pl. 01 — Botanical Index
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-line" data-testid="stats-section">
        <div className="max-w-7xl container-arch mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-2 lg:grid-cols-4">
          {statCards.map((s, i) => (
            <div
              key={s.label}
              data-testid={s.testid}
              className={`stat-tile ${i % 2 === 0 ? "border-r border-line" : ""} ${i < 2 ? "border-b lg:border-b-0 border-line" : ""} ${i === 2 ? "lg:border-r border-line" : ""}`}
            >
              <div className="font-mono-arch text-[10px] tracking-[0.2em] uppercase text-ink-light mb-3">
                <span className="stat-dot" style={{ backgroundColor: s.dot }} />
                {s.label}
              </div>
              <div className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-light text-ink-dark flex items-baseline gap-3 flex-wrap">
                {s.value}
                {s.icon && <s.icon size={28} weight="thin" className="text-ink-light" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-line" data-testid="recent-section">
        <div className="max-w-7xl container-arch mx-auto px-4 sm:px-6 md:px-12 py-14 sm:py-16">
          <div className="flex items-end justify-between mb-8 sm:mb-10 gap-4 flex-wrap">
            <div>
              <p className="font-mono-arch text-[11px] tracking-[0.2em] uppercase text-accent-green mb-2">§ 01 · Recently Shared</p>
              <h2 className="font-serif-display text-3xl sm:text-4xl md:text-5xl text-ink-dark">Fresh contributions</h2>
            </div>
            <Link to="/notes" className="flex items-center gap-2 font-mono-arch text-xs uppercase tracking-widest text-accent-green hover:text-ink-dark" data-testid="view-recent-link">
              View all <ArrowRight size={14} weight="bold" />
            </Link>
          </div>

          {loading ? (
            <div className="py-20 text-center font-mono-arch text-xs uppercase tracking-widest text-ink-medium">Loading the garden of notes...</div>
          ) : recent.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {recent.map((n, i) => <NoteCard key={n.id} note={n} index={i} />)}
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-line bg-paper-alt relative overflow-hidden">
        <Flower size={64} weight="thin" className="petal text-accent-pink absolute -top-4 right-[8%]" />
        <div className="max-w-7xl container-arch mx-auto px-4 sm:px-6 md:px-12 py-14 sm:py-20 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="font-mono-arch text-[11px] tracking-[0.2em] uppercase text-accent-green mb-3 flex items-center gap-2">
              <GraduationCap size={16} weight="thin" /> § 02 · Become a Contributor
            </p>
            <h2 className="font-serif-display text-3xl sm:text-4xl md:text-5xl text-ink-dark leading-tight">
              Notes that helped you ace a chapter?
            </h2>
            <p className="font-body text-base sm:text-lg text-ink-medium mt-4 sm:mt-5 leading-relaxed">
              Pass them on. Every PDF or sketch you share lives in the archive — helping the next student spring forward.
            </p>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-4">
            <Link to="/upload" className="btn-primary" data-testid="cta-share-btn">
              <UploadSimple size={16} weight="bold" /> Share a Note
            </Link>
            <p className="font-mono-arch text-[10px] uppercase tracking-widest text-ink-light flex items-center gap-2">
              <Sparkle size={12} weight="thin" /> Sign in to track your contributions
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-line p-12 text-center" data-testid="empty-state">
      <BookOpen size={48} weight="thin" className="mx-auto text-accent-green mb-4" />
      <h3 className="font-serif-display text-3xl text-ink-dark mb-2">An empty page awaits.</h3>
      <p className="font-body text-ink-medium mb-6">Be the first to plant a note in the archive.</p>
      <Link to="/upload" className="btn-primary"><UploadSimple size={16} weight="bold" /> Upload First Note</Link>
    </div>
  );
}
