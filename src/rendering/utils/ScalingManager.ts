import { Size, Point, Rectangle } from '../types/geometry';

export interface ScaleInfo {
  scaleX: number;
  scaleY: number;
  uniformScale: number;
  offsetX: number;
  offsetY: number;
  scaledWidth: number;
  scaledHeight: number;
}

export interface ViewportConfig {
  targetResolution: Size;  // e.g., 1920x1080 for live display
  previewSize: Size;       // e.g., 400x225 for preview container
  maintainAspectRatio: boolean;
  allowUpscaling: boolean;
}

/**
 * ScalingManager handles all viewport scaling calculations for consistent
 * preview-to-live display representation
 */
export class ScalingManager {
  private targetResolution: Size;
  private previewSize: Size;
  private maintainAspectRatio: boolean;
  private allowUpscaling: boolean;
  private scaleInfo: ScaleInfo;

  constructor(config: ViewportConfig) {
    this.targetResolution = { ...config.targetResolution };
    this.previewSize = { ...config.previewSize };
    this.maintainAspectRatio = config.maintainAspectRatio;
    this.allowUpscaling = config.allowUpscaling;
    this.scaleInfo = this.calculateScale();
  }

  /**
   * Calculate optimal scaling to fit target resolution into preview size
   */
  private calculateScale(): ScaleInfo {
    const targetAspect = this.targetResolution.width / this.targetResolution.height;
    const previewAspect = this.previewSize.width / this.previewSize.height;

    let scaleX = this.previewSize.width / this.targetResolution.width;
    let scaleY = this.previewSize.height / this.targetResolution.height;

    if (this.maintainAspectRatio) {
      // Use uniform scaling to maintain aspect ratio
      const uniformScale = Math.min(scaleX, scaleY);

      // Prevent upscaling if not allowed
      const finalScale = this.allowUpscaling ? uniformScale : Math.min(uniformScale, 1.0);

      scaleX = finalScale;
      scaleY = finalScale;
    } else {
      // Non-uniform scaling may distort aspect ratio
      if (!this.allowUpscaling) {
        scaleX = Math.min(scaleX, 1.0);
        scaleY = Math.min(scaleY, 1.0);
      }
    }

    const scaledWidth = this.targetResolution.width * scaleX;
    const scaledHeight = this.targetResolution.height * scaleY;

    // Calculate centering offsets (for letterboxing/pillarboxing)
    const offsetX = (this.previewSize.width - scaledWidth) / 2;
    const offsetY = (this.previewSize.height - scaledHeight) / 2;

    return {
      scaleX,
      scaleY,
      uniformScale: Math.min(scaleX, scaleY),
      offsetX: Math.max(0, offsetX),
      offsetY: Math.max(0, offsetY),
      scaledWidth,
      scaledHeight
    };
  }

  /**
   * Get current scale information
   */
  public getScaleInfo(): ScaleInfo {
    return { ...this.scaleInfo };
  }

  /**
   * Get canvas dimensions for proper rendering
   */
  public getCanvasDimensions(): {
    internalWidth: number;   // Canvas internal resolution
    internalHeight: number;  // Canvas internal resolution
    displayWidth: number;    // CSS display width
    displayHeight: number;   // CSS display height
  } {
    return {
      internalWidth: this.targetResolution.width,
      internalHeight: this.targetResolution.height,
      displayWidth: this.scaleInfo.scaledWidth,
      displayHeight: this.scaleInfo.scaledHeight
    };
  }

  /**
   * Convert preview coordinates to target resolution coordinates
   */
  public previewToTarget(previewPoint: Point): Point {
    const adjustedX = previewPoint.x - this.scaleInfo.offsetX;
    const adjustedY = previewPoint.y - this.scaleInfo.offsetY;

    return {
      x: adjustedX / this.scaleInfo.scaleX,
      y: adjustedY / this.scaleInfo.scaleY
    };
  }

