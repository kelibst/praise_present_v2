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
  private loggedPreviewSizes?: Set<string>;

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
    console.log('🎨 ResponsiveRenderingEngine.render: START', {
      clearCanvas,
      enableResponsive: this.enableResponsive,
      timestamp: Date.now()
    });

    if (!this.enableResponsive) {
      // Use original rendering for non-responsive mode
      console.log('🎨 ResponsiveRenderingEngine.render: Using non-responsive mode');
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
      console.log('🎨 ResponsiveRenderingEngine.render: Frame started');

      if (clearCanvas) {
        renderer.clear();
        console.log('🎨 ResponsiveRenderingEngine.render: Canvas cleared');
      }

      const renderContext = this.createResponsiveRenderContext();
      const visibleShapes = this.getVisibleShapes();
      console.log('🎨 ResponsiveRenderingEngine.render: Got visible shapes', {
        count: visibleShapes.length
      });

      // Separate responsive and non-responsive shapes
      const { responsiveShapes, regularShapes } = this.categorizeShapes(visibleShapes);
      console.log('🎨 ResponsiveRenderingEngine.render: Shapes categorized', {
        responsive: responsiveShapes.length,
        regular: regularShapes.length
      });

      // Render regular shapes first
      for (const shape of regularShapes) {
        this.renderShape(shape, renderContext);
      }
      console.log('🎨 ResponsiveRenderingEngine.render: Regular shapes rendered');

      // Render responsive shapes with layout manager
      for (const shape of responsiveShapes) {
        this.renderResponsiveShape(shape, renderContext);
      }
      console.log('🎨 ResponsiveRenderingEngine.render: Responsive shapes rendered');

      renderer.endFrame();
      console.log('🎨 ResponsiveRenderingEngine.render: Frame ended');

      // Update performance metrics
      const endTime = performance.now();
      this.updatePerformanceMetrics(startTime, endTime, visibleShapes.length);

      console.log('🎨 ResponsiveRenderingEngine.render: COMPLETE', {
        renderTime: (endTime - startTime).toFixed(2) + 'ms',
        shapesRendered: visibleShapes.length
      });

      if (this.isDebugEnabled()) {
        this.renderDebugInfo(renderContext);
        this.renderResponsiveDebugInfo(renderContext);
      }

    } catch (error) {
      console.error('❌ ResponsiveRenderingEngine.render: ERROR', error);
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
    // Only log shape marking occasionally to reduce spam
    if (Math.random() < 0.2) {
      console.log('🔄 ResponsiveRenderingEngine: Marking responsive shapes dirty', { reason });
    }

    const allShapes = this.getAllShapes();
    let responsiveShapesMarked = 0;

    allShapes.forEach(shape => {
      if (shape instanceof ResponsiveShape && shape.responsive) {
        this.markShapeDirty(shape.id, reason);
        responsiveShapesMarked++;
      }
    });

    // Only log completion if we marked many shapes or occasionally
    if (responsiveShapesMarked > 3 || Math.random() < 0.2) {
      console.log(`✅ ResponsiveRenderingEngine: Marked ${responsiveShapesMarked} responsive shapes as dirty`);
    }
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
    // CRITICAL FIX: When responsive is disabled (preview mode with CSS scaling),
    // use actual canvas resolution, NOT display size
    // The industry-standard pattern is: canvas at full resolution + CSS scaling
    const canvasWidth = this.enableResponsive
      ? (canvas.clientWidth || canvas.width || 800)  // Responsive: use display size
      : canvas.width;  // Non-responsive: use actual canvas resolution (1920x1080)

    const canvasHeight = this.enableResponsive
      ? (canvas.clientHeight || canvas.height || 600)  // Responsive: use display size
      : canvas.height;  // Non-responsive: use actual canvas resolution (1920x1080)

    console.log('🎯 ResponsiveRenderingEngine.createContainerInfo: DETAILED DEBUG', {
      enableResponsive: this.enableResponsive,
      canvasActualWidth: canvas.width,
      canvasActualHeight: canvas.height,
      canvasClientWidth: canvas.clientWidth,
      canvasClientHeight: canvas.clientHeight,
      selectedWidth: canvasWidth,
      selectedHeight: canvasHeight,
      decision: this.enableResponsive ? 'USING CLIENT SIZE (responsive)' : 'USING CANVAS SIZE (non-responsive)'
    });

    // For small preview containers (ONLY when responsive is enabled),
    // use presentation coordinate scaling instead of actual canvas size to ensure proper text sizing
    let width = canvasWidth;
    let height = canvasHeight;
    let scaleFactor = 1;

    // Detect if this is a preview container based on size (only relevant for responsive mode)
    const isSmallPreview = this.enableResponsive && (canvasWidth < 600 || canvasHeight < 400);
    const PRESENTATION_WIDTH = 1920;
    const PRESENTATION_HEIGHT = 1080;

    if (isSmallPreview) {
      // Use presentation dimensions for font calculation, but track the scale
      scaleFactor = Math.min(canvasWidth / PRESENTATION_WIDTH, canvasHeight / PRESENTATION_HEIGHT);
      width = PRESENTATION_WIDTH;
      height = PRESENTATION_HEIGHT;

      // Only log preview detection once per size to reduce spam
      const sizeKey = `${canvasWidth}x${canvasHeight}`;
      if (!this.loggedPreviewSizes?.has(sizeKey)) {
        if (!this.loggedPreviewSizes) this.loggedPreviewSizes = new Set();
        this.loggedPreviewSizes.add(sizeKey);

        console.log('🎯 ResponsiveRenderingEngine: Detected preview container, using presentation scaling', {
          canvasSize: { width: canvasWidth, height: canvasHeight },
          presentationSize: { width, height },
          scaleFactor,
          baseFontSize
        });
      }
    } else if (!this.enableResponsive) {
      // Log that we're using fixed resolution (non-responsive mode)
      const sizeKey = `${canvasWidth}x${canvasHeight}`;
      if (!this.loggedPreviewSizes?.has(sizeKey)) {
        if (!this.loggedPreviewSizes) this.loggedPreviewSizes = new Set();
        this.loggedPreviewSizes.add(sizeKey);

        console.log('🎯 ResponsiveRenderingEngine: Using fixed resolution (responsive disabled)', {
          canvasResolution: { width, height },
          enableResponsive: this.enableResponsive,
          note: 'CSS handles all scaling'
        });
      }
    }

    return {
      width,
      height,
      aspectRatio: width / height,
      pixelRatio: window.devicePixelRatio || 1,
      fontSize: baseFontSize,
      // Add scale information for responsive shapes to use
      scaleInfo: {
        isPreview: isSmallPreview,
        scaleFactor,
        actualCanvasSize: { width: canvasWidth, height: canvasHeight }
      }
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
      console.log('🔄 ResponsiveRenderingEngine.resize: START', {
        width,
        height,
        enableResponsive: this.enableResponsive,
        timestamp: Date.now()
      });

      originalResize(width, height);
      console.log('🔄 ResponsiveRenderingEngine.resize: originalResize completed');

      if (this.enableResponsive) {
        console.log('🔄 ResponsiveRenderingEngine.resize: Updating responsive layout');

        const containerInfo = this.createContainerInfo(
          this.getRenderer().getCanvas(),
          this.layoutManager.getContainerInfo().fontSize
        );

        console.log('🔄 ResponsiveRenderingEngine.resize: Container info created', {
          width: containerInfo.width,
          height: containerInfo.height
        });

        const needsRecalculation = this.layoutManager.updateContainer(containerInfo);
        console.log('🔄 ResponsiveRenderingEngine.resize: Layout manager updated', {
          needsRecalculation
        });

        if (needsRecalculation) {
          // Use selective rendering to update only responsive shapes
          console.log('🔄 ResponsiveRenderingEngine.resize: Marking shapes dirty and requesting render');
          this.markResponsiveShapesDirty('container-resize');

          // CRITICAL FIX: Ensure immediate render after resize to prevent black screen
          // Request render will handle the rendering on next frame
          this.requestRender();
          console.log('🔄 ResponsiveRenderingEngine.resize: Render requested');
        }
      }

      console.log('🔄 ResponsiveRenderingEngine.resize: COMPLETE');
    };
  }

  /**
   * Update layout manager if container size changed
   */
  private updateLayoutManagerIfNeeded(): void {
    const canvas = this.getRenderer().getCanvas();
    const currentSize = {
      width: this.enableResponsive ? (canvas.clientWidth || canvas.width) : canvas.width,
      height: this.enableResponsive ? (canvas.clientHeight || canvas.height) : canvas.height
    };

    // Add tolerance for minor size changes to prevent flickering
    const tolerance = 2; // 2px tolerance
    const sizeChanged = !this.lastContainerSize ||
        Math.abs(this.lastContainerSize.width - currentSize.width) > tolerance ||
        Math.abs(this.lastContainerSize.height - currentSize.height) > tolerance;

    if (sizeChanged) {
      console.log('📏 ResponsiveRenderingEngine: Container size changed', {
        oldSize: this.lastContainerSize,
        newSize: currentSize,
        tolerance
      });

      const containerInfo = this.createContainerInfo(canvas);
      const needsRecalculation = this.layoutManager.updateContainer(containerInfo);
      this.lastContainerSize = { ...currentSize };

      // Only mark shapes dirty if layout manager says recalculation is needed
      if (needsRecalculation) {
        this.markResponsiveShapesDirty('container-resize');
      }
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