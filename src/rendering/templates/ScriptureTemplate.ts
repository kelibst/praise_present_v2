import { SlideTemplate, SlideTemplateOptions, TemplateContent, TemplatePlaceholder } from './SlideTemplate';
import { Shape } from '../core/Shape';
import { TextShape } from '../shapes/TextShape';
import { BackgroundShape } from '../shapes/BackgroundShape';
import { Size, Color } from '../types/geometry';

export interface ScriptureSlideContent extends TemplateContent {
  verse: string;
  reference: string;
  translation?: string;
  book?: string;
  chapter?: number;
  verseNumber?: number;
  verseRange?: string; // e.g., "16-17"
  theme?: 'reading' | 'meditation' | 'memory' | 'announcement';
  showTranslation?: boolean;
  emphasizeReference?: boolean;
}

export interface ScriptureTemplateStyle {
  verseFontSize?: number;
  referenceFontSize?: number;
  translationFontSize?: number;
  lineSpacing?: number;
  verseSpacing?: number;
  centerAlign?: boolean;
  showQuotationMarks?: boolean;
  emphasizeKeyWords?: boolean;
  keyWords?: string[];
}

export class ScriptureTemplate extends SlideTemplate {
  private style: ScriptureTemplateStyle;

  constructor(slideSize: Size = { width: 1920, height: 1080 }, style: ScriptureTemplateStyle = {}) {
    // Fixed positions for 1920x1080 resolution (PowerPoint pattern)
    const placeholders: TemplatePlaceholder[] = [
      {
        id: 'verse',
        name: 'Bible Verse',
        type: 'text',
        bounds: { x: 100, y: 200, width: 1720, height: 600 }, // Main verse area
        required: true
      },
      {
        id: 'reference',
        name: 'Scripture Reference',
        type: 'text',
        bounds: { x: 1200, y: 900, width: 600, height: 80 }, // Bottom right
        required: true
      },
      {
        id: 'translation',
        name: 'Bible Translation',
        type: 'text',
        bounds: { x: 1200, y: 980, width: 600, height: 60 }, // Below reference
        required: false
      }
    ];

    const options: SlideTemplateOptions = {
      id: 'scripture-template',
      name: 'Scripture Template',
      category: 'scripture',
      slideSize,
      placeholders
    };

    super(options);

    this.style = {
      verseFontSize: 64,        // Large font for 1920x1080
      referenceFontSize: 36,    // Medium font for reference
      translationFontSize: 28,  // Smaller font for translation
      lineSpacing: 1.5,
      verseSpacing: 2.0,
      centerAlign: true,
      showQuotationMarks: true,
      emphasizeKeyWords: false,
      keyWords: [],
      ...style
    };
  }

  protected initializeTemplate(): void {
    // Template initialization is handled in generateSlide
    // since scripture slides are highly dynamic based on content
  }

  public generateSlide(content: ScriptureSlideContent): Shape[] {
    const shapes: Shape[] = [];

    // Background with solid color (simplified for PowerPoint pattern)
    shapes.push(this.createScriptureBackground(content.theme));

    // Main verse text
    if (content.verse) {
      const verseShape = this.createVerseShape(content.verse);
      shapes.push(verseShape);
    }

    // Reference
    if (content.reference) {
      const referenceShape = this.createReferenceShape(content.reference);
      shapes.push(referenceShape);
    }

    // Translation
    if (content.showTranslation && content.translation) {
      const translationShape = this.createTranslationShape(content.translation);
      shapes.push(translationShape);
    }

    return shapes;
  }

