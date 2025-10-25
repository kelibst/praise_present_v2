import React from 'react';
import { ScriptureSlideSettings, ScriptureTheme } from '../../../rendering/content/ScriptureContent';

interface ScriptureSettingsPanelProps {
  settings: ScriptureSlideSettings;
  onSettingsChange: (settings: Partial<ScriptureSlideSettings>) => void;
}

export const ScriptureSettingsPanel: React.FC<ScriptureSettingsPanelProps> = ({
  settings,
  onSettingsChange
}) => {
  const updateTypography = (updates: Partial<ScriptureSlideSettings['typography']>) => {
    onSettingsChange({
      typography: {
        ...settings.typography,
        ...updates
      }
    });
  };

  const fontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Tahoma',
    'Trebuchet MS',
    'Courier New'
  ];

  const themes: Array<{ value: ScriptureTheme; label: string }> = [
    { value: 'reading', label: 'Reading' },
    { value: 'meditation', label: 'Meditation' },
    { value: 'memory', label: 'Memory Verse' },
    { value: 'announcement', label: 'Announcement' }
  ];

  return (
    <div className="space-y-6 p-4 overflow-y-auto h-full">
      <h3 className="text-lg font-semibold">Settings</h3>

      {/* Display Options */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Display</h4>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.showTranslation}
            onChange={(e) => onSettingsChange({ showTranslation: e.target.checked })}
            className="w-4 h-4 rounded bg-gray-800 border-gray-700"
          />
          <span className="text-sm">Show translation</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.emphasizeReference}
            onChange={(e) => onSettingsChange({ emphasizeReference: e.target.checked })}
            className="w-4 h-4 rounded bg-gray-800 border-gray-700"
          />
          <span className="text-sm">Emphasize reference</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.showVerseNumbers}
            onChange={(e) => onSettingsChange({ showVerseNumbers: e.target.checked })}
            className="w-4 h-4 rounded bg-gray-800 border-gray-700"
          />
          <span className="text-sm">Show verse numbers</span>
        </label>
      </div>

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
        <select
          value={settings.theme}
          onChange={(e) => onSettingsChange({ theme: e.target.value as ScriptureTheme })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
        >
          {themes.map(theme => (
            <option key={theme.value} value={theme.value}>{theme.label}</option>
          ))}
        </select>
      </div>

      {/* Max Verses Per Slide */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Max verses per slide: {settings.maxVersesPerSlide}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={settings.maxVersesPerSlide}
          onChange={(e) => onSettingsChange({ maxVersesPerSlide: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1</span>
          <span>10</span>
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Typography</h4>

        {/* Verse Font Size */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Verse Font Size: {settings.typography.verseFontSize}px
          </label>
          <input
            type="range"
            min="24"
            max="120"
            step="2"
            value={settings.typography.verseFontSize}
            onChange={(e) => updateTypography({ verseFontSize: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Reference Font Size */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Reference Font Size: {settings.typography.referenceFontSize}px
          </label>
          <input
            type="range"
            min="20"
            max="80"
            step="2"
            value={settings.typography.referenceFontSize}
            onChange={(e) => updateTypography({ referenceFontSize: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Translation Font Size */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Translation Font Size: {settings.typography.translationFontSize}px
          </label>
          <input
            type="range"
            min="16"
            max="60"
            step="2"
            value={settings.typography.translationFontSize}
            onChange={(e) => updateTypography({ translationFontSize: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Font Family</label>
          <select
            value={settings.typography.fontFamily}
            onChange={(e) => updateTypography({ fontFamily: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:border-blue-500 focus:outline-none"
          >
            {fontFamilies.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        {/* Text Align */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Text Alignment</label>
          <div className="grid grid-cols-3 gap-2">
            {(['left', 'center', 'right'] as const).map(align => (
              <button
                key={align}
                onClick={() => updateTypography({ textAlign: align })}
                className={`
                  px-3 py-1.5 rounded text-xs font-medium transition-colors
                  ${settings.typography.textAlign === align
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }
                `}
              >
                {align.charAt(0).toUpperCase() + align.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bold / Italic */}
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.typography.bold}
              onChange={(e) => updateTypography({ bold: e.target.checked })}
              className="w-4 h-4 rounded bg-gray-800 border-gray-700"
            />
            <span className="text-sm font-bold">Bold</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.typography.italic}
              onChange={(e) => updateTypography({ italic: e.target.checked })}
              className="w-4 h-4 rounded bg-gray-800 border-gray-700"
            />
            <span className="text-sm italic">Italic</span>
          </label>
        </div>

        {/* Line Height */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Line Height: {settings.typography.lineHeight.toFixed(1)}
          </label>
          <input
            type="range"
            min="1.0"
            max="2.5"
            step="0.1"
            value={settings.typography.lineHeight}
            onChange={(e) => updateTypography({ lineHeight: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Colors */}
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Verse Color</label>
            <input
              type="color"
              value={settings.typography.verseColor}
              onChange={(e) => updateTypography({ verseColor: e.target.value })}
              className="w-full h-10 rounded bg-gray-800 border border-gray-700 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Reference Color</label>
            <input
              type="color"
              value={settings.typography.referenceColor}
              onChange={(e) => updateTypography({ referenceColor: e.target.value })}
              className="w-full h-10 rounded bg-gray-800 border border-gray-700 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Translation Color</label>
            <input
              type="color"
              value={settings.typography.translationColor}
              onChange={(e) => updateTypography({ translationColor: e.target.value })}
              className="w-full h-10 rounded bg-gray-800 border border-gray-700 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Background */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Background</h4>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Background Color</label>
          <input
            type="color"
            value={
              settings.background.type === 'color' && settings.background.color
                ? `#${settings.background.color.r.toString(16).padStart(2, '0')}${settings.background.color.g.toString(16).padStart(2, '0')}${settings.background.color.b.toString(16).padStart(2, '0')}`
                : '#1a1a2e'
            }
            onChange={(e) => {
              const hex = e.target.value;
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              onSettingsChange({
                background: {
                  type: 'color',
                  color: { r, g, b, a: 1 }
                }
              });
            }}
            className="w-full h-10 rounded bg-gray-800 border border-gray-700 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
