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
    let displayWidth = this.canvas.clientWidth;
    let displayHeight = this.canvas.clientHeight;

    // Fallback to canvas attributes if clientWidth/clientHeight are 0
    if (displayWidth === 0 || displayHeight === 0) {
      displayWidth = this.canvas.width || 800;
      displayHeight = this.canvas.height || 600;
    }

    // Set actual canvas size accounting for device pixel ratio
    this.canvas.width = displayWidth * pixelRatio;
    this.canvas.height = displayHeight * pixelRatio;

    // Scale back down using CSS
    this.canvas.style.width = displayWidth + 'px';
    this.canvas.style.height = displayHeight + 'px';

    // Set up context loss/restore event listeners
    this.setupContextEventHandlers();
  }

  private setupContextEventHandlers(): void {
    // Remove existing listeners to prevent duplicates
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    // Add context loss/restore handlers
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost.bind(this), false);
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored.bind(this), false);

    // For 2D context, we need to detect context loss differently
    // Canvas 2D doesn't have built-in context loss events like WebGL
  }

  private handleContextLost = (event: Event) => {
    if (this.settings.debugMode) {
      console.warn('CanvasRenderer: Context lost event detected');
    }
    event.preventDefault(); // Prevent default context restoration
    this.ctx = null;
  };

  private handleContextRestored = (event: Event) => {
    if (this.settings.debugMode) {
      console.log('CanvasRenderer: Context restored event detected');
    }
    // Recreate the rendering context
    this.createRenderingContext();
  };

  private createRenderingContext(): void {
    if (this.settings.debugMode) {
      console.log('Creating rendering context, renderMode:', this.renderMode);
      console.log('Canvas dimensions at context creation:', {
        clientWidth: this.canvas.clientWidth,
        clientHeight: this.canvas.clientHeight,
        width: this.canvas.width,
        height: this.canvas.height,
        offsetWidth: this.canvas.offsetWidth,
        offsetHeight: this.canvas.offsetHeight
      });
    }

    if (this.renderMode === '2d') {
      const options: CanvasRenderingContext2DSettings = {
        alpha: true,
        desynchronized: true, // Improves performance for animations
        colorSpace: 'srgb',
        willReadFrequently: false
      };

      this.ctx = this.canvas.getContext('2d', options);

      if (this.settings.debugMode) {
        console.log('Context created:', !!this.ctx);
      }

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
      console.warn('Rendering context lost, attempting to recreate...');
      try {
        this.createRenderingContext();
      } catch (error) {
        console.error('Failed to recreate rendering context:', error);
        throw new Error('Rendering context not initialized and failed to recreate');
      }
    }

    if (!this.ctx) {
      throw new Error('Rendering context not initialized');
    }

    let width = this.canvas.clientWidth;
    let height = this.canvas.clientHeight;

    // Fallback to canvas attributes if clientWidth/clientHeight are 0
    if (width === 0 || height === 0) {
      width = this.canvas.width || 800;
      height = this.canvas.height || 600;
    }

    return {
      canvas: this.canvas,
      context: this.ctx,
      width: width,
      height: height,
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
    // Ensure minimum dimensions
    const minWidth = Math.max(width, 1);
    const minHeight = Math.max(height, 1);

    // Check if resize is actually needed
    const currentWidth = parseInt(this.canvas.style.width) || this.canvas.clientWidth;
    const currentHeight = parseInt(this.canvas.style.height) || this.canvas.clientHeight;

    if (currentWidth === minWidth && currentHeight === minHeight) {
      return; // No resize needed
    }

    // Store current context settings before resize
    const contextSettings = this.preserveContextSettings();

    this.canvas.style.width = minWidth + 'px';
    this.canvas.style.height = minHeight + 'px';
    this.setupCanvas();

    // Only recreate context if it was lost or if critical dimension change
    if (!this.ctx || this.isContextLost()) {
      this.createRenderingContext();
    } else {
      // Restore context settings and scale for new canvas size
      this.restoreContextSettings(contextSettings);
      const pixelRatio = this.getPixelRatio();
      if (this.ctx) {
        this.ctx.scale(pixelRatio, pixelRatio);
      }
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

  public setCanvas(newCanvas: HTMLCanvasElement): void {
    if (this.canvas === newCanvas) {
      return; // No change needed
    }

    // Store current settings to apply to new canvas
    const currentSettings = { ...this.settings };

    this.canvas = newCanvas;
    this.settings = currentSettings;

    // Reinitialize with the new canvas
    this.initialize();

    if (this.settings.debugMode) {
      console.log('CanvasRenderer: Canvas changed and reinitialized');
    }
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
    // Clean up event listeners
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.ctx = null;
  }

  // Context preservation and recovery methods
  private preserveContextSettings(): any {
    if (!this.ctx || !(this.ctx instanceof CanvasRenderingContext2D)) {
      return null;
    }

    // Store critical context properties
    return {
      fillStyle: this.ctx.fillStyle,
      strokeStyle: this.ctx.strokeStyle,
      lineWidth: this.ctx.lineWidth,
      lineCap: this.ctx.lineCap,
      lineJoin: this.ctx.lineJoin,
      globalAlpha: this.ctx.globalAlpha,
      globalCompositeOperation: this.ctx.globalCompositeOperation,
      imageSmoothingEnabled: this.ctx.imageSmoothingEnabled,
      imageSmoothingQuality: this.ctx.imageSmoothingQuality,
      shadowColor: this.ctx.shadowColor,
      shadowBlur: this.ctx.shadowBlur,
      shadowOffsetX: this.ctx.shadowOffsetX,
      shadowOffsetY: this.ctx.shadowOffsetY,
      font: this.ctx.font,
      textAlign: this.ctx.textAlign,
      textBaseline: this.ctx.textBaseline
    };
  }

  private restoreContextSettings(settings: any): void {
    if (!this.ctx || !(this.ctx instanceof CanvasRenderingContext2D) || !settings) {
      return;
    }

    try {
      // Restore context properties
      this.ctx.fillStyle = settings.fillStyle;
      this.ctx.strokeStyle = settings.strokeStyle;
      this.ctx.lineWidth = settings.lineWidth;
      this.ctx.lineCap = settings.lineCap;
      this.ctx.lineJoin = settings.lineJoin;
      this.ctx.globalAlpha = settings.globalAlpha;
      this.ctx.globalCompositeOperation = settings.globalCompositeOperation;
      this.ctx.imageSmoothingEnabled = settings.imageSmoothingEnabled;
      this.ctx.imageSmoothingQuality = settings.imageSmoothingQuality;
      this.ctx.shadowColor = settings.shadowColor;
      this.ctx.shadowBlur = settings.shadowBlur;
      this.ctx.shadowOffsetX = settings.shadowOffsetX;
      this.ctx.shadowOffsetY = settings.shadowOffsetY;
      this.ctx.font = settings.font;
      this.ctx.textAlign = settings.textAlign;
      this.ctx.textBaseline = settings.textBaseline;

      // Re-apply render settings
      this.setupRenderingSettings();
    } catch (error) {
      if (this.settings.debugMode) {
        console.warn('CanvasRenderer: Failed to restore context settings:', error);
      }
      // If restoration fails, recreate the context
      this.createRenderingContext();
    }
  }

  private isContextLost(): boolean {
    if (!this.ctx) return true;

    // Try to perform a simple operation to detect context loss
    try {
      if (this.ctx instanceof CanvasRenderingContext2D) {
        // Save current state
        const currentFillStyle = this.ctx.fillStyle;

        // Try to change and restore a property
        this.ctx.fillStyle = '#000000';
        this.ctx.fillStyle = currentFillStyle;

        return false; // Context is working
      }
    } catch (error) {
      if (this.settings.debugMode) {
        console.warn('CanvasRenderer: Context loss detected:', error);
      }
      return true;
    }

    return true; // Assume lost if we can't verify
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