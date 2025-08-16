import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for managing localStorage with TypeScript support
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  } = {},
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options;

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to localStorage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, serialize(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serialize, storedValue],
  );

  // Function to remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to this localStorage key from other tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.warn(
            `Error parsing localStorage value for key "${key}":`,
            error,
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, deserialize]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing sessionStorage (similar API to useLocalStorage)
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  } = {},
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(key, serialize(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, serialize, storedValue],
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for checking localStorage availability
 */
export function useStorageAvailable(): {
  localStorage: boolean;
  sessionStorage: boolean;
} {
  const [availability, setAvailability] = useState({
    localStorage: false,
    sessionStorage: false,
  });

  useEffect(() => {
    const checkAvailability = (
      type: "localStorage" | "sessionStorage",
    ): boolean => {
      if (typeof window === "undefined") return false;

      try {
        const storage = window[type];
        const testKey = "__storage_test__";
        storage.setItem(testKey, "test");
        storage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    };

    setAvailability({
      localStorage: checkAvailability("localStorage"),
      sessionStorage: checkAvailability("sessionStorage"),
    });
  }, []);

  return availability;
}

/**
 * Hook for tracking storage usage
 */
export function useStorageUsage() {
  const [usage, setUsage] = useState<{
    localStorage: {
      used: number;
      available: number;
      percentage: number;
    } | null;
    sessionStorage: {
      used: number;
      available: number;
      percentage: number;
    } | null;
  }>({ localStorage: null, sessionStorage: null });

  const calculateUsage = useCallback(() => {
    if (typeof window === "undefined") return;

    const getStorageUsage = (storage: Storage) => {
      try {
        const used = JSON.stringify(storage).length;
        // Most browsers allow 5-10MB, we'll use 5MB as a conservative estimate
        const available = 5 * 1024 * 1024; // 5MB in bytes
        const percentage = (used / available) * 100;

        return { used, available, percentage };
      } catch {
        return null;
      }
    };

    setUsage({
      localStorage: getStorageUsage(window.localStorage),
      sessionStorage: getStorageUsage(window.sessionStorage),
    });
  }, []);

  useEffect(() => {
    calculateUsage();

    // Recalculate on storage events
    window.addEventListener("storage", calculateUsage);

    return () => {
      window.removeEventListener("storage", calculateUsage);
    };
  }, [calculateUsage]);

  return { usage, refresh: calculateUsage };
}
