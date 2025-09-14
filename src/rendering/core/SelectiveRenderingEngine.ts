import { RenderingEngine, RenderingEngineOptions } from './RenderingEngine';
import { Shape } from './Shape';
import { RenderContext } from '../types/rendering';
import { Rectangle } from '../types/geometry';

/**
 * Enhanced rendering engine with selective rendering capabilities
 * Only re-renders shapes that have been modified or are in dirty regions
 */

export interface SelectiveRenderingOptions extends RenderingEngineOptions {
  enableSelectiveRendering?: boolean;
  dirtyRegionThreshold?: number; // Minimum area to be considered for selective rendering
  maxDirtyRegions?: number; // Maximum dirty regions before full re-render
}

export interface ShapeRenderState {
  shapeId: string;
  lastRenderedHash: string;
  lastRenderTime: number;
  bounds: Rectangle;
  isDirty: boolean;
  dependentShapes: Set<string>; // Shapes that depend on this shape
}

export interface DirtyRegion {
  bounds: Rectangle;
  affectedShapes: Set<string>;
  priority: number; // Higher priority regions render first
  reason: 'shape-change' | 'resize' | 'manual' | 'dependency';
}

export class SelectiveRenderingEngine extends RenderingEngine {
  private enableSelectiveRendering: boolean;
  private dirtyRegionThreshold: number;
  private maxDirtyRegions: number;

  // Selective rendering state
  private shapeStates = new Map<string, ShapeRenderState>();
  private dirtyRegions = new Map<string, DirtyRegion>();
  private globalDirty: boolean = true; // Force full render initially
  private lastFullRenderTime: number = 0;
  private renderCount: number = 0;

  // Performance tracking
  private selectiveRenderingMetrics = {
    totalRenders: 0,
    fullRenders: 0,
    selectiveRenders: 0,
    skippedShapes: 0,
    avgShapesPerRender: 0,
    timeSpentSelecting: 0
  };

  constructor(options: SelectiveRenderingOptions) {
    super(options);

    this.enableSelectiveRendering = options.enableSelectiveRendering !== false;
    this.dirtyRegionThreshold = options.dirtyRegionThreshold || 100; // 100px² minimum
    this.maxDirtyRegions = options.maxDirtyRegions || 20;

    console.log('🎯 SelectiveRenderingEngine: Initialized', {
      enabled: this.enableSelectiveRendering,
      dirtyThreshold: this.dirtyRegionThreshold,
      maxDirtyRegions: this.maxDirtyRegions
    });
  }

  /**
   * Enhanced addShape that tracks state for selective rendering
   */
  public addShape(shape: Shape): void {
    super.addShape(shape);

    if (this.enableSelectiveRendering) {
      const shapeId = shape.id;
      const bounds = shape.getBounds();
      const hash = this.createShapeHash(shape);

      this.shapeStates.set(shapeId, {
        shapeId,
        lastRenderedHash: '',  // Force initial render
        lastRenderTime: 0,
        bounds,
        isDirty: true,
        dependentShapes: new Set()
      });

      this.markRegionDirty(bounds, 'shape-change', [shapeId]);
    }
  }

  /**
   * Enhanced removeShape that cleans up selective rendering state
   */
  public removeShape(shapeId: string): boolean {
    const removed = super.removeShape(shapeId);

    if (removed && this.enableSelectiveRendering) {
      const state = this.shapeStates.get(shapeId);
      if (state) {
        // Mark the region where the shape was as dirty
        this.markRegionDirty(state.bounds, 'shape-change', []);

        // Clean up dependencies
        state.dependentShapes.forEach(depId => {
          const depState = this.shapeStates.get(depId);
          if (depState) {
            depState.isDirty = true;
          }
        });

        this.shapeStates.delete(shapeId);
      }
    }

    return removed;
  }

  /**
   * Mark a specific shape as dirty (needs re-rendering)
   */
  public markShapeDirty(shapeId: string, reason: string = 'manual'): void {
    if (!this.enableSelectiveRendering) {
      this.requestRender();
      return;
    }

    const shape = this.getShape(shapeId);
    const state = this.shapeStates.get(shapeId);

    if (shape && state) {
      const newBounds = shape.getBounds();
      const newHash = this.createShapeHash(shape);

      // Check if shape actually changed
      if (state.lastRenderedHash !== newHash) {
        state.isDirty = true;
        state.bounds = newBounds;

        this.markRegionDirty(newBounds, 'shape-change', [shapeId]);

        // Mark dependent shapes as dirty
        state.dependentShapes.forEach(depId => {
          this.markShapeDirty(depId, 'dependency');
        });

        console.log(`🔄 SelectiveRenderingEngine: Marked shape ${shapeId} as dirty (${reason})`);
      }
    }

    this.requestRender();
  }

