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

  constructor(options: RenderingEngineOptions) {
    this.enableDebug = options.enableDebug || false;
    this.renderer = new CanvasRenderer(options.canvas, options.settings);
    this.shapes = new ShapeCollection();
    this.viewport = this.createViewportInfo(options.canvas);
    this.performanceMetrics = this.initializeMetrics();

    this.bindMethods();
    this.setupEventListeners();
  }

  private bindMethods(): void {
    this.render = this.render.bind(this);
    this.renderLoop = this.renderLoop.bind(this);
  }

  private setupEventListeners(): void {
    // Handle canvas resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.resize(width, height);
      }
    });

    resizeObserver.observe(this.renderer.getCanvas());
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

  public resize(width: number, height: number): void {
    // Ensure minimum dimensions
    const minWidth = Math.max(width, 1);
    const minHeight = Math.max(height, 1);

    this.renderer.resize(minWidth, minHeight);
    this.viewport.width = minWidth;
    this.viewport.height = minHeight;
    this.viewport.visibleArea.width = minWidth;
    this.viewport.visibleArea.height = minHeight;
    this.requestRender();
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

    } catch (error) {
      console.error('Rendering error:', error);
      this.stopRenderLoop();
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
      console.error(`Error rendering shape ${shape.id}:`, error);
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

  public startRenderLoop(): void {
    if (this.isRendering) return;

    this.isRendering = true;
    this.renderLoop();
  }

  public stopRenderLoop(): void {
    this.isRendering = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
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

  public requestRender(): void {
    if (!this.isRendering) {
      // Single frame render
      requestAnimationFrame(() => this.render());
    }
  }

  public setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
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