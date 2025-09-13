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

  // Slide navigation state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [allSlides, setAllSlides] = useState<any[]>([]);

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

      // Initialize template system for live display
      // Template manager is already initialized via constructor
      slideGenerator.setRenderingEngine(engine);

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
      const cleanupFunctions: Array<() => void> = [];

      cleanupFunctions.push(window.electronAPI.onLiveContentUpdate(handleContentUpdate));
      cleanupFunctions.push(window.electronAPI.onLiveContentClear(handleContentClear));
      cleanupFunctions.push(window.electronAPI.onLiveShowBlack(handleShowBlack));
      cleanupFunctions.push(window.electronAPI.onLiveShowLogo(handleShowLogo));
      cleanupFunctions.push(window.electronAPI.onLiveThemeUpdate(handleThemeUpdate));

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
    // Safety check for content
    if (!content || typeof content !== 'object') {
      console.warn('Invalid content provided to renderContent, showing default content');
      showDefaultContent(engine);
      return;
    }

    engine.clearShapes();

    switch (content.type) {
      case 'rendering-test':
      case 'rendering-demo':
      case 'template-demo':
      case 'simple-rendering-test':
        renderTestContent(engine, content);
        break;
      case 'scripture':
        renderScriptureContent(engine, content);
        break;
      case 'song':
      case 'announcement':
      case 'template-generated':
        renderTemplateGeneratedContent(engine, content);
        break;
      case 'template-slide':
        renderTemplateSlideContent(engine, content);
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
        console.warn(`Unknown content type: ${content.type}, showing default content`);
        showDefaultContent(engine);
    }
  };

  const renderScriptureContent = (engine: RenderingEngine, content: LiveContent) => {
    // Background for scripture content
    const background = BackgroundShape.createLinearGradient(
      [
        { offset: 0, color: createColor(25, 35, 55) },
        { offset: 1, color: createColor(45, 55, 75) }
      ],
      90,
      width,
      height
    );
    engine.addShape(background);

    // Main content area
    const contentArea = new RectangleShape(
      {
        position: { x: 100, y: 100 },
        size: { width: width - 200, height: height - 200 }
      },
      {
        fillColor: createColor(255, 255, 255, 0.95),
        strokeWidth: 2,
        strokeColor: createColor(200, 200, 200),
        borderRadius: 15,
        shadowColor: createColor(0, 0, 0, 0.3),
        shadowBlur: 20,
        shadowOffsetX: 0,
        shadowOffsetY: 10
      }
    );
    contentArea.setZIndex(1);
    engine.addShape(contentArea);

    // Scripture reference title
    const referenceTitle = new TextShape(
      {
        position: { x: 150, y: 140 },
        size: { width: width - 300, height: 80 }
      },
      {
        fontFamily: 'Georgia, serif',
        fontSize: 36,
        fontWeight: 'bold',
        color: createColor(60, 80, 120),
        textAlign: 'center'
      }
    );
    referenceTitle.setText(content.title || 'Scripture');
    referenceTitle.setZIndex(2);
    engine.addShape(referenceTitle);

    // Scripture text
    const scriptureText = new TextShape(
      {
        position: { x: 150, y: 250 },
        size: { width: width - 300, height: height - 400 }
      },
      {
        fontFamily: 'Georgia, serif',
        fontSize: 28,
        lineHeight: 1.6,
        color: createColor(40, 40, 40),
        textAlign: 'center'
      }
    );

    const text = content.content?.text || 'Scripture text not available';
    scriptureText.setText(`"${text}"`);
    scriptureText.setZIndex(2);
    engine.addShape(scriptureText);

    // Translation info
    if (content.content?.translation) {
      const translation = new TextShape(
        {
          position: { x: 150, y: height - 140 },
          size: { width: width - 300, height: 40 }
        },
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: 18,
          color: createColor(100, 100, 100),
          textAlign: 'right',
          fontStyle: 'italic'
        }
      );
      translation.setText(`- ${content.content.translation}`);
      translation.setZIndex(2);
      engine.addShape(translation);
    }
  };

  const renderTemplateGeneratedContent = async (engine: RenderingEngine, content: LiveContent) => {
    try {
      // If we have pre-generated slide shapes, use them directly
      if (content.slideData && content.slideData.shapes) {
        console.log('Rendering pre-generated slide shapes:', content.slideData.shapes.length);

        engine.clearShapes();
        for (const shape of content.slideData.shapes) {
          engine.addShape(shape);
        }
        return;
      }

      // Generate slide using template system
      if (content.content && content.templateId) {
        console.log('Generating slide using template:', content.templateId);

        const slideContent = {
          id: `live-${Date.now()}`,
          type: content.type as 'song' | 'scripture' | 'announcement',
          title: content.title || 'Live Content',
          data: content.content
        };

        const slides = await slideGenerator.generateSlidesFromContent(slideContent, {
          slideSize: { width, height }
        });

        if (slides && slides.length > 0) {
          const slide = slides[0]; // Use first slide
          engine.clearShapes();
          for (const shape of slide.shapes) {
            engine.addShape(shape);
          }
          console.log(`Template-generated slide rendered with ${slide.shapes.length} shapes`);
        } else {
          console.warn('No slides generated from template');
          showDefaultContent(engine);
        }
      } else {
        console.warn('Template-generated content missing required data');
        showDefaultContent(engine);
      }
    } catch (error) {
      console.error('Error rendering template-generated content:', error);
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

  // Render template slide content from ContentViewer
  const renderTemplateSlideContent = (engine: RenderingEngine, content: LiveContent) => {
    try {
      console.log('Rendering template slide:', content);

      // Handle the new template-slide content structure from LivePresentationPage
      if (content.slide && content.slide.shapes) {
        const slide = content.slide;

        console.log(`Rendering single slide with ${slide.shapes.length} shapes`);

        engine.clearShapes();

        // Add background if specified
        if (slide.background) {
          let backgroundShape;
          if (slide.background.type === 'color') {
            const color = parseColor(slide.background.value);
            backgroundShape = BackgroundShape.createSolidColor(color, width, height);
          } else if (slide.background.type === 'gradient' && Array.isArray(slide.background.value)) {
            backgroundShape = BackgroundShape.createLinearGradient(
              slide.background.value,
              slide.background.angle || 90,
              width,
              height
            );
          }

          if (backgroundShape) {
            engine.addShape(backgroundShape);
          }
        }

        // Recreate Shape objects from serialized data
        for (const shapeData of slide.shapes) {
          let shapeInstance;

          if (shapeData.type === 'background') {
            // Background shapes are handled above, skip duplicates
            if (shapeData.backgroundStyle?.type === 'color') {
              const color = createColor(
                shapeData.backgroundStyle.color.r,
                shapeData.backgroundStyle.color.g,
                shapeData.backgroundStyle.color.b,
                shapeData.backgroundStyle.color.a
              );
              shapeInstance = BackgroundShape.createSolidColor(color, width, height);
            }
          } else if (shapeData.type === 'text') {
            // Recreate TextShape
            shapeInstance = new TextShape(
              {
                position: shapeData.position,
                size: shapeData.size,
                zIndex: shapeData.zIndex,
                opacity: shapeData.opacity,
                visible: shapeData.visible
              },
              shapeData.textStyle
            );
            shapeInstance.text = shapeData.text;
          } else if (shapeData.type === 'rectangle') {
            // Recreate RectangleShape
            shapeInstance = new RectangleShape(
              {
                position: shapeData.position,
                size: shapeData.size,
                zIndex: shapeData.zIndex,
                opacity: shapeData.opacity,
                visible: shapeData.visible
              },
              {
                fillColor: shapeData.fillColor,
                strokeColor: shapeData.strokeColor,
                strokeWidth: shapeData.strokeWidth,
                borderRadius: shapeData.borderRadius
              }
            );
          }

          if (shapeInstance) {
            engine.addShape(shapeInstance);
          }
        }

        console.log(`Successfully rendered template slide with ${slide.shapes.length} shapes`);
        return;
      }

      // Fallback: Handle legacy slides array format
      if (content.content?.slides && Array.isArray(content.content.slides)) {
        const slides = content.content.slides;
        const slideIndex = content.content.currentSlide ? content.content.currentSlide - 1 : 0;

        // Update navigation state
        setAllSlides(slides);
        setTotalSlides(slides.length);
        setCurrentSlideIndex(slideIndex);

        if (!slides[slideIndex]) {
          console.warn(`No slide found at index ${slideIndex}`);
          showDefaultContent(engine);
          return;
        }

        const currentSlide = slides[slideIndex];
        engine.clearShapes();

        // Render all shapes from the current slide
        if (currentSlide.shapes && Array.isArray(currentSlide.shapes)) {
          for (const shape of currentSlide.shapes) {
            engine.addShape(shape);
          }
          console.log(`Rendered slide ${slideIndex + 1}/${slides.length} with ${currentSlide.shapes.length} shapes`);
        } else {
          console.warn('Current slide missing shapes data');
          showDefaultContent(engine);
        }
        return;
      }

      console.warn('Template slide content missing expected slide data structure');
      showDefaultContent(engine);

    } catch (error) {
      console.error('Error rendering template slide:', error);
      showDefaultContent(engine);
    }
  };

  // Helper function to parse color strings to Color objects
  const parseColor = (colorString: string) => {
    if (colorString.startsWith('#')) {
      // Parse hex color
      const hex = colorString.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return createColor(r, g, b);
    }
    // Default fallback
    return createColor(26, 26, 26); // Dark background
  };

  // Navigation functions
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

  const nextSlide = () => {
    if (currentSlideIndex < totalSlides - 1) {
      navigateToSlide(currentSlideIndex + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      navigateToSlide(currentSlideIndex - 1);
    }
  };

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