import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Droplet,
  Upload,
  Trash2,
  Video as VideoIcon,
  Save,
  FolderOpen
} from 'lucide-react';
import debounce from 'lodash/debounce';
import { Color } from '../../rendering/types/geometry';
import { MediaPickerDialog } from '../media/MediaPickerDialog';
import { MediaItem as MediaItemType } from '@prisma/client';

export interface SlideBackground {
  type: 'color' | 'gradient' | 'image' | 'video';
  value?: string; // Hex color for solid, image URL, or video URL
  gradient?: {
    start: string; // Hex color
    end: string;   // Hex color
    direction?: 'horizontal' | 'vertical' | 'diagonal';
  };
  opacity?: number;
}

interface BackgroundToolbarProps {
  /**
   * Current slide background
   */
  currentBackground: SlideBackground;

  /**
   * Callback when background changes
   */
  onBackgroundChange: (background: SlideBackground) => void;

  /**
   * Callback when saving as default (optional)
   */
  onSaveAsDefault?: (background: SlideBackground) => void;

  /**
   * Whether save as default is available
   */
  canSaveAsDefault?: boolean;

  /**
   * Optional CSS class
   */
  className?: string;
}

/**
 * BackgroundToolbar - PowerPoint-style background editing controls
 *
 * Features:
 * - Background type selector (Solid Color, Gradient, Image)
 * - Color picker for solid backgrounds
 * - Gradient editor (start/end colors, direction)
 * - Image upload/URL input
 * - Opacity control
 * - Background presets (common colors)
 * - Live preview of changes
 *
 * Architecture:
 * - Changes apply immediately to slide
 * - Background syncs to preview, live window, and live screen
 * - Integrates with SlideEditorWithToolbar
 */
