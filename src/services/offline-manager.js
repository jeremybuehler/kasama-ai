/**
 * Offline Manager Service - MVP Implementation
 * Handles offline functionality, data caching, and sync when online
 */

class OfflineManagerService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingSync = [];
    this.offlineQueue = "kasama_offline_queue";
    this.lastSyncTime = "kasama_last_sync";

    // Setup online/offline event listeners
    this.setupEventListeners();

    // Initialize offline capabilities
    this.initialize();
  }

  /**
   * Initialize offline manager
   */
  initialize() {
    // Service worker registration disabled until sw.js is created
    console.log(
      "Offline manager initialized - service worker registration skipped",
    );
    this.setupBackgroundSync();
    this.checkPendingSync();
  }

  /**
   * Register service worker for offline capabilities
   */
  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered:", registration);

        // Listen for service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New service worker available, could show update notification
                this.notifyAppUpdate();
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    }
  }

  /**
   * Setup background sync for when connection is restored
   */
  setupBackgroundSync() {
    if (
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype
    ) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register sync events
        this.registration = registration;
        console.log("Background sync available");
      });
    }
  }

  /**
   * Setup online/offline event listeners
   */
  setupEventListeners() {
    window.addEventListener("online", () => {
      console.log("Connection restored");
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener("offline", () => {
      console.log("Connection lost");
      this.isOnline = false;
      this.handleOffline();
    });

    // Listen for visibility change to sync when app becomes active
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.isOnline) {
        this.syncWhenActive();
      }
    });
  }

  /**
   * Handle when connection is restored
   */
  async handleOnline() {
    // Show online notification
    this.showConnectionStatus("online");

    // Attempt to sync pending data
    await this.syncPendingData();

    // Update UI state
    this.notifyOnlineStatus(true);
  }

  /**
   * Handle when connection is lost
   */
  handleOffline() {
    // Show offline notification
    this.showConnectionStatus("offline");

    // Update UI state
    this.notifyOnlineStatus(false);
  }

  /**
   * Queue data for sync when online
   */
  queueForSync(data, endpoint, method = "POST") {
    const syncItem = {
      id: Date.now() + Math.random(),
      data,
      endpoint,
      method,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.pendingSync.push(syncItem);
    this.savePendingSync();

    // Try to trigger background sync if available
    this.triggerBackgroundSync();

    console.log("Data queued for sync:", syncItem);
    return syncItem.id;
  }

  /**
   * Sync pending data when online
   */
  async syncPendingData() {
    if (!this.isOnline || this.pendingSync.length === 0) {
      return;
    }

    console.log(`Syncing ${this.pendingSync.length} pending items`);

    const failedSyncs = [];

    for (const item of this.pendingSync) {
      try {
        await this.syncItem(item);
        console.log("Synced item:", item.id);
      } catch (error) {
        console.error("Failed to sync item:", item.id, error);
        item.retryCount++;

        // Keep items with failed sync for retry (max 3 attempts)
        if (item.retryCount < 3) {
          failedSyncs.push(item);
        }
      }
    }

    // Update pending sync queue
    this.pendingSync = failedSyncs;
    this.savePendingSync();

    // Update last sync time
    localStorage.setItem(this.lastSyncTime, new Date().toISOString());

    // Notify successful sync
    if (failedSyncs.length === 0) {
      this.showSyncSuccess();
    }
  }

  /**
   * Sync individual item
   */
  async syncItem(item) {
    const response = await fetch(item.endpoint, {
      method: item.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item.data),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Trigger background sync
   */
  async triggerBackgroundSync() {
    if (
      this.registration &&
      "sync" in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        await this.registration.sync.register("kasama-sync");
        console.log("Background sync registered");
      } catch (error) {
        console.error("Background sync registration failed:", error);
      }
    }
  }

  /**
   * Cache data for offline access
   */
  cacheData(key, data, expiryMinutes = 60) {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiryMinutes * 60 * 1000,
    };

    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error("Error caching data:", error);
    }
  }

  /**
   * Get cached data
   */
  getCachedData(key) {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);

      // Check if cache has expired
      if (Date.now() > cacheItem.expiry) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error("Error getting cached data:", error);
      return null;
    }
  }

  /**
   * Store activity completion offline
   */
  storeActivityOffline(activityData) {
    // Add to local progress tracking
    const progressUpdate = this.updateLocalProgress(activityData);

    // Queue for sync when online
    if (!this.isOnline) {
      this.queueForSync(activityData, "/api/activities", "POST");
    }

    return progressUpdate;
  }

  /**
   * Store assessment results offline
   */
  storeAssessmentOffline(assessmentData) {
    // Store locally
    localStorage.setItem("assessmentResults", JSON.stringify(assessmentData));

    // Queue for sync when online
    if (!this.isOnline) {
      this.queueForSync(assessmentData, "/api/assessments", "POST");
    }

    return assessmentData;
  }

  /**
   * Update local progress data
   */
  updateLocalProgress(activityData) {
    try {
      const progressData = JSON.parse(
        localStorage.getItem("kasama_progress_data") || "{}",
      );

      // Update activity count
      progressData.totalActivitiesCompleted =
        (progressData.totalActivitiesCompleted || 0) + 1;

      // Update category progress
      if (!progressData.categoryProgress) {
        progressData.categoryProgress = {};
      }

      const category = activityData.category || "general";
      if (!progressData.categoryProgress[category]) {
        progressData.categoryProgress[category] = { completed: 0, total: 20 };
      }

      progressData.categoryProgress[category].completed++;

      // Update activity history
      if (!progressData.activityHistory) {
        progressData.activityHistory = [];
      }

      progressData.activityHistory.unshift({
        ...activityData,
        completedAt: new Date().toISOString(),
        syncStatus: this.isOnline ? "synced" : "pending",
      });

      // Keep only last 100 activities
      if (progressData.activityHistory.length > 100) {
        progressData.activityHistory = progressData.activityHistory.slice(
          0,
          100,
        );
      }

      localStorage.setItem(
        "kasama_progress_data",
        JSON.stringify(progressData),
      );
      return progressData;
    } catch (error) {
      console.error("Error updating local progress:", error);
      return null;
    }
  }

  /**
   * Get offline status
   */
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      pendingSyncCount: this.pendingSync.length,
      lastSyncTime: localStorage.getItem(this.lastSyncTime),
      hasServiceWorker: "serviceWorker" in navigator,
      hasCachedData: this.hasCachedData(),
    };
  }

  /**
   * Check if app has cached data
   */
  hasCachedData() {
    const keys = Object.keys(localStorage);
    return keys.some(
      (key) =>
        key.startsWith("cache_") ||
        key.includes("kasama_") ||
        key.includes("assessmentResults"),
    );
  }

  /**
   * Save pending sync items to localStorage
   */
  savePendingSync() {
    try {
      localStorage.setItem(this.offlineQueue, JSON.stringify(this.pendingSync));
    } catch (error) {
      console.error("Error saving pending sync:", error);
    }
  }

  /**
   * Load pending sync items from localStorage
   */
  loadPendingSync() {
    try {
      const pending = localStorage.getItem(this.offlineQueue);
      this.pendingSync = pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error("Error loading pending sync:", error);
      this.pendingSync = [];
    }
  }

  /**
   * Check for pending sync on initialization
   */
  checkPendingSync() {
    this.loadPendingSync();

    if (this.isOnline && this.pendingSync.length > 0) {
      // Delay sync slightly to allow app to fully load
      setTimeout(() => this.syncPendingData(), 2000);
    }
  }

  /**
   * Sync when app becomes active
   */
  async syncWhenActive() {
    const lastSync = localStorage.getItem(this.lastSyncTime);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // Only sync if last sync was more than 5 minutes ago
    if (!lastSync || now - new Date(lastSync).getTime() > fiveMinutes) {
      await this.syncPendingData();
    }
  }

  /**
   * Show connection status notification
   */
  showConnectionStatus(status) {
    // Create a simple toast notification
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 ${
      status === "online" ? "bg-green-500" : "bg-orange-500"
    }`;
    toast.textContent = status === "online" ? "Back online" : "You're offline";

    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  /**
   * Show sync success notification
   */
  showSyncSuccess() {
    console.log("All data synced successfully");
    // Could show a success notification here
  }

  /**
   * Notify app about online status change
   */
  notifyOnlineStatus(isOnline) {
    // Dispatch custom event for app to listen to
    window.dispatchEvent(
      new CustomEvent("connectionchange", {
        detail: { isOnline, pendingSyncCount: this.pendingSync.length },
      }),
    );
  }

  /**
   * Notify about app update
   */
  notifyAppUpdate() {
    console.log("App update available");
    // Could show update notification here
  }

  /**
   * Clear all offline data (use with caution)
   */
  clearOfflineData() {
    // Clear pending sync
    this.pendingSync = [];
    localStorage.removeItem(this.offlineQueue);

    // Clear cached data
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("cache_")) {
        localStorage.removeItem(key);
      }
    });

    console.log("Offline data cleared");
  }

  /**
   * Get cache usage statistics
   */
  getCacheStats() {
    const cacheKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith("cache_"),
    );
    const totalSize = cacheKeys.reduce((size, key) => {
      return size + localStorage.getItem(key).length;
    }, 0);

    return {
      cacheCount: cacheKeys.length,
      totalSizeKB: Math.round(totalSize / 1024),
      pendingSyncCount: this.pendingSync.length,
    };
  }
}

export default new OfflineManagerService();
