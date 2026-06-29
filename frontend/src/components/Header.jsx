import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UploadSimple, SignIn, SignOut, UserCircle, List, X, Flower, PencilSimple } from "@phosphor-icons/react";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (p) => location.pathname === p;

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="border-b border-line bg-paper relative z-30 sticky top-0 backdrop-blur" data-testid="site-header" style={{ backgroundColor: "rgba(251, 252, 247, 0.92)" }}>
      <div className="max-w-7xl container-arch mx-auto px-4 sm:px-6 md:px-12 py-4 md:py-5 flex items-center justify-between gap-3">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2 sm:gap-3 group min-w-0" data-testid="nav-home">
          <Flower size={28} weight="thin" className="text-accent-green group-hover:text-accent-pink transition-colors shrink-0" />
          <div className="leading-tight min-w-0">
            <div className="font-serif-display text-xl sm:text-2xl text-ink-dark truncate">Notes Hub</div>
            <div className="font-mono-arch text-[9px] sm:text-[10px] tracking-widest uppercase text-accent-green">
              Class XI · Biology · Spring
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-4 lg:gap-6 font-mono-arch text-xs uppercase tracking-widest">
          {[["/", "Library", "nav-link-home"], ["/notes", "Browse", "nav-link-browse"], ["/folders", "Folders", "nav-link-folders"], ["/whiteboard", "Whiteboard", "nav-link-whiteboard"], ["/upload", "Contribute", "nav-link-upload"]].map(([to, label, tid]) => (
            <Link
              key={to}
              to={to}
              data-testid={tid}
              className={`pb-1 transition-colors ${isActive(to) ? "text-accent-green border-b-2 border-accent-green" : "text-ink-medium hover:text-accent-green"}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/upload" className="btn-primary" data-testid="header-share-btn">
            <UploadSimple size={16} weight="bold" />
            Share
          </Link>
          {user ? (
            <>
              <div className="hidden lg:flex items-center gap-2 font-mono-arch text-xs text-ink-medium" data-testid="user-name">
                <UserCircle size={20} weight="thin" />
                {user.name}
              </div>
              <button onClick={() => { logout(); navigate("/"); }} className="btn-secondary" data-testid="logout-btn">
                <SignOut size={14} weight="bold" />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-secondary" data-testid="login-link">
              <SignIn size={14} weight="bold" />
              Sign in
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2 text-ink-dark"
          onClick={() => setMenuOpen((v) => !v)}
          data-testid="mobile-menu-toggle"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={26} weight="thin" /> : <List size={26} weight="thin" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-line bg-paper fade-in" data-testid="mobile-menu">
          <div className="px-6 py-5 flex flex-col gap-4 font-mono-arch text-xs uppercase tracking-widest">
            {[["/", "Library"], ["/notes", "Browse"], ["/folders", "Folders"], ["/whiteboard", "Whiteboard"], ["/upload", "Contribute Note"]].map(([to, label]) => (
              <Link key={to} to={to} onClick={closeMenu} className={`py-1 ${isActive(to) ? "text-accent-green" : "text-ink-dark"}`}>
                {label}
              </Link>
            ))}
            <Link
              to="/admin"
              onClick={closeMenu}
              className={`py-1 text-[9px] tracking-[0.3em] opacity-30 hover:opacity-90 transition-opacity ${isActive("/admin") ? "text-accent-green !opacity-100" : "text-ink-light"}`}
            >
              ··· Owner Panel
            </Link>
            <div className="divider-rule my-2" />
            {user ? (
              <>
                <div className="flex items-center gap-2 text-ink-medium"><UserCircle size={20} weight="thin" /> {user.name}</div>
                <button onClick={() => { logout(); closeMenu(); navigate("/"); }} className="btn-secondary w-full justify-center" data-testid="mobile-logout-btn">
                  <SignOut size={14} weight="bold" /> Sign out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={closeMenu} className="btn-secondary w-full justify-center" data-testid="mobile-login-link">
                <SignIn size={14} weight="bold" /> Sign in
              </Link>
            )}
            <Link to="/upload" onClick={closeMenu} className="btn-primary w-full justify-center" data-testid="mobile-share-btn">
              <UploadSimple size={16} weight="bold" /> Share a note
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
