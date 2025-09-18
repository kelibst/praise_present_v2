import { Shape } from '../core/Shape';

/**
 * Types of changes that can trigger selective updates
 */
export enum ChangeType {
  SHAPE_ADDED = 'shape-added',
  SHAPE_REMOVED = 'shape-removed',
  SHAPE_MODIFIED = 'shape-modified',
  POSITION_CHANGED = 'position-changed',
  SIZE_CHANGED = 'size-changed',
  TEXT_CHANGED = 'text-changed',
  STYLE_CHANGED = 'style-changed',
  VISIBILITY_CHANGED = 'visibility-changed'
}

/**
 * Change record for tracking shape modifications
 */
export interface ShapeChange {
  shapeId: string;
  changeType: ChangeType;
  timestamp: number;
  oldValue?: any;
  newValue?: any;
  affectedProperties?: string[];
}

/**
 * Shape snapshot for comparison
 */
interface ShapeSnapshot {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  textContent?: string;
  styleHash?: string;
  timestamp: number;
}

/**
 * Update region for efficient partial rendering
 */
export interface UpdateRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  shapeIds: Set<string>;
}

/**
 * Configuration for selective update tracking
 */
export interface SelectiveUpdateConfig {
  enableChangeTracking: boolean;
  enableRegionTracking: boolean;
  maxChangeHistory: number;
  diffThreshold: number; // Minimum change to trigger update
  debounceMs: number;
}

/**
 * Metrics for selective update performance
 */
export interface SelectiveUpdateMetrics {
  totalShapes: number;
  changedShapes: number;
  updateRegions: number;
  timeToDetectChanges: number;
  timeToCalculateRegions: number;
  memoryUsage: number;
}

/**
 * Selective update tracker that monitors shape changes and calculates
 * minimal update regions for efficient partial rendering
 */
export class SelectiveUpdateTracker {
  private config: SelectiveUpdateConfig;
  private shapeSnapshots: Map<string, ShapeSnapshot> = new Map();
  private changeHistory: ShapeChange[] = [];
  private pendingChanges: Map<string, ShapeChange> = new Map();
  private updateRegions: UpdateRegion[] = [];
  private metrics: SelectiveUpdateMetrics;

  // Debouncing
  private debounceTimer: NodeJS.Timeout | null = null;
  private pendingShapeIds: Set<string> = new Set();

  constructor(config?: Partial<SelectiveUpdateConfig>) {
    this.config = {
      enableChangeTracking: true,
      enableRegionTracking: true,
      maxChangeHistory: 1000,
      diffThreshold: 1, // 1 pixel minimum change
      debounceMs: 16, // ~60fps
      ...config
    };

    this.metrics = {
      totalShapes: 0,
      changedShapes: 0,
      updateRegions: 0,
      timeToDetectChanges: 0,
      timeToCalculateRegions: 0,
      memoryUsage: 0
    };
  }

  /**
   * Take a snapshot of current shapes for change detection
   */
  public takeSnapshot(shapes: Shape[]): void {
    if (!this.config.enableChangeTracking) return;

    const startTime = performance.now();

    this.shapeSnapshots.clear();
    this.metrics.totalShapes = shapes.length;

    for (const shape of shapes) {
      const snapshot = this.createShapeSnapshot(shape);
      this.shapeSnapshots.set(shape.id, snapshot);
    }

    this.metrics.timeToDetectChanges = performance.now() - startTime;
    this.updateMemoryMetrics();
  }

  /**
   * Detect changes between current shapes and last snapshot
   */
  public detectChanges(shapes: Shape[]): ShapeChange[] {
    if (!this.config.enableChangeTracking) return [];

    const startTime = performance.now();
    const changes: ShapeChange[] = [];
    const currentShapeIds = new Set(shapes.map(s => s.id));
    const snapshotShapeIds = new Set(this.shapeSnapshots.keys());

    // Detect added shapes
    for (const shape of shapes) {
      if (!snapshotShapeIds.has(shape.id)) {
        changes.push({
          shapeId: shape.id,
          changeType: ChangeType.SHAPE_ADDED,
          timestamp: Date.now(),
          newValue: this.createShapeSnapshot(shape)
        });
      }
    }

    // Detect removed shapes
    for (const shapeId of snapshotShapeIds) {
      if (!currentShapeIds.has(shapeId)) {
        changes.push({
          shapeId,
          changeType: ChangeType.SHAPE_REMOVED,
          timestamp: Date.now(),
          oldValue: this.shapeSnapshots.get(shapeId)
        });
      }
    }

    // Detect modified shapes
    for (const shape of shapes) {
      const snapshot = this.shapeSnapshots.get(shape.id);
      if (snapshot) {
        const currentSnapshot = this.createShapeSnapshot(shape);
        const shapeChanges = this.compareSnapshots(snapshot, currentSnapshot);
        changes.push(...shapeChanges);
      }
    }

    // Update change history
    this.addToChangeHistory(changes);

    // Update metrics
    this.metrics.changedShapes = changes.length;
    this.metrics.timeToDetectChanges = performance.now() - startTime;

    return changes;
  }

