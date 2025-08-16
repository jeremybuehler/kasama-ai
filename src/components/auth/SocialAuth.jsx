import React from "react";

/**
 * SocialAuth renders OAuth provider buttons.
 *
 * Props:
 * - providers: Array<"google" | "github" | string> (optional, defaults to ["google", "github"])
 * - onProviderClick: (provider: string) => void | Promise<void>
 * - disabled: boolean (optional)
 * - className: string (optional)
 * - renderIcon: (provider: string) => React.ReactNode (optional) custom icon renderer
 */
export default function SocialAuth({
  providers = ["google", "github"],
  onProviderClick,
  disabled = false,
  className = "",
  renderIcon,
}) {
  const providerLabel = (p) => {
    switch (p.toLowerCase()) {
      case "google":
        return "Continue with Google";
      case "github":
        return "Continue with GitHub";
      default:
        return `Continue with ${capitalize(p)}`;
    }
  };

  const defaultIcon = (p) => {
    const name = p.toLowerCase();
    const size = 16;
    // Simple placeholder icons; replace with your own icon set if desired
    if (name === "google") {
      return (
        <span
          aria-hidden
          style={{
            width: size,
            height: size,
            display: "inline-block",
            marginRight: 8,
          }}
        >
          🔵
        </span>
      );
    }
    if (name === "github") {
      return (
        <span
          aria-hidden
          style={{
            width: size,
            height: size,
            display: "inline-block",
            marginRight: 8,
          }}
        >
          🐙
        </span>
      );
    }
    return (
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          display: "inline-block",
          marginRight: 8,
        }}
      >
        🔘
      </span>
    );
  };

  return (
    <div
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      {providers.map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() => onProviderClick?.(provider)}
          disabled={disabled}
          style={{
            padding: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {renderIcon ? renderIcon(provider) : defaultIcon(provider)}
          <span>{providerLabel(provider)}</span>
        </button>
      ))}
    </div>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
