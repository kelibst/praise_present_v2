import {
  BaseContentType,
  ContentTypeId,
  ValidationResult,
  GeneratedSlide,
  ContentTypeCapabilities,
  ContentTypeFactory
} from './ContentType';
import { ScriptureTemplate, ScriptureSlideContent } from '../templates/ScriptureTemplate';
import { BackgroundStyle } from '../types/shapes';
import { TextShape } from '../shapes/TextShape';

/**
 * Scripture theme variations
 */
export type ScriptureTheme = 'reading' | 'meditation' | 'memory' | 'announcement';

/**
 * Scripture metadata
 */
export interface ScriptureMetadata {
  book: string;               // "John"
  chapter: number;            // 3
  verseStart: number;         // 16
  verseEnd?: number;          // 17 (optional for ranges)
  translation: string;        // "NIV", "ESV", "KJV"
  theme?: ScriptureTheme;
}

/**
 * Individual verse data
 */
export interface VerseData {
  number: number;
  text: string;
}

/**
 * Scripture content structure
 */
export interface ScriptureContent {
  verses: VerseData[];
  reference: string;          // "John 3:16-17"
  displayReference?: string;  // "John 3:16-17 (NIV)"
}

/**
 * Complete scripture data
 */
export interface ScriptureData {
  metadata: ScriptureMetadata;
  content: ScriptureContent;
}

/**
 * Scripture slide settings
 */
export interface ScriptureSlideSettings {
  showTranslation: boolean;
  emphasizeReference: boolean;
  showVerseNumbers: boolean;
  theme: ScriptureTheme;
  maxVersesPerSlide: number;

  // Typography
  typography: {
    verseFontSize: number;
    referenceFontSize: number;
    translationFontSize: number;
    fontFamily: string;
    verseColor: string;
    referenceColor: string;
    translationColor: string;
    textAlign: 'left' | 'center' | 'right';
    bold: boolean;
    italic: boolean;
    lineHeight: number;
  };

  // Background
  background: BackgroundStyle;
}

/**
 * Scripture content type implementation
 *
 * Handles Bible verses and passages with intelligent slide generation,
 * verse lookup, and theme variations.
 */
export class ScriptureContentType extends BaseContentType<ScriptureData, ScriptureSlideSettings> {
  readonly typeId: ContentTypeId = 'scripture';
  readonly typeName: string = 'Scripture';
  readonly description: string = 'Bible verses and passages';
  readonly icon: string = 'book-open';

  constructor(
    content: ScriptureData,
    settings?: Partial<ScriptureSlideSettings>,
    template?: ScriptureTemplate
  ) {
    const defaultSettings = ScriptureContentType.getDefaultSettings();
    const mergedSettings = { ...defaultSettings, ...settings };

    super(content, mergedSettings, template);

    // Create default template if not provided
    if (!this.template) {
      this.template = new ScriptureTemplate({ width: 1920, height: 1080 });
    }
  }

  /**
   * Get default settings for scripture slides
   */
  static getDefaultSettings(): ScriptureSlideSettings {
    return {
      showTranslation: true,
      emphasizeReference: true,
      showVerseNumbers: true,
      theme: 'reading',
      maxVersesPerSlide: 4,
      typography: {
        verseFontSize: 64,
        referenceFontSize: 36,
        translationFontSize: 28,
        fontFamily: 'Arial',
        verseColor: '#ffffff',
        referenceColor: '#f39c12',
        translationColor: '#cbd5e0',
        textAlign: 'center',
        bold: false,
        italic: false,
        lineHeight: 1.5
      },
      background: {
        type: 'color',
        color: { r: 26, g: 26, b: 46, a: 1 }
      }
    };
  }

  /**
   * Get capabilities for scripture content type
   */
  static getCapabilities(): ContentTypeCapabilities {
    return {
      supportsTextEditing: true,        // Can edit verse text
      supportsMedia: false,             // No media in scriptures
      supportsBackgrounds: true,        // Custom backgrounds
      supportsMultipleSlides: true,     // Long passages split across slides
      fullyEditable: true,              // All text is editable
      hasViewOnlyElements: false        // No locked elements
    };
  }

  /**
   * Validate scripture content
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate metadata
    if (!this.content.metadata.book || this.content.metadata.book.trim() === '') {
      errors.push('Book is required');
    }

    if (this.content.metadata.chapter < 1) {
      errors.push('Invalid chapter number (must be >= 1)');
    }

    if (this.content.metadata.verseStart < 1) {
      errors.push('Invalid verse number (must be >= 1)');
    }

    if (this.content.metadata.verseEnd && this.content.metadata.verseEnd < this.content.metadata.verseStart) {
      errors.push('End verse must be greater than or equal to start verse');
    }

    if (!this.content.metadata.translation || this.content.metadata.translation.trim() === '') {
      errors.push('Translation is required');
    }

    // Validate content
    if (!this.content.content.verses || this.content.content.verses.length === 0) {
      errors.push('No verses provided');
    }

    if (!this.content.content.reference || this.content.content.reference.trim() === '') {
      errors.push('Scripture reference is required');
    }

    // Warnings
    if (this.content.content.verses.length > 10) {
      warnings.push('Large number of verses may result in many slides');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate slides from scripture content
   */
  generateSlides(): GeneratedSlide[] {
    const slides: GeneratedSlide[] = [];
    const versesPerSlide = this.settings.maxVersesPerSlide || 4;

    // Split verses into chunks
    for (let i = 0; i < this.content.content.verses.length; i += versesPerSlide) {
      const verseChunk = this.content.content.verses.slice(i, i + versesPerSlide);
      const slide = this.generateSlideForVerses(verseChunk, i);
      slides.push(slide);
    }

    return slides;
  }

