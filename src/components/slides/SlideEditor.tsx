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

interface EditState {
  shapeId: string | null;
  text: string;
  position: { x: number; y: number };
}

/**
 * SlideEditor - Editable slide component (PowerPoint pattern)
 *
 * This component wraps SlideRenderer and adds editing capabilities.
 * It handles click-to-edit functionality with proper coordinate transformation.
 *
 * Key features:
 * - Click on text to edit
 * - Coordinate transformation from display → canvas (1920x1080)
 * - Updates slide data (single source of truth)
 * - Enter to save, Esc to cancel
 *
 * The coordinate transformation is critical:
 * - Display size might be 305x171 (preview)
 * - Canvas is always 1920x1080
 * - We scale click coordinates: canvasX = displayX * (1920 / displayWidth)
 */
export const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  onSlideChange,
  editable = true,
  targetResolution = { width: 1920, height: 1080 },
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

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
      console.log('✏️ SlideEditor: Shape clicked', {
        shapeId: clickedShape.id,
        text: clickedShape.text?.substring(0, 30),
        bounds: clickedShape.getBounds()
      });

      // Start editing - position input at clicked location (display coordinates)
      setEditState({
        shapeId: `${clickedShapeIndex}`,
        text: clickedShape.text || '',
        position: {
          x: event.clientX,
          y: event.clientY
        }
      });

      // Focus input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    } else {
      // Clicked outside shapes - cancel editing
      setEditState(null);
    }
  }, [editable, slide.shapes, targetResolution]);

  // Save edited text
  const saveEdit = useCallback(() => {
    if (!editState || !onSlideChange) return;

    const shapeIndex = parseInt(editState.shapeId!, 10);
    if (isNaN(shapeIndex) || shapeIndex < 0 || shapeIndex >= slide.shapes.length) {
      setEditState(null);
      return;
    }

    const shape = slide.shapes[shapeIndex];
    if (!isTextShape(shape)) {
      setEditState(null);
      return;
    }

    console.log('💾 SlideEditor: Saving edit', {
      shapeId: editState.shapeId,
      oldText: (shape as TextShape).text?.substring(0, 30),
      newText: editState.text.substring(0, 30)
    });

    // Update shape text
    (shape as TextShape).setText(editState.text);

    // Create updated slide
    const updatedSlide: Slide = {
      ...slide,
      shapes: [...slide.shapes]
    };

    // Notify parent of change
    onSlideChange(updatedSlide);

    // Clear edit state
    setEditState(null);
  }, [editState, slide, onSlideChange]);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    console.log('❌ SlideEditor: Canceling edit');
    setEditState(null);
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
  }, [saveEdit, cancelEdit]);

  return (
    <div
      className={`relative w-full h-full ${className}`}
      onClick={handleCanvasClick}
      style={{ cursor: editable ? 'pointer' : 'default' }}
    >
      <SlideRenderer
        slide={slide}
        targetResolution={targetResolution}
        onRendered={handleRendered}
      />

      {/* Edit Input */}
      {editState && (
        <input
          ref={inputRef}
          type="text"
          value={editState.text}
          onChange={(e) => setEditState({ ...editState, text: e.target.value })}
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
          style={{
            position: 'fixed',
            left: editState.position.x,
            top: editState.position.y,
            zIndex: 1000,
            padding: '8px 12px',
            border: '2px solid #4A90E2',
            borderRadius: '4px',
            fontSize: '16px',
            backgroundColor: 'white',
            color: 'black',
            minWidth: '200px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          placeholder="Edit text..."
        />
      )}

      {/* Edit Instructions */}
      {editable && !editState && (
        <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded pointer-events-none">
          💡 Click text to edit
        </div>
      )}
    </div>
  );
};

export default SlideEditor;
