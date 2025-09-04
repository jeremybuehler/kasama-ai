// Global type declarations for browser APIs and custom properties

declare global {
  interface Window {
    __COMPONENT_ERROR__?: (error: Error, errorInfo: any) => void;
    deferredPrompt?: any;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    __TAURI_METADATA__?: {
      __currentWindow: {
        label: string;
      };
    };
  }

  interface PerformanceEntry {
    processingStart?: number;
    hadRecentInput?: boolean;
    value?: number;
  }

  interface PerformanceNavigationTiming {
    navigationStart?: number;
  }

  interface Event {
    detail?: {
      isOnline: boolean;
    };
  }
  
  // Environment variables
  const __DEV__: boolean;
  const __PROD__: boolean;
  
  // Browser APIs that might be missing in TypeScript
  const requestAnimationFrame: (callback: (time: number) => void) => number;
  const cancelAnimationFrame: (id: number) => void;
  
  // Node.js globals for scripts
  const process: {
    env: Record<string, string | undefined>;
    exit: (code?: number) => never;
    NODE_ENV?: string;
  };
  
  // Test globals
  const beforeAll: (fn: () => void | Promise<void>) => void;
  const afterAll: (fn: () => void | Promise<void>) => void;
  
  // Standard Web APIs
  const HTMLButtonElement: {
    new(): HTMLElement;
    prototype: HTMLElement;
  };
  
  const HTMLFormElement: {
    new(): HTMLElement;
    prototype: HTMLElement;
  };
  
  const URLSearchParams: {
    new(init?: string | string[][] | Record<string, string> | URLSearchParams): {
      get(name: string): string | null;
      set(name: string, value: string): void;
      append(name: string, value: string): void;
      delete(name: string): void;
      has(name: string): boolean;
      toString(): string;
    };
  };
  
  const btoa: (data: string) => string;
  const atob: (data: string) => string;
  
  const TextEncoder: {
    new(): {
      encode(input?: string): Uint8Array;
    };
  };
  
  const TextDecoder: {
    new(label?: string): {
      decode(input?: ArrayBuffer | ArrayBufferView): string;
    };
  };
  
  const ReadableStream: {
    new<T>(underlyingSource?: any): any;
  };
  
  const Response: {
    new(body?: any, init?: any): any;
    json(): Promise<any>;
    text(): Promise<string>;
    ok: boolean;
    status: number;
  };
  
  const Blob: {
    new(array: any[], options?: any): any;
  };
  
  const AbortController: {
    new(): {
      signal: AbortSignal;
      abort(): void;
    };
  };
}

export {};
