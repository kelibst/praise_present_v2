import {
  BaseContentType,
  ContentTypeId,
  ValidationResult,
  GeneratedSlide,
  ContentTypeCapabilities
} from './ContentType';
import { BackgroundShape } from '../shapes/BackgroundShape';
import { VideoShape } from '../shapes/VideoShape';
import { ImageShape } from '../shapes/ImageShape';
import { TextShape } from '../shapes/TextShape';
import { BackgroundStyle, ImageStyle } from '../types/shapes';

/**
 * Media type (image or video)
 */
export type MediaType = 'image' | 'video';

/**
 * Media cropping/positioning data
 */
export interface MediaTransform {
  crop?: {
    x: number; // Crop start X (percentage 0-100)
    y: number; // Crop start Y (percentage 0-100)
    width: number; // Crop width (percentage 0-100)
    height: number; // Crop height (percentage 0-100)
  };
  position?: {
    x: number; // Position on slide
    y: number;
  };
  size?: {
    width: number; // Size on slide
    height: number;
  };
  rotation?: number;
  scale?: number;
  objectFit?: 'fill' | 'contain' | 'cover' | 'scale-down' | 'none';
}

/**
 * Video playback settings
 */
export interface VideoPlaybackSettings {
  startTime?: number; // Start at specific time (seconds)
  endTime?: number; // End at specific time (seconds)
  loop?: boolean;
  muted?: boolean;
  playbackRate?: number;
  volume?: number; // 0-1
}

/**
 * Media overlay text (optional text on media)
 */
export interface MediaOverlay {
  id: string;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor?: string;
    opacity?: number;
    textAlign?: 'left' | 'center' | 'right';
    shadow?: boolean;
  };
}

/**
 * Media metadata
 */
export interface MediaMetadata {
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  author?: string;
  source?: string; // Source URL or attribution
  duration?: number; // For videos, in seconds
  originalWidth?: number;
  originalHeight?: number;
}

/**
 * Media slide settings
 */
export interface MediaSlideSettings {
  mediaType: MediaType;
  mediaUrl: string;
  transform: MediaTransform;
  videoSettings?: VideoPlaybackSettings;
  overlays?: MediaOverlay[];
  background?: BackgroundStyle; // Background behind media (if media doesn't fill slide)
  filters?: {
    brightness?: number; // 0-200 (100 is normal)
    contrast?: number; // 0-200 (100 is normal)
    saturation?: number; // 0-200 (100 is normal)
    blur?: number; // 0-20 (0 is no blur)
  };
}

/**
 * Complete media content data
 */
export interface MediaData {
  metadata: MediaMetadata;
  settings: MediaSlideSettings;
}

/**
 * Media content type implementation
 *
 * Handles image and video content with cropping, positioning, and overlays.
 * Media itself is NOT editable (it's a binary file), but:
 * - Position, size, crop can be edited
 * - Overlay text IS editable
 * - Filters can be adjusted
 */
export class MediaContentType extends BaseContentType<MediaData, MediaSlideSettings> {
  readonly typeId: ContentTypeId = 'media';
  readonly typeName: string = 'Media';
  readonly description: string = 'Images and videos with optional overlays';
  readonly icon: string = 'image';

  constructor(
    content: MediaData,
    settings?: Partial<MediaSlideSettings>
  ) {
    const defaultSettings = MediaContentType.getDefaultSettings();
    const mergedSettings = { ...defaultSettings, ...content.settings, ...settings };

    super(content, mergedSettings);
  }

  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate metadata
    if (!this.content.metadata.title || this.content.metadata.title.trim() === '') {
      errors.push('Media title is required');
    }

    // Validate media URL
    if (!this.settings.mediaUrl || this.settings.mediaUrl.trim() === '') {
      errors.push('Media URL is required');
    }

    // Validate media type
    if (!['image', 'video'].includes(this.settings.mediaType)) {
      errors.push('Media type must be "image" or "video"');
    }

    // Validate video settings if media is video
    if (this.settings.mediaType === 'video') {
      if (this.settings.videoSettings) {
        const { startTime, endTime } = this.settings.videoSettings;
        if (startTime !== undefined && endTime !== undefined && startTime >= endTime) {
          errors.push('Video start time must be before end time');
        }
      }
    }

    // Warnings
    if (!this.content.metadata.source) {
      warnings.push('Media source/attribution not specified');
    }

