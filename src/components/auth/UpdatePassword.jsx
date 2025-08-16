import React, { useState } from "react";

/**
 * Update password form for after a reset link.
 *
 * Props:
 * - onUpdatePassword: (newPassword: string, token?: string) => Promise<void> | void
 * - token: string (optional) - reset token if needed by backend
 * - disabled: boolean (optional)
 * - className: string (optional)
 */
export default function UpdatePassword({
  onUpdatePassword,
  token,
  disabled = false,
  className = "",
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password) {
      setError("Please enter a new password.");
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
      await onUpdatePassword?.(password, token);
      setSuccess("Your password has been updated.");
      setPassword("");
      setConfirm("");
    } catch (err) {
      const message =
        err?.message || "Unable to update password. Please try again.";
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
          <div style={{ marginBottom: 4 }}>New password</div>
          <input
            type="password"
            name="new-password"
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
            name="confirm-password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={isDisabled}
            required
            placeholder="Re-enter your new password"
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
          {loading ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}
