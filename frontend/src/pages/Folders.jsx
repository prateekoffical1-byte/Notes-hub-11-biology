import { useState, useEffect } from "react";
import api from "@/lib/api";
import FolderList from "@/components/FolderList";
import NoteCard from "@/components/NoteCard";
import { FolderSimple } from "@phosphor-icons/react";

export default function Folders() {
  const [activeFolder, setActiveFolder] = useState("all");
  const [folderLabel, setFolderLabel] = useState("All Notes");
  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/folders").then((r) => setFolders(r.data.folders)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeFolder === "unfiled") params.folder_id = "unfiled";
    else if (activeFolder !== "all") params.folder_id = activeFolder;
    api
      .get("/notes", { params })
      .then((r) => setNotes(r.data))
      .finally(() => setLoading(false));
  }, [activeFolder]);

  const handleSelectFolder = (id) => {
    setActiveFolder(id);
    if (id === "all") setFolderLabel("All Notes");
    else if (id === "unfiled") setFolderLabel("Unfiled Notes");
    else {
      const f = folders.find((x) => x.id === id);
      setFolderLabel(f?.name || "Folder");
    }
  };

  return (
    <div className="relative z-10" data-testid="folders-page">
      <section className="border-b border-line">
        <div className="max-w-7xl container-arch mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16">
          <p className="font-mono-arch text-xs tracking-[0.25em] uppercase text-accent-green mb-4">Organise</p>
          <h1 className="font-serif-display text-4xl sm:text-5xl md:text-6xl text-ink-dark">
            Folders & <em className="italic text-accent-green">collections.</em>
          </h1>
          <p className="font-body text-base sm:text-lg text-ink-medium mt-4 max-w-2xl">
            Create folders to organise notes by topic or chapter. Use the passcode to add or remove folders.
          </p>
        </div>
      </section>

      <div className="max-w-7xl container-arch mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-3">
            <FolderList
              activeFolder={activeFolder}
              onSelectFolder={handleSelectFolder}
              onFoldersChange={setFolders}
            />
          </div>

          <div className="lg:col-span-9">
            <div className="flex items-center gap-3 mb-6 sm:mb-8 font-mono-arch text-[11px] tracking-widest uppercase text-ink-medium">
              <FolderSimple size={14} weight="thin" />
              <span>{folderLabel}</span>
              {!loading && (
                <span className="text-ink-light">
                  · {notes.length} {notes.length === 1 ? "note" : "notes"}
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-20 text-center font-mono-arch text-xs uppercase tracking-widest text-ink-medium">
                Loading...
              </div>
            ) : notes.length === 0 ? (
              <div className="border border-line p-10 sm:p-16 text-center">
                <h3 className="font-serif-display text-2xl sm:text-3xl text-ink-dark mb-2">
                  No notes here yet.
                </h3>
                <p className="font-body text-ink-medium">
                  Upload a note and assign it to this folder.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
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
        </div>
      </div>
    </div>
  );
}
