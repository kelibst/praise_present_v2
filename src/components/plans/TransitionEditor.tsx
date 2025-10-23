import React, { useState, useEffect } from 'react';
import {
  Circle,
  Square,
  Minus,
  Image as ImageIcon,
  Film,
  Clock,
  ArrowRightLeft,
  X
} from 'lucide-react';

/**
 * TransitionEditor Component
 *
 * Editor for transition items between plan sections or items.
 * Supports black screen, custom images, fade effects, and timing.
 */

export type TransitionType = 'black' | 'fade' | 'image' | 'video' | 'pause';

export interface TransitionSettings {
  type: TransitionType;
  duration: number; // seconds
  fadeIn?: boolean;
  fadeOut?: boolean;
  fadeSpeed?: number; // seconds
  imagePath?: string;
  videoPath?: string;
  autoAdvance?: boolean;
  showTimer?: boolean;
}

interface TransitionEditorProps {
  initialSettings?: TransitionSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: TransitionSettings) => void;
  className?: string;
}

const TRANSITION_TYPES: { value: TransitionType; label: string; icon: React.ComponentType<any>; description: string }[] = [
  {
    value: 'black',
    label: 'Black Screen',
    icon: Circle,
    description: 'Display a solid black screen'
  },
  {
    value: 'fade',
    label: 'Fade to Black',
    icon: Minus,
    description: 'Gradually fade to black'
  },
  {
    value: 'image',
    label: 'Custom Image',
    icon: ImageIcon,
    description: 'Display a custom image'
  },
  {
    value: 'video',
    label: 'Video Clip',
    icon: Film,
    description: 'Play a short video clip'
  },
  {
    value: 'pause',
    label: 'Timed Pause',
    icon: Clock,
    description: 'Brief pause with optional timer'
  }
];

export const TransitionEditor: React.FC<TransitionEditorProps> = ({
  initialSettings,
  isOpen,
  onClose,
  onSave,
  className = ''
}) => {
  const [settings, setSettings] = useState<TransitionSettings>({
    type: 'black',
    duration: 3,
    fadeIn: false,
    fadeOut: false,
    fadeSpeed: 1,
    autoAdvance: true,
    showTimer: false,
    ...initialSettings
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings({
        type: 'black',
        duration: 3,
        fadeIn: false,
        fadeOut: false,
        fadeSpeed: 1,
        autoAdvance: true,
        showTimer: false,
        ...initialSettings
      });
    }
  }, [initialSettings]);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleFileSelect = async (type: 'image' | 'video') => {
    // Trigger file selection
    if (window.electronAPI?.invoke) {
      try {
        const result = await window.electronAPI.invoke('dialog:showOpenDialog', {
          properties: ['openFile'],
          filters: type === 'image'
            ? [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] }]
            : [{ name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'webm'] }]
        });

        if (result && !result.canceled && result.filePaths.length > 0) {
          if (type === 'image') {
            setSettings({ ...settings, imagePath: result.filePaths[0] });
          } else {
            setSettings({ ...settings, videoPath: result.filePaths[0] });
          }
        }
      } catch (error) {
        console.error('Error selecting file:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Transition Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transition Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Transition Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {TRANSITION_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = settings.type === type.value;

                return (
                  <button
                    key={type.value}
                    onClick={() => setSettings({ ...settings, type: type.value })}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium mb-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {type.label}
                        </div>
                        <div className="text-xs text-gray-400">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration (seconds)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="60"
                value={settings.duration}
                onChange={(e) => setSettings({ ...settings, duration: parseInt(e.target.value) })}
                className="flex-1"
              />
              <input
                type="number"
                min="1"
                max="300"
                value={settings.duration}
                onChange={(e) => setSettings({ ...settings, duration: parseInt(e.target.value) || 1 })}
                className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-center focus:outline-none focus:border-blue-500"
              />
              <span className="text-sm text-gray-400">sec</span>
            </div>
          </div>

          {/* Fade Effects */}
          {(settings.type === 'black' || settings.type === 'fade' || settings.type === 'image') && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Fade Effects
              </label>

              <div className="space-y-2">
                {/* Fade In */}
                <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.fadeIn}
                    onChange={(e) => setSettings({ ...settings, fadeIn: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">Fade in at start</span>
                </label>

                {/* Fade Out */}
                <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.fadeOut}
                    onChange={(e) => setSettings({ ...settings, fadeOut: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">Fade out at end</span>
                </label>
              </div>

              {/* Fade Speed */}
              {(settings.fadeIn || settings.fadeOut) && (
                <div className="mt-3">
                  <label className="block text-sm text-gray-400 mb-2">
                    Fade speed (seconds)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.5"
                      value={settings.fadeSpeed || 1}
                      onChange={(e) => setSettings({ ...settings, fadeSpeed: parseFloat(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm text-gray-300 text-center">
                      {settings.fadeSpeed || 1}s
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Image Selection */}
          {settings.type === 'image' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Image File
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.imagePath || ''}
                  onChange={(e) => setSettings({ ...settings, imagePath: e.target.value })}
                  placeholder="Select an image file..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  readOnly
                />
                <button
                  onClick={() => handleFileSelect('image')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Browse
                </button>
              </div>
            </div>
          )}

          {/* Video Selection */}
          {settings.type === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video File
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.videoPath || ''}
                  onChange={(e) => setSettings({ ...settings, videoPath: e.target.value })}
                  placeholder="Select a video file..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  readOnly
                />
                <button
                  onClick={() => handleFileSelect('video')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Browse
                </button>
              </div>
            </div>
          )}

          {/* Auto-advance */}
          <div>
            <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
              <input
                type="checkbox"
                checked={settings.autoAdvance}
                onChange={(e) => setSettings({ ...settings, autoAdvance: e.target.checked })}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-300">Auto-advance</div>
                <div className="text-xs text-gray-400">Automatically proceed to next item after duration</div>
              </div>
            </label>
          </div>

          {/* Show Timer */}
          {settings.type === 'pause' && (
            <div>
              <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.showTimer}
                  onChange={(e) => setSettings({ ...settings, showTimer: e.target.checked })}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-300">Show countdown timer</div>
                  <div className="text-xs text-gray-400">Display remaining time on screen</div>
                </div>
              </label>
            </div>
          )}

          {/* Preview */}
          <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
            <div className="text-xs font-medium text-gray-400 mb-2 uppercase">Preview</div>
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
              {settings.type === 'black' && (
                <div className="text-gray-600 text-sm">Black Screen</div>
              )}
              {settings.type === 'fade' && (
                <div className="text-gray-600 text-sm">Fade to Black</div>
              )}
              {settings.type === 'image' && (
                <div className="text-gray-600 text-sm">
                  {settings.imagePath ? (
                    <ImageIcon className="w-12 h-12" />
                  ) : (
                    'No image selected'
                  )}
                </div>
              )}
              {settings.type === 'video' && (
                <div className="text-gray-600 text-sm">
                  {settings.videoPath ? (
                    <Film className="w-12 h-12" />
                  ) : (
                    'No video selected'
                  )}
                </div>
              )}
              {settings.type === 'pause' && (
                <div className="text-white text-4xl font-mono">
                  {settings.showTimer ? '00:03' : <Clock className="w-12 h-12 text-gray-600" />}
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Duration: {settings.duration}s
              {settings.fadeIn && ' • Fade In'}
              {settings.fadeOut && ' • Fade Out'}
              {settings.autoAdvance && ' • Auto-advance'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Save Transition
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransitionEditor;
