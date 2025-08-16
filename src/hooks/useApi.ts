import { useState, useEffect, useCallback, useRef } from "react";
import { LoadingState, AsyncActionResult } from "../lib/types";
import { useAppActions } from "../lib/store";

// Generic hook for API calls with loading, error, and caching
export function useAsyncOperation<T>(
  operation: () => Promise<AsyncActionResult<T>>,
  dependencies: any[] = [],
  options: {
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    cacheKey?: string;
    cacheDuration?: number; // in milliseconds
  } = {},
): LoadingState<T> & {
  execute: () => Promise<void>;
  reset: () => void;
} {
  const {
    immediate = true,
    onSuccess,
    onError,
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
  } = options;

  const [state, setState] = useState<LoadingState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(
    new Map(),
  );
  const mountedRef = useRef(true);
  const { addNotification } = useAppActions();

  // Check cache
  const getCachedData = useCallback((): T | null => {
    if (!cacheKey) return null;

    const cached = cacheRef.current.get(cacheKey);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cacheDuration;
    if (isExpired) {
      cacheRef.current.delete(cacheKey);
      return null;
    }

    return cached.data;
  }, [cacheKey, cacheDuration]);

  // Set cache
  const setCachedData = useCallback(
    (data: T) => {
      if (!cacheKey) return;
      cacheRef.current.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    },
    [cacheKey],
  );

  const execute = useCallback(async () => {
    // Check cache first
    const cachedData = getCachedData();
    if (cachedData) {
      setState({ data: cachedData, loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await operation();

      if (!mountedRef.current) return;

      if (result.error) {
        setState({
          data: null,
          loading: false,
          error: result.error.message || "An error occurred",
        });

        onError?.(result.error);

        // Show error notification
        addNotification({
          title: "Error",
          message: result.error.message || "An operation failed",
          type: "error",
          read: false,
          userId: "current", // Will be replaced with actual user ID
        });
      } else {
        setState({
          data: result.data,
          loading: false,
          error: null,
        });

        if (result.data) {
          setCachedData(result.data);
          onSuccess?.(result.data);
        }
      }
    } catch (error) {
      if (!mountedRef.current) return;

      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });

      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [
    operation,
    getCachedData,
    setCachedData,
    onSuccess,
    onError,
    addNotification,
  ]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
    if (cacheKey) {
      cacheRef.current.delete(cacheKey);
    }
  }, [cacheKey]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Hook for mutations (POST, PUT, DELETE operations)
export function useMutation<TData, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<AsyncActionResult<TData>>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (
      data: TData | null,
      error: Error | null,
      variables: TVariables,
    ) => void;
  } = {},
): {
  mutate: (variables: TVariables) => Promise<void>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  loading: boolean;
  error: string | null;
  data: TData | null;
  reset: () => void;
} {
  const { onSuccess, onError, onSettled } = options;
  const [state, setState] = useState<LoadingState<TData>>({
    data: null,
    loading: false,
    error: null,
  });

  const mountedRef = useRef(true);
  const { addNotification } = useAppActions();

  const mutate = useCallback(
    async (variables: TVariables) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await mutationFn(variables);

        if (!mountedRef.current) return;

        if (result.error) {
          setState({
            data: null,
            loading: false,
            error: result.error.message || "Mutation failed",
          });

          onError?.(result.error, variables);
          onSettled?.(null, result.error, variables);

          // Show error notification
          addNotification({
            title: "Error",
            message: result.error.message || "Operation failed",
            type: "error",
            read: false,
            userId: "current",
          });
        } else {
          setState({
            data: result.data,
            loading: false,
            error: null,
          });

          if (result.data) {
            onSuccess?.(result.data, variables);
            onSettled?.(result.data, null, variables);

            // Show success notification
            addNotification({
              title: "Success",
              message: "Operation completed successfully",
              type: "success",
              read: false,
              userId: "current",
            });
          }
        }
      } catch (error) {
        if (!mountedRef.current) return;

        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        const errorObj =
          error instanceof Error ? error : new Error(errorMessage);
        onError?.(errorObj, variables);
        onSettled?.(null, errorObj, variables);
      }
    },
    [mutationFn, onSuccess, onError, onSettled, addNotification],
  );

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await mutationFn(variables);

        if (result.error) {
          throw result.error;
        }

        if (!result.data) {
          throw new Error("No data returned from mutation");
        }

        setState({
          data: result.data,
          loading: false,
          error: null,
        });

        onSuccess?.(result.data, variables);
        onSettled?.(result.data, null, variables);

        return result.data;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });

        const errorObj =
          error instanceof Error ? error : new Error(errorMessage);
        onError?.(errorObj, variables);
        onSettled?.(null, errorObj, variables);

        throw errorObj;
      }
    },
    [mutationFn, onSuccess, onError, onSettled],
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    mutate,
    mutateAsync,
    loading: state.loading,
    error: state.error,
    data: state.data,
    reset,
  };
}

// Hook for pagination
export function usePagination<T>({
  fetchFn,
  pageSize = 10,
  cacheKey,
}: {
  fetchFn: (page: number, pageSize: number) => Promise<AsyncActionResult<T[]>>;
  pageSize?: number;
  cacheKey?: string;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { execute, loading, error } = useAsyncOperation(
    () => fetchFn(currentPage, pageSize),
    [currentPage, pageSize],
    {
      cacheKey: cacheKey ? `${cacheKey}-page-${currentPage}` : undefined,
      onSuccess: (data) => {
        if (currentPage === 1) {
          setAllData(data);
        } else {
          setAllData((prev) => [...prev, ...data]);
        }
        setHasMore(data.length === pageSize);
      },
    },
  );

  const nextPage = useCallback(() => {
    if (hasMore && !loading) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasMore, loading]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setAllData([]);
    setHasMore(true);
  }, []);

  const refresh = useCallback(() => {
    setCurrentPage(1);
    setAllData([]);
    setHasMore(true);
    execute();
  }, [execute]);

  return {
    data: allData,
    loading,
    error,
    hasMore,
    currentPage,
    nextPage,
    reset,
    refresh,
  };
}

// Hook for debounced API calls (useful for search)
export function useDebouncedAsyncOperation<T>(
  operation: (query: string) => Promise<AsyncActionResult<T>>,
  delay: number = 300,
) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounce the query
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, delay]);

  const { data, loading, error, execute } = useAsyncOperation(
    () => operation(debouncedQuery),
    [debouncedQuery],
    {
      immediate: debouncedQuery.length > 0,
      cacheKey: `search-${debouncedQuery}`,
    },
  );

  return {
    query,
    setQuery,
    data,
    loading,
    error,
    execute,
  };
}
