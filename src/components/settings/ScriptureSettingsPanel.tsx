import React from 'react';
import { BookOpen, RotateCcw } from 'lucide-react';
import { BackgroundToolbar, SlideBackground } from '../formatting/BackgroundToolbar';
import { ScriptureSettings } from '../../lib/featureSettingsSlice';

interface ScriptureSettingsPanelProps {
  settings: ScriptureSettings;
  onUpdate: (settings: Partial<ScriptureSettings>) => void;
  onReset: () => void;
}

/**
 * ScriptureSettingsPanel - Configure default settings for scripture slides
 *
 * Provides UI for:
 * - Background (color, gradient, image)
 * - Typography (verse, reference, translation fonts)
 * - Text styling (color, alignment, weight)
 *
 * Changes are auto-saved and apply to all future scripture slides.
 */
export const ScriptureSettingsPanel: React.FC<ScriptureSettingsPanelProps> = ({
  settings,
  onUpdate,
  onReset
}) => {
  const handleBackgroundChange = (background: SlideBackground) => {
    onUpdate({ background });
  };

  const handleTypographyChange = (key: keyof ScriptureSettings['typography'], value: any) => {
    onUpdate({
      typography: {
        ...settings.typography,
        [key]: value
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-900 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Scripture Settings</h3>
            <p className="text-sm text-gray-400">Configure default appearance for scripture slides</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-600 transition-colors"
          title="Reset to defaults"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Background Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Background</h4>
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <BackgroundToolbar
            currentBackground={settings.background}
            onBackgroundChange={handleBackgroundChange}
          />
        </div>
      </div>

      {/* Typography Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Typography</h4>

        {/* Verse Font Size */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Verse Font Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={24}
                max={120}
                value={settings.typography.verseFontSize}
                onChange={(e) => handleTypographyChange('verseFontSize', parseInt(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <input
                type="number"
                value={settings.typography.verseFontSize}
                onChange={(e) => handleTypographyChange('verseFontSize', parseInt(e.target.value))}
                className="w-16 bg-gray-800 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Reference Font Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={16}
                max={72}
                value={settings.typography.referenceFontSize}
                onChange={(e) => handleTypographyChange('referenceFontSize', parseInt(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <input
                type="number"
                value={settings.typography.referenceFontSize}
                onChange={(e) => handleTypographyChange('referenceFontSize', parseInt(e.target.value))}
                className="w-16 bg-gray-800 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Translation Font Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={14}
                max={48}
                value={settings.typography.translationFontSize}
                onChange={(e) => handleTypographyChange('translationFontSize', parseInt(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <input
                type="number"
                value={settings.typography.translationFontSize}
                onChange={(e) => handleTypographyChange('translationFontSize', parseInt(e.target.value))}
                className="w-16 bg-gray-800 text-white text-sm border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Font Family & Color */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Font Family</label>
            <select
              value={settings.typography.fontFamily}
              onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
              <option value="Impact">Impact</option>
              <option value="Courier New">Courier New</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
              <option value="Palatino Linotype">Palatino Linotype</option>
              <option value="Lucida Console">Lucida Console</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.typography.textColor}
                onChange={(e) => handleTypographyChange('textColor', e.target.value)}
                className="w-12 h-10 bg-gray-800 border border-gray-600 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.typography.textColor.toUpperCase()}
                onChange={(e) => handleTypographyChange('textColor', e.target.value)}
                className="flex-1 bg-gray-800 text-white text-sm border border-gray-600 rounded px-3 py-2 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Text Alignment */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Text Alignment</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTypographyChange('textAlign', 'left')}
              className={`px-4 py-2 rounded border transition-colors ${
                settings.typography.textAlign === 'left'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Left
            </button>
            <button
              onClick={() => handleTypographyChange('textAlign', 'center')}
              className={`px-4 py-2 rounded border transition-colors ${
                settings.typography.textAlign === 'center'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Center
            </button>
            <button
              onClick={() => handleTypographyChange('textAlign', 'right')}
              className={`px-4 py-2 rounded border transition-colors ${
                settings.typography.textAlign === 'right'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Right
            </button>
          </div>
        </div>

        {/* Reference Position */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Scripture Reference Position</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleTypographyChange('referencePosition', 'top-left')}
              className={`px-3 py-2 text-xs rounded border transition-colors ${
                settings.typography.referencePosition === 'top-left'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Top Left
            </button>
            <button
              onClick={() => handleTypographyChange('referencePosition', 'top-center')}
              className={`px-3 py-2 text-xs rounded border transition-colors ${
                settings.typography.referencePosition === 'top-center'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Top Center
            </button>
            <button
              onClick={() => handleTypographyChange('referencePosition', 'top-right')}
              className={`px-3 py-2 text-xs rounded border transition-colors ${
                settings.typography.referencePosition === 'top-right'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Top Right
            </button>
            <button
              onClick={() => handleTypographyChange('referencePosition', 'bottom-left')}
              className={`px-3 py-2 text-xs rounded border transition-colors ${
                settings.typography.referencePosition === 'bottom-left'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Bottom Left
            </button>
            <button
              onClick={() => handleTypographyChange('referencePosition', 'bottom-center')}
              className={`px-3 py-2 text-xs rounded border transition-colors ${
                settings.typography.referencePosition === 'bottom-center'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Bottom Center
            </button>
            <button
              onClick={() => handleTypographyChange('referencePosition', 'bottom-right')}
              className={`px-3 py-2 text-xs rounded border transition-colors ${
                settings.typography.referencePosition === 'bottom-right'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Bottom Right
            </button>
          </div>
        </div>

        {/* Reference Text Alignment */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Reference Text Alignment</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTypographyChange('referenceAlign', 'left')}
              className={`px-4 py-2 rounded border transition-colors ${
                settings.typography.referenceAlign === 'left'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Left
            </button>
            <button
              onClick={() => handleTypographyChange('referenceAlign', 'center')}
              className={`px-4 py-2 rounded border transition-colors ${
                settings.typography.referenceAlign === 'center'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Center
            </button>
            <button
              onClick={() => handleTypographyChange('referenceAlign', 'right')}
              className={`px-4 py-2 rounded border transition-colors ${
                settings.typography.referenceAlign === 'right'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Right
            </button>
          </div>
        </div>

        {/* Text Style & Line Height */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Text Style</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTypographyChange('bold', !settings.typography.bold)}
                className={`px-4 py-2 font-bold rounded border transition-colors ${
                  settings.typography.bold
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                B
              </button>
              <button
                onClick={() => handleTypographyChange('italic', !settings.typography.italic)}
                className={`px-4 py-2 italic rounded border transition-colors ${
                  settings.typography.italic
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                I
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Line Height</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.8}
                max={3}
                step={0.1}
                value={settings.typography.lineHeight}
                onChange={(e) => handleTypographyChange('lineHeight', parseFloat(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <span className="w-12 text-white text-sm">{settings.typography.lineHeight.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Note */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> These settings will apply to all new scripture slides.
          You can still override individual slides using the formatting toolbar.
        </p>
      </div>
    </div>
  );
};

export default ScriptureSettingsPanel;
