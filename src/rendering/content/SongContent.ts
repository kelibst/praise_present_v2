import {
  BaseContentType,
  ContentTypeId,
  ValidationResult,
  GeneratedSlide,
  ContentTypeCapabilities
} from './ContentType';
import { SongTemplate, SongSlideContent } from '../templates/SongTemplate';
import { BackgroundStyle } from '../types/shapes';

/**
 * Song section definition (verse, chorus, bridge, etc.)
 */
export interface SongSection {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'tag' | 'intro' | 'outro' | 'instrumental';
  number?: number; // Verse 1, Verse 2, etc.
  lyrics: string;
  chords?: string;
}

/**
 * Song metadata
 */
export interface SongMetadata {
  title: string;
  artist?: string;
  author?: string;
  copyright?: string;
  ccliNumber?: string;
  key?: string;
  tempo?: number;
  category?: string;
  tags?: string[];
  notes?: string;
}

/**
 * Song slide settings (how to generate slides from song content)
 */
export interface SongSlideSettings {
  background: BackgroundStyle;
  typography: {
    fontSize: number;
    fontFamily: string;
    textAlign: 'left' | 'center' | 'right';
    textColor: string;
    lineSpacing: number;
  };
  showSectionLabels: boolean;
  showCopyright: boolean;
  showChords: boolean;
  maxLinesPerSlide: number;
  titleSlide?: boolean; // Generate a title slide
  endSlide?: boolean; // Generate an ending slide
}

/**
 * Complete song content data
 */
export interface SongData {
  metadata: SongMetadata;
  sections: SongSection[];
  arrangement?: string[]; // Section IDs in order for this service
}

/**
 * Song content type implementation
 *
 * Handles song-specific content with lyrics, sections, and slide generation.
 * Songs are fully text-editable with template-based slide generation.
 */
export class SongContentType extends BaseContentType<SongData, SongSlideSettings> {
  readonly typeId: ContentTypeId = 'song';
  readonly typeName: string = 'Song';
  readonly description: string = 'Worship songs with lyrics, sections, and chords';
  readonly icon: string = 'music';

  constructor(
    content: SongData,
    settings?: Partial<SongSlideSettings>,
    template?: SongTemplate
  ) {
    const defaultSettings = SongContentType.getDefaultSettings();
    const mergedSettings = { ...defaultSettings, ...settings };

    super(content, mergedSettings, template);

    // Create default template if not provided
    if (!this.template) {
      this.template = new SongTemplate({ width: 1920, height: 1080 });
    }
  }

  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate metadata
    if (!this.content.metadata.title || this.content.metadata.title.trim() === '') {
      errors.push('Song title is required');
    }

    // Validate sections
    if (!this.content.sections || this.content.sections.length === 0) {
      errors.push('Song must have at least one section');
    } else {
      this.content.sections.forEach((section, index) => {
        if (!section.lyrics || section.lyrics.trim() === '') {
          errors.push(`Section ${index + 1} has no lyrics`);
        }
        if (!section.id) {
          errors.push(`Section ${index + 1} is missing an ID`);
        }
      });
    }

    // Warnings
    if (!this.content.metadata.author) {
      warnings.push('Song author not specified');
    }

    if (!this.content.metadata.copyright) {
      warnings.push('Copyright information not specified');
    }

