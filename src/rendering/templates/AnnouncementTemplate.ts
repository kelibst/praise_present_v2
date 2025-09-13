import { SlideTemplate, SlideTemplateOptions, TemplateContent, TemplatePlaceholder } from './SlideTemplate';
import { Shape } from '../core/Shape';
import { TextShape } from '../shapes/TextShape';
import { BackgroundShape } from '../shapes/BackgroundShape';
import { ImageShape } from '../shapes/ImageShape';
import { RectangleShape } from '../shapes/RectangleShape';
import { Size, Color } from '../types/geometry';

export interface AnnouncementSlideContent extends TemplateContent {
  title: string;
  message: string;
  details?: string;
  date?: string;
  time?: string;
  location?: string;
  contact?: string;
  imageUrl?: string;
  callToAction?: string;
  type?: 'event' | 'announcement' | 'reminder' | 'welcome' | 'celebration';
  urgency?: 'low' | 'medium' | 'high';
  showLogo?: boolean;
}

export interface AnnouncementTemplateStyle {
  titleFontSize?: number;
  messageFontSize?: number;
  detailsFontSize?: number;
  ctaFontSize?: number;
  lineSpacing?: number;
  showBorder?: boolean;
  borderWidth?: number;
  cornerRadius?: number;
  imagePosition?: 'top' | 'left' | 'right' | 'background';
  imageSize?: 'small' | 'medium' | 'large';
  layout?: 'centered' | 'left-aligned' | 'modern' | 'classic';
}

export class AnnouncementTemplate extends SlideTemplate {
  private style: AnnouncementTemplateStyle;

  constructor(slideSize: Size, style: AnnouncementTemplateStyle = {}) {
    const placeholders: TemplatePlaceholder[] = [
      {
        id: 'title',
        name: 'Announcement Title',
        type: 'text',
        bounds: { x: 60, y: 60, width: slideSize.width - 120, height: 80 },
        required: true
      },
      {
        id: 'message',
        name: 'Main Message',
        type: 'text',
        bounds: { x: 60, y: 160, width: slideSize.width - 120, height: 200 },
        required: true
      },
      {
        id: 'details',
        name: 'Event Details',
        type: 'text',
        bounds: { x: 60, y: 380, width: slideSize.width - 120, height: 120 },
        required: false
      },
      {
        id: 'image',
        name: 'Announcement Image',
        type: 'image',
        bounds: { x: slideSize.width - 320, y: 160, width: 260, height: 200 },
        required: false
      },
      {
        id: 'call_to_action',
        name: 'Call to Action',
        type: 'text',
        bounds: { x: 60, y: slideSize.height - 80, width: slideSize.width - 120, height: 40 },
        required: false
      }
    ];

    const options: SlideTemplateOptions = {
      id: 'announcement-template',
      name: 'Announcement Template',
      category: 'announcement',
      slideSize,
      placeholders
    };

    super(options);

    this.style = {
      titleFontSize: 44,
      messageFontSize: 32,
      detailsFontSize: 26,
      ctaFontSize: 28,
      lineSpacing: 1.4,
      showBorder: false,
      borderWidth: 3,
      cornerRadius: 8,
      imagePosition: 'right',
      imageSize: 'medium',
      layout: 'modern',
      ...style
    };

    this.adjustPlaceholdersForLayout();
  }

  private adjustPlaceholdersForLayout(): void {
    const layout = this.style.layout;
    const imagePosition = this.style.imagePosition;

    // Adjust placeholder positions based on layout and image position
    if (imagePosition === 'left' || imagePosition === 'right') {
      const imageWidth = this.style.imageSize === 'large' ? 360 :
                        this.style.imageSize === 'medium' ? 260 : 180;

      const contentWidth = this.slideSize.width - imageWidth - 120;

      if (imagePosition === 'left') {
        // Move content to the right
        this.updatePlaceholderBounds('title', { x: imageWidth + 80, width: contentWidth });
        this.updatePlaceholderBounds('message', { x: imageWidth + 80, width: contentWidth });
        this.updatePlaceholderBounds('details', { x: imageWidth + 80, width: contentWidth });
        this.updatePlaceholderBounds('image', { x: 60, width: imageWidth });
      } else {
        // Keep content on the left, image on the right
        this.updatePlaceholderBounds('title', { width: contentWidth });
        this.updatePlaceholderBounds('message', { width: contentWidth });
        this.updatePlaceholderBounds('details', { width: contentWidth });
        this.updatePlaceholderBounds('image', { x: this.slideSize.width - imageWidth - 60, width: imageWidth });
      }
    }
  }

