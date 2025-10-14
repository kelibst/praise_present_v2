import React, { useRef, useState, useCallback } from 'react';
import { SlideRenderer, Slide } from './SlideRenderer';
import { TextShape } from '../../rendering/shapes/TextShape';
import { isTextShape } from '../../rendering/utils/shapeTypeGuards';

interface SlideEditorProps {
  /**
   * The slide to edit
   */
  slide: Slide;

  /**
   * Callback when slide is modified
   */
  onSlideChange?: (updatedSlide: Slide) => void;

  /**
   * Callback when a shape is selected (for formatting toolbar)
   */
  onShapeSelect?: (shape: TextShape | null) => void;

  /**
   * Whether editing is enabled
   */
  editable?: boolean;

  /**
   * Target resolution for rendering
   * Default: 1920x1080 (Full HD presentation standard)
   */
  targetResolution?: { width: number; height: number };

  /**
   * Optional CSS class for the container
   */
  className?: string;
}

/**
 * SlideEditor - Slide component with shape selection (PowerPoint pattern)
 *
 * This component wraps SlideRenderer and adds shape selection capabilities.
 * Unlike click-to-edit, this uses PowerPoint's selection model:
 * - Click shape → Shape selected (visual indicator shown)
 * - Formatting toolbar appears with all controls
 * - Text editing happens in toolbar, not on canvas
 *
 * Key features:
 * - Click on text to select shape
 * - Visual selection indicator (border/highlight)
 * - Coordinate transformation from display → canvas (1920x1080)
 * - Updates via formatting toolbar
 *
 * The coordinate transformation is critical:
 * - Display size might be 305x171 (preview)
 * - Canvas is always 1920x1080
 * - We scale click coordinates: canvasX = displayX * (1920 / displayWidth)
 */
export const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  onSlideChange,
  onShapeSelect,
  editable = true,
  targetResolution = { width: 1920, height: 1080 },
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedShape, setSelectedShape] = useState<TextShape | null>(null);
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number>(-1);

  // Store canvas reference when rendered
  const handleRendered = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  // Handle canvas click - find clicked shape and start editing
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!editable || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Get click position relative to canvas display
    const displayX = event.clientX - rect.left;
    const displayY = event.clientY - rect.top;

    // Transform display coordinates to canvas coordinates (1920x1080)
    // This is the KEY to making click-to-edit work at any display size
    const scaleX = targetResolution.width / rect.width;
    const scaleY = targetResolution.height / rect.height;

    const canvasX = displayX * scaleX;
    const canvasY = displayY * scaleY;

    console.log('🖱️ SlideEditor: Click detected', {
      display: { x: displayX, y: displayY },
      canvas: { x: canvasX, y: canvasY },
      scale: { x: scaleX, y: scaleY },
      displaySize: { width: rect.width, height: rect.height },
      canvasSize: targetResolution
    });

    // Find clicked shape
    let clickedShape: TextShape | null = null;
    let clickedShapeIndex = -1;

    for (let i = slide.shapes.length - 1; i >= 0; i--) {
      const shape = slide.shapes[i];

      if (isTextShape(shape)) {
        const bounds = shape.getBounds();

        // Check if click is within shape bounds (using canvas coordinates)
        if (
          canvasX >= bounds.x &&
          canvasX <= bounds.x + bounds.width &&
          canvasY >= bounds.y &&
          canvasY <= bounds.y + bounds.height
        ) {
          clickedShape = shape as TextShape;
          clickedShapeIndex = i;
          break;
        }
      }
    }

    if (clickedShape) {
      console.log('🎯 SlideEditor: Shape selected', {
        shapeId: clickedShape.id,
        text: clickedShape.text?.substring(0, 30),
        bounds: clickedShape.getBounds()
      });

      // Update selected shape for formatting toolbar (PowerPoint pattern)
      setSelectedShape(clickedShape);
      setSelectedShapeIndex(clickedShapeIndex);

      if (onShapeSelect) {
        onShapeSelect(clickedShape);
      }
    } else {
      // Clicked outside shapes - deselect
      setSelectedShape(null);
      setSelectedShapeIndex(-1);

      if (onShapeSelect) {
        onShapeSelect(null);
      }
    }
  }, [editable, slide.shapes, targetResolution, onShapeSelect]);

  // Get selection bounds for visual indicator
  const getSelectionBounds = (): { x: number; y: number; width: number; height: number } | null => {
    if (!selectedShape || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const bounds = selectedShape.getBounds();

    // Transform canvas coordinates (1920x1080) to display coordinates
    const scaleX = rect.width / targetResolution.width;
    const scaleY = rect.height / targetResolution.height;

    return {
      x: bounds.x * scaleX,
      y: bounds.y * scaleY,
      width: bounds.width * scaleX,
      height: bounds.height * scaleY
    };
  };

  const selectionBounds = getSelectionBounds();

  return (
    <div
      className={`relative w-full h-full ${className}`}
      onClick={handleCanvasClick}
      style={{
        cursor: editable ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="relative"
        style={{
          width: '100%',
          aspectRatio: '16/9',
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <SlideRenderer
          slide={slide}
          targetResolution={targetResolution}
          onRendered={handleRendered}
          className="w-full h-full"
        />

        {/* Visual Selection Indicator (PowerPoint-style blue border) */}
        {selectedShape && selectionBounds && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${selectionBounds.x}px`,
              top: `${selectionBounds.y}px`,
              width: `${selectionBounds.width}px`,
              height: `${selectionBounds.height}px`,
              border: '3px solid #0078D4',
              borderRadius: '2px',
              boxShadow: '0 0 0 1px rgba(0, 120, 212, 0.3)',
              animation: 'pulseSelection 2s ease-in-out infinite'
            }}
          >
            {/* Selection corners (resize handles - visual only for now) */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border-2 border-blue-600 rounded-full" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border-2 border-blue-600 rounded-full" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border-2 border-blue-600 rounded-full" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border-2 border-blue-600 rounded-full" />
          </div>
        )}
      </div>

      {/* Selection Instructions */}
      {editable && !selectedShape && (
        <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded pointer-events-none">
          💡 Click text to select and format
        </div>
      )}

      {/* Add subtle pulse animation */}
      <style>{`
        @keyframes pulseSelection {
          0%, 100% { box-shadow: 0 0 0 1px rgba(0, 120, 212, 0.3); }
          50% { box-shadow: 0 0 0 3px rgba(0, 120, 212, 0.5); }
        }
      `}</style>
    </div>
  );
};

export default SlideEditor;
