/**
 * Standard coordinate system configuration
 */
export interface CoordinateSystem {
  width: number;
  height: number;
  origin: 'top-left' | 'center';
  scale: number;
}

/**
 * Viewport configuration for coordinate transformation
 */
export interface ViewportInfo {
  width: number;
  height: number;
  devicePixelRatio?: number;
  targetResolution: { width: number; height: number };
}

/**
 * 2D point representation
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangle bounds representation
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Transformation matrix for coordinate conversion
 */
export interface TransformMatrix {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  rotation?: number;
}

/**
 * Standard coordinate systems used in the application
 */
export const COORDINATE_SYSTEMS = {
  // Standard presentation coordinates (1920x1080, top-left origin)
  PRESENTATION: {
    width: 1920,
    height: 1080,
    origin: 'top-left' as const,
    scale: 1
  },

  // Preview coordinates (variable size, top-left origin)
  PREVIEW: {
    width: 800,
    height: 450,
    origin: 'top-left' as const,
    scale: 1
  },

  // Live display coordinates (full screen, top-left origin)
  LIVE_DISPLAY: {
    width: 1920,
    height: 1080,
    origin: 'top-left' as const,
    scale: 1
  }
} as const;

/**
 * Coordinate transformation utilities for consistent positioning
 * across different viewports and display contexts
 */
export class CoordinateTransform {
  private sourceSystem: CoordinateSystem;
  private targetSystem: CoordinateSystem;
  private transformMatrix: TransformMatrix;

  constructor(sourceSystem: CoordinateSystem, targetSystem: CoordinateSystem) {
    this.sourceSystem = sourceSystem;
    this.targetSystem = targetSystem;
    this.transformMatrix = this.calculateTransformMatrix();
  }

  /**
   * Transform a point from source to target coordinate system
   */
  public transformPoint(point: Point): Point {
    const { scaleX, scaleY, offsetX, offsetY } = this.transformMatrix;

    return {
      x: point.x * scaleX + offsetX,
      y: point.y * scaleY + offsetY
    };
  }

  /**
   * Transform bounds from source to target coordinate system
   */
  public transformBounds(bounds: Bounds): Bounds {
    const topLeft = this.transformPoint({ x: bounds.x, y: bounds.y });
    const bottomRight = this.transformPoint({
      x: bounds.x + bounds.width,
      y: bounds.y + bounds.height
    });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
  }

  /**
   * Transform a size (width/height) from source to target system
   */
  public transformSize(size: { width: number; height: number }): { width: number; height: number } {
    const { scaleX, scaleY } = this.transformMatrix;

    return {
      width: size.width * scaleX,
      height: size.height * scaleY
    };
  }

  /**
   * Inverse transform a point from target to source coordinate system
   */
  public inverseTransformPoint(point: Point): Point {
    const { scaleX, scaleY, offsetX, offsetY } = this.transformMatrix;

    return {
      x: (point.x - offsetX) / scaleX,
      y: (point.y - offsetY) / scaleY
    };
  }

  /**
   * Inverse transform bounds from target to source coordinate system
   */
  public inverseTransformBounds(bounds: Bounds): Bounds {
    const topLeft = this.inverseTransformPoint({ x: bounds.x, y: bounds.y });
    const bottomRight = this.inverseTransformPoint({
      x: bounds.x + bounds.width,
      y: bounds.y + bounds.height
    });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
  }

  /**
   * Get the transformation matrix
   */
  public getTransformMatrix(): TransformMatrix {
    return { ...this.transformMatrix };
  }

  /**
   * Check if coordinates need transformation
   */
  public needsTransformation(): boolean {
    const { scaleX, scaleY, offsetX, offsetY } = this.transformMatrix;
    return scaleX !== 1 || scaleY !== 1 || offsetX !== 0 || offsetY !== 0;
  }

  /**
   * Calculate the transformation matrix between coordinate systems
   */
  private calculateTransformMatrix(): TransformMatrix {
    // Calculate scale factors
    const scaleX = this.targetSystem.width / this.sourceSystem.width;
    const scaleY = this.targetSystem.height / this.sourceSystem.height;

    // Calculate offsets (currently only supporting top-left origins)
    let offsetX = 0;
    let offsetY = 0;

    // Handle different origin types if needed in the future
    if (this.sourceSystem.origin === 'center' || this.targetSystem.origin === 'center') {
      // Add center origin support if needed
    }

    return {
      scaleX,
      scaleY,
      offsetX,
      offsetY
    };
  }
}

/**
 * Factory functions for common coordinate transformations
 */
export class CoordinateTransformFactory {
  /**
   * Create transformer from presentation coordinates to preview coordinates
   */
  static presentationToPreview(previewSize: { width: number; height: number }): CoordinateTransform {
    const previewSystem: CoordinateSystem = {
      ...COORDINATE_SYSTEMS.PREVIEW,
      width: previewSize.width,
      height: previewSize.height
    };

    return new CoordinateTransform(COORDINATE_SYSTEMS.PRESENTATION, previewSystem);
  }

  /**
   * Create transformer from preview coordinates to presentation coordinates
   */
  static previewToPresentation(previewSize: { width: number; height: number }): CoordinateTransform {
    const previewSystem: CoordinateSystem = {
      ...COORDINATE_SYSTEMS.PREVIEW,
      width: previewSize.width,
      height: previewSize.height
    };

    return new CoordinateTransform(previewSystem, COORDINATE_SYSTEMS.PRESENTATION);
  }

