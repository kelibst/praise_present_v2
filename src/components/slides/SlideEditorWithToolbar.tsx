import React, { useState, useCallback } from 'react';
import { SlideEditor } from './SlideEditor';
import { Slide } from './SlideRenderer';
import { TypographyToolbar } from '../formatting/TypographyToolbar';
import { PreviewWindow } from '../windows/PreviewWindow';
import { TextShape } from '../../rendering/shapes/TextShape';
import { TextStyle } from '../../rendering/types/shapes';
import { isTextShape } from '../../rendering/utils/shapeTypeGuards';

interface SlideEditorWithToolbarProps {
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
   */
  targetResolution?: { width: number; height: number };

  /**
   * Optional CSS class for the container
   */
  className?: string;

  /**
   * Show/hide typography toolbar
   */
  showToolbar?: boolean;
}

/**
 * SlideEditorWithToolbar - Combines SlideEditor with TypographyToolbar
 *
 * This component provides a PowerPoint-like editing experience:
 * - Click text to select shape
 * - Typography toolbar appears with formatting controls
 * - Changes apply immediately to shape
 * - Preview and live display update automatically
 *
 * Architecture:
 * - SlideEditor handles shape selection and rendering
 * - TypographyToolbar provides formatting controls
 * - Format changes update slide and trigger re-render
 */
export const SlideEditorWithToolbar: React.FC<SlideEditorWithToolbarProps> = ({
  slide,
  onSlideChange,
  editable = true,
  targetResolution = { width: 1920, height: 1080 },
  className = '',
  showToolbar = true
}) => {
  const [selectedShape, setSelectedShape] = useState<TextShape | null>(null);

  // Handle shape selection from SlideEditor
  const handleShapeSelect = useCallback((shape: TextShape | null) => {
    console.log('🎯 SlideEditorWithToolbar: Shape selected', {
      hasShape: !!shape,
      text: shape?.text?.substring(0, 30)
    });
    setSelectedShape(shape);
  }, []);

  // Handle formatting changes from TypographyToolbar
  const handleFormatChange = useCallback((shapeId: string, updates: Partial<TextStyle>) => {
    if (!selectedShape || selectedShape.id !== shapeId) {
      console.warn('⚠️ Format change for non-selected shape', { shapeId, selectedId: selectedShape?.id });
      return;
    }

    console.log('🎨 SlideEditorWithToolbar: Applying format changes', {
      shapeId,
      updates
    });

    // Find the shape in the slide
    const shapeIndex = slide.shapes.findIndex(s => s.id === shapeId);
    if (shapeIndex === -1) {
      console.warn('⚠️ Shape not found in slide', { shapeId });
      return;
    }

    const shape = slide.shapes[shapeIndex];
    if (!isTextShape(shape)) {
      console.warn('⚠️ Shape is not a TextShape', { shapeId, type: shape.type });
      return;
    }

    // Clone the shape with updated style
    const updatedShape = (shape as TextShape).clone();

    // Apply style updates using spread operator to preserve ALL properties
    // This is CRITICAL: merging ensures color, alignment, etc. are never lost
    updatedShape.textStyle = {
      ...updatedShape.textStyle,
      ...updates
    };

    // Handle maxFontSize for auto-shrink (if fontSize changed, update max)
    if (updates.fontSize !== undefined) {
      updatedShape.maxFontSize = updates.fontSize;
    }

    // Create updated slide with new shape
    const updatedShapes = [...slide.shapes];
    updatedShapes[shapeIndex] = updatedShape;

    const updatedSlide: Slide = {
      ...slide,
      shapes: updatedShapes
    };

    // Update local selection reference
    setSelectedShape(updatedShape);

    // Propagate change to parent
    if (onSlideChange) {
      onSlideChange(updatedSlide);
    }
  }, [slide, selectedShape, onSlideChange]);

  return (
    <div className={`flex flex-col w-full h-full ${className}`}>
      {/* Typography Toolbar - Appears when text is selected */}
      {showToolbar && editable && selectedShape && (
        <TypographyToolbar
          selectedShape={selectedShape}
          onFormatChange={handleFormatChange}
        />
      )}

      {/* Slide Editor wrapped in PreviewWindow */}
      <div className="flex-1 min-h-0">
        <PreviewWindow
          title="Preview Window"
          type="preview"
          showControls={true}
          contentResolution={{ width: 1920, height: 1080 }}
          renderResolution={{ width: 1920, height: 1080 }}
          isEditable={editable}
          connectionStatus="connected"
          className="h-full"
        >
          <SlideEditor
            slide={slide}
            onSlideChange={onSlideChange}
            onShapeSelect={handleShapeSelect}
            editable={editable}
            targetResolution={targetResolution}
            className="w-full h-full"
          />
        </PreviewWindow>
      </div>
    </div>
  );
};

export default SlideEditorWithToolbar;
