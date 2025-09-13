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

  constructor(slideSize: Size, style: ScriptureTemplateStyle = {}) {
    const placeholders: TemplatePlaceholder[] = [
      {
        id: 'verse',
        name: 'Bible Verse',
        type: 'text',
        bounds: { x: 80, y: 120, width: slideSize.width - 160, height: slideSize.height - 300 },
        required: true
      },
      {
        id: 'reference',
        name: 'Scripture Reference',
        type: 'text',
        bounds: { x: 80, y: slideSize.height - 140, width: slideSize.width - 160, height: 60 },
        required: true
      },
      {
        id: 'translation',
        name: 'Bible Translation',
        type: 'text',
        bounds: { x: 80, y: slideSize.height - 80, width: slideSize.width - 160, height: 40 },
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
      verseFontSize: 42,
      referenceFontSize: 32,
      translationFontSize: 24,
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

    // Background with subtle texture or gradient
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

    return this.createTextShape(
      placeholder,
      processedVerse,
      {
        fontFamily: this.theme.fonts.primary,
        fontSize: this.style.verseFontSize,
        color: this.theme.colors.text,
        textAlign: this.style.centerAlign ? 'center' : 'left',
        verticalAlign: 'middle',
        lineHeight: this.style.lineSpacing,
        fontWeight: 'normal',
        letterSpacing: 0.5
      }
    );
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

    return this.createTextShape(
      placeholder,
      formattedReference,
      {
        fontFamily: this.theme.fonts.display,
        fontSize: this.style.referenceFontSize,
        color: this.theme.colors.accent,
        textAlign: this.style.centerAlign ? 'center' : 'right',
        fontWeight: '600',
        fontStyle: 'italic'
      }
    );
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

    return this.createTextShape(
      placeholder,
      `— ${translation}`,
      {
        fontFamily: this.theme.fonts.secondary,
        fontSize: this.style.translationFontSize,
        color: this.theme.colors.textSecondary,
        textAlign: this.style.centerAlign ? 'center' : 'right',
        opacity: 0.8
      }
    );
  }

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

  // Utility method to break long passages into multiple slides
  public static splitLongPassage(
    verses: string,
    reference: string,
    maxWordsPerSlide: number = 50
  ): { verse: string; reference: string; slideNumber: number; totalSlides: number }[] {
    const words = verses.split(/\s+/);
    const slides: { verse: string; reference: string; slideNumber: number; totalSlides: number }[] = [];

    if (words.length <= maxWordsPerSlide) {
      return [{
        verse: verses,
        reference,
        slideNumber: 1,
        totalSlides: 1
      }];
    }

    const sentences = verses.split(/[.!?]+/).filter(s => s.trim());
    const totalSlides = Math.ceil(sentences.length / 2); // Rough estimate

    let currentSlide = '';
    let slideNumber = 1;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const testSlide = currentSlide + (currentSlide ? '. ' : '') + sentence;

      if (testSlide.split(/\s+/).length > maxWordsPerSlide && currentSlide) {
        // Start new slide
        slides.push({
          verse: currentSlide + '.',
          reference: `${reference} (${slideNumber}/${totalSlides})`,
          slideNumber,
          totalSlides
        });

        currentSlide = sentence;
        slideNumber++;
      } else {
        currentSlide = testSlide;
      }
    }

    // Add final slide
    if (currentSlide) {
      slides.push({
        verse: currentSlide + (sentences.length > 1 ? '.' : ''),
        reference: `${reference} (${slideNumber}/${slideNumber})`,
        slideNumber,
        totalSlides: slideNumber
      });
    }

    return slides;
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