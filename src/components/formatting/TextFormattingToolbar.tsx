import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { TextShape } from '../../rendering/shapes/TextShape';
import { Color } from '../../rendering/types/geometry';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  Minus,
  Plus
} from 'lucide-react';

interface TextFormattingToolbarProps {
  /**
   * Currently selected text shape (null if no selection)
   */
  selectedShape: TextShape | null;

  /**
   * Callback when formatting changes are applied
   */
  onFormatChange: (shape: TextShape) => void;

  /**
   * Whether the toolbar is visible
   */
  visible?: boolean;

  /**
   * Optional CSS class
   */
  className?: string;
}

/**
 * TextFormattingToolbar - PowerPoint-style formatting controls
 *
 * Features:
 * - Font size slider with +/- buttons
 * - Font family dropdown
 * - Bold, Italic, Underline toggles
 * - Text alignment (left, center, right)
 * - Text color picker
 * - Live preview updates
 */
export const TextFormattingToolbar: React.FC<TextFormattingToolbarProps> = ({
  selectedShape,
  onFormatChange,
  visible = true,
  className = ''
}) => {
  // Local state for formatting controls
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontFamily, setFontFamily] = useState<string>('Arial, sans-serif');
  const [bold, setBold] = useState<boolean>(false);
  const [italic, setItalic] = useState<boolean>(false);
  const [underline, setUnderline] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');

  // Sync local state with selected shape
  useEffect(() => {
    if (selectedShape) {
      setFontSize(selectedShape.textStyle.fontSize || 16);
      setFontFamily(selectedShape.textStyle.fontFamily || 'Arial, sans-serif');
      setBold(selectedShape.textStyle.fontWeight === 'bold');
      setItalic(selectedShape.textStyle.fontStyle === 'italic');
      setUnderline(selectedShape.textStyle.textDecoration === 'underline');
      setTextAlign(selectedShape.textStyle.textAlign || 'left');

      // Convert Color to hex string
      const color = selectedShape.textStyle.color;
      if (color) {
        const hex = `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;
        setTextColor(hex.toUpperCase());
      }
    }
  }, [selectedShape]);

  // Apply formatting change to shape
  const applyFormat = (updates: Partial<typeof selectedShape.textStyle>) => {
    if (!selectedShape) return;

    selectedShape.setTextStyle(updates);
    onFormatChange(selectedShape);
  };

  // Handle font size change
  const handleFontSizeChange = (newSize: number) => {
    const clampedSize = Math.max(8, Math.min(200, newSize));
    setFontSize(clampedSize);
    applyFormat({ fontSize: clampedSize });
  };

  // Handle font family change
  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    applyFormat({ fontFamily: family });
  };

  // Handle bold toggle
  const handleBoldToggle = () => {
    const newBold = !bold;
    setBold(newBold);
    applyFormat({ fontWeight: newBold ? 'bold' : 'normal' });
  };

  // Handle italic toggle
  const handleItalicToggle = () => {
    const newItalic = !italic;
    setItalic(newItalic);
    applyFormat({ fontStyle: newItalic ? 'italic' : 'normal' });
  };

  // Handle underline toggle
  const handleUnderlineToggle = () => {
    const newUnderline = !underline;
    setUnderline(newUnderline);
    applyFormat({ textDecoration: newUnderline ? 'underline' : 'none' });
  };

  // Handle text alignment change
  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    setTextAlign(alignment);
    applyFormat({ textAlign: alignment });
  };

  // Handle text color change
  const handleColorChange = (hexColor: string) => {
    setTextColor(hexColor);

    // Convert hex to Color object
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const color: Color = { r, g, b, a: 1 };
    applyFormat({ color });
  };

  if (!visible || !selectedShape) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-3 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-lg ${className}`}>
      {/* Toolbar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-200">Text Formatting</span>
        </div>
        <span className="text-xs text-slate-500">
          {selectedShape.text?.substring(0, 20)}...
        </span>
      </div>

      {/* Font Controls Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Font Family Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Font</label>
          <select
            value={fontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-700 text-slate-200 border border-slate-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="'Courier New', monospace">Courier New</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Verdana, sans-serif">Verdana</option>
            <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
            <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
            <option value="Impact, fantasy">Impact</option>
            <option value="'Palatino Linotype', serif">Palatino</option>
            <option value="'Lucida Console', monospace">Lucida Console</option>
          </select>
        </div>

        {/* Font Size Controls */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Size</label>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-slate-700 border-slate-600 hover:bg-slate-600"
              onClick={() => handleFontSizeChange(fontSize - 2)}
              disabled={fontSize <= 8}
            >
              <Minus className="w-3 h-3" />
            </Button>

            <input
              type="number"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value) || 16)}
              className="w-16 px-2 py-1.5 bg-slate-700 text-slate-200 border border-slate-600 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={8}
              max={200}
            />

            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-slate-700 border-slate-600 hover:bg-slate-600"
              onClick={() => handleFontSizeChange(fontSize + 2)}
              disabled={fontSize >= 200}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Font Size Slider */}
        <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
          <label className="text-xs text-slate-400">Adjust Size</label>
          <input
            type="range"
            min={8}
            max={200}
            value={fontSize}
            onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((fontSize - 8) / (200 - 8)) * 100}%, #334155 ${((fontSize - 8) / (200 - 8)) * 100}%, #334155 100%)`
            }}
          />
        </div>
      </div>

      {/* Style Toggles Row */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Style</label>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant={bold ? 'default' : 'outline'}
              className={`h-9 w-9 ${bold ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
              onClick={handleBoldToggle}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              variant={italic ? 'default' : 'outline'}
              className={`h-9 w-9 ${italic ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
              onClick={handleItalicToggle}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              variant={underline ? 'default' : 'outline'}
              className={`h-9 w-9 ${underline ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
              onClick={handleUnderlineToggle}
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Text Alignment */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Alignment</label>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant={textAlign === 'left' ? 'default' : 'outline'}
              className={`h-9 w-9 ${textAlign === 'left' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
              onClick={() => handleAlignmentChange('left')}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              variant={textAlign === 'center' ? 'default' : 'outline'}
              className={`h-9 w-9 ${textAlign === 'center' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
              onClick={() => handleAlignmentChange('center')}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>

            <Button
              size="icon"
              variant={textAlign === 'right' ? 'default' : 'outline'}
              className={`h-9 w-9 ${textAlign === 'right' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
              onClick={() => handleAlignmentChange('right')}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Text Color Picker */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Color</label>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="color"
                value={textColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-9 h-9 rounded cursor-pointer border-2 border-slate-600"
                title="Text Color"
              />
              <Palette className="w-3 h-3 absolute bottom-0 right-0 text-slate-400 pointer-events-none" />
            </div>
            <span className="text-xs text-slate-400 font-mono">{textColor}</span>
          </div>
        </div>
      </div>

      {/* Info Row */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700">
        <span className="text-xs text-slate-500">
          Applied Font Size: <span className="font-semibold text-slate-400">{selectedShape.appliedFontSize || fontSize}px</span>
          {selectedShape.overflowBehavior === 'shrink-to-fit' && selectedShape.appliedFontSize !== fontSize && (
            <span className="ml-2 text-amber-400">(auto-shrunk)</span>
          )}
        </span>
        <span className="text-xs text-slate-500">
          Overflow: <span className="font-semibold text-slate-400">{selectedShape.overflowBehavior}</span>
        </span>
      </div>
    </div>
  );
};

export default TextFormattingToolbar;
