import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { debounce } from 'lodash';
import { AppDispatch } from '../lib/store';
import { updateSlide } from '../lib/presentationSlice';
import { useFeatureSettings } from './useFeatureSettings';
import { Slide } from '../components/slides/SlideRenderer';
import { SlideBackground } from '../components/formatting/BackgroundToolbar';
import { TextStyle } from '../rendering/types/shapes';
import { TextShape } from '../rendering/shapes/TextShape';
import { isTextShape, applyFormattingToShape } from '../utils/shapeUtils';

export type ContentType = 'scripture' | 'song' | 'announcement';

interface UseContentEditorOptions {
  /**
   * Type of content being edited
   */
  contentType: ContentType;

  /**
   * Current slide being edited
   */
  slide: Slide | null;

  /**
   * Index of the slide in the presentation
   */
  slideIndex?: number;

  /**
   * Optional callback when slide changes
   */
  onSlideChange?: (slide: Slide) => void;
}

interface ContentEditorAPI {
  /**
   * Current feature settings for this content type
   */
  currentSettings: any;

  /**
   * Update formatting for a specific shape
   */
  handleFormatChange: (shapeId: string, updates: Partial<TextStyle>) => void;

  /**
   * Update slide background
   */
  handleBackgroundChange: (background: SlideBackground) => void;

  /**
   * Save current slide formatting as default for this content type
   */
  saveAsDefault: () => void;

  /**
   * Revert current slide to default settings for this content type
   */
  revertToDefaults: () => void;

  /**
   * Save background as default for this content type
   */
  saveBackgroundAsDefault: (background?: SlideBackground) => void;

  /**
   * Save typography as default for this content type
   */
  saveTypographyAsDefault: (shape: TextShape) => void;
}

/**
 * useContentEditor - Unified hook for editing slides across different content types
 *
 * Features:
 * - Auto-loads correct feature settings based on content type
 * - Handles shape formatting updates
 * - Handles background updates
 * - Save as default / Revert to defaults
 * - Redux integration with proper debouncing
 *
 * Usage:
 * ```typescript
 * const editor = useContentEditor({
 *   contentType: 'song',
 *   slide: currentSlide,
 *   slideIndex: currentSlideIndex,
 *   onSlideChange: handleSlideChange
 * });
 *
 * // Use in components
 * <BackgroundToolbar
 *   currentBackground={slide.background}
 *   onBackgroundChange={editor.handleBackgroundChange}
 *   onSaveAsDefault={editor.saveBackgroundAsDefault}
 * />
 * ```
 */
