import {
  FlexibleValue,
  FlexiblePosition,
  FlexibleSize,
  FlexibleRectangle,
  ContainerInfo,
  ResponsiveLayoutConfig,
  LayoutMode,
  ResponsiveBreakpoint,
  UnitType
} from '../types/responsive';
import { Point, Size, Rectangle } from '../types/geometry';

/**
 * Manages responsive layout calculations and conversions
 */
export class ResponsiveLayoutManager {
  private containerInfo: ContainerInfo;
  private breakpoints: ResponsiveBreakpoint[];
  private currentBreakpoint: ResponsiveBreakpoint | null = null;

  constructor(containerInfo: ContainerInfo, breakpoints: ResponsiveBreakpoint[] = []) {
    this.containerInfo = containerInfo;
    this.breakpoints = [...breakpoints];
    this.updateCurrentBreakpoint();
  }

  /**
   * Update container information and recalculate if needed
   */
  public updateContainer(containerInfo: Partial<ContainerInfo>): boolean {
    const oldContainer = { ...this.containerInfo };
    this.containerInfo = { ...this.containerInfo, ...containerInfo };

    // Check if aspect ratio changed significantly
    const aspectRatioChanged = Math.abs(
      this.containerInfo.aspectRatio - oldContainer.aspectRatio
    ) > 0.1;

    const sizeChanged =
      this.containerInfo.width !== oldContainer.width ||
      this.containerInfo.height !== oldContainer.height;

    if (sizeChanged || aspectRatioChanged) {
      this.updateCurrentBreakpoint();
      return true; // Indicates layouts need recalculation
    }

    return false;
  }

  /**
   * Convert flexible value to pixels
   */
  public toPixels(
    flexValue: FlexibleValue,
    contextSize?: number // For percent calculations
  ): number {
    const container = this.containerInfo;
    let pixels: number;

    switch (flexValue.unit) {
      case 'px':
        pixels = flexValue.value;
        break;

      case 'percent':
        if (contextSize === undefined) {
          console.warn('Percent unit requires context size');
          pixels = flexValue.value;
        } else {
          pixels = (flexValue.value / 100) * contextSize;
        }
        break;

      case 'vw':
        pixels = (flexValue.value / 100) * container.width;
        break;

      case 'vh':
        pixels = (flexValue.value / 100) * container.height;
        break;

      case 'vmin':
        pixels = (flexValue.value / 100) * Math.min(container.width, container.height);
        break;

      case 'vmax':
        pixels = (flexValue.value / 100) * Math.max(container.width, container.height);
        break;

      case 'rem':
        pixels = flexValue.value * container.fontSize;
        break;

      case 'em':
        pixels = flexValue.value * container.fontSize; // For now, same as rem
        break;

      default:
        console.warn(`Unsupported unit type: ${flexValue.unit}`);
        pixels = flexValue.value;
    }

    // Apply min/max constraints
    if (flexValue.min !== undefined) {
      pixels = Math.max(pixels, flexValue.min);
    }
    if (flexValue.max !== undefined) {
      pixels = Math.min(pixels, flexValue.max);
    }

    return pixels;
  }

  /**
   * Convert flexible position to pixel coordinates
   */
  public positionToPixels(flexPosition: FlexiblePosition): Point {
    return {
      x: this.toPixels(flexPosition.x, this.containerInfo.width),
      y: this.toPixels(flexPosition.y, this.containerInfo.height)
    };
  }

  /**
   * Convert flexible size to pixel dimensions
   */
  public sizeToPixels(flexSize: FlexibleSize): Size {
    return {
      width: this.toPixels(flexSize.width, this.containerInfo.width),
      height: this.toPixels(flexSize.height, this.containerInfo.height)
    };
  }

  /**
   * Convert flexible rectangle to pixel bounds
   */
  public rectangleToPixels(flexRect: FlexibleRectangle): Rectangle {
    return {
      x: this.toPixels(flexRect.x, this.containerInfo.width),
      y: this.toPixels(flexRect.y, this.containerInfo.height),
      width: this.toPixels(flexRect.width, this.containerInfo.width),
      height: this.toPixels(flexRect.height, this.containerInfo.height)
    };
  }

