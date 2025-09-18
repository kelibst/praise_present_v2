import { ResponsiveRenderingEngine, ResponsiveRenderingEngineOptions } from '../core/ResponsiveRenderingEngine';
import { SlideRenderer } from '../core/SlideRenderer';
import { GeneratedSlide } from '../SlideGenerator';
import { RenderQuality } from '../types/rendering';
import { LayoutMode, ResponsiveBreakpoint } from '../types/responsive';
import { percent, px } from '../responsive';
import { ResourceManager } from '../utils/ResourceManager';
import { BatchUpdateManager, UpdateType, UpdatePriority } from '../sync/BatchUpdateManager';
import { SelectiveUpdateTracker, ChangeType, ShapeChange, UpdateRegion } from '../sync/SelectiveUpdateTracker';

/**
 * Viewport configuration for different preview windows
 */
export interface ViewportConfig {
  id: string;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  targetResolution: { width: number; height: number };
  priority: 'high' | 'medium' | 'low'; // Rendering priority
  editable: boolean;
}

/**
 * Cached render result for performance optimization
 */
interface RenderCache {
  slideId: string;
  contentHash: string;
  viewportId: string;
  dimensions: { width: number; height: number };
  timestamp: number;
  imageData: ImageData | null;
}

/**
 * Performance metrics for monitoring
 */
export interface RenderingMetrics {
  totalRenders: number;
  cacheHits: number;
  averageRenderTime: number;
  activeViewports: number;
  memoryUsage: number;
}

/**
 * Shared rendering context that manages a single ResponsiveRenderingEngine
 * for multiple viewport instances, providing efficient resource utilization
 * and consistent rendering across preview and live displays.
 */
export class SharedRenderingContext {
  private static instance: SharedRenderingContext | null = null;

  private engine: ResponsiveRenderingEngine | null = null;
  private slideRenderer: SlideRenderer | null = null;
  private viewports: Map<string, ViewportConfig> = new Map();
  private renderCache: Map<string, RenderCache> = new Map();
  private resourceManager: ResourceManager;
  private batchManager: BatchUpdateManager;
  private selectiveTracker: SelectiveUpdateTracker;
  private isInitialized = false;

  // Performance tracking
  private metrics: RenderingMetrics = {
    totalRenders: 0,
    cacheHits: 0,
    averageRenderTime: 0,
    activeViewports: 0,
    memoryUsage: 0
  };


  // Cache management
  private readonly MAX_CACHE_SIZE = 50;
  private readonly CACHE_TTL = 300000; // 5 minutes

