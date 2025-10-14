import React, { useState, useCallback } from 'react';
import { SlideEditor } from './SlideEditor';
import { Slide } from './SlideRenderer';
import { TypographyToolbar } from '../formatting/TypographyToolbar';
import { BackgroundToolbar, SlideBackground } from '../formatting/BackgroundToolbar';
import { PreviewWindow } from '../windows/PreviewWindow';
import { TextShape } from '../../rendering/shapes/TextShape';
import { TextStyle } from '../../rendering/types/shapes';
import { isTextShape } from '../../rendering/utils/shapeTypeGuards';
import { useFeatureSettings } from '../../hooks/useFeatureSettings';

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
  const [showBackgroundToolbar, setShowBackgroundToolbar] = useState(false);
  const [saveConfirmation, setSaveConfirmation] = useState(false);

  // Feature settings hook for saving as default
  const { updateScriptureTypography } = useFeatureSettings();

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

    // console.log('🎨 SlideEditorWithToolbar: Applying format changes', {
    //   shapeId,
    //   updates
    // });

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

    console.log('🎨 Applying format changes:', {
      shapeId,
      updates,
      beforeTextStyle: { ...updatedShape.textStyle },
    });

    // Apply style updates using spread operator to preserve ALL properties
    // This is CRITICAL: merging ensures color, alignment, etc. are never lost
    updatedShape.textStyle = {
      ...updatedShape.textStyle,
      ...updates
    };

    console.log('✅ After merge:', {
      afterTextStyle: { ...updatedShape.textStyle },
      fontSize: updatedShape.textStyle.fontSize
    });

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

  // Handle background changes from BackgroundToolbar
  const handleBackgroundChange = useCallback((background: SlideBackground) => {
    // console.log('🎨 SlideEditorWithToolbar: Background changed', background);

    const updatedSlide: Slide = {
      ...slide,
      background
    };

    if (onSlideChange) {
      onSlideChange(updatedSlide);
    }
  }, [slide, onSlideChange]);

  // Handle saving current shape style as default
  const handleSaveAsDefault = useCallback(() => {
    if (!selectedShape || !selectedShape.textStyle) return;

    console.log('💾 Saving current formatting as default:', selectedShape.textStyle);

    const style = selectedShape.textStyle;

    // Extract color as hex string
    let colorHex = '#ffffff';
    if (style.color) {
      if (typeof style.color === 'string') {
        colorHex = style.color;
      } else {
        const { r, g, b } = style.color;
        colorHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }
    }

    console.log('💾 Extracting color from style:', {
      originalColor: style.color,
      extractedHex: colorHex
    });

    // Determine which element type this is and update the appropriate font size AND color
    const elementType = selectedShape.metadata?.elementType;
    const updates: any = {
      fontFamily: style.fontFamily || 'Arial',
      textAlign: (style.textAlign as 'left' | 'center' | 'right') || 'center',
      bold: style.fontWeight === 'bold',
      italic: style.fontStyle === 'italic',
      lineHeight: style.lineHeight || 1.5,
    };

    // Update the appropriate font size AND color based on element type
    if (elementType === 'verse') {
      updates.verseFontSize = style.fontSize || 64;
      updates.verseColor = colorHex; // Verse-specific color
    } else if (elementType === 'reference') {
      updates.referenceFontSize = style.fontSize || 36;
      updates.referenceColor = colorHex; // Reference-specific color
    } else if (elementType === 'translation') {
      updates.translationFontSize = style.fontSize || 28;
      updates.translationColor = colorHex; // Translation-specific color
    } else {
      // Fallback: update the shared textColor if element type unknown
      updates.textColor = colorHex;
    }

    console.log('💾 Saving as default for element type:', elementType, updates);

    // Update scripture typography settings
    updateScriptureTypography(updates);

    // Show confirmation
    setSaveConfirmation(true);
    setTimeout(() => setSaveConfirmation(false), 2000);
  }, [selectedShape, updateScriptureTypography]);

  // Get current background from slide or use default
  const currentBackground: SlideBackground = slide.background || {
    type: 'color',
    value: '#1a1a1a',
    opacity: 1.0
  };

  return (
    <div className={`flex flex-col w-full h-full ${className}`}>
      {/* Toolbars Section */}
      {showToolbar && editable && (
        <div className="flex flex-col">
          {/* Background Toolbar - Always visible when editing */}
          <BackgroundToolbar
            currentBackground={currentBackground}
            onBackgroundChange={handleBackgroundChange}
          />

          {/* Typography Toolbar - Appears when text is selected */}
          {selectedShape && (
            <div className="relative">
              <TypographyToolbar
                selectedShape={selectedShape}
                onFormatChange={handleFormatChange}
                onSaveAsDefault={handleSaveAsDefault}
              />

              {/* Save Confirmation Toast */}
              {saveConfirmation && (
                <div className="absolute right-4 top-14 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
                  ✓ Saved as default settings
                </div>
              )}
            </div>
          )}
        </div>
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