  /**
   * Apply layout mode to adjust positioning and sizing
   */
  public applyLayoutMode(
    rect: Rectangle,
    config: ResponsiveLayoutConfig
  ): Rectangle {
    const container = this.containerInfo;
    const mode = config.mode;

    // Calculate padding/margin in pixels
    const padding = config.padding ? this.toPixels(config.padding) : 0;
    const margin = config.margin ? this.toPixels(config.margin) : 0;

    // Available space after padding and margins
    const availableWidth = container.width - (padding + margin) * 2;
    const availableHeight = container.height - (padding + margin) * 2;
    const availableX = padding + margin;
    const availableY = padding + margin;

    let result = { ...rect };

    switch (mode) {
      case LayoutMode.STRETCH:
        // Fill entire available space
        result = {
          x: availableX,
          y: availableY,
          width: availableWidth,
          height: availableHeight
        };
        break;

      case LayoutMode.CENTER:
        // Center content within available space
        result.x = availableX + (availableWidth - result.width) / 2;
        result.y = availableY + (availableHeight - result.height) / 2;
        break;

      case LayoutMode.FIT_CONTENT:
        // Size based on content, but center if smaller than container
        if (result.width < availableWidth) {
          result.x = availableX + (availableWidth - result.width) / 2;
        }
        if (result.height < availableHeight) {
          result.y = availableY + (availableHeight - result.height) / 2;
        }
        break;

      case LayoutMode.FILL_CONTAINER:
        // Fill available space while maintaining aspect ratio
        const scaleX = availableWidth / result.width;
        const scaleY = availableHeight / result.height;
        const scale = Math.min(scaleX, scaleY);

        result.width *= scale;
        result.height *= scale;
        result.x = availableX + (availableWidth - result.width) / 2;
        result.y = availableY + (availableHeight - result.height) / 2;
        break;

      case LayoutMode.ASPECT_FIT:
        // Fit within container while maintaining aspect ratio
        const fitScaleX = availableWidth / result.width;
        const fitScaleY = availableHeight / result.height;
        const fitScale = Math.min(fitScaleX, fitScaleY);

        result.width *= fitScale;
        result.height *= fitScale;
        result.x = availableX + (availableWidth - result.width) / 2;
        result.y = availableY + (availableHeight - result.height) / 2;
        break;

      case LayoutMode.ASPECT_FILL:
        // Fill container while maintaining aspect ratio (may crop)
        const fillScaleX = availableWidth / result.width;
        const fillScaleY = availableHeight / result.height;
        const fillScale = Math.max(fillScaleX, fillScaleY);

        result.width *= fillScale;
        result.height *= fillScale;
        result.x = availableX + (availableWidth - result.width) / 2;
        result.y = availableY + (availableHeight - result.height) / 2;
        break;
    }

    // Apply size constraints if specified
    if (config.minSize) {
      const minSize = this.sizeToPixels(config.minSize);
      result.width = Math.max(result.width, minSize.width);
      result.height = Math.max(result.height, minSize.height);
    }

    if (config.maxSize) {
      const maxSize = this.sizeToPixels(config.maxSize);
      result.width = Math.min(result.width, maxSize.width);
      result.height = Math.min(result.height, maxSize.height);
    }

    return result;
  }

  /**
   * Get the current active breakpoint configuration
   */
  public getCurrentBreakpoint(): ResponsiveBreakpoint | null {
    return this.currentBreakpoint;
  }

  /**
   * Get merged layout configuration with breakpoint overrides
   */
  public getMergedConfig(baseConfig: ResponsiveLayoutConfig): ResponsiveLayoutConfig {
    if (!this.currentBreakpoint || !this.currentBreakpoint.config) {
      return baseConfig;
    }

    return {
      ...baseConfig,
      ...this.currentBreakpoint.config
    };
  }

  /**
   * Calculate optimal font size based on container size
   */
  public calculateOptimalFontSize(
    baseSize: FlexibleValue,
    scaleRatio: number = 1.0,
    minSize: number = 12,
    maxSize: number = 96
  ): number {
    const containerSize = Math.min(this.containerInfo.width, this.containerInfo.height);
    const baseFontSize = this.toPixels(baseSize);

    // Scale based on container size relative to a reference size (e.g., 1080p height)
    const referenceSize = 1080;
    const sizeRatio = containerSize / referenceSize;
    const scaledSize = baseFontSize * Math.pow(sizeRatio, scaleRatio);

    return Math.max(minSize, Math.min(maxSize, scaledSize));
  }

  /**
   * Check if container size falls within breakpoint range
   */
  private matchesBreakpoint(breakpoint: ResponsiveBreakpoint): boolean {
    const { width, height } = this.containerInfo;

    if (breakpoint.minWidth !== undefined && width < breakpoint.minWidth) {
      return false;
    }
    if (breakpoint.maxWidth !== undefined && width > breakpoint.maxWidth) {
      return false;
    }
    if (breakpoint.minHeight !== undefined && height < breakpoint.minHeight) {
      return false;
    }
    if (breakpoint.maxHeight !== undefined && height > breakpoint.maxHeight) {
      return false;
    }

    return true;
  }

  /**
   * Update the current active breakpoint based on container size
   */
  private updateCurrentBreakpoint(): void {
    // Find the first matching breakpoint (breakpoints should be ordered by priority)
    this.currentBreakpoint = this.breakpoints.find(bp =>
      this.matchesBreakpoint(bp)
    ) || null;
  }

  /**
   * Get container information
   */
  public getContainerInfo(): ContainerInfo {
    return { ...this.containerInfo };
  }

  /**
   * Convert pixel value back to flexible value (for editing/persistence)
   */
  public pixelsToFlexible(
    pixels: number,
    preferredUnit: UnitType = 'px',
    contextSize?: number
  ): FlexibleValue {
    const container = this.containerInfo;
    let value: number;

    switch (preferredUnit) {
      case 'px':
        value = pixels;
        break;

      case 'percent':
        if (contextSize === undefined) {
          console.warn('Percent unit requires context size');
          value = pixels;
        } else {
          value = (pixels / contextSize) * 100;
        }
        break;

      case 'vw':
        value = (pixels / container.width) * 100;
        break;

      case 'vh':
        value = (pixels / container.height) * 100;
        break;

      case 'vmin':
        value = (pixels / Math.min(container.width, container.height)) * 100;
        break;

      case 'vmax':
        value = (pixels / Math.max(container.width, container.height)) * 100;
        break;

      case 'rem':
        value = pixels / container.fontSize;
        break;

      case 'em':
        value = pixels / container.fontSize;
        break;

      default:
        value = pixels;
        preferredUnit = 'px';
    }

    return {
      value,
      unit: preferredUnit
    };
  }
}