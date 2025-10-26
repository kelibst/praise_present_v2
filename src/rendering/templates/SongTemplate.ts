import { SlideTemplate, SlideTemplateOptions, TemplateContent, TemplatePlaceholder } from './SlideTemplate';
import { Shape } from '../core/Shape';
import { TextShape } from '../shapes/TextShape';
import { BackgroundShape } from '../shapes/BackgroundShape';
import { RectangleShape } from '../shapes/RectangleShape';
import { Size, Color } from '../types/geometry';
// REMOVED: ResponsiveTextShape and responsive utilities - using fixed resolution mode

export interface SongSlideContent extends TemplateContent {
  title: string;
  lyrics: string;
  chords?: string;
  section?: string; // verse, chorus, bridge, etc.
  sectionNumber?: number;
  copyright?: string;
  ccli?: string;
  author?: string;
  key?: string;
  tempo?: number;
  showChords?: boolean;
  showCopyright?: boolean;
}

export interface SongTemplateStyle {
  titleFontSize?: number;
  lyricsFontSize?: number;
  chordsFontSize?: number;
  copyrightFontSize?: number;
  sectionLabelFontSize?: number;
  lineSpacing?: number;
  paragraphSpacing?: number;
  showSectionLabels?: boolean;
  centerAlign?: boolean;
}

export class SongTemplate extends SlideTemplate {
  private style: SongTemplateStyle;

  constructor(slideSize: Size = { width: 1920, height: 1080 }, style: SongTemplateStyle = {}) {
    // Fixed positions for 1920x1080 resolution (PowerPoint pattern)
    const placeholders: TemplatePlaceholder[] = [
      {
        id: 'title',
        name: 'Song Title',
        type: 'text',
        bounds: { x: 100, y: 60, width: 1720, height: 120 }, // Title at top
        required: true
      },
      {
        id: 'section_label',
        name: 'Section Label',
        type: 'text',
        bounds: { x: 100, y: 200, width: 300, height: 60 }, // Section label
        required: false
      },
      {
        id: 'lyrics',
        name: 'Lyrics',
        type: 'text',
        bounds: { x: 100, y: 280, width: 1720, height: 680 }, // Main lyrics area
        required: true
      },
      {
        id: 'chords',
        name: 'Chords',
        type: 'text',
        bounds: { x: 1520, y: 200, width: 300, height: 60 }, // Chords on right
        required: false
      },
      {
        id: 'copyright',
        name: 'Copyright',
        type: 'text',
        bounds: { x: 100, y: 1000, width: 1720, height: 50 }, // Copyright at bottom
        required: false
      }
    ];

    const options: SlideTemplateOptions = {
      id: 'song-template',
      name: 'Song Template',
      category: 'song',
      slideSize,
      placeholders
    };

    super(options);

    // Fixed font sizes for 1920x1080 resolution
    this.style = {
      titleFontSize: 72,          // Larger for 1920x1080
      lyricsFontSize: 56,         // Larger for 1920x1080
      chordsFontSize: 32,         // Larger for 1920x1080
      copyrightFontSize: 24,      // Larger for 1920x1080
      sectionLabelFontSize: 40,   // Larger for 1920x1080
      lineSpacing: 1.4,
      paragraphSpacing: 1.8,
      showSectionLabels: true,
      centerAlign: true,
      ...style
    };
  }

  protected initializeTemplate(): void {
    // Template initialization is handled in generateSlide
    // since song slides are highly dynamic
  }

