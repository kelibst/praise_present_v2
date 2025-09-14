import { Shape } from './Shape';
import { Point, Size, Rectangle } from '../types/geometry';
import { RenderContext } from '../types/rendering';
import { ShapeProps, ShapeStyle, ShapeType } from '../types/shapes';
import {
  FlexiblePosition,
  FlexibleSize,
  ResponsiveLayoutConfig,
  TypographyConfig,
  ResponsiveShapeProps,
  LayoutMode,
  createFlexiblePosition,
  createFlexibleSize,
  px,
  percent
} from '../types/responsive';
import { ResponsiveLayoutManager } from '../layout/ResponsiveLayoutManager';

/**
 * Extended shape properties that include responsive capabilities
 */
export interface ResponsiveShapePropsExtended extends ShapeProps {
  // Responsive positioning and sizing
  flexiblePosition?: FlexiblePosition;
  flexibleSize?: FlexibleSize;

  // Layout configuration
  layoutConfig?: ResponsiveLayoutConfig;

  // Typography configuration (for text-based shapes)
  typography?: TypographyConfig;

  // Responsive behavior toggles
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  adaptToContainer?: boolean;
}

/**
 * Base class for responsive shapes that adapt to container size changes
 */
export abstract class ResponsiveShape extends Shape {
  // Responsive properties
  public flexiblePosition: FlexiblePosition;
  public flexibleSize: FlexibleSize;
  public layoutConfig: ResponsiveLayoutConfig;
  public typography?: TypographyConfig;
  public responsive: boolean;
  public maintainAspectRatio: boolean;
  public adaptToContainer: boolean;

  // Cached layout manager for responsive calculations
  protected cachedLayoutManager?: ResponsiveLayoutManager;

  // Cached computed values
  private cachedPixelPosition: Point | null = null;
  private cachedPixelSize: Size | null = null;
  private cachedPixelBounds: Rectangle | null = null;
  private lastContainerInfo: string | null = null; // Hash of container info for cache invalidation

  constructor(props: ResponsiveShapePropsExtended = {}, style: ShapeStyle = {}) {
    super(props, style);

    // Initialize responsive properties with defaults or from props
    this.flexiblePosition = props.flexiblePosition || this.createDefaultFlexiblePosition();
    this.flexibleSize = props.flexibleSize || this.createDefaultFlexibleSize();
    this.layoutConfig = props.layoutConfig || this.createDefaultLayoutConfig();
    this.typography = props.typography;
    this.responsive = props.responsive !== false; // Default to true
    this.maintainAspectRatio = props.maintainAspectRatio !== false; // Default to true
    this.adaptToContainer = props.adaptToContainer !== false; // Default to true

    // Convert existing pixel values to flexible values if not provided
    if (!props.flexiblePosition) {
      this.flexiblePosition = createFlexiblePosition(px(this.position.x), px(this.position.y));
    }
    if (!props.flexibleSize) {
      this.flexibleSize = createFlexibleSize(px(this.size.width), px(this.size.height));
    }
  }

  /**
   * Update responsive properties and invalidate caches
   */
  public updateResponsiveProperties(props: Partial<ResponsiveShapePropsExtended>): void {
    if (props.flexiblePosition) {
      this.flexiblePosition = props.flexiblePosition;
    }
    if (props.flexibleSize) {
      this.flexibleSize = props.flexibleSize;
    }
    if (props.layoutConfig) {
      this.layoutConfig = { ...this.layoutConfig, ...props.layoutConfig };
    }
    if (props.typography) {
      this.typography = { ...this.typography, ...props.typography };
    }
    if (props.responsive !== undefined) {
      this.responsive = props.responsive;
    }
    if (props.maintainAspectRatio !== undefined) {
      this.maintainAspectRatio = props.maintainAspectRatio;
    }
    if (props.adaptToContainer !== undefined) {
      this.adaptToContainer = props.adaptToContainer;
    }

    this.invalidateCaches();
  }

