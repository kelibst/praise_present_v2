import { GeneratedSlide } from '../SlideGenerator';

/**
 * Types of updates that can be batched
 */
export enum UpdateType {
  CONTENT_CHANGE = 'content-change',
  TEXT_EDIT = 'text-edit',
  PROPERTY_CHANGE = 'property-change',
  LAYOUT_CHANGE = 'layout-change',
  RESPONSIVE_CONFIG = 'responsive-config'
}

/**
 * Priority levels for updates
 */
export enum UpdatePriority {
  IMMEDIATE = 0,    // Process immediately
  HIGH = 1,         // Process within 16ms (next frame)
  MEDIUM = 2,       // Process within 50ms
  LOW = 3,          // Process within 200ms
  BACKGROUND = 4    // Process when idle
}

/**
 * Individual update request
 */
export interface UpdateRequest {
  id: string;
  type: UpdateType;
  priority: UpdatePriority;
  viewportId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  dependencies?: string[]; // Other update IDs this depends on
}

/**
 * Batch update configuration
 */
export interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  priorityThresholds: Record<UpdatePriority, number>;
  enableCoalescing: boolean;
  enableDependencyResolution: boolean;
}

/**
 * Update callback function type
 */
export type UpdateCallback = (updates: UpdateRequest[]) => Promise<boolean>;

/**
 * Performance metrics for batch processing
 */
export interface BatchMetrics {
  totalUpdates: number;
  batchesProcessed: number;
  averageBatchSize: number;
  averageProcessingTime: number;
  coalescingHits: number;
  dependencyResolutions: number;
  droppedUpdates: number;
}

/**
 * Intelligent batch update manager that coordinates updates across
 * multiple viewports and components with priority-based scheduling
 * and dependency resolution.
 */
export class BatchUpdateManager {
  private static instance: BatchUpdateManager | null = null;

  private updateQueue: Map<UpdatePriority, UpdateRequest[]> = new Map();
  private pendingUpdates: Map<string, UpdateRequest> = new Map();
  private processors: Map<UpdateType, UpdateCallback> = new Map();
  private config: BatchConfig;
  private metrics: BatchMetrics;

  // Scheduling state
  private scheduleTimers: Map<UpdatePriority, NodeJS.Timeout> = new Map();
  private isProcessing = false;
  private processingPromise: Promise<void> | null = null;

  // Dependency tracking
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private resolvedUpdates: Set<string> = new Set();

  // Coalescing state
  private coalescingKeys: Map<string, string> = new Map(); // key -> updateId

  private constructor(config?: Partial<BatchConfig>) {
    this.config = {
      maxBatchSize: 10,
      maxWaitTime: 100,
      priorityThresholds: {
        [UpdatePriority.IMMEDIATE]: 0,
        [UpdatePriority.HIGH]: 16,
        [UpdatePriority.MEDIUM]: 50,
        [UpdatePriority.LOW]: 200,
        [UpdatePriority.BACKGROUND]: 1000
      },
      enableCoalescing: true,
      enableDependencyResolution: true,
      ...config
    };

    this.metrics = {
      totalUpdates: 0,
      batchesProcessed: 0,
      averageBatchSize: 0,
      averageProcessingTime: 0,
      coalescingHits: 0,
      dependencyResolutions: 0,
      droppedUpdates: 0
    };

    // Initialize priority queues
    Object.values(UpdatePriority).forEach(priority => {
      if (typeof priority === 'number') {
        this.updateQueue.set(priority, []);
      }
    });

    this.setupIdleCallback();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<BatchConfig>): BatchUpdateManager {
    if (!BatchUpdateManager.instance) {
      BatchUpdateManager.instance = new BatchUpdateManager(config);
    }
    return BatchUpdateManager.instance;
  }

  /**
   * Register an update processor for a specific update type
   */
  public registerProcessor(type: UpdateType, callback: UpdateCallback): void {
    this.processors.set(type, callback);
  }

