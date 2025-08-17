import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // Use App.tsx with authentication protection
import "./styles/tailwind.css";
import "./styles/index.css";
import { register as registerSW } from "./serviceWorkerRegistration";
import offlineManager from "./services/offline-manager";

// Initialize error reporting
if (typeof window !== "undefined") {
  // Global error handler for unhandled errors
  window.addEventListener("error", (event) => {
    console.error("Global error:", event.error);
    // You can integrate with error reporting service here (Sentry, LogRocket, etc.)
  });

  // Global handler for unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
    // You can integrate with error reporting service here
  });

  // Component error handler (used by ErrorBoundary)
  window.__COMPONENT_ERROR__ = (error, errorInfo) => {
    console.error("Component error:", error, errorInfo);
    // You can integrate with error reporting service here
  };
}

// Performance monitoring
if (typeof window !== "undefined" && "performance" in window) {
  // Log Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === "largest-contentful-paint") {
        console.log("LCP:", entry.startTime);
      }
      if (entry.entryType === "first-input") {
        console.log("FID:", entry.processingStart - entry.startTime);
      }
      if (entry.entryType === "layout-shift" && !entry.hadRecentInput) {
        console.log("CLS:", entry.value);
      }
    });
  });

  try {
    observer.observe({
      entryTypes: ["largest-contentful-paint", "first-input", "layout-shift"],
    });
  } catch (error) {
    // Performance Observer not supported
    console.warn("Performance Observer not supported");
  }
}

// App initialization
const container = document.getElementById("root");
if (!container) {
  throw new Error(
    'Root element not found. Make sure you have a div with id="root" in your HTML.',
  );
}

const root = createRoot(container);

// Initialize progress tracking on app load
if (typeof window !== "undefined") {
  // Import and initialize progress tracking
  import("./services/progress-tracking")
    .then((module) => {
      module.default.initializeProgress();
      console.log("Progress tracking initialized");
    })
    .catch((error) => {
      console.error("Failed to initialize progress tracking:", error);
    });
}

// Render app with error boundary
try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error("Failed to render app:", error);

  // Fallback UI for catastrophic errors
  root.render(
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <h1 style={{ color: "#dc2626", marginBottom: "16px" }}>
          Application Error
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "20px" }}>
          Sorry, something went wrong loading the application.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Reload Page
        </button>
      </div>
    </div>,
  );
}

// Initialize PWA and offline capabilities
if (typeof window !== "undefined") {
  // Service worker registration disabled until sw.js is created
  console.log("PWA features available - service worker registration skipped");

  // Initialize offline manager
  console.log("Initializing offline capabilities...");

  // Add connection status indicator
  addConnectionStatusIndicator();
}

// Show PWA install prompt
function showInstallPrompt() {
  // Create install button if not exists
  const existingButton = document.getElementById("pwa-install-button");
  if (!existingButton && window.deferredPrompt) {
    const installButton = document.createElement("button");
    installButton.id = "pwa-install-button";
    installButton.textContent = "Install App";
    installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 20px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      display: none;
    `;
    document.body.appendChild(installButton);
  }
}

// Show update notification
function showUpdateNotification(registration) {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #059669;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    max-width: 300px;
  `;
  // Create elements safely without innerHTML
  const title = document.createElement("div");
  title.textContent = "Update Available";
  title.style.cssText = "margin-bottom: 8px; font-weight: 500;";
  
  const message = document.createElement("div");
  message.textContent = "A new version of Kasama AI is ready!";
  message.style.cssText = "font-size: 14px; margin-bottom: 12px;";
  
  const button = document.createElement("button");
  button.textContent = "Update Now";
  button.style.cssText = `
    background: white;
    color: #059669;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
  `;
  button.addEventListener("click", () => window.location.reload());
  
  notification.appendChild(title);
  notification.appendChild(message);
  notification.appendChild(button);

  document.body.appendChild(notification);

  // Auto remove after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 10000);
}

// Add connection status indicator
function addConnectionStatusIndicator() {
  const indicator = document.createElement("div");
  indicator.id = "connection-status";
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    z-index: 1000;
    transition: all 0.3s ease;
    display: none;
  `;

  const updateStatus = (isOnline) => {
    if (isOnline) {
      indicator.textContent = "Back online";
      indicator.style.background = "#10b981";
      indicator.style.color = "white";
    } else {
      indicator.textContent = "Offline - changes will sync when reconnected";
      indicator.style.background = "#f59e0b";
      indicator.style.color = "white";
    }

    indicator.style.display = "block";
    setTimeout(() => {
      indicator.style.display = "none";
    }, 3000);
  };

  // Listen for connection changes
  window.addEventListener("connectionchange", (event) => {
    updateStatus(event.detail.isOnline);
  });

  document.body.appendChild(indicator);
}