  /**
   * Calculate minimal update regions for efficient partial rendering
   */
  public calculateUpdateRegions(changes: ShapeChange[], shapes: Shape[]): UpdateRegion[] {
    if (!this.config.enableRegionTracking || changes.length === 0) return [];

    const startTime = performance.now();
    const regions: UpdateRegion[] = [];
    const shapeMap = new Map(shapes.map(s => [s.id, s]));

    // Group changes by proximity to create efficient update regions
    const expandedRegions = new Map<string, UpdateRegion>();

    for (const change of changes) {
      const shape = shapeMap.get(change.shapeId);
      if (!shape) continue;

      const bounds = this.getShapeBounds(shape);
      const regionKey = this.getRegionKey(bounds);

      if (expandedRegions.has(regionKey)) {
        // Expand existing region
        const existing = expandedRegions.get(regionKey)!;
        this.expandRegion(existing, bounds);
        existing.shapeIds.add(change.shapeId);
      } else {
        // Create new region
        expandedRegions.set(regionKey, {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          shapeIds: new Set([change.shapeId])
        });
      }
    }

    // Merge overlapping regions
    this.updateRegions = this.mergeOverlappingRegions(Array.from(expandedRegions.values()));

    this.metrics.updateRegions = this.updateRegions.length;
    this.metrics.timeToCalculateRegions = performance.now() - startTime;

    return [...this.updateRegions];
  }

  /**
   * Get shapes that need updates based on changes
   */
  public getShapesToUpdate(changes: ShapeChange[]): Set<string> {
    const shapesToUpdate = new Set<string>();

    for (const change of changes) {
      shapesToUpdate.add(change.shapeId);

      // Add dependent shapes if needed
      // For example, if a shape's position changes, overlapping shapes might need updates
      if (change.changeType === ChangeType.POSITION_CHANGED) {
        // Add logic to find overlapping shapes if needed
      }
    }

    return shapesToUpdate;
  }

  /**
   * Check if a shape has pending changes
   */
  public hasPendingChanges(shapeId: string): boolean {
    return this.pendingChanges.has(shapeId);
  }

