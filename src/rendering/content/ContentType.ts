import { Shape } from '../core/Shape';
import { BackgroundStyle } from '../types/shapes';
import { SlideTemplate } from '../templates/SlideTemplate';

/**
 * Content type identifier for all presentation content
 */
export type ContentTypeId = 'song' | 'media' | 'announcement' | 'scripture' | 'custom';

/**
 * Validation result for content
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Slide metadata for tracking content type and editability
 */
export interface SlideMetadata {
  contentType: ContentTypeId;
  templateId?: string;
  editability: {
    locked: boolean;
    editableShapes: string[]; // Shape IDs that can be edited
    nonEditableShapes: string[]; // Shape IDs that are view-only
  };
  customOverrides?: {
    placeholderId: string;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    style?: any;
  }[];
}

/**
 * Generated slide with full shape array and metadata
 */
export interface GeneratedSlide {
  id: string;
  shapes: Shape[];
  background: BackgroundStyle;
  metadata: SlideMetadata;
}

/**
 * Base interface for all content types
 *
 * This interface defines the contract that all content types must implement.
 * Each content type (Song, Media, Announcement, etc.) extends this interface
 * with their specific properties and implements the required methods.
 */
export interface ContentType<TContent = any, TSettings = any> {
  /**
   * Unique identifier for this content type
   */
  readonly typeId: ContentTypeId;

  /**
   * Human-readable name for this content type
   */
  readonly typeName: string;

  /**
   * Description of this content type
   */
  readonly description: string;

  /**
   * Icon name for UI display (from lucide-react)
   */
  readonly icon: string;

  /**
   * The actual content data
   */
  content: TContent;

  /**
   * Settings/preferences for rendering this content type
   */
  settings: TSettings;

  /**
   * Template used for generating slides from this content
   */
  template?: SlideTemplate;

  /**
   * Validate the content data
   * @returns Validation result with errors and warnings
   */
  validate(): ValidationResult;

  /**
   * Generate slides from the content
   * @returns Array of generated slides with shapes and metadata
   */
  generateSlides(): GeneratedSlide[];

  /**
   * Get the default settings for this content type
   */
  getDefaultSettings(): TSettings;

  /**
   * Update settings for this content type
   * @param settings Partial settings to update
   */
  updateSettings(settings: Partial<TSettings>): void;

  /**
   * Serialize content to JSON for storage
   */
  toJSON(): {
    typeId: ContentTypeId;
    content: TContent;
    settings: TSettings;
    templateId?: string;
  };

  /**
   * Clone this content instance
   */
  clone(): ContentType<TContent, TSettings>;

  /**
   * Get list of editable shape IDs for each slide
   * This determines which shapes can be modified by the user
   */
  getEditableShapes(): Map<string, string[]>; // slideId -> shape IDs

  /**
   * Get preview information for this content (used in lists)
   */
  getPreview(): {
    title: string;
    subtitle?: string;
    thumbnail?: string;
    duration?: number; // Estimated duration in seconds
  };
}

/**
 * Factory interface for creating content type instances
 */
export interface ContentTypeFactory<TContent = any, TSettings = any> {
  /**
   * Content type ID this factory creates
   */
  readonly typeId: ContentTypeId;

  /**
   * Create a new content instance from raw data
   * @param data Raw content data
   * @param settings Optional settings override
   */
  create(data: TContent, settings?: Partial<TSettings>): ContentType<TContent, TSettings>;

  /**
   * Create content from JSON
   * @param json Serialized content
   */
  fromJSON(json: string | object): ContentType<TContent, TSettings>;

  /**
   * Get default/empty content
   */
  createEmpty(): ContentType<TContent, TSettings>;
}

/**
 * Abstract base class for content types
 * Provides common functionality and enforces the ContentType interface
 */
export abstract class BaseContentType<TContent = any, TSettings = any> implements ContentType<TContent, TSettings> {
  abstract readonly typeId: ContentTypeId;
  abstract readonly typeName: string;
  abstract readonly description: string;
  abstract readonly icon: string;

  public content: TContent;
  public settings: TSettings;
  public template?: SlideTemplate;

  constructor(content: TContent, settings: TSettings, template?: SlideTemplate) {
    this.content = content;
    this.settings = settings;
    this.template = template;
  }

  abstract validate(): ValidationResult;
  abstract generateSlides(): GeneratedSlide[];
  abstract getDefaultSettings(): TSettings;
  abstract getEditableShapes(): Map<string, string[]>;
  abstract getPreview(): {
    title: string;
    subtitle?: string;
    thumbnail?: string;
    duration?: number;
  };

  updateSettings(settings: Partial<TSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  toJSON(): {
    typeId: ContentTypeId;
    content: TContent;
    settings: TSettings;
    templateId?: string;
  } {
    return {
      typeId: this.typeId,
      content: this.content,
      settings: this.settings,
      templateId: this.template?.id
    };
  }

  abstract clone(): ContentType<TContent, TSettings>;

  /**
   * Helper method to create slide metadata
   */
  protected createSlideMetadata(
    slideId: string,
    editableShapeIds: string[],
    templateId?: string
  ): SlideMetadata {
    return {
      contentType: this.typeId,
      templateId,
      editability: {
        locked: false,
        editableShapes: editableShapeIds,
        nonEditableShapes: []
      }
    };
  }

  /**
   * Helper method to validate required fields
   */
  protected validateRequired(fields: Record<string, any>): string[] {
    const errors: string[] = [];

    for (const [field, value] of Object.entries(fields)) {
      if (value === undefined || value === null || value === '') {
        errors.push(`${field} is required`);
      }
    }

    return errors;
  }
}

/**
 * Content type capabilities/features
 * Used to determine what UI features to show for each content type
 */
export interface ContentTypeCapabilities {
  /**
   * Supports text editing
   */
  supportsTextEditing: boolean;

  /**
   * Supports media (image/video) embedding
   */
  supportsMedia: boolean;

  /**
   * Supports background customization
   */
  supportsBackgrounds: boolean;

  /**
   * Supports multiple slides per content item
   */
  supportsMultipleSlides: boolean;

  /**
   * Supports template customization/overrides
   */
  supportsTemplateOverrides: boolean;

  /**
   * Supports timing/duration settings
   */
  supportsTiming: boolean;

  /**
   * Supports transitions between slides
   */
  supportsTransitions: boolean;

  /**
   * Content is fully editable (all shapes)
   */
  fullyEditable: boolean;

  /**
   * Content has view-only elements (like media that can't be edited, only positioned)
   */
  hasViewOnlyElements: boolean;
}