  /**
   * Convert target resolution coordinates to preview coordinates
   */
  public targetToPreview(targetPoint: Point): Point {
    return {
      x: (targetPoint.x * this.scaleInfo.scaleX) + this.scaleInfo.offsetX,
      y: (targetPoint.y * this.scaleInfo.scaleY) + this.scaleInfo.offsetY
    };
  }

  /**
   * Scale a rectangle from target to preview coordinates
   */
  public scaleRectangleToPreview(targetRect: Rectangle): Rectangle {
    const topLeft = this.targetToPreview({ x: targetRect.x, y: targetRect.y });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: targetRect.width * this.scaleInfo.scaleX,
      height: targetRect.height * this.scaleInfo.scaleY
    };
  }

  /**
   * Scale a rectangle from preview to target coordinates
   */
  public scaleRectangleToTarget(previewRect: Rectangle): Rectangle {
    const topLeft = this.previewToTarget({ x: previewRect.x, y: previewRect.y });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: previewRect.width / this.scaleInfo.scaleX,
      height: previewRect.height / this.scaleInfo.scaleY
    };
  }

  /**
   * Check if a point is within the scaled content area
   */
  public isPointInScaledArea(previewPoint: Point): boolean {
    return previewPoint.x >= this.scaleInfo.offsetX &&
           previewPoint.x <= this.scaleInfo.offsetX + this.scaleInfo.scaledWidth &&
           previewPoint.y >= this.scaleInfo.offsetY &&
           previewPoint.y <= this.scaleInfo.offsetY + this.scaleInfo.scaledHeight;
  }

  /**
   * Update preview size (e.g., when container resizes)
   */
  public updatePreviewSize(newSize: Size): void {
    this.previewSize = { ...newSize };
    this.scaleInfo = this.calculateScale();
  }

  /**
   * Update target resolution (e.g., when switching display modes)
   */
  public updateTargetResolution(newResolution: Size): void {
    this.targetResolution = { ...newResolution };
    this.scaleInfo = this.calculateScale();
  }

  /**
   * Get optimal preview size for a given container while maintaining aspect ratio
   */
  public static calculateOptimalPreviewSize(
    targetResolution: Size,
    containerSize: Size,
    padding: number = 0
  ): Size {
    const availableWidth = containerSize.width - (padding * 2);
    const availableHeight = containerSize.height - (padding * 2);

    const targetAspect = targetResolution.width / targetResolution.height;
    const containerAspect = availableWidth / availableHeight;

    if (containerAspect > targetAspect) {
      // Container is wider than target aspect ratio
      const height = availableHeight;
      const width = height * targetAspect;
      return { width, height };
    } else {
      // Container is taller than target aspect ratio
      const width = availableWidth;
      const height = width / targetAspect;
      return { width, height };
    }
  }

  /**
   * Create a ScalingManager for preview-to-live consistency
   */
  public static createForPreview(
    targetResolution: Size = { width: 1920, height: 1080 },
    previewSize: Size
  ): ScalingManager {
    return new ScalingManager({
      targetResolution,
      previewSize,
      maintainAspectRatio: true,
      allowUpscaling: false
    });
  }

  /**
   * Create a ScalingManager for live display with proper aspect ratio handling
   */
  public static createForLiveDisplay(
    targetResolution: Size = { width: 1920, height: 1080 },
    displaySize: Size
  ): ScalingManager {
    return new ScalingManager({
      targetResolution,
      previewSize: displaySize,
      maintainAspectRatio: true,
      allowUpscaling: true // Allow upscaling for live display to fill screen
    });
  }

  /**
   * Debug info for troubleshooting scaling issues
   */
  public getDebugInfo(): any {
    return {
      targetResolution: this.targetResolution,
      previewSize: this.previewSize,
      scaleInfo: this.scaleInfo,
      aspectRatios: {
        target: this.targetResolution.width / this.targetResolution.height,
        preview: this.previewSize.width / this.previewSize.height
      },
      config: {
        maintainAspectRatio: this.maintainAspectRatio,
        allowUpscaling: this.allowUpscaling
      }
    };
  }
}