  /**
   * Generate a single slide for a chunk of verses
   */
  private generateSlideForVerses(verses: VerseData[], startIndex: number): GeneratedSlide {
    const template = this.template as ScriptureTemplate;

    // Combine verse texts
    const combinedText = verses
      .map(v => {
        if (this.settings.showVerseNumbers) {
          return `${v.number} ${v.text}`;
        }
        return v.text;
      })
      .join('\n\n');

    // Prepare content for template
    const slideContent: ScriptureSlideContent = {
      verse: combinedText,
      reference: this.content.content.reference,
      translation: this.content.metadata.translation,
      book: this.content.metadata.book,
      chapter: this.content.metadata.chapter,
      verseNumber: verses[0].number,
      theme: this.settings.theme,
      showTranslation: this.settings.showTranslation,
      emphasizeReference: this.settings.emphasizeReference,
      featureSettings: {
        background: this.settings.background,
        typography: this.settings.typography
      }
    };

    // Generate shapes using template
    const shapes = template.generateSlide(slideContent);

    // Create slide object
    const slide: GeneratedSlide = {
      id: `scripture-${this.generateContentId()}-${startIndex}`,
      contentId: this.generateContentId(),
      templateId: 'scripture-template',
      shapes,
      metadata: {
        contentType: 'scripture',
        templateId: 'scripture-template',
        editability: {
          locked: false,
          editableShapes: shapes.filter(s => s instanceof TextShape).map(s => s.id),
          nonEditableShapes: []
        },
        scripture: {
          reference: this.content.content.reference,
          verseRange: `${verses[0].number}-${verses[verses.length - 1].number}`,
          translation: this.content.metadata.translation
        }
      }
    };

    return slide;
  }

  /**
   * Clone this scripture content type
   */
  clone(): ScriptureContentType {
    return new ScriptureContentType(
      JSON.parse(JSON.stringify(this.content)),
      JSON.parse(JSON.stringify(this.settings)),
      this.template
    );
  }
}

/**
 * Factory for creating scripture content types
 */
export class ScriptureFactory implements ContentTypeFactory<ScriptureData, ScriptureSlideSettings> {
  create(data: ScriptureData, settings?: Partial<ScriptureSlideSettings>): ScriptureContentType {
    return new ScriptureContentType(data, settings);
  }

  createEmpty(): ScriptureContentType {
    return new ScriptureContentType({
      metadata: {
        book: 'John',
        chapter: 3,
        verseStart: 16,
        translation: 'NIV',
        theme: 'reading'
      },
      content: {
        verses: [{
          number: 16,
          text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.'
        }],
        reference: 'John 3:16',
        displayReference: 'John 3:16 (NIV)'
      }
    });
  }

  createFromJSON(json: string | object): ScriptureContentType {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new ScriptureContentType(data.content, data.settings);
  }
}

/**
 * Helper functions for scripture content
 */
export const ScriptureHelpers = {
  /**
   * Create scripture content from verses
   */
  createFromVerses(
    book: string,
    chapter: number,
    verseStart: number,
    verseEnd: number | undefined,
    translation: string,
    verseTexts: string[]
  ): ScriptureContentType {
    const verses: VerseData[] = verseTexts.map((text, i) => ({
      number: verseStart + i,
      text
    }));

    const reference = verseEnd
      ? `${book} ${chapter}:${verseStart}-${verseEnd}`
      : `${book} ${chapter}:${verseStart}`;

    const displayReference = `${reference} (${translation})`;

    return new ScriptureContentType({
      metadata: {
        book,
        chapter,
        verseStart,
        verseEnd,
        translation,
        theme: 'reading'
      },
      content: {
        verses,
        reference,
        displayReference
      }
    });
  },

  /**
   * Parse scripture reference string (e.g., "John 3:16-17 NIV")
   */
  parseReference(refString: string): {
    book: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
    translation?: string;
  } {
    // Match patterns like "John 3:16" or "John 3:16-17" or "John 3:16-17 NIV"
    const match = refString.match(/^([A-Za-z\s]+)\s+(\d+):(\d+)(?:-(\d+))?\s*([A-Z]+)?$/);

    if (!match) {
      throw new Error(`Invalid scripture reference format: ${refString}`);
    }

    return {
      book: match[1].trim(),
      chapter: parseInt(match[2]),
      verseStart: parseInt(match[3]),
      verseEnd: match[4] ? parseInt(match[4]) : undefined,
      translation: match[5] || 'NIV'
    };
  },

  /**
   * Format reference string from components
   */
  formatReference(
    book: string,
    chapter: number,
    verseStart: number,
    verseEnd?: number,
    translation?: string
  ): string {
    let ref = `${book} ${chapter}:${verseStart}`;
    if (verseEnd) {
      ref += `-${verseEnd}`;
    }
    if (translation) {
      ref += ` (${translation})`;
    }
    return ref;
  }
};
