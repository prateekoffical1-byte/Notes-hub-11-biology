import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) nav("/"); else setError(res.error);
  };

  return (
    <div className="relative z-10 fade-in" data-testid="login-page">
      <div className="max-w-md mx-auto px-6 py-20">
        <p className="font-mono-arch text-xs tracking-[0.25em] uppercase text-accent-green mb-4 text-center">Returning Contributor</p>
        <h1 className="font-serif-display text-5xl text-ink-dark text-center mb-10">Sign in.</h1>

        <form onSubmit={submit} className="space-y-8">
          <div>
            <label className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light block mb-2">Email</label>
            <input
              data-testid="login-email-input"
              type="email"
              className="input-line"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="font-mono-arch text-[10px] tracking-widest uppercase text-ink-light block mb-2">Password</label>
            <input
              data-testid="login-password-input"
              type="password"
              className="input-line"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="border border-line p-3 bg-paper-alt font-mono-arch text-xs uppercase tracking-widest text-accent-red" data-testid="login-error">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full justify-center" disabled={loading} data-testid="login-submit-btn">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center mt-10 font-body text-sm text-ink-medium">
          No account?{" "}
          <Link to="/register" className="link-underline" data-testid="register-link">Register here</Link>
        </p>
        <p className="text-center mt-2 font-mono-arch text-[10px] uppercase tracking-widest text-ink-light">
          Sign-in is optional · You can browse & download anonymously
        </p>
      </div>
    </div>
  );
}
