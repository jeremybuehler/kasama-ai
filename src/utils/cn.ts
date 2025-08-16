import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * Handles conditional classes and resolves Tailwind conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format class names with proper spacing and deduplication
 */
export function formatClassNames(
  ...classNames: (string | undefined | null | false)[]
): string {
  return classNames.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Generate responsive class names
 */
export function responsive(
  base: string,
  breakpoints: Record<string, string> = {},
) {
  const classes = [base];

  Object.entries(breakpoints).forEach(([breakpoint, className]) => {
    if (className) {
      classes.push(`${breakpoint}:${className}`);
    }
  });

  return classes.join(" ");
}

/**
 * Focus-visible utility for accessibility
 */
export const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Common transition classes
 */
export const transitions = {
  fast: "transition-all duration-150 ease-in-out",
  normal: "transition-all duration-300 ease-in-out",
  slow: "transition-all duration-500 ease-in-out",
  colors: "transition-colors duration-200 ease-in-out",
  transform: "transition-transform duration-200 ease-in-out",
  opacity: "transition-opacity duration-200 ease-in-out",
};

/**
 * Screen reader only class
 */
export const srOnly = "sr-only";

/**
 * Truncate text utility
 */
export const truncate = "truncate";

/**
 * Common spacing utilities
 */
export const spacing = {
  xs: "p-1",
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
};

/**
 * Generate data attribute selectors for styling
 */
export function dataAttribute(
  attribute: string,
  value?: string | number | boolean,
) {
  if (value === undefined) {
    return `[data-${attribute}]`;
  }
  return `[data-${attribute}="${value}"]`;
}

/**
 * Merge theme configurations
 */
export function mergeThemes<T extends Record<string, any>>(
  base: T,
  override: Partial<T>,
): T {
  const result = { ...base };

  Object.keys(override).forEach((key) => {
    const overrideValue = override[key as keyof T];
    if (
      overrideValue &&
      typeof overrideValue === "object" &&
      !Array.isArray(overrideValue)
    ) {
      result[key as keyof T] = {
        ...result[key as keyof T],
        ...overrideValue,
      } as T[keyof T];
    } else if (overrideValue !== undefined) {
      result[key as keyof T] = overrideValue as T[keyof T];
    }
  });

  return result;
}
