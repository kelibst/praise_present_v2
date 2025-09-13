import React, { useRef, useEffect, useState } from 'react';
import { RenderingEngine } from '../rendering/core/RenderingEngine';
import { TextShape } from '../rendering/shapes/TextShape';
import { BackgroundShape } from '../rendering/shapes/BackgroundShape';
import { RenderQuality } from '../rendering/types/rendering';

export interface LiveDisplayContent {
  type: 'scripture' | 'song' | 'service' | 'black' | 'clear';
  reference?: string;
  text?: string;
  title?: string;
  artist?: string;
  verses?: string[];
  currentVerse?: number;
}

interface LiveDisplayManagerProps {
  content?: LiveDisplayContent | null;
  isVisible?: boolean;
}

export const LiveDisplayManager: React.FC<LiveDisplayManagerProps> = ({
  content,
  isVisible = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RenderingEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !isVisible) return;

    const canvas = canvasRef.current;

    // Ensure canvas has proper dimensions
    console.log('Canvas dimensions:', {
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
      width: canvas.width,
      height: canvas.height,
      offsetWidth: canvas.offsetWidth,
      offsetHeight: canvas.offsetHeight
    });

    // Wait for the canvas to be fully mounted and sized
    const initializeEngine = () => {
      console.log('Canvas dimensions at initialization:', {
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        width: canvas.width,
        height: canvas.height,
        offsetWidth: canvas.offsetWidth,
        offsetHeight: canvas.offsetHeight
      });

      // Check if canvas has reasonable dimensions
      if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
        console.warn('Canvas has zero dimensions, waiting...');
        setTimeout(initializeEngine, 100);
        return;
      }

      try {
        const engine = new RenderingEngine({
          canvas,
          enableDebug: true, // Enable debug temporarily
          settings: {
            quality: RenderQuality.HIGH,
            targetFPS: 60,
            enableCaching: true,
            enableGPUAcceleration: true,
            debugMode: true
          }
        });

        engineRef.current = engine;
        setIsInitialized(true);

        engine.startRenderLoop();
        console.log('Live Display Manager initialized successfully');

      } catch (error) {
        console.error('Failed to initialize live display:', error);
      }
    };

    // Start initialization after a short delay
    setTimeout(initializeEngine, 50);

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!engineRef.current || !isInitialized || !canvasRef.current) return;

    updateDisplay(content);
  }, [content, isInitialized]);

  const updateDisplay = (content: LiveDisplayContent | null | undefined) => {
    if (!engineRef.current || !canvasRef.current) return;

    const engine = engineRef.current;
    const canvas = canvasRef.current;

    // Clear existing shapes
    engine.clearShapes();

    if (!content) {
      return;
    }

    switch (content.type) {
      case 'black':
        renderBlackScreen();
        break;
      case 'clear':
        // Already cleared above
        break;
      case 'scripture':
        renderScripture(content);
        break;
      case 'song':
        renderSong(content);
        break;
      case 'service':
        renderService(content);
        break;
    }
  };

  const renderBlackScreen = () => {
    if (!engineRef.current || !canvasRef.current) return;

    const background = BackgroundShape.createSolidColor(
      { r: 0, g: 0, b: 0, a: 1 },
      canvasRef.current.width,
      canvasRef.current.height
    );

    engineRef.current.addShape(background);
  };

  const renderScripture = (content: LiveDisplayContent) => {
    if (!engineRef.current || !canvasRef.current) return;
    const engine = engineRef.current;
    const canvas = canvasRef.current;

    // Add background
    const background = BackgroundShape.createLinearGradient(
      [
        { offset: 0, color: { r: 30, g: 60, b: 114, a: 1 } },
        { offset: 1, color: { r: 42, g: 82, b: 152, a: 1 } }
      ],
      135,
      canvas.width,
      canvas.height
    );
    engine.addShape(background);

    // Add reference text
    if (content.reference) {
      const referenceText = new TextShape({
        position: { x: canvas.width / 2, y: canvas.height * 0.2 },
        size: { width: canvas.width * 0.9, height: 60 },
        text: content.reference,
        textStyle: {
          fontSize: 42,
          fontFamily: 'Georgia, serif',
          color: { r: 255, g: 255, b: 255, a: 1 },
          fontWeight: 'bold',
          textAlign: 'center'
        }
      });

      engine.addShape(referenceText);
    }

    // Add scripture text
    if (content.text) {
      const scriptureText = new TextShape({
        position: { x: canvas.width / 2, y: canvas.height / 2 },
        size: { width: canvas.width * 0.8, height: canvas.height * 0.4 },
        text: content.text,
        textStyle: {
          fontSize: 36,
          fontFamily: 'Georgia, serif',
          color: { r: 255, g: 255, b: 255, a: 1 },
          textAlign: 'center',
          lineHeight: 1.6
        }
      });

      engine.addShape(scriptureText);
    }
  };

  const renderSong = (content: LiveDisplayContent) => {
    if (!engineRef.current || !canvasRef.current) return;
    const engine = engineRef.current;
    const canvas = canvasRef.current;

    // Add background
    const background = BackgroundShape.createLinearGradient(
      [
        { offset: 0, color: { r: 102, g: 126, b: 234, a: 1 } },
        { offset: 1, color: { r: 118, g: 75, b: 162, a: 1 } }
      ],
      135,
      canvas.width,
      canvas.height
    );
    engine.addShape(background);

    // Add title
    if (content.title) {
      const titleText = new TextShape({
        position: { x: canvas.width / 2, y: canvas.height * 0.15 },
        size: { width: canvas.width * 0.9, height: 60 },
        text: content.title,
        textStyle: {
          fontSize: 48,
          fontFamily: 'Arial, sans-serif',
          color: { r: 255, g: 255, b: 255, a: 1 },
          fontWeight: 'bold',
          textAlign: 'center'
        }
      });

      engine.addShape(titleText);
    }

    // Add artist
    if (content.artist) {
      const artistText = new TextShape({
        position: { x: canvas.width / 2, y: canvas.height * 0.25 },
        size: { width: canvas.width * 0.8, height: 40 },
        text: `by ${content.artist}`,
        textStyle: {
          fontSize: 28,
          fontFamily: 'Arial, sans-serif',
          color: { r: 224, g: 224, b: 224, a: 1 },
          textAlign: 'center'
        }
      });

      engine.addShape(artistText);
    }

    // Add current verse
    if (content.verses && content.verses.length > 0) {
      const currentVerseIndex = content.currentVerse || 0;
      const verse = content.verses[currentVerseIndex];

      if (verse) {
        const verseText = new TextShape({
          position: { x: canvas.width / 2, y: canvas.height * 0.55 },
          size: { width: canvas.width * 0.85, height: canvas.height * 0.3 },
          text: verse,
          textStyle: {
            fontSize: 32,
            fontFamily: 'Arial, sans-serif',
            color: { r: 255, g: 255, b: 255, a: 1 },
            textAlign: 'center',
            lineHeight: 1.6
          }
        });

        engine.addShape(verseText);
      }

      // Add verse indicator if there are multiple verses
      if (content.verses.length > 1) {
        const indicator = new TextShape({
          position: { x: canvas.width / 2, y: canvas.height * 0.9 },
          size: { width: canvas.width * 0.8, height: 30 },
          text: `Verse ${currentVerseIndex + 1} of ${content.verses.length}`,
          textStyle: {
            fontSize: 20,
            fontFamily: 'Arial, sans-serif',
            color: { r: 176, g: 176, b: 176, a: 1 },
            textAlign: 'center'
          }
        });

        engine.addShape(indicator);
      }
    }
  };

  const renderService = (content: LiveDisplayContent) => {
    if (!engineRef.current || !canvasRef.current) return;
    const engine = engineRef.current;
    const canvas = canvasRef.current;

    // Add background
    const background = BackgroundShape.createLinearGradient(
      [
        { offset: 0, color: { r: 44, g: 62, b: 80, a: 1 } },
        { offset: 1, color: { r: 52, g: 152, b: 219, a: 1 } }
      ],
      135,
      canvas.width,
      canvas.height
    );
    engine.addShape(background);

    // Add service name
    if (content.title) {
      const titleText = new TextShape({
        position: { x: canvas.width / 2, y: canvas.height / 2 },
        size: { width: canvas.width * 0.9, height: 80 },
        text: content.title,
        textStyle: {
          fontSize: 54,
          fontFamily: 'Arial, sans-serif',
          color: { r: 255, g: 255, b: 255, a: 1 },
          fontWeight: 'bold',
          textAlign: 'center'
        }
      });

      engine.addShape(titleText);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-full h-full">
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="w-full h-full bg-black"
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />
    </div>
  );
};