    if (this.settings.mediaType === 'video' && !this.content.metadata.duration) {
      warnings.push('Video duration not specified');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  generateSlides(): GeneratedSlide[] {
    const shapes = [];

    // Background (if media doesn't fill entire slide)
    if (this.settings.background) {
      const bgShape = new BackgroundShape({
        size: { width: 1920, height: 1080 },
        zIndex: -1
      });
      shapes.push(bgShape);
    }

    // Media shape (image or video)
    const mediaShape = this.createMediaShape();
    shapes.push(mediaShape);

    // Overlay text shapes
    if (this.settings.overlays && this.settings.overlays.length > 0) {
      this.settings.overlays.forEach(overlay => {
        const textShape = this.createOverlayTextShape(overlay);
        shapes.push(textShape);
      });
    }

    // Create slide metadata
    const mediaShapeId = mediaShape.id;
    const overlayShapeIds = (this.settings.overlays || []).map(o => o.id);

    const metadata = this.createSlideMetadata(
      'media-slide',
      overlayShapeIds, // Only overlays are text-editable
      undefined
    );

    // Mark media shape as non-editable (view-only, but can be repositioned/cropped)
    metadata.editability.nonEditableShapes = [mediaShapeId];

    return [{
      id: `media-${this.content.metadata.title}`,
      shapes,
      background: this.settings.background || { type: 'color', value: '#000000' },
      metadata
    }];
  }

  /**
   * Create the media shape (image or video)
   */
  private createMediaShape() {
    const { mediaType, mediaUrl, transform, videoSettings, filters } = this.settings;

    const position = transform.position || { x: 0, y: 0 };
    const size = transform.size || { width: 1920, height: 1080 };

    const imageStyle: ImageStyle = {
      objectFit: transform.objectFit || 'cover',
      opacity: 1
    };

    // Apply filters
    if (filters) {
      const filterParts: string[] = [];
      if (filters.brightness !== undefined) {
        filterParts.push(`brightness(${filters.brightness}%)`);
      }
      if (filters.contrast !== undefined) {
        filterParts.push(`contrast(${filters.contrast}%)`);
      }
      if (filters.saturation !== undefined) {
        filterParts.push(`saturate(${filters.saturation}%)`);
      }
      if (filters.blur !== undefined && filters.blur > 0) {
        filterParts.push(`blur(${filters.blur}px)`);
      }
      if (filterParts.length > 0) {
        imageStyle.filter = filterParts.join(' ');
      }
    }

    if (mediaType === 'video') {
      return new VideoShape({
        src: mediaUrl,
        position,
        size,
        rotation: transform.rotation || 0,
        zIndex: 0,
        videoStyle: imageStyle,
        loop: videoSettings?.loop !== false,
        muted: videoSettings?.muted !== false,
        autoplay: true,
        playbackRate: videoSettings?.playbackRate || 1.0
      });
    } else {
      return new ImageShape({
        src: mediaUrl,
        position,
        size,
        rotation: transform.rotation || 0,
        zIndex: 0,
        imageStyle
      });
    }
  }

  /**
   * Create overlay text shape
   */
  private createOverlayTextShape(overlay: MediaOverlay): TextShape {
    return new TextShape({
      text: overlay.text,
      position: overlay.position,
      size: overlay.size,
      zIndex: 10, // Above media
      metadata: { overlayId: overlay.id }
    }, {
      fontFamily: overlay.style.fontFamily,
      fontSize: overlay.style.fontSize,
      color: overlay.style.color,
      textAlign: overlay.style.textAlign || 'center',
      opacity: overlay.style.opacity || 1,
      shadowColor: overlay.style.shadow ? { r: 0, g: 0, b: 0, a: 0.8 } : undefined,
      shadowBlur: overlay.style.shadow ? 10 : undefined,
      shadowOffsetX: overlay.style.shadow ? 2 : undefined,
      shadowOffsetY: overlay.style.shadow ? 2 : undefined
    });
  }

  getDefaultSettings(): MediaSlideSettings {
    return {
      mediaType: 'image',
      mediaUrl: '',
      transform: {
        objectFit: 'cover'
      },
      overlays: [],
      background: { type: 'color', value: '#000000' }
    };
  }

  static getDefaultSettings(): MediaSlideSettings {
    return {
      mediaType: 'image',
      mediaUrl: '',
      transform: {
        objectFit: 'cover'
      },
      overlays: [],
      background: { type: 'color', value: '#000000' }
    };
  }

  getEditableShapes(): Map<string, string[]> {
    const editableMap = new Map<string, string[]>();

    // Only overlay text shapes are editable
    const overlayIds = (this.settings.overlays || []).map(o => o.id);
    editableMap.set('media-slide', overlayIds);

    return editableMap;
  }

  getPreview(): {
    title: string;
    subtitle?: string;
    thumbnail?: string;
    duration?: number;
  } {
    const subtitle = this.settings.mediaType === 'video' ? 'Video' : 'Image';

    return {
      title: this.content.metadata.title,
      subtitle,
      thumbnail: this.settings.mediaType === 'image' ? this.settings.mediaUrl : undefined,
      duration: this.content.metadata.duration
    };
  }

  clone(): MediaContentType {
    return new MediaContentType(
      JSON.parse(JSON.stringify(this.content)),
      JSON.parse(JSON.stringify(this.settings))
    );
  }

  /**
   * Add overlay text to media
   */
  addOverlay(overlay: MediaOverlay): void {
    if (!this.settings.overlays) {
      this.settings.overlays = [];
    }
    this.settings.overlays.push(overlay);
  }

  /**
   * Remove overlay by ID
   */
  removeOverlay(overlayId: string): void {
    if (!this.settings.overlays) return;
    this.settings.overlays = this.settings.overlays.filter(o => o.id !== overlayId);
  }

  /**
   * Update overlay
   */
  updateOverlay(overlayId: string, updates: Partial<MediaOverlay>): void {
    if (!this.settings.overlays) return;
    const overlay = this.settings.overlays.find(o => o.id === overlayId);
    if (overlay) {
      Object.assign(overlay, updates);
    }
  }

  /**
   * Update media transform (crop, position, size)
   */
  updateTransform(transform: Partial<MediaTransform>): void {
    this.settings.transform = { ...this.settings.transform, ...transform };
  }

  /**
   * Update filters
   */
  updateFilters(filters: Partial<MediaSlideSettings['filters']>): void {
    this.settings.filters = { ...this.settings.filters, ...filters };
  }

  /**
   * Get content type capabilities
   */
  static getCapabilities(): ContentTypeCapabilities {
    return {
      supportsTextEditing: true, // Overlays only
      supportsMedia: true,
      supportsBackgrounds: true,
      supportsMultipleSlides: false, // Media is typically single-slide
      supportsTemplateOverrides: false, // Media doesn't use templates
      supportsTiming: true, // Video duration/timing
      supportsTransitions: false,
      fullyEditable: false, // Media file itself is not editable
      hasViewOnlyElements: true // The media (image/video) is view-only
    };
  }
}
