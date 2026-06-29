import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import NoteCard from "@/components/NoteCard";
import { MagnifyingGlass, FunnelSimple } from "@phosphor-icons/react";

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [chapters, setChapters] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const chapter = params.get("chapter") || "all";
  const fileType = params.get("file_type") || "all";
  const sort = params.get("sort") || "recent";
  const search = params.get("search") || "";

  useEffect(() => {
    api.get("/chapters").then((r) => setChapters(r.data.chapters));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get("/notes", { params: { chapter, file_type: fileType, sort, search } })
      .then((r) => setNotes(r.data))
      .finally(() => setLoading(false));
  }, [chapter, fileType, sort, search]);

  const updateParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (!v || v === "all") next.delete(k); else next.set(k, v);
    setParams(next);
  };

  return (
    <div className="relative z-10" data-testid="browse-page">
      <section className="border-b border-line">
        <div className="max-w-7xl container-arch mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16">
          <p className="font-mono-arch text-xs tracking-[0.25em] uppercase text-accent-green mb-4">The Archive</p>
          <h1 className="font-serif-display text-4xl sm:text-5xl md:text-6xl text-ink-dark">
            Browse <em className="italic text-accent-green">all</em> notes.
          </h1>
          <p className="font-body text-base sm:text-lg text-ink-medium mt-4 max-w-2xl">
            Filter by chapter or file type, or search by keyword. Notes sorted by what was most recently planted in the archive.
          </p>
        </div>
      </section>

      <section className="border-b border-line bg-paper-alt sticky top-[68px] md:top-[76px] z-20" data-testid="filters-bar">
        <div className="max-w-7xl container-arch mx-auto px-4 sm:px-6 md:px-12 py-5 sm:py-6 grid grid-cols-2 md:grid-cols-12 gap-4 items-center">
          <div className="col-span-2 md:col-span-5 relative">
            <MagnifyingGlass size={16} weight="thin" className="absolute left-0 top-3 text-ink-light" />
            <input
              data-testid="search-input"
              type="text"
              placeholder="Search title or description..."
              value={search}
              onChange={(e) => updateParam("search", e.target.value)}
              className="input-line pl-7"
            />
          </div>
          <div className="md:col-span-4">
            <select
              data-testid="chapter-filter"
              value={chapter}
              onChange={(e) => updateParam("chapter", e.target.value)}
              className="input-line bg-transparent cursor-pointer"
            >
              <option value="all">All chapters</option>
              {chapters.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <select
              data-testid="filetype-filter"
              value={fileType}
              onChange={(e) => updateParam("file_type", e.target.value)}
              className="input-line bg-transparent cursor-pointer"
            >
              <option value="all">All formats</option>
              <option value="pdf">PDF</option>
              <option value="image">Pictures</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <select
              data-testid="sort-filter"
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="input-line bg-transparent cursor-pointer"
            >
              <option value="recent">Recent</option>
              <option value="downloads">Popular</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-7xl container-arch mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-12">
          <div className="flex items-center justify-between mb-6 sm:mb-8 font-mono-arch text-[11px] tracking-widest uppercase text-ink-medium">
            <span data-testid="results-count">
              <FunnelSimple size={12} weight="thin" className="inline mr-2" />
              {loading ? "Loading..." : `${notes.length} ${notes.length === 1 ? "result" : "results"}`}
            </span>
            <span>Sorted by {sort}</span>
          </div>

          {loading ? (
            <div className="py-20 text-center font-mono-arch text-xs uppercase tracking-widest text-ink-medium">Loading the archive...</div>
          ) : notes.length === 0 ? (
            <div className="border border-line p-10 sm:p-16 text-center" data-testid="no-results">
              <h3 className="font-serif-display text-2xl sm:text-3xl text-ink-dark mb-2">No notes match your filters.</h3>
              <p className="font-body text-ink-medium">Try clearing filters or searching for something different.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6" data-testid="notes-grid">
              {notes.map((n, i) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  index={i}
                  onDelete={(id) => setNotes((prev) => prev.filter((x) => x.id !== id))}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
