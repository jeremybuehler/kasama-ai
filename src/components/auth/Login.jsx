import React, { useState } from "react";

/**
 * Login form with email/password and error handling.
 *
 * Props:
 * - onLogin: (email: string, password: string) => Promise<void> | void
 * - onForgotPassword: () => void (optional)
 * - disabled: boolean (optional)
 * - className: string (optional)
 */
export default function Login({
  onLogin,
  onForgotPassword,
  disabled = false,
  className = "",
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      await onLogin?.(email.trim(), password);
    } catch (err) {
      const message = err?.message || "Unable to sign in. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = disabled || loading;

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          <div style={{ marginBottom: 4 }}>Email</div>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isDisabled}
            required
            placeholder="you@example.com"
            style={{ padding: 8 }}
          />
        </label>

        <label>
          <div style={{ marginBottom: 4 }}>Password</div>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isDisabled}
            required
            placeholder="••••••••"
            style={{ padding: 8 }}
          />
        </label>

        {error ? (
          <div role="alert" style={{ color: "#b00020" }}>
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={isDisabled} style={{ padding: 10 }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {onForgotPassword ? (
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={isDisabled}
            style={{
              padding: 8,
              alignSelf: "flex-start",
              background: "transparent",
              border: "none",
              color: "#2563eb",
              cursor: "pointer",
            }}
          >
            Forgot your password?
          </button>
        ) : null}
      </div>
    </form>
  );
}