  private updatePlaceholderBounds(placeholderId: string, updates: Partial<{ x: number; y: number; width: number; height: number }>): void {
    const placeholder = this.placeholders.get(placeholderId);
    if (placeholder) {
      Object.assign(placeholder.bounds, updates);
    }
  }

  protected initializeTemplate(): void {
    // Template initialization is handled in generateSlide
    // since announcement slides are highly dynamic
  }

  public generateSlide(content: AnnouncementSlideContent): Shape[] {
    const shapes: Shape[] = [];

    // Background with theme-appropriate styling
    shapes.push(this.createAnnouncementBackground(content.type, content.urgency));

    // Optional border decoration
    if (this.style.showBorder) {
      shapes.push(this.createBorderDecoration(content.urgency));
    }

    // Title
    if (content.title) {
      const titleShape = this.createTitleShape(content.title, content.urgency);
      shapes.push(titleShape);
    }

    // Image (if provided)
    if (content.imageUrl && this.style.imagePosition !== 'background') {
      const imageShape = this.createImageShape(content.imageUrl);
      shapes.push(imageShape);
    }

    // Main message
    if (content.message) {
      const messageShape = this.createMessageShape(content.message);
      shapes.push(messageShape);
    }

    // Event details
    const details = this.formatEventDetails(content);
    if (details) {
      const detailsShape = this.createDetailsShape(details);
      shapes.push(detailsShape);
    }

    // Call to action
    if (content.callToAction) {
      const ctaShape = this.createCallToActionShape(content.callToAction, content.urgency);
      shapes.push(ctaShape);
    }

    return shapes;
  }

  private createAnnouncementBackground(type?: string, urgency?: string): BackgroundShape {
    let backgroundColor = this.theme.colors.background;

    // Adjust background based on announcement type and urgency
    switch (type) {
      case 'celebration':
        backgroundColor = this.blendColors(this.theme.colors.background, this.theme.colors.accent, 0.1);
        break;
      case 'welcome':
        backgroundColor = this.blendColors(this.theme.colors.background, this.theme.colors.primary, 0.05);
        break;
      case 'reminder':
        if (urgency === 'high') {
          backgroundColor = this.blendColors(this.theme.colors.background, { r: 220, g: 38, b: 38, a: 1 }, 0.1);
        }
        break;
    }

    return this.createBackgroundShape(backgroundColor);
  }

  private blendColors(color1: Color, color2: Color, ratio: number): Color {
    return {
      r: Math.round(color1.r * (1 - ratio) + color2.r * ratio),
      g: Math.round(color1.g * (1 - ratio) + color2.g * ratio),
      b: Math.round(color1.b * (1 - ratio) + color2.b * ratio),
      a: color1.a
    };
  }

  private createBorderDecoration(urgency?: string): RectangleShape {
    let borderColor = this.theme.colors.accent;

    if (urgency === 'high') {
      borderColor = { r: 220, g: 38, b: 38, a: 1 }; // Red for urgent
    } else if (urgency === 'medium') {
      borderColor = { r: 245, g: 158, b: 11, a: 1 }; // Orange for medium
    }

    return this.createRectangleShape(
      { x: 20, y: 20, width: this.slideSize.width - 40, height: this.slideSize.height - 40 },
      borderColor,
      {
        fillColor: { r: 0, g: 0, b: 0, a: 0 }, // Transparent fill
        strokeColor: borderColor,
        strokeWidth: this.style.borderWidth,
        cornerRadius: this.style.cornerRadius
      }
    );
  }

  private createTitleShape(title: string, urgency?: string): TextShape {
    const placeholder = this.getPlaceholder('title')!;

    let titleColor = this.theme.colors.accent;

    if (urgency === 'high') {
      titleColor = { r: 220, g: 38, b: 38, a: 1 }; // Red for urgent
    }

    return this.createTextShape(
      placeholder,
      title.toUpperCase(),
      {
        fontFamily: this.theme.fonts.display,
        fontSize: this.style.titleFontSize,
        color: titleColor,
        textAlign: this.style.layout === 'centered' ? 'center' : 'left',
        fontWeight: 'bold',
        letterSpacing: 1
      }
    );
  }