  /**
   * Mark a rectangular region as dirty
   */
  public markRegionDirty(
    bounds: Rectangle,
    reason: DirtyRegion['reason'],
    shapeIds: string[],
    priority: number = 1
  ): void {
    if (!this.enableSelectiveRendering) return;

    const area = bounds.width * bounds.height;
    if (area < this.dirtyRegionThreshold) return;

    const regionId = `${bounds.x}-${bounds.y}-${bounds.width}-${bounds.height}`;

    // Merge with existing region if overlapping
    let merged = false;
    for (const [existingId, existingRegion] of this.dirtyRegions) {
      if (this.regionsOverlap(bounds, existingRegion.bounds)) {
        existingRegion.bounds = this.mergeRectangles(bounds, existingRegion.bounds);
        shapeIds.forEach(id => existingRegion.affectedShapes.add(id));
        existingRegion.priority = Math.max(existingRegion.priority, priority);
        merged = true;
        break;
      }
    }

    if (!merged && this.dirtyRegions.size < this.maxDirtyRegions) {
      this.dirtyRegions.set(regionId, {
        bounds,
        affectedShapes: new Set(shapeIds),
        priority,
        reason
      });
    } else if (!merged) {
      // Too many dirty regions, force full render
      this.globalDirty = true;
    }
  }

  /**
   * Enhanced render method with selective rendering
   */
  public render(clearCanvas: boolean = true): void {
    const startTime = performance.now();

    try {
      if (!this.enableSelectiveRendering || this.globalDirty) {
        this.performFullRender(clearCanvas);
        this.globalDirty = false;
        this.selectiveRenderingMetrics.fullRenders++;
      } else if (this.dirtyRegions.size > 0) {
        this.performSelectiveRender(clearCanvas);
        this.selectiveRenderingMetrics.selectiveRenders++;
      } else {
        // Nothing to render
        this.selectiveRenderingMetrics.skippedShapes += this.getAllShapes().length;
        return;
      }

      this.updateSelectiveRenderingMetrics();

      const endTime = performance.now();
      this.selectiveRenderingMetrics.timeSpentSelecting += endTime - startTime;
      this.selectiveRenderingMetrics.totalRenders++;

    } catch (error) {
      console.error('SelectiveRenderingEngine: Render error:', error);
      // Fallback to full render
      this.globalDirty = true;
      this.performFullRender(clearCanvas);
    }
  }

  /**
   * Perform full render (original behavior)
   */
  private performFullRender(clearCanvas: boolean): void {
    console.log('🎨 SelectiveRenderingEngine: Performing full render');

    super.render(clearCanvas);

    this.lastFullRenderTime = performance.now();
    this.dirtyRegions.clear();

    // Update all shape states
    this.getAllShapes().forEach(shape => {
      const state = this.shapeStates.get(shape.id);
      if (state) {
        state.lastRenderedHash = this.createShapeHash(shape);
        state.lastRenderTime = this.lastFullRenderTime;
        state.isDirty = false;
        state.bounds = shape.getBounds();
      }
    });
  }

  /**
   * Perform selective render (only dirty regions)
   */
  private performSelectiveRender(clearCanvas: boolean): void {
    const renderStartTime = performance.now();
    const sortedRegions = Array.from(this.dirtyRegions.values())
      .sort((a, b) => b.priority - a.priority);

    console.log(`🎯 SelectiveRenderingEngine: Performing selective render of ${sortedRegions.length} regions`);

    const context = this.getRenderer().createRenderContext();
    const ctx = context.context as CanvasRenderingContext2D;

    let shapesRendered = 0;

    for (const region of sortedRegions) {
      // Clear the dirty region
      ctx.save();
      ctx.beginPath();
      ctx.rect(region.bounds.x, region.bounds.y, region.bounds.width, region.bounds.height);
      ctx.clip();

      if (clearCanvas) {
        ctx.clearRect(region.bounds.x, region.bounds.y, region.bounds.width, region.bounds.height);
      }

      // Find shapes that intersect with this region
      const affectedShapes = this.getShapesInRegion(region.bounds);

      // Render shapes in z-order within this region
      for (const shape of affectedShapes) {
        if (this.shouldRenderShape(shape, region)) {
          this.renderShapeInRegion(shape, context, region.bounds);
          shapesRendered++;

          // Update shape state
          const state = this.shapeStates.get(shape.id);
          if (state) {
            state.lastRenderedHash = this.createShapeHash(shape);
            state.lastRenderTime = performance.now();
            state.isDirty = false;
          }
        }
      }

      ctx.restore();
    }

    // Clear processed dirty regions
    this.dirtyRegions.clear();

    console.log(`✅ SelectiveRenderingEngine: Rendered ${shapesRendered} shapes in ${performance.now() - renderStartTime}ms`);
  }

