import React from 'react';
import { Settings, Eye, Type } from 'lucide-react';
import { BackgroundToolbar, SlideBackground } from '../formatting/BackgroundToolbar';
import { SongSlideSettings as SongSettings } from '../../lib/presentation/songSlideGenerator';

interface SongSlideSettingsProps {
  settings: SongSettings;
  onChange: (settings: SongSettings) => void;
  className?: string;
}

export const SongSlideSettingsPanel: React.FC<SongSlideSettingsProps> = ({
  settings,
  onChange,
  className = ''
}) => {
  const handleBackgroundChange = (background: SlideBackground) => {
    onChange({ ...settings, background });
  };

  const handleTypographyChange = (field: string, value: any) => {
    onChange({
      ...settings,
      typography: {
        ...settings.typography,
        [field]: value
      }
    });
  };

  const handleToggle = (field: keyof SongSettings, value: boolean) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <div className={`bg-card rounded-lg border border-border p-4 space-y-6 ${className}`}>
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Settings className="w-4 h-4 text-yellow-400" />
        Slide Settings
      </h3>

      {/* Background Settings */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Background
        </h4>
        <BackgroundToolbar
          currentBackground={settings.background || { type: 'color', value: '#1a1a1a' }}
          onBackgroundChange={handleBackgroundChange}
        />
      </div>

      {/* Typography Settings */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-1">
          <Type className="w-3 h-3" />
          Typography
        </h4>

        <div className="space-y-3">
          {/* Font Size */}
          <div>
            <label className="block text-xs font-medium mb-2 text-muted-foreground">
              Font Size
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="28"
                max="96"
                step="2"
                value={settings.typography?.fontSize || 56}
                onChange={(e) => handleTypographyChange('fontSize', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12 text-right text-foreground">
                {settings.typography?.fontSize || 56}px
              </span>
            </div>
          </div>

          {/* Text Alignment */}
          <div>
            <label className="block text-xs font-medium mb-2 text-muted-foreground">
              Text Alignment
            </label>
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => handleTypographyChange('textAlign', align)}
                  className={`flex-1 px-3 py-2 rounded text-sm capitalize transition-colors ${
                    (settings.typography?.textAlign || 'center') === align
                      ? 'bg-blue-600 text-white'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="block text-xs font-medium mb-2 text-muted-foreground">
              Text Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.typography?.textColor || '#ffffff'}
                onChange={(e) => handleTypographyChange('textColor', e.target.value)}
                className="w-12 h-10 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={settings.typography?.textColor || '#ffffff'}
                onChange={(e) => handleTypographyChange('textColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded bg-input text-foreground text-sm font-mono"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-xs font-medium mb-2 text-muted-foreground">
              Font Family
            </label>
            <select
              value={settings.typography?.fontFamily || 'Arial, sans-serif'}
              onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded bg-input text-foreground text-sm"
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value="Helvetica, sans-serif">Helvetica</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Verdana, sans-serif">Verdana</option>
              <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
            </select>
          </div>

          {/* Line Spacing */}
          <div>
            <label className="block text-xs font-medium mb-2 text-muted-foreground">
              Line Spacing
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.1"
                value={settings.typography?.lineSpacing || 1.4}
                onChange={(e) => handleTypographyChange('lineSpacing', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12 text-right text-foreground">
                {(settings.typography?.lineSpacing || 1.4).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Display Options */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Display Options</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showSectionLabels ?? true}
              onChange={(e) => handleToggle('showSectionLabels', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-foreground">Show section labels (Verse 1, Chorus, etc.)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showChords ?? false}
              onChange={(e) => handleToggle('showChords', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-foreground">Show chords</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showCopyright ?? true}
              onChange={(e) => handleToggle('showCopyright', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-foreground">Show copyright slide</span>
          </label>
        </div>
      </div>

      {/* Advanced Options */}
      <div>
        <h4 className="text-sm font-medium mb-3 text-muted-foreground">Advanced</h4>
        <div>
          <label className="block text-xs font-medium mb-2 text-muted-foreground">
            Max Lines Per Slide
          </label>
          <input
            type="number"
            min="4"
            max="12"
            value={settings.maxLinesPerSlide || 8}
            onChange={(e) => onChange({ ...settings, maxLinesPerSlide: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-border rounded bg-input text-foreground text-sm"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Longer sections will be split across multiple slides
          </div>
        </div>
      </div>
    </div>
  );
};
