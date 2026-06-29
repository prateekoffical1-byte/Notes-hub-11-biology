import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, X } from "@phosphor-icons/react";

export default function SearchBar({ compact = false, onClose }) {
  const [q, setQ] = useState("");
  const nav = useNavigate();

  const submit = (e) => {
    e?.preventDefault();
    const term = q.trim();
    if (!term) return;
    nav(`/notes?search=${encodeURIComponent(term)}`);
    onClose?.();
  };

  return (
    <form
      onSubmit={submit}
      data-testid="global-search"
      className={`flex items-center gap-2 border border-line bg-paper px-3 transition-colors focus-within:border-accent-green ${compact ? "w-full" : "w-full md:w-72"}`}
    >
      <MagnifyingGlass size={16} weight="thin" className="text-ink-light shrink-0" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search notes…"
        data-testid="global-search-input"
        className="flex-1 bg-transparent outline-none py-2.5 font-body text-sm text-ink-dark placeholder:text-ink-light"
      />
      {q && (
        <button
          type="button"
          onClick={() => setQ("")}
          className="text-ink-light hover:text-ink-dark"
          data-testid="global-search-clear"
          aria-label="Clear search"
        >
          <X size={14} weight="bold" />
        </button>
      )}
    </form>
  );
}
