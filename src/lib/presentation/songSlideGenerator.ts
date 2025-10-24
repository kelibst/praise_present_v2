/**
 * Song Slide Generator - Generates beautiful slides from song lyrics
 * Handles intelligent lyric splitting, section management, and slide formatting
 */

import { Shape } from '../../rendering/core/Shape';
import { SongTemplate, SongSlideContent, SongTemplateStyle } from '../../rendering/templates/SongTemplate';
import { parseSongLyrics, SongSection } from './songParser';
import { DEFAULT_SLIDE_SIZE } from '../../rendering/templates/templateUtils';
import { SlideBackground } from '../../components/formatting/BackgroundToolbar';

export interface Song {
  id: string;
  title: string;
  artist?: string;
  author: string;
  lyrics: string;
  chords?: string;
  key: string;
  tempo: string;
  category: string;
  copyright: string;
  ccliNumber?: string;
  tags: string[];
  notes?: string;
  verses?: SongVerse[];
  slideSettings?: SongSlideSettings;
}

export interface SongVerse {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'tag' | 'intro' | 'outro';
  number?: number;
  lyrics: string;
  chords?: string;
}

export interface SongSlideSettings {
  background?: SlideBackground;
  typography?: {
    fontSize?: number;
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right';
    textColor?: string;
    lineSpacing?: number;
  };
  sectionOverrides?: {
    [sectionId: string]: {
      background?: SlideBackground;
      fontSize?: number;
    };
  };
  showSectionLabels?: boolean;
  showChords?: boolean;
  showCopyright?: boolean;
  maxLinesPerSlide?: number;
}

export interface SongSlide {
  id: string;
  sectionType?: 'title' | 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'copyright';
  sectionNumber?: number;
  shapes: Shape[];
  background?: SlideBackground;
}

export interface SongSlideConfiguration {
  maxLinesPerSlide: number;
  preferSectionBoundaries: boolean;
  enableShrinkToFit: boolean;
  minFontSize: number;
  showTitleSlide: boolean;
  showCopyrightSlide: boolean;
  showSectionLabels: boolean;
  showChords: boolean;
}

const DEFAULT_CONFIG: SongSlideConfiguration = {
  maxLinesPerSlide: 8,
  preferSectionBoundaries: true,
  enableShrinkToFit: true,
  minFontSize: 28,
  showTitleSlide: true,
  showCopyrightSlide: true,
  showSectionLabels: true,
  showChords: false
};

/**
 * Generate slides from a song with beautiful formatting
 */
export class SongSlideGenerator {
  private template: SongTemplate;
  private config: SongSlideConfiguration;

  constructor(config?: Partial<SongSlideConfiguration>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.template = new SongTemplate(DEFAULT_SLIDE_SIZE);
  }

  /**
   * Generate all slides for a song
   */
  public generateSlides(song: Song): SongSlide[] {
    const slides: SongSlide[] = [];

    // Apply song-specific settings to template
    this.applySongSettings(song);

    // 1. Title slide (optional)
    if (this.config.showTitleSlide) {
      slides.push(this.generateTitleSlide(song));
    }

    // 2. Parse lyrics into sections
    const sections = song.verses && song.verses.length > 0
      ? this.convertVersesToSections(song.verses)
      : parseSongLyrics(song.lyrics);

    // 3. Generate slides for each section
    sections.forEach((section, index) => {
      const sectionSlides = this.generateSectionSlides(song, section, index);
      slides.push(...sectionSlides);
    });

    // 4. Copyright slide (optional)
    if (this.config.showCopyrightSlide && (song.copyright || song.ccliNumber)) {
      slides.push(this.generateCopyrightSlide(song));
    }

    return slides;
  }

  /**
   * Generate title slide for song
   */
  private generateTitleSlide(song: Song): SongSlide {
    const content: SongSlideContent = {
      title: song.title,
      lyrics: this.formatTitleSlideMetadata(song),
      author: song.author,
      key: song.key,
      tempo: parseInt(song.tempo) || undefined,
      showChords: false,
      showCopyright: false
    };

    const shapes = this.template.generateSlide(content);

    return {
      id: `${song.id}-title`,
      sectionType: 'title',
      shapes,
      background: song.slideSettings?.background
    };
  }

