import {
  BaseContentType,
  ContentTypeId,
  ValidationResult,
  GeneratedSlide,
  ContentTypeCapabilities
} from './ContentType';
import { AnnouncementTemplate, AnnouncementSlideContent } from '../templates/AnnouncementTemplate';
import { BackgroundStyle } from '../types/shapes';

/**
 * Announcement type classification
 */
export type AnnouncementType = 'event' | 'announcement' | 'reminder' | 'welcome' | 'celebration';

/**
 * Announcement urgency level
 */
export type AnnouncementUrgency = 'low' | 'medium' | 'high';

/**
 * Event details for announcements
 */
export interface EventDetails {
  date?: string;
  time?: string;
  location?: string;
  contact?: string;
}

/**
 * Announcement metadata
 */
export interface AnnouncementMetadata {
  title: string;
  type: AnnouncementType;
  urgency: AnnouncementUrgency;
  createdAt?: Date;
  validUntil?: Date; // When this announcement expires
  category?: string;
  tags?: string[];
}

/**
 * Announcement slide settings
 */
export interface AnnouncementSlideSettings {
  background: BackgroundStyle;
  typography: {
    titleFontSize: number;
    messageFontSize: number;
    detailsFontSize: number;
    fontFamily: string;
    titleColor: string;
    messageColor: string;
    detailsColor: string;
  };
  layout: 'centered' | 'left-aligned' | 'modern' | 'classic';
  showBorder: boolean;
  borderColor?: string;
  imageUrl?: string;
  imagePosition?: 'top' | 'left' | 'right' | 'background';
}

/**
 * Complete announcement content data
 */
export interface AnnouncementData {
  metadata: AnnouncementMetadata;
  message: string;
  details?: string;
  eventDetails?: EventDetails;
  callToAction?: string;
}

/**
 * Announcement content type implementation
 *
 * Handles announcements with event details, urgency levels, and call-to-actions.
 * Announcements are fully editable with template-based layouts.
 */
export class AnnouncementContentType extends BaseContentType<AnnouncementData, AnnouncementSlideSettings> {
  readonly typeId: ContentTypeId = 'announcement';
  readonly typeName: string = 'Announcement';
  readonly description: string = 'Events, reminders, and church announcements';
  readonly icon: string = 'megaphone';

  constructor(
    content: AnnouncementData,
    settings?: Partial<AnnouncementSlideSettings>,
    template?: AnnouncementTemplate
  ) {
    const defaultSettings = AnnouncementContentType.getDefaultSettings();
    const mergedSettings = { ...defaultSettings, ...settings };

    super(content, mergedSettings, template);

    // Create default template if not provided
    if (!this.template) {
      this.template = new AnnouncementTemplate({ width: 1920, height: 1080 });
    }
  }

  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate metadata
    if (!this.content.metadata.title || this.content.metadata.title.trim() === '') {
      errors.push('Announcement title is required');
    }

    if (!this.content.message || this.content.message.trim() === '') {
      errors.push('Announcement message is required');
    }

    // Validate announcement type
    const validTypes: AnnouncementType[] = ['event', 'announcement', 'reminder', 'welcome', 'celebration'];
    if (!validTypes.includes(this.content.metadata.type)) {
      errors.push(`Invalid announcement type: ${this.content.metadata.type}`);
    }

    // Validate urgency
    const validUrgencies: AnnouncementUrgency[] = ['low', 'medium', 'high'];
    if (!validUrgencies.includes(this.content.metadata.urgency)) {
      errors.push(`Invalid urgency level: ${this.content.metadata.urgency}`);
    }

    // Warnings for event-type announcements
    if (this.content.metadata.type === 'event') {
      if (!this.content.eventDetails) {
        warnings.push('Event announcements should include event details');
      } else {
        if (!this.content.eventDetails.date) {
          warnings.push('Event date not specified');
        }
        if (!this.content.eventDetails.time) {
          warnings.push('Event time not specified');
        }
        if (!this.content.eventDetails.location) {
          warnings.push('Event location not specified');
        }
      }
    }

