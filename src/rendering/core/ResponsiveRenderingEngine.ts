import { SelectiveRenderingEngine, SelectiveRenderingOptions } from './SelectiveRenderingEngine';
import { ResponsiveShape } from './ResponsiveShape';
import { ResponsiveLayoutManager } from '../layout/ResponsiveLayoutManager';
import { TypographyScaler } from '../layout/TypographyScaler';
import { AdvancedLayoutManager, AdvancedLayoutMode } from '../layout/AdvancedLayoutModes';
import { Shape } from './Shape';
import { RenderContext } from '../types/rendering';
import {
  ContainerInfo,
  ResponsiveBreakpoint,
  LayoutMode
} from '../types/responsive';

/**
 * Options for responsive rendering engine
 */
export interface ResponsiveRenderingEngineOptions extends SelectiveRenderingOptions {
  breakpoints?: ResponsiveBreakpoint[];
  enableResponsive?: boolean;
  baseFontSize?: number;
}

/**
 * Enhanced rendering engine with responsive layout capabilities and selective rendering
 */
export class ResponsiveRenderingEngine extends SelectiveRenderingEngine {
  private layoutManager: ResponsiveLayoutManager;
  private typographyScaler: TypographyScaler;
  private advancedLayoutManager: AdvancedLayoutManager;
  private enableResponsive: boolean;
  private currentAdvancedLayoutMode: AdvancedLayoutMode | null = null;
  private lastContainerSize: { width: number; height: number } | null = null;

  constructor(options: ResponsiveRenderingEngineOptions) {
    super(options);

    this.enableResponsive = options.enableResponsive !== false;

    // Initialize responsive components
    const canvas = options.canvas;
    const containerInfo = this.createContainerInfo(canvas, options.baseFontSize);

    this.layoutManager = new ResponsiveLayoutManager(
      containerInfo,
      options.breakpoints || this.createDefaultBreakpoints()
    );

    this.typographyScaler = new TypographyScaler();

    // Initialize advanced layout manager
    this.advancedLayoutManager = new AdvancedLayoutManager(
      containerInfo,
      options.breakpoints || this.createDefaultBreakpoints()
    );

    // Override the resize method to update responsive layout
    this.setupResponsiveResizeHandling();
  }

  /**
   * Render with responsive layout calculations
   */
  public render(clearCanvas: boolean = true): void {
    if (!this.enableResponsive) {
      // Use original rendering for non-responsive mode
      super.render(clearCanvas);
      return;
    }

    const startTime = performance.now();

    try {
      // Check if container size changed and update layout manager
      this.updateLayoutManagerIfNeeded();

      // Start rendering frame
      const renderer = this.getRenderer();
      renderer.startFrame();

      if (clearCanvas) {
        renderer.clear();
      }

      const renderContext = this.createResponsiveRenderContext();
      const visibleShapes = this.getVisibleShapes();

      // Separate responsive and non-responsive shapes
      const { responsiveShapes, regularShapes } = this.categorizeShapes(visibleShapes);

      // Render regular shapes first
      for (const shape of regularShapes) {
        this.renderShape(shape, renderContext);
      }

      // Render responsive shapes with layout manager
      for (const shape of responsiveShapes) {
        this.renderResponsiveShape(shape, renderContext);
      }

      renderer.endFrame();

      // Update performance metrics
      const endTime = performance.now();
      this.updatePerformanceMetrics(startTime, endTime, visibleShapes.length);

      if (this.isDebugEnabled()) {
        this.renderDebugInfo(renderContext);
        this.renderResponsiveDebugInfo(renderContext);
      }

    } catch (error) {
      console.error('Responsive rendering error:', error);
      this.stopRenderLoop();
    }
  }

