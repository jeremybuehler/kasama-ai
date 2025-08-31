import { getOptimizedSupabase } from "../lib/supabase-optimized";
import { Database } from "../lib/database.types";
import { useAppStore } from "../lib/store";

type Tables = Database["public"]["Tables"];
type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

// Real-time event types
interface RealtimeSubscription {
  id: string;
  channel: string;
  table: string;
  filter?: Record<string, any>;
  callback: (event: RealtimeEventPayload) => void;
  unsubscribe: () => void;
}

interface RealtimeEventPayload {
  eventType: RealtimeEvent;
  table: string;
  new?: any;
  old?: any;
  timestamp: string;
}

interface ConnectionStatus {
  connected: boolean;
  lastHeartbeat: Date;
  reconnectAttempts: number;
  latency: number;
}

// Enhanced real-time service with connection management and performance optimization
export class RealtimeService {
  private supabase = getOptimizedSupabase();
  private subscriptions = new Map<string, RealtimeSubscription>();
  private connectionStatus: ConnectionStatus = {
    connected: false,
    lastHeartbeat: new Date(),
    reconnectAttempts: 0,
    latency: 0,
  };
  
  private heartbeatInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds

  constructor() {
    this.initializeConnection();
    this.startHeartbeat();
  }

  /**
   * Initialize real-time connection with automatic reconnection
   */
  private async initializeConnection(): Promise<void> {
    try {
      // Test connection with a simple query
      const { data, error } = await this.supabase.mainClient
        .from("profiles")
        .select("id")
        .limit(1);

      if (error) throw error;

      this.connectionStatus.connected = true;
      this.connectionStatus.reconnectAttempts = 0;
      this.connectionStatus.lastHeartbeat = new Date();
      
      console.log("✅ Real-time service connected");
    } catch (error) {
      console.error("❌ Failed to initialize real-time connection:", error);
      this.handleConnectionError();
    }
  }

