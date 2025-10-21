import { CanvasRenderer } from './CanvasRenderer';
import { ShapeCollection } from './ShapeCollection';
import { Shape } from './Shape';
import { RenderContext, RenderSettings, PerformanceMetrics, ViewportInfo } from '../types/rendering';
import { Rectangle, Point } from '../types/geometry';

export interface RenderingEngineOptions {
  canvas: HTMLCanvasElement;
  settings?: Partial<RenderSettings>;
  enableDebug?: boolean;
}

export class RenderingEngine {
  private renderer: CanvasRenderer;
  private shapes: ShapeCollection;
  private viewport: ViewportInfo;
  private animationFrameId: number | null = null;
  private isRendering: boolean = false;
  private enableDebug: boolean;
  private renderCallback?: () => void;
  private performanceMetrics: PerformanceMetrics;
  private errorCallback?: (error: Error, context: string) => void;
  private consecutiveErrors: number = 0;
  private maxConsecutiveErrors: number = 5;
  private lastErrorTime: number = 0;
  private errorRecoveryAttempts: number = 0;
  private fallbackTimerId: number | null = null;
  private useAggressiveRendering: boolean = false;

  constructor(options: RenderingEngineOptions) {
    this.enableDebug = options.enableDebug || false;
    this.renderer = new CanvasRenderer(options.canvas, options.settings);
    this.shapes = new ShapeCollection();
    this.viewport = this.createViewportInfo(options.canvas);
    this.performanceMetrics = this.initializeMetrics();

    this.bindMethods();
    // REMOVED: setupEventListeners() - ResizeObserver was causing canvas dimension changes
    // Canvas should ALWAYS stay at fixed resolution (1920x1080) - no dynamic resizing
  }

  private bindMethods(): void {
    this.render = this.render.bind(this);
    this.renderLoop = this.renderLoop.bind(this);
  }

