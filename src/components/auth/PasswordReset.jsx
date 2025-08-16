import React, { useState } from "react";

/**
 * Password reset request form.
 *
 * Props:
 * - onRequestReset: (email: string) => Promise<void> | void
 * - disabled: boolean (optional)
 * - className: string (optional)
 */
export default function PasswordReset({
  onRequestReset,
  disabled = false,
  className = "",
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      await onRequestReset?.(email.trim());
      setSent(true);
    } catch (err) {
      const message =
        err?.message || "Unable to send reset email. Please try again.";
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
            disabled={isDisabled || sent}
            required
            placeholder="you@example.com"
            style={{ padding: 8 }}
          />
        </label>

        {error ? (
          <div role="alert" style={{ color: "#b00020" }}>
            {error}
          </div>
        ) : null}
        {sent ? (
          <div role="status" style={{ color: "#047857" }}>
            If an account exists for that email, we sent a password reset link.
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isDisabled || sent}
          style={{ padding: 10 }}
        >
          {loading ? "Sending…" : sent ? "Email sent" : "Send reset link"}
        </button>
      </div>
    </form>
  );
}
