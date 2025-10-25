import React, { useMemo, useCallback } from 'react';
import {
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Plus,
  Palette,
  Save,
  Square,
  RotateCcw,
  CheckCircle2,
  Pencil
} from 'lucide-react';
import { TextShape } from '../../rendering/shapes/TextShape';
import { TextStyle } from '../../rendering/types/shapes';
import {
  normalizeColor,
  hexToRgb,
  clampFontSize,
  clampLineHeight,
  clampOpacity,
  isUsingDefaults,
  getElementTypeLabel,
  PRESENTATION_FONTS
} from '../../utils/shapeUtils';

interface TypographyToolbarProps {
  /**
   * Currently selected text shape (null if no selection)
   */
  selectedShape: TextShape | null;

  /**
   * Callback when user changes formatting
   */
  onFormatChange: (shapeId: string, updates: Partial<TextStyle>) => void;

  /**
   * Optional callback to save current formatting as default settings
   */
  onSaveAsDefault?: () => void;

  /**
   * Optional callback to revert shape to default settings
   */
  onRevertToDefaults?: () => void;

  /**
   * Optional CSS class
   */
  className?: string;
}

/**
 * TypographyToolbar - PowerPoint-style formatting toolbar for text shapes
 *
 * REDESIGNED ARCHITECTURE (v2.0):
 * - No Redux formatting state - reads directly from selectedShape prop
 * - No useEditorFormatting hook - simpler, direct callbacks
 * - Memoized computed values for performance
 * - Re-renders on every prop change to ensure toolbar stays in sync
 * - All handlers call onFormatChange immediately (no debouncing here)
 *
 * Features:
 * - Font family dropdown (10 common presentation fonts)
 * - Font size controls (slider + numeric input + +/- buttons)
 * - Text style toggles (Bold, Italic, Underline)
 * - Text alignment buttons (Left, Center, Right)
 * - Color picker with hex display
 * - Background color and opacity controls
 * - Line height slider
 * - Live preview of changes
 *
 * Architecture:
 * - Only visible when a text shape is selected
 * - Changes apply immediately via onFormatChange callback
 * - Parent component handles debouncing and persistence
 * - Works with auto-shrink: user-set size becomes maxFontSize
 */
