import React, { useEffect, useRef, useState } from 'react';
import {
  RenderingEngine,
  RectangleShape,
  TextShape,
  ImageShape,
  BackgroundShape
} from '../rendering';
import { createColor } from '../rendering/types/geometry';
import { RenderQuality } from '../rendering/types/rendering';

interface RenderingDemoProps {
  width?: number;
  height?: number;
  enableDebug?: boolean;
}

export const RenderingDemo: React.FC<RenderingDemoProps> = ({
  width = 1200,
  height = 800,
  enableDebug = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RenderingEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [fps, setFps] = useState(0);
  const [shapeCount, setShapeCount] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  const [liveDisplayActive, setLiveDisplayActive] = useState(false);
  const [liveDisplayStatus, setLiveDisplayStatus] = useState('Disconnected');

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    try {
      // Initialize rendering engine
      const engine = new RenderingEngine({
        canvas,
        enableDebug,
        settings: {
          quality: RenderQuality.HIGH,
          targetFPS: 60,
          enableCaching: true,
          enableGPUAcceleration: true,
          debugMode: enableDebug
        }
      });

      engineRef.current = engine;

      // Create demo scene
      createDemoScene(engine);

      // Set up performance monitoring
      engine.setRenderCallback(() => {
        const metrics = engine.getPerformanceMetrics();
        setFps(Math.round(metrics.fps));
        setShapeCount(metrics.shapeCount);
        setRenderTime(Math.round(metrics.renderTime * 100) / 100);
      });

      // Start rendering loop
      engine.startRenderLoop();
      setIsInitialized(true);

      console.log('Rendering engine initialized successfully');

    } catch (error) {
      console.error('Failed to initialize rendering engine:', error);
    }

    // Cleanup
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, [enableDebug]);

  const createDemoScene = (engine: RenderingEngine) => {
    // Background
    const background = BackgroundShape.createLinearGradient(
      [
        { offset: 0, color: createColor(45, 55, 72) },
        { offset: 1, color: createColor(74, 85, 104) }
      ],
      135, // diagonal angle
      width,
      height
    );
    background.setOpacity(1);
    engine.addShape(background);

    // Title text
    const titleText = new TextShape(
      {
        position: { x: 50, y: 50 },
        size: { width: width - 100, height: 100 }
      },
      {
        fontSize: 48,
        fontWeight: 'bold',
        color: createColor(255, 255, 255),
        textAlign: 'center',
        verticalAlign: 'middle'
      }
    );
    titleText.setText('PraisePresent Rendering Engine Demo');
    titleText.setZIndex(10);
    engine.addShape(titleText);

    // Subtitle
    const subtitleText = new TextShape(
      {
        position: { x: 50, y: 160 },
        size: { width: width - 100, height: 60 }
      },
      {
        fontSize: 24,
        color: createColor(203, 213, 224),
        textAlign: 'center',
        verticalAlign: 'middle'
      }
    );
    subtitleText.setText('Hardware-Accelerated Canvas Rendering at 60fps');
    subtitleText.setZIndex(10);
    engine.addShape(subtitleText);

    // Feature cards
    createFeatureCard(engine, 100, 280, 'Shape System', 'Base shape class with transformations, z-ordering, and hit testing');
    createFeatureCard(engine, 400, 280, 'Text Rendering', 'Rich text with fonts, alignment, wrapping, and decorations');
    createFeatureCard(engine, 700, 280, 'Image Support', 'Async loading with object-fit and filtering support');

    createFeatureCard(engine, 100, 480, 'Canvas Renderer', 'Hardware acceleration with quality optimization');
    createFeatureCard(engine, 400, 480, 'Performance', 'Real-time metrics and 60fps rendering target');
    createFeatureCard(engine, 700, 480, 'Backgrounds', 'Colors, gradients, and image backgrounds');

    // Animated shapes for performance testing
    createAnimatedShapes(engine);

    console.log(`Created demo scene with ${engine.getAllShapes().length} shapes`);
  };

  const createFeatureCard = (engine: RenderingEngine, x: number, y: number, title: string, description: string) => {
    // Card background
    const cardBg = new RectangleShape(
      {
        position: { x, y },
        size: { width: 250, height: 150 },
        borderRadius: 12
      },
      {
        fill: createColor(255, 255, 255, 0.1),
        stroke: {
          width: 1,
          color: createColor(255, 255, 255, 0.2)
        }
      }
    );
    cardBg.setZIndex(5);
    engine.addShape(cardBg);

    // Card title
    const cardTitle = new TextShape(
      {
        position: { x: x + 20, y: y + 20 },
        size: { width: 210, height: 40 }
      },
      {
        fontSize: 18,
        fontWeight: 'bold',
        color: createColor(255, 255, 255),
        textAlign: 'left',
        verticalAlign: 'top'
      }
    );
    cardTitle.setText(title);
    cardTitle.setZIndex(6);
    engine.addShape(cardTitle);

    // Card description
    const cardDesc = new TextShape(
      {
        position: { x: x + 20, y: y + 60 },
        size: { width: 210, height: 70 }
      },
      {
        fontSize: 14,
        color: createColor(203, 213, 224),
        textAlign: 'left',
        verticalAlign: 'top',
        lineHeight: 1.4
      }
    );
    cardDesc.setText(description);
    cardDesc.setZIndex(6);
    engine.addShape(cardDesc);
  };

  const createAnimatedShapes = (engine: RenderingEngine) => {
    // Create some animated shapes to test performance
    for (let i = 0; i < 20; i++) {
      const shape = new RectangleShape(
        {
          position: {
            x: Math.random() * (width - 50),
            y: Math.random() * (height - 50) + 650
          },
          size: { width: 30, height: 30 },
          borderRadius: 15
        },
        {
          fill: createColor(
            Math.random() * 100 + 155,
            Math.random() * 100 + 155,
            Math.random() * 100 + 155,
            0.7
          )
        }
      );
      shape.setZIndex(1);
      engine.addShape(shape);

      // Simple animation (this is just for demo - normally would use proper animation system)
      const animate = () => {
        const bounds = shape.getBounds();
        if (bounds.x > width) {
          shape.moveTo({ x: -50, y: bounds.y });
        } else {
          shape.moveBy({ x: 1, y: 0 });
        }
      };

      // Start animation
      setInterval(animate, 16); // ~60fps
    }
  };

  const handleTestPerformance = () => {
    if (!engineRef.current) return;

    // Add more shapes to stress test
    console.log('Adding stress test shapes...');

    for (let i = 0; i < 100; i++) {
      const shape = new RectangleShape(
        {
          position: {
            x: Math.random() * width,
            y: Math.random() * height
          },
          size: {
            width: Math.random() * 50 + 10,
            height: Math.random() * 50 + 10
          }
        },
        {
          fill: createColor(
            Math.random() * 255,
            Math.random() * 255,
            Math.random() * 255,
            Math.random() * 0.5 + 0.2
          )
        }
      );
      engineRef.current.addShape(shape);
    }
  };

  const handleClearShapes = () => {
    if (!engineRef.current) return;

    engineRef.current.clearShapes();
    createDemoScene(engineRef.current);
  };

  const handleToggleDebug = () => {
    if (!engineRef.current) return;

    const settings = engineRef.current.getSettings();
    engineRef.current.updateSettings({
      debugMode: !settings.debugMode
    });
  };

  const handleRunBenchmarks = async () => {
    if (!canvasRef.current) return;

    console.log('🚀 Starting Performance Benchmarks...');

    try {
      const { PerformanceBenchmarks } = await import('../rendering/__tests__/PerformanceBenchmarks');
      const benchmarks = new PerformanceBenchmarks(canvasRef.current);
      const results = await benchmarks.runAllBenchmarks();

      console.log('📈 Benchmark Results:', results);

      // Show results in alert for now (could be improved with a modal)
      const summary = results.map(r =>
        `${r.testName}: ${r.averageFPS.toFixed(1)} fps (${r.passed ? 'PASS' : 'FAIL'})`
      ).join('\n');

      alert(`Benchmark Results:\n\n${summary}`);
    } catch (error) {
      console.error('Benchmark error:', error);
      alert('Benchmark failed to run. Check console for details.');
    }
  };

  // Live Display Functions
  const createLiveDisplay = async () => {
    try {
      console.log('Creating live display...');
      const result = await window.electronAPI?.invoke('live-display:create', {});
      if (result?.success) {
        setLiveDisplayActive(true);
        setLiveDisplayStatus('Active');
        console.log('Live display created successfully');
      }
    } catch (error) {
      console.error('Failed to create live display:', error);
      setLiveDisplayStatus('Error');
    }
  };

  const closeLiveDisplay = async () => {
    try {
      console.log('Closing live display...');
      await window.electronAPI?.invoke('live-display:close');
      setLiveDisplayActive(false);
      setLiveDisplayStatus('Disconnected');
      console.log('Live display closed');
    } catch (error) {
      console.error('Failed to close live display:', error);
    }
  };

  const sendDemoToLive = async () => {
    if (!liveDisplayActive) {
      console.warn('Live display not active');
      return;
    }

    try {
      const content = {
        type: 'rendering-demo',
        title: 'PraisePresent Rendering Engine - Live Demo',
        content: {
          description: 'Interactive rendering engine demonstration',
          performance: {
            fps,
            shapeCount,
            renderTime
          }
        }
      };

      console.log('Sending demo to live display:', content);
      await window.electronAPI?.invoke('live-display:sendContent', content);
    } catch (error) {
      console.error('Failed to send content to live display:', error);
    }
  };

  const clearLiveDisplay = async () => {
    if (!liveDisplayActive) return;

    try {
      console.log('Clearing live display...');
      await window.electronAPI?.invoke('live-display:clearContent');
    } catch (error) {
      console.error('Failed to clear live display:', error);
    }
  };

  // Check live display status on component mount
  useEffect(() => {
    const checkLiveDisplayStatus = async () => {
      try {
        const status = await window.electronAPI?.invoke('live-display:getStatus');
        if (status?.hasWindow && status?.isVisible) {
          setLiveDisplayActive(true);
          setLiveDisplayStatus('Active');
        } else {
          setLiveDisplayActive(false);
          setLiveDisplayStatus('Disconnected');
        }
      } catch (error) {
        console.error('Failed to get live display status:', error);
        setLiveDisplayStatus('Error');
      }
    };

    if (window.electronAPI) {
      checkLiveDisplayStatus();
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center p-4 bg-gray-900">
      <div className="mb-4 flex gap-4">
        <button
          onClick={handleTestPerformance}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={!isInitialized}
        >
          Stress Test (+100 shapes)
        </button>
        <button
          onClick={handleClearShapes}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          disabled={!isInitialized}
        >
          Reset Scene
        </button>
        <button
          onClick={handleToggleDebug}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          disabled={!isInitialized}
        >
          Toggle Debug
        </button>
        <button
          onClick={handleRunBenchmarks}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          disabled={!isInitialized}
        >
          Run Benchmarks
        </button>
      </div>

      {/* Live Display Controls */}
      {window.electronAPI && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex flex-wrap gap-2 items-center justify-center">
            <div className="text-sm text-gray-400 mr-4">
              Live Display: <span className={
                liveDisplayStatus === 'Active' ? 'text-green-400' :
                liveDisplayStatus === 'Error' ? 'text-red-400' : 'text-yellow-400'
              }>{liveDisplayStatus}</span>
            </div>

            <div className="flex gap-2">
              {!liveDisplayActive ? (
                <button
                  onClick={createLiveDisplay}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  disabled={!isInitialized}
                >
                  Create Live Display
                </button>
              ) : (
                <>
                  <button
                    onClick={sendDemoToLive}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    disabled={!isInitialized}
                  >
                    Send Demo to Live
                  </button>

                  <button
                    onClick={clearLiveDisplay}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    Clear Live
                  </button>

                  <button
                    onClick={closeLiveDisplay}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Close Live
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {isInitialized && (
        <div className="mb-4 flex gap-8 text-white text-sm">
          <div>FPS: <span className={fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>{fps}</span></div>
          <div>Shapes: <span className="text-blue-400">{shapeCount}</span></div>
          <div>Render Time: <span className="text-purple-400">{renderTime}ms</span></div>
          <div>Status: <span className="text-green-400">Initialized</span></div>
        </div>
      )}

      <div className="border border-gray-600 rounded-lg overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: '70vh',
            objectFit: 'contain'
          }}
          className="bg-gray-800"
        />
      </div>

      {!isInitialized && (
        <div className="mt-4 text-white text-center">
          <div className="animate-pulse">Initializing rendering engine...</div>
        </div>
      )}

      <div className="mt-4 text-gray-400 text-sm max-w-2xl text-center">
        This demo showcases the new PowerPoint-style rendering engine with shape-based content model,
        hardware-accelerated canvas rendering, and real-time performance monitoring. The engine targets
        60fps rendering for smooth presentation experiences.
      </div>
    </div>
  );
};

export default RenderingDemo;