export const useContentEditor = (options: UseContentEditorOptions): ContentEditorAPI => {
  const { contentType, slide, slideIndex = 0, onSlideChange } = options;
  const dispatch = useDispatch<AppDispatch>();

  // Load feature settings based on content type
  const {
    scriptureSettings,
    songSettings,
    announcementSettings,
    updateScriptureTypography,
    updateScriptureBackground,
    updateSongTypography,
    updateSongBackground,
    updateAnnouncementTypography,
    updateAnnouncementBackground
  } = useFeatureSettings();

  // Get current settings based on content type
  const currentSettings = useMemo(() => {
    switch (contentType) {
      case 'scripture':
        return scriptureSettings;
      case 'song':
        return songSettings;
      case 'announcement':
        return announcementSettings;
      default:
        return scriptureSettings;
    }
  }, [contentType, scriptureSettings, songSettings, announcementSettings]);

  // Debounced Redux persistence
  const debouncedPersist = useMemo(
    () => debounce((updatedSlide: Slide, index: number) => {
      console.log('[useContentEditor] 💾 Persisting slide to Redux:', {
        slideId: updatedSlide.id,
        slideIndex: index,
        contentType
      });

      dispatch(updateSlide({ slideIndex: index, slide: updatedSlide }));
    }, 300),
    [dispatch, contentType]
  );

  /**
   * Handle formatting changes to a specific shape
   */
  const handleFormatChange = useCallback((shapeId: string, updates: Partial<TextStyle>) => {
    if (!slide) return;

    console.log('[useContentEditor] 🎨 Format change:', {
      contentType,
      shapeId,
      updates
    });

    // Find and update the shape
    const shape = slide.shapes.find(s => s.id === shapeId);
    if (!shape || !isTextShape(shape)) {
      console.warn('[useContentEditor] ⚠️ Shape not found or not a text shape:', shapeId);
      return;
    }

    // Apply formatting to shape
    applyFormattingToShape(shape as TextShape, updates);

    // Create updated slide
    const updatedSlide: Slide = {
      ...slide,
      shapes: [...slide.shapes] // Shallow copy to trigger re-render
    };

    // Immediate callback for visual feedback
    if (onSlideChange) {
      onSlideChange(updatedSlide);
    }

    // Debounced Redux persistence
    debouncedPersist(updatedSlide, slideIndex);
  }, [slide, slideIndex, onSlideChange, debouncedPersist, contentType]);

  /**
   * Handle background changes
   */
  const handleBackgroundChange = useCallback((background: SlideBackground) => {
    if (!slide) return;

    console.log('[useContentEditor] 🎨 Background change:', {
      contentType,
      background
    });

    const updatedSlide: Slide = {
      ...slide,
      background
    };

    // Immediate callback
    if (onSlideChange) {
      onSlideChange(updatedSlide);
    }

    // Debounced persistence
    debouncedPersist(updatedSlide, slideIndex);
  }, [slide, slideIndex, onSlideChange, debouncedPersist, contentType]);

  /**
   * Save current background as default for this content type
   */
  const saveBackgroundAsDefault = useCallback((background?: SlideBackground) => {
    const bgToSave = background || slide?.background;
    if (!bgToSave) return;

    console.log('[useContentEditor] 💾 Saving background as default:', {
      contentType,
      background: bgToSave
    });

    switch (contentType) {
      case 'scripture':
        updateScriptureBackground(bgToSave);
        break;
      case 'song':
        updateSongBackground(bgToSave);
        break;
      case 'announcement':
        updateAnnouncementBackground(bgToSave);
        break;
    }
  }, [contentType, slide, updateScriptureBackground, updateSongBackground, updateAnnouncementBackground]);

  /**
   * Save typography from a shape as default for this content type
   */
  const saveTypographyAsDefault = useCallback((shape: TextShape) => {
    if (!shape || !shape.textStyle) return;

    console.log('[useContentEditor] 💾 Saving typography as default:', {
      contentType,
      textStyle: shape.textStyle
    });

    const style = shape.textStyle;
    const elementType = shape.metadata?.elementType;

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

    // Base typography updates
    const baseUpdates: any = {
      fontFamily: style.fontFamily || 'Arial',
      textAlign: (style.textAlign as 'left' | 'center' | 'right') || 'center',
      bold: style.fontWeight === 'bold',
      italic: style.fontStyle === 'italic',
      lineHeight: style.lineHeight || 1.5,
    };

    // Content-type specific updates
    switch (contentType) {
      case 'scripture':
        // Scripture has element-specific font sizes
        if (elementType === 'verse') {
          baseUpdates.verseFontSize = style.fontSize || 64;
          baseUpdates.verseColor = colorHex;
        } else if (elementType === 'reference') {
          baseUpdates.referenceFontSize = style.fontSize || 36;
          baseUpdates.referenceColor = colorHex;
        } else if (elementType === 'translation') {
          baseUpdates.translationFontSize = style.fontSize || 28;
          baseUpdates.translationColor = colorHex;
        } else {
          baseUpdates.textColor = colorHex;
        }
        updateScriptureTypography(baseUpdates);
        break;

      case 'song':
        // Songs have title and lyrics font sizes
        if (elementType === 'title') {
          baseUpdates.titleFontSize = style.fontSize || 72;
        } else if (elementType === 'lyrics') {
          baseUpdates.lyricsFontSize = style.fontSize || 56;
        }
        baseUpdates.textColor = colorHex;
        updateSongTypography(baseUpdates);
        break;

      case 'announcement':
        baseUpdates.fontSize = style.fontSize || 64;
        baseUpdates.textColor = colorHex;
        updateAnnouncementTypography(baseUpdates);
        break;
    }
  }, [contentType, updateScriptureTypography, updateSongTypography, updateAnnouncementTypography]);

  /**
   * Save current slide formatting as default
   */
  const saveAsDefault = useCallback(() => {
    if (!slide) return;

    console.log('[useContentEditor] 💾 Saving slide as default:', {
      contentType,
      slideId: slide.id
    });

    // Save background
    if (slide.background) {
      saveBackgroundAsDefault(slide.background);
    }

    // Save typography from first text shape
    const textShape = slide.shapes.find(isTextShape) as TextShape;
    if (textShape) {
      saveTypographyAsDefault(textShape);
    }
  }, [slide, contentType, saveBackgroundAsDefault, saveTypographyAsDefault]);

  /**
   * Revert slide to default settings
   */
  const revertToDefaults = useCallback(() => {
    if (!slide) return;

    console.log('[useContentEditor] 🔄 Reverting to defaults:', {
      contentType,
      slideId: slide.id
    });

    // Apply default background
    const updatedSlide: Slide = {
      ...slide,
      background: currentSettings.background,
      shapes: slide.shapes.map(shape => {
        if (!isTextShape(shape)) return shape;

        const textShape = shape as TextShape;
        const elementType = textShape.metadata?.elementType;
        const typography = currentSettings.typography;

        // Build default style based on content type and element type
        const defaultStyle: Partial<TextStyle> = {
          fontFamily: typography.fontFamily || 'Arial',
          textAlign: (typography.textAlign as 'left' | 'center' | 'right') || 'center',
          fontWeight: typography.bold ? 'bold' : 'normal',
          fontStyle: typography.italic ? 'italic' : 'normal',
          lineHeight: typography.lineHeight || 1.5,
        };

        // Content-type specific font sizes and colors
        if (contentType === 'scripture') {
          if (elementType === 'verse') {
            defaultStyle.fontSize = typography.verseFontSize || 64;
            defaultStyle.color = typography.verseColor || typography.textColor || '#ffffff';
          } else if (elementType === 'reference') {
            defaultStyle.fontSize = typography.referenceFontSize || 36;
            defaultStyle.color = typography.referenceColor || typography.textColor || '#ffffff';
          } else if (elementType === 'translation') {
            defaultStyle.fontSize = typography.translationFontSize || 28;
            defaultStyle.color = typography.translationColor || typography.textColor || '#ffffff';
          }
        } else if (contentType === 'song') {
          if (elementType === 'title') {
            defaultStyle.fontSize = typography.titleFontSize || 72;
          } else if (elementType === 'lyrics') {
            defaultStyle.fontSize = typography.lyricsFontSize || 56;
          }
          defaultStyle.color = typography.textColor || '#ffffff';
        } else if (contentType === 'announcement') {
          defaultStyle.fontSize = typography.fontSize || 64;
          defaultStyle.color = typography.textColor || '#ffffff';
        }

        // Apply defaults to shape
        applyFormattingToShape(textShape, defaultStyle);

        // Mark as using defaults
        textShape.metadata = {
          ...textShape.metadata,
          isDefaultFormatting: true
        };

        return textShape;
      })
    };

    // Update immediately
    if (onSlideChange) {
      onSlideChange(updatedSlide);
    }

    // Persist to Redux
    dispatch(updateSlide({ slideIndex, slide: updatedSlide }));
  }, [slide, slideIndex, contentType, currentSettings, onSlideChange, dispatch]);

  return {
    currentSettings,
    handleFormatChange,
    handleBackgroundChange,
    saveAsDefault,
    revertToDefaults,
    saveBackgroundAsDefault,
    saveTypographyAsDefault
  };
};

export default useContentEditor;