  /**
   * Calculate pixel position using responsive layout manager
   */
  public calculatePixelPosition(layoutManager: ResponsiveLayoutManager): Point {
    const containerHash = this.getContainerHash(layoutManager);

    if (this.cachedPixelPosition && this.lastContainerInfo === containerHash) {
      return this.cachedPixelPosition;
    }

    if (!this.responsive) {
      // Use original pixel position if not responsive
      this.cachedPixelPosition = { ...this.position };
    } else {
      // Convert flexible position to pixels
      this.cachedPixelPosition = layoutManager.positionToPixels(this.flexiblePosition);
    }

    this.lastContainerInfo = containerHash;
    return this.cachedPixelPosition;
  }

  /**
   * Calculate pixel size using responsive layout manager
   */
  public calculatePixelSize(layoutManager: ResponsiveLayoutManager): Size {
    const containerHash = this.getContainerHash(layoutManager);

    if (this.cachedPixelSize && this.lastContainerInfo === containerHash) {
      return this.cachedPixelSize;
    }

    if (!this.responsive) {
      // Use original pixel size if not responsive
      this.cachedPixelSize = { ...this.size };
    } else {
      // Convert flexible size to pixels
      this.cachedPixelSize = layoutManager.sizeToPixels(this.flexibleSize);

      // Apply aspect ratio constraints if enabled
      if (this.maintainAspectRatio) {
        this.cachedPixelSize = this.applyAspectRatioConstraints(this.cachedPixelSize);
      }
    }

    // Apply defensive bounds checking to prevent zero/negative sizes
    this.cachedPixelSize = this.sanitizeSize(this.cachedPixelSize);

    this.lastContainerInfo = containerHash;
    return this.cachedPixelSize;
  }

  /**
   * Calculate pixel bounds using responsive layout manager
   */
  public calculatePixelBounds(layoutManager: ResponsiveLayoutManager): Rectangle {
    const containerHash = this.getContainerHash(layoutManager);

    if (this.cachedPixelBounds && this.lastContainerInfo === containerHash) {
      return this.cachedPixelBounds;
    }

    const pixelPosition = this.calculatePixelPosition(layoutManager);
    const pixelSize = this.calculatePixelSize(layoutManager);

    let bounds: Rectangle = {
      x: pixelPosition.x,
      y: pixelPosition.y,
      width: pixelSize.width,
      height: pixelSize.height
    };

    // Apply layout mode if responsive and container adaptation is enabled
    if (this.responsive && this.adaptToContainer) {
      const mergedConfig = layoutManager.getMergedConfig(this.layoutConfig);
      bounds = layoutManager.applyLayoutMode(bounds, mergedConfig);
    }

    this.cachedPixelBounds = bounds;
    this.lastContainerInfo = containerHash;
    return bounds;
  }

  /**
   * Override getBounds to use responsive calculations if layout manager is available
   */
  public getBounds(): Rectangle {
    // Try to use responsive calculations if available
    const layoutManager = this.getLayoutManagerFromContext();
    if (layoutManager && this.responsive) {
      return this.calculatePixelBounds(layoutManager);
    }

    // Fallback to original bounds calculation
    return super.getBounds();
  }

  /**
   * Update position and size from responsive calculations before rendering
   */
  protected updatePositionAndSizeForRender(layoutManager: ResponsiveLayoutManager): void {
    if (!this.responsive) return;

    const pixelPosition = this.calculatePixelPosition(layoutManager);
    const pixelSize = this.calculatePixelSize(layoutManager);

    // Update the base position and size for rendering
    this.position = pixelPosition;
    this.size = pixelSize;
  }

  /**
   * Responsive render method that updates position/size before rendering
   */
  public renderResponsive(context: RenderContext, layoutManager: ResponsiveLayoutManager): void {
    this.updatePositionAndSizeForRender(layoutManager);
    this.render(context);
  }

  /**
   * Set layout manager and invalidate cached calculations
   */
  public setLayoutManager(layoutManager: ResponsiveLayoutManager): void {
    this.cachedLayoutManager = layoutManager;
    this.invalidateLayout();
  }

  /**
   * Get current layout manager (for subclasses)
   */
  protected getLayoutManager(): ResponsiveLayoutManager | undefined {
    return this.cachedLayoutManager;
  }

  /**
   * Invalidate layout calculations (for subclasses to override)
   */
  protected invalidateLayout(): void {
    // Subclasses can override to clear cached calculations
  }

  /**
   * Create default flexible position from current position
   */
  private createDefaultFlexiblePosition(): FlexiblePosition {
    return createFlexiblePosition(px(this.position.x), px(this.position.y));
  }

