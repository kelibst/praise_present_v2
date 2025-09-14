import { GeneratedSlide } from '../SlideGenerator';
import { ResponsiveControlConfig } from '../../components/controls/ResponsiveControlPanel';

/**
 * Sync event types for different operations
 */
export enum SyncEventType {
  SLIDE_UPDATED = 'slide-updated',
  TEXT_EDITED = 'text-edited',
  LAYOUT_CHANGED = 'layout-changed',
  CONFIG_UPDATED = 'config-updated',
  POSITION_CHANGED = 'position-changed',
  STYLE_CHANGED = 'style-changed',
  SHAPE_ADDED = 'shape-added',
  SHAPE_REMOVED = 'shape-removed',
  RESPONSIVE_UPDATED = 'responsive-updated'
}

/**
 * Base sync event interface
 */
export interface BaseSyncEvent {
  type: SyncEventType;
  timestamp: number;
  source: 'preview' | 'live' | 'controls';
  slideId?: string;
  shapeId?: string;
}

/**
 * Specific sync event types
 */
export interface SlideUpdatedEvent extends BaseSyncEvent {
  type: SyncEventType.SLIDE_UPDATED;
  slide: GeneratedSlide;
  reason: 'content-change' | 'layout-change' | 'config-change' | 'manual';
}

export interface TextEditedEvent extends BaseSyncEvent {
  type: SyncEventType.TEXT_EDITED;
  shapeId: string;
  newText: string;
  oldText: string;
  position?: { x: number; y: number };
}

export interface LayoutChangedEvent extends BaseSyncEvent {
  type: SyncEventType.LAYOUT_CHANGED;
  layoutMode: string;
  layoutConfig: any;
  affectedShapes: string[];
}

export interface ConfigUpdatedEvent extends BaseSyncEvent {
  type: SyncEventType.CONFIG_UPDATED;
  config: ResponsiveControlConfig;
  changedSection: keyof ResponsiveControlConfig;
  changedKeys: string[];
}

export interface ResponsiveUpdatedEvent extends BaseSyncEvent {
  type: SyncEventType.RESPONSIVE_UPDATED;
  shapeId: string;
  responsiveMetrics: {
    fontSize: number;
    lineHeight: number;
    scaleFactor: number;
    reason: string[];
  };
}

export type SyncEvent =
  | SlideUpdatedEvent
  | TextEditedEvent
  | LayoutChangedEvent
  | ConfigUpdatedEvent
  | ResponsiveUpdatedEvent;

/**
 * Sync listener function type
 */
export type SyncEventListener = (event: SyncEvent) => void;

/**
 * Sync manager options
 */
export interface SyncManagerOptions {
  debounceMs?: number;
  maxQueueSize?: number;
  enableBatching?: boolean;
  batchTimeoutMs?: number;
  retryAttempts?: number;
  enableLogging?: boolean;
}

/**
 * Synchronization statistics
 */
export interface SyncStats {
  totalEvents: number;
  eventsByType: Record<SyncEventType, number>;
  averageLatency: number;
  failedSyncs: number;
  lastSyncTime: number;
  queueSize: number;
  batchesSent: number;
}

/**
 * Real-time preview synchronization manager
 * Handles bidirectional sync between preview and live display
 */
export class PreviewSyncManager {
  private static instance: PreviewSyncManager | null = null;

