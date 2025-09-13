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
import { RenderingSystemTests, TestResult } from '../rendering/__tests__/RenderingSystemTests';

interface RenderingTestSuiteProps {
  width?: number;
  height?: number;
}

interface TestScenario {
  name: string;
  description: string;
  createScene: (engine: RenderingEngine, canvas: HTMLCanvasElement) => void;
}

export const RenderingTestSuite: React.FC<RenderingTestSuiteProps> = ({
  width = 1200,
  height = 800
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RenderingEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [fps, setFps] = useState(0);
  const [shapeCount, setShapeCount] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [autoTest, setAutoTest] = useState(false);
  const [liveDisplayActive, setLiveDisplayActive] = useState(false);
  const [liveDisplayStatus, setLiveDisplayStatus] = useState('Disconnected');

  const testScenarios: TestScenario[] = [
    {
      name: 'Basic Shapes',
      description: 'Rectangle, circle, and basic shape rendering',
      createScene: (engine, canvas) => {
        engine.clearShapes();

        // Background
        const bg = BackgroundShape.createSolidColor(createColor(240, 240, 240), width, height);
        engine.addShape(bg);

        // Rectangle with different styles
        const rect1 = new RectangleShape(
          { position: { x: 50, y: 50 }, size: { width: 150, height: 100 } },
          { fill: createColor(255, 100, 100), borderRadius: 10 }
        );
        rect1.setZIndex(1);
        engine.addShape(rect1);

        const rect2 = new RectangleShape(
          { position: { x: 250, y: 50 }, size: { width: 150, height: 100 } },
          {
            fill: createColor(100, 255, 100, 0.7),
            stroke: { width: 3, color: createColor(0, 150, 0), style: 'solid' },
            borderRadius: [20, 5, 20, 5]
          }
        );
        rect2.setZIndex(1);
        engine.addShape(rect2);

        const rect3 = new RectangleShape(
          { position: { x: 450, y: 50 }, size: { width: 150, height: 100 } },
          {
            fill: {
              type: 'linear' as const,
              stops: [
                { offset: 0, color: createColor(255, 0, 0) },
                { offset: 1, color: createColor(0, 0, 255) }
              ],
              angle: 45
            }
          }
        );
        rect3.setZIndex(1);
        engine.addShape(rect3);
      }
    },
    {
      name: 'Text Rendering',
      description: 'Various text styles, fonts, and alignments',
      createScene: (engine, canvas) => {
        engine.clearShapes();

        // Background
        const bg = BackgroundShape.createLinearGradient(
          [
            { offset: 0, color: createColor(230, 230, 250) },
            { offset: 1, color: createColor(200, 200, 240) }
          ],
          90,
          width,
          height
        );
        engine.addShape(bg);

        // Different text styles
        const styles = [
          { fontSize: 24, fontWeight: 'bold' as const, textAlign: 'left' as const, color: createColor(50, 50, 50) },
          { fontSize: 18, fontWeight: 'normal' as const, textAlign: 'center' as const, color: createColor(100, 50, 150) },
          { fontSize: 16, fontWeight: 'bold' as const, textAlign: 'right' as const, color: createColor(150, 50, 50) },
          { fontSize: 20, fontWeight: 'normal' as const, textAlign: 'center' as const, color: createColor(50, 150, 50), textDecoration: 'underline' as const }
        ];

        const texts = [
          'Bold Left-Aligned Text',
          'Center-Aligned Text',
          'Right-Aligned Text',
          'Underlined Center Text'
        ];

        styles.forEach((style, i) => {
          const text = new TextShape(
            { position: { x: 50, y: 100 + i * 80 }, size: { width: width - 100, height: 60 } },
            style
          );
          text.setText(texts[i]);
          text.setZIndex(1);
          engine.addShape(text);
        });

        // Multiline text
        const multilineText = new TextShape(
          { position: { x: 50, y: 450 }, size: { width: 500, height: 120 } },
          {
            fontSize: 16,
            color: createColor(0, 0, 0),
            textAlign: 'left',
            verticalAlign: 'top',
            lineHeight: 1.4
          }
        );
        multilineText.setText('This is a multiline text example that demonstrates text wrapping capabilities. It should wrap to multiple lines within the specified width and height constraints.');
        multilineText.setZIndex(1);
        engine.addShape(multilineText);
      }
    },
    {
      name: 'Image Rendering',
      description: 'Image loading and different object-fit modes',
      createScene: (engine, canvas) => {
        engine.clearShapes();

        // Background
        const bg = BackgroundShape.createSolidColor(createColor(250, 250, 250), width, height);
        engine.addShape(bg);

        // Test with SVG data URLs for different object-fit modes
        const testImages = [
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzNyIvPjx0ZXh0IHg9IjEwMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNPVkVSPC90ZXh0Pjwvc3ZnPg==',
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzU1NyIvPjx0ZXh0IHg9IjEwMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNPTlRBSU48L3RleHQ+PC9zdmc+',
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzc3NyIvPjx0ZXh0IHg9IjEwMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkZJTEw8L3RleHQ+PC9zdmc+'
        ];

        const objectFits: ('cover' | 'contain' | 'fill')[] = ['cover', 'contain', 'fill'];

        testImages.forEach((src, i) => {
          const image = new ImageShape(
            {
              position: { x: 100 + i * 200, y: 100 },
              size: { width: 150, height: 150 },
              src
            },
            { objectFit: objectFits[i] }
          );
          image.setZIndex(1);
          engine.addShape(image);

          // Label
          const label = new TextShape(
            { position: { x: 100 + i * 200, y: 270 }, size: { width: 150, height: 30 } },
            { fontSize: 14, textAlign: 'center', color: createColor(0, 0, 0) }
          );
          label.setText(`object-fit: ${objectFits[i]}`);
          label.setZIndex(1);
          engine.addShape(label);
        });
      }
    },
    {
      name: 'Transformations',
      description: 'Shape rotations, scaling, and complex transformations',
      createScene: (engine, canvas) => {
        engine.clearShapes();

        // Background
        const bg = BackgroundShape.createRadialGradient(
          [
            { offset: 0, color: createColor(255, 255, 255) },
            { offset: 1, color: createColor(200, 200, 255) }
          ],
          { x: 0.5, y: 0.5 },
          0.7,
          width,
          height
        );
        engine.addShape(bg);

        const centerX = width / 2;
        const centerY = height / 2;

        // Create shapes with different transformations
        for (let i = 0; i < 8; i++) {
          const angle = (i * 45) * (Math.PI / 180);
          const x = centerX + Math.cos(angle) * 200;
          const y = centerY + Math.sin(angle) * 150;

          const rect = new RectangleShape(
            { position: { x: x - 25, y: y - 25 }, size: { width: 50, height: 50 }, rotation: i * 45 },
            {
              fill: createColor(
                Math.sin(i * 0.5) * 100 + 155,
                Math.cos(i * 0.7) * 100 + 155,
                Math.sin(i * 1.2) * 100 + 155,
                0.8
              )
            }
          );
          rect.scale(1 + i * 0.1, 1 + i * 0.1);
          rect.setZIndex(1);
          engine.addShape(rect);
        }

        // Center text
        const centerText = new TextShape(
          { position: { x: centerX - 100, y: centerY - 15 }, size: { width: 200, height: 30 } },
          {
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
            color: createColor(50, 50, 50)
          }
        );
        centerText.setText('Transformations Test');
        centerText.setZIndex(2);
        engine.addShape(centerText);
      }
    },
    {
      name: 'Performance Stress Test',
      description: 'Many shapes to test rendering performance',
      createScene: (engine, canvas) => {
        engine.clearShapes();

        // Background
        const bg = BackgroundShape.createLinearGradient(
          [
            { offset: 0, color: createColor(20, 20, 40) },
            { offset: 1, color: createColor(60, 60, 100) }
          ],
          135,
          width,
          height
        );
        engine.addShape(bg);

        // Create many random shapes
        for (let i = 0; i < 200; i++) {
          const rect = new RectangleShape(
            {
              position: {
                x: Math.random() * (width - 30),
                y: Math.random() * (height - 30)
              },
              size: { width: 20, height: 20 },
              rotation: Math.random() * 360
            },
            {
              fill: createColor(
                Math.random() * 255,
                Math.random() * 255,
                Math.random() * 255,
                0.6
              )
            }
          );
          rect.setZIndex(1);
          engine.addShape(rect);
        }

        // Performance info text
        const perfText = new TextShape(
          { position: { x: 20, y: 20 }, size: { width: 400, height: 60 } },
          {
            fontSize: 16,
            color: createColor(255, 255, 255),
            textAlign: 'left'
          }
        );
        perfText.setText('Performance Test: 200+ shapes rendering');
        perfText.setZIndex(2);
        engine.addShape(perfText);
      }
    },
    {
      name: 'Complex Layout',
      description: 'Complex scene with all features combined',
      createScene: (engine, canvas) => {
        engine.clearShapes();

        // Complex gradient background
        const bg = BackgroundShape.createLinearGradient(
          [
            { offset: 0, color: createColor(135, 206, 235) },
            { offset: 0.5, color: createColor(255, 182, 193) },
            { offset: 1, color: createColor(255, 165, 0) }
          ],
          90,
          width,
          height
        );
        engine.addShape(bg);

        // Header card
        const headerCard = new RectangleShape(
          { position: { x: 50, y: 50 }, size: { width: width - 100, height: 100 } },
          {
            fill: createColor(255, 255, 255, 0.9),
            stroke: { width: 2, color: createColor(200, 200, 200), style: 'solid' },
            borderRadius: 15,
            shadowColor: createColor(0, 0, 0, 0.2),
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowOffsetY: 5
          }
        );
        headerCard.setZIndex(1);
        engine.addShape(headerCard);

        const headerText = new TextShape(
          { position: { x: 70, y: 70 }, size: { width: width - 140, height: 60 } },
          {
            fontSize: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            verticalAlign: 'middle',
            color: createColor(50, 50, 50)
          }
        );
        headerText.setText('PraisePresent Rendering Engine - Complex Layout Test');
        headerText.setZIndex(2);
        engine.addShape(headerText);

        // Feature cards
        const features = [
          { title: 'Shape System', desc: 'Base shape class with transformations and z-ordering' },
          { title: 'Text Rendering', desc: 'Rich text with fonts, alignment, and decorations' },
          { title: 'Image Support', desc: 'Async loading with object-fit support' },
          { title: 'Backgrounds', desc: 'Colors, gradients, and image backgrounds' }
        ];

        features.forEach((feature, i) => {
          const x = 100 + (i % 2) * 450;
          const y = 200 + Math.floor(i / 2) * 180;

          const card = new RectangleShape(
            { position: { x, y }, size: { width: 350, height: 140 } },
            {
              fill: createColor(255, 255, 255, 0.8),
              stroke: { width: 1, color: createColor(150, 150, 150), style: 'solid' },
              borderRadius: 10,
              shadowColor: createColor(0, 0, 0, 0.15),
              shadowBlur: 8,
              shadowOffsetX: 0,
              shadowOffsetY: 3
            }
          );
          card.setZIndex(1);
          engine.addShape(card);

          const title = new TextShape(
            { position: { x: x + 20, y: y + 20 }, size: { width: 310, height: 40 } },
            {
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'left',
              color: createColor(50, 50, 50)
            }
          );
          title.setText(feature.title);
          title.setZIndex(2);
          engine.addShape(title);

          const desc = new TextShape(
            { position: { x: x + 20, y: y + 60 }, size: { width: 310, height: 60 } },
            {
              fontSize: 14,
              textAlign: 'left',
              verticalAlign: 'top',
              lineHeight: 1.4,
              color: createColor(80, 80, 80)
            }
          );
          desc.setText(feature.desc);
          desc.setZIndex(2);
          engine.addShape(desc);
        });

        // Footer with animated elements
        const footerY = height - 120;
        for (let i = 0; i < 10; i++) {
          const dot = new RectangleShape(
            {
              position: { x: 150 + i * 90, y: footerY + Math.sin(i) * 20 },
              size: { width: 15, height: 15 },
              rotation: i * 36
            },
            {
              fill: createColor(
                255,
                Math.sin(i * 0.5) * 100 + 155,
                Math.cos(i * 0.7) * 100 + 155,
                0.7
              ),
              borderRadius: 8
            }
          );
          dot.setZIndex(1);
          engine.addShape(dot);
        }
      }
    }
  ];

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    try {
      const engine = new RenderingEngine({
        canvas,
        enableDebug: true,
        settings: {
          quality: RenderQuality.HIGH,
          targetFPS: 60,
          enableCaching: true,
          enableGPUAcceleration: true,
          debugMode: true
        }
      });

      engineRef.current = engine;

      // Set up performance monitoring
      engine.setRenderCallback(() => {
        const metrics = engine.getPerformanceMetrics();
        setFps(Math.round(metrics.fps));
        setShapeCount(metrics.shapeCount);
        setRenderTime(Math.round(metrics.renderTime * 100) / 100);
      });

      // Load initial scenario
      testScenarios[currentScenario].createScene(engine, canvas);

      engine.startRenderLoop();
      setIsInitialized(true);

      console.log('Rendering Test Suite initialized successfully');
    } catch (error) {
      console.error('Failed to initialize rendering engine:', error);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, [currentScenario]);

  const handleScenarioChange = (scenarioIndex: number) => {
    setCurrentScenario(scenarioIndex);
    if (engineRef.current && canvasRef.current) {
      testScenarios[scenarioIndex].createScene(engineRef.current, canvasRef.current);
    }
  };

  const runComprehensiveTests = async () => {
    if (!canvasRef.current) return;

    setIsRunningTests(true);
    console.log('🧪 Starting comprehensive rendering tests...');

    try {
      const testSuite = new RenderingSystemTests(canvasRef.current);
      const results = await testSuite.runAllTests();
      setTestResults(results);
      testSuite.dispose();
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const cycleScenarios = () => {
    if (!autoTest) return;

    setCurrentScenario(prev => (prev + 1) % testScenarios.length);
  };

  useEffect(() => {
    if (autoTest) {
      const interval = setInterval(cycleScenarios, 5000); // Change scenario every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoTest, currentScenario]);

  const getTestSummary = () => {
    if (testResults.length === 0) return null;

    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    const percentage = ((passed / total) * 100).toFixed(1);

    return { passed, total, percentage };
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

  const sendCurrentScenarioToLive = async () => {
    if (!liveDisplayActive) {
      console.warn('Live display not active');
      return;
    }

    try {
      const currentScenarioData = testScenarios[currentScenario];
      const content = {
        type: 'rendering-test',
        scenario: currentScenarioData.name,
        title: `${currentScenarioData.name} - Live Demo`,
        content: {
          description: currentScenarioData.description,
          performance: {
            fps,
            shapeCount,
            renderTime
          }
        }
      };

      console.log('Sending scenario to live display:', content);
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

  const showBlackScreen = async () => {
    if (!liveDisplayActive) return;

    try {
      console.log('Showing black screen...');
      await window.electronAPI?.invoke('live-display:showBlack');
    } catch (error) {
      console.error('Failed to show black screen:', error);
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

  // Auto-send content to live display when scenario changes
  useEffect(() => {
    if (liveDisplayActive && isInitialized && !isRunningTests) {
      setTimeout(() => {
        sendCurrentScenarioToLive();
      }, 500); // Small delay to ensure rendering is complete
    }
  }, [currentScenario, liveDisplayActive, isInitialized]);

  return (
    <div className="w-full h-full flex flex-col items-center p-4 bg-gray-900 text-white">
      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-2 items-center justify-center">
        <div className="flex gap-2">
          {testScenarios.map((scenario, index) => (
            <button
              key={index}
              onClick={() => handleScenarioChange(index)}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                currentScenario === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled={!isInitialized}
            >
              {scenario.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={runComprehensiveTests}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            disabled={!isInitialized || isRunningTests}
          >
            {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
          </button>

          <button
            onClick={() => setAutoTest(!autoTest)}
            className={`px-4 py-2 rounded transition-colors ${
              autoTest
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
            disabled={!isInitialized}
          >
            {autoTest ? 'Stop Auto-cycle' : 'Auto-cycle Scenarios'}
          </button>
        </div>
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
                    onClick={sendCurrentScenarioToLive}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    disabled={!isInitialized}
                  >
                    Send to Live
                  </button>

                  <button
                    onClick={clearLiveDisplay}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    Clear Live
                  </button>

                  <button
                    onClick={showBlackScreen}
                    className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                  >
                    Black Screen
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

      {/* Current Scenario Info */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold">{testScenarios[currentScenario].name}</h3>
        <p className="text-sm text-gray-400">{testScenarios[currentScenario].description}</p>
      </div>

      {/* Performance Metrics */}
      {isInitialized && (
        <div className="mb-4 flex gap-8 text-sm">
          <div>FPS: <span className={fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>{fps}</span></div>
          <div>Shapes: <span className="text-blue-400">{shapeCount}</span></div>
          <div>Render Time: <span className="text-purple-400">{renderTime}ms</span></div>
          <div>Status: <span className="text-green-400">Ready</span></div>
        </div>
      )}

      {/* Test Results Summary */}
      {testResults.length > 0 && (
        <div className="mb-4 p-3 bg-gray-800 rounded-lg text-center">
          <div className="text-sm">
            Test Results: <span className="text-green-400">{getTestSummary()?.passed}</span>
            /<span className="text-blue-400">{getTestSummary()?.total}</span> passed
            (<span className="text-yellow-400">{getTestSummary()?.percentage}%</span>)
          </div>
        </div>
      )}

      {/* Canvas */}
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
          className="bg-white"
        />
      </div>

      {!isInitialized && (
        <div className="mt-4 text-center">
          <div className="animate-pulse">Initializing rendering test suite...</div>
        </div>
      )}

      {/* Test Results Detail */}
      {testResults.length > 0 && (
        <div className="mt-6 w-full max-w-4xl">
          <h4 className="text-lg font-semibold mb-3">Detailed Test Results:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded text-sm ${
                  result.passed ? 'bg-green-900/30 border-l-4 border-green-500' : 'bg-red-900/30 border-l-4 border-red-500'
                }`}
              >
                <div className="font-medium">{result.testName}</div>
                <div className="text-xs mt-1 opacity-90">{result.details}</div>
                {result.performance && (
                  <div className="text-xs mt-1 text-blue-400">
                    {result.performance.fps} FPS, {result.performance.renderTime}ms
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-gray-400 text-sm max-w-3xl text-center">
        This comprehensive test suite validates all Phase 1 rendering features including shape creation,
        transformations, text rendering, image support, performance optimization, and complex scene management.
        Each scenario tests specific capabilities of the PowerPoint-style rendering engine.
      </div>
    </div>
  );
};

export default RenderingTestSuite;