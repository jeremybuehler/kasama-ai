// Accessibility utilities and helpers

/**
 * Focus management utilities
 */
export class FocusManager {
  private focusableSelectors = [
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "a[href]",
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(", ");

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors));
  }

  /**
   * Trap focus within a container (useful for modals)
   */
  trapFocus(container: HTMLElement, event: KeyboardEvent) {
    if (event.key !== "Tab") return;

    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }

  /**
   * Save and restore focus (useful for modal dialogs)
   */
  saveFocus(): () => void {
    const activeElement = document.activeElement as HTMLElement;

    return () => {
      if (activeElement && typeof activeElement.focus === "function") {
        activeElement.focus();
      }
    };
  }

  /**
   * Move focus to the first focusable element
   */
  focusFirst(container: HTMLElement): boolean {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  }
}

export const focusManager = new FocusManager();

/**
 * Announce text to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite",
) {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Create unique IDs for form elements and labels
 */
let idCounter = 0;
export function generateId(prefix: string = "element"): string {
  return `${prefix}-${++idCounter}-${Date.now()}`;
}

/**
 * Keyboard event utilities
 */
export const keys = {
  ENTER: "Enter",
  SPACE: " ",
  TAB: "Tab",
  ESCAPE: "Escape",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
};

/**
 * Check if a key event matches specific keys
 */
export function isKey(event: KeyboardEvent, ...keys: string[]): boolean {
  return keys.includes(event.key);
}

/**
 * Check if only specific modifier keys are pressed
 */
export function hasModifiers(
  event: KeyboardEvent,
  modifiers: {
    shift?: boolean;
    ctrl?: boolean;
    alt?: boolean;
    meta?: boolean;
  },
): boolean {
  const { shift = false, ctrl = false, alt = false, meta = false } = modifiers;

  return (
    event.shiftKey === shift &&
    event.ctrlKey === ctrl &&
    event.altKey === alt &&
    event.metaKey === meta
  );
}

/**
 * Color contrast utilities for accessibility
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd want a more robust color parsing library
  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);

  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
}

function getLuminance(color: string): number {
  // Simplified luminance calculation
  // This is a basic implementation - use a proper color library for production
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Check if contrast ratio meets WCAG guidelines
 */
export function meetsWCAGContrast(
  foreground: string,
  background: string,
  level: "AA" | "AAA" = "AA",
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const threshold = level === "AAA" ? 7 : 4.5;
  return ratio >= threshold;
}

/**
 * Reduced motion utilities
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Apply motion preferences to animations
 */
export function getAnimationDuration(baseDuration: number): number {
  return prefersReducedMotion() ? 0 : baseDuration;
}

/**
 * Screen reader utilities
 */
export function hideFromScreenReader(element: HTMLElement) {
  element.setAttribute("aria-hidden", "true");
}

export function showToScreenReader(element: HTMLElement) {
  element.removeAttribute("aria-hidden");
}

export function setScreenReaderDescription(
  element: HTMLElement,
  description: string,
) {
  const descriptionId = generateId("description");

  // Create description element
  const descriptionElement = document.createElement("div");
  descriptionElement.id = descriptionId;
  descriptionElement.className = "sr-only";
  descriptionElement.textContent = description;

  // Append to body
  document.body.appendChild(descriptionElement);

  // Associate with element
  element.setAttribute("aria-describedby", descriptionId);

  // Return cleanup function
  return () => {
    document.body.removeChild(descriptionElement);
    element.removeAttribute("aria-describedby");
  };
}

/**
 * Form accessibility helpers
 */
export function associateLabelWithInput(
  label: HTMLLabelElement,
  input: HTMLInputElement,
) {
  if (!input.id) {
    input.id = generateId("input");
  }
  label.setAttribute("for", input.id);
}

export function setFieldError(input: HTMLInputElement, errorMessage: string) {
  const errorId = generateId("error");

  // Create error element
  const errorElement = document.createElement("div");
  errorElement.id = errorId;
  errorElement.className = "text-sm text-destructive";
  errorElement.textContent = errorMessage;
  errorElement.setAttribute("role", "alert");

  // Insert after input
  input.parentNode?.insertBefore(errorElement, input.nextSibling);

  // Associate with input
  const existingDescribedBy = input.getAttribute("aria-describedby");
  const describedBy = existingDescribedBy
    ? `${existingDescribedBy} ${errorId}`
    : errorId;
  input.setAttribute("aria-describedby", describedBy);
  input.setAttribute("aria-invalid", "true");

  // Return cleanup function
  return () => {
    errorElement.remove();
    input.removeAttribute("aria-invalid");

    const currentDescribedBy = input.getAttribute("aria-describedby");
    if (currentDescribedBy) {
      const newDescribedBy = currentDescribedBy.replace(errorId, "").trim();
      if (newDescribedBy) {
        input.setAttribute("aria-describedby", newDescribedBy);
      } else {
        input.removeAttribute("aria-describedby");
      }
    }
  };
}

/**
 * Live region management
 */
export class LiveRegion {
  private element: HTMLDivElement;

  constructor(priority: "polite" | "assertive" = "polite") {
    this.element = document.createElement("div");
    this.element.setAttribute("aria-live", priority);
    this.element.setAttribute("aria-atomic", "true");
    this.element.className = "sr-only";
    document.body.appendChild(this.element);
  }

  announce(message: string) {
    this.element.textContent = message;
  }

  clear() {
    this.element.textContent = "";
  }

  destroy() {
    this.element.remove();
  }
}

/**
 * React hooks for accessibility
 */
import { useEffect, useRef, useState } from "react";

/**
 * Hook for managing focus restoration
 */
export function useFocusRestore() {
  const restoreFocus = useRef<(() => void) | null>(null);

  const saveFocus = () => {
    restoreFocus.current = focusManager.saveFocus();
  };

  const restorePreviousFocus = () => {
    if (restoreFocus.current) {
      restoreFocus.current();
      restoreFocus.current = null;
    }
  };

  return { saveFocus, restorePreviousFocus };
}

/**
 * Hook for managing focus trap in modals
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      focusManager.trapFocus(container, event);
    };

    // Focus first element
    focusManager.focusFirst(container);

    // Add event listener
    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for announcements
 */
export function useAnnouncer() {
  const liveRegion = useRef<LiveRegion | null>(null);

  useEffect(() => {
    liveRegion.current = new LiveRegion("polite");

    return () => {
      liveRegion.current?.destroy();
    };
  }, []);

  const announce = (message: string) => {
    liveRegion.current?.announce(message);
  };

  return { announce };
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(() =>
    prefersReducedMotion(),
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = () => {
      setPrefersReduced(mediaQuery.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReduced;
}
