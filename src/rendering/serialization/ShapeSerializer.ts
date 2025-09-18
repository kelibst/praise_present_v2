import { Shape } from '../core/Shape';
import { COORDINATE_SYSTEMS } from '../utils/CoordinateTransform';

/**
 * Serialized shape data for live display communication
 */
export interface SerializedShape {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  zIndex: number;
  opacity: number;
  rotation?: number;

  // Type-specific properties
  text?: string;
  textStyle?: SerializedTextStyle;
  fillColor?: SerializedColor;
  strokeColor?: SerializedColor;
  strokeWidth?: number;
  borderRadius?: number;
  backgroundStyle?: any;

  // Responsive properties (simplified)
  responsive?: boolean;
  maintainAspectRatio?: boolean;
}

/**
 * Serialized text style
 */
export interface SerializedTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  color: SerializedColor;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  letterSpacing?: number;
  textDecoration?: string;
  textTransform?: string;
  textShadow?: string;
}

/**
 * Serialized color representation
 */
export interface SerializedColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Serialized slide data
 */
export interface SerializedSlide {
  id: string;
  shapes: SerializedShape[];
  background?: {
    type: 'color' | 'image' | 'gradient';
    value: string;
  };
  metadata: {
    coordinateSystem: 'presentation'; // Always use presentation coordinates
    timestamp: number;
    shapeCount: number;
  };
}

/**
 * Simplified shape serializer that leverages standardized coordinates
 * for efficient communication with live display
 */
export class ShapeSerializer {
  /**
   * Serialize a single shape for live display
   */
  static serializeShape(shape: any): SerializedShape {
    const baseShape: SerializedShape = {
      id: shape.id || this.generateId(),
      type: shape.type || 'unknown',
      position: this.extractPosition(shape),
      size: this.extractSize(shape),
      visible: shape.visible !== false,
      zIndex: shape.zIndex || 0,
      opacity: shape.opacity !== undefined ? shape.opacity : 1.0,
      rotation: shape.rotation || 0
    };

    // Add type-specific properties
    switch (shape.type) {
      case 'text':
        return {
          ...baseShape,
          text: this.extractText(shape),
          textStyle: this.serializeTextStyle(shape.textStyle),
          responsive: shape.responsive
        };

      case 'rectangle':
        return {
          ...baseShape,
          fillColor: this.serializeColor(shape.fillColor),
          strokeColor: this.serializeColor(shape.strokeColor),
          strokeWidth: shape.strokeWidth || 0,
          borderRadius: shape.borderRadius || 0
        };

      case 'background':
        return {
          ...baseShape,
          backgroundStyle: shape.backgroundStyle
        };

      default:
        return baseShape;
    }
  }

  /**
   * Serialize multiple shapes
   */
  static serializeShapes(shapes: any[]): SerializedShape[] {
    return shapes.map(shape => this.serializeShape(shape));
  }

  /**
   * Serialize a complete slide
   */
  static serializeSlide(slide: any): SerializedSlide {
    return {
      id: slide.id || this.generateId(),
      shapes: this.serializeShapes(slide.shapes || []),
      background: slide.background,
      metadata: {
        coordinateSystem: 'presentation',
        timestamp: Date.now(),
        shapeCount: (slide.shapes || []).length
      }
    };
  }

  /**
   * Deserialize shape data back to shape objects (for live display)
   */
  static deserializeShape(serialized: SerializedShape): any {
    const baseShape = {
      id: serialized.id,
      type: serialized.type,
      position: serialized.position,
      size: serialized.size,
      visible: serialized.visible,
      zIndex: serialized.zIndex,
      opacity: serialized.opacity,
      rotation: serialized.rotation
    };

    // Add type-specific properties
    switch (serialized.type) {
      case 'text':
        return {
          ...baseShape,
          text: serialized.text || '',
          textStyle: this.deserializeTextStyle(serialized.textStyle),
          responsive: serialized.responsive || false
        };

      case 'rectangle':
        return {
          ...baseShape,
          fillColor: this.deserializeColor(serialized.fillColor),
          strokeColor: this.deserializeColor(serialized.strokeColor),
          strokeWidth: serialized.strokeWidth || 0,
          borderRadius: serialized.borderRadius || 0
        };

      case 'background':
        return {
          ...baseShape,
          backgroundStyle: serialized.backgroundStyle
        };

      default:
        return baseShape;
    }
  }

  /**
   * Create serialization summary for debugging
   */
  static createSerializationSummary(shapes: any[]): {
    totalShapes: number;
    byType: Record<string, number>;
    totalSize: number;
    hasResponsiveShapes: boolean;
  } {
    const summary = {
      totalShapes: shapes.length,
      byType: {} as Record<string, number>,
      totalSize: 0,
      hasResponsiveShapes: false
    };

    shapes.forEach(shape => {
      const type = shape.type || 'unknown';
      summary.byType[type] = (summary.byType[type] || 0) + 1;

      if (shape.responsive) {
        summary.hasResponsiveShapes = true;
      }
    });

    // Estimate serialized size
    const serialized = this.serializeShapes(shapes);
    summary.totalSize = JSON.stringify(serialized).length;

    return summary;
  }

  // Private helper methods

  private static extractPosition(shape: any): { x: number; y: number } {
    if (shape.position) {
      return { x: shape.position.x || 0, y: shape.position.y || 0 };
    }

    // Try to get bounds and extract position
    if (shape.getBounds && typeof shape.getBounds === 'function') {
      try {
        const bounds = shape.getBounds();
        return { x: bounds.x || 0, y: bounds.y || 0 };
      } catch (error) {
        console.warn('ShapeSerializer: Failed to get bounds from shape:', error);
      }
    }

    return { x: 0, y: 0 };
  }

