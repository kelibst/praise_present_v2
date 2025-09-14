import React, { useState, useEffect } from 'react';
import { IoChevronDown, IoChevronUp, IoSettings, IoEye, IoOptionsOutline } from 'react-icons/io5';
import './ResponsiveControlPanel.css';
import { AdvancedLayoutMode, AdvancedLayoutManager } from '../../rendering/layout/AdvancedLayoutModes';
import { TypographyScaleMode } from '../../rendering/layout/TypographyScaler';

/**
 * Configuration for responsive features
 */
export interface ResponsiveControlConfig {
  // Smart scaling settings
  smartScaling: {
    enabled: boolean;
    context: 'scripture' | 'song' | 'announcement' | 'title';
    readabilityWeight: number; // 0-1
    compactnesWeight: number; // 0-1
    baseSize: number; // px
    minSize: number; // px
    maxSize: number; // px
  };

  // Layout settings
  layout: {
    mode: AdvancedLayoutMode;
    autoDetect: boolean;
    customPadding: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };

  // Typography settings
  typography: {
    scaleMode: TypographyScaleMode;
    optimizeReadability: boolean;
    autoSize: boolean;
    wordWrap: boolean;
    maxLines: number;
  };

  // Responsive behavior
  responsive: {
    enabled: boolean;
    maintainAspectRatio: boolean;
    enableBreakpoints: boolean;
    adaptToContainer: boolean;
  };

  // Performance settings
  performance: {
    selectiveRendering: boolean;
    enableCaching: boolean;
    targetFPS: number;
    memoryOptimization: boolean;
  };
}

/**
 * Default responsive control configuration
 */
const DEFAULT_CONFIG: ResponsiveControlConfig = {
  smartScaling: {
    enabled: true,
    context: 'scripture',
    readabilityWeight: 0.7,
    compactnesWeight: 0.3,
    baseSize: 48,
    minSize: 16,
    maxSize: 120
  },
  layout: {
    mode: AdvancedLayoutMode.SCRIPTURE_CENTERED,
    autoDetect: true,
    customPadding: { top: 80, right: 120, bottom: 80, left: 120 }
  },
  typography: {
    scaleMode: TypographyScaleMode.FLUID,
    optimizeReadability: true,
    autoSize: true,
    wordWrap: true,
    maxLines: 8
  },
  responsive: {
    enabled: true,
    maintainAspectRatio: true,
    enableBreakpoints: true,
    adaptToContainer: true
  },
  performance: {
    selectiveRendering: true,
    enableCaching: true,
    targetFPS: 60,
    memoryOptimization: true
  }
};

/**
 * Props for the ResponsiveControlPanel
 */
interface ResponsiveControlPanelProps {
  config: ResponsiveControlConfig;
  onChange: (config: ResponsiveControlConfig) => void;
  onReset?: () => void;
  className?: string;
  collapsed?: boolean;
}

/**
 * Comprehensive control panel for responsive rendering features
 */
