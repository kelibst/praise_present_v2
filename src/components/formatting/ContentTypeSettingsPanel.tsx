import React from 'react';
import { Settings, Eye, Type, RotateCcw, Music, BookOpen, Megaphone } from 'lucide-react';
import { BackgroundToolbar, SlideBackground } from './BackgroundToolbar';
import { ContentType } from '../../hooks/useContentEditor';
import { ScriptureSettings } from '../../lib/featureSettingsSlice';
import { SongSettings } from '../../lib/featureSettingsSlice';
import { AnnouncementSettings } from '../../lib/featureSettingsSlice';

type ContentSettings = ScriptureSettings | SongSettings | AnnouncementSettings;

interface ContentTypeSettingsPanelProps {
  /**
   * Type of content (determines which settings to show)
   */
  contentType: ContentType;

  /**
   * Current settings for this content type
   */
  settings: ContentSettings;

  /**
   * Callback when settings change
   */
  onChange: (settings: Partial<ContentSettings>) => void;

  /**
   * Callback to reset to defaults
   */
  onReset?: () => void;

  /**
   * Optional CSS class
   */
  className?: string;
}

/**
 * ContentTypeSettingsPanel - Unified settings panel for all content types
 *
 * This component consolidates SongSlideSettings and SongSettingsPanel into a single
 * flexible component that adapts its UI based on content type.
 *
 * Features:
 * - Dynamic UI based on content type (scripture/song/announcement)
 * - Background editing (color, gradient, image, video)
 * - Typography editing (font size, family, alignment, color, etc.)
 * - Display options specific to each content type
 * - Reset to defaults button
 *
 * Usage:
 * ```typescript
 * <ContentTypeSettingsPanel
 *   contentType="song"
 *   settings={songSettings}
 *   onChange={(updates) => dispatch(updateSongSettings(updates))}
 *   onReset={() => dispatch(resetSongSettings())}
 * />
 * ```
 */