    if (!this.content.metadata.ccliNumber) {
      warnings.push('CCLI number not specified - may be required for public performance');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  generateSlides(): GeneratedSlide[] {
    const slides: GeneratedSlide[] = [];
    let slideOrder = 0;

    // Title slide (optional)
    if (this.settings.titleSlide !== false) {
      const titleSlideContent: SongSlideContent = {
        title: this.content.metadata.title,
        lyrics: this.formatTitleSlideSubtext(),
        author: this.content.metadata.author,
        copyright: this.content.metadata.copyright,
        ccli: this.content.metadata.ccliNumber,
        key: this.content.metadata.key,
        tempo: this.content.metadata.tempo,
        showChords: false,
        showCopyright: true
      };

      const titleShapes = (this.template as SongTemplate).generateSlide(titleSlideContent);
      const editableShapeIds = titleShapes
        .filter(shape => shape.type === 'text')
        .map(shape => shape.id);

      slides.push({
        id: `${this.content.metadata.title}-title-${slideOrder++}`,
        shapes: titleShapes,
        background: this.settings.background,
        metadata: this.createSlideMetadata(
          `slide-${slideOrder}`,
          editableShapeIds,
          this.template?.id
        )
      });
    }

    // Generate slides for each section
    const arrangement = this.content.arrangement || this.content.sections.map(s => s.id);

    for (const sectionId of arrangement) {
      const section = this.content.sections.find(s => s.id === sectionId);
      if (!section) continue;

      // Split section into multiple slides if needed
      const sectionSlides = this.splitSectionIntoSlides(section);

      for (const slideContent of sectionSlides) {
        const shapes = (this.template as SongTemplate).generateSlide(slideContent);
        const editableShapeIds = shapes
          .filter(shape => shape.type === 'text')
          .map(shape => shape.id);

        slides.push({
          id: `${this.content.metadata.title}-${section.id}-${slideOrder++}`,
          shapes,
          background: this.settings.background,
          metadata: this.createSlideMetadata(
            `slide-${slideOrder}`,
            editableShapeIds,
            this.template?.id
          )
        });
      }
    }

    // End slide (optional)
    if (this.settings.endSlide) {
      const endSlideContent: SongSlideContent = {
        title: this.content.metadata.title,
        lyrics: 'Thank you for worshipping with us!',
        copyright: this.content.metadata.copyright,
        ccli: this.content.metadata.ccliNumber,
        author: this.content.metadata.author,
        showChords: false,
        showCopyright: true
      };

      const endShapes = (this.template as SongTemplate).generateSlide(endSlideContent);
      const editableShapeIds = endShapes
        .filter(shape => shape.type === 'text')
        .map(shape => shape.id);

      slides.push({
        id: `${this.content.metadata.title}-end-${slideOrder++}`,
        shapes: endShapes,
        background: this.settings.background,
        metadata: this.createSlideMetadata(
          `slide-${slideOrder}`,
          editableShapeIds,
          this.template?.id
        )
      });
    }

    return slides;
  }

  /**
   * Split a section into multiple slides based on max lines per slide
   */
  private splitSectionIntoSlides(section: SongSection): SongSlideContent[] {
    const slides: SongSlideContent[] = [];
    const lines = section.lyrics.split('\n');
    const maxLines = this.settings.maxLinesPerSlide;

    // If section fits in one slide
    if (lines.length <= maxLines) {
      slides.push({
        title: this.content.metadata.title,
        lyrics: section.lyrics,
        chords: section.chords,
        section: section.type,
        sectionNumber: section.number,
        showChords: this.settings.showChords && !!section.chords,
        showCopyright: false
      });
      return slides;
    }

    // Split into multiple slides
    for (let i = 0; i < lines.length; i += maxLines) {
      const slideLines = lines.slice(i, i + maxLines);
      slides.push({
        title: this.content.metadata.title,
        lyrics: slideLines.join('\n'),
        chords: section.chords, // Could be split too if needed
        section: section.type,
        sectionNumber: section.number,
        showChords: this.settings.showChords && !!section.chords && i === 0, // Only show on first slide
        showCopyright: false
      });
    }

    return slides;
  }

  /**
   * Format subtitle for title slide
   */
  private formatTitleSlideSubtext(): string {
    const parts: string[] = [];

    if (this.content.metadata.author) {
      parts.push(this.content.metadata.author);
    }

    if (this.content.metadata.key) {
      parts.push(`Key: ${this.content.metadata.key}`);
    }

    if (this.content.metadata.tempo) {
      parts.push(`${this.content.metadata.tempo} BPM`);
    }

    return parts.join(' | ');
  }

  getDefaultSettings(): SongSlideSettings {
    return {
      background: { type: 'color', value: '#1a1a1a' },
      typography: {
        fontSize: 56,
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        textColor: '#ffffff',
        lineSpacing: 1.4
      },
      showSectionLabels: true,
      showCopyright: true,
      showChords: false,
      maxLinesPerSlide: 8,
      titleSlide: true,
      endSlide: false
    };
  }

  static getDefaultSettings(): SongSlideSettings {
    return {
      background: { type: 'color', value: '#1a1a1a' },
      typography: {
        fontSize: 56,
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        textColor: '#ffffff',
        lineSpacing: 1.4
      },
      showSectionLabels: true,
      showCopyright: true,
      showChords: false,
      maxLinesPerSlide: 8,
      titleSlide: true,
      endSlide: false
    };
  }

  getEditableShapes(): Map<string, string[]> {
    // All text shapes in song slides are editable
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
    const subtitle = [
      this.content.metadata.artist || this.content.metadata.author,
      this.content.metadata.key
    ]
      .filter(Boolean)
      .join(' • ');

    // Estimate duration: ~10 seconds per slide
    const slideCount = this.content.sections.length * 2; // Rough estimate
    const estimatedDuration = slideCount * 10;

    return {
      title: this.content.metadata.title,
      subtitle,
      duration: estimatedDuration
    };
  }

  clone(): SongContentType {
    return new SongContentType(
      JSON.parse(JSON.stringify(this.content)),
      JSON.parse(JSON.stringify(this.settings)),
      this.template
    );
  }

  /**
   * Get content type capabilities
   */
  static getCapabilities(): ContentTypeCapabilities {
    return {
      supportsTextEditing: true,
      supportsMedia: true, // Can have media backgrounds
      supportsBackgrounds: true,
      supportsMultipleSlides: true,
      supportsTemplateOverrides: true,
      supportsTiming: true,
      supportsTransitions: true,
      fullyEditable: true,
      hasViewOnlyElements: false // All shapes are editable
    };
  }
}
