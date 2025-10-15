import React, { useState, useEffect } from 'react';
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
  Square
} from 'lucide-react';
import { TextShape } from '../../rendering/shapes/TextShape';
import { TextStyle } from '../../rendering/types/shapes';

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
   * Optional CSS class
   */
  className?: string;
}

/**
 * TypographyToolbar - PowerPoint-style formatting toolbar for text shapes
 *
 * Features:
 * - Font family dropdown (10 common presentation fonts)
 * - Font size controls (slider + numeric input + +/- buttons)
 * - Text style toggles (Bold, Italic, Underline)
 * - Text alignment buttons (Left, Center, Right)
 * - Color picker with hex display
 * - Live preview of changes
 *
 * Architecture:
 * - Only visible when a text shape is selected
 * - Changes apply immediately to selected shape
 * - Works with auto-shrink: user-set size becomes maxFontSize
 * - Updates propagate through slide → preview → live display
 */
export const TypographyToolbar: React.FC<TypographyToolbarProps> = ({
  selectedShape,
  onFormatChange,
  onSaveAsDefault,
  className = ''
}) => {
  // Local state for form controls (synced with selected shape)
  const [fontSize, setFontSize] = useState(64);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [textColor, setTextColor] = useState('#ffffff');
  const [lineHeight, setLineHeight] = useState(1.5);
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [hasBackground, setHasBackground] = useState(false);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1.0);

  // Sync local state with selected shape
  useEffect(() => {
    if (!selectedShape) return;

    const style = selectedShape.textStyle;
    if (!style) return;

    console.log('📊 TypographyToolbar syncing from shape:', {
      shapeId: selectedShape.id,
      fontSize: style.fontSize,
      color: style.color,
      fullStyle: { ...style }
    });

    setFontSize(style.fontSize || 64);
    setFontFamily(style.fontFamily || 'Arial');
    setIsBold(style.fontWeight === 'bold');
    setIsItalic(style.fontStyle === 'italic');
    setIsUnderline(style.textDecoration === 'underline');
    setTextAlign((style.textAlign as 'left' | 'center' | 'right') || 'center');
    setLineHeight(style.lineHeight || 1.5);

    // Convert Color object to hex string
    if (style.color) {
      if (typeof style.color === 'string') {
        setTextColor(style.color);
      } else {
        const hex = `#${style.color.r.toString(16).padStart(2, '0')}${style.color.g.toString(16).padStart(2, '0')}${style.color.b.toString(16).padStart(2, '0')}`;
        setTextColor(hex);
      }
    }

    // Sync background color and opacity
    const fill = style.fill || selectedShape.style?.fill;
    if (fill && typeof fill === 'object' && 'r' in fill) {
      const bgColor = fill as any;
      const bgHex = `#${bgColor.r.toString(16).padStart(2, '0')}${bgColor.g.toString(16).padStart(2, '0')}${bgColor.b.toString(16).padStart(2, '0')}`;
      setBackgroundColor(bgHex);
      setHasBackground(true);
      setBackgroundOpacity(style.opacity !== undefined ? style.opacity : 1.0);
    } else {
      setHasBackground(false);
      setBackgroundOpacity(1.0);
    }
  }, [selectedShape]);

  // If no shape selected, don't render toolbar
  if (!selectedShape) {
    return null;
  }

  // Convert hex color to Color object
  const hexToColor = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 1.0
    } : { r: 255, g: 255, b: 255, a: 1.0 };
  };

  // Apply formatting change
  const applyFormat = (updates: Partial<TextStyle>) => {
    if (!selectedShape) return;

    // CRITICAL: Remove undefined values to prevent overwriting existing properties
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    ) as Partial<TextStyle>;

    console.log('🎨 TypographyToolbar applying format:', {
      original: updates,
      cleaned: cleanedUpdates
    });

    // Pass only the updates - SlideEditorWithToolbar will merge with existing style
    onFormatChange(selectedShape.id, cleanedUpdates);
  };

  // Font size handlers
  const handleFontSizeChange = (newSize: number) => {
    const clampedSize = Math.max(8, Math.min(200, newSize));
    setFontSize(clampedSize);

    // Note: maxFontSize is handled separately in SlideEditorWithToolbar
    // since it's a property of TextShape, not TextStyle
    applyFormat({
      fontSize: clampedSize
    });
  };

  const incrementFontSize = () => handleFontSizeChange(fontSize + 2);
  const decrementFontSize = () => handleFontSizeChange(fontSize - 2);

  // Font family handler
  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    applyFormat({ fontFamily: family });
  };

  // Style toggle handlers
  const toggleBold = () => {
    const newBold = !isBold;
    setIsBold(newBold);
    applyFormat({ fontWeight: newBold ? 'bold' : 'normal' });
  };

  const toggleItalic = () => {
    const newItalic = !isItalic;
    setIsItalic(newItalic);
    applyFormat({ fontStyle: newItalic ? 'italic' : 'normal' });
  };

  const toggleUnderline = () => {
    const newUnderline = !isUnderline;
    setIsUnderline(newUnderline);
    applyFormat({ textDecoration: newUnderline ? 'underline' : 'none' });
  };

  // Alignment handler
  const handleAlignmentChange = (align: 'left' | 'center' | 'right') => {
    setTextAlign(align);
    applyFormat({ textAlign: align });
  };

  // Color handler
  const handleColorChange = (hex: string) => {
    setTextColor(hex);
    // Pass hex string directly - rendering system handles conversion
    applyFormat({ color: hex as any });
  };

  // Line height handler
  const handleLineHeightChange = (height: number) => {
    const clampedHeight = Math.max(0.8, Math.min(3.0, height));
    setLineHeight(clampedHeight);
    applyFormat({ lineHeight: clampedHeight });
  };

  // Background color toggle
  const toggleBackground = () => {
    const newHasBackground = !hasBackground;
    setHasBackground(newHasBackground);

    if (newHasBackground) {
      // Enable background with current color
      const bgColor = hexToColor(backgroundColor);
      applyFormat({
        fill: bgColor,
        opacity: backgroundOpacity
      });
    } else {
      // Disable background
      applyFormat({
        fill: undefined as any,
        opacity: undefined as any
      });
    }
  };

  // Background color handler
  const handleBackgroundColorChange = (hex: string) => {
    setBackgroundColor(hex);
    if (hasBackground) {
      const bgColor = hexToColor(hex);
      applyFormat({ fill: bgColor });
    }
  };

  // Background opacity handler
  const handleBackgroundOpacityChange = (opacity: number) => {
    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    setBackgroundOpacity(clampedOpacity);
    if (hasBackground) {
      applyFormat({ opacity: clampedOpacity });
    }
  };

  // Common presentation fonts
  const fonts = [
    'Arial',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Trebuchet MS',
    'Courier New',
    'Impact',
    'Comic Sans MS',
    'Calibri',
    'Helvetica'
  ];

  // Get the element type from metadata for display
  const elementType = selectedShape?.metadata?.elementType || 'text';
  const elementLabel = elementType === 'verse' ? 'Verse' :
                      elementType === 'reference' ? 'Reference' :
                      elementType === 'translation' ? 'Translation' : 'Text';

  return (
    <div className={`bg-gray-900/95 border-b border-gray-700 px-4 py-2 ${className}`}>
      <div className="flex items-center gap-4 flex-wrap">
        {/* Element Type Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/50 border border-blue-600 rounded">
          <span className="text-xs font-semibold text-blue-300">Editing:</span>
          <span className="text-sm font-bold text-white">{elementLabel}</span>
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
            {fonts.map(font => (
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
