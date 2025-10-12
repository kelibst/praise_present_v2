import { Shape } from '../core/Shape';
import { TextShape } from '../shapes/TextShape';
import { BackgroundShape } from '../shapes/BackgroundShape';
import { ImageShape } from '../shapes/ImageShape';
import { RectangleShape } from '../shapes/RectangleShape';
import { ShapeType } from '../types/shapes';

/**
 * ShapeReconstructor - Reconstructs Shape instances from plain objects
 * 
 * This utility is needed because React state serialization strips prototype methods
 * from Shape instances, causing "shape.isVisible is not a function" errors.
 * 
 * When shapes are stored in React state and then retrieved, they become plain objects
 * without the Shape class methods. This reconstructor converts them back to proper
 * Shape instances with all their methods intact.
 */
export class ShapeReconstructor {
  /**
   * Reconstructs a single shape from a plain object
   */
  static reconstructShape(shapeData: any): Shape {
    if (!shapeData || !shapeData.type) {
      throw new Error('Invalid shape data: missing type');
    }

    switch (shapeData.type) {
      case ShapeType.TEXT:
        return ShapeReconstructor.reconstructTextShape(shapeData);
      
      case ShapeType.BACKGROUND:
        return ShapeReconstructor.reconstructBackgroundShape(shapeData);
      
      case ShapeType.IMAGE:
        return ShapeReconstructor.reconstructImageShape(shapeData);
      
      case ShapeType.RECTANGLE:
        return ShapeReconstructor.reconstructRectangleShape(shapeData);
      
      default:
        console.warn('Unknown shape type:', shapeData.type);
        // Fallback: try to reconstruct as TextShape
        return ShapeReconstructor.reconstructTextShape(shapeData);
    }
  }

  /**
   * Reconstructs multiple shapes from an array of plain objects
   */
  static reconstructShapes(shapesData: any[]): Shape[] {
    if (!Array.isArray(shapesData)) {
      console.warn('Invalid shapes data: not an array');
      return [];
    }

    return shapesData.map((shapeData, index) => {
      try {
        return ShapeReconstructor.reconstructShape(shapeData);
      } catch (error) {
        console.error(`Failed to reconstruct shape at index ${index}:`, error, shapeData);
        // Return a fallback shape to prevent complete failure
        return new TextShape({
          text: 'Error: Failed to reconstruct shape',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 50 }
        });
      }
    });
  }

  private static reconstructTextShape(data: any): TextShape {
    const props = {
      id: data.id,
      position: data.position,
      size: data.size,
      rotation: data.rotation,
      opacity: data.opacity,
      zIndex: data.zIndex,
      visible: data.visible,
      transform: data.transform,
      text: data.text,
      autoSize: data.autoSize,
      wordWrap: data.wordWrap,
      maxLines: data.maxLines
    };

    const textStyle = data.textStyle || {};
    
    return new TextShape(props, textStyle);
  }

  private static reconstructBackgroundShape(data: any): BackgroundShape {
    const props = {
      id: data.id,
      position: data.position,
      size: data.size,
      rotation: data.rotation,
      opacity: data.opacity,
      zIndex: data.zIndex,
      visible: data.visible,
      transform: data.transform,
      backgroundStyle: data.backgroundStyle
    };

    return new BackgroundShape(props);
  }

  private static reconstructImageShape(data: any): ImageShape {
    const props = {
      id: data.id,
      position: data.position,
      size: data.size,
      rotation: data.rotation,
      opacity: data.opacity,
      zIndex: data.zIndex,
      visible: data.visible,
      transform: data.transform,
      imageUrl: data.imageUrl,
      altText: data.altText,
      preserveAspectRatio: data.preserveAspectRatio,
      fit: data.fit
    };

    return new ImageShape(props);
  }

  private static reconstructRectangleShape(data: any): RectangleShape {
    const props = {
      id: data.id,
      position: data.position,
      size: data.size,
      rotation: data.rotation,
      opacity: data.opacity,
      zIndex: data.zIndex,
      visible: data.visible,
      transform: data.transform,
      borderRadius: data.borderRadius
    };

    const style = data.style || {};
    
    return new RectangleShape(props, style);
  }

  /**
   * Checks if a shape needs reconstruction (i.e., is a plain object)
   */
  static needsReconstruction(shape: any): boolean {
    return shape && typeof shape.isVisible !== 'function';
  }

  /**
   * Safely reconstructs shapes only if they need it
   */
  static ensureShapeInstances(shapes: any[]): Shape[] {
    if (!Array.isArray(shapes)) {
      return [];
    }

    return shapes.map(shape => {
      if (ShapeReconstructor.needsReconstruction(shape)) {
        return ShapeReconstructor.reconstructShape(shape);
      }
      return shape as Shape;
    });
  }
}