  public generateSlide(content: SongSlideContent): Shape[] {
    const shapes: Shape[] = [];

    // Background
    shapes.push(this.createBackgroundShape());

    // Title
    if (content.title) {
      const titleShape = this.createTitleShape(content.title);
      shapes.push(titleShape);
    }

    // Section label (Verse 1, Chorus, etc.)
    if (content.section && this.style.showSectionLabels) {
      const sectionLabel = this.createSectionLabel(content.section, content.sectionNumber);
      shapes.push(sectionLabel);
    }

    // Chords (if enabled and present)
    if (content.showChords && content.chords) {
      const chordsShape = this.createChordsShape(content.chords, content.key);
      shapes.push(chordsShape);
    }

    // Lyrics (main content)
    if (content.lyrics) {
      const lyricsShape = this.createLyricsShape(content.lyrics);
      shapes.push(lyricsShape);
    }

    // Copyright information
    if (content.showCopyright && (content.copyright || content.ccli)) {
      const copyrightShape = this.createCopyrightShape(content);
      shapes.push(copyrightShape);
    }

    return shapes;
  }

  private createTitleShape(title: string): TextShape {
    const placeholder = this.getPlaceholder('title')!;

    // Title with shrink-to-fit for long song titles
    return new TextShape({
      text: title,
      position: {
        x: placeholder.bounds.x,
        y: placeholder.bounds.y
      },
      size: {
        width: placeholder.bounds.width,
        height: placeholder.bounds.height
      },
      autoSize: false, // Fixed bounds
      wordWrap: true,
      maxLines: 2,
      overflowBehavior: 'shrink-to-fit', // Shrink font if title is too long
      minFontSize: 36, // Keep title readable
      maxFontSize: this.style.titleFontSize
    }, {
      fontFamily: this.theme.fonts.display,
      fontSize: this.style.titleFontSize!,
      color: this.theme.colors.accent,
      textAlign: this.style.centerAlign ? 'center' : 'left',
      verticalAlign: 'middle',
      fontWeight: 'bold',
      lineHeight: 1.2
    });
  }

  private createSectionLabel(section: string, sectionNumber?: number): TextShape {
    const placeholder = this.getPlaceholder('section_label')!;

    let labelText = this.formatSectionLabel(section, sectionNumber);

    return this.createTextShape(
      placeholder,
      labelText,
      {
        fontFamily: this.theme.fonts.secondary,
        fontSize: this.style.sectionLabelFontSize,
        color: this.theme.colors.textSecondary,
        textAlign: 'left',
        fontWeight: '600',
        fontStyle: 'italic'
      }
    );
  }

  private formatSectionLabel(section: string, sectionNumber?: number): string {
    const capitalizedSection = section.charAt(0).toUpperCase() + section.slice(1);

    if (sectionNumber) {
      return `${capitalizedSection} ${sectionNumber}`;
    }

    return capitalizedSection;
  }

  private createChordsShape(chords: string, key?: string): TextShape {
    const placeholder = this.getPlaceholder('chords')!;

    let chordsText = chords;
    if (key) {
      chordsText = `Key: ${key} | ${chords}`;
    }

    return this.createTextShape(
      placeholder,
      chordsText,
      {
        fontFamily: this.theme.fonts.secondary,
        fontSize: this.style.chordsFontSize,
        color: this.theme.colors.secondary,
        textAlign: 'right',
        fontWeight: '500'
      }
    );
  }

  private createLyricsShape(lyrics: string): TextShape {
    const placeholder = this.getPlaceholder('lyrics')!;

    // Process lyrics for better display
    const processedLyrics = this.processLyrics(lyrics);

    // Lyrics with shrink-to-fit - THE KEY FEATURE for song presentation
    // Long verses/choruses will automatically shrink to fit the slide
    return new TextShape({
      text: processedLyrics,
      position: {
        x: placeholder.bounds.x,
        y: placeholder.bounds.y
      },
      size: {
        width: placeholder.bounds.width,
        height: placeholder.bounds.height
      },
      autoSize: false, // Fixed bounds - never expand beyond slide
      wordWrap: true,
      overflowBehavior: 'shrink-to-fit', // PowerPoint-style: automatically shrink font for long lyrics
      minFontSize: 28, // Don't shrink smaller than 28px (audience readability)
      maxFontSize: this.style.lyricsFontSize // User's preferred size is the max
    }, {
      fontFamily: this.theme.fonts.primary,
      fontSize: this.style.lyricsFontSize!,
      color: this.theme.colors.text,
      textAlign: this.style.centerAlign ? 'center' : 'left',
      verticalAlign: 'middle',
      fontWeight: 'normal',
      lineHeight: this.style.lineSpacing
    });
  }