  private listeners: Map<SyncEventType, Set<SyncEventListener>> = new Map();
  private allListeners: Set<SyncEventListener> = new Set();
  private eventQueue: SyncEvent[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private stats: SyncStats;
  private options: Required<SyncManagerOptions>;

  // Debouncing state
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastEventByKey: Map<string, SyncEvent> = new Map();

  private constructor(options: SyncManagerOptions = {}) {
    this.options = {
      debounceMs: options.debounceMs ?? 100,
      maxQueueSize: options.maxQueueSize ?? 1000,
      enableBatching: options.enableBatching ?? true,
      batchTimeoutMs: options.batchTimeoutMs ?? 50,
      retryAttempts: options.retryAttempts ?? 3,
      enableLogging: options.enableLogging ?? true
    };

    this.stats = {
      totalEvents: 0,
      eventsByType: {} as Record<SyncEventType, number>,
      averageLatency: 0,
      failedSyncs: 0,
      lastSyncTime: 0,
      queueSize: 0,
      batchesSent: 0
    };

    // Initialize event counters
    Object.values(SyncEventType).forEach(type => {
      this.stats.eventsByType[type] = 0;
    });

    if (this.options.enableLogging) {
      console.log('🔄 PreviewSyncManager: Initialized', {
        options: this.options
      });
    }
  }

  /**
   * Get or create singleton instance
   */
  public static getInstance(options?: SyncManagerOptions): PreviewSyncManager {
    if (!PreviewSyncManager.instance) {
      PreviewSyncManager.instance = new PreviewSyncManager(options);
    }
    return PreviewSyncManager.instance;
  }

  /**
   * Subscribe to specific event types
   */
  public subscribe(eventType: SyncEventType, listener: SyncEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    if (this.options.enableLogging) {
      console.log(`🔄 PreviewSyncManager: Subscribed to ${eventType}. Total listeners: ${this.listeners.get(eventType)!.size}`);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener);
      if (this.listeners.get(eventType)?.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  /**
   * Subscribe to all events
   */
  public subscribeAll(listener: SyncEventListener): () => void {
    this.allListeners.add(listener);

    if (this.options.enableLogging) {
      console.log(`🔄 PreviewSyncManager: Subscribed to all events. Total listeners: ${this.allListeners.size}`);
    }

    return () => {
      this.allListeners.delete(listener);
    };
  }

  /**
   * Emit a sync event
   */
  public emit(event: Omit<SyncEvent, 'timestamp'>): void {
    const fullEvent: SyncEvent = {
      ...event,
      timestamp: Date.now()
    } as SyncEvent;

    this.stats.totalEvents++;
    this.stats.eventsByType[event.type]++;
    this.stats.lastSyncTime = fullEvent.timestamp;

    // Handle debouncing for rapid events
    const debounceKey = this.createDebounceKey(fullEvent);
    if (debounceKey && this.options.debounceMs > 0) {
      this.handleDebouncedEvent(fullEvent, debounceKey);
    } else {
      this.processEvent(fullEvent);
    }
  }

  /**
   * Handle debounced events
   */
  private handleDebouncedEvent(event: SyncEvent, debounceKey: string): void {
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Store latest event
    this.lastEventByKey.set(debounceKey, event);

    // Set new timer
    const timer = setTimeout(() => {
      const latestEvent = this.lastEventByKey.get(debounceKey);
      if (latestEvent) {
        this.processEvent(latestEvent);
        this.lastEventByKey.delete(debounceKey);
      }
      this.debounceTimers.delete(debounceKey);
    }, this.options.debounceMs);

    this.debounceTimers.set(debounceKey, timer);
  }

  /**
   * Process event (with optional batching)
   */
  private processEvent(event: SyncEvent): void {
    if (this.options.enableBatching) {
      this.addToQueue(event);
    } else {
      this.dispatchEvent(event);
    }
  }

  /**
   * Add event to batch queue
   */
  private addToQueue(event: SyncEvent): void {
    if (this.eventQueue.length >= this.options.maxQueueSize) {
      this.stats.failedSyncs++;
      console.warn('PreviewSyncManager: Event queue full, dropping event', event.type);
      return;
    }

    this.eventQueue.push(event);
    this.stats.queueSize = this.eventQueue.length;

    // Set batch timeout if not already set
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flushQueue();
      }, this.options.batchTimeoutMs);
    }
  }

  /**
   * Flush event queue
   */
  private flushQueue(): void {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue.length = 0;
    this.stats.queueSize = 0;
    this.stats.batchesSent++;

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // Process events in batch
    for (const event of events) {
      this.dispatchEvent(event);
    }

    if (this.options.enableLogging && events.length > 1) {
      console.log(`🔄 PreviewSyncManager: Processed batch of ${events.length} events`);
    }
  }