  /**
   * Submit an update request for batched processing
   */
  public submitUpdate(
    updateRequest: Omit<UpdateRequest, 'id' | 'timestamp' | 'retryCount'>
  ): string {
    const id = this.generateUpdateId();
    const fullRequest: UpdateRequest = {
      id,
      timestamp: Date.now(),
      retryCount: 0,
      ...updateRequest
    };

    // Check for coalescing opportunities
    if (this.config.enableCoalescing) {
      const coalescingKey = this.generateCoalescingKey(fullRequest);
      const existingUpdateId = this.coalescingKeys.get(coalescingKey);

      if (existingUpdateId && this.pendingUpdates.has(existingUpdateId)) {
        // Coalesce with existing update
        const existingUpdate = this.pendingUpdates.get(existingUpdateId)!;
        const coalescedUpdate = this.coalesceUpdates(existingUpdate, fullRequest);

        this.pendingUpdates.set(existingUpdateId, coalescedUpdate);
        this.metrics.coalescingHits++;

        console.log(`🔄 BatchUpdateManager: Coalesced update ${id} with ${existingUpdateId}`);
        return existingUpdateId;
      }

      this.coalescingKeys.set(coalescingKey, id);
    }

    // Add to pending updates and priority queue
    this.pendingUpdates.set(id, fullRequest);
    const priorityQueue = this.updateQueue.get(fullRequest.priority)!;
    priorityQueue.push(fullRequest);

    this.metrics.totalUpdates++;

    // Set up dependency tracking
    if (this.config.enableDependencyResolution && fullRequest.dependencies) {
      this.dependencyGraph.set(id, new Set(fullRequest.dependencies));
    }

    // Schedule processing
    this.scheduleProcessing(fullRequest.priority);

    console.log(`📝 BatchUpdateManager: Submitted ${fullRequest.type} update for ${fullRequest.viewportId} (priority: ${fullRequest.priority})`);

    return id;
  }

  /**
   * Cancel a pending update
   */
  public cancelUpdate(updateId: string): boolean {
    const update = this.pendingUpdates.get(updateId);
    if (!update) return false;

    // Remove from pending updates
    this.pendingUpdates.delete(updateId);

    // Remove from priority queue
    const priorityQueue = this.updateQueue.get(update.priority)!;
    const index = priorityQueue.findIndex(u => u.id === updateId);
    if (index !== -1) {
      priorityQueue.splice(index, 1);
    }

    // Clean up dependency tracking
    this.dependencyGraph.delete(updateId);
    this.resolvedUpdates.delete(updateId);

    // Clean up coalescing
    const coalescingKey = this.generateCoalescingKey(update);
    if (this.coalescingKeys.get(coalescingKey) === updateId) {
      this.coalescingKeys.delete(coalescingKey);
    }

    console.log(`❌ BatchUpdateManager: Cancelled update ${updateId}`);
    return true;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): BatchMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all pending updates
   */
  public clearAll(): void {
    this.updateQueue.forEach(queue => queue.length = 0);
    this.pendingUpdates.clear();
    this.dependencyGraph.clear();
    this.resolvedUpdates.clear();
    this.coalescingKeys.clear();

    // Clear all timers
    this.scheduleTimers.forEach(timer => clearTimeout(timer));
    this.scheduleTimers.clear();

    console.log('🧹 BatchUpdateManager: Cleared all pending updates');
  }

  // Private methods