  /**
   * Check if a shape should be rendered in selective mode
   */
  private shouldRenderShape(shape: Shape, region: DirtyRegion): boolean {
    if (!shape.visible || shape.opacity <= 0) return false;

    const state = this.shapeStates.get(shape.id);
    if (!state) return true; // New shape, render it

    // Check if shape is in affected shapes or intersects with region
    return region.affectedShapes.has(shape.id) ||
           state.isDirty ||
           this.rectanglesIntersect(shape.getBounds(), region.bounds);
  }

  /**
   * Render shape within a specific region with clipping
   */
  private renderShapeInRegion(shape: Shape, context: RenderContext, region: Rectangle): void {
    try {
      this.getRenderer().saveState();

      // Apply additional clipping for the region
      const ctx = context.context as CanvasRenderingContext2D;
      ctx.beginPath();
      ctx.rect(region.x, region.y, region.width, region.height);
      ctx.clip();

      shape.render(context);

      this.getRenderer().restoreState();
    } catch (error) {
      console.error(`SelectiveRenderingEngine: Error rendering shape ${shape.id}:`, error);
      this.getRenderer().restoreState();
    }
  }

  /**
   * Get shapes that intersect with a region
   */
  private getShapesInRegion(region: Rectangle): Shape[] {
    return this.getAllShapes().filter(shape => {
      const shapeBounds = shape.getBounds();
      return this.rectanglesIntersect(shapeBounds, region);
    }).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }

  /**
   * Create a hash of shape's current state for change detection
   */
  private createShapeHash(shape: Shape): string {
    const bounds = shape.getBounds();
    const baseHash = JSON.stringify({
      id: shape.id,
      visible: shape.visible,
      opacity: shape.opacity,
      zIndex: shape.zIndex,
      bounds,
      type: shape.type
    });

    // Add shape-specific properties if available
    if ('text' in shape) {
      return baseHash + JSON.stringify({ text: (shape as any).text });
    }

    return baseHash;
  }

  /**
   * Check if two rectangles overlap
   */
  private regionsOverlap(rect1: Rectangle, rect2: Rectangle): boolean {
    return this.rectanglesIntersect(rect1, rect2);
  }

  /**
   * Check if two rectangles intersect
   */
  private rectanglesIntersect(rect1: Rectangle, rect2: Rectangle): boolean {
    return !(rect1.x + rect1.width < rect2.x ||
             rect2.x + rect2.width < rect1.x ||
             rect1.y + rect1.height < rect2.y ||
             rect2.y + rect2.height < rect1.y);
  }

  /**
   * Merge two rectangles into a bounding rectangle
   */
  private mergeRectangles(rect1: Rectangle, rect2: Rectangle): Rectangle {
    const minX = Math.min(rect1.x, rect2.x);
    const minY = Math.min(rect1.y, rect2.y);
    const maxX = Math.max(rect1.x + rect1.width, rect2.x + rect2.width);
    const maxY = Math.max(rect1.y + rect1.height, rect2.y + rect2.height);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Get performance metrics for selective rendering
   */
  public getSelectiveRenderingMetrics(): typeof this.selectiveRenderingMetrics {
    return { ...this.selectiveRenderingMetrics };
  }

  /**
   * Update selective rendering performance metrics
   */
  private updateSelectiveRenderingMetrics(): void {
    const totalShapes = this.getAllShapes().length;
    this.selectiveRenderingMetrics.avgShapesPerRender =
      this.selectiveRenderingMetrics.totalRenders > 0
        ? totalShapes / this.selectiveRenderingMetrics.totalRenders
        : 0;
  }

  /**
   * Force full re-render on next frame
   */
  public invalidateAll(): void {
    this.globalDirty = true;
    this.dirtyRegions.clear();
    this.shapeStates.forEach(state => {
      state.isDirty = true;
      state.lastRenderedHash = '';
    });
    this.requestRender();
  }

  /**
   * Enable or disable selective rendering
   */
  public setSelectiveRenderingEnabled(enabled: boolean): void {
    this.enableSelectiveRendering = enabled;
    if (!enabled) {
      this.globalDirty = true;
    }
    this.requestRender();
  }

  /**
   * Get internal renderer for advanced operations
   */
  private getRenderer(): any {
    return (this as any).renderer;
  }

  /**
   * Get all shapes from parent class
   */
  public getAllShapes(): Shape[] {
    return (this as any).shapes.getAll ? (this as any).shapes.getAll() : [];
  }

  /**
   * Clean up selective rendering resources
   */
  public dispose(): void {
    this.shapeStates.clear();
    this.dirtyRegions.clear();
    super.dispose();
  }
}