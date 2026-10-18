import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { backendConfigured, supabase } from "@/lib/supabase";

export const authInput =
  "w-full rounded-sm border border-line bg-ink px-3 py-2.5 text-sm text-paper placeholder:text-fog/60 focus:border-teal focus:outline-none";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-6 font-sans text-paper">
      <SEO title={`${title} | Iridiphore`} description={title} path="/login" noindex />
      <div className="w-full max-w-sm rounded-sm border border-line bg-panel p-8">
        <h1 className="mb-6 text-center font-display text-3xl italic">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase?.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError("");
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) return setError(err.message);
    navigate("/admin", { replace: true });
  }

  return (
    <AuthShell title="Sign in">
      {!backendConfigured ? (
        <p className="text-sm text-fog">
          Preview mode: there is no database connected yet, so sign-in is switched off. See docs/SETUP.md.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInput}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInput}
          />
          {error && <p role="alert" className="text-sm text-ember">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-sm bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-teal disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="pt-2 text-center text-sm">
            <Link to="/reset-password" className="text-fog hover:text-paper">Forgot password?</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