  /**
   * Add responsive shape to the engine with smart tracking
   */
  public addResponsiveShape(shape: ResponsiveShape): void {
    this.addShape(shape);

    // Track responsive shape changes more intelligently
    if (shape.responsive) {
      console.log('🎯 ResponsiveRenderingEngine: Added responsive shape', {
        shapeId: shape.id,
        hasFlexiblePosition: !!shape.flexiblePosition,
        hasLayoutConfig: !!shape.layoutConfig
      });
    }
  }

  /**
   * Update responsive configuration for existing shapes
   */
  public updateResponsiveConfiguration(
    shapeId: string,
    config: {
      responsive?: boolean;
      layoutMode?: LayoutMode;
      maintainAspectRatio?: boolean;
    }
  ): boolean {
    const shape = this.findShapeById(shapeId);

    if (shape instanceof ResponsiveShape) {
      if (config.responsive !== undefined) {
        shape.responsive = config.responsive;
      }
      if (config.layoutMode !== undefined) {
        shape.layoutConfig.mode = config.layoutMode;
      }
      if (config.maintainAspectRatio !== undefined) {
        shape.maintainAspectRatio = config.maintainAspectRatio;
      }

      // Use selective rendering to update only this shape
      this.markShapeDirty(shapeId, 'responsive-config-change');
      return true;
    }

    return false;
  }

  /**
   * Intelligently mark responsive shapes as dirty when container changes
   */
  private markResponsiveShapesDirty(reason: string): void {
    console.log('🔄 ResponsiveRenderingEngine: Marking responsive shapes dirty', { reason });

    const allShapes = this.getAllShapes();
    let responsiveShapesMarked = 0;

    allShapes.forEach(shape => {
      if (shape instanceof ResponsiveShape && shape.responsive) {
        this.markShapeDirty(shape.id, reason);
        responsiveShapesMarked++;
      }
    });

    console.log(`✅ ResponsiveRenderingEngine: Marked ${responsiveShapesMarked} responsive shapes as dirty`);
  }

  /**
   * Convert existing shape to responsive shape
   */
  public convertToResponsiveShape(shapeId: string): boolean {
    const shape = this.findShapeById(shapeId);

    if (shape && !(shape instanceof ResponsiveShape)) {
      // Create a new responsive shape based on the existing shape
      // This would need specific implementations for each shape type
      console.warn('Shape conversion not implemented for type:', shape.type);
      return false;
    }

    return true;
  }

  /**
   * Get layout manager for external use
   */
  public getLayoutManager(): ResponsiveLayoutManager {
    return this.layoutManager;
  }

  /**
   * Get typography scaler for external use
   */
  public getTypographyScaler(): TypographyScaler {
    return this.typographyScaler;
  }

  /**
   * Enable or disable responsive behavior globally
   */
  public setResponsiveEnabled(enabled: boolean): void {
    if (this.enableResponsive !== enabled) {
      this.enableResponsive = enabled;
      this.requestRender();
    }
  }

  /**
   * Enable or disable selective rendering (inherited from SelectiveRenderingEngine)
   */
  public setSelectiveRenderingEnabled(enabled: boolean): void {
    super.setSelectiveRenderingEnabled(enabled);
  }

  /**
   * Get selective rendering status
   */
  public isSelectiveRenderingEnabled(): boolean {
    return this.enableSelectiveRendering;
  }

  /**
   * Set advanced layout mode for content-aware layouts
   */
  public setAdvancedLayoutMode(mode: AdvancedLayoutMode | null): void {
    if (this.currentAdvancedLayoutMode !== mode) {
      this.currentAdvancedLayoutMode = mode;
      this.applyAdvancedLayoutMode();
      this.requestRender();

      console.log('🎯 ResponsiveRenderingEngine: Advanced layout mode changed', {
        previousMode: this.currentAdvancedLayoutMode,
        newMode: mode,
        enableResponsive: this.enableResponsive
      });
    }
  }

  /**
   * Get current advanced layout mode
   */
  public getCurrentAdvancedLayoutMode(): AdvancedLayoutMode | null {
    return this.currentAdvancedLayoutMode;
  }

