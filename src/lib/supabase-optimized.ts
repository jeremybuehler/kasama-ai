import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// Enhanced Supabase client with performance optimizations
class OptimizedSupabaseClient {
  private client: SupabaseClient<Database>;
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private connectionPool: SupabaseClient[] = [];
  private maxConnections = 10;
  private currentConnectionIndex = 0;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    options?: {
      maxConnections?: number;
      defaultCacheTTL?: number;
    }
  ) {
    this.maxConnections = options?.maxConnections || 10;
    
    // Create connection pool
    for (let i = 0; i < this.maxConnections; i++) {
      this.connectionPool.push(
        createClient<Database>(supabaseUrl, supabaseKey, {
          auth: { persistSession: true, storageKey: `kasama-auth-${i}` },
          db: { schema: "public" },
          global: { headers: { "x-connection-id": `pool-${i}` } },
        })
      );
    }

    // Main client for general use
    this.client = this.connectionPool[0];
  }

  /**
   * Get a connection from the pool using round-robin
   */
  private getPooledConnection(): SupabaseClient<Database> {
    this.currentConnectionIndex = (this.currentConnectionIndex + 1) % this.maxConnections;
    return this.connectionPool[this.currentConnectionIndex];
  }

  /**
   * Execute query with caching support
   */
  async cachedQuery<T>(
    queryKey: string,
    queryFn: (client: SupabaseClient<Database>) => Promise<{ data: T | null; error: any }>,
    cacheTTL: number = 300000 // 5 minutes default
  ): Promise<{ data: T | null; error: any; fromCache: boolean }> {
    // Check cache first
    const cached = this.queryCache.get(queryKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return { data: cached.data, error: null, fromCache: true };
    }

    // Execute query with pooled connection
    const client = this.getPooledConnection();
    const result = await queryFn(client);

    // Cache successful results
    if (!result.error && result.data) {
      this.queryCache.set(queryKey, {
        data: result.data,
        timestamp: Date.now(),
        ttl: cacheTTL,
      });
    }

    return { ...result, fromCache: false };
  }

  /**
   * Batch multiple queries for better performance
   */
  async batchQueries<T extends Record<string, any>>(
    queries: Array<{
      key: keyof T;
      queryFn: (client: SupabaseClient<Database>) => Promise<{ data: any; error: any }>;
      cacheTTL?: number;
    }>
  ): Promise<{ [K in keyof T]: { data: T[K] | null; error: any; fromCache: boolean } }> {
    const promises = queries.map(({ key, queryFn, cacheTTL = 300000 }) =>
      this.cachedQuery(String(key), queryFn, cacheTTL).then(result => ({ key, result }))
    );

    const results = await Promise.all(promises);
    
    return results.reduce((acc, { key, result }) => {
      acc[key] = result;
      return acc;
    }, {} as any);
  }

  /**
   * Streaming query results for large datasets
   */
  async *streamQuery<T>(
    table: string,
    filters: Record<string, any> = {},
    options: {
      batchSize?: number;
      orderBy?: { column: string; ascending?: boolean };
    } = {}
  ): AsyncGenerator<T[], void, unknown> {
    const batchSize = options.batchSize || 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const client = this.getPooledConnection();
      let query = client.from(table).select("*");

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply pagination
      query = query.range(offset, offset + batchSize - 1);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      yield data as T[];

      if (data.length < batchSize) {
        hasMore = false;
      } else {
        offset += batchSize;
      }
    }
  }

  /**
   * Invalidate cache entries
   */
  invalidateCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.queryCache.keys()) {
        if (regex.test(key)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const entries = Array.from(this.queryCache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      ttl: value.ttl,
    }));

    return {
      size: this.queryCache.size,
      hitRate: 0, // Would need to track hits/misses to calculate
      entries,
    };
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.queryCache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * Get the main client for direct access
   */
  get mainClient(): SupabaseClient<Database> {
    return this.client;
  }

  /**
   * Execute real-time subscription with connection pooling
   */
  createSubscription(
    table: string,
    callback: (payload: any) => void,
    filters?: Record<string, any>
  ) {
    const client = this.getPooledConnection();
    
    let channel = client
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: filters ? Object.entries(filters).map(([key, value]) => `${key}=eq.${value}`).join("&") : undefined,
        },
        callback
      );

    return {
      subscribe: () => channel.subscribe(),
      unsubscribe: () => channel.unsubscribe(),
    };
  }

  /**
   * Health check for all connections
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    connections: Array<{ index: number; healthy: boolean; latency?: number }>;
  }> {
    const checks = await Promise.all(
      this.connectionPool.map(async (client, index) => {
        const start = Date.now();
        try {
          const { error } = await client.from("profiles").select("id").limit(1);
          const latency = Date.now() - start;
          return { index, healthy: !error, latency };
        } catch {
          return { index, healthy: false };
        }
      })
    );

    const healthyCount = checks.filter(c => c.healthy).length;
    
    return {
      healthy: healthyCount > 0,
      connections: checks,
    };
  }
}

// Create singleton instance
let optimizedSupabase: OptimizedSupabaseClient;

export function getOptimizedSupabase(): OptimizedSupabaseClient {
  if (!optimizedSupabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase credentials not configured");
    }

    optimizedSupabase = new OptimizedSupabaseClient(supabaseUrl, supabaseAnonKey, {
      maxConnections: parseInt(import.meta.env.VITE_SUPABASE_MAX_CONNECTIONS || "10"),
      defaultCacheTTL: parseInt(import.meta.env.VITE_CACHE_TTL || "300000"),
    });
  }

  return optimizedSupabase;
}

export { OptimizedSupabaseClient };