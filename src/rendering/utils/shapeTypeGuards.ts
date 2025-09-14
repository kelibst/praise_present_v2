import { Shape } from '../core/Shape';
import { TextShape } from '../shapes/TextShape';
import { RectangleShape } from '../shapes/RectangleShape';
import { BackgroundShape } from '../shapes/BackgroundShape';
import { ImageShape } from '../shapes/ImageShape';

/**
 * Shape type guards for IPC-safe shape type checking
 * These work with both proper Shape instances and serialized objects
 */

/**
 * Type guard for TextShape - safe for IPC serialized objects
 */
export function isTextShape(shape: any): shape is TextShape {
  return shape &&
         typeof shape === 'object' &&
         shape.type === 'text' &&
         'text' in shape &&
         'textStyle' in shape;
}

/**
 * Type guard for RectangleShape - safe for IPC serialized objects
 */
export function isRectangleShape(shape: any): shape is RectangleShape {
  return shape &&
         typeof shape === 'object' &&
         shape.type === 'rectangle' &&
         'position' in shape &&
         'size' in shape;
}

/**
 * Type guard for BackgroundShape - safe for IPC serialized objects
 */
export function isBackgroundShape(shape: any): shape is BackgroundShape {
  return shape &&
         typeof shape === 'object' &&
         shape.type === 'background' &&
         'backgroundStyle' in shape;
}

/**
 * Type guard for ImageShape - safe for IPC serialized objects
 */
export function isImageShape(shape: any): shape is ImageShape {
  return shape &&
         typeof shape === 'object' &&
         shape.type === 'image' &&
         'src' in shape;
}

/**
 * Generic type guard to check if an object is a valid Shape
 */
export function isShape(obj: any): obj is Shape {
  return obj &&
         typeof obj === 'object' &&
         'type' in obj &&
         'id' in obj &&
         'position' in obj &&
         'size' in obj &&
         typeof obj.position === 'object' &&
         typeof obj.size === 'object' &&
         'x' in obj.position &&
         'y' in obj.position &&
         'width' in obj.size &&
         'height' in obj.size;
}

/**
 * Type guard to check if an object has a render method (is a proper Shape instance)
 */
export function isRenderableShape(obj: any): obj is Shape {
  return isShape(obj) && typeof obj.render === 'function';
}

/**
 * Utility to get shape type string safely
 */
export function getShapeType(shape: any): string | null {
  if (!shape || typeof shape !== 'object') return null;
  return shape.type || null;
}

/**
 * Enhanced shape type detection with detailed info
 */
export function analyzeShape(shape: any): {
  isValidShape: boolean;
  isRenderable: boolean;
  type: string | null;
  hasRequiredProperties: boolean;
  missingProperties: string[];
} {
  const result = {
    isValidShape: false,
    isRenderable: false,
    type: null as string | null,
    hasRequiredProperties: false,
    missingProperties: [] as string[]
  };

  if (!shape || typeof shape !== 'object') {
    result.missingProperties.push('shape is not an object');
    return result;
  }

  result.type = getShapeType(shape);
  result.isValidShape = isShape(shape);
  result.isRenderable = isRenderableShape(shape);

  // Check required properties
  const requiredProps = ['id', 'type', 'position', 'size'];
  const missing: string[] = [];

  for (const prop of requiredProps) {
    if (!(prop in shape)) {
      missing.push(prop);
    }
  }

  if (shape.position && typeof shape.position === 'object') {
    if (!('x' in shape.position)) missing.push('position.x');
    if (!('y' in shape.position)) missing.push('position.y');
  }

  if (shape.size && typeof shape.size === 'object') {
    if (!('width' in shape.size)) missing.push('size.width');
    if (!('height' in shape.size)) missing.push('size.height');
  }

  result.missingProperties = missing;
  result.hasRequiredProperties = missing.length === 0;

  return result;
}