  /**
   * Apply advanced layout mode to all responsive shapes
   */
  private applyAdvancedLayoutMode(): void {
    if (!this.currentAdvancedLayoutMode || !this.enableResponsive) {
      return;
    }

    const allShapes = this.getAllShapes();
    const containerInfo = this.layoutManager.getContainerInfo();

    console.log('🔧 ResponsiveRenderingEngine: Applying advanced layout mode', {
      mode: this.currentAdvancedLayoutMode,
      shapeCount: allShapes.length,
      containerSize: `${containerInfo.width}x${containerInfo.height}`
    });

    // Apply layout configuration to responsive shapes
    const layoutConfig = this.advancedLayoutManager.getLayoutConfig(
      this.currentAdvancedLayoutMode,
      containerInfo
    );

    let processedShapes = 0;
    allShapes.forEach(shape => {
      if (shape instanceof ResponsiveShape && shape.responsive) {
        // Apply layout-specific configuration
        this.advancedLayoutManager.applyLayoutToShape(shape, layoutConfig, containerInfo);
        this.markShapeDirty(shape.id, 'advanced-layout-change');
        processedShapes++;
      }
    });

    console.log(`✅ ResponsiveRenderingEngine: Applied advanced layout to ${processedShapes} responsive shapes`);
  }

  /**
   * Get advanced layout manager for external access
   */
  public getAdvancedLayoutManager(): AdvancedLayoutManager {
    return this.advancedLayoutManager;
  }

  /**
   * Update breakpoints configuration
   */
  public updateBreakpoints(breakpoints: ResponsiveBreakpoint[]): void {
    this.layoutManager = new ResponsiveLayoutManager(
      this.layoutManager.getContainerInfo(),
      breakpoints
    );
    this.requestRender();
  }

  /**
   * Get current responsive status and metrics
   */
  public getResponsiveStatus(): {
    enabled: boolean;
    containerInfo: ContainerInfo;
    currentBreakpoint: ResponsiveBreakpoint | null;
    responsiveShapeCount: number;
    totalShapeCount: number;
  } {
    const allShapes = this.getAllShapes();
    const responsiveShapeCount = allShapes.filter(
      shape => shape instanceof ResponsiveShape && shape.responsive
    ).length;

    return {
      enabled: this.enableResponsive,
      containerInfo: this.layoutManager.getContainerInfo(),
      currentBreakpoint: this.layoutManager.getCurrentBreakpoint(),
      responsiveShapeCount,
      totalShapeCount: allShapes.length
    };
  }

  /**
   * Create container info from canvas and options
   */
  private createContainerInfo(canvas: HTMLCanvasElement, baseFontSize: number = 16): ContainerInfo {
    const width = canvas.clientWidth || canvas.width || 800;
    const height = canvas.clientHeight || canvas.height || 600;

    return {
      width,
      height,
      aspectRatio: width / height,
      pixelRatio: window.devicePixelRatio || 1,
      fontSize: baseFontSize
    };
  }

  /**
   * Create default responsive breakpoints
   */
  private createDefaultBreakpoints(): ResponsiveBreakpoint[] {
    return [
      {
        name: 'mobile',
        maxWidth: 768,
        config: {
          mode: LayoutMode.STRETCH,
          padding: { value: 8, unit: 'px' }
        }
      },
      {
        name: 'tablet',
        minWidth: 769,
        maxWidth: 1024,
        config: {
          mode: LayoutMode.CENTER,
          padding: { value: 16, unit: 'px' }
        }
      },
      {
        name: 'desktop',
        minWidth: 1025,
        config: {
          mode: LayoutMode.FIT_CONTENT,
          padding: { value: 24, unit: 'px' }
        }
      }
    ];
  }

