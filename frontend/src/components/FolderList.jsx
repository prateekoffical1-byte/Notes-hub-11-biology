import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAdmin } from "@/contexts/AdminContext";
import { FolderSimple, FolderSimplePlus, X, Folders } from "@phosphor-icons/react";

export default function FolderList({ activeFolder, onSelectFolder, onFoldersChange }) {
  const [folders, setFolders] = useState([]);
  const [unfiled, setUnfiled] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const { requestUnlock } = useAdmin();

  const fetchFolders = () => {
    setLoading(true);
    api.get("/folders").then((r) => {
      setFolders(r.data.folders);
      setUnfiled(r.data.unfiled_count);
      if (onFoldersChange) onFoldersChange(r.data.folders);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchFolders(); }, []);

  const handleAdd = () => {
    if (!newName.trim()) return;
    requestUnlock(async (passcode) => {
      try {
        await api.post("/folders", { name: newName.trim(), passcode });
        setNewName("");
        setAdding(false);
        fetchFolders();
      } catch (err) {
        alert("Could not create folder: " + (err?.response?.data?.detail || err.message));
      }
    });
  };

  const handleDelete = (folder, e) => {
    e.stopPropagation();
    requestUnlock(async (passcode) => {
      try {
        await api.delete(`/folders/${folder.id}`, { params: { passcode, delete_notes: false } });
        if (activeFolder === folder.id) onSelectFolder?.("all");
        fetchFolders();
      } catch (err) {
        alert("Delete failed: " + (err?.response?.data?.detail || err.message));
      }
    });
  };

  const totalNotes = folders.reduce((acc, f) => acc + (f.note_count || 0), 0) + unfiled;

  return (
    <div className="border border-line bg-paper" data-testid="folder-list">
      <div className="p-5 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono-arch text-[10px] tracking-widest uppercase text-accent-green">
          <Folders size={14} weight="fill" /> Folders
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          data-testid="folder-add-toggle"
          className="text-ink-medium hover:text-accent-green transition-colors"
          title="Add folder"
        >
          {adding ? <X size={16} weight="bold" /> : <FolderSimplePlus size={18} weight="bold" />}
        </button>
      </div>

      {adding && (
        <div className="p-4 border-b border-line bg-paper-alt" data-testid="folder-add-form">
          <input
            className="input-line text-base"
            placeholder="Folder name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            autoFocus
            data-testid="folder-name-input"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="btn-primary" data-testid="folder-add-submit">Create</button>
            <button onClick={() => { setAdding(false); setNewName(""); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-[color:var(--border-line)]">
        <li>
          <button
            onClick={() => onSelectFolder?.("all")}
            data-testid="folder-all"
            className={`w-full text-left px-5 py-3 flex items-center justify-between font-body text-sm transition-colors ${activeFolder === "all" ? "bg-paper-alt text-accent-green" : "hover:bg-paper-alt"}`}
          >
            <span className="flex items-center gap-2"><FolderSimple size={14} weight="thin" /> All Notes</span>
            <span className="font-mono-arch text-[10px] uppercase tracking-widest text-ink-light">{totalNotes}</span>
          </button>
        </li>
        {folders.map((f) => (
          <li key={f.id} className="group">
            <div className={`flex items-center justify-between font-body text-sm transition-colors ${activeFolder === f.id ? "bg-paper-alt" : "hover:bg-paper-alt"}`}>
              <button
                onClick={() => onSelectFolder?.(f.id)}
                data-testid={`folder-${f.id}`}
                className={`flex-1 text-left px-5 py-3 flex items-center gap-2 ${activeFolder === f.id ? "text-accent-green" : "text-ink-dark"}`}
              >
                <FolderSimple size={14} weight={activeFolder === f.id ? "fill" : "thin"} />
                <span className="truncate">{f.name}</span>
              </button>
              <span className="font-mono-arch text-[10px] uppercase tracking-widest text-ink-light px-2">{f.note_count}</span>
              <button
                onClick={(e) => handleDelete(f, e)}
                data-testid={`folder-delete-${f.id}`}
                className="opacity-0 group-hover:opacity-100 px-3 py-1 text-ink-light hover:text-accent-red transition-all"
                title="Delete folder"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          </li>
        ))}
        <li>
          <button
            onClick={() => onSelectFolder?.("unfiled")}
            data-testid="folder-unfiled"
            className={`w-full text-left px-5 py-3 flex items-center justify-between font-body text-sm transition-colors ${activeFolder === "unfiled" ? "bg-paper-alt text-accent-green" : "hover:bg-paper-alt"}`}
          >
            <span className="flex items-center gap-2 text-ink-medium italic"><FolderSimple size={14} weight="thin" /> Unfiled</span>
            <span className="font-mono-arch text-[10px] uppercase tracking-widest text-ink-light">{unfiled}</span>
          </button>
        </li>
      </ul>

      {loading && (
        <div className="p-4 text-center font-mono-arch text-[10px] uppercase tracking-widest text-ink-light">Loading...</div>
      )}
    </div>
  );
}
