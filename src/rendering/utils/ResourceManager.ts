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
   * Creates a debounced ResizeObserver for dimension watching
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
    const debouncedCallback = (entries: ResizeObserverEntry[]) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(entries), debounceMs);
    };

    const observer = new ResizeObserver(debouncedCallback);
    observer.observe(element);

    this.observers.set(id, observer);

    // Store cleanup timeout reference
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
    this.addCleanupTask(cleanup);

    console.log(`ResourceManager: Created dimension watcher ${id}`);
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