export const ResponsiveControlPanel: React.FC<ResponsiveControlPanelProps> = ({
  config,
  onChange,
  onReset,
  className = '',
  collapsed: initialCollapsed = false
}) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [activeTab, setActiveTab] = useState<'smart' | 'layout' | 'typography' | 'responsive' | 'performance'>('smart');

  // Handle configuration changes
  const updateConfig = (section: keyof ResponsiveControlConfig, updates: any) => {
    onChange({
      ...config,
      [section]: { ...config[section], ...updates }
    });
  };

  // Reset to defaults
  const handleReset = () => {
    onChange(DEFAULT_CONFIG);
    onReset?.();
  };

  if (collapsed) {
    return (
      <div className={`bg-gray-800 text-white p-3 rounded-lg ${className}`}>
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center justify-between w-full text-left hover:bg-gray-700 p-2 rounded transition-colors"
        >
          <div className="flex items-center space-x-2">
            <IoSettings className="h-5 w-5" />
            <span className="font-medium">Responsive Controls</span>
          </div>
          <IoChevronDown className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 text-white rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <IoOptionsOutline className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold">Responsive Controls</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <IoChevronUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 bg-gray-750">
        {[
          { id: 'smart', label: 'Smart Scaling', icon: '🧠' },
          { id: 'layout', label: 'Layout', icon: '📐' },
          { id: 'typography', label: 'Typography', icon: '📝' },
          { id: 'responsive', label: 'Responsive', icon: '📱' },
          { id: 'performance', label: 'Performance', icon: '⚡' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {activeTab === 'smart' && (
          <SmartScalingControls
            config={config.smartScaling}
            onChange={(updates) => updateConfig('smartScaling', updates)}
          />
        )}

        {activeTab === 'layout' && (
          <LayoutControls
            config={config.layout}
            onChange={(updates) => updateConfig('layout', updates)}
          />
        )}

        {activeTab === 'typography' && (
          <TypographyControls
            config={config.typography}
            onChange={(updates) => updateConfig('typography', updates)}
          />
        )}

        {activeTab === 'responsive' && (
          <ResponsiveControls
            config={config.responsive}
            onChange={(updates) => updateConfig('responsive', updates)}
          />
        )}

        {activeTab === 'performance' && (
          <PerformanceControls
            config={config.performance}
            onChange={(updates) => updateConfig('performance', updates)}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Smart Scaling Controls Component
 */
const SmartScalingControls: React.FC<{
  config: ResponsiveControlConfig['smartScaling'];
  onChange: (updates: Partial<ResponsiveControlConfig['smartScaling']>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">Enable Smart Scaling</label>
      <input
        type="checkbox"
        checked={config.enabled}
        onChange={(e) => onChange({ enabled: e.target.checked })}
        className="toggle-checkbox"
      />
    </div>

    {config.enabled && (
      <>
        <div>
          <label className="block text-sm font-medium mb-2">Content Context</label>
          <select
            value={config.context}
            onChange={(e) => onChange({ context: e.target.value as any })}
            className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500"
          >
            <option value="scripture">Scripture</option>
            <option value="song">Song</option>
            <option value="announcement">Announcement</option>
            <option value="title">Title</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Readability Weight: {Math.round(config.readabilityWeight * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.readabilityWeight}
            onChange={(e) => onChange({ readabilityWeight: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Compactness Weight: {Math.round(config.compactnesWeight * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.compactnesWeight}
            onChange={(e) => onChange({ compactnesWeight: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Base Size</label>
            <input
              type="number"
              value={config.baseSize}
              onChange={(e) => onChange({ baseSize: parseInt(e.target.value) })}
              className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
              min="12"
              max="200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Min Size</label>
            <input
              type="number"
              value={config.minSize}
              onChange={(e) => onChange({ minSize: parseInt(e.target.value) })}
              className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
              min="8"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Size</label>
            <input
              type="number"
              value={config.maxSize}
              onChange={(e) => onChange({ maxSize: parseInt(e.target.value) })}
              className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
              min="50"
              max="300"
            />
          </div>
        </div>
      </>
    )}
  </div>
);

/**
 * Layout Controls Component
 */
const LayoutControls: React.FC<{
  config: ResponsiveControlConfig['layout'];
  onChange: (updates: Partial<ResponsiveControlConfig['layout']>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">Auto-detect Layout</label>
      <input
        type="checkbox"
        checked={config.autoDetect}
        onChange={(e) => onChange({ autoDetect: e.target.checked })}
        className="toggle-checkbox"
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Layout Mode</label>
      <select
        value={config.mode}
        onChange={(e) => onChange({ mode: e.target.value as AdvancedLayoutMode })}
        disabled={config.autoDetect}
        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500 disabled:opacity-50"
      >
        <optgroup label="Scripture">
          <option value={AdvancedLayoutMode.SCRIPTURE_CENTERED}>Centered</option>
          <option value={AdvancedLayoutMode.SCRIPTURE_VERSE_REFERENCE}>Verse & Reference</option>
          <option value={AdvancedLayoutMode.SCRIPTURE_READING}>Reading Layout</option>
          <option value={AdvancedLayoutMode.SCRIPTURE_MEMORY}>Memory Verse</option>
        </optgroup>
        <optgroup label="Song">
          <option value={AdvancedLayoutMode.SONG_TITLE_VERSE}>Title & Verse</option>
          <option value={AdvancedLayoutMode.SONG_CHORUS_EMPHASIS}>Chorus Emphasis</option>
          <option value={AdvancedLayoutMode.SONG_BRIDGE}>Bridge</option>
          <option value={AdvancedLayoutMode.SONG_CREDITS}>Credits</option>
        </optgroup>
        <optgroup label="Announcements">
          <option value={AdvancedLayoutMode.ANNOUNCEMENT_HEADER}>Header</option>
          <option value={AdvancedLayoutMode.ANNOUNCEMENT_DETAILS}>Details</option>
          <option value={AdvancedLayoutMode.ANNOUNCEMENT_CALL_ACTION}>Call to Action</option>
          <option value={AdvancedLayoutMode.ANNOUNCEMENT_EVENT}>Event</option>
        </optgroup>
        <optgroup label="Special">
          <option value={AdvancedLayoutMode.TITLE_SPLASH}>Title Splash</option>
          <option value={AdvancedLayoutMode.PRAYER_REQUEST}>Prayer Request</option>
          <option value={AdvancedLayoutMode.SERMON_POINT}>Sermon Point</option>
        </optgroup>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Custom Padding</label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <input
            type="number"
            placeholder="Top"
            value={config.customPadding.top}
            onChange={(e) => onChange({
              customPadding: { ...config.customPadding, top: parseInt(e.target.value) }
            })}
            className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 text-sm"
          />
        </div>
        <div>
          <input
            type="number"
            placeholder="Right"
            value={config.customPadding.right}
            onChange={(e) => onChange({
              customPadding: { ...config.customPadding, right: parseInt(e.target.value) }
            })}
            className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 text-sm"
          />
        </div>
        <div>
          <input
            type="number"
            placeholder="Bottom"
            value={config.customPadding.bottom}
            onChange={(e) => onChange({
              customPadding: { ...config.customPadding, bottom: parseInt(e.target.value) }
            })}
            className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 text-sm"
          />
        </div>
        <div>
          <input
            type="number"
            placeholder="Left"
            value={config.customPadding.left}
            onChange={(e) => onChange({
              customPadding: { ...config.customPadding, left: parseInt(e.target.value) }
            })}
            className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 text-sm"
          />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Typography Controls Component
 */
const TypographyControls: React.FC<{
  config: ResponsiveControlConfig['typography'];
  onChange: (updates: Partial<ResponsiveControlConfig['typography']>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-2">Scale Mode</label>
      <select
        value={config.scaleMode}
        onChange={(e) => onChange({ scaleMode: e.target.value as TypographyScaleMode })}
        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-blue-500"
      >
        <option value={TypographyScaleMode.LINEAR}>Linear</option>
        <option value={TypographyScaleMode.LOGARITHMIC}>Logarithmic</option>
        <option value={TypographyScaleMode.STEPPED}>Stepped</option>
        <option value={TypographyScaleMode.FLUID}>Fluid</option>
      </select>
    </div>

    <div className="space-y-3">
      <label className="flex items-center justify-between">
        <span className="text-sm font-medium">Optimize Readability</span>
        <input
          type="checkbox"
          checked={config.optimizeReadability}
          onChange={(e) => onChange({ optimizeReadability: e.target.checked })}
          className="toggle-checkbox"
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-sm font-medium">Auto Size</span>
        <input
          type="checkbox"
          checked={config.autoSize}
          onChange={(e) => onChange({ autoSize: e.target.checked })}
          className="toggle-checkbox"
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-sm font-medium">Word Wrap</span>
        <input
          type="checkbox"
          checked={config.wordWrap}
          onChange={(e) => onChange({ wordWrap: e.target.checked })}
          className="toggle-checkbox"
        />
      </label>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">
        Max Lines: {config.maxLines === 0 ? 'Unlimited' : config.maxLines}
      </label>
      <input
        type="range"
        min="0"
        max="20"
        value={config.maxLines}
        onChange={(e) => onChange({ maxLines: parseInt(e.target.value) })}
        className="w-full"
      />
    </div>
  </div>
);

/**
 * Responsive Controls Component
 */
const ResponsiveControls: React.FC<{
  config: ResponsiveControlConfig['responsive'];
  onChange: (updates: Partial<ResponsiveControlConfig['responsive']>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div className="space-y-3">
      <label className="flex items-center justify-between">
        <span className="text-sm font-medium">Enable Responsive Rendering</span>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="toggle-checkbox"
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-sm font-medium">Maintain Aspect Ratio</span>
        <input
          type="checkbox"
          checked={config.maintainAspectRatio}
          onChange={(e) => onChange({ maintainAspectRatio: e.target.checked })}
          className="toggle-checkbox"
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-sm font-medium">Enable Breakpoints</span>
        <input
          type="checkbox"
          checked={config.enableBreakpoints}
          onChange={(e) => onChange({ enableBreakpoints: e.target.checked })}
          className="toggle-checkbox"
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-sm font-medium">Adapt to Container</span>
        <input
          type="checkbox"
          checked={config.adaptToContainer}
          onChange={(e) => onChange({ adaptToContainer: e.target.checked })}
          className="toggle-checkbox"
        />
      </label>
    </div>
  </div>
);

/**
 * Performance Controls Component
 */
const PerformanceControls: React.FC<{
  config: ResponsiveControlConfig['performance'];
  onChange: (updates: Partial<ResponsiveControlConfig['performance']>) => void;
}> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div className="space-y-3">
      <label className="flex items-center justify-between">
        <span className="text-sm font-medium">Selective Rendering</span>
        <input
          type="checkbox"
          checked={config.selectiveRendering}
          onChange={(e) => onChange({ selectiveRendering: e.target.checked })}
          className="toggle-checkbox"
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-sm font-medium">Enable Caching</span>
        <input
          type="checkbox"
          checked={config.enableCaching}
          onChange={(e) => onChange({ enableCaching: e.target.checked })}
          className="toggle-checkbox"
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-sm font-medium">Memory Optimization</span>
        <input
          type="checkbox"
          checked={config.memoryOptimization}
          onChange={(e) => onChange({ memoryOptimization: e.target.checked })}
          className="toggle-checkbox"
        />
      </label>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">
        Target FPS: {config.targetFPS}
      </label>
      <input
        type="range"
        min="15"
        max="120"
        step="15"
        value={config.targetFPS}
        onChange={(e) => onChange({ targetFPS: parseInt(e.target.value) })}
        className="w-full"
      />
    </div>
  </div>
);

export default ResponsiveControlPanel;
export { DEFAULT_CONFIG as DEFAULT_RESPONSIVE_CONFIG };
export type { ResponsiveControlConfig };