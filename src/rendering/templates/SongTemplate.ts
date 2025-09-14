import { SlideTemplate, SlideTemplateOptions, TemplateContent, TemplatePlaceholder } from './SlideTemplate';
import { Shape } from '../core/Shape';
import { TextShape } from '../shapes/TextShape';
import { ResponsiveTextShape } from '../shapes/ResponsiveTextShape';
import { BackgroundShape } from '../shapes/BackgroundShape';
import { RectangleShape } from '../shapes/RectangleShape';
import { Size, Color } from '../types/geometry';
import {
  LayoutMode,
  percent,
  px,
  rem,
  createFlexiblePosition,
  createFlexibleSize
} from '../types/responsive';
import { TypographyScaleMode } from '../layout/TypographyScaler';

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

  constructor(slideSize: Size, style: SongTemplateStyle = {}) {
    const placeholders: TemplatePlaceholder[] = [
      {
        id: 'title',
        name: 'Song Title',
        type: 'text',
        bounds: { x: 60, y: 40, width: slideSize.width - 120, height: 80 },
        required: true
      },
      {
        id: 'section_label',
        name: 'Section Label',
        type: 'text',
        bounds: { x: 60, y: 140, width: 200, height: 40 },
        required: false
      },
      {
        id: 'lyrics',
        name: 'Lyrics',
        type: 'text',
        bounds: { x: 60, y: 200, width: slideSize.width - 120, height: slideSize.height - 320 },
        required: true
      },
      {
        id: 'chords',
        name: 'Chords',
        type: 'text',
        bounds: { x: slideSize.width - 300, y: 140, width: 240, height: 40 },
        required: false
      },
      {
        id: 'copyright',
        name: 'Copyright',
        type: 'text',
        bounds: { x: 60, y: slideSize.height - 60, width: slideSize.width - 120, height: 30 },
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

    this.style = {
      titleFontSize: 48,
      lyricsFontSize: 36,
      chordsFontSize: 24,
      copyrightFontSize: 18,
      sectionLabelFontSize: 28,
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

  private createTitleShape(title: string): ResponsiveTextShape {
    const placeholder = this.getPlaceholder('title')!;

    // Create responsive text shape for song title
    return new ResponsiveTextShape({
      text: title,
      flexiblePosition: createFlexiblePosition(
        percent((placeholder.bounds.x / this.slideSize.width) * 100),
        percent((placeholder.bounds.y / this.slideSize.height) * 100)
      ),
      flexibleSize: createFlexibleSize(
        percent((placeholder.bounds.width / this.slideSize.width) * 100),
        percent((placeholder.bounds.height / this.slideSize.height) * 100)
      ),
      layoutConfig: {
        mode: LayoutMode.CENTER,
        padding: px(12)
      },
      typography: {
        baseSize: rem(3.0), // Equivalent to ~48px at default 16px base
        scaleRatio: 0.85,
        minSize: 28,
        maxSize: 72,
        lineHeightRatio: 1.2
      },
      textStyle: {
        fontFamily: this.theme.fonts.display,
        color: this.theme.colors.accent,
        textAlign: this.style.centerAlign ? 'center' : 'left',
        fontWeight: 'bold',
        textDecoration: 'none'
      },
      responsive: true,
      optimizeReadability: true,
      scaleMode: TypographyScaleMode.STEPPED,
      autoSize: true,
      wordWrap: true,
      maxLines: 2
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

  private createLyricsShape(lyrics: string): ResponsiveTextShape {
    const placeholder = this.getPlaceholder('lyrics')!;

    // Process lyrics for better display
    const processedLyrics = this.processLyrics(lyrics);

    // Create responsive text shape for song lyrics
    return new ResponsiveTextShape({
      text: processedLyrics,
      flexiblePosition: createFlexiblePosition(
        percent((placeholder.bounds.x / this.slideSize.width) * 100),
        percent((placeholder.bounds.y / this.slideSize.height) * 100)
      ),
      flexibleSize: createFlexibleSize(
        percent((placeholder.bounds.width / this.slideSize.width) * 100),
        percent((placeholder.bounds.height / this.slideSize.height) * 100)
      ),
      layoutConfig: {
        mode: LayoutMode.FIT_CONTENT,
        padding: px(16),
        margin: px(8)
      },
      typography: {
        baseSize: rem(2.25), // Equivalent to ~36px at default 16px base
        scaleRatio: 0.9,
        minSize: 20,
        maxSize: 56,
        lineHeightRatio: this.style.lineSpacing
      },
      textStyle: {
        fontFamily: this.theme.fonts.primary,
        color: this.theme.colors.text,
        textAlign: this.style.centerAlign ? 'center' : 'left',
        verticalAlign: 'middle',
        fontWeight: 'normal'
      },
      responsive: true,
      optimizeReadability: true,
      scaleMode: TypographyScaleMode.FLUID,
      autoSize: true,
      wordWrap: true
    });
  }

  private processLyrics(lyrics: string): string {
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