export const ContentTypeSettingsPanel: React.FC<ContentTypeSettingsPanelProps> = ({
  contentType,
  settings,
  onChange,
  onReset,
  className = ''
}) => {
  const handleBackgroundChange = (background: SlideBackground) => {
    onChange({ background } as Partial<ContentSettings>);
  };

  const handleTypographyChange = (field: string, value: any) => {
    onChange({
      typography: {
        ...settings.typography,
        [field]: value
      }
    } as Partial<ContentSettings>);
  };

  const handleToggle = (field: string, value: boolean) => {
    onChange({ [field]: value } as Partial<ContentSettings>);
  };

  // Get content type specific metadata
  const getContentMeta = () => {
    switch (contentType) {
      case 'scripture':
        return {
          icon: BookOpen,
          title: 'Scripture Settings',
          color: 'purple'
        };
      case 'song':
        return {
          icon: Music,
          title: 'Song Settings',
          color: 'blue'
        };
      case 'announcement':
        return {
          icon: Megaphone,
          title: 'Announcement Settings',
          color: 'yellow'
        };
    }
  };

  const meta = getContentMeta();
  const Icon = meta.icon;

  return (
    <div className={`bg-card rounded-lg border border-border p-4 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Icon className={`w-5 h-5 text-${meta.color}-400`} />
          {meta.title}
        </h3>
        {onReset && (
          <button
            onClick={onReset}
            className="px-3 py-1.5 bg-secondary hover:bg-secondary/70 text-foreground rounded text-sm flex items-center gap-1.5 transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

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
          {/* Content-type specific font size controls */}
          {contentType === 'scripture' && (
            <>
              {/* Verse Font Size */}
              <div>
                <label className="block text-xs font-medium mb-2 text-muted-foreground">
                  Verse Font Size
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="28"
                    max="96"
                    step="2"
                    value={(settings.typography as any).verseFontSize || 64}
                    onChange={(e) => handleTypographyChange('verseFontSize', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right text-foreground">
                    {(settings.typography as any).verseFontSize || 64}px
                  </span>
                </div>
              </div>

              {/* Reference Font Size */}
              <div>
                <label className="block text-xs font-medium mb-2 text-muted-foreground">
                  Reference Font Size
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="20"
                    max="72"
                    step="2"
                    value={(settings.typography as any).referenceFontSize || 36}
                    onChange={(e) => handleTypographyChange('referenceFontSize', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right text-foreground">
                    {(settings.typography as any).referenceFontSize || 36}px
                  </span>
                </div>
              </div>

              {/* Translation Font Size */}
              <div>
                <label className="block text-xs font-medium mb-2 text-muted-foreground">
                  Translation Font Size
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="16"
                    max="64"
                    step="2"
                    value={(settings.typography as any).translationFontSize || 28}
                    onChange={(e) => handleTypographyChange('translationFontSize', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right text-foreground">
                    {(settings.typography as any).translationFontSize || 28}px
                  </span>
                </div>
              </div>
            </>
          )}

          {contentType === 'song' && (
            <>
              {/* Title Font Size */}
              <div>
                <label className="block text-xs font-medium mb-2 text-muted-foreground">
                  Title Font Size
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="32"
                    max="120"
                    step="2"
                    value={(settings.typography as any).titleFontSize || 72}
                    onChange={(e) => handleTypographyChange('titleFontSize', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right text-foreground">
                    {(settings.typography as any).titleFontSize || 72}px
                  </span>
                </div>
              </div>

              {/* Lyrics Font Size */}
              <div>
                <label className="block text-xs font-medium mb-2 text-muted-foreground">
                  Lyrics Font Size
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="24"
                    max="96"
                    step="2"
                    value={(settings.typography as any).lyricsFontSize || 56}
                    onChange={(e) => handleTypographyChange('lyricsFontSize', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right text-foreground">
                    {(settings.typography as any).lyricsFontSize || 56}px
                  </span>
                </div>
              </div>
            </>
          )}

          {contentType === 'announcement' && (
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
                  value={(settings.typography as any).fontSize || 64}
                  onChange={(e) => handleTypographyChange('fontSize', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-mono w-12 text-right text-foreground">
                  {(settings.typography as any).fontSize || 64}px
                </span>
              </div>
            </div>
          )}

          {/* Text Alignment (Common to all) */}
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

          {/* Text Color (Common to all) */}
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

          {/* Font Family (Common to all) */}
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

          {/* Line Spacing (Common to all) */}
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
                value={settings.typography?.lineHeight || 1.5}
                onChange={(e) => handleTypographyChange('lineHeight', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12 text-right text-foreground">
                {(settings.typography?.lineHeight || 1.5).toFixed(1)}
              </span>
            </div>
          </div>

          {/* Text Style (Common to all) */}
          <div>
            <label className="block text-xs font-medium mb-2 text-muted-foreground">
              Text Style
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTypographyChange('bold', !settings.typography?.bold)}
                className={`px-4 py-2 font-bold rounded border transition-colors ${
                  settings.typography?.bold
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-secondary border-border text-foreground hover:bg-secondary/70'
                }`}
              >
                B
              </button>
              <button
                onClick={() => handleTypographyChange('italic', !settings.typography?.italic)}
                className={`px-4 py-2 italic rounded border transition-colors ${
                  settings.typography?.italic
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-secondary border-border text-foreground hover:bg-secondary/70'
                }`}
              >
                I
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content-type specific display options */}
      {contentType === 'song' && (
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Display Options</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(settings as any).showSectionLabels ?? true}
                onChange={(e) => handleToggle('showSectionLabels', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-foreground">Show section labels (Verse 1, Chorus, etc.)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(settings as any).showCopyright ?? true}
                onChange={(e) => handleToggle('showCopyright', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-foreground">Show copyright slide</span>
            </label>
          </div>
        </div>
      )}

      {contentType === 'scripture' && (
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Display Options</h4>
          <div>
            <label className="block text-xs font-medium mb-2 text-muted-foreground">
              Reference Position
            </label>
            <select
              value={(settings.typography as any).referencePosition || 'top-center'}
              onChange={(e) => handleTypographyChange('referencePosition', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded bg-input text-foreground text-sm"
            >
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>
        </div>
      )}

      {/* Song-specific advanced options */}
      {contentType === 'song' && (
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
              value={(settings as any).maxLinesPerSlide || 8}
              onChange={(e) => onChange({ maxLinesPerSlide: parseInt(e.target.value) } as any)}
              className="w-full px-3 py-2 border border-border rounded bg-input text-foreground text-sm"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Longer sections will be split across multiple slides
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentTypeSettingsPanel;