  private static extractSize(shape: any): { width: number; height: number } {
    if (shape.size) {
      return { width: shape.size.width || 100, height: shape.size.height || 50 };
    }

    // Try to get bounds and extract size
    if (shape.getBounds && typeof shape.getBounds === 'function') {
      try {
        const bounds = shape.getBounds();
        return { width: bounds.width || 100, height: bounds.height || 50 };
      } catch (error) {
        console.warn('ShapeSerializer: Failed to get bounds from shape:', error);
      }
    }

    return { width: 100, height: 50 };
  }

  private static extractText(shape: any): string {
    if (shape.text !== undefined) {
      return shape.text;
    }

    if (shape.getText && typeof shape.getText === 'function') {
      try {
        return shape.getText();
      } catch (error) {
        console.warn('ShapeSerializer: Failed to get text from shape:', error);
      }
    }

    return '';
  }

  private static serializeTextStyle(textStyle: any): SerializedTextStyle | undefined {
    if (!textStyle) return undefined;

    return {
      fontFamily: textStyle.fontFamily || 'Arial, sans-serif',
      fontSize: textStyle.fontSize || 24,
      fontWeight: textStyle.fontWeight || 'normal',
      fontStyle: textStyle.fontStyle || 'normal',
      color: this.serializeColor(textStyle.color) || { r: 255, g: 255, b: 255, a: 1 },
      textAlign: textStyle.textAlign || 'left',
      verticalAlign: textStyle.verticalAlign || 'top',
      lineHeight: textStyle.lineHeight || 1.2,
      letterSpacing: textStyle.letterSpacing,
      textDecoration: textStyle.textDecoration,
      textTransform: textStyle.textTransform,
      textShadow: textStyle.textShadow
    };
  }

  private static deserializeTextStyle(textStyle: SerializedTextStyle | undefined): any {
    if (!textStyle) return {};

    return {
      fontFamily: textStyle.fontFamily,
      fontSize: textStyle.fontSize,
      fontWeight: textStyle.fontWeight,
      fontStyle: textStyle.fontStyle,
      color: this.deserializeColor(textStyle.color),
      textAlign: textStyle.textAlign,
      verticalAlign: textStyle.verticalAlign,
      lineHeight: textStyle.lineHeight,
      letterSpacing: textStyle.letterSpacing,
      textDecoration: textStyle.textDecoration,
      textTransform: textStyle.textTransform,
      textShadow: textStyle.textShadow
    };
  }

  private static serializeColor(color: any): SerializedColor | undefined {
    if (!color) return undefined;

    // Handle different color formats
    if (typeof color === 'string') {
      return this.parseColorString(color);
    }

    if (typeof color === 'object') {
      return {
        r: color.r || color.red || 0,
        g: color.g || color.green || 0,
        b: color.b || color.blue || 0,
        a: color.a !== undefined ? color.a : (color.alpha !== undefined ? color.alpha : 1)
      };
    }

    return undefined;
  }

  private static deserializeColor(color: SerializedColor | undefined): any {
    if (!color) return undefined;

    return {
      r: color.r,
      g: color.g,
      b: color.b,
      a: color.a
    };
  }

  private static parseColorString(colorString: string): SerializedColor {
    // Simple color string parsing (could be enhanced)
    if (colorString.startsWith('#')) {
      const hex = colorString.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b, a: 1 };
    }

    if (colorString.startsWith('rgb(')) {
      const match = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3]),
          a: 1
        };
      }
    }

    if (colorString.startsWith('rgba(')) {
      const match = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3]),
          a: parseFloat(match[4])
        };
      }
    }

    // Default to white
    return { r: 255, g: 255, b: 255, a: 1 };
  }

  private static generateId(): string {
    return `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Optimized serialization for specific use cases
 */
export class OptimizedShapeSerializer extends ShapeSerializer {
  /**
   * Serialize only changed shapes for incremental updates
   */
  static serializeChangedShapes(
    shapes: any[],
    changedShapeIds: Set<string>
  ): SerializedShape[] {
    return shapes
      .filter(shape => changedShapeIds.has(shape.id))
      .map(shape => this.serializeShape(shape));
  }

  /**
   * Serialize with compression (remove unchanged properties)
   */
  static serializeMinimal(shape: any, baseShape?: SerializedShape): Partial<SerializedShape> {
    const fullSerialized = this.serializeShape(shape);

    if (!baseShape) {
      return fullSerialized;
    }

    // Return only changed properties
    const minimal: Partial<SerializedShape> = { id: fullSerialized.id };

    Object.keys(fullSerialized).forEach(key => {
      const typedKey = key as keyof SerializedShape;
      if (JSON.stringify(fullSerialized[typedKey]) !== JSON.stringify(baseShape[typedKey])) {
        (minimal as any)[typedKey] = fullSerialized[typedKey];
      }
    });

    return minimal;
  }

  /**
   * Batch serialize with performance optimization
   */
  static batchSerialize(shapes: any[], batchSize: number = 50): SerializedShape[][] {
    const batches: SerializedShape[][] = [];

    for (let i = 0; i < shapes.length; i += batchSize) {
      const batch = shapes.slice(i, i + batchSize);
      batches.push(this.serializeShapes(batch));
    }

    return batches;
  }
}

export default ShapeSerializer;