  /**
   * Dispatch event to listeners
   */
  private dispatchEvent(event: SyncEvent): void {
    const startTime = performance.now();

    try {
      // Dispatch to specific event type listeners
      const typeListeners = this.listeners.get(event.type);
      if (typeListeners) {
        typeListeners.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            console.error(`PreviewSyncManager: Error in ${event.type} listener:`, error);
            this.stats.failedSyncs++;
          }
        });
      }

      // Dispatch to all-event listeners
      this.allListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('PreviewSyncManager: Error in all-events listener:', error);
          this.stats.failedSyncs++;
        }
      });

      // Update latency stats
      const latency = performance.now() - startTime;
      this.stats.averageLatency = (this.stats.averageLatency + latency) / 2;

      if (this.options.enableLogging) {
        console.log(`🔄 PreviewSyncManager: Dispatched ${event.type} (${latency.toFixed(2)}ms)`, {
          source: event.source,
          slideId: event.slideId,
          shapeId: event.shapeId
        });
      }

    } catch (error) {
      console.error('PreviewSyncManager: Critical error dispatching event:', error);
      this.stats.failedSyncs++;
    }
  }

  /**
   * Create debounce key for event
   */
  private createDebounceKey(event: SyncEvent): string | null {
    switch (event.type) {
      case SyncEventType.TEXT_EDITED:
        return `text-${event.shapeId}`;
      case SyncEventType.POSITION_CHANGED:
        return `position-${event.shapeId}`;
      case SyncEventType.CONFIG_UPDATED:
        return `config-${(event as ConfigUpdatedEvent).changedSection}`;
      case SyncEventType.RESPONSIVE_UPDATED:
        return `responsive-${event.shapeId}`;
      default:
        return null; // No debouncing for other event types
    }
  }

  /**
   * Clear all event listeners and reset
   */
  public reset(): void {
    this.listeners.clear();
    this.allListeners.clear();
    this.eventQueue.length = 0;
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.lastEventByKey.clear();

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // Reset stats
    this.stats = {
      totalEvents: 0,
      eventsByType: {} as Record<SyncEventType, number>,
      averageLatency: 0,
      failedSyncs: 0,
      lastSyncTime: 0,
      queueSize: 0,
      batchesSent: 0
    };

    Object.values(SyncEventType).forEach(type => {
      this.stats.eventsByType[type] = 0;
    });

    if (this.options.enableLogging) {
      console.log('🔄 PreviewSyncManager: Reset completed');
    }
  }

  /**
   * Get synchronization statistics
   */
  public getStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * Get current configuration
   */
  public getOptions(): Required<SyncManagerOptions> {
    return { ...this.options };
  }

  /**
   * Update configuration
   */
  public updateOptions(newOptions: Partial<SyncManagerOptions>): void {
    this.options = { ...this.options, ...newOptions };

    if (this.options.enableLogging) {
      console.log('🔄 PreviewSyncManager: Options updated', newOptions);
    }
  }

  /**
   * Manually flush any pending events
   */
  public flush(): void {
    // Flush any debounced events
    this.debounceTimers.forEach((timer, key) => {
      clearTimeout(timer);
      const event = this.lastEventByKey.get(key);
      if (event) {
        this.processEvent(event);
      }
    });
    this.debounceTimers.clear();
    this.lastEventByKey.clear();

    // Flush queue
    this.flushQueue();
  }

  /**
   * Check if sync manager is active
   */
  public isActive(): boolean {
    return this.listeners.size > 0 || this.allListeners.size > 0;
  }

  /**
   * Dispose of sync manager
   */
  public dispose(): void {
    this.flush();
    this.reset();
    PreviewSyncManager.instance = null;

    if (this.options.enableLogging) {
      console.log('🔄 PreviewSyncManager: Disposed');
    }
  }
}

/**
 * Convenience functions for common sync operations
 */

/**
 * Emit slide updated event
 */
export function emitSlideUpdated(
  slide: GeneratedSlide,
  source: 'preview' | 'live' | 'controls',
  reason: 'content-change' | 'layout-change' | 'config-change' | 'manual' = 'content-change'
): void {
  PreviewSyncManager.getInstance().emit({
    type: SyncEventType.SLIDE_UPDATED,
    source,
    slideId: slide.id,
    slide,
    reason
  });
}

/**
 * Emit text edited event
 */
export function emitTextEdited(
  shapeId: string,
  newText: string,
  oldText: string,
  source: 'preview' | 'live' | 'controls',
  position?: { x: number; y: number }
): void {
  PreviewSyncManager.getInstance().emit({
    type: SyncEventType.TEXT_EDITED,
    source,
    shapeId,
    newText,
    oldText,
    position
  });
}

/**
 * Emit config updated event
 */
export function emitConfigUpdated(
  config: ResponsiveControlConfig,
  changedSection: keyof ResponsiveControlConfig,
  changedKeys: string[],
  source: 'preview' | 'live' | 'controls' = 'controls'
): void {
  PreviewSyncManager.getInstance().emit({
    type: SyncEventType.CONFIG_UPDATED,
    source,
    config,
    changedSection,
    changedKeys
  });
}

/**
 * Emit responsive updated event
 */
export function emitResponsiveUpdated(
  shapeId: string,
  metrics: ResponsiveUpdatedEvent['responsiveMetrics'],
  source: 'preview' | 'live' | 'controls' = 'preview'
): void {
  PreviewSyncManager.getInstance().emit({
    type: SyncEventType.RESPONSIVE_UPDATED,
    source,
    shapeId,
    responsiveMetrics: metrics
  });
}