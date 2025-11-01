import { SlideTemplate, SlideTemplateOptions, TemplateContent, TemplatePlaceholder } from './SlideTemplate';
import { Shape } from '../core/Shape';
import { TextShape } from '../shapes/TextShape';
import { BackgroundShape } from '../shapes/BackgroundShape';
import { Size, Color } from '../types/geometry';

export interface SermonSlideContent extends TemplateContent {
  title: string;
  speaker?: string;
  date?: string;
  scriptureReference?: string;
  outlinePoints?: string[];
  notes?: string;
  slideType?: 'title' | 'outline' | 'point' | 'scripture' | 'notes';
  pointIndex?: number;
}

export interface SermonTemplateStyle {
  titleFontSize?: number;
  speakerFontSize?: number;
  outlineFontSize?: number;
  pointFontSize?: number;
  lineSpacing?: number;
  centerAlign?: boolean;
}

/**
 * SermonTemplate - Generates slides for sermon presentations
 *
 * Slide Types:
 * - Title Slide: Sermon title, speaker, date, scripture reference
 * - Outline Slide: Full sermon outline with numbered points
 * - Point Slides: Individual slides for each outline point
 * - Scripture Reference Slides: Key scripture passages
 * - Notes Slide: Additional notes or closing thoughts
 *
 * TODO: Future enhancements:
 * - Integration with ScriptureTemplate for embedded verses
 * - Multiple outline levels (sub-points)
 * - Media integration (images, videos)
 * - Timer/duration tracking
 * - Presenter notes (separate from slide content)
 * - Interactive elements
 */
export class SermonTemplate extends SlideTemplate {
  private style: SermonTemplateStyle;

  constructor(slideSize: Size = { width: 1920, height: 1080 }, style: SermonTemplateStyle = {}) {
    const placeholders: TemplatePlaceholder[] = [
      {
        id: 'title',
        name: 'Sermon Title',
        type: 'text',
        bounds: { x: 100, y: 300, width: 1720, height: 200 },
        required: true
      },
      {
        id: 'subtitle',
        name: 'Subtitle/Speaker',
        type: 'text',
        bounds: { x: 100, y: 550, width: 1720, height: 100 },
        required: false
      },
      {
        id: 'content',
        name: 'Main Content',
        type: 'text',
        bounds: { x: 100, y: 200, width: 1720, height: 800 },
        required: true
      },
      {
        id: 'footer',
        name: 'Footer',
        type: 'text',
        bounds: { x: 100, y: 1000, width: 1720, height: 60 },
        required: false
      }
    ];

    const options: SlideTemplateOptions = {
      id: 'sermon-template',
      name: 'Sermon Template',
      category: 'sermon',
      slideSize,
      placeholders
    };

    super(options);

    this.style = {
      titleFontSize: 80,
      speakerFontSize: 40,
      outlineFontSize: 48,
      pointFontSize: 64,
      lineSpacing: 1.4,
      centerAlign: true,
      ...style
    };
  }

  protected initializeTemplate(): void {
    // Template initialization handled in generateSlide
  }

  public generateSlide(content: SermonSlideContent): Shape[] {
    const shapes: Shape[] = [];

    // Background
    shapes.push(this.createBackgroundShape());

    // Route to appropriate slide generator based on type
    switch (content.slideType) {
      case 'title':
        return this.generateTitleSlide(content);
      case 'outline':
        return this.generateOutlineSlide(content);
      case 'point':
        return this.generatePointSlide(content);
      case 'notes':
        return this.generateNotesSlide(content);
      default:
        return this.generateTitleSlide(content);
    }
  }

  /**
   * Generate title slide for sermon
   */
  private generateTitleSlide(content: SermonSlideContent): Shape[] {
    const shapes: Shape[] = [];

    // Background
    shapes.push(this.createBackgroundShape());

    // Sermon Title (Large, centered)
    const titleShape = new TextShape({
      id: 'title',
      text: content.title,
      position: { x: 100, y: 300 },
      size: { width: 1720, height: 200 },
      autoSize: false,
      wordWrap: true,
      metadata: { elementType: 'title' }
    }, {
      fontFamily: this.theme.fonts.display,
      fontSize: this.style.titleFontSize!,
      color: this.theme.colors.accent,
      textAlign: this.style.centerAlign ? 'center' : 'left',
      verticalAlign: 'middle',
      fontWeight: 'bold',
      lineHeight: 1.2
    });
    shapes.push(titleShape);

    // Speaker & Date (Below title)
    const speakerParts: string[] = [];
    if (content.speaker) speakerParts.push(content.speaker);
    if (content.date) speakerParts.push(content.date);

    if (speakerParts.length > 0) {
      const speakerShape = new TextShape({
        id: 'speaker',
        text: speakerParts.join(' • '),
        position: { x: 100, y: 550 },
        size: { width: 1720, height: 80 },
        autoSize: false,
        metadata: { elementType: 'speaker' }
      }, {
        fontFamily: this.theme.fonts.secondary,
        fontSize: this.style.speakerFontSize!,
        color: this.theme.colors.textSecondary,
        textAlign: this.style.centerAlign ? 'center' : 'left',
        verticalAlign: 'middle'
      });
      shapes.push(speakerShape);
    }

    // Scripture Reference (Below speaker)
    if (content.scriptureReference) {
      const scriptureShape = new TextShape({
        id: 'scripture-reference',
        text: content.scriptureReference,
        position: { x: 100, y: 650 },
        size: { width: 1720, height: 60 },
        autoSize: false,
        metadata: { elementType: 'scripture-reference' }
      }, {
        fontFamily: this.theme.fonts.secondary,
        fontSize: 36,
        color: this.theme.colors.secondary,
        textAlign: this.style.centerAlign ? 'center' : 'left',
        verticalAlign: 'middle',
        fontStyle: 'italic'
      });
      shapes.push(scriptureShape);
    }

    return shapes;
  }