    // Warning for expired announcements
    if (this.content.metadata.validUntil && new Date(this.content.metadata.validUntil) < new Date()) {
      warnings.push('This announcement has expired');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  generateSlides(): GeneratedSlide[] {
    // Announcements are typically single-slide
    const slideContent: AnnouncementSlideContent = {
      title: this.content.metadata.title,
      message: this.content.message,
      details: this.content.details,
      date: this.content.eventDetails?.date,
      time: this.content.eventDetails?.time,
      location: this.content.eventDetails?.location,
      contact: this.content.eventDetails?.contact,
      imageUrl: this.settings.imageUrl,
      callToAction: this.content.callToAction,
      type: this.content.metadata.type,
      urgency: this.content.metadata.urgency,
      showLogo: false
    };

    const shapes = (this.template as AnnouncementTemplate).generateSlide(slideContent);

    // All text shapes are editable
    const editableShapeIds = shapes
      .filter(shape => shape.type === 'text')
      .map(shape => shape.id);

    const slide: GeneratedSlide = {
      id: `announcement-${this.content.metadata.title}`,
      shapes,
      background: this.settings.background,
      metadata: this.createSlideMetadata(
        'announcement-slide',
        editableShapeIds,
        this.template?.id
      )
    };

    return [slide];
  }

  getDefaultSettings(): AnnouncementSlideSettings {
    return {
      background: { type: 'color', value: '#1a1a2e' },
      typography: {
        titleFontSize: 64,
        messageFontSize: 40,
        detailsFontSize: 32,
        fontFamily: 'Arial, sans-serif',
        titleColor: '#f39c12',
        messageColor: '#ffffff',
        detailsColor: '#cbd5e0'
      },
      layout: 'modern',
      showBorder: false
    };
  }

  static getDefaultSettings(): AnnouncementSlideSettings {
    return {
      background: { type: 'color', value: '#1a1a2e' },
      typography: {
        titleFontSize: 64,
        messageFontSize: 40,
        detailsFontSize: 32,
        fontFamily: 'Arial, sans-serif',
        titleColor: '#f39c12',
        messageColor: '#ffffff',
        detailsColor: '#cbd5e0'
      },
      layout: 'modern',
      showBorder: false
    };
  }

  getEditableShapes(): Map<string, string[]> {
    // All text shapes in announcement slides are editable
    const editableMap = new Map<string, string[]>();

    const slides = this.generateSlides();
    slides.forEach(slide => {
      const textShapeIds = slide.shapes
        .filter(shape => shape.type === 'text')
        .map(shape => shape.id);
      editableMap.set(slide.id, textShapeIds);
    });

    return editableMap;
  }

  getPreview(): {
    title: string;
    subtitle?: string;
    thumbnail?: string;
    duration?: number;
  } {
    const typeLabel = this.content.metadata.type.charAt(0).toUpperCase() + this.content.metadata.type.slice(1);

    let subtitle = typeLabel;
    if (this.content.eventDetails?.date) {
      subtitle += ` • ${this.content.eventDetails.date}`;
    }

    return {
      title: this.content.metadata.title,
      subtitle,
      thumbnail: this.settings.imageUrl,
      duration: 15 // Typical announcement duration
    };
  }

  clone(): AnnouncementContentType {
    return new AnnouncementContentType(
      JSON.parse(JSON.stringify(this.content)),
      JSON.parse(JSON.stringify(this.settings)),
      this.template
    );
  }

  /**
   * Check if announcement is expired
   */
  isExpired(): boolean {
    if (!this.content.metadata.validUntil) return false;
    return new Date(this.content.metadata.validUntil) < new Date();
  }

  /**
   * Update event details
   */
  updateEventDetails(details: Partial<EventDetails>): void {
    this.content.eventDetails = {
      ...this.content.eventDetails,
      ...details
    };
  }

  /**
   * Set urgency level
   */
  setUrgency(urgency: AnnouncementUrgency): void {
    this.content.metadata.urgency = urgency;

    // Update colors based on urgency
    if (urgency === 'high') {
      this.settings.typography.titleColor = '#dc2626'; // Red
    } else if (urgency === 'medium') {
      this.settings.typography.titleColor = '#f59e0b'; // Orange
    } else {
      this.settings.typography.titleColor = '#f39c12'; // Gold
    }
  }

  /**
   * Factory methods for common announcement types
   */
  static createEventAnnouncement(
    title: string,
    message: string,
    eventDetails: EventDetails,
    settings?: Partial<AnnouncementSlideSettings>
  ): AnnouncementContentType {
    return new AnnouncementContentType(
      {
        metadata: {
          title,
          type: 'event',
          urgency: 'medium'
        },
        message,
        eventDetails,
        callToAction: 'Join Us!'
      },
      settings
    );
  }

  static createWelcomeAnnouncement(
    title: string = 'Welcome!',
    message: string = "We're glad you're here today.",
    settings?: Partial<AnnouncementSlideSettings>
  ): AnnouncementContentType {
    return new AnnouncementContentType(
      {
        metadata: {
          title,
          type: 'welcome',
          urgency: 'low'
        },
        message
      },
      settings
    );
  }

  static createReminderAnnouncement(
    title: string,
    message: string,
    urgency: AnnouncementUrgency = 'medium',
    settings?: Partial<AnnouncementSlideSettings>
  ): AnnouncementContentType {
    return new AnnouncementContentType(
      {
        metadata: {
          title,
          type: 'reminder',
          urgency
        },
        message,
        callToAction: "Don't Forget!"
      },
      settings
    );
  }

  static createCelebrationAnnouncement(
    title: string,
    message: string,
    details?: string,
    settings?: Partial<AnnouncementSlideSettings>
  ): AnnouncementContentType {
    return new AnnouncementContentType(
      {
        metadata: {
          title,
          type: 'celebration',
          urgency: 'low'
        },
        message,
        details,
        callToAction: 'Celebrate with us!'
      },
      settings
    );
  }

  /**
   * Get content type capabilities
   */
  static getCapabilities(): ContentTypeCapabilities {
    return {
      supportsTextEditing: true,
      supportsMedia: true, // Can have image backgrounds
      supportsBackgrounds: true,
      supportsMultipleSlides: false, // Typically single-slide
      supportsTemplateOverrides: true,
      supportsTiming: true,
      supportsTransitions: false,
      fullyEditable: true,
      hasViewOnlyElements: false // All shapes are editable
    };
  }
}