export const TypographyToolbar: React.FC<TypographyToolbarProps> = ({
  selectedShape,
  onFormatChange,
  onSaveAsDefault,
  onRevertToDefaults,
  className = ''
}) => {
  // If no shape selected, don't render toolbar
  if (!selectedShape) {
    return null;
  }

  const style = selectedShape.textStyle;

  // Memoized computed values for performance
  const textColor = useMemo(() => normalizeColor(style.color), [style.color]);

  const backgroundColor = useMemo(() => {
    if (!style.fill || typeof style.fill === 'string') return '#000000';
    if ('r' in style.fill) {
      const { r, g, b } = style.fill;
      return `#${[r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
    }
    return '#000000';
  }, [style.fill]);

  // Extract values from shape with defaults
  const fontSize = style.fontSize ?? 64;
  const fontFamily = style.fontFamily ?? 'Arial';
  const isBold = style.fontWeight === 'bold';
  const isItalic = style.fontStyle === 'italic';
  const isUnderline = style.textDecoration === 'underline';
  const textAlign = (style.textAlign as 'left' | 'center' | 'right') ?? 'center';
  const lineHeight = style.lineHeight ?? 1.5;
  const hasBackground = !!style.fill;
  const backgroundOpacity = style.opacity ?? 1.0;

  // Formatting status
  const usingDefaults = isUsingDefaults(selectedShape);
  const elementLabel = getElementTypeLabel(selectedShape);

  // Update formatting helper
  const updateFormat = useCallback((updates: Partial<TextStyle>) => {
    onFormatChange(selectedShape.id, updates);
  }, [selectedShape.id, onFormatChange]);

  // Font size handlers
  const handleFontSizeChange = useCallback((newSize: number) => {
    updateFormat({ fontSize: clampFontSize(newSize) });
  }, [updateFormat]);

  const incrementFontSize = useCallback(() => {
    handleFontSizeChange(fontSize + 2);
  }, [fontSize, handleFontSizeChange]);

  const decrementFontSize = useCallback(() => {
    handleFontSizeChange(fontSize - 2);
  }, [fontSize, handleFontSizeChange]);

  // Font family handler
  const handleFontFamilyChange = useCallback((family: string) => {
    updateFormat({ fontFamily: family });
  }, [updateFormat]);

  // Style toggle handlers
  const toggleBold = useCallback(() => {
    updateFormat({ fontWeight: isBold ? 'normal' : 'bold' });
  }, [isBold, updateFormat]);

  const toggleItalic = useCallback(() => {
    updateFormat({ fontStyle: isItalic ? 'normal' : 'italic' });
  }, [isItalic, updateFormat]);

  const toggleUnderline = useCallback(() => {
    updateFormat({ textDecoration: isUnderline ? 'none' : 'underline' });
  }, [isUnderline, updateFormat]);

  // Alignment handler
  const handleAlignmentChange = useCallback((align: 'left' | 'center' | 'right') => {
    updateFormat({ textAlign: align });
  }, [updateFormat]);

  // Color handler
  const handleColorChange = useCallback((hex: string) => {
    updateFormat({ color: hex as any });
  }, [updateFormat]);

  // Line height handler
  const handleLineHeightChange = useCallback((height: number) => {
    updateFormat({ lineHeight: clampLineHeight(height) });
  }, [updateFormat]);

  // Background toggle
  const toggleBackground = useCallback(() => {
    if (hasBackground) {
      // Disable background
      updateFormat({
        fill: undefined as any,
        opacity: undefined as any
      });
    } else {
      // Enable background with current color
      const bgColor = hexToRgb(backgroundColor);
      updateFormat({
        fill: bgColor,
        opacity: backgroundOpacity
      });
    }
  }, [hasBackground, backgroundColor, backgroundOpacity, updateFormat]);

  // Background color handler
  const handleBackgroundColorChange = useCallback((hex: string) => {
    if (hasBackground) {
      const bgColor = hexToRgb(hex);
      updateFormat({ fill: bgColor });
    }
  }, [hasBackground, updateFormat]);

  // Background opacity handler
  const handleBackgroundOpacityChange = useCallback((opacity: number) => {
    if (hasBackground) {
      updateFormat({ opacity: clampOpacity(opacity) });
    }
  }, [hasBackground, updateFormat]);

  return (
    <div className={`bg-gray-900/95 border-b border-gray-700 px-4 py-2 ${className}`}>
      <div className="flex items-center gap-4 flex-wrap">
        {/* Element Type Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/50 border border-blue-600 rounded">
          <span className="text-xs font-semibold text-blue-300">Editing:</span>
          <span className="text-sm font-bold text-white">{elementLabel}</span>
        </div>

        {/* Formatting Status Indicator */}
        <div className={usingDefaults
          ? "flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-600/50 rounded"
          : "flex items-center gap-2 px-3 py-1 bg-orange-900/30 border border-orange-600/50 rounded"
        }>
          {usingDefaults ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Pencil className="w-3.5 h-3.5 text-orange-500" />
          )}
          <span className={usingDefaults
            ? "text-xs font-medium text-green-300"
            : "text-xs font-medium text-orange-300"
          }>
            {usingDefaults ? 'Using Defaults' : 'Custom'}
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-600" />

        {/* Font Family Dropdown */}
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-gray-400" />
          <select
            value={fontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="bg-gray-800 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minWidth: '140px' }}
          >
            {PRESENTATION_FONTS.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={decrementFontSize}
            className="bg-gray-800 hover:bg-gray-700 text-white p-1 rounded border border-gray-600 transition-colors"
            title="Decrease font size"
          >
            <Minus className="w-3 h-3" />
          </button>

          <input
            type="number"
            value={fontSize}
            onChange={(e) => handleFontSizeChange(parseInt(e.target.value) || 64)}
            className="bg-gray-800 text-white text-sm border border-gray-600 rounded px-2 py-1 w-16 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={8}
            max={200}
          />

          <button
            onClick={incrementFontSize}
            className="bg-gray-800 hover:bg-gray-700 text-white p-1 rounded border border-gray-600 transition-colors"
            title="Increase font size"
          >
            <Plus className="w-3 h-3" />
          </button>

          <input
            type="range"
            value={fontSize}
            onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
            min={8}
            max={200}
            step={1}
            className="w-24 accent-blue-500"
            title={`Font size: ${fontSize}px`}
          />
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-600" />

        {/* Text Style Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleBold}
            className={`p-2 rounded border transition-colors ${
              isBold
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            onClick={toggleItalic}
            className={`p-2 rounded border transition-colors ${
              isItalic
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            onClick={toggleUnderline}
            className={`p-2 rounded border transition-colors ${
              isUnderline
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-600" />

        {/* Text Alignment */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleAlignmentChange('left')}
            className={`p-2 rounded border transition-colors ${
              textAlign === 'left'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
            title="Align left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleAlignmentChange('center')}
            className={`p-2 rounded border transition-colors ${
              textAlign === 'center'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
            title="Align center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleAlignmentChange('right')}
            className={`p-2 rounded border transition-colors ${
              textAlign === 'right'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
            title="Align right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-600" />

        {/* Text Color Picker */}
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-gray-400" />
          <input
            type="color"
            value={textColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-10 h-8 bg-gray-800 border border-gray-600 rounded cursor-pointer"
            title="Text color"
          />
          <input
            type="text"
            value={textColor.toUpperCase()}
            onChange={(e) => handleColorChange(e.target.value)}
            className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-2 py-1 w-20 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="#FFFFFF"
            maxLength={7}
          />
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-600" />

        {/* Line Height */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Line:</span>
          <input
            type="range"
            value={lineHeight}
            onChange={(e) => handleLineHeightChange(parseFloat(e.target.value))}
            min={0.8}
            max={3.0}
            step={0.1}
            className="w-20 accent-blue-500"
            title={`Line height: ${lineHeight.toFixed(1)}`}
          />
          <span className="text-xs text-white w-8">{lineHeight.toFixed(1)}</span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-600" />

        {/* Background Controls */}
        <div className="flex items-center gap-2">
          {/* Background toggle button */}
          <button
            onClick={toggleBackground}
            className={`p-2 rounded border transition-colors ${
              hasBackground
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
            title={hasBackground ? 'Remove background' : 'Add background'}
          >
            <Square className="w-4 h-4" />
          </button>

          {/* Background color picker (only when background is enabled) */}
          {hasBackground && (
            <>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="w-10 h-8 bg-gray-800 border border-gray-600 rounded cursor-pointer"
                title="Background color"
              />
              <input
                type="text"
                value={backgroundColor.toUpperCase()}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-2 py-1 w-20 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#000000"
                maxLength={7}
              />

              {/* Background opacity slider */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">BG:</span>
                <input
                  type="range"
                  value={backgroundOpacity}
                  onChange={(e) => handleBackgroundOpacityChange(parseFloat(e.target.value))}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-20 accent-blue-500"
                  title={`Background opacity: ${Math.round(backgroundOpacity * 100)}%`}
                />
                <span className="text-xs text-white w-8">{Math.round(backgroundOpacity * 100)}%</span>
              </div>
            </>
          )}
        </div>

        {/* Revert to Defaults Button - Only show when custom formatting */}
        {onRevertToDefaults && !usingDefaults && (
          <>
            <div className="h-6 w-px bg-gray-600" />
            <button
              onClick={onRevertToDefaults}
              className="flex items-center gap-2 px-3 py-1 bg-orange-700 hover:bg-orange-600 text-white text-sm rounded border border-orange-600 transition-colors"
              title="Revert to default settings from Feature Settings"
            >
              <RotateCcw className="w-4 h-4" />
              Revert to Defaults
            </button>
          </>
        )}

        {/* Save as Default Button */}
        {onSaveAsDefault && (
          <>
            <div className="h-6 w-px bg-gray-600" />
            <button
              onClick={onSaveAsDefault}
              className="flex items-center gap-2 px-3 py-1 bg-green-700 hover:bg-green-600 text-white text-sm rounded border border-green-600 transition-colors"
              title="Save current formatting as default for all future slides"
            >
              <Save className="w-4 h-4" />
              Save as Default
            </button>
          </>
        )}

        {/* Shape Info (helpful for debugging) */}
        <div className="ml-auto text-xs text-gray-500">
          {selectedShape.overflowBehavior === 'shrink-to-fit' && (
            <span title="This text will auto-shrink if it overflows">
              Auto-fit: {fontSize}px (max)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypographyToolbar;
