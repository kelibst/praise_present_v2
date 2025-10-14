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
  // Optional settings override (from feature settings)
  featureSettings?: {
    background?: any; // SlideBackground type
    typography?: {
      verseFontSize?: number;
      referenceFontSize?: number;
      translationFontSize?: number;
      fontFamily?: string;
      textColor?: string;
      textAlign?: 'left' | 'center' | 'right';
      bold?: boolean;
      italic?: boolean;
      lineHeight?: number;
    };
  };
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
        id: 'reference',
        name: 'Scripture Reference',
        type: 'text',
        bounds: { x: 100, y: 40, width: 1720, height: 80 }, // Reference at top
        required: true
      },
      {
        id: 'translation',
        name: 'Bible Translation',
        type: 'text',
        bounds: { x: 100, y: 125, width: 1720, height: 60 }, // Translation below reference
        required: false
      },
      {
        id: 'verse',
        name: 'Bible Verse',
        type: 'text',
        bounds: { x: 100, y: 220, width: 1720, height: 800 }, // Main verse area - below reference
        required: true
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

    // Apply feature settings if provided (override template defaults)
    if (content.featureSettings?.typography) {
      const typo = content.featureSettings.typography;
      this.style = {
        ...this.style,
        verseFontSize: typo.verseFontSize ?? this.style.verseFontSize,
        referenceFontSize: typo.referenceFontSize ?? this.style.referenceFontSize,
        translationFontSize: typo.translationFontSize ?? this.style.translationFontSize,
        centerAlign: typo.textAlign === 'center',
        lineSpacing: typo.lineHeight ?? this.style.lineSpacing
      };
    }

    // Background is handled by SlideRenderer when using featureSettings
    // Only add template background if no featureSettings background is provided
    if (!content.featureSettings?.background) {
      shapes.push(this.createScriptureBackground(content.theme));
    }

    // Main verse text
    if (content.verse) {
      const verseShape = this.createVerseShape(content.verse, content.featureSettings?.typography);
      shapes.push(verseShape);
    }

    // Reference
    if (content.reference) {
      const referenceShape = this.createReferenceShape(content.reference, content.featureSettings?.typography);
      shapes.push(referenceShape);
    }

    // Translation
    if (content.showTranslation && content.translation) {
      const translationShape = this.createTranslationShape(content.translation, content.featureSettings?.typography);
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

  private createVerseShape(verse: string, typography?: any): TextShape {
    const placeholder = this.getPlaceholder('verse')!;

    // Process the verse text
    let processedVerse = this.processVerseText(verse);

    // Apply typography from feature settings or use defaults
    const fontFamily = typography?.fontFamily || this.theme.fonts.primary;
    const fontSize = typography?.verseFontSize || this.style.verseFontSize!;
    // CRITICAL: Use text color from settings if provided, otherwise fallback to theme
    const textColor = typography?.textColor || this.rgbToHex(this.theme.colors.text);
    const textAlign = typography?.textAlign || (this.style.centerAlign ? 'center' : 'left');
    const fontWeight = typography?.bold ? 'bold' : 'normal';
    const fontStyle = typography?.italic ? 'italic' : 'normal';
    const lineHeight = typography?.lineHeight || this.style.lineSpacing;

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
      maxFontSize: fontSize // User's preferred size is the max
    }, {
      fontFamily,
      fontSize,
      color: textColor,
      textAlign: textAlign as any,
      verticalAlign: 'middle',
      fontWeight: fontWeight as any,
      fontStyle: fontStyle as any,
      lineHeight
    });

    console.log('🔍 ScriptureTemplate: Created verse shape with feature settings', {
      id: textShape.id,
      type: textShape.type,
      overflowBehavior: textShape.overflowBehavior,
      fontSize,
      fontFamily,
      textColor,
      text: processedVerse.substring(0, 30)
    });

    return textShape;
  }

  private rgbToHex(color: Color | string): string {
    if (typeof color === 'string') return color;
    return `#${((1 << 24) + (color.r << 16) + (color.g << 8) + color.b).toString(16).slice(1)}`;
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

  private createReferenceShape(reference: string, typography?: any): TextShape {
    const placeholder = this.getPlaceholder('reference')!;

    // Format the reference nicely
    const formattedReference = this.formatReference(reference);

    // Apply typography from feature settings or use defaults
    const fontFamily = typography?.fontFamily || this.theme.fonts.display;
    const fontSize = typography?.referenceFontSize || this.style.referenceFontSize!;
    // CRITICAL: Use same text color as verse if provided, otherwise fallback to white for visibility
    const textColor = typography?.textColor || '#ffffff';
    const textAlign = typography?.textAlign || (this.style.centerAlign ? 'center' : 'right');

    // Reference should stay fixed size - no auto-shrink (user expects consistent reference size)
    const referenceShape = new TextShape({
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
      fontFamily,
      fontSize,
      color: textColor,
      textAlign: textAlign as any,
      fontWeight: 'bold',
      fontStyle: 'italic'
    });

    console.log('📖 ScriptureTemplate: Created reference shape', {
      text: formattedReference,
      position: { x: placeholder.bounds.x, y: placeholder.bounds.y },
      size: { width: placeholder.bounds.width, height: placeholder.bounds.height },
      color: textColor,
      textAlign,
      fontSize
    });

    return referenceShape;
  }

  private formatReference(reference: string): string {
    // Ensure proper formatting for common patterns
    return reference
      .trim()
      .replace(/(\d+):(\d+)-(\d+)/g, '$1:$2-$3') // Ensure proper verse range formatting
      .replace(/(\d+):(\d+)/g, '$1:$2'); // Ensure proper verse formatting
  }

  private createTranslationShape(translation: string, typography?: any): TextShape {
    const placeholder = this.getPlaceholder('translation')!;

    // Apply typography from feature settings or use defaults
    const fontFamily = typography?.fontFamily || this.theme.fonts.secondary;
    const fontSize = typography?.translationFontSize || this.style.translationFontSize!;
    // CRITICAL: Use same text color as verse if provided, otherwise fallback to white for visibility
    const textColor = typography?.textColor || '#ffffff';
    const textAlign = typography?.textAlign || (this.style.centerAlign ? 'center' : 'right');

    // Translation should stay fixed size - no auto-shrink
    const translationShape = new TextShape({
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
      fontFamily,
      fontSize,
      color: textColor,
      textAlign: textAlign as any,
      opacity: 0.8
    });

    console.log('📖 ScriptureTemplate: Created translation shape', {
      text: `— ${translation}`,
      position: { x: placeholder.bounds.x, y: placeholder.bounds.y },
      size: { width: placeholder.bounds.width, height: placeholder.bounds.height },
      color: textColor,
      textAlign,
      fontSize,
      opacity: 0.8
    });

    return translationShape;
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