  /**
   * Create transformer from presentation to live display coordinates
   */
  static presentationToLiveDisplay(liveDisplaySize?: { width: number; height: number }): CoordinateTransform {
    const liveSystem = liveDisplaySize ? {
      ...COORDINATE_SYSTEMS.LIVE_DISPLAY,
      width: liveDisplaySize.width,
      height: liveDisplaySize.height
    } : COORDINATE_SYSTEMS.LIVE_DISPLAY;

    return new CoordinateTransform(COORDINATE_SYSTEMS.PRESENTATION, liveSystem);
  }

  /**
   * Create transformer from viewport info to presentation coordinates
   */
  static viewportToPresentation(viewportInfo: ViewportInfo): CoordinateTransform {
    const viewportSystem: CoordinateSystem = {
      width: viewportInfo.width,
      height: viewportInfo.height,
      origin: 'top-left',
      scale: viewportInfo.devicePixelRatio || 1
    };

    return new CoordinateTransform(viewportSystem, COORDINATE_SYSTEMS.PRESENTATION);
  }

  /**
   * Create transformer from presentation to viewport coordinates
   */
  static presentationToViewport(viewportInfo: ViewportInfo): CoordinateTransform {
    const viewportSystem: CoordinateSystem = {
      width: viewportInfo.width,
      height: viewportInfo.height,
      origin: 'top-left',
      scale: viewportInfo.devicePixelRatio || 1
    };

    return new CoordinateTransform(COORDINATE_SYSTEMS.PRESENTATION, viewportSystem);
  }
}

/**
 * Helper functions for common coordinate operations
 */
export class CoordinateHelpers {
  /**
   * Calculate aspect ratio from dimensions
   */
  static getAspectRatio(width: number, height: number): number {
    return width / height;
  }

  /**
   * Fit dimensions within bounds while maintaining aspect ratio
   */
  static fitWithinBounds(
    sourceSize: { width: number; height: number },
    bounds: { width: number; height: number },
    mode: 'contain' | 'cover' = 'contain'
  ): { width: number; height: number; scale: number } {
    const sourceAspect = this.getAspectRatio(sourceSize.width, sourceSize.height);
    const boundsAspect = this.getAspectRatio(bounds.width, bounds.height);

    let scale: number;

    if (mode === 'contain') {
      // Fit entirely within bounds
      scale = sourceAspect > boundsAspect
        ? bounds.width / sourceSize.width
        : bounds.height / sourceSize.height;
    } else {
      // Cover entire bounds
      scale = sourceAspect > boundsAspect
        ? bounds.height / sourceSize.height
        : bounds.width / sourceSize.width;
    }

    return {
      width: sourceSize.width * scale,
      height: sourceSize.height * scale,
      scale
    };
  }

  /**
   * Center dimensions within bounds
   */
  static centerWithinBounds(
    size: { width: number; height: number },
    bounds: { width: number; height: number }
  ): { x: number; y: number } {
    return {
      x: (bounds.width - size.width) / 2,
      y: (bounds.height - size.height) / 2
    };
  }

  /**
   * Check if a point is within bounds
   */
  static isPointInBounds(point: Point, bounds: Bounds): boolean {
    return point.x >= bounds.x &&
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y &&
           point.y <= bounds.y + bounds.height;
  }

  /**
   * Clamp a point within bounds
   */
  static clampPointToBounds(point: Point, bounds: Bounds): Point {
    return {
      x: Math.max(bounds.x, Math.min(point.x, bounds.x + bounds.width)),
      y: Math.max(bounds.y, Math.min(point.y, bounds.y + bounds.height))
    };
  }

  /**
   * Calculate distance between two points
   */
  static distance(point1: Point, point2: Point): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Interpolate between two points
   */
  static interpolate(point1: Point, point2: Point, t: number): Point {
    return {
      x: point1.x + (point2.x - point1.x) * t,
      y: point1.y + (point2.y - point1.y) * t
    };
  }
}

/**
 * Global coordinate normalization utilities
 */
export class CoordinateNormalizer {
  private static presentationTransformers = new Map<string, CoordinateTransform>();

  /**
   * Normalize coordinates to presentation system
   */
  static normalizeToPresentation(
    point: Point,
    sourceViewport: ViewportInfo,
    viewportId: string = 'default'
  ): Point {
    let transformer = this.presentationTransformers.get(viewportId);

    if (!transformer) {
      transformer = CoordinateTransformFactory.viewportToPresentation(sourceViewport);
      this.presentationTransformers.set(viewportId, transformer);
    }

    return transformer.transformPoint(point);
  }

  /**
   * Denormalize coordinates from presentation system
   */
  static denormalizeFromPresentation(
    point: Point,
    targetViewport: ViewportInfo,
    viewportId: string = 'default'
  ): Point {
    const transformer = CoordinateTransformFactory.presentationToViewport(targetViewport);
    return transformer.transformPoint(point);
  }

  /**
   * Clear cached transformers
   */
  static clearCache(): void {
    this.presentationTransformers.clear();
  }

  /**
   * Update transformer for a viewport
   */
  static updateViewportTransformer(viewportId: string, viewportInfo: ViewportInfo): void {
    const transformer = CoordinateTransformFactory.viewportToPresentation(viewportInfo);
    this.presentationTransformers.set(viewportId, transformer);
  }
}

export default CoordinateTransform;