  /**
   * Mark a shape as needing update with debouncing
   */
  public markShapeForUpdate(shapeId: string, changeType: ChangeType, details?: any): void {
    this.pendingShapeIds.add(shapeId);

    // Store change details
    this.pendingChanges.set(shapeId, {
      shapeId,
      changeType,
      timestamp: Date.now(),
      ...details
    });

    // Debounce the update processing
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processPendingChanges();
    }, this.config.debounceMs);
  }

  /**
   * Get current metrics
   */
  public getMetrics(): SelectiveUpdateMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all tracking data
   */
  public clear(): void {
    this.shapeSnapshots.clear();
    this.changeHistory.length = 0;
    this.pendingChanges.clear();
    this.updateRegions.length = 0;
    this.pendingShapeIds.clear();

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.resetMetrics();
  }

  // Private methods

  private createShapeSnapshot(shape: Shape): ShapeSnapshot {
    const bounds = this.getShapeBounds(shape);

    return {
      id: shape.id,
      position: { x: bounds.x, y: bounds.y },
      size: { width: bounds.width, height: bounds.height },
      visible: shape.visible !== false,
      textContent: this.getShapeTextContent(shape),
      styleHash: this.calculateStyleHash(shape),
      timestamp: Date.now()
    };
  }

  private getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
    try {
      if ('getBounds' in shape && typeof shape.getBounds === 'function') {
        return shape.getBounds();
      }

      // Fallback to position and size properties
      const position = (shape as any).position || { x: 0, y: 0 };
      const size = (shape as any).size || { width: 100, height: 50 };

      return {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height
      };
    } catch (error) {
      console.warn('SelectiveUpdateTracker: Failed to get shape bounds:', error);
      return { x: 0, y: 0, width: 100, height: 50 };
    }
  }

  private getShapeTextContent(shape: Shape): string | undefined {
    try {
      if ('text' in shape) {
        return (shape as any).text;
      }
      if ('getText' in shape && typeof (shape as any).getText === 'function') {
        return (shape as any).getText();
      }
    } catch (error) {
      // Ignore errors when accessing text content
    }
    return undefined;
  }

  private calculateStyleHash(shape: Shape): string {
    try {
      // Create a hash of style-related properties
      const styleProps = {
        type: shape.type,
        opacity: (shape as any).opacity,
        rotation: (shape as any).rotation,
        zIndex: (shape as any).zIndex,
        textStyle: (shape as any).textStyle,
        fillColor: (shape as any).fillColor,
        strokeColor: (shape as any).strokeColor,
        strokeWidth: (shape as any).strokeWidth
      };

      return btoa(JSON.stringify(styleProps));
    } catch (error) {
      return '';
    }
  }

  private compareSnapshots(oldSnapshot: ShapeSnapshot, newSnapshot: ShapeSnapshot): ShapeChange[] {
    const changes: ShapeChange[] = [];

    // Check position changes
    if (this.hasSignificantChange(oldSnapshot.position, newSnapshot.position)) {
      changes.push({
        shapeId: newSnapshot.id,
        changeType: ChangeType.POSITION_CHANGED,
        timestamp: Date.now(),
        oldValue: oldSnapshot.position,
        newValue: newSnapshot.position,
        affectedProperties: ['position']
      });
    }

    // Check size changes
    if (this.hasSignificantChange(oldSnapshot.size, newSnapshot.size)) {
      changes.push({
        shapeId: newSnapshot.id,
        changeType: ChangeType.SIZE_CHANGED,
        timestamp: Date.now(),
        oldValue: oldSnapshot.size,
        newValue: newSnapshot.size,
        affectedProperties: ['size']
      });
    }

    // Check text changes
    if (oldSnapshot.textContent !== newSnapshot.textContent) {
      changes.push({
        shapeId: newSnapshot.id,
        changeType: ChangeType.TEXT_CHANGED,
        timestamp: Date.now(),
        oldValue: oldSnapshot.textContent,
        newValue: newSnapshot.textContent,
        affectedProperties: ['text']
      });
    }

    // Check style changes
    if (oldSnapshot.styleHash !== newSnapshot.styleHash) {
      changes.push({
        shapeId: newSnapshot.id,
        changeType: ChangeType.STYLE_CHANGED,
        timestamp: Date.now(),
        oldValue: oldSnapshot.styleHash,
        newValue: newSnapshot.styleHash,
        affectedProperties: ['style']
      });
    }

    // Check visibility changes
    if (oldSnapshot.visible !== newSnapshot.visible) {
      changes.push({
        shapeId: newSnapshot.id,
        changeType: ChangeType.VISIBILITY_CHANGED,
        timestamp: Date.now(),
        oldValue: oldSnapshot.visible,
        newValue: newSnapshot.visible,
        affectedProperties: ['visible']
      });
    }

    return changes;
  }

  private hasSignificantChange(oldValue: any, newValue: any): boolean {
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      // For objects like position/size, check individual properties
      for (const key in oldValue) {
        if (Math.abs(oldValue[key] - newValue[key]) >= this.config.diffThreshold) {
          return true;
        }
      }
      return false;
    }

    return oldValue !== newValue;
  }

  private getRegionKey(bounds: { x: number; y: number; width: number; height: number }): string {
    // Create a key for grouping nearby regions
    const gridSize = 100; // Group regions within 100px grid
    const gridX = Math.floor(bounds.x / gridSize);
    const gridY = Math.floor(bounds.y / gridSize);
    return `${gridX}-${gridY}`;
  }

  private expandRegion(region: UpdateRegion, bounds: { x: number; y: number; width: number; height: number }): void {
    const minX = Math.min(region.x, bounds.x);
    const minY = Math.min(region.y, bounds.y);
    const maxX = Math.max(region.x + region.width, bounds.x + bounds.width);
    const maxY = Math.max(region.y + region.height, bounds.y + bounds.height);

    region.x = minX;
    region.y = minY;
    region.width = maxX - minX;
    region.height = maxY - minY;
  }

  private mergeOverlappingRegions(regions: UpdateRegion[]): UpdateRegion[] {
    if (regions.length <= 1) return regions;

    const merged: UpdateRegion[] = [];

    for (const region of regions) {
      let wasMerged = false;

      for (const existing of merged) {
        if (this.regionsOverlap(region, existing)) {
          // Merge regions
          this.expandRegion(existing, region);
          region.shapeIds.forEach(id => existing.shapeIds.add(id));
          wasMerged = true;
          break;
        }
      }

      if (!wasMerged) {
        merged.push(region);
      }
    }

    return merged;
  }

  private regionsOverlap(a: UpdateRegion, b: UpdateRegion): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  private addToChangeHistory(changes: ShapeChange[]): void {
    this.changeHistory.push(...changes);

    // Limit history size
    if (this.changeHistory.length > this.config.maxChangeHistory) {
      this.changeHistory.splice(0, this.changeHistory.length - this.config.maxChangeHistory);
    }
  }

  private processPendingChanges(): void {
    if (this.pendingChanges.size === 0) return;

    // Process all pending changes
    const changes = Array.from(this.pendingChanges.values());
    this.addToChangeHistory(changes);

    // Clear pending changes
    this.pendingChanges.clear();
    this.pendingShapeIds.clear();
    this.debounceTimer = null;

    console.log(`🔄 SelectiveUpdateTracker: Processed ${changes.length} pending changes`);
  }

  private updateMemoryMetrics(): void {
    // Rough memory usage estimation
    const snapshotMemory = this.shapeSnapshots.size * 200; // ~200 bytes per snapshot
    const historyMemory = this.changeHistory.length * 150; // ~150 bytes per change
    const regionMemory = this.updateRegions.length * 100; // ~100 bytes per region

    this.metrics.memoryUsage = snapshotMemory + historyMemory + regionMemory;
  }

  private resetMetrics(): void {
    this.metrics = {
      totalShapes: 0,
      changedShapes: 0,
      updateRegions: 0,
      timeToDetectChanges: 0,
      timeToCalculateRegions: 0,
      memoryUsage: 0
    };
  }
}

export default SelectiveUpdateTracker;