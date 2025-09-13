import { RenderContext, RenderOptions, RenderMode, RenderStats, ViewportInfo, RenderSettings, defaultRenderSettings } from '../types/rendering';
import { Rectangle, Point } from '../types/geometry';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private renderMode: RenderMode = '2d';
  private settings: RenderSettings;
  private stats: RenderStats;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fpsStartTime: number = 0;

  constructor(canvas: HTMLCanvasElement, settings: Partial<RenderSettings> = {}) {
    this.canvas = canvas;
    this.settings = { ...defaultRenderSettings, ...settings };
    this.stats = this.initializeStats();
    this.initialize();
  }

  private initializeStats(): RenderStats {
    return {
      totalShapes: 0,
      visibleShapes: 0,
      culledShapes: 0,
      drawCalls: 0,
      frameTime: 0,
      lastFrameTimestamp: 0
    };
  }

  private initialize(): void {
    this.detectHardwareAcceleration();
    this.setupCanvas();
    this.createRenderingContext();
  }

  private detectHardwareAcceleration(): void {
    if (!this.settings.enableGPUAcceleration) {
      this.renderMode = '2d';
      return;
    }

    // Test for WebGL support
    const tempCanvas = document.createElement('canvas');
    const webgl = tempCanvas.getContext('webgl2') || tempCanvas.getContext('webgl');

    if (webgl) {
      // For now, we'll use 2D context but this sets up for future WebGL implementation
      this.renderMode = '2d';
      if (this.settings.debugMode) {
        console.log('WebGL detected but using Canvas 2D for initial implementation');
      }
    } else {
      this.renderMode = '2d';
      if (this.settings.debugMode) {
        console.log('WebGL not available, using Canvas 2D');
      }
    }
  }

  private setupCanvas(): void {
    const pixelRatio = this.getPixelRatio();
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;

    // Set actual canvas size accounting for device pixel ratio
    this.canvas.width = displayWidth * pixelRatio;
    this.canvas.height = displayHeight * pixelRatio;

    // Scale back down using CSS
    this.canvas.style.width = displayWidth + 'px';
    this.canvas.style.height = displayHeight + 'px';
  }

  private createRenderingContext(): void {
    if (this.renderMode === '2d') {
      const options: CanvasRenderingContext2DSettings = {
        alpha: true,
        desynchronized: true, // Improves performance for animations
        colorSpace: 'srgb',
        willReadFrequently: false
      };

      this.ctx = this.canvas.getContext('2d', options);

      if (!this.ctx) {
        throw new Error('Failed to create 2D rendering context');
      }

      // Scale context to match device pixel ratio
      const pixelRatio = this.getPixelRatio();
      this.ctx.scale(pixelRatio, pixelRatio);

      // Set up initial rendering settings
      this.setupRenderingSettings();
    }
  }

  private setupRenderingSettings(): void {
    if (!this.ctx) return;

    // Enable optimizations based on quality setting
    switch (this.settings.quality) {
      case 'low':
        this.ctx.imageSmoothingEnabled = false;
        break;
      case 'medium':
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'medium';
        break;
      case 'high':
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        break;
      case 'ultra':
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        break;
    }
  }

  private getPixelRatio(): number {
    return Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
  }

  public createRenderContext(): RenderContext {
    if (!this.ctx) {
      throw new Error('Rendering context not initialized');
    }

    return {
      canvas: this.canvas,
      context: this.ctx,
      width: this.canvas.clientWidth,
      height: this.canvas.clientHeight,
      pixelRatio: this.getPixelRatio(),
      transformation: [1, 0, 0, 1, 0, 0]
    };
  }

  public startFrame(): void {
    const now = performance.now();
    if (this.lastFrameTime > 0) {
      this.stats.frameTime = now - this.lastFrameTime;
    }
    this.stats.lastFrameTimestamp = now;
    this.lastFrameTime = now;

    // Reset frame stats
    this.stats.drawCalls = 0;
    this.stats.totalShapes = 0;
    this.stats.visibleShapes = 0;
    this.stats.culledShapes = 0;

    // Update FPS calculation
    this.frameCount++;
    if (this.fpsStartTime === 0) {
      this.fpsStartTime = now;
    }
  }

  public endFrame(): void {
    const now = performance.now();
    const fpsElapsed = now - this.fpsStartTime;

    // Calculate FPS every second
    if (fpsElapsed >= 1000) {
      const fps = (this.frameCount * 1000) / fpsElapsed;
      this.frameCount = 0;
      this.fpsStartTime = now;
    }
  }

  public clear(color?: string): void {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

    if (color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.ctx.restore();
    this.stats.drawCalls++;
  }

  public setViewport(viewport: ViewportInfo): void {
    if (!this.ctx) return;

    // If we need to handle viewport transformations (pan, zoom), implement here
    // For now, we assume full canvas rendering
  }

  public isPointVisible(point: Point, viewport: ViewportInfo): boolean {
    return point.x >= viewport.visibleArea.x &&
           point.x <= viewport.visibleArea.x + viewport.visibleArea.width &&
           point.y >= viewport.visibleArea.y &&
           point.y <= viewport.visibleArea.y + viewport.visibleArea.height;
  }

  public isRectangleVisible(rect: Rectangle, viewport: ViewportInfo): boolean {
    const visible = viewport.visibleArea;
    return rect.x < visible.x + visible.width &&
           rect.x + rect.width > visible.x &&
           rect.y < visible.y + visible.height &&
           rect.y + rect.height > visible.y;
  }

  public resize(width: number, height: number): void {
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.setupCanvas();

    if (this.ctx) {
      const pixelRatio = this.getPixelRatio();
      this.ctx.scale(pixelRatio, pixelRatio);
      this.setupRenderingSettings();
    }
  }

  public getStats(): RenderStats {
    return { ...this.stats };
  }

  public getSettings(): RenderSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<RenderSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    // Re-initialize rendering settings if quality changed
    if (newSettings.quality !== undefined) {
      this.setupRenderingSettings();
    }

    // Re-detect hardware acceleration if GPU setting changed
    if (newSettings.enableGPUAcceleration !== undefined) {
      this.detectHardwareAcceleration();
      this.createRenderingContext();
    }
  }

  public supportsHardwareAcceleration(): boolean {
    const tempCanvas = document.createElement('canvas');
    const webgl = tempCanvas.getContext('webgl2') || tempCanvas.getContext('webgl');
    return webgl !== null;
  }

  public getRenderMode(): RenderMode {
    return this.renderMode;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D | WebGL2RenderingContext | null {
    return this.ctx;
  }

  public saveState(): void {
    if (this.ctx && this.ctx instanceof CanvasRenderingContext2D) {
      this.ctx.save();
    }
  }

  public restoreState(): void {
    if (this.ctx && this.ctx instanceof CanvasRenderingContext2D) {
      this.ctx.restore();
    }
  }

  public dispose(): void {
    this.ctx = null;
  }

  // Performance monitoring helpers
  public incrementShapeCount(): void {
    this.stats.totalShapes++;
  }

  public incrementVisibleShapeCount(): void {
    this.stats.visibleShapes++;
  }

  public incrementCulledShapeCount(): void {
    this.stats.culledShapes++;
  }

  public incrementDrawCallCount(): void {
    this.stats.drawCalls++;
  }
}