  /**
   * Setup responsive resize handling
   */
  private setupResponsiveResizeHandling(): void {
    // Override the resize method to include responsive updates
    const originalResize = this.resize.bind(this);

    this.resize = (width: number, height: number) => {
      originalResize(width, height);

      if (this.enableResponsive) {
        const containerInfo = this.createContainerInfo(
          this.getRenderer().getCanvas(),
          this.layoutManager.getContainerInfo().fontSize
        );

        const needsRecalculation = this.layoutManager.updateContainer(containerInfo);

        if (needsRecalculation) {
          // Use selective rendering to update only responsive shapes
          this.markResponsiveShapesDirty('container-resize');
        }
      }
    };
  }

  /**
   * Update layout manager if container size changed
   */
  private updateLayoutManagerIfNeeded(): void {
    const canvas = this.getRenderer().getCanvas();
    const currentSize = {
      width: canvas.clientWidth || canvas.width,
      height: canvas.clientHeight || canvas.height
    };

    if (!this.lastContainerSize ||
        this.lastContainerSize.width !== currentSize.width ||
        this.lastContainerSize.height !== currentSize.height) {

      const containerInfo = this.createContainerInfo(canvas);
      this.layoutManager.updateContainer(containerInfo);
      this.lastContainerSize = currentSize;
    }
  }

  /**
   * Create render context with responsive layout manager
   */
  private createResponsiveRenderContext(): RenderContext {
    const baseContext = this.getRenderer().createRenderContext();

    return {
      ...baseContext,
      layoutManager: this.layoutManager
    };
  }

  /**
   * Categorize shapes into responsive and regular types
   */
  private categorizeShapes(shapes: Shape[]): {
    responsiveShapes: ResponsiveShape[];
    regularShapes: Shape[];
  } {
    const responsiveShapes: ResponsiveShape[] = [];
    const regularShapes: Shape[] = [];

    for (const shape of shapes) {
      if (shape instanceof ResponsiveShape && shape.responsive) {
        responsiveShapes.push(shape);
      } else {
        regularShapes.push(shape);
      }
    }

    return { responsiveShapes, regularShapes };
  }

  /**
   * Render responsive shape with layout calculations
   */
  private renderResponsiveShape(
    shape: ResponsiveShape,
    context: RenderContext
  ): void {
    if (!shape.visible || shape.opacity <= 0) return;

    // Use responsive render method with layout manager
    if (context.layoutManager) {
      shape.renderResponsive(context, context.layoutManager);
    } else {
      // Fallback to regular render
      shape.render(context);
    }
  }

  /**
   * Render debug information for responsive features
   */
  private renderResponsiveDebugInfo(context: RenderContext): void {
    if (!(context.context instanceof CanvasRenderingContext2D)) return;

    const ctx = context.context;
    const containerInfo = this.layoutManager.getContainerInfo();
    const breakpoint = this.layoutManager.getCurrentBreakpoint();

    ctx.save();
    ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
    ctx.font = '12px monospace';

    let y = 80; // Start below regular debug info
    const lineHeight = 16;

    // Container info
    ctx.fillText(`Container: ${containerInfo.width}x${containerInfo.height}`, 10, y);
    y += lineHeight;

    ctx.fillText(`Aspect Ratio: ${containerInfo.aspectRatio.toFixed(2)}`, 10, y);
    y += lineHeight;

    ctx.fillText(`Base Font Size: ${containerInfo.fontSize}px`, 10, y);
    y += lineHeight;

    // Current breakpoint
    if (breakpoint) {
      ctx.fillText(`Breakpoint: ${breakpoint.name}`, 10, y);
      y += lineHeight;
    }

    // Responsive shapes count
    const status = this.getResponsiveStatus();
    ctx.fillText(
      `Responsive Shapes: ${status.responsiveShapeCount}/${status.totalShapeCount}`,
      10, y
    );

    ctx.restore();
  }

  /**
   * Get the internal renderer (protected method access)
   */
  protected getResponsiveRenderer(): any {
    return (this as any).renderer;
  }

  /**
   * Check if debug is enabled (protected method access)
   */
  private isDebugEnabled(): boolean {
    return (this as any).enableDebug;
  }
}