  /**
   * Create default flexible size from current size
   */
  private createDefaultFlexibleSize(): FlexibleSize {
    return createFlexibleSize(px(this.size.width), px(this.size.height));
  }

  /**
   * Create default layout configuration
   */
  private createDefaultLayoutConfig(): ResponsiveLayoutConfig {
    return {
      mode: LayoutMode.FIT_CONTENT,
      padding: px(0),
      margin: px(0)
    };
  }

  /**
   * Apply aspect ratio constraints to size
   */
  private applyAspectRatioConstraints(size: Size): Size {
    if (this.layoutConfig.aspectRatio) {
      const targetRatio = this.layoutConfig.aspectRatio;
      const currentRatio = size.width / size.height;

      if (Math.abs(currentRatio - targetRatio) > 0.01) {
        // Adjust size to match target aspect ratio
        if (currentRatio > targetRatio) {
          // Too wide, reduce width
          size.width = size.height * targetRatio;
        } else {
          // Too tall, reduce height
          size.height = size.width / targetRatio;
        }
      }
    }

    return size;
  }

  /**
   * Sanitize size to ensure valid dimensions
   */
  private sanitizeSize(size: Size): Size {
    const minWidth = 1; // Minimum 1px width
    const minHeight = 1; // Minimum 1px height
    const maxDimension = 10000; // Maximum reasonable dimension

    return {
      width: Math.max(minWidth, Math.min(maxDimension, Math.abs(size.width) || minWidth)),
      height: Math.max(minHeight, Math.min(maxDimension, Math.abs(size.height) || minHeight))
    };
  }

  /**
   * Generate hash of container info for cache invalidation
   */
  private getContainerHash(layoutManager: ResponsiveLayoutManager): string {
    const container = layoutManager.getContainerInfo();
    const breakpoint = layoutManager.getCurrentBreakpoint();

    return JSON.stringify({
      width: container.width,
      height: container.height,
      pixelRatio: container.pixelRatio,
      fontSize: container.fontSize,
      breakpoint: breakpoint?.name
    });
  }

  /**
   * Try to get layout manager from render context or global state
   */
  private getLayoutManagerFromContext(): ResponsiveLayoutManager | null {
    // This would be injected through the render context in a real implementation
    // For now, return null to fallback to non-responsive behavior
    return null;
  }

  /**
   * Invalidate all cached values
   */
  private invalidateCaches(): void {
    this.cachedPixelPosition = null;
    this.cachedPixelSize = null;
    this.cachedPixelBounds = null;
    this.lastContainerInfo = null;
  }

  /**
   * Get responsive properties for serialization/persistence
   */
  public getResponsiveProperties(): ResponsiveShapePropsExtended {
    return {
      flexiblePosition: this.flexiblePosition,
      flexibleSize: this.flexibleSize,
      layoutConfig: this.layoutConfig,
      typography: this.typography,
      responsive: this.responsive,
      maintainAspectRatio: this.maintainAspectRatio,
      adaptToContainer: this.adaptToContainer
    };
  }

  /**
   * Convert to percentage-based flexible units for easier editing
   */
  public convertToPercentageUnits(containerSize: Size): void {
    if (!this.responsive) return;

    // Convert position to percentages
    this.flexiblePosition = createFlexiblePosition(
      percent((this.position.x / containerSize.width) * 100),
      percent((this.position.y / containerSize.height) * 100)
    );

    // Convert size to percentages
    this.flexibleSize = createFlexibleSize(
      percent((this.size.width / containerSize.width) * 100),
      percent((this.size.height / containerSize.height) * 100)
    );

    this.invalidateCaches();
  }

  /**
   * Convert to viewport-based flexible units
   */
  public convertToViewportUnits(containerSize: Size): void {
    if (!this.responsive) return;

    const { vw, vh } = require('../types/responsive');

    // Convert position to viewport units
    this.flexiblePosition = createFlexiblePosition(
      vw((this.position.x / containerSize.width) * 100),
      vh((this.position.y / containerSize.height) * 100)
    );

    // Convert size to viewport units
    this.flexibleSize = createFlexibleSize(
      vw((this.size.width / containerSize.width) * 100),
      vh((this.size.height / containerSize.height) * 100)
    );

    this.invalidateCaches();
  }
}