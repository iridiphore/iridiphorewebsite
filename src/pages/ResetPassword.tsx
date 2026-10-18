import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { backendConfigured, supabase } from "@/lib/supabase";
import { AuthShell, authInput } from "./Login";

// "request" emails a recovery link. "update" is entered when that emailed link lands here
// with a temporary recovery session, and sets the new password.
export default function ResetPassword() {
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const hashError = hash.get("error_description");
    if (hashError) setError(hashError.replace(/\+/g, " "));

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function request(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError("");
    setMessage("");
    setBusy(true);
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}reset-password`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (err) return setError(err.message);
    setMessage("Check your email for the reset link. Open it soon, links expire.");
  }

  async function update(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError("");
    setMessage("");
    if (password.length < 10) return setError("Use at least 10 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(err.message);
    setMessage("Password updated. You're signed in.");
  }

  const button =
    "w-full rounded-sm bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-teal disabled:opacity-60";

  return (
    <AuthShell title="Reset password">
      {!backendConfigured ? (
        <p className="text-sm text-fog">Preview mode: no database connected yet.</p>
      ) : mode === "request" ? (
        <form onSubmit={request} className="space-y-3">
          <input type="email" required autoComplete="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={authInput} />
          <button type="submit" disabled={busy} className={button}>{busy ? "Sending…" : "Send reset link"}</button>
        </form>
      ) : (
        <form onSubmit={update} className="space-y-3">
          <input type="password" required autoComplete="new-password" placeholder="New password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={authInput} />
          <input type="password" required autoComplete="new-password" placeholder="Confirm password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} className={authInput} />
          <button type="submit" disabled={busy} className={button}>{busy ? "Saving…" : "Set password"}</button>
        </form>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-ember">{error}</p>}
      {message && <p role="status" className="mt-3 text-sm text-teal">{message}</p>}
      <p className="pt-4 text-center text-sm">
        <Link to={mode === "update" && message ? "/admin" : "/login"} className="text-fog hover:text-paper">
          {mode === "update" && message ? "Go to admin" : "Back to sign in"}
        </Link>
      </p>
    </AuthShell>
  );
}
