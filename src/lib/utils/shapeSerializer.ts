import { TextShape, TextShapeProps } from '../../rendering/shapes/TextShape';
import { Shape } from '../../rendering/core/Shape';
import { ShapeType } from '../../rendering/types/shapes';

/**
 * Serializes a shape instance to a plain object that can be stored in Redux/localStorage
 */
export function serializeShape(shape: Shape): any {
  if (shape instanceof TextShape) {
    return {
      __type: 'TextShape',
      id: shape.id,
      position: shape.position,
      size: shape.size,
      rotation: shape.rotation,
      opacity: shape.opacity,
      zIndex: shape.zIndex,
      visible: shape.visible,
      transform: shape.transform,
      metadata: shape.metadata,
      style: shape.style,
      text: shape.text,
      textStyle: shape.textStyle,
      autoSize: shape.autoSize,
      wordWrap: shape.wordWrap,
      maxLines: shape.maxLines,
      overflowBehavior: shape.overflowBehavior,
      minFontSize: shape.minFontSize,
      maxFontSize: shape.maxFontSize
    };
  }

  // Fallback for unknown shape types
  return {
    __type: 'Shape',
    ...shape
  };
}

/**
 * Deserializes a plain object back to a shape instance
 */
export function deserializeShape(data: any): Shape {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid shape data for deserialization');
  }

  if (data.__type === 'TextShape') {
    const props: TextShapeProps = {
      id: data.id,
      position: data.position,
      size: data.size,
      rotation: data.rotation,
      opacity: data.opacity,
      zIndex: data.zIndex,
      visible: data.visible,
      transform: data.transform,
      metadata: data.metadata,
      text: data.text,
      textStyle: data.textStyle,
      autoSize: data.autoSize,
      wordWrap: data.wordWrap,
      maxLines: data.maxLines,
      overflowBehavior: data.overflowBehavior,
      minFontSize: data.minFontSize,
      maxFontSize: data.maxFontSize
    };

    return new TextShape(props, data.style);
  }

  throw new Error(`Unknown shape type: ${data.__type}`);
}

/**
 * Serializes an array of shapes
 */
export function serializeShapes(shapes: Shape[]): any[] {
  return shapes.map(serializeShape);
}

/**
 * Deserializes an array of shapes
 */
export function deserializeShapes(data: any[]): Shape[] {
  if (!Array.isArray(data)) {
    console.warn('Invalid shapes data, expected array:', data);
    return [];
  }

  try {
    return data.map(deserializeShape);
  } catch (error) {
    console.error('Failed to deserialize shapes:', error);
    return [];
  }
}

/**
 * Serializes a slide with its shapes
 */
export function serializeSlide(slide: any): any {
  return {
    id: slide.id,
    shapes: serializeShapes(slide.shapes),
    background: slide.background,
    duration: slide.duration
  };
}

/**
 * Deserializes a slide with its shapes
 */
export function deserializeSlide(data: any): any {
  if (!data || typeof data !== 'object') {
    console.warn('Invalid slide data:', data);
    return null;
  }

  return {
    id: data.id,
    shapes: deserializeShapes(data.shapes || []),
    background: data.background,
    duration: data.duration
  };
}

/**
 * Serializes an array of slides
 */
export function serializeSlides(slides: any[]): any[] {
  if (!Array.isArray(slides)) {
    return [];
  }
  return slides.map(serializeSlide);
}

/**
 * Deserializes an array of slides
 */
export function deserializeSlides(data: any[]): any[] {
  if (!Array.isArray(data)) {
    console.warn('Invalid slides data, expected array:', data);
    return [];
  }

  return data.map(deserializeSlide).filter(Boolean);
}
