import React, { useRef, useEffect } from 'react';
import { RenderingEngine, Shape } from '../../rendering';
import { RenderQuality } from '../../rendering/types/rendering';
import { ResourceManager } from '../../rendering/utils/ResourceManager';
import { ShapeReconstructor } from '../../rendering/utils/ShapeReconstructor';
import { BackgroundShape } from '../../rendering/shapes/BackgroundShape';
import { BackgroundStyle } from '../../rendering/types/shapes';
import { Color, Gradient } from '../../rendering/types/geometry';

export interface Slide {
  id: string;
  shapes: Shape[];
  background?: {
    type: 'color' | 'gradient' | 'image';
    value?: string; // Hex color for solid, or image URL
    gradient?: {
      start: string; // Hex color
      end: string;   // Hex color
      direction?: 'horizontal' | 'vertical' | 'diagonal';
    };
    opacity?: number;
  };
}

interface SlideRendererProps {
  /**
   * The slide to render
   */
  slide: Slide;

  /**
   * Target resolution for rendering
   * Default: 1920x1080 (Full HD presentation standard)
   */
  targetResolution?: { width: number; height: number };

  /**
   * Callback when canvas is rendered and ready
   */
  onRendered?: (canvas: HTMLCanvasElement) => void;

  /**
   * Optional CSS class for the container
   */
  className?: string;
}

/**
 * Helper function to parse hex color string to Color object
 */