  /**
   * Generate outline slide showing all points
   */
  private generateOutlineSlide(content: SermonSlideContent): Shape[] {
    const shapes: Shape[] = [];

    // Background
    shapes.push(this.createBackgroundShape());

    // Title
    const titleShape = new TextShape({
      id: 'outline-title',
      text: 'Sermon Outline',
      position: { x: 100, y: 100 },
      size: { width: 1720, height: 80 },
      autoSize: false,
      metadata: { elementType: 'outline-title' }
    }, {
      fontFamily: this.theme.fonts.display,
      fontSize: 56,
      color: this.theme.colors.accent,
      textAlign: this.style.centerAlign ? 'center' : 'left',
      fontWeight: 'bold'
    });
    shapes.push(titleShape);

    // Outline Points
    if (content.outlinePoints && content.outlinePoints.length > 0) {
      const outlineText = content.outlinePoints
        .map((point, index) => `${index + 1}. ${point}`)
        .join('\n\n');

      const outlineShape = new TextShape({
        id: 'outline-points',
        text: outlineText,
        position: { x: 150, y: 220 },
        size: { width: 1620, height: 780 },
        autoSize: false,
        wordWrap: true,
        metadata: { elementType: 'outline-points' }
      }, {
        fontFamily: this.theme.fonts.primary,
        fontSize: this.style.outlineFontSize!,
        color: this.theme.colors.text,
        textAlign: 'left',
        verticalAlign: 'top',
        lineHeight: this.style.lineSpacing
      });
      shapes.push(outlineShape);
    }

    return shapes;
  }

  /**
   * Generate slide for individual sermon point
   */
  private generatePointSlide(content: SermonSlideContent): Shape[] {
    const shapes: Shape[] = [];

    // Background
    shapes.push(this.createBackgroundShape());

    // Point number (small, top)
    if (content.pointIndex !== undefined) {
      const pointNumberShape = new TextShape({
        id: 'point-number',
        text: `Point ${content.pointIndex + 1}`,
        position: { x: 100, y: 80 },
        size: { width: 1720, height: 50 },
        autoSize: false,
        metadata: { elementType: 'point-number' }
      }, {
        fontFamily: this.theme.fonts.secondary,
        fontSize: 32,
        color: this.theme.colors.textSecondary,
        textAlign: this.style.centerAlign ? 'center' : 'left',
        fontStyle: 'italic'
      });
      shapes.push(pointNumberShape);
    }

    // Point text (large, centered)
    const pointShape = new TextShape({
      id: 'point-text',
      text: content.title,
      position: { x: 100, y: 350 },
      size: { width: 1720, height: 400 },
      autoSize: false,
      wordWrap: true,
      metadata: { elementType: 'point-text' }
    }, {
      fontFamily: this.theme.fonts.display,
      fontSize: this.style.pointFontSize!,
      color: this.theme.colors.accent,
      textAlign: this.style.centerAlign ? 'center' : 'left',
      verticalAlign: 'middle',
      fontWeight: 'bold',
      lineHeight: 1.3
    });
    shapes.push(pointShape);

    // Scripture reference (if provided)
    if (content.scriptureReference) {
      const scriptureShape = new TextShape({
        id: 'scripture-ref',
        text: content.scriptureReference,
        position: { x: 100, y: 850 },
        size: { width: 1720, height: 60 },
        autoSize: false,
        metadata: { elementType: 'scripture-ref' }
      }, {
        fontFamily: this.theme.fonts.secondary,
        fontSize: 36,
        color: this.theme.colors.secondary,
        textAlign: this.style.centerAlign ? 'center' : 'left',
        fontStyle: 'italic'
      });
      shapes.push(scriptureShape);
    }

    return shapes;
  }

  /**
   * Generate notes slide
   */
  private generateNotesSlide(content: SermonSlideContent): Shape[] {
    const shapes: Shape[] = [];

    // Background
    shapes.push(this.createBackgroundShape());

    // Title
    const titleShape = new TextShape({
      id: 'notes-title',
      text: 'Notes & Reflections',
      position: { x: 100, y: 100 },
      size: { width: 1720, height: 80 },
      autoSize: false,
      metadata: { elementType: 'notes-title' }
    }, {
      fontFamily: this.theme.fonts.display,
      fontSize: 56,
      color: this.theme.colors.accent,
      textAlign: this.style.centerAlign ? 'center' : 'left',
      fontWeight: 'bold'
    });
    shapes.push(titleShape);

    // Notes content
    if (content.notes) {
      const notesShape = new TextShape({
        id: 'notes-content',
        text: content.notes,
        position: { x: 150, y: 220 },
        size: { width: 1620, height: 780 },
        autoSize: false,
        wordWrap: true,
        metadata: { elementType: 'notes-content' }
      }, {
        fontFamily: this.theme.fonts.primary,
        fontSize: 44,
        color: this.theme.colors.text,
        textAlign: 'left',
        verticalAlign: 'top',
        lineHeight: this.style.lineSpacing
      });
      shapes.push(notesShape);
    }

    return shapes;
  }

  public setStyle(style: SermonTemplateStyle): void {
    this.style = { ...this.style, ...style };
  }

  public getStyle(): SermonTemplateStyle {
    return { ...this.style };
  }

  public clone(): SermonTemplate {
    return new SermonTemplate(this.slideSize, this.style);
  }
}
