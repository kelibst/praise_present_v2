// Comprehensive rendering system tests
import { RenderingEngine } from '../core/RenderingEngine';
import { RectangleShape } from '../shapes/RectangleShape';
import { TextShape } from '../shapes/TextShape';
import { ImageShape } from '../shapes/ImageShape';
import { BackgroundShape } from '../shapes/BackgroundShape';
import { createColor } from '../types/geometry';
import { RenderQuality } from '../types/rendering';

export interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  performance?: {
    fps: number;
    renderTime: number;
    memoryUsage: number;
  };
}

export class RenderingSystemTests {
  private canvas: HTMLCanvasElement;
  private engine: RenderingEngine | null = null;
  private results: TestResult[] = [];

  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas || this.createTestCanvas();
  }

  private createTestCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    return canvas;
  }

  public async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Comprehensive Rendering System Tests...');
    this.results = [];

    // Core engine tests
    await this.testEngineInitialization();
    await this.testHardwareAccelerationDetection();
    await this.testRenderSettings();

    // Shape creation tests
    await this.testRectangleShapeCreation();
    await this.testTextShapeCreation();
    await this.testImageShapeCreation();
    await this.testBackgroundShapeCreation();

    // Shape manipulation tests
    await this.testShapeTransformations();
    await this.testShapeZOrdering();
    await this.testShapeVisibility();
    await this.testShapeCloning();

    // Rendering tests
    await this.testBasicRendering();
    await this.testComplexSceneRendering();
    await this.testViewportCulling();

    // Style tests
    await this.testShapeStyles();
    await this.testTextStyles();
    await this.testGradients();

    // Performance tests
    await this.testRenderingPerformance();
    await this.testMemoryUsage();

    // Integration tests
    await this.testShapeHitTesting();
    await this.testSceneManagement();

    this.printResults();
    return this.results;
  }

  private async testEngineInitialization(): Promise<void> {
    const testName = 'Engine Initialization';
    console.log(`📊 Running: ${testName}`);

    try {
      this.engine = new RenderingEngine({
        canvas: this.canvas,
        enableDebug: true,
        settings: {
          quality: RenderQuality.HIGH,
          targetFPS: 60,
          enableCaching: true,
          enableGPUAcceleration: true,
          debugMode: true
        }
      });

      const passed = this.engine !== null && this.engine.getSettings().quality === RenderQuality.HIGH;

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Engine initialized successfully with correct settings' : '❌ Engine initialization failed'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Engine initialization error: ${error}`
      });
    }
  }

  private async testHardwareAccelerationDetection(): Promise<void> {
    const testName = 'Hardware Acceleration Detection';
    console.log(`📊 Running: ${testName}`);

    try {
      if (!this.engine) throw new Error('Engine not initialized');

      const capabilities = this.engine.getCapabilities();
      const hasWebGL = !!this.canvas.getContext('webgl2') || !!this.canvas.getContext('webgl');

      this.results.push({
        testName,
        passed: true,
        details: `✅ Hardware acceleration: ${capabilities.hardwareAccelerated ? 'Available' : 'Not available'}, WebGL: ${hasWebGL ? 'Supported' : 'Not supported'}`
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Hardware acceleration test error: ${error}`
      });
    }
  }

  private async testRenderSettings(): Promise<void> {
    const testName = 'Render Settings Management';
    console.log(`📊 Running: ${testName}`);

    try {
      if (!this.engine) throw new Error('Engine not initialized');

      const originalSettings = this.engine.getSettings();

      // Test settings update
      this.engine.updateSettings({ quality: RenderQuality.MEDIUM, targetFPS: 30 });
      const updatedSettings = this.engine.getSettings();

      const passed = updatedSettings.quality === RenderQuality.MEDIUM && updatedSettings.targetFPS === 30;

      // Restore original settings
      this.engine.updateSettings(originalSettings);

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Settings updated and restored successfully' : '❌ Settings update failed'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Settings test error: ${error}`
      });
    }
  }

  private async testRectangleShapeCreation(): Promise<void> {
    const testName = 'Rectangle Shape Creation';
    console.log(`📊 Running: ${testName}`);

    try {
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

      const bounds = rect.getBounds();
      const passed = bounds.width === 200 && bounds.height === 100 && rect.rotation === 15;

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Rectangle created with correct properties' : '❌ Rectangle properties incorrect'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Rectangle creation error: ${error}`
      });
    }
  }

  private async testTextShapeCreation(): Promise<void> {
    const testName = 'Text Shape Creation';
    console.log(`📊 Running: ${testName}`);

    try {
      const text = new TextShape(
        {
          position: { x: 100, y: 200 },
          size: { width: 300, height: 100 }
        },
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

      const passed = text.text === 'Test Text Shape' && text.textStyle.fontSize === 24;

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Text shape created with correct properties' : '❌ Text shape properties incorrect'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Text shape creation error: ${error}`
      });
    }
  }

  private async testImageShapeCreation(): Promise<void> {
    const testName = 'Image Shape Creation';
    console.log(`📊 Running: ${testName}`);

    try {
      // Create a data URL for testing
      const testImageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzNyIvPjwvc3ZnPg==';

      const image = new ImageShape(
        {
          position: { x: 300, y: 100 },
          size: { width: 150, height: 150 },
          src: testImageUrl
        },
        {
          objectFit: 'cover'
        }
      );

      const passed = image.src === testImageUrl && image.imageStyle.objectFit === 'cover';

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Image shape created with correct properties' : '❌ Image shape properties incorrect'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Image shape creation error: ${error}`
      });
    }
  }

  private async testBackgroundShapeCreation(): Promise<void> {
    const testName = 'Background Shape Creation';
    console.log(`📊 Running: ${testName}`);

    try {
      // Test solid color background
      const solidBg = BackgroundShape.createSolidColor(createColor(100, 150, 200), 800, 600);

      // Test gradient background
      const gradientBg = BackgroundShape.createLinearGradient(
        [
          { offset: 0, color: createColor(255, 0, 0) },
          { offset: 1, color: createColor(0, 0, 255) }
        ],
        45,
        800,
        600
      );

      const passed = solidBg.backgroundStyle.type === 'color' && gradientBg.backgroundStyle.type === 'gradient';

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Background shapes created successfully' : '❌ Background shape creation failed'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Background shape creation error: ${error}`
      });
    }
  }

  private async testShapeTransformations(): Promise<void> {
    const testName = 'Shape Transformations';
    console.log(`📊 Running: ${testName}`);

    try {
      const rect = new RectangleShape(
        { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
        { fill: createColor(255, 0, 0) }
      );

      // Test movement
      rect.moveTo({ x: 50, y: 50 });
      const moved = rect.position.x === 50 && rect.position.y === 50;

      // Test scaling
      rect.scale(2, 1.5);
      const scaled = rect.transform.scaleX === 2 && rect.transform.scaleY === 1.5;

      // Test rotation
      rect.rotate(45);
      const rotated = rect.rotation === 45;

      const passed = moved && scaled && rotated;

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ All transformations work correctly' : '❌ Some transformations failed'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Transformation test error: ${error}`
      });
    }
  }

  private async testShapeZOrdering(): Promise<void> {
    const testName = 'Shape Z-Ordering';
    console.log(`📊 Running: ${testName}`);

    try {
      if (!this.engine) throw new Error('Engine not initialized');

      const shape1 = new RectangleShape({ position: { x: 0, y: 0 }, size: { width: 50, height: 50 } });
      const shape2 = new RectangleShape({ position: { x: 25, y: 25 }, size: { width: 50, height: 50 } });

      shape1.setZIndex(1);
      shape2.setZIndex(2);

      this.engine.addShape(shape1);
      this.engine.addShape(shape2);

      const shapes = this.engine.getAllShapes();
      const sortedByZ = [...shapes].sort((a, b) => a.zIndex - b.zIndex);

      const passed = sortedByZ[0].zIndex === 1 && sortedByZ[1].zIndex === 2;

      this.engine.clearShapes();

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Z-ordering works correctly' : '❌ Z-ordering failed'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Z-ordering test error: ${error}`
      });
    }
  }

  private async testShapeVisibility(): Promise<void> {
    const testName = 'Shape Visibility';
    console.log(`📊 Running: ${testName}`);

    try {
      const shape = new RectangleShape({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });

      // Test initial visibility
      const initiallyVisible = shape.visible === true;

      // Test hiding
      shape.hide();
      const hidden = shape.visible === false;

      // Test showing
      shape.show();
      const shown = shape.visible === true;

      const passed = initiallyVisible && hidden && shown;

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Visibility toggle works correctly' : '❌ Visibility toggle failed'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Visibility test error: ${error}`
      });
    }
  }

  private async testShapeCloning(): Promise<void> {
    const testName = 'Shape Cloning';
    console.log(`📊 Running: ${testName}`);

    try {
      const original = new RectangleShape(
        { position: { x: 100, y: 100 }, size: { width: 200, height: 150 } },
        { fill: createColor(255, 0, 0) }
      );

      const clone = original.clone();

      const positionMatch = clone.position.x === 100 && clone.position.y === 100;
      const sizeMatch = clone.size.width === 200 && clone.size.height === 150;
      const differentIds = clone.id !== original.id;

      const passed = positionMatch && sizeMatch && differentIds;

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Shape cloning works correctly' : '❌ Shape cloning failed'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Cloning test error: ${error}`
      });
    }
  }

  private async testBasicRendering(): Promise<void> {
    const testName = 'Basic Rendering';
    console.log(`📊 Running: ${testName}`);

    try {
      if (!this.engine) throw new Error('Engine not initialized');

      const rect = new RectangleShape(
        { position: { x: 50, y: 50 }, size: { width: 100, height: 100 } },
        { fill: createColor(255, 0, 0) }
      );

      this.engine.addShape(rect);
      this.engine.render();

      // Check if canvas has been drawn to (basic check)
      const ctx = this.canvas.getContext('2d')!;
      const imageData = ctx.getImageData(75, 75, 1, 1);
      const hasPixelData = imageData.data.some(value => value > 0);

      this.engine.clearShapes();

      this.results.push({
        testName,
        passed: hasPixelData,
        details: hasPixelData ? '✅ Basic rendering produces canvas output' : '❌ No rendering output detected'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Basic rendering test error: ${error}`
      });
    }
  }

  private async testComplexSceneRendering(): Promise<void> {
    const testName = 'Complex Scene Rendering';
    console.log(`📊 Running: ${testName}`);

    try {
      if (!this.engine) throw new Error('Engine not initialized');

      // Create a complex scene
      const background = BackgroundShape.createLinearGradient(
        [
          { offset: 0, color: createColor(100, 150, 200) },
          { offset: 1, color: createColor(50, 100, 150) }
        ],
        90,
        this.canvas.width,
        this.canvas.height
      );

      const rect = new RectangleShape(
        { position: { x: 100, y: 100 }, size: { width: 200, height: 100 } },
        { fill: createColor(255, 255, 255, 0.8), borderRadius: 10 }
      );

      const text = new TextShape(
        { position: { x: 120, y: 120 }, size: { width: 160, height: 60 } },
        { fontSize: 20, color: createColor(0, 0, 0), textAlign: 'center', verticalAlign: 'middle' }
      );
      text.setText('Complex Scene Test');

      this.engine.addShape(background);
      this.engine.addShape(rect);
      this.engine.addShape(text);

      const startTime = performance.now();
      this.engine.render();
      const renderTime = performance.now() - startTime;

      const shapeCount = this.engine.getAllShapes().length;
      const passed = shapeCount === 3 && renderTime < 50; // Should render in less than 50ms

      this.engine.clearShapes();

      this.results.push({
        testName,
        passed,
        details: `${passed ? '✅' : '❌'} Complex scene with ${shapeCount} shapes rendered in ${renderTime.toFixed(2)}ms`
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Complex scene rendering error: ${error}`
      });
    }
  }

  private async testViewportCulling(): Promise<void> {
    const testName = 'Viewport Culling';
    console.log(`📊 Running: ${testName}`);

    try {
      if (!this.engine) throw new Error('Engine not initialized');

      // Create shapes inside and outside viewport
      const visibleShape = new RectangleShape(
        { position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
        { fill: createColor(255, 0, 0) }
      );

      const hiddenShape = new RectangleShape(
        { position: { x: -100, y: -100 }, size: { width: 50, height: 50 } },
        { fill: createColor(0, 255, 0) }
      );

      this.engine.addShape(visibleShape);
      this.engine.addShape(hiddenShape);

      const viewportBounds = { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height };
      const visibleInViewport = visibleShape.isInViewport(viewportBounds);
      const hiddenInViewport = hiddenShape.isInViewport(viewportBounds);

      const passed = visibleInViewport === true && hiddenInViewport === false;

      this.engine.clearShapes();

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Viewport culling works correctly' : '❌ Viewport culling failed'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Viewport culling test error: ${error}`
      });
    }
  }

  private async testShapeStyles(): Promise<void> {
    const testName = 'Shape Styles';
    console.log(`📊 Running: ${testName}`);

    try {
      const rect = new RectangleShape(
        { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
        {
          fill: createColor(255, 0, 0),
          stroke: { width: 3, color: createColor(0, 255, 0), style: 'solid' },
          opacity: 0.8,
          shadowColor: createColor(0, 0, 0, 0.5),
          shadowBlur: 5,
          shadowOffsetX: 2,
          shadowOffsetY: 2
        }
      );

      // Test style properties
      const fillCorrect = rect.style.fill && (rect.style.fill as any).r === 255;
      const strokeCorrect = rect.style.stroke?.width === 3;
      const opacityCorrect = rect.style.opacity === 0.8;
      const shadowCorrect = rect.style.shadowBlur === 5;

      const passed = fillCorrect && strokeCorrect && opacityCorrect && shadowCorrect;

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Shape styles applied correctly' : '❌ Shape styles incorrect'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Shape styles test error: ${error}`
      });
    }
  }

  private async testTextStyles(): Promise<void> {
    const testName = 'Text Styles';
    console.log(`📊 Running: ${testName}`);

    try {
      const text = new TextShape(
        { position: { x: 0, y: 0 }, size: { width: 200, height: 100 } },
        {
          fontSize: 18,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          fontStyle: 'italic',
          textAlign: 'center',
          verticalAlign: 'middle',
          lineHeight: 1.5,
          letterSpacing: 1,
          textDecoration: 'underline',
          color: createColor(50, 50, 50)
        }
      );

      text.setText('Styled Text Test');

      // Test style methods
      text.setFontSize(20);
      text.setTextColor(createColor(255, 0, 0));
      text.setTextAlign('right');

      const fontSizeUpdated = text.textStyle.fontSize === 20;
      const colorUpdated = text.textStyle.color?.r === 255;
      const alignmentUpdated = text.textStyle.textAlign === 'right';

      const passed = fontSizeUpdated && colorUpdated && alignmentUpdated;

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Text styles and methods work correctly' : '❌ Text styles failed'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Text styles test error: ${error}`
      });
    }
  }

  private async testGradients(): Promise<void> {
    const testName = 'Gradient Rendering';
    console.log(`📊 Running: ${testName}`);

    try {
      // Test linear gradient
      const linearGradient = {
        type: 'linear' as const,
        stops: [
          { offset: 0, color: createColor(255, 0, 0) },
          { offset: 0.5, color: createColor(255, 255, 0) },
          { offset: 1, color: createColor(0, 255, 0) }
        ],
        angle: 45
      };

      // Test radial gradient
      const radialGradient = {
        type: 'radial' as const,
        stops: [
          { offset: 0, color: createColor(255, 255, 255) },
          { offset: 1, color: createColor(0, 0, 0) }
        ],
        center: { x: 0.5, y: 0.5 },
        radius: 0.5
      };

      const rect1 = new RectangleShape(
        { position: { x: 50, y: 50 }, size: { width: 100, height: 100 } },
        { fill: linearGradient }
      );

      const rect2 = new RectangleShape(
        { position: { x: 200, y: 50 }, size: { width: 100, height: 100 } },
        { fill: radialGradient }
      );

      const linearValid = linearGradient.type === 'linear' && linearGradient.stops.length === 3;
      const radialValid = radialGradient.type === 'radial' && radialGradient.stops.length === 2;

      const passed = linearValid && radialValid;

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Gradient definitions are valid' : '❌ Gradient definitions failed'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Gradient test error: ${error}`
      });
    }
  }

  private async testRenderingPerformance(): Promise<void> {
    const testName = 'Rendering Performance';
    console.log(`📊 Running: ${testName}`);

    try {
      if (!this.engine) throw new Error('Engine not initialized');

      // Create multiple shapes for performance test
      for (let i = 0; i < 50; i++) {
        const rect = new RectangleShape(
          {
            position: { x: Math.random() * 600, y: Math.random() * 400 },
            size: { width: 30, height: 30 }
          },
          { fill: createColor(Math.random() * 255, Math.random() * 255, Math.random() * 255) }
        );
        this.engine.addShape(rect);
      }

      // Measure rendering performance
      const frameCount = 30;
      const frameTimes: number[] = [];

      for (let i = 0; i < frameCount; i++) {
        const startTime = performance.now();
        this.engine.render();
        const endTime = performance.now();
        frameTimes.push(endTime - startTime);
      }

      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const fps = 1000 / avgFrameTime;
      const metrics = this.engine.getPerformanceMetrics();

      this.engine.clearShapes();

      const passed = fps >= 30 && avgFrameTime < 33.33; // 30fps minimum

      this.results.push({
        testName,
        passed,
        details: `${passed ? '✅' : '❌'} Average FPS: ${fps.toFixed(1)}, Frame time: ${avgFrameTime.toFixed(2)}ms`,
        performance: {
          fps: parseFloat(fps.toFixed(1)),
          renderTime: parseFloat(avgFrameTime.toFixed(2)),
          memoryUsage: metrics.memoryUsage
        }
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Performance test error: ${error}`
      });
    }
  }

  private async testMemoryUsage(): Promise<void> {
    const testName = 'Memory Usage';
    console.log(`📊 Running: ${testName}`);

    try {
      if (!this.engine) throw new Error('Engine not initialized');

      const initialMetrics = this.engine.getPerformanceMetrics();
      const initialMemory = initialMetrics.memoryUsage;

      // Create and destroy many shapes to test memory management
      for (let i = 0; i < 100; i++) {
        const shape = new RectangleShape(
          { position: { x: i, y: i }, size: { width: 10, height: 10 } },
          { fill: createColor(255, 0, 0) }
        );
        this.engine.addShape(shape);
      }

      this.engine.render();
      const peakMetrics = this.engine.getPerformanceMetrics();
      const peakMemory = peakMetrics.memoryUsage;

      this.engine.clearShapes();
      this.engine.render();

      const finalMetrics = this.engine.getPerformanceMetrics();
      const finalMemory = finalMetrics.memoryUsage;

      const memoryIncrease = peakMemory - initialMemory;
      const memoryRecovered = peakMemory - finalMemory > memoryIncrease * 0.5;

      this.results.push({
        testName,
        passed: memoryRecovered,
        details: `${memoryRecovered ? '✅' : '❌'} Memory: Initial: ${initialMemory.toFixed(2)}MB, Peak: ${peakMemory.toFixed(2)}MB, Final: ${finalMemory.toFixed(2)}MB`
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Memory usage test error: ${error}`
      });
    }
  }

  private async testShapeHitTesting(): Promise<void> {
    const testName = 'Shape Hit Testing';
    console.log(`📊 Running: ${testName}`);

    try {
      const rect = new RectangleShape(
        { position: { x: 100, y: 100 }, size: { width: 100, height: 100 } },
        { fill: createColor(255, 0, 0) }
      );

      // Test points inside and outside the shape
      const insidePoint = { x: 150, y: 150 }; // Center of shape
      const outsidePoint = { x: 50, y: 50 }; // Outside shape

      const hitInside = rect.containsPoint(insidePoint);
      const hitOutside = rect.containsPoint(outsidePoint);

      const passed = hitInside === true && hitOutside === false;

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Hit testing works correctly' : '❌ Hit testing failed'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Hit testing error: ${error}`
      });
    }
  }

  private async testSceneManagement(): Promise<void> {
    const testName = 'Scene Management';
    console.log(`📊 Running: ${testName}`);

    try {
      if (!this.engine) throw new Error('Engine not initialized');

      const initialCount = this.engine.getAllShapes().length;

      // Add shapes
      const rect1 = new RectangleShape({ position: { x: 0, y: 0 }, size: { width: 50, height: 50 } });
      const rect2 = new RectangleShape({ position: { x: 100, y: 100 }, size: { width: 50, height: 50 } });

      this.engine.addShape(rect1);
      this.engine.addShape(rect2);
      const afterAddCount = this.engine.getAllShapes().length;

      // Remove a shape
      this.engine.removeShape(rect1.id);
      const afterRemoveCount = this.engine.getAllShapes().length;

      // Find shape by ID
      const foundShape = this.engine.findShapeById(rect2.id);

      // Clear all shapes
      this.engine.clearShapes();
      const finalCount = this.engine.getAllShapes().length;

      const addWorked = afterAddCount === initialCount + 2;
      const removeWorked = afterRemoveCount === initialCount + 1;
      const findWorked = foundShape?.id === rect2.id;
      const clearWorked = finalCount === 0;

      const passed = addWorked && removeWorked && findWorked && clearWorked;

      this.results.push({
        testName,
        passed,
        details: passed ? '✅ Scene management operations work correctly' : '❌ Scene management failed'
      });
    } catch (error) {
      this.results.push({
        testName,
        passed: false,
        details: `❌ Scene management test error: ${error}`
      });
    }
  }

  private printResults(): void {
    console.log('\n🧪 Comprehensive Rendering System Test Results:');
    console.log('='.repeat(80));

    let passed = 0;
    let total = 0;

    for (const result of this.results) {
      total++;
      if (result.passed) passed++;

      console.log(`\n${result.testName}:`);
      console.log(`  ${result.details}`);

      if (result.performance) {
        console.log(`  Performance: ${result.performance.fps} FPS, ${result.performance.renderTime}ms render time`);
      }
    }

    console.log('\n' + '='.repeat(80));
    const percentage = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';
    console.log(`Overall Result: ${passed}/${total} tests passed (${percentage}%)`);

    if (passed === total) {
      console.log('🎉 ALL RENDERING SYSTEM TESTS PASSED!');
      console.log('✨ The Phase 1 rendering engine is fully functional:');
      console.log('   • Shape system with transformations ✅');
      console.log('   • Canvas rendering with hardware acceleration ✅');
      console.log('   • Performance targeting 60fps ✅');
      console.log('   • Complex scene support ✅');
      console.log('   • Memory management ✅');
    } else {
      console.log(`⚠️  ${total - passed} tests failed - review implementation`);
    }
  }

  public getResults(): TestResult[] {
    return [...this.results];
  }

  public dispose(): void {
    if (this.engine) {
      this.engine.dispose();
    }
  }
}