const parseHexColor = (hex: string, alpha: number = 1): Color => {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Handle 3-digit hex (e.g., #f00 -> #ff0000)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  const r = parseInt(fullHex.slice(0, 2), 16) || 0;
  const g = parseInt(fullHex.slice(2, 4), 16) || 0;
  const b = parseInt(fullHex.slice(4, 6), 16) || 0;

  return { r, g, b, a: alpha };
};

/**
 * Helper function to convert Slide.background format to BackgroundStyle
 */
const convertSlideBackgroundToBackgroundStyle = (
  slideBackground: Slide['background'],
  resolution: { width: number; height: number }
): BackgroundStyle | null => {
  if (!slideBackground) return null;

  const { type, value, gradient, opacity } = slideBackground;

  if (type === 'color') {
    // Convert hex string to Color object
    const hex = value || '#1a1a1a';
    const color = parseHexColor(hex, opacity || 1);

    return { type: 'color', color };
  }

  if (type === 'gradient' && gradient) {
    // Convert gradient format
    const { start, end, direction } = gradient;

    // Parse colors using helper function
    const startColor = parseHexColor(start, 1);
    const endColor = parseHexColor(end, 1);

    // Determine gradient angle from direction
    let angle = 90; // vertical (default)
    if (direction === 'horizontal') angle = 0;
    if (direction === 'diagonal') angle = 45;

    const gradientStyle: Gradient = {
      type: 'linear',
      angle,
      stops: [
        { offset: 0, color: startColor },
        { offset: 1, color: endColor }
      ]
    };

    return { type: 'gradient', gradient: gradientStyle };
  }

  if (type === 'image' && value) {
    return {
      type: 'image',
      imageUrl: value,
      imageStyle: { objectFit: 'cover' }
    };
  }

  return null;
};

/**
 * SlideRenderer - Core rendering component (PowerPoint pattern)
 *
 * This component is the SINGLE SOURCE OF TRUTH for slide rendering.
 * It always renders at the target resolution (default 1920x1080),
 * and CSS handles scaling to fit the display container.
 *
 * Key principles:
 * - Canvas is ALWAYS rendered at targetResolution
 * - NEVER reads container size
 * - CSS `object-fit: contain` scales the canvas to fit
 * - Same slide renders identically everywhere
 *
 * This is how PowerPoint, Google Slides, and Canva work.
 */
export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  targetResolution = { width: 1920, height: 1080 },
  onRendered,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RenderingEngine | null>(null);

  // Initialize rendering engine once (only when component mounts or resolution changes)
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const resourceManager = ResourceManager.getInstance();
    const resourceId = `slide-renderer-${Date.now()}`; // Remove slide.id from resourceId

    try {
      // CRITICAL: Set canvas to target resolution BEFORE creating engine
      // This ensures the engine sees the correct dimensions
      canvas.width = targetResolution.width;
      canvas.height = targetResolution.height;

      // Diagnostic logging disabled for production
      // console.log('🎨 SlideRenderer: Initializing engine', {
      //   slideId: slide.id,
      //   targetResolution,
      //   canvasActualSize: { width: canvas.width, height: canvas.height },
      //   canvasClientSize: { width: canvas.clientWidth, height: canvas.clientHeight }
      // });

      // Create simple rendering engine (FIXED RESOLUTION MODE - NO responsive features)
      // Canvas is ALWAYS 1920x1080 - CSS handles all display scaling
      const engine = new RenderingEngine({
        canvas,
        settings: {
          quality: RenderQuality.HIGH,
          targetFPS: 60,
          enableCaching: true,
          enableGPUAcceleration: true,
          debugMode: false
        },
        enableDebug: false // No debug overlay needed
      });

      engineRef.current = engine;
      resourceManager.registerEngine(resourceId, engine);

      // Start continuous render loop to handle async image loading
      engine.startRenderLoop();

      // console.log('✅ SlideRenderer: Engine created and render loop started');

      // Notify parent that canvas is ready
      if (onRendered) {
        onRendered(canvas);
      }

    } catch (error) {
      console.error('❌ SlideRenderer: Failed to initialize engine:', error);
    }

    // Cleanup on unmount
    return () => {
      // console.log('🧹 SlideRenderer: Cleaning up');
      resourceManager.cleanup(resourceId);
      engineRef.current = null;
    };
  }, [targetResolution.width, targetResolution.height]); // Only recreate if resolution changes

  // Render slide when it changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !canvasRef.current) return;

    try {
      // Diagnostic logging disabled for production
      // console.log('🎨 SlideRenderer: Rendering slide', {
      //   slideId: slide.id,
      //   shapeCount: slide.shapes.length
      // });

      // Clear existing shapes
      engine.clearShapes();

      // Convert slide background to BackgroundShape and add as first shape
      let allShapes: Shape[] = [];

      if (slide.background) {
        console.log('🖼️ SlideRenderer: Processing background', {
          type: slide.background.type,
          hasValue: !!slide.background.value,
          valuePreview: slide.background.value?.substring(0, 50),
          isBase64: slide.background.value?.startsWith('data:image'),
          opacity: slide.background.opacity
        });

        const backgroundStyle = convertSlideBackgroundToBackgroundStyle(slide.background, targetResolution);

        if (backgroundStyle) {
          console.log('🎨 SlideRenderer: Created backgroundStyle', {
            type: backgroundStyle.type,
            hasImageUrl: !!(backgroundStyle as any).imageUrl,
            imageUrlPreview: (backgroundStyle as any).imageUrl?.substring(0, 50)
          });

          const backgroundShape = new BackgroundShape({
            position: { x: 0, y: 0 },
            size: { width: targetResolution.width, height: targetResolution.height },
            opacity: slide.background.opacity || 1,
            zIndex: -1000, // Ensure background is always behind
            backgroundStyle
          });

          allShapes.push(backgroundShape);
        }
      }

      // Reconstruct shapes if they've been serialized by React state
      const reconstructedShapes = ShapeReconstructor.ensureShapeInstances(slide.shapes);
      allShapes = [...allShapes, ...reconstructedShapes];

      console.log('🔧 SlideRenderer: Shape reconstruction', {
        slideId: slide.id,
        originalCount: slide.shapes.length,
        reconstructedCount: reconstructedShapes.length,
        totalWithBackground: allShapes.length,
        needsReconstruction: slide.shapes.some(shape => ShapeReconstructor.needsReconstruction(shape))
      });

      // Add all shapes to engine (background first, then content shapes)
      allShapes.forEach((shape: Shape, index: number) => {
        console.log('🔍 SlideRenderer: Adding shape', {
          index,
          id: shape.id,
          type: shape.type,
          zIndex: shape.zIndex,
          visible: shape.visible,
          opacity: shape.opacity,
          constructor: shape.constructor.name
        });

        engine.addShape(shape);
      });

      // No need to manually render - the render loop is already running
      // and will continuously render, picking up async image loads

      // console.log('✅ SlideRenderer: Shapes added, render loop will handle rendering', {
      //   slideId: slide.id,
      //   shapesRendered: slide.shapes.length
      // });

    } catch (error) {
      console.error('❌ SlideRenderer: Render error:', error);
    }
  }, [slide]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        display: 'block',
        objectFit: 'contain', // Browser GPU handles scaling - maintains aspect ratio
        objectPosition: 'center', // Center the canvas in its container
        imageRendering: 'auto', // Smooth scaling for better quality
        backgroundColor: slide.background?.value || '#000000'
      }}
    />
  );
};

export default SlideRenderer;