export const BackgroundToolbar: React.FC<BackgroundToolbarProps> = ({
  currentBackground,
  onBackgroundChange,
  onSaveAsDefault,
  canSaveAsDefault = false,
  className = ''
}) => {
  // Combine related state into single objects to reduce re-renders
  const [backgroundState, setBackgroundState] = useState({
    type: currentBackground.type || 'color',
    solidColor: currentBackground.value || '#1a1a1a',
    gradientStart: currentBackground.gradient?.start || '#1a1a1a',
    gradientEnd: currentBackground.gradient?.end || '#4a4a4a',
    gradientDirection: (currentBackground.gradient?.direction || 'vertical') as 'horizontal' | 'vertical' | 'diagonal',
    imageUrl: currentBackground.type === 'image' ? (currentBackground.value || '') : '',
    videoUrl: currentBackground.type === 'video' ? (currentBackground.value || '') : '',
    opacity: currentBackground.opacity || 1.0
  });

  const [uploadState, setUploadState] = useState({
    isUploading: false,
    uploadError: null as string | null
  });

  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerType, setMediaPickerType] = useState<'image' | 'video'>('image');

  // Sync local state with current background
  // Optimized to use shallow comparison instead of JSON.stringify
  useEffect(() => {
    setBackgroundState(prev => {
      const newState = { ...prev };
      newState.type = currentBackground.type || 'color';
      newState.opacity = currentBackground.opacity || 1.0;

      if (currentBackground.type === 'color') {
        newState.solidColor = currentBackground.value || '#1a1a1a';
      } else if (currentBackground.type === 'gradient' && currentBackground.gradient) {
        newState.gradientStart = currentBackground.gradient.start;
        newState.gradientEnd = currentBackground.gradient.end;
        newState.gradientDirection = currentBackground.gradient.direction || 'vertical';
      } else if (currentBackground.type === 'image') {
        newState.imageUrl = currentBackground.value || '';
      } else if (currentBackground.type === 'video') {
        newState.videoUrl = currentBackground.value || '';
      }

      // Only update if something actually changed
      if (
        prev.type === newState.type &&
        prev.solidColor === newState.solidColor &&
        prev.gradientStart === newState.gradientStart &&
        prev.gradientEnd === newState.gradientEnd &&
        prev.gradientDirection === newState.gradientDirection &&
        prev.imageUrl === newState.imageUrl &&
        prev.videoUrl === newState.videoUrl &&
        prev.opacity === newState.opacity
      ) {
        return prev; // No change, return previous state
      }

      return newState;
    });
  }, [
    currentBackground.type,
    currentBackground.value,
    currentBackground.opacity,
    currentBackground.gradient?.start,
    currentBackground.gradient?.end,
    currentBackground.gradient?.direction
  ]);

  // Apply background change immediately
  const applyBackground = useCallback((updates: Partial<SlideBackground>) => {
    const newBackground: SlideBackground = {
      ...currentBackground,
      ...updates
    };
    onBackgroundChange(newBackground);
  }, [currentBackground, onBackgroundChange]);

  // Create debounced version for color inputs (200ms delay)
  const debouncedApplyBackground = useMemo(
    () => debounce((updates: Partial<SlideBackground>) => {
      applyBackground(updates);
    }, 200),
    [applyBackground]
  );

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedApplyBackground.cancel();
    };
  }, [debouncedApplyBackground]);

  // Handle type change - immediate update
  const handleTypeChange = useCallback((type: 'color' | 'gradient' | 'image' | 'video') => {
    setBackgroundState(prev => ({ ...prev, type }));

    if (type === 'color') {
      applyBackground({
        type: 'color',
        value: backgroundState.solidColor,
        opacity: backgroundState.opacity
      });
    } else if (type === 'gradient') {
      applyBackground({
        type: 'gradient',
        gradient: {
          start: backgroundState.gradientStart,
          end: backgroundState.gradientEnd,
          direction: backgroundState.gradientDirection
        },
        opacity: backgroundState.opacity
      });
    } else if (type === 'image') {
      applyBackground({
        type: 'image',
        value: backgroundState.imageUrl,
        opacity: backgroundState.opacity
      });
    } else if (type === 'video') {
      applyBackground({
        type: 'video',
        value: backgroundState.videoUrl,
        opacity: backgroundState.opacity
      });
    }
  }, [backgroundState, applyBackground]);

  // Handle color change - debounced for text input, immediate for color picker clicks
  const handleColorChange = useCallback((color: string, isTextInput: boolean = false) => {
    setBackgroundState(prev => ({ ...prev, solidColor: color }));

    const update = {
      type: 'color' as const,
      value: color,
      opacity: backgroundState.opacity
    };

    if (isTextInput) {
      debouncedApplyBackground(update);
    } else {
      applyBackground(update);
    }
  }, [backgroundState.opacity, applyBackground, debouncedApplyBackground]);

  // Handle gradient change - debounced for text input
  const handleGradientChange = useCallback((start?: string, end?: string, direction?: 'horizontal' | 'vertical' | 'diagonal', isTextInput: boolean = false) => {
    setBackgroundState(prev => {
      const newState = { ...prev };
      if (start !== undefined) newState.gradientStart = start;
      if (end !== undefined) newState.gradientEnd = end;
      if (direction !== undefined) newState.gradientDirection = direction;
      return newState;
    });

    const update = {
      type: 'gradient' as const,
      gradient: {
        start: start || backgroundState.gradientStart,
        end: end || backgroundState.gradientEnd,
        direction: direction || backgroundState.gradientDirection
      },
      opacity: backgroundState.opacity
    };

    if (isTextInput) {
      debouncedApplyBackground(update);
    } else {
      applyBackground(update);
    }
  }, [backgroundState, applyBackground, debouncedApplyBackground]);

  // Handle image change - immediate
  const handleImageChange = useCallback((url: string) => {
    setBackgroundState(prev => ({ ...prev, imageUrl: url }));
    setUploadState(prev => ({ ...prev, uploadError: null }));
    applyBackground({
      type: 'image',
      value: url,
      opacity: backgroundState.opacity
    });
  }, [backgroundState.opacity, applyBackground]);

  // Handle video change - immediate
  const handleVideoChange = useCallback((url: string) => {
    setBackgroundState(prev => ({ ...prev, videoUrl: url }));
    setUploadState(prev => ({ ...prev, uploadError: null }));
    applyBackground({
      type: 'video',
      value: url,
      opacity: backgroundState.opacity
    });
  }, [backgroundState.opacity, applyBackground]);

  // Handle file upload (images and videos)
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    const isImage = fileType.startsWith('image/');
    const isVideo = fileType.startsWith('video/');

    if (!isImage && !isVideo) {
      setUploadState(prev => ({ ...prev, uploadError: 'Invalid file type. Please upload an image or video file.' }));
      return;
    }

    // Validate file type
    if (isImage) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validImageTypes.includes(fileType)) {
        setUploadState(prev => ({ ...prev, uploadError: 'Invalid image type. Please upload JPG, PNG, WebP, or GIF.' }));
        return;
      }

      // Validate file size (max 2MB for images)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        setUploadState(prev => ({ ...prev, uploadError: 'Image too large. Maximum size is 2MB.' }));
        return;
      }
    } else if (isVideo) {
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!validVideoTypes.includes(fileType)) {
        setUploadState(prev => ({ ...prev, uploadError: 'Invalid video type. Please upload MP4, WebM, or MOV.' }));
        return;
      }

      // Validate file size (max 50MB for videos)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        setUploadState(prev => ({ ...prev, uploadError: 'Video too large. Maximum size is 50MB.' }));
        return;
      }
    }

    setUploadState({ isUploading: true, uploadError: null });

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        if (isImage) {
          handleImageChange(base64String);
        } else if (isVideo) {
          handleVideoChange(base64String);
        }
        setUploadState({ isUploading: false, uploadError: null });
      };
      reader.onerror = () => {
        setUploadState({ isUploading: false, uploadError: 'Failed to read file. Please try again.' });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadState({ isUploading: false, uploadError: 'Upload failed. Please try again.' });
    }
  }, [handleImageChange, handleVideoChange]);

  // Handle opacity change - debounced for slider
  const handleOpacityChange = useCallback((newOpacity: number) => {
    setBackgroundState(prev => ({ ...prev, opacity: newOpacity }));

    // Update opacity for current background type
    const update: Partial<SlideBackground> = { opacity: newOpacity };

    if (backgroundState.type === 'gradient') {
      update.type = 'gradient';
      update.gradient = {
        start: backgroundState.gradientStart,
        end: backgroundState.gradientEnd,
        direction: backgroundState.gradientDirection
      };
    } else if (backgroundState.type === 'color') {
      update.type = 'color';
      update.value = backgroundState.solidColor;
    } else if (backgroundState.type === 'image') {
      update.type = 'image';
      update.value = backgroundState.imageUrl;
    } else if (backgroundState.type === 'video') {
      update.type = 'video';
      update.value = backgroundState.videoUrl;
    }

    debouncedApplyBackground(update);
  }, [backgroundState, debouncedApplyBackground]);

  // Handle media selection from library
  const handleMediaSelect = useCallback((mediaItem: MediaItemType) => {
    console.log('[BackgroundToolbar] Media selected from library:', mediaItem);

    if (mediaItem.type === 'image') {
      handleImageChange(mediaItem.path);
    } else if (mediaItem.type === 'video') {
      handleVideoChange(mediaItem.path);
    }

    setShowMediaPicker(false);
  }, [handleImageChange, handleVideoChange]);

  // Open media picker dialog
  const handleOpenMediaPicker = useCallback((type: 'image' | 'video') => {
    setMediaPickerType(type);
    setShowMediaPicker(true);
  }, []);

  // Handle Save as Default
  const handleSaveAsDefault = useCallback(() => {
    if (!onSaveAsDefault) return;

    const currentBg: SlideBackground = {
      type: backgroundState.type,
      opacity: backgroundState.opacity
    };

    if (backgroundState.type === 'color') {
      currentBg.value = backgroundState.solidColor;
    } else if (backgroundState.type === 'gradient') {
      currentBg.gradient = {
        start: backgroundState.gradientStart,
        end: backgroundState.gradientEnd,
        direction: backgroundState.gradientDirection
      };
    } else if (backgroundState.type === 'image') {
      currentBg.value = backgroundState.imageUrl;
    } else if (backgroundState.type === 'video') {
      currentBg.value = backgroundState.videoUrl;
    }

    onSaveAsDefault(currentBg);

    // Show confirmation
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 2000);
  }, [backgroundState, onSaveAsDefault]);

  // Preset colors
  const presetColors = [
    { name: 'Dark', value: '#1a1a1a' },
    { name: 'Navy', value: '#1e3a5f' },
    { name: 'Forest', value: '#1e4d2b' },
    { name: 'Purple', value: '#3d1e6d' },
    { name: 'Maroon', value: '#5e1e1e' },
    { name: 'Light', value: '#f5f5f5' },
    { name: 'Sky', value: '#87ceeb' },
    { name: 'Cream', value: '#fffdd0' }
  ];

  return (
    <div className={`bg-gray-900/95 border-b border-gray-700 px-4 py-2 ${className}`}>
      <div className="flex items-center gap-4 flex-wrap">
        {/* Background Type Selector */}
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">Background:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleTypeChange('color')}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                backgroundState.type === 'color'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
              title="Solid Color"
            >
              <Droplet className="w-3 h-3 inline mr-1" />
              Color
            </button>

            <button
              onClick={() => handleTypeChange('gradient')}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                backgroundState.type === 'gradient'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
              title="Gradient"
            >
              Gradient
            </button>

            <button
              onClick={() => handleTypeChange('image')}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                backgroundState.type === 'image'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
              title="Image"
            >
              <ImageIcon className="w-3 h-3 inline mr-1" />
              Image
            </button>

            <button
              onClick={() => handleTypeChange('video')}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                backgroundState.type === 'video'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
              title="Video"
            >
              <VideoIcon className="w-3 h-3 inline mr-1" />
              Video
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-600" />

        {/* Save as Default Button */}
        {canSaveAsDefault && onSaveAsDefault && (
          <>
            <button
              onClick={handleSaveAsDefault}
              className="px-3 py-1 text-xs rounded border bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-1"
              title="Save current background as default for this type of slide"
            >
              <Save className="w-3 h-3" />
              Save as Default
            </button>
            {showSaveConfirmation && (
              <div className="text-xs text-green-400 animate-fade-in">
                ✓ Saved as default
              </div>
            )}
            <div className="h-6 w-px bg-gray-600" />
          </>
        )}

        {/* Solid Color Controls */}
        {backgroundState.type === 'color' && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={backgroundState.solidColor}
                onChange={(e) => handleColorChange(e.target.value, false)}
                className="w-10 h-8 bg-gray-800 border border-gray-600 rounded cursor-pointer"
                title="Background color"
              />
              <input
                type="text"
                value={backgroundState.solidColor.toUpperCase()}
                onChange={(e) => handleColorChange(e.target.value, true)}
                className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-2 py-1 w-20 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#1A1A1A"
                maxLength={7}
              />
            </div>

            {/* Preset Colors */}
            <div className="flex items-center gap-1">
              {presetColors.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleColorChange(preset.value, false)}
                  className="w-6 h-6 rounded border-2 border-gray-600 hover:border-blue-500 transition-colors"
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
          </>
        )}

        {/* Gradient Controls */}
        {backgroundState.type === 'gradient' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Start:</span>
              <input
                type="color"
                value={backgroundState.gradientStart}
                onChange={(e) => handleGradientChange(e.target.value, undefined, undefined, false)}
                className="w-8 h-8 bg-gray-800 border border-gray-600 rounded cursor-pointer"
                title="Gradient start color"
              />
              <input
                type="text"
                value={backgroundState.gradientStart.toUpperCase()}
                onChange={(e) => handleGradientChange(e.target.value, undefined, undefined, true)}
                className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-2 py-1 w-20 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={7}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">End:</span>
              <input
                type="color"
                value={backgroundState.gradientEnd}
                onChange={(e) => handleGradientChange(undefined, e.target.value, undefined, false)}
                className="w-8 h-8 bg-gray-800 border border-gray-600 rounded cursor-pointer"
                title="Gradient end color"
              />
              <input
                type="text"
                value={backgroundState.gradientEnd.toUpperCase()}
                onChange={(e) => handleGradientChange(undefined, e.target.value, undefined, true)}
                className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-2 py-1 w-20 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={7}
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Direction:</span>
              <select
                value={backgroundState.gradientDirection}
                onChange={(e) => handleGradientChange(undefined, undefined, e.target.value as any, false)}
                className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
                <option value="diagonal">Diagonal</option>
              </select>
            </div>
          </>
        )}

        {/* Image Controls */}
        {backgroundState.type === 'image' && (
          <>
            <div className="flex items-center gap-2">
              {/* Browse Library Button */}
              <button
                onClick={() => handleOpenMediaPicker('image')}
                className="px-3 py-1 text-xs rounded border transition-colors cursor-pointer flex items-center gap-1 bg-green-600 hover:bg-green-700 border-green-500 text-white"
                title="Browse media library"
              >
                <FolderOpen className="w-3 h-3" />
                Browse Library
              </button>

              {/* Upload Button */}
              <label className={`px-3 py-1 text-xs rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                uploadState.isUploading
                  ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white'
              }`}>
                <Upload className="w-3 h-3" />
                {uploadState.isUploading ? 'Uploading...' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileUpload}
                  disabled={uploadState.isUploading}
                  className="hidden"
                />
              </label>

              {/* URL Input */}
              <span className="text-xs text-gray-400">or</span>
              <input
                type="text"
                value={backgroundState.imageUrl}
                onChange={(e) => handleImageChange(e.target.value)}
                placeholder="Enter image URL..."
                className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-3 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Clear Button */}
              {backgroundState.imageUrl && (
                <button
                  onClick={() => handleImageChange('')}
                  className="p-1 bg-gray-800 hover:bg-red-600 text-gray-300 rounded border border-gray-600 transition-colors"
                  title="Clear image"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Error Message */}
            {uploadState.uploadError && (
              <div className="text-xs text-red-400 flex items-center gap-1">
                <span>⚠️</span>
                <span>{uploadState.uploadError}</span>
              </div>
            )}
          </>
        )}

        {/* Video Controls */}
        {backgroundState.type === 'video' && (
          <>
            <div className="flex items-center gap-2">
              {/* Browse Library Button */}
              <button
                onClick={() => handleOpenMediaPicker('video')}
                className="px-3 py-1 text-xs rounded border transition-colors cursor-pointer flex items-center gap-1 bg-green-600 hover:bg-green-700 border-green-500 text-white"
                title="Browse media library"
              >
                <FolderOpen className="w-3 h-3" />
                Browse Library
              </button>

              {/* Upload Button */}
              <label className={`px-3 py-1 text-xs rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                uploadState.isUploading
                  ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white'
              }`}>
                <Upload className="w-3 h-3" />
                {uploadState.isUploading ? 'Uploading...' : 'Upload Video'}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                  onChange={handleFileUpload}
                  disabled={uploadState.isUploading}
                  className="hidden"
                />
              </label>

              {/* URL Input */}
              <span className="text-xs text-gray-400">or</span>
              <input
                type="text"
                value={backgroundState.videoUrl}
                onChange={(e) => handleVideoChange(e.target.value)}
                placeholder="Enter video URL..."
                className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-3 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Clear Button */}
              {backgroundState.videoUrl && (
                <button
                  onClick={() => handleVideoChange('')}
                  className="p-1 bg-gray-800 hover:bg-red-600 text-gray-300 rounded border border-gray-600 transition-colors"
                  title="Clear video"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Error Message */}
            {uploadState.uploadError && (
              <div className="text-xs text-red-400 flex items-center gap-1">
                <span>⚠️</span>
                <span>{uploadState.uploadError}</span>
              </div>
            )}

            {/* Video Note */}
            <div className="text-xs text-yellow-400 flex items-center gap-1">
              <span>ℹ️</span>
              <span>Videos will loop automatically and play muted</span>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-gray-600" />

        {/* Opacity Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Opacity:</span>
          <input
            type="range"
            value={backgroundState.opacity}
            onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
            min={0}
            max={1}
            step={0.1}
            className="w-24 accent-blue-500"
            title={`Opacity: ${Math.round(backgroundState.opacity * 100)}%`}
          />
          <span className="text-xs text-white w-10">{Math.round(backgroundState.opacity * 100)}%</span>
        </div>
      </div>

      {/* Media Picker Dialog */}
      <MediaPickerDialog
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
        typeFilter={mediaPickerType}
        title={`Select ${mediaPickerType === 'image' ? 'Background Image' : 'Background Video'}`}
      />
    </div>
  );
};

export default BackgroundToolbar;