  private processLyrics(lyrics: string): string {
    // Handle non-string inputs gracefully
    if (!lyrics || typeof lyrics !== 'string') {
      console.warn('SongTemplate: lyrics is not a string, converting...', typeof lyrics, lyrics);
      return String(lyrics || '');
    }

    return lyrics
      .trim()
      .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
      .replace(/\n/g, '\n') // Ensure consistent line breaks
      .replace(/\s+$/gm, ''); // Remove trailing whitespace
  }

  private createCopyrightShape(content: SongSlideContent): TextShape {
    const placeholder = this.getPlaceholder('copyright')!;

    const copyrightParts: string[] = [];

    if (content.copyright) {
      copyrightParts.push(`© ${content.copyright}`);
    }

    if (content.ccli) {
      copyrightParts.push(`CCLI# ${content.ccli}`);
    }

    if (content.author) {
      copyrightParts.push(content.author);
    }

    const copyrightText = copyrightParts.join(' | ');

    return this.createTextShape(
      placeholder,
      copyrightText,
      {
        fontFamily: this.theme.fonts.secondary,
        fontSize: this.style.copyrightFontSize,
        color: this.theme.colors.textSecondary,
        textAlign: this.style.centerAlign ? 'center' : 'left',
        opacity: 0.8
      }
    );
  }

  public static createVerseSlide(
    songTitle: string,
    verseNumber: number,
    verseText: string,
    chords?: string,
    options?: SongTemplateStyle
  ): SongSlideContent {
    return {
      title: songTitle,
      lyrics: verseText,
      chords,
      section: 'verse',
      sectionNumber: verseNumber,
      showChords: !!chords,
      showCopyright: false
    };
  }

  public static createChorusSlide(
    songTitle: string,
    chorusText: string,
    chords?: string,
    options?: SongTemplateStyle
  ): SongSlideContent {
    return {
      title: songTitle,
      lyrics: chorusText,
      chords,
      section: 'chorus',
      showChords: !!chords,
      showCopyright: false
    };
  }

  public static createBridgeSlide(
    songTitle: string,
    bridgeText: string,
    chords?: string,
    options?: SongTemplateStyle
  ): SongSlideContent {
    return {
      title: songTitle,
      lyrics: bridgeText,
      chords,
      section: 'bridge',
      showChords: !!chords,
      showCopyright: false
    };
  }

  public static createTitleSlide(
    songTitle: string,
    author?: string,
    copyright?: string,
    ccli?: string,
    key?: string,
    tempo?: number
  ): SongSlideContent {
    const metaInfo: string[] = [];

    if (author) metaInfo.push(author);
    if (key) metaInfo.push(`Key: ${key}`);
    if (tempo) metaInfo.push(`${tempo} BPM`);

    return {
      title: songTitle,
      lyrics: metaInfo.join(' | '),
      author,
      copyright,
      ccli,
      key,
      tempo,
      showChords: false,
      showCopyright: true
    };
  }

  public static createEndingSlide(
    songTitle: string,
    copyright?: string,
    ccli?: string,
    author?: string
  ): SongSlideContent {
    return {
      title: songTitle,
      lyrics: 'Thank you for worshipping with us!',
      copyright,
      ccli,
      author,
      showChords: false,
      showCopyright: true
    };
  }

  public setStyle(style: SongTemplateStyle): void {
    this.style = { ...this.style, ...style };
  }

  public getStyle(): SongTemplateStyle {
    return { ...this.style };
  }

  public clone(): SongTemplate {
    return new SongTemplate(this.slideSize, this.style);
  }
}