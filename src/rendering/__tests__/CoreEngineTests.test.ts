// Core engine unit tests with jest setup
import { RenderingEngine } from '../core/RenderingEngine';
import { RectangleShape } from '../shapes/RectangleShape';
import { TextShape } from '../shapes/TextShape';
import { createColor } from '../types/geometry';
import { RenderQuality } from '../types/rendering';

// Mock canvas for testing environment
class MockCanvas {
  public width: number = 800;
  public height: number = 600;
  private context: MockCanvasContext;

  constructor() {
    this.context = new MockCanvasContext();
  }

  getContext(type: string): MockCanvasContext | null {
    if (type === '2d' || type === 'webgl' || type === 'webgl2') {
      return this.context;
    }
    return null;
  }
}

class MockCanvasContext {
  public fillStyle: string = '#000000';
  public strokeStyle: string = '#000000';
  public lineWidth: number = 1;
  public font: string = '10px sans-serif';
  public textAlign: CanvasTextAlign = 'start';
  public textBaseline: CanvasTextBaseline = 'alphabetic';
  public globalAlpha: number = 1;

  save(): void {}
  restore(): void {}
  setTransform(): void {}
  clearRect(): void {}
  fillRect(): void {}
  strokeRect(): void {}
  fillText(): void {}
  strokeText(): void {}
  beginPath(): void {}
  closePath(): void {}
  moveTo(): void {}
  lineTo(): void {}
  stroke(): void {}
  fill(): void {}

  measureText(text: string): TextMetrics {
    return {
      width: text.length * 8, // Approximate width
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: text.length * 8,
      fontBoundingBoxAscent: 10,
      fontBoundingBoxDescent: 2,
      actualBoundingBoxAscent: 8,
      actualBoundingBoxDescent: 2,
      emHeightAscent: 8,
      emHeightDescent: 2,
      hangingBaseline: 6,
      alphabeticBaseline: 8,
      ideographicBaseline: 10
    };
  }

  createLinearGradient(): CanvasGradient {
    return {} as CanvasGradient;
  }

  createRadialGradient(): CanvasGradient {
    return {} as CanvasGradient;
  }

  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
    const data = new Uint8ClampedArray(sw * sh * 4);
    // Fill with some mock data
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128;     // R
      data[i + 1] = 128; // G
      data[i + 2] = 128; // B
      data[i + 3] = 255; // A
    }
    return { data, width: sw, height: sh, colorSpace: 'srgb' };
  }
}

// Mock performance.now for consistent testing
const mockPerformanceNow = () => {
  let currentTime = 0;
  return {
    now: jest.fn(() => {
      currentTime += 16.67; // Simulate 60fps
      return currentTime;
    }),
    reset: () => { currentTime = 0; }
  };
};

