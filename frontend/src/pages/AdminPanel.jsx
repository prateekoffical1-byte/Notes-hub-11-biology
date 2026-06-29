import { useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Lock, Users, EnvelopeSimple, CalendarBlank, Eye, EyeSlash } from "@phosphor-icons/react";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return "—"; }
}

export default function AdminPanel() {
  const [passcode, setPasscode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!passcode.trim()) { setError("Enter the owner passcode"); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/users", { params: { passcode: passcode.trim() } });
      setUsers(data.users);
      setTotal(data.total);
      setUnlocked(true);
    } catch (err) {
      setError(formatApiError(err) || "Wrong passcode.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 fade-in" data-testid="admin-panel-page">
      <section className="border-b border-line">
        <div className="max-w-7xl container-arch mx-auto px-4 sm:px-6 md:px-12 py-12 sm:py-16">
          <p className="font-mono-arch text-xs tracking-[0.25em] uppercase text-accent-green mb-4">Owner Only</p>
          <h1 className="font-serif-display text-4xl sm:text-5xl md:text-6xl text-ink-dark">
            Registered <em className="italic text-accent-green">users.</em>
          </h1>
          <p className="font-body text-base sm:text-lg text-ink-medium mt-4 max-w-2xl">
            Private view. Enter the owner passcode to see who has registered on the website.
          </p>
        </div>
      </section>

      <div className="max-w-3xl container-arch mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-14">
        {!unlocked ? (
          <form onSubmit={handleUnlock} className="border border-line bg-paper-alt p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock size={20} weight="thin" className="text-accent-green" />
              <h2 className="font-serif-display text-2xl text-ink-dark">Owner passcode</h2>
            </div>
            <div className="relative mb-4">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="input-line pr-10 w-full"
                autoFocus
                data-testid="owner-passcode-input"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-0 top-2.5 text-ink-light hover:text-ink-dark"
              >
                {showPass ? <EyeSlash size={16} weight="thin" /> : <Eye size={16} weight="thin" />}
              </button>
            </div>
            {error && (
              <p className="font-mono-arch text-[10px] text-accent-red uppercase tracking-widest mb-4">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
              data-testid="owner-unlock-btn"
            >
              <Lock size={14} weight="bold" />
              {loading ? "Checking..." : "Unlock"}
            </button>
          </form>
        ) : (
          <div>
            <div className="flex items-center gap-4 mb-8 font-mono-arch text-[11px] tracking-widest uppercase">
              <Users size={16} weight="thin" className="text-accent-green" />
              <span className="text-ink-dark">
                Total registered: <strong>{total}</strong>
              </span>
              <button
                onClick={() => { setUnlocked(false); setPasscode(""); setUsers([]); }}
                className="ml-auto text-ink-light hover:text-accent-red transition-colors"
              >
                Lock
              </button>
            </div>

            {users.length === 0 ? (
              <div className="border border-line p-10 text-center">
                <p className="font-body text-ink-medium">No users registered yet.</p>
              </div>
            ) : (
              <div className="border border-line divide-y divide-[color:var(--border-line)]">
                <div className="hidden sm:grid grid-cols-12 px-5 py-2 font-mono-arch text-[9px] tracking-widest uppercase text-ink-light bg-paper-alt">
                  <span className="col-span-1">#</span>
                  <span className="col-span-4">Name</span>
                  <span className="col-span-5">Email</span>
                  <span className="col-span-2 text-right">Joined</span>
                </div>
                {users.map((u, i) => (
                  <div
                    key={u.id}
                    className="grid grid-cols-12 px-5 py-4 items-center hover:bg-paper-alt transition-colors"
                    data-testid={`admin-user-row-${i}`}
                  >
                    <span className="col-span-1 font-mono-arch text-[10px] text-ink-light">{total - i}</span>
                    <div className="col-span-5 sm:col-span-4">
                      <p className="font-body text-sm text-ink-dark font-medium truncate">{u.name}</p>
                    </div>
                    <div className="col-span-5 flex items-center gap-1.5 overflow-hidden">
                      <EnvelopeSimple size={12} weight="thin" className="text-ink-light shrink-0" />
                      <p className="font-mono-arch text-[10px] text-ink-medium truncate">{u.email}</p>
                    </div>
                    <div className="col-span-1 sm:col-span-2 text-right font-mono-arch text-[9px] text-ink-light">
                      <span className="hidden sm:inline flex items-center justify-end gap-1">
                        <CalendarBlank size={10} weight="thin" className="inline" />
                        {formatDate(u.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