  /**
   * Subscribe to real-time events for a specific table
   */
  subscribeToTable<T extends keyof Tables>(
    table: T,
    callback: (event: RealtimeEventPayload) => void,
    filter?: Record<string, any>
  ): string {
    const subscriptionId = crypto.randomUUID();
    const channel = `${table}-${subscriptionId}`;

    try {
      const subscription = this.supabase.createSubscription(
        table as string,
        (payload: any) => {
          const event: RealtimeEventPayload = {
            eventType: payload.eventType,
            table: table as string,
            new: payload.new,
            old: payload.old,
            timestamp: new Date().toISOString(),
          };
          
          // Update latency measurement
          this.updateLatency();
          callback(event);
        },
        filter
      );

      const realtimeSubscription: RealtimeSubscription = {
        id: subscriptionId,
        channel,
        table: table as string,
        filter,
        callback,
        unsubscribe: () => subscription.unsubscribe(),
      };

      this.subscriptions.set(subscriptionId, realtimeSubscription);
      
      // Activate the subscription
      subscription.subscribe();
      
      console.log(`📡 Subscribed to ${table} changes:`, subscriptionId);
      return subscriptionId;
    } catch (error) {
      console.error(`❌ Failed to subscribe to ${table}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to user-specific events (filtered by user_id)
   */
  subscribeToUserEvents<T extends keyof Tables>(
    table: T,
    userId: string,
    callback: (event: RealtimeEventPayload) => void
  ): string {
    return this.subscribeToTable(table, callback, { user_id: userId });
  }

  /**
   * Subscribe to assessment updates for a user
   */
  subscribeToAssessments(
    userId: string,
    callback: (assessment: Tables["assessments"]["Row"]) => void
  ): string {
    return this.subscribeToUserEvents("assessments", userId, (event) => {
      if (event.eventType === "UPDATE" && event.new) {
        callback(event.new);
        
        // Update local store
        const { setAssessments } = useAppStore.getState();
        const currentAssessments = useAppStore.getState().assessments;
        const updatedAssessments = currentAssessments.map(assessment =>
          assessment.id === event.new.id ? event.new : assessment
        );
        setAssessments(updatedAssessments);
      }
    });
  }

  /**
   * Subscribe to progress updates for a user
   */
  subscribeToProgress(
    userId: string,
    callback: (progress: Tables["progress"]["Row"]) => void
  ): string {
    return this.subscribeToUserEvents("progress", userId, (event) => {
      if (event.eventType === "INSERT" && event.new) {
        callback(event.new);
        
        // Update local store
        const { setProgress } = useAppStore.getState();
        const currentProgress = useAppStore.getState().progress;
        setProgress([event.new, ...currentProgress]);
      }
    });
  }

  /**
   * Subscribe to AI interaction updates (for performance monitoring)
   */
  subscribeToAIInteractions(
    userId: string,
    callback: (interaction: Tables["ai_interactions"]["Row"]) => void
  ): string {
    return this.subscribeToUserEvents("ai_interactions", userId, (event) => {
      if (event.eventType === "INSERT" && event.new) {
        callback(event.new);
      }
    });
  }

  /**
   * Subscribe to notifications for a user
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: Tables["notifications"]["Row"]) => void
  ): string {
    return this.subscribeToUserEvents("notifications", userId, (event) => {
      if (event.eventType === "INSERT" && event.new) {
        callback(event.new);
        
        // Add to local store
        const { addNotification } = useAppStore.getState();
        addNotification({
          type: event.new.type,
          title: event.new.title,
          message: event.new.message,
          read: event.new.read,
        });
      }
    });
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      console.log(`🔌 Unsubscribed from ${subscription.table}:`, subscriptionId);
    }
  }

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll(): void {
    for (const [id, subscription] of this.subscriptions.entries()) {
      subscription.unsubscribe();
      console.log(`🔌 Unsubscribed from ${subscription.table}:`, id);
    }
    this.subscriptions.clear();
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Get active subscriptions info
   */
  getSubscriptions(): Array<{
    id: string;
    table: string;
    filter?: Record<string, any>;
  }> {
    return Array.from(this.subscriptions.values()).map(sub => ({
      id: sub.id,
      table: sub.table,
      filter: sub.filter,
    }));
  }

  /**
   * Manually trigger connection check
   */
  async checkConnection(): Promise<boolean> {
    try {
      const start = Date.now();
      const { error } = await this.supabase.mainClient
        .from("profiles")
        .select("id")
        .limit(1);

      if (error) throw error;

      this.connectionStatus.connected = true;
      this.connectionStatus.lastHeartbeat = new Date();
      this.connectionStatus.latency = Date.now() - start;
      this.connectionStatus.reconnectAttempts = 0;

      return true;
    } catch (error) {
      console.error("Connection check failed:", error);
      this.handleConnectionError();
      return false;
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      await this.checkConnection();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Handle connection errors with exponential backoff
   */
  private handleConnectionError(): void {
    this.connectionStatus.connected = false;
    this.connectionStatus.reconnectAttempts++;

    if (this.connectionStatus.reconnectAttempts <= this.maxReconnectAttempts) {
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.connectionStatus.reconnectAttempts - 1),
        this.maxReconnectDelay
      );

      console.log(`🔄 Attempting reconnection ${this.connectionStatus.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

      this.reconnectTimeout = setTimeout(() => {
        this.initializeConnection();
      }, delay);
    } else {
      console.error("❌ Max reconnection attempts reached. Manual reconnection required.");
    }
  }

  /**
   * Update latency measurement
   */
  private updateLatency(): void {
    const now = Date.now();
    const lastHeartbeat = this.connectionStatus.lastHeartbeat.getTime();
    this.connectionStatus.latency = now - lastHeartbeat;
  }

  /**
   * Force reconnection (useful for manual retry)
   */
  async forceReconnect(): Promise<void> {
    this.connectionStatus.reconnectAttempts = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    await this.initializeConnection();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.unsubscribeAll();
    console.log("🧹 Real-time service destroyed");
  }

  /**
   * Broadcast a custom event to other connected clients
   */
  async broadcastEvent(
    channel: string,
    event: string,
    payload: any
  ): Promise<void> {
    try {
      await this.supabase.mainClient.channel(channel).send({
        type: "broadcast",
        event,
        payload,
      });
    } catch (error) {
      console.error("Failed to broadcast event:", error);
      throw error;
    }
  }

  /**
   * Subscribe to broadcast events
   */
  subscribeToBroadcast(
    channel: string,
    event: string,
    callback: (payload: any) => void
  ): string {
    const subscriptionId = crypto.randomUUID();
    
    const channelSubscription = this.supabase.mainClient
      .channel(channel)
      .on("broadcast", { event }, callback)
      .subscribe();

    // Store broadcast subscription
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      table: "broadcast",
      callback: () => callback,
      unsubscribe: () => channelSubscription.unsubscribe(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscriptionId;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// React hook for easy subscription management
export function useRealtimeSubscription<T extends keyof Tables>(
  table: T,
  callback: (event: RealtimeEventPayload) => void,
  filter?: Record<string, any>,
  enabled: boolean = true
): {
  subscriptionId: string | null;
  connectionStatus: ConnectionStatus;
} {
  const [subscriptionId, setSubscriptionId] = React.useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>(
    realtimeService.getConnectionStatus()
  );

  React.useEffect(() => {
    if (!enabled) return;

    const id = realtimeService.subscribeToTable(table, callback, filter);
    setSubscriptionId(id);

    // Update connection status
    const updateStatus = () => {
      setConnectionStatus(realtimeService.getConnectionStatus());
    };

    const statusInterval = setInterval(updateStatus, 5000);

    return () => {
      realtimeService.unsubscribe(id);
      clearInterval(statusInterval);
    };
  }, [table, enabled, filter]);

  return {
    subscriptionId,
    connectionStatus,
  };
}

// Export React for the hook
import * as React from 'react';