  private generateUpdateId(): string {
    return `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCoalescingKey(update: UpdateRequest): string {
    // Create a key based on update type and target
    return `${update.type}-${update.viewportId}`;
  }

  private coalesceUpdates(existing: UpdateRequest, incoming: UpdateRequest): UpdateRequest {
    // Merge update data based on type
    let mergedData = { ...existing.data };

    switch (existing.type) {
      case UpdateType.TEXT_EDIT:
        // For text edits, use the latest text
        mergedData = { ...mergedData, ...incoming.data };
        break;

      case UpdateType.PROPERTY_CHANGE:
        // For property changes, merge all changed properties
        mergedData = { ...mergedData, ...incoming.data };
        break;

      case UpdateType.RESPONSIVE_CONFIG:
        // For config changes, deep merge configurations
        mergedData = this.deepMerge(mergedData, incoming.data);
        break;

      default:
        // For other types, use incoming data
        mergedData = incoming.data;
    }

    return {
      ...existing,
      data: mergedData,
      timestamp: incoming.timestamp, // Use latest timestamp
      priority: Math.min(existing.priority, incoming.priority) // Use higher priority
    };
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  private scheduleProcessing(priority: UpdatePriority): void {
    // Don't schedule if already processing this priority
    if (this.scheduleTimers.has(priority)) return;

    const threshold = this.config.priorityThresholds[priority];

    if (threshold === 0) {
      // Process immediately
      this.processUpdates(priority);
    } else {
      // Schedule for later
      const timer = setTimeout(() => {
        this.scheduleTimers.delete(priority);
        this.processUpdates(priority);
      }, threshold);

      this.scheduleTimers.set(priority, timer);
    }
  }

  private async processUpdates(priority: UpdatePriority): Promise<void> {
    if (this.isProcessing) {
      // Wait for current processing to complete
      if (this.processingPromise) {
        await this.processingPromise;
      }
      return;
    }

    const startTime = performance.now();
    this.isProcessing = true;

    this.processingPromise = this.performBatchProcessing(priority);
    await this.processingPromise;

    this.isProcessing = false;
    this.processingPromise = null;

    const processingTime = performance.now() - startTime;
    this.updateMetrics(processingTime);
  }

  private async performBatchProcessing(priority: UpdatePriority): Promise<void> {
    const priorityQueue = this.updateQueue.get(priority)!;
    if (priorityQueue.length === 0) return;

    // Get updates to process (up to max batch size)
    const updatesToProcess = priorityQueue.splice(0, this.config.maxBatchSize);
    const readyUpdates: UpdateRequest[] = [];

    // Resolve dependencies if enabled
    if (this.config.enableDependencyResolution) {
      for (const update of updatesToProcess) {
        if (this.areDependenciesResolved(update)) {
          readyUpdates.push(update);
          this.resolvedUpdates.add(update.id);
        } else {
          // Put back in queue for later processing
          priorityQueue.unshift(update);
        }
      }
    } else {
      readyUpdates.push(...updatesToProcess);
    }

    if (readyUpdates.length === 0) return;

    // Group updates by type for efficient processing
    const updatesByType = this.groupUpdatesByType(readyUpdates);

    // Process each group
    for (const [type, updates] of updatesByType.entries()) {
      const processor = this.processors.get(type);
      if (processor) {
        try {
          const success = await processor(updates);
          if (success) {
            // Remove from pending updates
            updates.forEach(update => {
              this.pendingUpdates.delete(update.id);
              this.cleanupCoalescing(update);
            });
          } else {
            // Retry or drop updates
            this.handleFailedUpdates(updates);
          }
        } catch (error) {
          console.error(`BatchUpdateManager: Error processing ${type} updates:`, error);
          this.handleFailedUpdates(updates);
        }
      } else {
        console.warn(`BatchUpdateManager: No processor registered for ${type}`);
        this.metrics.droppedUpdates += updates.length;
      }
    }

    this.metrics.batchesProcessed++;

    console.log(`✅ BatchUpdateManager: Processed batch of ${readyUpdates.length} updates (priority: ${priority})`);
  }

  private areDependenciesResolved(update: UpdateRequest): boolean {
    const dependencies = this.dependencyGraph.get(update.id);
    if (!dependencies || dependencies.size === 0) return true;

    for (const depId of dependencies) {
      if (!this.resolvedUpdates.has(depId)) {
        return false;
      }
    }

    return true;
  }

  private groupUpdatesByType(updates: UpdateRequest[]): Map<UpdateType, UpdateRequest[]> {
    const groups = new Map<UpdateType, UpdateRequest[]>();

    for (const update of updates) {
      if (!groups.has(update.type)) {
        groups.set(update.type, []);
      }
      groups.get(update.type)!.push(update);
    }

    return groups;
  }

  private handleFailedUpdates(updates: UpdateRequest[]): void {
    const maxRetries = 3;

    for (const update of updates) {
      if (update.retryCount < maxRetries) {
        // Retry with exponential backoff
        const delay = Math.pow(2, update.retryCount) * 100;
        update.retryCount++;

        setTimeout(() => {
          const priorityQueue = this.updateQueue.get(update.priority)!;
          priorityQueue.push(update);
          this.scheduleProcessing(update.priority);
        }, delay);

        console.log(`🔄 BatchUpdateManager: Retrying update ${update.id} (attempt ${update.retryCount})`);
      } else {
        // Drop update after max retries
        this.pendingUpdates.delete(update.id);
        this.cleanupCoalescing(update);
        this.metrics.droppedUpdates++;

        console.warn(`❌ BatchUpdateManager: Dropped update ${update.id} after ${maxRetries} failed attempts`);
      }
    }
  }

  private cleanupCoalescing(update: UpdateRequest): void {
    const coalescingKey = this.generateCoalescingKey(update);
    if (this.coalescingKeys.get(coalescingKey) === update.id) {
      this.coalescingKeys.delete(coalescingKey);
    }
  }

  private updateMetrics(processingTime: number): void {
    // Update rolling averages
    const totalBatches = this.metrics.batchesProcessed;
    this.metrics.averageProcessingTime =
      (this.metrics.averageProcessingTime * (totalBatches - 1) + processingTime) / totalBatches;
  }

  private setupIdleCallback(): void {
    // Use requestIdleCallback if available, fallback to setTimeout
    const scheduleIdle = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback);
      } else {
        setTimeout(callback, 0);
      }
    };

    const processBackgroundUpdates = () => {
      if (!this.isProcessing) {
        this.processUpdates(UpdatePriority.BACKGROUND);
      }

      scheduleIdle(processBackgroundUpdates);
    };

    scheduleIdle(processBackgroundUpdates);
  }
}

export default BatchUpdateManager;