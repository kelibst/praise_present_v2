import { RenderingEngine } from '../core/RenderingEngine';

/**
 * Centralized resource management for rendering system
 * Prevents memory leaks by tracking and properly disposing resources
 */
export class ResourceManager {
  private static instance: ResourceManager;

  private engines = new Map<string, RenderingEngine>();
  private cleanupTasks = new Set<() => void>();
  private observers = new Map<string, ResizeObserver>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private timeouts = new Map<string, NodeJS.Timeout>();

  private constructor() {}

  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  /**
   * Registers a RenderingEngine for cleanup
   */
  public registerEngine(id: string, engine: RenderingEngine): void {
    // Clean up existing engine with same ID
    if (this.engines.has(id)) {
      console.warn(`ResourceManager: Replacing existing engine with id: ${id}`);
      this.engines.get(id)?.dispose();
    }

    this.engines.set(id, engine);
    console.log(`ResourceManager: Registered engine ${id}. Total engines: ${this.engines.size}`);
  }

  /**
   * Creates a debounced ResizeObserver for dimension watching with enhanced cleanup
   */
  public createDimensionWatcher(
    id: string,
    element: Element,
    callback: (entries: ResizeObserverEntry[]) => void,
    debounceMs: number = 500
  ): void {
    // Clean up existing observer
    this.cleanupObserver(id);

    let timeoutId: NodeJS.Timeout;
    let isDisposed = false;

    const debouncedCallback = (entries: ResizeObserverEntry[]) => {
      if (isDisposed) return; // Prevent callbacks after disposal

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!isDisposed) {
          callback(entries);
        }
      }, debounceMs);
    };

    const observer = new ResizeObserver(debouncedCallback);

    try {
      observer.observe(element);
      this.observers.set(id, observer);

      // Store enhanced cleanup timeout reference with disposal flag
      const cleanup = () => {
        isDisposed = true;
        if (timeoutId) clearTimeout(timeoutId);
      };
      this.addCleanupTask(cleanup);

      console.log(`ResourceManager: Created dimension watcher ${id} with ${debounceMs}ms debounce`);
    } catch (error) {
      console.error(`ResourceManager: Failed to create dimension watcher ${id}:`, error);
      isDisposed = true;
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Creates a smart dimension watcher that automatically adjusts debounce based on change frequency
   */
  public createSmartDimensionWatcher(
    id: string,
    element: Element,
    callback: (entries: ResizeObserverEntry[]) => void,
    options: {
      minDebounceMs?: number;
      maxDebounceMs?: number;
      adaptiveThreshold?: number;
    } = {}
  ): void {
    const {
      minDebounceMs = 100,
      maxDebounceMs = 1000,
      adaptiveThreshold = 5
    } = options;

    let changeCount = 0;
    let lastChangeTime = Date.now();
    let currentDebounce = Math.min(500, maxDebounceMs);

    const adaptiveCallback = (entries: ResizeObserverEntry[]) => {
      const now = Date.now();
      const timeSinceLastChange = now - lastChangeTime;

      changeCount++;
      lastChangeTime = now;

      // Adjust debounce based on change frequency
      if (timeSinceLastChange < 200 && changeCount > adaptiveThreshold) {
        // Rapid changes detected, increase debounce
        currentDebounce = Math.min(currentDebounce * 1.5, maxDebounceMs);
      } else if (timeSinceLastChange > 1000) {
        // Slow changes, reduce debounce for responsiveness
        currentDebounce = Math.max(currentDebounce * 0.8, minDebounceMs);
        changeCount = 0; // Reset counter
      }

      callback(entries);
    };

    this.createDimensionWatcher(id, element, adaptiveCallback, currentDebounce);
    console.log(`ResourceManager: Created smart dimension watcher ${id} (adaptive: ${minDebounceMs}-${maxDebounceMs}ms)`);
  }

  /**
   * Creates a managed interval
   */
  public createInterval(id: string, callback: () => void, intervalMs: number): void {
    this.cleanupInterval(id);

    const interval = setInterval(callback, intervalMs);
    this.intervals.set(id, interval);

    console.log(`ResourceManager: Created interval ${id} with ${intervalMs}ms`);
  }

  /**
   * Creates a managed timeout
   */
  public createTimeout(id: string, callback: () => void, timeoutMs: number): void {
    this.cleanupTimeout(id);

    const timeout = setTimeout(() => {
      callback();
      this.timeouts.delete(id); // Auto-remove after execution
    }, timeoutMs);

    this.timeouts.set(id, timeout);

    console.log(`ResourceManager: Created timeout ${id} with ${timeoutMs}ms`);
  }

  /**
   * Adds a generic cleanup task
   */
  public addCleanupTask(task: () => void): void {
    this.cleanupTasks.add(task);
  }

  /**
   * Removes a generic cleanup task
   */
  public removeCleanupTask(task: () => void): void {
    this.cleanupTasks.delete(task);
  }

  /**
   * Cleans up resources for a specific ID
   */
  public cleanup(id?: string): void {
    if (id) {
      // Clean up specific resource
      this.cleanupEngine(id);
      this.cleanupObserver(id);
      this.cleanupInterval(id);
      this.cleanupTimeout(id);
    } else {
      // Clean up all resources
      this.cleanupAllEngines();
      this.cleanupAllObservers();
      this.cleanupAllIntervals();
      this.cleanupAllTimeouts();
      this.executeCleanupTasks();
    }
  }

  /**
   * Gets resource usage statistics
   */
  public getStats(): {
    engines: number;
    observers: number;
    intervals: number;
    timeouts: number;
    cleanupTasks: number;
  } {
    return {
      engines: this.engines.size,
      observers: this.observers.size,
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
      cleanupTasks: this.cleanupTasks.size
    };
  }

  /**
   * Logs current resource usage (for debugging)
   */
  public logStats(): void {
    const stats = this.getStats();
    console.log('ResourceManager Stats:', stats);

    if (stats.engines > 5) {
      console.warn('ResourceManager: High number of engines, potential memory leak');
    }
    if (stats.observers > 10) {
      console.warn('ResourceManager: High number of observers, potential memory leak');
    }
    if (stats.intervals > 20) {
      console.warn('ResourceManager: High number of intervals, potential performance issue');
    }
    if (stats.cleanupTasks > 50) {
      console.warn('ResourceManager: High number of cleanup tasks, consider batch cleanup');
    }
  }

  /**
   * Performs automatic memory cleanup based on resource usage
   */
  public performMaintenanceCleanup(): void {
    const stats = this.getStats();

    console.log('ResourceManager: Starting maintenance cleanup', stats);

    // Clean up any stale resources
    let cleanedUp = 0;

    // Force garbage collection if available (development only)
    if (typeof window !== 'undefined' && (window as any).gc && process.env.NODE_ENV === 'development') {
      try {
        (window as any).gc();
        console.log('ResourceManager: Forced garbage collection');
      } catch (e) {
        // gc not available
      }
    }

    // Log memory usage if available
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory;
      console.log('ResourceManager: Memory usage', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
      });
    }

    const finalStats = this.getStats();
    console.log(`ResourceManager: Maintenance cleanup completed. Resources: ${stats.engines + stats.observers + stats.intervals + stats.timeouts} → ${finalStats.engines + finalStats.observers + finalStats.intervals + finalStats.timeouts}`);
  }

  /**
   * Schedules periodic maintenance cleanup
   */
  public startMaintenanceSchedule(intervalMs: number = 300000): void { // Default: 5 minutes
    const maintenanceId = 'resource-maintenance';
    this.createInterval(maintenanceId, () => {
      this.performMaintenanceCleanup();
    }, intervalMs);

    console.log(`ResourceManager: Started maintenance schedule every ${intervalMs / 1000}s`);
  }

  /**
   * Stops maintenance schedule
   */
  public stopMaintenanceSchedule(): void {
    this.cleanupInterval('resource-maintenance');
    console.log('ResourceManager: Stopped maintenance schedule');
  }

  // Private cleanup methods
  private cleanupEngine(id: string): void {
    const engine = this.engines.get(id);
    if (engine) {
      engine.dispose();
      this.engines.delete(id);
      console.log(`ResourceManager: Disposed engine ${id}`);
    }
  }

  private cleanupObserver(id: string): void {
    const observer = this.observers.get(id);
    if (observer) {
      observer.disconnect();
      this.observers.delete(id);
      console.log(`ResourceManager: Disconnected observer ${id}`);
    }
  }

  private cleanupInterval(id: string): void {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
      console.log(`ResourceManager: Cleared interval ${id}`);
    }
  }

  private cleanupTimeout(id: string): void {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
      console.log(`ResourceManager: Cleared timeout ${id}`);
    }
  }

  private cleanupAllEngines(): void {
    this.engines.forEach((engine, id) => {
      engine.dispose();
      console.log(`ResourceManager: Disposed engine ${id}`);
    });
    this.engines.clear();
  }

  private cleanupAllObservers(): void {
    this.observers.forEach((observer, id) => {
      observer.disconnect();
      console.log(`ResourceManager: Disconnected observer ${id}`);
    });
    this.observers.clear();
  }

  private cleanupAllIntervals(): void {
    this.intervals.forEach((interval, id) => {
      clearInterval(interval);
      console.log(`ResourceManager: Cleared interval ${id}`);
    });
    this.intervals.clear();
  }

  private cleanupAllTimeouts(): void {
    this.timeouts.forEach((timeout, id) => {
      clearTimeout(timeout);
      console.log(`ResourceManager: Cleared timeout ${id}`);
    });
    this.timeouts.clear();
  }

  private executeCleanupTasks(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('ResourceManager: Error in cleanup task:', error);
      }
    });
    this.cleanupTasks.clear();
  }
}

/**
 * Hook for React components to ensure resource cleanup on unmount
 */
export function useResourceCleanup(resourceId: string) {
  const manager = ResourceManager.getInstance();

  return {
    manager,
    cleanup: () => manager.cleanup(resourceId)
  };
}

// Utility for debugging memory leaks
if (typeof window !== 'undefined') {
  (window as any).debugResourceManager = () => {
    ResourceManager.getInstance().logStats();
  };
}