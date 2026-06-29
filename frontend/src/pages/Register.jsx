import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);
    if (res.ok) nav("/"); else setError(res.error);
  };

  return (
    <div className="relative z-10 fade-in" data-testid="register-page">
      <div className="max-w-md mx-auto px-6 py-20">
        <p className="font-mono-arch text-xs tracking-[0.25em] uppercase text-accent-green mb-4 text-center">New Contributor</p>
        <h1 className="font-serif-display text-5xl text-ink-dark text-center mb-10">Create an account.</h1>

        <form onSubmit={submit} className="space-y-8">
          <div>
            <label className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light block mb-2">Name</label>
            <input data-testid="register-name-input" className="input-line" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light block mb-2">Email</label>
            <input data-testid="register-email-input" type="email" className="input-line" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light block mb-2">Password</label>
            <input data-testid="register-password-input" type="password" className="input-line" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          {error && (
            <div className="border border-line p-3 bg-paper-alt font-mono-arch text-xs uppercase tracking-widest text-accent-red" data-testid="register-error">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full justify-center" disabled={loading} data-testid="register-submit-btn">
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="text-center mt-10 font-body text-sm text-ink-medium">
          Already a contributor?{" "}
          <Link to="/login" className="link-underline" data-testid="login-link-from-register">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
