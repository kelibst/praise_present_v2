import { Shape } from '../core/Shape';
import { TextShape } from '../shapes/TextShape';
import { RectangleShape } from '../shapes/RectangleShape';
import { BackgroundShape } from '../shapes/BackgroundShape';
import { ImageShape } from '../shapes/ImageShape';
import { ResponsiveTextShape } from '../shapes/ResponsiveTextShape';
import { createColor, Color } from '../types/geometry';
import { isShape, isRenderableShape, analyzeShape } from './shapeTypeGuards';
import { TypographyScaleMode } from '../layout/TypographyScaler';

/**
 * Factory class for reconstructing Shape instances from serialized data
 * This is critical for handling IPC communication where Shape objects
 * get serialized to JSON and lose their class methods
 */
export class ShapeFactory {
  /**
   * Reconstructs a Shape instance from serialized data
   * @param serializedShape - Plain object with shape data from IPC
   * @returns Proper Shape instance with methods
   */
  static reconstructShape(serializedShape: any): Shape {
    if (!serializedShape || typeof serializedShape !== 'object') {
      throw new Error(`Invalid serialized shape: ${serializedShape}`);
    }

    const { type, bounds, position, size, style, text, color, fillColor, strokeColor, strokeWidth, src, alt } = serializedShape;

    if (!type) {
      throw new Error(`Shape missing type field: ${JSON.stringify(serializedShape)}`);
    }

    // Reconstruct bounds from position/size or use bounds directly
    const shapeBounds = bounds || (position && size ? {
      position: position,
      size: size
    } : null);

    if (!shapeBounds) {
      throw new Error(`Shape missing bounds or position/size fields: ${JSON.stringify(serializedShape)}`);
    }

    try {
      switch (type) {
        case 'text': {
          // Check if this is a responsive text shape
          const hasResponsiveProps = serializedShape.responsive !== undefined ||
                                   serializedShape.flexiblePosition ||
                                   serializedShape.flexibleSize ||
                                   serializedShape.layoutConfig ||
                                   serializedShape.typography ||
                                   serializedShape.optimizeReadability !== undefined;

          if (hasResponsiveProps) {
            // Create ResponsiveTextShape with default typography if missing
            const defaultTypography = {
              scaleRatio: 0.8,
              minSize: { value: 16, unit: 'px' as const },
              maxSize: { value: 120, unit: 'px' as const },
              lineHeightRatio: 1.2,
              adaptiveScaling: true,
              scaleMode: TypographyScaleMode.FLUID
            };

            const responsiveProps = {
              text: text || serializedShape.text || '',
              textStyle: serializedShape.textStyle || style || {},
              autoSize: serializedShape.autoSize !== false,
              wordWrap: serializedShape.wordWrap !== false,
              maxLines: serializedShape.maxLines || 0,
              optimizeReadability: serializedShape.optimizeReadability !== false,
              scaleMode: (serializedShape.scaleMode as TypographyScaleMode) || TypographyScaleMode.FLUID,
              responsive: serializedShape.responsive !== false,
              flexiblePosition: serializedShape.flexiblePosition,
              flexibleSize: serializedShape.flexibleSize,
              layoutConfig: serializedShape.layoutConfig,
              typography: serializedShape.typography || defaultTypography,
              maintainAspectRatio: serializedShape.maintainAspectRatio,
              position: shapeBounds.position || { x: 0, y: 0 },
              size: shapeBounds.size || { width: 100, height: 50 },
              opacity: serializedShape.opacity !== undefined ? serializedShape.opacity : 1.0,
              visible: serializedShape.visible !== undefined ? serializedShape.visible : true,
              zIndex: serializedShape.zIndex || 0
            };

            console.log('🎯 ShapeFactory: Creating ResponsiveTextShape with props:', {
              hasResponsiveProps: true,
              responsive: responsiveProps.responsive,
              hasFlexiblePosition: !!responsiveProps.flexiblePosition,
              hasLayoutConfig: !!responsiveProps.layoutConfig,
              optimizeReadability: responsiveProps.optimizeReadability,
              hasTypography: !!responsiveProps.typography,
              typographyFromSerial: !!serializedShape.typography,
              typographyMinSize: responsiveProps.typography?.minSize,
              typographyMaxSize: responsiveProps.typography?.maxSize
            });

            return new ResponsiveTextShape(responsiveProps);
          } else {
            // Create regular TextShape
            const textProps = {
              ...shapeBounds,
              text: text || serializedShape.text,
              autoSize: serializedShape.autoSize,
              wordWrap: serializedShape.wordWrap,
              maxLines: serializedShape.maxLines
            };

            const textStyle = serializedShape.textStyle || style || {};
            console.log('📝 ShapeFactory: Creating regular TextShape');

            const textShape = new TextShape(textProps, textStyle);
            return textShape;
          }
        }

        case 'rectangle': {
          const rectStyle = style || {};
          if (fillColor && !rectStyle.fillColor) {
            rectStyle.fillColor = this.reconstructColor(fillColor);
          }
          if (strokeColor && !rectStyle.strokeColor) {
            rectStyle.strokeColor = this.reconstructColor(strokeColor);
          }
          if (strokeWidth !== undefined && !rectStyle.strokeWidth) {
            rectStyle.strokeWidth = strokeWidth;
          }

          const rectangleShape = new RectangleShape(shapeBounds, rectStyle);
          return rectangleShape;
        }

        case 'background': {
          const width = shapeBounds.size?.width || 1920;
          const height = shapeBounds.size?.height || 1080;

          // Handle different background types
          if (serializedShape.backgroundType === 'gradient') {
            const { startColor, endColor, angle } = serializedShape;
            return BackgroundShape.createLinearGradient(
              [
                { offset: 0, color: this.reconstructColor(startColor) },
                { offset: 1, color: this.reconstructColor(endColor) }
              ],
              angle || 0,
              width,
              height
            );
          } else if (serializedShape.backgroundType === 'color' || color || serializedShape.backgroundStyle?.color) {
            const bgColor = color || serializedShape.color || serializedShape.backgroundStyle?.color;
            return BackgroundShape.createSolidColor(
              this.reconstructColor(bgColor),
              width,
              height
            );
          } else {
            // Default to black background
            return BackgroundShape.createSolidColor(
              createColor(0, 0, 0),
              width,
              height
            );
          }
        }

        case 'image': {
          if (!src) {
            throw new Error('Image shape missing src field');
          }
          return new ImageShape({ src, alt: alt || '' }, style || {});
        }

        default:
          throw new Error(`Unknown shape type: ${type}`);
      }
    } catch (error) {
      console.error('ShapeFactory: Error reconstructing shape:', error, serializedShape);
      throw new Error(`Failed to reconstruct ${type} shape: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reconstructs a Color instance from serialized color data
   * @param colorData - Serialized color (could be object with r,g,b,a or string)
   * @returns Color instance
   */
  private static reconstructColor(colorData: any): Color {
    if (!colorData) {
      return createColor(0, 0, 0, 1);
    }

    // Handle Color object format {r, g, b, a}
    if (typeof colorData === 'object' && 'r' in colorData) {
      return createColor(
        colorData.r || 0,
        colorData.g || 0,
        colorData.b || 0,
        colorData.a !== undefined ? colorData.a : 1
      );
    }

    // Handle hex string format "#RRGGBB" or "#RRGGBBAA"
    if (typeof colorData === 'string' && colorData.startsWith('#')) {
      return this.parseHexColor(colorData);
    }

    // Handle RGB/RGBA string format "rgb(r,g,b)" or "rgba(r,g,b,a)"
    if (typeof colorData === 'string' && (colorData.startsWith('rgb(') || colorData.startsWith('rgba('))) {
      return this.parseRgbColor(colorData);
    }

    // Handle named colors
    if (typeof colorData === 'string') {
      return this.parseNamedColor(colorData);
    }

    console.warn('ShapeFactory: Unknown color format, defaulting to black:', colorData);
    return createColor(0, 0, 0, 1);
  }

  /**
   * Parses hex color string to Color instance
   */
  private static parseHexColor(hex: string): Color {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    if (cleanHex.length === 6) {
      // #RRGGBB
      const r = parseInt(cleanHex.substr(0, 2), 16);
      const g = parseInt(cleanHex.substr(2, 2), 16);
      const b = parseInt(cleanHex.substr(4, 2), 16);
      return createColor(r, g, b, 1);
    } else if (cleanHex.length === 8) {
      // #RRGGBBAA
      const r = parseInt(cleanHex.substr(0, 2), 16);
      const g = parseInt(cleanHex.substr(2, 2), 16);
      const b = parseInt(cleanHex.substr(4, 2), 16);
      const a = parseInt(cleanHex.substr(6, 2), 16) / 255;
      return createColor(r, g, b, a);
    }

    return createColor(0, 0, 0, 1);
  }

  /**
   * Parses RGB/RGBA string to Color instance
   */
  private static parseRgbColor(rgb: string): Color {
    const match = rgb.match(/rgba?\(([^)]+)\)/);
    if (!match) return createColor(0, 0, 0, 1);

    const values = match[1].split(',').map(v => parseFloat(v.trim()));

    if (values.length >= 3) {
      return createColor(
        values[0],
        values[1],
        values[2],
        values[3] !== undefined ? values[3] : 1
      );
    }

    return createColor(0, 0, 0, 1);
  }

  /**
   * Parses named color to Color instance
   */
  private static parseNamedColor(name: string): Color {
    const namedColors: { [key: string]: [number, number, number] } = {
      'black': [0, 0, 0],
      'white': [255, 255, 255],
      'red': [255, 0, 0],
      'green': [0, 255, 0],
      'blue': [0, 0, 255],
      'yellow': [255, 255, 0],
      'cyan': [0, 255, 255],
      'magenta': [255, 0, 255],
      'gray': [128, 128, 128],
      'grey': [128, 128, 128],
      'transparent': [0, 0, 0] // Will use alpha 0
    };

    const color = namedColors[name.toLowerCase()];
    if (color) {
      return createColor(color[0], color[1], color[2], name.toLowerCase() === 'transparent' ? 0 : 1);
    }

    console.warn('ShapeFactory: Unknown named color, defaulting to black:', name);
    return createColor(0, 0, 0, 1);
  }

  /**
   * Validates if an object is already a proper Shape instance
   * @param obj - Object to check
   * @returns true if object is a Shape instance with methods
   */
  static isShapeInstance(obj: any): obj is Shape {
    return isRenderableShape(obj);
  }

  /**
   * Reconstructs multiple shapes from serialized array with enhanced error handling
   * @param serializedShapes - Array of serialized shapes
   * @returns Array of Shape instances with detailed reconstruction info
   */
  static reconstructShapes(serializedShapes: any[]): Shape[] {
    if (!Array.isArray(serializedShapes)) {
      console.warn('ShapeFactory: Expected array of shapes, got:', typeof serializedShapes, serializedShapes);
      return [];
    }

    const results: Shape[] = [];
    const errors: Array<{ index: number; error: string; shape: any }> = [];

    serializedShapes.forEach((shape, index) => {
      try {
        // Skip if already a Shape instance
        if (this.isShapeInstance(shape)) {
          results.push(shape);
          return;
        }

        // Validate shape structure before reconstruction
        const analysis = analyzeShape(shape);
        if (!analysis.isValidShape) {
          const errorMsg = `Invalid shape structure: missing ${analysis.missingProperties.join(', ')}`;
          console.warn(`ShapeFactory: Shape at index ${index} - ${errorMsg}`, shape);
          errors.push({ index, error: errorMsg, shape });
          return;
        }

        // Reconstruct serialized shape
        const reconstructed = this.reconstructShape(shape);
        results.push(reconstructed);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown reconstruction error';
        console.error(`ShapeFactory: Failed to reconstruct shape at index ${index}:`, errorMsg, shape);
        errors.push({ index, error: errorMsg, shape });
      }
    });

    // Log summary of reconstruction results (reduced frequency)
    if (errors.length > 0) {
      console.warn(`ShapeFactory: Successfully reconstructed ${results.length}/${serializedShapes.length} shapes. ${errors.length} failed.`, {
        successfulShapes: results.length,
        totalShapes: serializedShapes.length,
        errors: errors.map(e => ({ index: e.index, error: e.error }))
      });
    } else if (results.length > 0 && Math.random() < 0.05) { // Only log 5% of successful reconstructions
      console.log(`ShapeFactory: Successfully reconstructed all ${results.length} shapes.`);
    }

    return results;
  }
}

/**
 * Utility function for easy shape reconstruction
 * @param serializedShape - Serialized shape data
 * @returns Shape instance or null if reconstruction fails
 */
export function reconstructShape(serializedShape: any): Shape | null {
  try {
    return ShapeFactory.reconstructShape(serializedShape);
  } catch (error) {
    console.error('reconstructShape: Failed to reconstruct shape:', error);
    return null;
  }
}

/**
 * Utility function for reconstructing shape arrays
 * @param serializedShapes - Array of serialized shapes
 * @returns Array of Shape instances (failures filtered out)
 */
export function reconstructShapes(serializedShapes: any[]): Shape[] {
  return ShapeFactory.reconstructShapes(serializedShapes);
}