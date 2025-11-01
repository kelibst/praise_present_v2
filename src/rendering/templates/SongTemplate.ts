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
  featureSettings?: {
    background?: any;
    typography?: {
      titleFontSize?: number;
      lyricsFontSize?: number;
      fontFamily?: string;
      textColor?: string;
      textAlign?: 'left' | 'center' | 'right';
      bold?: boolean;
      italic?: boolean;
      lineHeight?: number;
    };
  };
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

    // Apply feature settings if provided (override template defaults)
    if (content.featureSettings?.typography) {
      const typo = content.featureSettings.typography;
      this.style = {
        ...this.style,
        titleFontSize: typo.titleFontSize ?? this.style.titleFontSize,
        lyricsFontSize: typo.lyricsFontSize ?? this.style.lyricsFontSize,
        centerAlign: typo.textAlign === 'center',
        lineSpacing: typo.lineHeight ?? this.style.lineSpacing
      };

      console.log('[SongTemplate] Applied feature settings:', {
        titleFontSize: this.style.titleFontSize,
        lyricsFontSize: this.style.lyricsFontSize,
        centerAlign: this.style.centerAlign,
        lineSpacing: this.style.lineSpacing
      });
    }

    // Background
    shapes.push(this.createBackgroundShape());

    // Title
    if (content.title) {
      const titleShape = this.createTitleShape(content.title, content.featureSettings?.typography);
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
      const lyricsShape = this.createLyricsShape(content.lyrics, content.featureSettings?.typography);
      shapes.push(lyricsShape);
    }

    // Copyright information
    if (content.showCopyright && (content.copyright || content.ccli)) {
      const copyrightShape = this.createCopyrightShape(content);
      shapes.push(copyrightShape);
    }

    return shapes;
  }

  private createTitleShape(title: string, typography?: any): TextShape {
    const placeholder = this.getPlaceholder('title')!;

    // Parse color from typography settings
    let textColor = this.theme.colors.accent;
    if (typography?.textColor) {
      textColor = this.parseColor(typography.textColor);
    }

    // Title with shrink-to-fit for long song titles
    return new TextShape({
      id: 'title',
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
      fontFamily: typography?.fontFamily || this.theme.fonts.display,
      fontSize: this.style.titleFontSize!,
      color: textColor,
      textAlign: this.style.centerAlign ? 'center' : 'left',
      verticalAlign: 'middle',
      fontWeight: typography?.bold ? 'bold' : 'bold',
      fontStyle: typography?.italic ? 'italic' : 'normal',
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

  private createLyricsShape(lyrics: string, typography?: any): TextShape {
    const placeholder = this.getPlaceholder('lyrics')!;

    // Process lyrics for better display
    const processedLyrics = this.processLyrics(lyrics);

    // Parse color from typography settings
    let textColor = this.theme.colors.text;
    if (typography?.textColor) {
      textColor = this.parseColor(typography.textColor);
    }

    // Lyrics with shrink-to-fit - THE KEY FEATURE for song presentation
    // Long verses/choruses will automatically shrink to fit the slide
    return new TextShape({
      id: 'lyrics',
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
      maxFontSize: this.style.lyricsFontSize, // User's preferred size is the max
      metadata: {
        elementType: 'lyrics',
        isDefaultFormatting: true
      }
    }, {
      fontFamily: typography?.fontFamily || this.theme.fonts.primary,
      fontSize: this.style.lyricsFontSize!,
      color: textColor,
      textAlign: this.style.centerAlign ? 'center' : 'left',
      verticalAlign: 'middle',
      fontWeight: typography?.bold ? 'bold' : 'normal',
      fontStyle: typography?.italic ? 'italic' : 'normal',
      lineHeight: typography?.lineHeight ?? this.style.lineSpacing
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

  /**
   * Parse color from hex string to Color object
   */
  private parseColor(hexColor: string): Color {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b, a: 255 };
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