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

interface LiveDisplayRendererProps {
  width?: number;
  height?: number;
}

interface LiveContent {
  type: 'rendering-test' | 'rendering-demo' | 'placeholder' | 'black' | 'logo';
  scenario?: string;
  content?: any;
  title?: string;
}

export const LiveDisplayRenderer: React.FC<LiveDisplayRendererProps> = ({
  width = 1920,
  height = 1080
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RenderingEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentContent, setCurrentContent] = useState<LiveContent | null>(null);
  const [fps, setFps] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    try {
      const engine = new RenderingEngine({
        canvas,
        enableDebug: false, // Disable debug overlay for live display
        settings: {
          quality: RenderQuality.HIGH,
          targetFPS: 60,
          enableCaching: true,
          enableGPUAcceleration: true,
          debugMode: false
        }
      });

      engineRef.current = engine;

      // Set up performance monitoring
      engine.setRenderCallback(() => {
        const metrics = engine.getPerformanceMetrics();
        setFps(Math.round(metrics.fps));
      });

      // Start with default content
      showDefaultContent(engine);
      engine.startRenderLoop();
      setIsInitialized(true);
      setConnectionStatus('Ready');

      console.log('Live Display Renderer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize live display rendering engine:', error);
      setConnectionStatus('Error');
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  // Listen for IPC messages from main process
  useEffect(() => {
    const handleContentUpdate = (event: any, content: LiveContent) => {
      console.log('Live display received content update:', content);
      setCurrentContent(content);
      if (engineRef.current) {
        renderContent(engineRef.current, content);
      }
    };

    const handleContentClear = () => {
      console.log('Live display content cleared');
      setCurrentContent(null);
      if (engineRef.current) {
        showDefaultContent(engineRef.current);
      }
    };

    const handleShowBlack = () => {
      console.log('Live display showing black screen');
      setCurrentContent({ type: 'black' });
      if (engineRef.current) {
        showBlackScreen(engineRef.current);
      }
    };

    const handleShowLogo = () => {
      console.log('Live display showing logo screen');
      setCurrentContent({ type: 'logo' });
      if (engineRef.current) {
        showLogoScreen(engineRef.current);
      }
    };

    const handleThemeUpdate = (event: any, theme: any) => {
      console.log('Live display theme updated:', theme);
      // Theme updates can be handled here if needed
    };

    // Check if we're in Electron environment
    if (window.electronAPI) {
      window.electronAPI.onLiveContentUpdate(handleContentUpdate);
      window.electronAPI.onLiveContentClear(handleContentClear);
      window.electronAPI.onLiveShowBlack(handleShowBlack);
      window.electronAPI.onLiveShowLogo(handleShowLogo);
      window.electronAPI.onLiveThemeUpdate(handleThemeUpdate);

      return () => {
        // Cleanup listeners if needed
      };
    }
  }, []);

  const showDefaultContent = (engine: RenderingEngine) => {
    engine.clearShapes();

    // Gradient background
    const background = BackgroundShape.createLinearGradient(
      [
        { offset: 0, color: createColor(45, 55, 72) },
        { offset: 1, color: createColor(74, 85, 104) }
      ],
      135,
      width,
      height
    );
    engine.addShape(background);

    // Welcome text
    const welcomeText = new TextShape(
      { position: { x: width * 0.1, y: height * 0.4 }, size: { width: width * 0.8, height: height * 0.1 } },
      {
        fontSize: Math.floor(height * 0.06),
        fontWeight: 'bold',
        color: createColor(255, 255, 255),
        textAlign: 'center',
        verticalAlign: 'middle'
      }
    );
    welcomeText.setText('PraisePresent Live Display');
    welcomeText.setZIndex(1);
    engine.addShape(welcomeText);

    // Status text
    const statusText = new TextShape(
      { position: { x: width * 0.1, y: height * 0.55 }, size: { width: width * 0.8, height: height * 0.05 } },
      {
        fontSize: Math.floor(height * 0.025),
        color: createColor(200, 200, 200),
        textAlign: 'center',
        verticalAlign: 'middle'
      }
    );
    statusText.setText('Ready for presentation content');
    statusText.setZIndex(1);
    engine.addShape(statusText);
  };

  const showBlackScreen = (engine: RenderingEngine) => {
    engine.clearShapes();

    // Black background
    const background = BackgroundShape.createSolidColor(createColor(0, 0, 0), width, height);
    engine.addShape(background);
  };

  const showLogoScreen = (engine: RenderingEngine) => {
    engine.clearShapes();

    // Dark background
    const background = BackgroundShape.createSolidColor(createColor(20, 20, 30), width, height);
    engine.addShape(background);

    // Logo placeholder
    const logoBox = new RectangleShape(
      { position: { x: width * 0.4, y: height * 0.4 }, size: { width: width * 0.2, height: height * 0.2 } },
      {
        fill: createColor(100, 150, 255, 0.3),
        stroke: { width: 3, color: createColor(100, 150, 255), style: 'solid' },
        borderRadius: 20
      }
    );
    logoBox.setZIndex(1);
    engine.addShape(logoBox);

    // Logo text
    const logoText = new TextShape(
      { position: { x: width * 0.3, y: height * 0.65 }, size: { width: width * 0.4, height: height * 0.08 } },
      {
        fontSize: Math.floor(height * 0.04),
        fontWeight: 'bold',
        color: createColor(255, 255, 255),
        textAlign: 'center',
        verticalAlign: 'middle'
      }
    );
    logoText.setText('Church Logo');
    logoText.setZIndex(1);
    engine.addShape(logoText);
  };

  const renderContent = (engine: RenderingEngine, content: LiveContent) => {
    engine.clearShapes();

    switch (content.type) {
      case 'rendering-test':
      case 'rendering-demo':
        renderTestContent(engine, content);
        break;
      case 'placeholder':
        renderPlaceholderContent(engine, content);
        break;
      case 'black':
        showBlackScreen(engine);
        break;
      case 'logo':
        showLogoScreen(engine);
        break;
      default:
        showDefaultContent(engine);
    }
  };

  const renderTestContent = (engine: RenderingEngine, content: LiveContent) => {
    // Create a demonstration scene similar to test suite scenarios

    // Background
    const background = BackgroundShape.createLinearGradient(
      [
        { offset: 0, color: createColor(20, 20, 40) },
        { offset: 1, color: createColor(60, 60, 100) }
      ],
      135,
      width,
      height
    );
    engine.addShape(background);

    // Title
    const title = new TextShape(
      { position: { x: width * 0.05, y: height * 0.05 }, size: { width: width * 0.9, height: height * 0.1 } },
      {
        fontSize: Math.floor(height * 0.05),
        fontWeight: 'bold',
        color: createColor(255, 255, 255),
        textAlign: 'center',
        verticalAlign: 'middle'
      }
    );
    title.setText(content.title || 'Rendering Engine Live Test');
    title.setZIndex(2);
    engine.addShape(title);

    // Create some dynamic shapes
    const shapeCount = 50;
    for (let i = 0; i < shapeCount; i++) {
      const rect = new RectangleShape(
        {
          position: {
            x: Math.random() * (width - 40),
            y: height * 0.2 + Math.random() * (height * 0.7)
          },
          size: { width: 30, height: 30 },
          rotation: Math.random() * 360
        },
        {
          fill: createColor(
            Math.random() * 255,
            Math.random() * 255,
            Math.random() * 255,
            0.7
          ),
          borderRadius: 5
        }
      );
      rect.setZIndex(1);
      engine.addShape(rect);
    }

    // Performance info
    const perfText = new TextShape(
      { position: { x: width * 0.02, y: height * 0.9 }, size: { width: width * 0.3, height: height * 0.05 } },
      {
        fontSize: Math.floor(height * 0.02),
        color: createColor(200, 255, 200),
        textAlign: 'left',
        verticalAlign: 'middle'
      }
    );
    perfText.setText(`Live Display • ${shapeCount} shapes • ${fps} FPS`);
    perfText.setZIndex(2);
    engine.addShape(perfText);
  };

  const renderPlaceholderContent = (engine: RenderingEngine, content: LiveContent) => {
    // Background
    const background = BackgroundShape.createLinearGradient(
      [
        { offset: 0, color: createColor(45, 55, 72) },
        { offset: 1, color: createColor(74, 85, 104) }
      ],
      90,
      width,
      height
    );
    engine.addShape(background);

    // Main content
    if (content.content?.mainText) {
      const mainText = new TextShape(
        { position: { x: width * 0.1, y: height * 0.35 }, size: { width: width * 0.8, height: height * 0.15 } },
        {
          fontSize: Math.floor(height * 0.08),
          fontWeight: 'bold',
          color: createColor(255, 255, 255),
          textAlign: 'center',
          verticalAlign: 'middle'
        }
      );
      mainText.setText(content.content.mainText);
      mainText.setZIndex(1);
      engine.addShape(mainText);
    }

    if (content.content?.subText) {
      const subText = new TextShape(
        { position: { x: width * 0.1, y: height * 0.55 }, size: { width: width * 0.8, height: height * 0.08 } },
        {
          fontSize: Math.floor(height * 0.03),
          color: createColor(200, 200, 200),
          textAlign: 'center',
          verticalAlign: 'middle'
        }
      );
      subText.setText(content.content.subText);
      subText.setZIndex(1);
      engine.addShape(subText);
    }
  };

  // URL parameter detection for live display mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    if (mode === 'live-display') {
      console.log('Live display mode detected');
      setConnectionStatus('Live Display Mode');
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded">
        {connectionStatus} {isInitialized && `• ${fps} FPS`}
      </div>

      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          maxWidth: '100vw',
          maxHeight: '100vh',
          objectFit: 'contain',
          backgroundColor: '#000'
        }}
        className="block"
      />

      {/* Content info overlay (only show in development) */}
      {process.env.NODE_ENV === 'development' && currentContent && (
        <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-70 text-white text-xs px-3 py-2 rounded">
          <div>Type: {currentContent.type}</div>
          {currentContent.scenario && <div>Scenario: {currentContent.scenario}</div>}
          {currentContent.title && <div>Title: {currentContent.title}</div>}
        </div>
      )}

      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-xl">Initializing Live Display...</div>
        </div>
      )}
    </div>
  );
};

export default LiveDisplayRenderer;