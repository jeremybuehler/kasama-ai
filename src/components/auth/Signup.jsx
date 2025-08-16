import React, { useState } from "react";

/**
 * Signup form with email/password.
 *
 * Props:
 * - onSignup: (email: string, password: string) => Promise<void> | void
 * - disabled: boolean (optional)
 * - className: string (optional)
 */
export default function Signup({ onSignup, disabled = false, className = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await onSignup?.(email.trim(), password);
      setSuccess(
        "Account created. Please check your email if verification is required.",
      );
      setEmail("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      const message = err?.message || "Unable to sign up. Please try again.";
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isDisabled}
            required
            placeholder="At least 8 characters"
            style={{ padding: 8 }}
          />
        </label>

        <label>
          <div style={{ marginBottom: 4 }}>Confirm password</div>
          <input
            type="password"
            name="confirm"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={isDisabled}
            required
            placeholder="Re-enter your password"
            style={{ padding: 8 }}
          />
        </label>

        {error ? (
          <div role="alert" style={{ color: "#b00020" }}>
            {error}
          </div>
        ) : null}
        {success ? (
          <div role="status" style={{ color: "#047857" }}>
            {success}
          </div>
        ) : null}

        <button type="submit" disabled={isDisabled} style={{ padding: 10 }}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </div>
    </form>
  );
}