  private createViewportInfo(canvas: HTMLCanvasElement): ViewportInfo {
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;

    // Fallback to canvas attributes if clientWidth/clientHeight are 0
    if (width === 0 || height === 0) {
      width = canvas.width || 800;
      height = canvas.height || 600;
    }

    return {
      width: width,
      height: height,
      pixelRatio: window.devicePixelRatio || 1,
      visibleArea: {
        x: 0,
        y: 0,
        width: width,
        height: height
      },
      scrollOffset: { x: 0, y: 0 }
    };
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      frameTime: 0,
      renderTime: 0,
      shapeCount: 0,
      memoryUsage: 0,
      fps: 0
    };
  }

  public addShape(shape: Shape): void {
    this.shapes.add(shape);
    this.requestRender();
  }

  public removeShape(shapeId: string): boolean {
    const removed = this.shapes.remove(shapeId);
    if (removed) {
      this.requestRender();
    }
    return removed;
  }

  public getShape(shapeId: string): Shape | undefined {
    return this.shapes.get(shapeId);
  }

  public getAllShapes(): Shape[] {
    return this.shapes.getAll();
  }

  public findShapeById(shapeId: string): Shape | null {
    return this.shapes.get(shapeId) || null;
  }

  public getVisibleShapes(): Shape[] {
    return this.shapes.getVisible(this.viewport.visibleArea);
  }

  public clearShapes(): void {
    this.shapes.clear();
    this.requestRender();
  }

  public moveShapeToFront(shapeId: string): boolean {
    const moved = this.shapes.moveToFront(shapeId);
    if (moved) {
      this.requestRender();
    }
    return moved;
  }

  public moveShapeToBack(shapeId: string): boolean {
    const moved = this.shapes.moveToBack(shapeId);
    if (moved) {
      this.requestRender();
    }
    return moved;
  }

  public getShapeAt(point: Point): Shape | null {
    return this.shapes.getTopShapeAt(point);
  }

  public getShapesAt(point: Point): Shape[] {
    return this.shapes.getShapesAt(point);
  }

  public setViewport(viewport: Partial<ViewportInfo>): void {
    this.viewport = { ...this.viewport, ...viewport };
    this.renderer.setViewport(this.viewport);
    this.requestRender();
  }

  public setCanvas(canvas: HTMLCanvasElement): void {
    this.renderer.setCanvas(canvas);

    // Update viewport info for the new canvas
    this.viewport = this.createViewportInfo(canvas);
    this.renderer.setViewport(this.viewport);

    this.requestRender();
  }

  public resize(width: number, height: number): void {
    // DEPRECATED: In fixed-resolution mode, canvas should NEVER resize
    // Canvas stays at 1920x1080, CSS handles all scaling
    console.warn('RenderingEngine.resize() called but resize is deprecated in fixed-resolution mode');
    console.warn('Canvas should always stay at 1920x1080. CSS will handle display scaling.');
    // Do nothing - prevent any resizing
  }

  public render(clearCanvas: boolean = true): void {
    const startTime = performance.now();

    try {
      this.renderer.startFrame();

      if (clearCanvas) {
        this.renderer.clear();
      }

      const renderContext = this.renderer.createRenderContext();
      const visibleShapes = this.getVisibleShapes();

      this.updateShapeStats(visibleShapes);

      // Render shapes in z-order
      for (const shape of visibleShapes) {
        this.renderShape(shape, renderContext);
      }

      this.renderer.endFrame();

      // Update performance metrics
      const endTime = performance.now();
      this.updatePerformanceMetrics(startTime, endTime, visibleShapes.length);

      if (this.enableDebug) {
        this.renderDebugInfo(renderContext);
      }

      // Reset error tracking on successful render
      this.resetErrorTracking();

    } catch (error) {
      this.handleRenderingError(error as Error, 'main_render');
    }
  }

  private renderShape(shape: Shape, context: RenderContext): void {
    if (!shape.visible || shape.opacity <= 0) {
      this.renderer.incrementCulledShapeCount();
      return;
    }

    try {
      this.renderer.saveState();
      shape.render(context);
      this.renderer.restoreState();
      this.renderer.incrementVisibleShapeCount();
      this.renderer.incrementDrawCallCount();
    } catch (error) {
      this.handleShapeRenderingError(shape, error as Error);
      this.renderer.restoreState();
    }
  }

  private updateShapeStats(visibleShapes: Shape[]): void {
    this.renderer.incrementShapeCount();
    this.performanceMetrics.shapeCount = this.shapes.getShapeCount();
  }

  private updatePerformanceMetrics(startTime: number, endTime: number, visibleShapeCount: number): void {
    this.performanceMetrics.renderTime = endTime - startTime;
    this.performanceMetrics.frameTime = this.renderer.getStats().frameTime;

    // Estimate memory usage (basic approximation)
    this.performanceMetrics.memoryUsage = this.estimateMemoryUsage();

    // Calculate FPS
    if (this.performanceMetrics.frameTime > 0) {
      this.performanceMetrics.fps = 1000 / this.performanceMetrics.frameTime;
    }
  }

  private estimateMemoryUsage(): number {
    // Basic memory estimation - this could be more sophisticated
    const shapeCount = this.shapes.getShapeCount();
    const canvasSize = this.viewport.width * this.viewport.height * 4; // RGBA bytes
    const shapeMemory = shapeCount * 1024; // Rough estimate per shape
    return (canvasSize + shapeMemory) / (1024 * 1024); // Convert to MB
  }

  private renderDebugInfo(context: RenderContext): void {
    if (!(context.context instanceof CanvasRenderingContext2D)) return;

    const ctx = context.context;
    const stats = this.renderer.getStats();
    const metrics = this.performanceMetrics;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 250, 120);

    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    let y = 25;
    const lineHeight = 15;

    ctx.fillText(`FPS: ${metrics.fps.toFixed(1)}`, 15, y);
    y += lineHeight;
    ctx.fillText(`Frame Time: ${metrics.frameTime.toFixed(2)}ms`, 15, y);
    y += lineHeight;
    ctx.fillText(`Render Time: ${metrics.renderTime.toFixed(2)}ms`, 15, y);
    y += lineHeight;
    ctx.fillText(`Shapes: ${stats.totalShapes} (${stats.visibleShapes} visible)`, 15, y);
    y += lineHeight;
    ctx.fillText(`Draw Calls: ${stats.drawCalls}`, 15, y);
    y += lineHeight;
    ctx.fillText(`Memory: ${metrics.memoryUsage.toFixed(1)}MB`, 15, y);
    y += lineHeight;
    ctx.fillText(`Mode: ${this.renderer.getRenderMode().toUpperCase()}`, 15, y);

    ctx.restore();
  }

  public startRenderLoop(aggressiveMode: boolean = false): void {
    if (this.isRendering) return;

    this.isRendering = true;
    this.useAggressiveRendering = aggressiveMode;

    // Start RAF-based render loop
    this.renderLoop();

    // REMOVED: Fallback timer causes video to play slowly
    // The setInterval rendering was blocking the main thread
    // and preventing smooth video playback
  }

  public stopRenderLoop(): void {
    this.isRendering = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.fallbackTimerId !== null) {
      clearInterval(this.fallbackTimerId);
      this.fallbackTimerId = null;
    }
  }

  private renderLoop(): void {
    if (!this.isRendering) return;

    this.render();

    if (this.renderCallback) {
      this.renderCallback();
    }

    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  }

  /**
   * Fallback timer for rendering when requestAnimationFrame is throttled
   * This ensures video backgrounds play smoothly in background windows (like live display)
   */
  private startFallbackTimer(): void {
    if (this.fallbackTimerId !== null) return;

    // 30 FPS for smooth video in background
    const targetFPS = 30;
    const interval = 1000 / targetFPS;

    this.fallbackTimerId = window.setInterval(() => {
      if (this.isRendering) {
        // Only render if RAF hasn't rendered recently
        // This prevents double rendering when window is visible
        this.render();
      }
    }, interval);

    console.log('🎬 RenderingEngine: Aggressive rendering mode enabled for background video playback');
  }

  public requestRender(): void {
    if (!this.isRendering) {
      // Single frame render
      requestAnimationFrame(() => this.render());
    }
  }

  public setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  public setErrorCallback(callback: (error: Error, context: string) => void): void {
    this.errorCallback = callback;
  }

  // Enhanced error handling and recovery methods
  private handleRenderingError(error: Error, context: string): void {
    const now = performance.now();
    this.consecutiveErrors++;
    this.lastErrorTime = now;

    console.error(`RenderingEngine: Error in ${context}:`, error);

    // Try to recover from rendering errors
    if (this.consecutiveErrors <= this.maxConsecutiveErrors) {
      this.attemptErrorRecovery(error, context);
    } else {
      // Too many consecutive errors - stop rendering to prevent crash
      console.error(`RenderingEngine: Too many consecutive errors (${this.consecutiveErrors}), stopping render loop`);
      this.stopRenderLoop();

      // Notify error callback if set
      if (this.errorCallback) {
        this.errorCallback(error, `Critical: ${this.consecutiveErrors} consecutive errors in ${context}`);
      }
    }
  }

  private handleShapeRenderingError(shape: Shape, error: Error): void {
    console.warn(`RenderingEngine: Failed to render shape ${shape.id} (type: ${shape.type}):`, error);

    // Mark shape as problematic but continue rendering other shapes
    try {
      shape.hide(); // Hide the problematic shape
    } catch (hideError) {
      console.warn(`RenderingEngine: Failed to hide problematic shape ${shape.id}:`, hideError);
    }

    // If this is a Text shape, try to render a fallback
    if (shape.type === 'text') {
      this.renderFallbackTextShape(shape);
    }
  }

  private attemptErrorRecovery(error: Error, context: string): void {
    this.errorRecoveryAttempts++;

    console.log(`RenderingEngine: Attempting error recovery #${this.errorRecoveryAttempts} for ${context}`);

    try {
      // Try to recover based on error type and context
      if (context === 'main_render') {
        // Main render error - try to clear and restart
        this.renderer.clear();

        // Try to recreate canvas context if needed
        const canvas = this.renderer.getCanvas();
        if (canvas) {
          this.renderer.setCanvas(canvas);
        }

        // Continue rendering with a simple retry
        setTimeout(() => {
          if (this.isRendering) {
            this.render();
          }
        }, 16); // Try again next frame
      }

      // Reset consecutive error count if we haven't had errors for a while
      if (performance.now() - this.lastErrorTime > 5000) { // 5 seconds
        this.consecutiveErrors = 0;
        this.errorRecoveryAttempts = 0;
      }

    } catch (recoveryError) {
      console.error(`RenderingEngine: Error recovery failed:`, recoveryError);
      this.consecutiveErrors++; // Count recovery failures as additional errors
    }
  }

  private renderFallbackTextShape(originalShape: Shape): void {
    try {
      // Create a simple fallback rectangle for failed text shapes
      const bounds = originalShape.getBounds();
      const ctx = this.renderer.getContext();

      if (ctx && ctx instanceof CanvasRenderingContext2D) {
        ctx.save();
        ctx.fillStyle = 'rgba(200, 100, 100, 0.3)'; // Light red background
        ctx.strokeStyle = 'rgba(200, 100, 100, 0.8)'; // Red border
        ctx.lineWidth = 1;

        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

        // Add error text if space allows
        if (bounds.width > 60 && bounds.height > 20) {
          ctx.fillStyle = 'rgba(100, 0, 0, 0.8)';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('TEXT ERROR', bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        }

        ctx.restore();
      }
    } catch (fallbackError) {
      console.warn('RenderingEngine: Fallback text rendering also failed:', fallbackError);
    }
  }

  // Reset error tracking when rendering is successful
  private resetErrorTracking(): void {
    this.consecutiveErrors = 0;
    this.errorRecoveryAttempts = 0;
  }

  public getErrorStatus(): {
    consecutiveErrors: number;
    recoveryAttempts: number;
    lastErrorTime: number;
    isHealthy: boolean;
  } {
    return {
      consecutiveErrors: this.consecutiveErrors,
      recoveryAttempts: this.errorRecoveryAttempts,
      lastErrorTime: this.lastErrorTime,
      isHealthy: this.consecutiveErrors === 0
    };
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  public getRendererStats() {
    return this.renderer.getStats();
  }

  public getSettings() {
    return this.renderer.getSettings();
  }

  public updateSettings(settings: Partial<RenderSettings>): void {
    this.renderer.updateSettings(settings);
  }

  public getCapabilities() {
    return {
      hardwareAccelerated: this.renderer.supportsHardwareAcceleration(),
      maxTextureSize: this.renderer.getMaxTextureSize ? this.renderer.getMaxTextureSize() : 4096,
      supportedFormats: ['png', 'jpeg', 'webp']
    };
  }

  public getViewport(): ViewportInfo {
    return { ...this.viewport };
  }

  public getShapeCollection(): ShapeCollection {
    return this.shapes;
  }

  public isHardwareAccelerated(): boolean {
    return this.renderer.supportsHardwareAcceleration();
  }

  public dispose(): void {
    this.stopRenderLoop();
    this.shapes.clear();
    this.renderer.dispose();
  }

  // Utility methods for common operations
  public fitToCanvas(): void {
    const bounds = this.shapes.getBounds();
    if (!bounds) return;

    const padding = 20;
    const scaleX = (this.viewport.width - padding * 2) / bounds.width;
    const scaleY = (this.viewport.height - padding * 2) / bounds.height;
    const scale = Math.min(scaleX, scaleY);

    // Center the content
    const offsetX = (this.viewport.width - bounds.width * scale) / 2 - bounds.x * scale;
    const offsetY = (this.viewport.height - bounds.height * scale) / 2 - bounds.y * scale;

    // Apply transformation to all shapes (this is a simplified approach)
    // In a full implementation, you'd use a proper viewport transformation
    this.requestRender();
  }

  public exportAsImage(format: 'png' | 'jpeg' = 'png', quality: number = 1): string {
    this.render(true);
    return this.renderer.getCanvas().toDataURL(`image/${format}`, quality);
  }
}