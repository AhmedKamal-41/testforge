import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, extractError } from "../lib/api";
import { useAuth } from "../stores/auth";
import { ErrorAlert } from "../components/ErrorAlert";

export function LoginPage() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { access_token } = await authApi.login(email, password);
      setToken(access_token);
      const me = await authApi.me();
      setUser(me);
      navigate("/products");
    } catch (err) {
      setError(extractError(err, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-sm" data-testid="login-page">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Log in to ShopLite</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            data-testid="login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            data-testid="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        {error && <ErrorAlert message={error} testId="login-error" />}

        <button
          type="submit"
          data-testid="login-submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-400"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-xs text-slate-500">
        Demo-only seed credentials:{" "}
        <code>admin@shoplite.io</code> / <code>admin123</code> or{" "}
        <code>user@shoplite.io</code> / <code>user1234</code>.
      </p>
    </div>
  );
}
