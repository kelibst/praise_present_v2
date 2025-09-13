import { RenderingEngine } from '../core/RenderingEngine';
import { RectangleShape } from '../shapes/RectangleShape';
import { createColor } from '../types/geometry';

// Mock HTMLCanvasElement
class MockCanvas {
  public width = 800;
  public height = 600;
  public clientWidth = 800;
  public clientHeight = 600;

  getContext(type: string) {
    return {
      save: jest.fn(),
      restore: jest.fn(),
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
      canvas: this,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    };
  }

  toDataURL() {
    return 'data:image/png;base64,mock';
  }
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

describe('RenderingEngine', () => {
  let canvas: MockCanvas;
  let engine: RenderingEngine;

  beforeEach(() => {
    canvas = new MockCanvas();
    engine = new RenderingEngine({
      canvas: canvas as any,
      enableDebug: false,
      settings: {
        quality: 'high',
        targetFPS: 60,
        enableCaching: true,
        enableGPUAcceleration: false, // Disable for testing
        debugMode: false
      }
    });
  });

  afterEach(() => {
    engine.dispose();
  });

  test('should initialize with default settings', () => {
    expect(engine).toBeDefined();
    expect(engine.getAllShapes()).toHaveLength(0);
  });

  test('should add and remove shapes', () => {
    const shape = new RectangleShape(
      { position: { x: 10, y: 10 }, size: { width: 100, height: 50 } },
      { fill: createColor(255, 0, 0) }
    );

    engine.addShape(shape);
    expect(engine.getAllShapes()).toHaveLength(1);
    expect(engine.getShape(shape.id)).toBe(shape);

    const removed = engine.removeShape(shape.id);
    expect(removed).toBe(true);
    expect(engine.getAllShapes()).toHaveLength(0);
    expect(engine.getShape(shape.id)).toBeUndefined();
  });

  test('should handle shape ordering', () => {
    const shape1 = new RectangleShape();
    const shape2 = new RectangleShape();

    shape1.setZIndex(1);
    shape2.setZIndex(2);

    engine.addShape(shape1);
    engine.addShape(shape2);

    const shapes = engine.getAllShapes();
    expect(shapes[0]).toBe(shape1); // Lower z-index first
    expect(shapes[1]).toBe(shape2);

    engine.moveShapeToFront(shape1.id);
    const reorderedShapes = engine.getAllShapes();
    expect(reorderedShapes[1]).toBe(shape1); // Should now be on top
  });

  test('should clear all shapes', () => {
    engine.addShape(new RectangleShape());
    engine.addShape(new RectangleShape());

    expect(engine.getAllShapes()).toHaveLength(2);

    engine.clearShapes();
    expect(engine.getAllShapes()).toHaveLength(0);
  });

  test('should handle viewport changes', () => {
    const viewport = engine.getViewport();
    expect(viewport.width).toBe(800);
    expect(viewport.height).toBe(600);

    engine.resize(1200, 900);
    const newViewport = engine.getViewport();
    expect(newViewport.width).toBe(1200);
    expect(newViewport.height).toBe(900);
  });

  test('should handle hit testing', () => {
    const shape = new RectangleShape(
      { position: { x: 50, y: 50 }, size: { width: 100, height: 100 } }
    );
    engine.addShape(shape);

    const hitShape = engine.getShapeAt({ x: 75, y: 75 });
    expect(hitShape).toBe(shape);

    const missedShape = engine.getShapeAt({ x: 200, y: 200 });
    expect(missedShape).toBeNull();
  });

  test('should export as image', () => {
    const dataUrl = engine.exportAsImage('png', 1);
    expect(dataUrl).toBe('data:image/png;base64,mock');
  });

  test('should track performance metrics', () => {
    const metrics = engine.getPerformanceMetrics();

    expect(metrics).toHaveProperty('frameTime');
    expect(metrics).toHaveProperty('renderTime');
    expect(metrics).toHaveProperty('shapeCount');
    expect(metrics).toHaveProperty('memoryUsage');
    expect(metrics).toHaveProperty('fps');
  });

  test('should handle render settings updates', () => {
    const initialSettings = engine.getSettings();
    expect(initialSettings.quality).toBe('high');

    engine.updateSettings({ quality: 'low' });
    const updatedSettings = engine.getSettings();
    expect(updatedSettings.quality).toBe('low');
  });

  test('should render without errors', () => {
    const shape = new RectangleShape(
      { position: { x: 10, y: 10 }, size: { width: 100, height: 50 } },
      { fill: createColor(255, 0, 0) }
    );

    engine.addShape(shape);

    // Should not throw
    expect(() => {
      engine.render();
    }).not.toThrow();
  });

  test('should handle shape collection operations', () => {
    const shapes = [
      new RectangleShape({ position: { x: 0, y: 0 } }),
      new RectangleShape({ position: { x: 100, y: 100 } }),
      new RectangleShape({ position: { x: 200, y: 200 } })
    ];

    shapes.forEach(shape => engine.addShape(shape));

    const collection = engine.getShapeCollection();
    expect(collection.getShapeCount()).toBe(3);

    const visibleShapes = engine.getVisibleShapes();
    expect(visibleShapes).toHaveLength(3);

    // Hide one shape
    shapes[1].hide();
    const visibleAfterHide = engine.getVisibleShapes();
    expect(visibleAfterHide).toHaveLength(2);
  });
});