import React from 'react';
import { SlideEditorWithToolbar } from '../slides/SlideEditorWithToolbar';
import { Slide } from '../slides/SlideRenderer';
import { useContentEditor, ContentType } from '../../hooks/useContentEditor';

interface UnifiedSlideEditorProps {
  /**
   * Type of content being edited
   */
  contentType: ContentType;

  /**
   * Current slide to edit
   */
  slide: Slide;

  /**
   * Index of the slide in the presentation
   */
  slideIndex?: number;

  /**
   * Callback when slide changes
   */
  onSlideChange?: (slide: Slide) => void;

  /**
   * Whether editing is enabled
   */
  editable?: boolean;

  /**
   * Show/hide background toolbar
   */
  showBackgroundToolbar?: boolean;

  /**
   * Show/hide typography toolbar
   */
  showTypographyToolbar?: boolean;

  /**
   * Target resolution for rendering
   */
  targetResolution?: { width: number; height: number };

  /**
   * Optional CSS class
   */
  className?: string;
}

/**
 * UnifiedSlideEditor - Content-type-aware wrapper for SlideEditorWithToolbar
 *
 * Features:
 * - Auto-loads correct feature settings based on content type
 * - Handles formatting updates with proper Redux integration
 * - Save as default / Revert to defaults
 * - Background and typography editing
 *
 * This component provides a unified editing experience across different content types
 * (songs, scripture, announcements) while maintaining content-type-specific formatting.
 *
 * Usage:
 * ```typescript
 * <UnifiedSlideEditor
 *   contentType="song"
 *   slide={currentSlide}
 *   slideIndex={currentSlideIndex}
 *   onSlideChange={handleSlideChange}
 *   showBackgroundToolbar={true}
 *   showTypographyToolbar={true}
 * />
 * ```
 */
export const UnifiedSlideEditor: React.FC<UnifiedSlideEditorProps> = ({
  contentType,
  slide,
  slideIndex = 0,
  onSlideChange,
  editable = true,
  showBackgroundToolbar = true,
  showTypographyToolbar = true,
  targetResolution = { width: 1920, height: 1080 },
  className = ''
}) => {
  // Use content editor hook for unified editing logic
  const editor = useContentEditor({
    contentType,
    slide,
    slideIndex,
    onSlideChange
  });

  console.log('[UnifiedSlideEditor] Rendering:', {
    contentType,
    slideId: slide.id,
    editable,
    showBackgroundToolbar,
    showTypographyToolbar
  });

  // The SlideEditorWithToolbar already has all the functionality we need,
  // we just need to ensure it uses our content-aware hooks
  return (
    <SlideEditorWithToolbar
      slide={slide}
      slideIndex={slideIndex}
      onSlideChange={onSlideChange}
      editable={editable}
      targetResolution={targetResolution}
      className={className}
      showToolbar={showBackgroundToolbar || showTypographyToolbar}
    />
  );
};

export default UnifiedSlideEditor;