describe('RenderingEngine Core Tests', () => {
  let canvas: MockCanvas;
  let engine: RenderingEngine;
  let mockPerf: ReturnType<typeof mockPerformanceNow>;

  beforeEach(() => {
    canvas = new MockCanvas();
    mockPerf = mockPerformanceNow();

    // Mock global performance
    global.performance = mockPerf as any;

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn((callback) => {
      setTimeout(callback, 16);
      return 1;
    });

    engine = new RenderingEngine({
      canvas: canvas as any,
      enableDebug: true,
      settings: {
        quality: RenderQuality.HIGH,
        targetFPS: 60,
        enableCaching: true,
        enableGPUAcceleration: true,
        debugMode: true
      }
    });
  });

  afterEach(() => {
    if (engine) {
      engine.dispose();
    }
    jest.clearAllMocks();
  });

  describe('Engine Initialization', () => {
    test('should initialize with correct settings', () => {
      const settings = engine.getSettings();
      expect(settings.quality).toBe(RenderQuality.HIGH);
      expect(settings.targetFPS).toBe(60);
      expect(settings.enableCaching).toBe(true);
    });

    test('should detect capabilities', () => {
      const capabilities = engine.getCapabilities();
      expect(capabilities).toHaveProperty('hardwareAccelerated');
      expect(capabilities).toHaveProperty('maxTextureSize');
      expect(capabilities).toHaveProperty('supportedFormats');
    });

    test('should update settings', () => {
      engine.updateSettings({ quality: RenderQuality.MEDIUM, targetFPS: 30 });
      const settings = engine.getSettings();
      expect(settings.quality).toBe(RenderQuality.MEDIUM);
      expect(settings.targetFPS).toBe(30);
    });
  });

  describe('Shape Management', () => {
    test('should add shapes to engine', () => {
      const rect = new RectangleShape(
        { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
        { fill: createColor(255, 0, 0) }
      );

      engine.addShape(rect);
      expect(engine.getAllShapes()).toHaveLength(1);
      expect(engine.getAllShapes()[0]).toBe(rect);
    });

    test('should remove shapes from engine', () => {
      const rect1 = new RectangleShape(
        { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }
      );
      const rect2 = new RectangleShape(
        { position: { x: 100, y: 100 }, size: { width: 100, height: 100 } }
      );

      engine.addShape(rect1);
      engine.addShape(rect2);
      expect(engine.getAllShapes()).toHaveLength(2);

      engine.removeShape(rect1.id);
      expect(engine.getAllShapes()).toHaveLength(1);
      expect(engine.getAllShapes()[0]).toBe(rect2);
    });

    test('should find shapes by ID', () => {
      const rect = new RectangleShape(
        { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }
      );

      engine.addShape(rect);
      const foundShape = engine.findShapeById(rect.id);
      expect(foundShape).toBe(rect);

      const notFound = engine.findShapeById('non-existent-id');
      expect(notFound).toBeNull();
    });

    test('should clear all shapes', () => {
      const rect1 = new RectangleShape({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
      const rect2 = new RectangleShape({ position: { x: 100, y: 100 }, size: { width: 100, height: 100 } });

      engine.addShape(rect1);
      engine.addShape(rect2);
      expect(engine.getAllShapes()).toHaveLength(2);

      engine.clearShapes();
      expect(engine.getAllShapes()).toHaveLength(0);
    });

    test('should sort shapes by z-index', () => {
      const rect1 = new RectangleShape({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
      const rect2 = new RectangleShape({ position: { x: 50, y: 50 }, size: { width: 100, height: 100 } });
      const rect3 = new RectangleShape({ position: { x: 100, y: 100 }, size: { width: 100, height: 100 } });

      rect1.setZIndex(2);
      rect2.setZIndex(1);
      rect3.setZIndex(3);

      engine.addShape(rect1);
      engine.addShape(rect2);
      engine.addShape(rect3);

      const shapes = engine.getAllShapes();
      const sortedShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);

      expect(sortedShapes[0]).toBe(rect2); // zIndex 1
      expect(sortedShapes[1]).toBe(rect1); // zIndex 2
      expect(sortedShapes[2]).toBe(rect3); // zIndex 3
    });
  });

  describe('Rendering', () => {
    test('should render without errors', () => {
      const rect = new RectangleShape(
        { position: { x: 50, y: 50 }, size: { width: 100, height: 100 } },
        { fill: createColor(255, 0, 0) }
      );

      engine.addShape(rect);

      expect(() => {
        engine.render();
      }).not.toThrow();
    });

    test('should track performance metrics', () => {
      const rect = new RectangleShape(
        { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }
      );

      engine.addShape(rect);
      engine.render();

      const metrics = engine.getPerformanceMetrics();
      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('renderTime');
      expect(metrics).toHaveProperty('shapeCount');
      expect(metrics.shapeCount).toBe(1);
    });

    test('should handle empty scene rendering', () => {
      expect(() => {
        engine.render();
      }).not.toThrow();

      const metrics = engine.getPerformanceMetrics();
      expect(metrics.shapeCount).toBe(0);
    });

    test('should render shapes in z-index order', () => {
      const renderOrder: string[] = [];

      // Mock the render method to track call order
      const mockRender = jest.fn();

      const rect1 = new RectangleShape({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
      const rect2 = new RectangleShape({ position: { x: 50, y: 50 }, size: { width: 100, height: 100 } });

      rect1.setZIndex(2);
      rect2.setZIndex(1);

      // Override render method to track calls
      rect1.render = jest.fn(() => renderOrder.push(rect1.id));
      rect2.render = jest.fn(() => renderOrder.push(rect2.id));

      engine.addShape(rect1);
      engine.addShape(rect2);
      engine.render();

      expect(renderOrder[0]).toBe(rect2.id); // Lower z-index renders first
      expect(renderOrder[1]).toBe(rect1.id); // Higher z-index renders last
    });
  });

  describe('Performance', () => {
    test('should maintain target FPS with reasonable load', () => {
      // Add multiple shapes
      for (let i = 0; i < 10; i++) {
        const rect = new RectangleShape(
          { position: { x: i * 50, y: i * 50 }, size: { width: 30, height: 30 } },
          { fill: createColor(Math.random() * 255, Math.random() * 255, Math.random() * 255) }
        );
        engine.addShape(rect);
      }

      // Render multiple frames
      for (let i = 0; i < 10; i++) {
        engine.render();
      }

      const metrics = engine.getPerformanceMetrics();
      expect(metrics.fps).toBeGreaterThan(30); // Should maintain at least 30fps
      expect(metrics.renderTime).toBeLessThan(33.33); // 30fps = 33.33ms per frame
    });

    test('should handle memory efficiently', () => {
      const initialMetrics = engine.getPerformanceMetrics();
      const initialMemory = initialMetrics.memoryUsage;

      // Add and remove shapes multiple times
      for (let cycle = 0; cycle < 5; cycle++) {
        const shapes: RectangleShape[] = [];

        // Add shapes
        for (let i = 0; i < 20; i++) {
          const rect = new RectangleShape(
            { position: { x: i * 10, y: i * 10 }, size: { width: 20, height: 20 } }
          );
          shapes.push(rect);
          engine.addShape(rect);
        }

        engine.render();

        // Remove shapes
        shapes.forEach(shape => engine.removeShape(shape.id));
        engine.render();
      }

      const finalMetrics = engine.getPerformanceMetrics();
      const memoryIncrease = finalMetrics.memoryUsage - initialMemory;

      // Memory increase should be minimal (less than 5MB)
      expect(memoryIncrease).toBeLessThan(5);
    });
  });

  describe('Viewport Culling', () => {
    test('should correctly identify shapes in viewport', () => {
      const visibleRect = new RectangleShape(
        { position: { x: 100, y: 100 }, size: { width: 50, height: 50 } }
      );

      const hiddenRect = new RectangleShape(
        { position: { x: -100, y: -100 }, size: { width: 50, height: 50 } }
      );

      const viewportBounds = { x: 0, y: 0, width: 800, height: 600 };

      expect(visibleRect.isInViewport(viewportBounds)).toBe(true);
      expect(hiddenRect.isInViewport(viewportBounds)).toBe(false);
    });

    test('should handle edge cases in viewport detection', () => {
      const edgeRect = new RectangleShape(
        { position: { x: 795, y: 595 }, size: { width: 10, height: 10 } }
      );

      const viewportBounds = { x: 0, y: 0, width: 800, height: 600 };

      // Shape partially outside viewport should still be considered visible
      expect(edgeRect.isInViewport(viewportBounds)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid shape additions gracefully', () => {
      expect(() => {
        engine.addShape(null as any);
      }).not.toThrow();

      expect(engine.getAllShapes()).toHaveLength(0);
    });

    test('should handle render errors gracefully', () => {
      const faultyShape = new RectangleShape(
        { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }
      );

      // Mock render to throw error
      faultyShape.render = jest.fn(() => {
        throw new Error('Render error');
      });

      engine.addShape(faultyShape);

      expect(() => {
        engine.render();
      }).not.toThrow();
    });
  });
});

describe('Shape Tests', () => {
  describe('RectangleShape', () => {
    test('should create rectangle with correct properties', () => {
      const rect = new RectangleShape(
        {
          position: { x: 50, y: 50 },
          size: { width: 200, height: 100 },
          rotation: 15
        },
        {
          fill: createColor(255, 0, 0, 0.8),
          stroke: {
            width: 2,
            color: createColor(0, 0, 255),
            style: 'solid'
          },
          borderRadius: 10
        }
      );

      expect(rect.position.x).toBe(50);
      expect(rect.position.y).toBe(50);
      expect(rect.size.width).toBe(200);
      expect(rect.size.height).toBe(100);
      expect(rect.rotation).toBe(15);

      const bounds = rect.getBounds();
      expect(bounds.width).toBe(200);
      expect(bounds.height).toBe(100);
    });

    test('should handle transformations correctly', () => {
      const rect = new RectangleShape(
        { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }
      );

      rect.moveTo({ x: 50, y: 75 });
      expect(rect.position.x).toBe(50);
      expect(rect.position.y).toBe(75);

      rect.scale(2, 1.5);
      expect(rect.transform.scaleX).toBe(2);
      expect(rect.transform.scaleY).toBe(1.5);

      rect.rotate(45);
      expect(rect.rotation).toBe(45);
    });

    test('should clone correctly', () => {
      const original = new RectangleShape(
        { position: { x: 100, y: 100 }, size: { width: 200, height: 150 } },
        { fill: createColor(255, 0, 0) }
      );

      const clone = original.clone();

      expect(clone.position.x).toBe(original.position.x);
      expect(clone.position.y).toBe(original.position.y);
      expect(clone.size.width).toBe(original.size.width);
      expect(clone.size.height).toBe(original.size.height);
      expect(clone.id).not.toBe(original.id); // Should have different ID
    });
  });

  describe('TextShape', () => {
    test('should create text shape with correct properties', () => {
      const text = new TextShape(
        { position: { x: 100, y: 200 }, size: { width: 300, height: 100 } },
        {
          fontSize: 24,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          color: createColor(0, 0, 0),
          textAlign: 'center',
          verticalAlign: 'middle'
        }
      );

      text.setText('Test Text Shape');

      expect(text.text).toBe('Test Text Shape');
      expect(text.textStyle.fontSize).toBe(24);
      expect(text.textStyle.fontWeight).toBe('bold');
      expect(text.textStyle.textAlign).toBe('center');
    });

    test('should update text and styles', () => {
      const text = new TextShape(
        { position: { x: 0, y: 0 }, size: { width: 200, height: 100 } }
      );

      text.setText('New Text');
      expect(text.text).toBe('New Text');

      text.setFontSize(20);
      expect(text.textStyle.fontSize).toBe(20);

      text.setTextColor(createColor(255, 0, 0));
      expect(text.textStyle.color?.r).toBe(255);

      text.setTextAlign('right');
      expect(text.textStyle.textAlign).toBe('right');
    });
  });
});

describe('Utility Functions', () => {
  describe('createColor', () => {
    test('should create color with RGB values', () => {
      const color = createColor(255, 128, 64);
      expect(color.r).toBe(255);
      expect(color.g).toBe(128);
      expect(color.b).toBe(64);
      expect(color.a).toBe(1);
    });

    test('should create color with alpha', () => {
      const color = createColor(100, 150, 200, 0.5);
      expect(color.r).toBe(100);
      expect(color.g).toBe(150);
      expect(color.b).toBe(200);
      expect(color.a).toBe(0.5);
    });

    test('should clamp values to valid range', () => {
      const color = createColor(-10, 300, 128, 2);
      expect(color.r).toBe(0);   // Clamped from -10
      expect(color.g).toBe(255); // Clamped from 300
      expect(color.b).toBe(128); // Unchanged
      expect(color.a).toBe(1);   // Clamped from 2
    });
  });
});

export {};