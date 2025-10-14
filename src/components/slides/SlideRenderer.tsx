import React, { useRef, useEffect } from 'react';
import { RenderingEngine, Shape } from '../../rendering';
import { RenderQuality } from '../../rendering/types/rendering';
import { ResourceManager } from '../../rendering/utils/ResourceManager';
import { ShapeReconstructor } from '../../rendering/utils/ShapeReconstructor';

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

  // Initialize rendering engine once
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const resourceManager = ResourceManager.getInstance();
    const resourceId = `slide-renderer-${slide.id}-${Date.now()}`;

    try {
      // CRITICAL: Set canvas to target resolution BEFORE creating engine
      // This ensures the engine sees the correct dimensions
      canvas.width = targetResolution.width;
      canvas.height = targetResolution.height;

      console.log('🎨 SlideRenderer: Initializing engine', {
        slideId: slide.id,
        targetResolution,
        canvasActualSize: { width: canvas.width, height: canvas.height },
        canvasClientSize: { width: canvas.clientWidth, height: canvas.clientHeight }
      });

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

      console.log('✅ SlideRenderer: Engine created successfully');

      // Notify parent that canvas is ready
      if (onRendered) {
        onRendered(canvas);
      }

    } catch (error) {
      console.error('❌ SlideRenderer: Failed to initialize engine:', error);
    }

    // Cleanup on unmount
    return () => {
      console.log('🧹 SlideRenderer: Cleaning up', { slideId: slide.id });
      resourceManager.cleanup(resourceId);
      engineRef.current = null;
    };
  }, [slide.id, targetResolution, onRendered]);

  // Render slide when it changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !canvasRef.current) return;

    try {
      console.log('🎨 SlideRenderer: Rendering slide', {
        slideId: slide.id,
        shapeCount: slide.shapes.length
      });

      // Clear existing shapes
      engine.clearShapes();

      // Apply background (color, gradient, or image)
      if (slide.background) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.save();

          // Apply opacity
          if (slide.background.opacity !== undefined) {
            ctx.globalAlpha = slide.background.opacity;
          }

          if (slide.background.type === 'color') {
            // Solid color background
            ctx.fillStyle = slide.background.value || '#1a1a1a';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          } else if (slide.background.type === 'gradient' && slide.background.gradient) {
            // Gradient background
            const { start, end, direction } = slide.background.gradient;
            let gradient;

            if (direction === 'horizontal') {
              gradient = ctx.createLinearGradient(0, 0, canvasRef.current.width, 0);
            } else if (direction === 'diagonal') {
              gradient = ctx.createLinearGradient(0, 0, canvasRef.current.width, canvasRef.current.height);
            } else {
              // vertical (default)
              gradient = ctx.createLinearGradient(0, 0, 0, canvasRef.current.height);
            }

            gradient.addColorStop(0, start);
            gradient.addColorStop(1, end);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          } else if (slide.background.type === 'image' && slide.background.value) {
            // Image background (load and draw)
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
              // Re-render shapes on top of image
              engine.render();
            };
            img.src = slide.background.value;
          }

          ctx.restore();
        }
      }

      // Reconstruct shapes if they've been serialized by React state
      const reconstructedShapes = ShapeReconstructor.ensureShapeInstances(slide.shapes);
      
      console.log('🔧 SlideRenderer: Shape reconstruction', {
        originalCount: slide.shapes.length,
        reconstructedCount: reconstructedShapes.length,
        needsReconstruction: slide.shapes.some(shape => ShapeReconstructor.needsReconstruction(shape))
      });

      // Add all shapes to engine
      reconstructedShapes.forEach((shape: Shape, index: number) => {
        console.log('🔍 SlideRenderer: Adding shape', {
          index,
          id: shape.id,
          type: shape.type,
          hasIsVisible: typeof shape.isVisible === 'function',
          constructor: shape.constructor.name,
          visible: shape.visible,
          opacity: shape.opacity
        });
        
        engine.addShape(shape);
      });

      // Render once
      engine.render();

      console.log('✅ SlideRenderer: Render complete', {
        slideId: slide.id,
        shapesRendered: slide.shapes.length
      });

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
