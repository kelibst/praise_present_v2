import React, { useEffect, useRef, useState } from 'react';
import {
  ResponsiveRenderingEngine,
  SlideRenderer,
  createSlideRenderer,
  RectangleShape,
  TextShape,
  ImageShape,
  BackgroundShape,
  LayoutMode,
  px
} from '../rendering';
import { createColor } from '../rendering/types/geometry';
import { RenderQuality } from '../rendering/types/rendering';
import { templateManager } from '../rendering/templates/TemplateManager';
import { slideGenerator } from '../rendering/SlideGenerator';

interface LiveDisplayRendererProps {
  width?: number;
  height?: number;
}

interface LiveContent {
  type: 'rendering-test' | 'rendering-demo' | 'placeholder' | 'black' | 'logo' | 'template-demo' | 'simple-rendering-test' | 'scripture' | 'song' | 'announcement' | 'template-generated' | 'template-slide';
  scenario?: string;
  content?: any;
  title?: string;
  slideData?: any; // For template-generated content
  templateId?: string; // For template-generated content
  slide?: {
    id: string;
    shapes: any[];
    background?: {
      type: string;
      value: any;
      angle?: number;
    };
  }; // For template-slide content
}

export const LiveDisplayRenderer: React.FC<LiveDisplayRendererProps> = ({
  width = 1920,
  height = 1080
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ResponsiveRenderingEngine | null>(null);
  const slideRendererRef = useRef<SlideRenderer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentContent, setCurrentContent] = useState<LiveContent | null>(null);
  const [fps, setFps] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  // Slide navigation state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [allSlides, setAllSlides] = useState<any[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    try {
      console.log('🎯 LiveDisplayRenderer: Initializing ResponsiveRenderingEngine for live display', {
        targetResolution: `${width}x${height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      });

      const engine = new ResponsiveRenderingEngine({
        canvas,
        enableDebug: false, // Disable debug overlay for live display
        enableResponsive: true, // Enable responsive rendering
        settings: {
          quality: RenderQuality.HIGH,
          targetFPS: 60,
          enableCaching: true,
          enableGPUAcceleration: true,
          debugMode: false
        },
        breakpoints: [
          {
            name: 'live-small',
            maxWidth: 1280,
            config: {
              mode: LayoutMode.ASPECT_FIT,
              padding: px(16)
            }
          },
          {
            name: 'live-standard',
            minWidth: 1281,
            maxWidth: 1920,
            config: {
              mode: LayoutMode.FILL_CONTAINER,
              padding: px(8)
            }
          },
          {
            name: 'live-large',
            minWidth: 1921,
            config: {
              mode: LayoutMode.ASPECT_FIT,
              padding: px(4)
            }
          }
        ],
        baseFontSize: 16
      });

      engineRef.current = engine;

      // Create SlideRenderer for unified rendering with target resolution
      const slideRenderer = createSlideRenderer(engine, {
        slideSize: { width, height },
        onRender: () => {
          const metrics = engine.getPerformanceMetrics();
          setFps(Math.round(metrics.fps));
        }
      });
      slideRendererRef.current = slideRenderer;

      // Initialize template system for live display
      // Template manager is already initialized via constructor
      slideGenerator.setRenderingEngine(engine);

      // Start with default content using SlideRenderer
      slideRenderer.renderDefaultSlide();
      engine.startRenderLoop();
      setIsInitialized(true);
      setConnectionStatus('Ready');

      console.log('Live Display Renderer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize live display rendering engine:', error);
      setConnectionStatus('Error');
    }

    return () => {
      if (slideRendererRef.current) {
        slideRendererRef.current.dispose();
      }
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  // Listen for IPC messages from main process
  useEffect(() => {
    const handleContentUpdate = (content: LiveContent) => {

      // Guard against undefined/null content
      if (!content) {
        console.warn('Live display received undefined content, ignoring update');
        return;
      }

      // Additional validation for content structure
      if (typeof content !== 'object' || Array.isArray(content)) {
        console.warn('Live display received invalid content type:', typeof content, content);
        return;
      }

      // Validate that content has required properties
      if (!content.type) {
        console.warn('Live display received content without type property:', content);
        return;
      }

      console.log('Valid content received, updating display');
      setCurrentContent(content);
      if (slideRendererRef.current) {
        slideRendererRef.current.renderContent(content);
      }
    };

    const handleContentClear = () => {
      console.log('Live display content cleared');
      setCurrentContent(null);
      if (slideRendererRef.current) {
        slideRendererRef.current.renderDefaultSlide();
      }
    };

    const handleShowBlack = () => {
      console.log('Live display showing black screen');
      setCurrentContent({ type: 'black' });
      if (slideRendererRef.current) {
        slideRendererRef.current.renderBlankSlide();
      }
    };

    const handleShowLogo = () => {
      console.log('Live display showing logo screen');
      setCurrentContent({ type: 'logo' });
      if (slideRendererRef.current) {
        slideRendererRef.current.renderContent({ type: 'logo' });
      }
    };

    const handleThemeUpdate = (_event: any, theme: any) => {
      console.log('Live display theme updated:', theme);
      // Theme updates can be handled here if needed
    };

    // Check if we're in Electron environment
    if (window.electronAPI) {
      const cleanupFunctions: Array<() => void> = [];

      cleanupFunctions.push(window.electronAPI.onLiveContentUpdate?.(handleContentUpdate) || (() => {}));
      cleanupFunctions.push(window.electronAPI.onLiveContentClear?.(handleContentClear) || (() => {}));
      cleanupFunctions.push(window.electronAPI.onLiveShowBlack?.(handleShowBlack) || (() => {}));
      cleanupFunctions.push(window.electronAPI.onLiveShowLogo?.(handleShowLogo) || (() => {}));
      cleanupFunctions.push(window.electronAPI.onLiveThemeUpdate?.((theme: any) => handleThemeUpdate(null, theme)) || (() => {}));

      return () => {
        // Cleanup listeners
        cleanupFunctions.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            console.warn('Error cleaning up listener:', error);
          }
        });
      };
    }
  }, []);






  // URL parameter detection for live display mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    if (mode === 'live-display') {
      console.log('Live display mode detected');
      setConnectionStatus('Live Display Mode');
    }
  }, []);


  // Navigation functions (internal use)
  const navigateToSlide = (slideIndex: number) => {
    if (!allSlides || slideIndex < 0 || slideIndex >= allSlides.length) return;

    setCurrentSlideIndex(slideIndex);

    if (engineRef.current && allSlides[slideIndex]) {
      engineRef.current.clearShapes();
      const slide = allSlides[slideIndex];

      if (slide.shapes && Array.isArray(slide.shapes)) {
        for (const shape of slide.shapes) {
          engineRef.current.addShape(shape);
        }
        console.log(`Navigated to slide ${slideIndex + 1}/${allSlides.length}`);
      }
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden">
      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded">
        {connectionStatus} {isInitialized && `• ${fps} FPS`}
      </div>

      {/* Main canvas with proper aspect ratio scaling */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100vw',
          maxHeight: '100vh',
          backgroundColor: '#000',
          display: 'block',
          margin: 'auto', // Center the canvas
          objectFit: 'contain' // Maintain aspect ratio while fitting container
        }}
        className="block mx-auto"
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