  private createScriptureBackground(theme?: string): BackgroundShape {
    let backgroundColor = this.theme.colors.background;

    // Adjust background based on scripture theme
    switch (theme) {
      case 'meditation':
        backgroundColor = this.blendColors(this.theme.colors.background, this.theme.colors.primary, 0.1);
        break;
      case 'memory':
        backgroundColor = this.blendColors(this.theme.colors.background, this.theme.colors.accent, 0.05);
        break;
      case 'announcement':
        backgroundColor = this.blendColors(this.theme.colors.background, this.theme.colors.secondary, 0.1);
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

  private createVerseShape(verse: string): TextShape {
    const placeholder = this.getPlaceholder('verse')!;

    // Process the verse text
    let processedVerse = this.processVerseText(verse);

    // Create TextShape with shrink-to-fit behavior (PowerPoint-style)
    const textShape = new TextShape({
      text: processedVerse,
      position: {
        x: placeholder.bounds.x,
        y: placeholder.bounds.y
      },
      size: {
        width: placeholder.bounds.width,
        height: placeholder.bounds.height
      },
      wordWrap: true,
      autoSize: false, // Fixed bounds - never expand
      overflowBehavior: 'shrink-to-fit', // PowerPoint-style: shrink font if text overflows
      minFontSize: 24, // Don't shrink smaller than 24px for readability
      maxFontSize: this.style.verseFontSize // User's preferred size is the max
    }, {
      fontFamily: this.theme.fonts.primary,
      fontSize: this.style.verseFontSize!,
      color: this.theme.colors.text,
      textAlign: this.style.centerAlign ? 'center' : 'left',
      verticalAlign: 'middle',
      fontWeight: 'normal',
      lineHeight: this.style.lineSpacing
    });

    console.log('🔍 ScriptureTemplate: Created verse shape with shrink-to-fit', {
      id: textShape.id,
      type: textShape.type,
      overflowBehavior: textShape.overflowBehavior,
      fontSize: this.style.verseFontSize,
      minFontSize: 24,
      text: processedVerse.substring(0, 30)
    });

    return textShape;
  }

  private processVerseText(verse: string): string {
    let processed = verse.trim();

    // Add quotation marks if enabled
    if (this.style.showQuotationMarks && !processed.startsWith('"')) {
      processed = `"${processed}"`;
    }

    // Clean up spacing
    processed = processed
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
      .trim();

    return processed;
  }

  private createReferenceShape(reference: string): TextShape {
    const placeholder = this.getPlaceholder('reference')!;

    // Format the reference nicely
    const formattedReference = this.formatReference(reference);

    // Reference should stay fixed size - no auto-shrink (user expects consistent reference size)
    return new TextShape({
      text: formattedReference,
      position: {
        x: placeholder.bounds.x,
        y: placeholder.bounds.y
      },
      size: {
        width: placeholder.bounds.width,
        height: placeholder.bounds.height
      },
      wordWrap: false,
      autoSize: false,
      overflowBehavior: 'clip' // Reference stays fixed size
    }, {
      fontFamily: this.theme.fonts.display,
      fontSize: this.style.referenceFontSize!,
      color: this.theme.colors.accent,
      textAlign: this.style.centerAlign ? 'center' : 'right',
      fontWeight: 'bold',
      fontStyle: 'italic'
    });
  }

  private formatReference(reference: string): string {
    // Ensure proper formatting for common patterns
    return reference
      .trim()
      .replace(/(\d+):(\d+)-(\d+)/g, '$1:$2-$3') // Ensure proper verse range formatting
      .replace(/(\d+):(\d+)/g, '$1:$2'); // Ensure proper verse formatting
  }

  private createTranslationShape(translation: string): TextShape {
    const placeholder = this.getPlaceholder('translation')!;

    // Translation should stay fixed size - no auto-shrink
    return new TextShape({
      text: `— ${translation}`,
      position: {
        x: placeholder.bounds.x,
        y: placeholder.bounds.y
      },
      size: {
        width: placeholder.bounds.width,
        height: placeholder.bounds.height
      },
      wordWrap: false,
      autoSize: false,
      overflowBehavior: 'clip' // Translation stays fixed size
    }, {
      fontFamily: this.theme.fonts.secondary,
      fontSize: this.style.translationFontSize!,
      color: this.theme.colors.textSecondary,
      textAlign: this.style.centerAlign ? 'center' : 'right',
      opacity: 0.8
    });
  }

  // Static factory methods for creating different types of scripture slides
  public static createReadingSlide(
    verse: string,
    book: string,
    chapter: number,
    verseRange: string,
    translation: string = 'NIV'
  ): ScriptureSlideContent {
    const reference = `${book} ${chapter}:${verseRange}`;

    return {
      verse,
      reference,
      book,
      chapter,
      verseRange,
      translation,
      theme: 'reading',
      showTranslation: true,
      emphasizeReference: false
    };
  }

  public static createMemoryVerseSlide(
    verse: string,
    book: string,
    chapter: number,
    verseNumber: number,
    translation: string = 'NIV'
  ): ScriptureSlideContent {
    const reference = `${book} ${chapter}:${verseNumber}`;

    return {
      verse,
      reference,
      book,
      chapter,
      verseNumber,
      translation,
      theme: 'memory',
      showTranslation: true,
      emphasizeReference: true
    };
  }

  public static createMeditationSlide(
    verse: string,
    reference: string,
    translation: string = 'NIV'
  ): ScriptureSlideContent {
    return {
      verse,
      reference,
      translation,
      theme: 'meditation',
      showTranslation: false,
      emphasizeReference: false
    };
  }

  public static createAnnouncementSlide(
    verse: string,
    reference: string,
    translation: string = 'NIV'
  ): ScriptureSlideContent {
    return {
      verse,
      reference,
      translation,
      theme: 'announcement',
      showTranslation: true,
      emphasizeReference: false
    };
  }

  public setStyle(style: ScriptureTemplateStyle): void {
    this.style = { ...this.style, ...style };
  }

  public getStyle(): ScriptureTemplateStyle {
    return { ...this.style };
  }

  public clone(): ScriptureTemplate {
    return new ScriptureTemplate(this.slideSize, this.style);
  }
}
