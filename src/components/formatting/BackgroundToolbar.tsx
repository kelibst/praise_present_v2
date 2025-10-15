import React, { useState, useEffect } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Droplet,
  Upload,
  Trash2,
  Video as VideoIcon
} from 'lucide-react';
import { Color } from '../../rendering/types/geometry';

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
  className = ''
}) => {
  const [bgType, setBgType] = useState<'color' | 'gradient' | 'image' | 'video'>(currentBackground.type || 'color');
  const [solidColor, setSolidColor] = useState(currentBackground.value || '#1a1a1a');
  const [gradientStart, setGradientStart] = useState(currentBackground.gradient?.start || '#1a1a1a');
  const [gradientEnd, setGradientEnd] = useState(currentBackground.gradient?.end || '#4a4a4a');
  const [gradientDirection, setGradientDirection] = useState<'horizontal' | 'vertical' | 'diagonal'>(
    currentBackground.gradient?.direction || 'vertical'
  );
  const [imageUrl, setImageUrl] = useState(currentBackground.value || '');
  const [videoUrl, setVideoUrl] = useState(currentBackground.value || '');
  const [opacity, setOpacity] = useState(currentBackground.opacity || 1.0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sync local state with current background
  // IMPORTANT: Use JSON.stringify for gradient to detect deep changes in nested object
  // Without this, React won't detect when gradient.start/end/direction change
  useEffect(() => {
    setBgType(currentBackground.type || 'color');
    if (currentBackground.type === 'color') {
      setSolidColor(currentBackground.value || '#1a1a1a');
    } else if (currentBackground.type === 'gradient' && currentBackground.gradient) {
      setGradientStart(currentBackground.gradient.start);
      setGradientEnd(currentBackground.gradient.end);
      setGradientDirection(currentBackground.gradient.direction || 'vertical');
    } else if (currentBackground.type === 'image') {
      setImageUrl(currentBackground.value || '');
    } else if (currentBackground.type === 'video') {
      setVideoUrl(currentBackground.value || '');
    }
    setOpacity(currentBackground.opacity || 1.0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentBackground.type,
    currentBackground.value,
    currentBackground.opacity,
    // Use JSON.stringify to detect deep changes in gradient object
    JSON.stringify(currentBackground.gradient)
  ]);

  // Apply background change
  const applyBackground = (updates: Partial<SlideBackground>) => {
    const newBackground: SlideBackground = {
      ...currentBackground,
      ...updates
    };
    onBackgroundChange(newBackground);
  };

  // Handle type change
  const handleTypeChange = (type: 'color' | 'gradient' | 'image' | 'video') => {
    setBgType(type);

    if (type === 'color') {
      applyBackground({
        type: 'color',
        value: solidColor,
        opacity
      });
    } else if (type === 'gradient') {
      applyBackground({
        type: 'gradient',
        gradient: {
          start: gradientStart,
          end: gradientEnd,
          direction: gradientDirection
        },
        opacity
      });
    } else if (type === 'image') {
      applyBackground({
        type: 'image',
        value: imageUrl,
        opacity
      });
    } else if (type === 'video') {
      applyBackground({
        type: 'video',
        value: videoUrl,
        opacity
      });
    }
  };

  // Handle color change
  const handleColorChange = (color: string) => {
    setSolidColor(color);
    applyBackground({
      type: 'color',
      value: color
    });
  };

  // Handle gradient change
  const handleGradientChange = (start?: string, end?: string, direction?: 'horizontal' | 'vertical' | 'diagonal') => {
    const newStart = start || gradientStart;
    const newEnd = end || gradientEnd;
    const newDirection = direction || gradientDirection;

    if (start) setGradientStart(start);
    if (end) setGradientEnd(end);
    if (direction) setGradientDirection(direction);

    applyBackground({
      type: 'gradient',
      gradient: {
        start: newStart,
        end: newEnd,
        direction: newDirection
      }
    });
  };

  // Handle image change
  const handleImageChange = (url: string) => {
    setImageUrl(url);
    setUploadError(null);
    applyBackground({
      type: 'image',
      value: url
    });
  };

  // Handle video change
  const handleVideoChange = (url: string) => {
    setVideoUrl(url);
    setUploadError(null);
    applyBackground({
      type: 'video',
      value: url
    });
  };

  // Handle file upload (images and videos)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    const isImage = fileType.startsWith('image/');
    const isVideo = fileType.startsWith('video/');

    if (!isImage && !isVideo) {
      setUploadError('Invalid file type. Please upload an image or video file.');
      return;
    }

    // Validate file type
    if (isImage) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validImageTypes.includes(fileType)) {
        setUploadError('Invalid image type. Please upload JPG, PNG, WebP, or GIF.');
        return;
      }

      // Validate file size (max 2MB for images)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        setUploadError('Image too large. Maximum size is 2MB.');
        return;
      }
    } else if (isVideo) {
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!validVideoTypes.includes(fileType)) {
        setUploadError('Invalid video type. Please upload MP4, WebM, or MOV.');
        return;
      }

      // Validate file size (max 50MB for videos)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        setUploadError('Video too large. Maximum size is 50MB.');
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);

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
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError('Failed to read file. Please try again.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadError('Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  // Handle opacity change
  const handleOpacityChange = (newOpacity: number) => {
    setOpacity(newOpacity);
    applyBackground({
      opacity: newOpacity
    });
  };

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
                bgType === 'color'
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
                bgType === 'gradient'
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
                bgType === 'image'
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
                bgType === 'video'
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

        {/* Solid Color Controls */}
        {bgType === 'color' && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={solidColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-10 h-8 bg-gray-800 border border-gray-600 rounded cursor-pointer"
                title="Background color"
              />
              <input
                type="text"
                value={solidColor.toUpperCase()}
                onChange={(e) => handleColorChange(e.target.value)}
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
                  onClick={() => handleColorChange(preset.value)}
                  className="w-6 h-6 rounded border-2 border-gray-600 hover:border-blue-500 transition-colors"
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
          </>
        )}

        {/* Gradient Controls */}
        {bgType === 'gradient' && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Start:</span>
              <input
                type="color"
                value={gradientStart}
                onChange={(e) => handleGradientChange(e.target.value, undefined, undefined)}
                className="w-8 h-8 bg-gray-800 border border-gray-600 rounded cursor-pointer"
                title="Gradient start color"
              />
              <input
                type="text"
                value={gradientStart.toUpperCase()}
                onChange={(e) => handleGradientChange(e.target.value, undefined, undefined)}
                className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-2 py-1 w-20 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={7}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">End:</span>
              <input
                type="color"
                value={gradientEnd}
                onChange={(e) => handleGradientChange(undefined, e.target.value, undefined)}
                className="w-8 h-8 bg-gray-800 border border-gray-600 rounded cursor-pointer"
                title="Gradient end color"
              />
              <input
                type="text"
                value={gradientEnd.toUpperCase()}
                onChange={(e) => handleGradientChange(undefined, e.target.value, undefined)}
                className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-2 py-1 w-20 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={7}
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Direction:</span>
              <select
                value={gradientDirection}
                onChange={(e) => handleGradientChange(undefined, undefined, e.target.value as any)}
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
        {bgType === 'image' && (
          <>
            <div className="flex items-center gap-2">
              {/* Upload Button */}
              <label className={`px-3 py-1 text-xs rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                isUploading
                  ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white'
              }`}>
                <Upload className="w-3 h-3" />
                {isUploading ? 'Uploading...' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              {/* URL Input */}
              <span className="text-xs text-gray-400">or</span>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => handleImageChange(e.target.value)}
                placeholder="Enter image URL..."
                className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-3 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Clear Button */}
              {imageUrl && (
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
            {uploadError && (
              <div className="text-xs text-red-400 flex items-center gap-1">
                <span>⚠️</span>
                <span>{uploadError}</span>
              </div>
            )}
          </>
        )}

        {/* Video Controls */}
        {bgType === 'video' && (
          <>
            <div className="flex items-center gap-2">
              {/* Upload Button */}
              <label className={`px-3 py-1 text-xs rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                isUploading
                  ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white'
              }`}>
                <Upload className="w-3 h-3" />
                {isUploading ? 'Uploading...' : 'Upload Video'}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              {/* URL Input */}
              <span className="text-xs text-gray-400">or</span>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => handleVideoChange(e.target.value)}
                placeholder="Enter video URL..."
                className="bg-gray-800 text-white text-xs border border-gray-600 rounded px-3 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Clear Button */}
              {videoUrl && (
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
            {uploadError && (
              <div className="text-xs text-red-400 flex items-center gap-1">
                <span>⚠️</span>
                <span>{uploadError}</span>
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
            value={opacity}
            onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
            min={0}
            max={1}
            step={0.1}
            className="w-24 accent-blue-500"
            title={`Opacity: ${Math.round(opacity * 100)}%`}
          />
          <span className="text-xs text-white w-10">{Math.round(opacity * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default BackgroundToolbar;