  /**
   * Generate slides for a single section (may split into multiple slides)
   */
  private generateSectionSlides(song: Song, section: SongSection, index: number): SongSlide[] {
    const slides: SongSlide[] = [];

    // Split section if too many lines
    const lyricParts = this.splitLyricsIntoSlides(section.lyrics);

    lyricParts.forEach((lyrics, partIndex) => {
      const content: SongSlideContent = {
        title: song.title,
        lyrics,
        section: section.type,
        sectionNumber: section.number,
        chords: this.config.showChords ? section.lyrics : undefined, // TODO: Extract chords properly
        showChords: this.config.showChords,
        showCopyright: false
      };

      const shapes = this.template.generateSlide(content);

      // Get section-specific background override
      const sectionId = `${section.type}-${section.number || index}`;
      const sectionOverride = song.slideSettings?.sectionOverrides?.[sectionId];

      slides.push({
        id: `${song.id}-${sectionId}-${partIndex}`,
        sectionType: section.type,
        sectionNumber: section.number,
        shapes,
        background: sectionOverride?.background || song.slideSettings?.background
      });
    });

    return slides;
  }

  /**
   * Generate copyright slide
   */
  private generateCopyrightSlide(song: Song): SongSlide {
    const content: SongSlideContent = {
      title: song.title,
      lyrics: 'Thank you for worshipping with us!',
      copyright: song.copyright,
      ccli: song.ccliNumber,
      author: song.author,
      showChords: false,
      showCopyright: true
    };

    const shapes = this.template.generateSlide(content);

    return {
      id: `${song.id}-copyright`,
      sectionType: 'copyright',
      shapes,
      background: song.slideSettings?.background
    };
  }

  /**
   * Split lyrics into multiple slides if too long
   */
  private splitLyricsIntoSlides(lyrics: string): string[] {
    const lines = lyrics.split('\n');

    if (lines.length <= this.config.maxLinesPerSlide) {
      return [lyrics];
    }

    const slides: string[] = [];
    let currentSlide: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if adding this line would exceed max
      if (currentSlide.length >= this.config.maxLinesPerSlide) {
        // Save current slide and start new one
        slides.push(currentSlide.join('\n'));
        currentSlide = [];
      }

      currentSlide.push(line);
    }

    // Add remaining lines
    if (currentSlide.length > 0) {
      slides.push(currentSlide.join('\n'));
    }

    return slides;
  }

  /**
   * Convert SongVerse[] to SongSection[]
   */
  private convertVersesToSections(verses: SongVerse[]): SongSection[] {
    return verses.map(verse => ({
      type: verse.type,
      number: verse.number,
      lyrics: verse.lyrics
    }));
  }

  /**
   * Format metadata for title slide
   */
  private formatTitleSlideMetadata(song: Song): string {
    const parts: string[] = [];

    if (song.author) parts.push(song.author);
    if (song.artist && song.artist !== song.author) parts.push(song.artist);
    if (song.key) parts.push(`Key: ${song.key}`);
    if (song.tempo) parts.push(song.tempo);

    return parts.join(' | ');
  }

  /**
   * Apply song-specific settings to the template
   */
  private applySongSettings(song: Song): void {
    if (!song.slideSettings) return;

    const { typography, showSectionLabels, showChords } = song.slideSettings;

    // Update template style
    const style: SongTemplateStyle = {
      lyricsFontSize: typography?.fontSize,
      showSectionLabels: showSectionLabels ?? this.config.showSectionLabels,
      centerAlign: typography?.textAlign === 'center',
      lineSpacing: typography?.lineSpacing
    };

    this.template.setStyle(style);

    // Update config
    if (showChords !== undefined) {
      this.config.showChords = showChords;
    }
  }

  /**
   * Update configuration
   */
  public setConfiguration(config: Partial<SongSlideConfiguration>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): SongSlideConfiguration {
    return { ...this.config };
  }
}

/**
 * Convenience function to generate slides from a song
 */
export function generateSongSlides(
  song: Song,
  config?: Partial<SongSlideConfiguration>
): SongSlide[] {
  const generator = new SongSlideGenerator(config);
  return generator.generateSlides(song);
}
