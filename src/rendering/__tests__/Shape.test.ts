import { Shape } from '../core/Shape';
import { RenderContext } from '../types/rendering';
import { ShapeType } from '../types/shapes';
import { createPoint, createSize } from '../types/geometry';

// Mock shape class for testing
class TestShape extends Shape {
  public readonly type = ShapeType.RECTANGLE;

  public render(context: RenderContext): void {
    // Mock render implementation
  }
}

describe('Shape', () => {
  let shape: TestShape;

  beforeEach(() => {
    shape = new TestShape({
      position: createPoint(10, 20),
      size: createSize(100, 50)
    });
  });

  test('should initialize with default properties', () => {
    const defaultShape = new TestShape();

    expect(defaultShape.position).toEqual({ x: 0, y: 0 });
    expect(defaultShape.size).toEqual({ width: 100, height: 100 });
    expect(defaultShape.rotation).toBe(0);
    expect(defaultShape.opacity).toBe(1);
    expect(defaultShape.zIndex).toBe(0);
    expect(defaultShape.visible).toBe(true);
    expect(defaultShape.id).toBeDefined();
    expect(defaultShape.id.length).toBeGreaterThan(0);
  });

  test('should initialize with custom properties', () => {
    expect(shape.position).toEqual({ x: 10, y: 20 });
    expect(shape.size).toEqual({ width: 100, height: 50 });
  });

  test('should calculate bounds correctly', () => {
    const bounds = shape.getBounds();

    expect(bounds).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 50
    });
  });

  test('should calculate transformed bounds with scaling', () => {
    shape.scale(2, 1.5);
    const bounds = shape.getTransformedBounds();

    expect(bounds.width).toBe(200);
    expect(bounds.height).toBe(75);
  });

  test('should handle hit testing', () => {
    expect(shape.hitTest({ x: 50, y: 40 })).toBe(true);
    expect(shape.hitTest({ x: 5, y: 5 })).toBe(false);
    expect(shape.hitTest({ x: 150, y: 80 })).toBe(false);
  });

  test('should handle movement operations', () => {
    shape.moveTo({ x: 100, y: 200 });
    expect(shape.position).toEqual({ x: 100, y: 200 });

    shape.moveBy({ x: 10, y: -5 });
    expect(shape.position).toEqual({ x: 110, y: 195 });
  });

  test('should handle resize operations', () => {
    shape.resize({ width: 200, height: 150 });
    expect(shape.size).toEqual({ width: 200, height: 150 });
  });

  test('should handle rotation', () => {
    shape.rotate(Math.PI / 2);
    expect(shape.rotation).toBe(Math.PI / 2);
  });

  test('should handle scaling', () => {
    shape.scale(2, 3);
    expect(shape.transform.scaleX).toBe(2);
    expect(shape.transform.scaleY).toBe(3);
  });

  test('should handle opacity', () => {
    shape.setOpacity(0.5);
    expect(shape.opacity).toBe(0.5);

    shape.setOpacity(1.5); // Should clamp to 1
    expect(shape.opacity).toBe(1);

    shape.setOpacity(-0.5); // Should clamp to 0
    expect(shape.opacity).toBe(0);
  });

  test('should handle visibility', () => {
    expect(shape.visible).toBe(true);

    shape.hide();
    expect(shape.visible).toBe(false);

    shape.show();
    expect(shape.visible).toBe(true);
  });

  test('should calculate transformation matrix correctly', () => {
    const matrix = shape.getTransformationMatrix();

    // Identity transform with translation
    expect(matrix).toEqual([1, 0, 0, 1, 10, 20]);
  });

  test('should calculate transformation matrix with rotation', () => {
    shape.rotate(Math.PI / 2); // 90 degrees
    const matrix = shape.getTransformationMatrix();

    // Should be approximately [0, 1, -1, 0, 10, 20] for 90-degree rotation
    expect(matrix[0]).toBeCloseTo(0, 10);
    expect(matrix[1]).toBeCloseTo(1, 10);
    expect(matrix[2]).toBeCloseTo(-1, 10);
    expect(matrix[3]).toBeCloseTo(0, 10);
    expect(matrix[4]).toBe(10);
    expect(matrix[5]).toBe(20);
  });

  test('should clone shape correctly', () => {
    shape.setOpacity(0.7);
    shape.rotate(0.5);

    const cloned = shape.clone();

    expect(cloned.id).not.toBe(shape.id);
    expect(cloned.position).toEqual(shape.position);
    expect(cloned.size).toEqual(shape.size);
    expect(cloned.opacity).toBe(shape.opacity);
    expect(cloned.rotation).toBe(shape.rotation);
    expect(cloned.visible).toBe(shape.visible);
  });

  test('should serialize to JSON correctly', () => {
    const json = shape.toJSON();

    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('type', ShapeType.RECTANGLE);
    expect(json).toHaveProperty('position', { x: 10, y: 20 });
    expect(json).toHaveProperty('size', { width: 100, height: 50 });
    expect(json).toHaveProperty('rotation', 0);
    expect(json).toHaveProperty('opacity', 1);
    expect(json).toHaveProperty('zIndex', 0);
    expect(json).toHaveProperty('visible', true);
  });

  test('should check visibility in viewport', () => {
    const viewportBounds = { x: 0, y: 0, width: 200, height: 100 };

    expect(shape.isVisible(viewportBounds)).toBe(true);

    // Move shape outside viewport
    shape.moveTo({ x: 300, y: 300 });
    expect(shape.isVisible(viewportBounds)).toBe(false);

    // Hide shape
    shape.moveTo({ x: 50, y: 50 });
    shape.hide();
    expect(shape.isVisible(viewportBounds)).toBe(false);
  });
});