  private constructor() {
    this.resourceManager = ResourceManager.getInstance();
    this.batchManager = BatchUpdateManager.getInstance({
      maxBatchSize: 8,
      maxWaitTime: 200, // Increased from 50ms to reduce frequency
      enableCoalescing: true,
      enableDependencyResolution: true
    });
    this.selectiveTracker = new SelectiveUpdateTracker({
      enableChangeTracking: true,
      enableRegionTracking: true,
      maxChangeHistory: 500,
      diffThreshold: 2, // 2 pixel minimum change
      debounceMs: 100 // Increased from 16ms to reduce frequency
    });
    this.setupBatchProcessors();
    this.setupCacheCleanup();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SharedRenderingContext {
    if (!SharedRenderingContext.instance) {
      SharedRenderingContext.instance = new SharedRenderingContext();
    }
    return SharedRenderingContext.instance;
  }

  /**
   * Initialize the shared rendering context
   */
  public async initialize(options?: Partial<ResponsiveRenderingEngineOptions>): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Create a temporary canvas for the shared engine
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = 1920;
      offscreenCanvas.height = 1080;

      const defaultOptions: ResponsiveRenderingEngineOptions = {
        canvas: offscreenCanvas,
        enableDebug: false,
        enableResponsive: true,
        settings: {
          quality: RenderQuality.HIGH,
          targetFPS: 60,
          enableCaching: true,
          enableGPUAcceleration: true,
          debugMode: false
        },
        breakpoints: this.createDefaultBreakpoints(),
        baseFontSize: 16,
        ...options
      };

      this.engine = new ResponsiveRenderingEngine(defaultOptions);
      this.slideRenderer = new SlideRenderer(this.engine, { width: 1920, height: 1080 });

      // Register with resource manager
      this.resourceManager.registerEngine('shared-context', this.engine);

      this.isInitialized = true;

      console.log('✅ SharedRenderingContext: Initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ SharedRenderingContext: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Register a viewport for rendering
   */
  public registerViewport(config: ViewportConfig): boolean {
    if (!this.isInitialized) {
      console.warn('SharedRenderingContext: Must initialize before registering viewports');
      return false;
    }

    this.viewports.set(config.id, config);
    this.metrics.activeViewports = this.viewports.size;

    console.log(`📺 SharedRenderingContext: Registered viewport ${config.id}`, {
      dimensions: `${config.width}x${config.height}`,
      priority: config.priority,
      editable: config.editable
    });

    return true;
  }

  /**
   * Unregister a viewport
   */
  public unregisterViewport(viewportId: string): void {
    this.viewports.delete(viewportId);
    this.metrics.activeViewports = this.viewports.size;

    // Clear cache entries for this viewport
    this.clearViewportCache(viewportId);

    console.log(`🗑️ SharedRenderingContext: Unregistered viewport ${viewportId}`);
  }

  /**
   * Render content to a specific viewport with caching and selective updates
   */
  public async renderToViewport(
    viewportId: string,
    content: any,
    options: {
      forceUpdate?: boolean;
      useCache?: boolean;
      useSelectiveUpdate?: boolean;
    } = {}
  ): Promise<boolean> {
    const startTime = performance.now();

    const viewport = this.viewports.get(viewportId);
    if (!viewport || !this.engine || !this.slideRenderer) {
      console.warn(`SharedRenderingContext: Viewport ${viewportId} not found or engine not initialized`);
      return false;
    }

    try {
      const contentHash = this.hashContent(content);
      const cacheKey = `${viewportId}-${contentHash}-${viewport.width}x${viewport.height}`;

      // Check cache first (unless force update)
      if (!options.forceUpdate && options.useCache !== false) {
        const cachedResult = this.renderCache.get(cacheKey);
        if (cachedResult && this.isCacheValid(cachedResult)) {
          await this.applyCachedRender(viewport, cachedResult);
          this.metrics.cacheHits++;
          // Cache hit - only log occasionally to reduce spam
          if (Math.random() < 0.05) {
            console.log(`🎯 SharedRenderingContext: Cache hit for viewport ${viewportId}`);
          }
          return true;
        }
      }

      // Set engine canvas to viewport canvas for rendering
      try {
        this.engine.setCanvas(viewport.canvas);
        this.engine.resize(viewport.width, viewport.height);
      } catch (error) {
        console.error(`SharedRenderingContext: Failed to set canvas for viewport ${viewportId}:`, error);
        return false;
      }

      // Render content using shared slide renderer
      const slide = this.slideRenderer.renderContent(content);

      // Perform selective update if enabled
      if (options.useSelectiveUpdate !== false && !options.forceUpdate) {
        const success = await this.performSelectiveRender(viewport, slide);
        if (success) {
          const renderTime = performance.now() - startTime;
          this.updateRenderMetrics(renderTime);
          // Reduce selective render logging
          if (renderTime > 30 || Math.random() < 0.1) {
            console.log(`✅ SharedRenderingContext: Selective render to viewport ${viewportId} in ${renderTime.toFixed(2)}ms`);
          }
          return true;
        }
        // Fall back to full render if selective update fails
        console.log(`🔄 SharedRenderingContext: Falling back to full render for viewport ${viewportId}`);
      }

      // Full render
      this.engine.render();

      // Cache the result if enabled
      if (options.useCache !== false) {
        await this.cacheRender(cacheKey, slide, viewport);
      }

      // Update metrics
      const renderTime = performance.now() - startTime;
      this.updateRenderMetrics(renderTime);

      // Only log slow renders or occasionally for debugging
      if (renderTime > 50 || Math.random() < 0.05) {
        console.log(`✅ SharedRenderingContext: Rendered to viewport ${viewportId} in ${renderTime.toFixed(2)}ms`);
      }
      return true;

    } catch (error) {
      console.error(`❌ SharedRenderingContext: Failed to render to viewport ${viewportId}:`, error);
      return false;
    }
  }

  /**
   * Request a batched render for a viewport with intelligent scheduling
   */
  public requestRender(
    viewportId: string,
    content?: any,
    priority: UpdatePriority = UpdatePriority.MEDIUM
  ): string {
    const viewport = this.viewports.get(viewportId);
    if (!viewport) {
      console.warn(`SharedRenderingContext: Viewport ${viewportId} not found for render request`);
      return '';
    }

    // Submit to batch manager with appropriate priority based on viewport priority
    const updatePriority = viewport.priority === 'high' ? UpdatePriority.HIGH :
                          viewport.priority === 'medium' ? UpdatePriority.MEDIUM :
                          UpdatePriority.LOW;

    return this.batchManager.submitUpdate({
      type: UpdateType.CONTENT_CHANGE,
      priority: Math.min(priority, updatePriority),
      viewportId,
      data: { content }
    });
  }

  /**
   * Request a text edit update with batching
   */
  public requestTextEdit(
    viewportId: string,
    shapeId: string,
    newText: string,
    oldText: string
  ): string {
    return this.batchManager.submitUpdate({
      type: UpdateType.TEXT_EDIT,
      priority: UpdatePriority.HIGH, // Text edits are high priority for responsiveness
      viewportId,
      data: { shapeId, newText, oldText }
    });
  }

  /**
   * Request a property change update with batching
   */
  public requestPropertyChange(
    viewportId: string,
    properties: Record<string, any>
  ): string {
    return this.batchManager.submitUpdate({
      type: UpdateType.PROPERTY_CHANGE,
      priority: UpdatePriority.MEDIUM,
      viewportId,
      data: { properties }
    });
  }

  /**
   * Get current rendering metrics
   */
  public getMetrics(): RenderingMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.renderCache.clear();
    console.log('🧹 SharedRenderingContext: Cleared all render cache');
  }

  /**
   * Get the shared rendering engine (for advanced operations)
   */
  public getEngine(): ResponsiveRenderingEngine | null {
    return this.engine;
  }

  /**
   * Dispose of the shared context
   */
  public dispose(): void {
    // Clear batch manager
    this.batchManager.clearAll();

    // Clear selective tracker
    this.selectiveTracker.clear();

    this.viewports.clear();
    this.renderCache.clear();

    if (this.engine) {
      this.resourceManager.cleanup('shared-context');
      this.engine = null;
    }

    this.slideRenderer = null;
    this.isInitialized = false;

    SharedRenderingContext.instance = null;

    console.log('🗑️ SharedRenderingContext: Disposed successfully');
  }

  // Private methods

  /**
   * Perform selective rendering for a viewport
   */
  private async performSelectiveRender(viewport: ViewportConfig, slide: GeneratedSlide): Promise<boolean> {
    if (!this.engine) return false;

    try {
      const currentShapes = this.engine.getAllShapes();

      // Detect changes from last snapshot
      const changes = this.selectiveTracker.detectChanges(slide.shapes);

      if (changes.length === 0) {
        // No changes, no need to render
        console.log(`🎯 SharedRenderingContext: No changes detected for viewport ${viewport.id}`);
        return true;
      }

      // Calculate update regions
      const updateRegions = this.selectiveTracker.calculateUpdateRegions(changes, slide.shapes);

      if (updateRegions.length === 0) {
        // Use full render as fallback
        return false;
      }

      // Perform selective updates for each region
      const success = await this.renderUpdateRegions(viewport, updateRegions, slide.shapes);

      if (success) {
        // Take new snapshot for next comparison
        this.selectiveTracker.takeSnapshot(slide.shapes);

        // Log selective update success (reduced frequency)
        const changedShapeCount = this.selectiveTracker.getShapesToUpdate(changes).size;
        if (changedShapeCount > 5 || Math.random() < 0.1) {
          console.log(`🎯 SharedRenderingContext: Selective update completed - ${changedShapeCount} shapes in ${updateRegions.length} regions`);
        }
      }

      return success;

    } catch (error) {
      console.error('SharedRenderingContext: Selective render failed:', error);
      return false;
    }
  }

  /**
   * Render specific update regions
   */
  private async renderUpdateRegions(
    viewport: ViewportConfig,
    regions: UpdateRegion[],
    shapes: any[]
  ): Promise<boolean> {
    if (!this.engine) return false;

    try {
      const ctx = viewport.canvas.getContext('2d');
      if (!ctx) return false;

      // Render each update region
      for (const region of regions) {
        // Clear the region
        ctx.clearRect(region.x, region.y, region.width, region.height);

        // Render only shapes in this region
        const shapesToRender = shapes.filter(shape => region.shapeIds.has(shape.id));

        for (const shape of shapesToRender) {
          try {
            // Set canvas clipping to the update region
            ctx.save();
            ctx.beginPath();
            ctx.rect(region.x, region.y, region.width, region.height);
            ctx.clip();

            // Render the shape
            if ('render' in shape && typeof shape.render === 'function') {
              shape.render(ctx);
            } else {
              // Fallback rendering through engine
              this.engine.clearShapes();
              this.engine.addShape(shape);
              this.engine.render();
            }

            ctx.restore();
          } catch (error) {
            console.warn('SharedRenderingContext: Failed to render shape in region:', error);
            ctx.restore();
          }
        }
      }

      return true;

    } catch (error) {
      console.error('SharedRenderingContext: Failed to render update regions:', error);
      return false;
    }
  }

  /**
   * Mark a shape for selective update
   */
  public markShapeForUpdate(viewportId: string, shapeId: string, changeType: ChangeType): void {
    this.selectiveTracker.markShapeForUpdate(shapeId, changeType, { viewportId });
  }

  /**
   * Get selective update metrics
   */
  public getSelectiveUpdateMetrics() {
    return this.selectiveTracker.getMetrics();
  }

  /**
   * Set up batch processors for different update types
   */
  private setupBatchProcessors(): void {
    // Content change processor
    this.batchManager.registerProcessor(UpdateType.CONTENT_CHANGE, async (updates) => {
      try {
        const results = await Promise.all(
          updates.map(update => this.processBatchedContentChange(update))
        );
        return results.every(result => result);
      } catch (error) {
        console.error('SharedRenderingContext: Batch content change failed:', error);
        return false;
      }
    });

    // Text edit processor
    this.batchManager.registerProcessor(UpdateType.TEXT_EDIT, async (updates) => {
      try {
        const results = await Promise.all(
          updates.map(update => this.processBatchedTextEdit(update))
        );
        return results.every(result => result);
      } catch (error) {
        console.error('SharedRenderingContext: Batch text edit failed:', error);
        return false;
      }
    });

    // Property change processor
    this.batchManager.registerProcessor(UpdateType.PROPERTY_CHANGE, async (updates) => {
      try {
        const results = await Promise.all(
          updates.map(update => this.processBatchedPropertyChange(update))
        );
        return results.every(result => result);
      } catch (error) {
        console.error('SharedRenderingContext: Batch property change failed:', error);
        return false;
      }
    });

    console.log('✅ SharedRenderingContext: Batch processors set up');
  }

  /**
   * Process a batched content change update
   */
  private async processBatchedContentChange(update: any): Promise<boolean> {
    const { viewportId, data } = update;
    const { content } = data;

    if (content) {
      return await this.renderToViewport(viewportId, content, {
        forceUpdate: false,
        useCache: true
      });
    }

    // For render requests without content, just trigger a re-render
    const viewport = this.viewports.get(viewportId);
    if (viewport && this.engine) {
      try {
        this.engine.setCanvas(viewport.canvas);
        this.engine.resize(viewport.width, viewport.height);
        this.engine.render();
        return true;
      } catch (error) {
        console.error('SharedRenderingContext: Batched render failed:', error);
        return false;
      }
    }

    return false;
  }

  /**
   * Process a batched text edit update
   */
  private async processBatchedTextEdit(update: any): Promise<boolean> {
    const { viewportId, data } = update;
    const { shapeId, newText } = data;

    // Find the shape and update its text
    if (this.engine) {
      const allShapes = this.engine.getAllShapes();
      const shape = allShapes.find(s => s.id === shapeId);

      if (shape && 'setText' in shape && typeof shape.setText === 'function') {
        try {
          (shape as any).setText(newText);

          // Re-render the affected viewport
          const viewport = this.viewports.get(viewportId);
          if (viewport) {
            try {
              this.engine.setCanvas(viewport.canvas);
              this.engine.resize(viewport.width, viewport.height);
              this.engine.render();
            } catch (canvasError) {
              console.error('SharedRenderingContext: Failed to render after text edit:', canvasError);
              return false;
            }
          }

          return true;
        } catch (error) {
          console.error('SharedRenderingContext: Text edit failed:', error);
          return false;
        }
      }
    }

    return false;
  }

  /**
   * Process a batched property change update
   */
  private async processBatchedPropertyChange(update: any): Promise<boolean> {
    const { viewportId, data } = update;
    const { properties } = data;

    // Apply property changes and re-render
    try {
      if (this.engine) {
        // Apply properties to engine or shapes as needed
        // This would depend on what properties are being changed
        // For now, just trigger a re-render

        const viewport = this.viewports.get(viewportId);
        if (viewport) {
          try {
            this.engine.setCanvas(viewport.canvas);
            this.engine.resize(viewport.width, viewport.height);
            this.engine.render();
          } catch (canvasError) {
            console.error('SharedRenderingContext: Failed to render after property change:', canvasError);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('SharedRenderingContext: Property change failed:', error);
      return false;
    }
  }

  private createDefaultBreakpoints(): ResponsiveBreakpoint[] {
    return [
      {
        name: 'small-preview',
        maxWidth: 500,
        config: {
          mode: LayoutMode.FIT_CONTENT,
          padding: px(8)
        }
      },
      {
        name: 'medium-preview',
        minWidth: 501,
        maxWidth: 800,
        config: {
          mode: LayoutMode.CENTER,
          padding: px(12)
        }
      },
      {
        name: 'large-preview',
        minWidth: 801,
        config: {
          mode: LayoutMode.CENTER,
          padding: px(16)
        }
      }
    ];
  }

  private hashContent(content: any): string {
    // Simple content hash for cache key generation
    return btoa(JSON.stringify({
      type: content.type,
      slideId: content.slide?.id,
      shapeCount: content.slide?.shapes?.length,
      timestamp: content.lastModified || 0
    }));
  }

  private isCacheValid(cache: RenderCache): boolean {
    const now = Date.now();
    return (now - cache.timestamp) < this.CACHE_TTL;
  }

  private async cacheRender(
    cacheKey: string,
    slide: GeneratedSlide,
    viewport: ViewportConfig
  ): Promise<void> {
    try {
      // Capture current canvas state
      const ctx = viewport.canvas.getContext('2d');
      const imageData = ctx?.getImageData(0, 0, viewport.width, viewport.height) || null;

      const cacheEntry: RenderCache = {
        slideId: slide.id,
        contentHash: cacheKey.split('-')[1],
        viewportId: viewport.id,
        dimensions: { width: viewport.width, height: viewport.height },
        timestamp: Date.now(),
        imageData
      };

      this.renderCache.set(cacheKey, cacheEntry);

      // Limit cache size
      if (this.renderCache.size > this.MAX_CACHE_SIZE) {
        this.cleanupOldCache();
      }

    } catch (error) {
      console.warn('SharedRenderingContext: Failed to cache render:', error);
    }
  }

  private async applyCachedRender(
    viewport: ViewportConfig,
    cache: RenderCache
  ): Promise<void> {
    if (!cache.imageData) return;

    const ctx = viewport.canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(cache.imageData, 0, 0);
    }
  }

  private clearViewportCache(viewportId: string): void {
    const keysToDelete: string[] = [];

    for (const [key, cache] of this.renderCache.entries()) {
      if (cache.viewportId === viewportId) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.renderCache.delete(key));
  }

  private cleanupOldCache(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    // Sort by timestamp and remove oldest entries
    const sortedEntries = Array.from(this.renderCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const removeCount = this.renderCache.size - this.MAX_CACHE_SIZE + 10; // Remove extra for buffer

    for (let i = 0; i < removeCount && i < sortedEntries.length; i++) {
      entriesToDelete.push(sortedEntries[i][0]);
    }

    entriesToDelete.forEach(key => this.renderCache.delete(key));
  }

  private setupCacheCleanup(): void {
    // Clean up expired cache entries every 2 minutes
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, cache] of this.renderCache.entries()) {
        if ((now - cache.timestamp) > this.CACHE_TTL) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.renderCache.delete(key));

      if (keysToDelete.length > 0) {
        console.log(`🧹 SharedRenderingContext: Cleaned up ${keysToDelete.length} expired cache entries`);
      }
    }, 120000); // 2 minutes
  }


  private updateRenderMetrics(renderTime: number): void {
    this.metrics.totalRenders++;

    // Calculate rolling average
    this.metrics.averageRenderTime =
      (this.metrics.averageRenderTime * (this.metrics.totalRenders - 1) + renderTime) /
      this.metrics.totalRenders;

    // Estimate memory usage (simplified)
    this.metrics.memoryUsage = this.renderCache.size * 1024; // Rough estimate
  }
}

export default SharedRenderingContext;