  private createImageShape(imageUrl: string): ImageShape {
    const placeholder = this.getPlaceholder('image')!;

    return this.createImageShape(placeholder, imageUrl, {
      preserveAspectRatio: true,
      cornerRadius: this.style.cornerRadius
    });
  }

  private createMessageShape(message: string): TextShape {
    const placeholder = this.getPlaceholder('message')!;

    return this.createTextShape(
      placeholder,
      message,
      {
        fontFamily: this.theme.fonts.primary,
        fontSize: this.style.messageFontSize,
        color: this.theme.colors.text,
        textAlign: this.style.layout === 'centered' ? 'center' : 'left',
        lineHeight: this.style.lineSpacing,
        fontWeight: 'normal'
      }
    );
  }

  private formatEventDetails(content: AnnouncementSlideContent): string {
    const details: string[] = [];

    if (content.date) {
      details.push(`📅 ${content.date}`);
    }

    if (content.time) {
      details.push(`⏰ ${content.time}`);
    }

    if (content.location) {
      details.push(`📍 ${content.location}`);
    }

    if (content.contact) {
      details.push(`📞 ${content.contact}`);
    }

    if (content.details) {
      details.push(content.details);
    }

    return details.join('\n');
  }

  private createDetailsShape(details: string): TextShape {
    const placeholder = this.getPlaceholder('details')!;

    return this.createTextShape(
      placeholder,
      details,
      {
        fontFamily: this.theme.fonts.secondary,
        fontSize: this.style.detailsFontSize,
        color: this.theme.colors.textSecondary,
        textAlign: this.style.layout === 'centered' ? 'center' : 'left',
        lineHeight: this.style.lineSpacing
      }
    );
  }

  private createCallToActionShape(callToAction: string, urgency?: string): TextShape {
    const placeholder = this.getPlaceholder('call_to_action')!;

    let ctaColor = this.theme.colors.accent;
    if (urgency === 'high') {
      ctaColor = { r: 220, g: 38, b: 38, a: 1 };
    }

    return this.createTextShape(
      placeholder,
      callToAction.toUpperCase(),
      {
        fontFamily: this.theme.fonts.display,
        fontSize: this.style.ctaFontSize,
        color: ctaColor,
        textAlign: this.style.layout === 'centered' ? 'center' : 'left',
        fontWeight: 'bold',
        letterSpacing: 0.5
      }
    );
  }

  public static createEventSlide(
    title: string,
    message: string,
    date: string,
    time: string,
    location: string,
    contact?: string
  ): AnnouncementSlideContent {
    return {
      title,
      message,
      date,
      time,
      location,
      contact,
      type: 'event',
      urgency: 'medium',
      callToAction: 'Join Us!'
    };
  }

  public static createWelcomeSlide(
    title: string = 'Welcome!',
    message: string = 'We\'re glad you\'re here today.',
    additionalMessage?: string
  ): AnnouncementSlideContent {
    const fullMessage = additionalMessage ? `${message}\n\n${additionalMessage}` : message;

    return {
      title,
      message: fullMessage,
      type: 'welcome',
      urgency: 'low'
    };
  }

  public static createReminderSlide(
    title: string,
    message: string,
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): AnnouncementSlideContent {
    return {
      title,
      message,
      type: 'reminder',
      urgency,
      callToAction: 'Don\'t Forget!'
    };
  }

  public static createCelebrationSlide(
    title: string,
    message: string,
    details?: string
  ): AnnouncementSlideContent {
    return {
      title,
      message,
      details,
      type: 'celebration',
      urgency: 'low',
      callToAction: 'Celebrate with us!'
    };
  }

  public setStyle(style: AnnouncementTemplateStyle): void {
    this.style = { ...this.style, ...style };
    this.adjustPlaceholdersForLayout();
  }

  public getStyle(): AnnouncementTemplateStyle {
    return { ...this.style };
  }

  public clone(): AnnouncementTemplate {
    return new AnnouncementTemplate(this.slideSize, this.style);
  }
}