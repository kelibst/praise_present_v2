import { templateManager, SlideGenerationOptions } from './TemplateManager';
import { SongTemplate, SongSlideContent } from './SongTemplate';
import { ScriptureTemplate, ScriptureSlideContent } from './ScriptureTemplate';
import { AnnouncementTemplate, AnnouncementSlideContent } from './AnnouncementTemplate';
import { Size, Color } from '../types/geometry';

export interface StandardSlideSize {
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export const STANDARD_SLIDE_SIZES: StandardSlideSize[] = [
  { name: '16:9 HD', width: 1920, height: 1080, aspectRatio: '16:9' },
  { name: '16:10 WUXGA', width: 1920, height: 1200, aspectRatio: '16:10' },
  { name: '4:3 Standard', width: 1024, height: 768, aspectRatio: '4:3' },
  { name: '21:9 Ultrawide', width: 2560, height: 1080, aspectRatio: '21:9' }
];

export const DEFAULT_SLIDE_SIZE: Size = { width: 1920, height: 1080 };

export function initializeDefaultTemplates(): void {
  // Register default song template
  const songTemplate = new SongTemplate(DEFAULT_SLIDE_SIZE);
  templateManager.registerTemplate(songTemplate, {
    version: '1.0.0',
    author: 'PraisePresent',
    description: 'Default song template for worship lyrics',
    tags: ['song', 'worship', 'lyrics', 'default']
  });

  // Register default scripture template
  const scriptureTemplate = new ScriptureTemplate(DEFAULT_SLIDE_SIZE);
  templateManager.registerTemplate(scriptureTemplate, {
    version: '1.0.0',
    author: 'PraisePresent',
    description: 'Default scripture template for Bible verses',
    tags: ['scripture', 'bible', 'verse', 'default']
  });

  // Register default announcement template
  const announcementTemplate = new AnnouncementTemplate(DEFAULT_SLIDE_SIZE);
  templateManager.registerTemplate(announcementTemplate, {
    version: '1.0.0',
    author: 'PraisePresent',
    description: 'Default announcement template for church communications',
    tags: ['announcement', 'communication', 'event', 'default']
  });
}

export function createSongSlides(
  songData: {
    title: string;
    verses: string[];
    chorus?: string;
    bridge?: string;
    author?: string;
    copyright?: string;
    ccli?: string;
    key?: string;
    tempo?: number;
  }
): SlideGenerationOptions[] {
  const slides: SlideGenerationOptions[] = [];

  // Title slide
  slides.push({
    templateId: 'song-template',
    content: SongTemplate.createTitleSlide(
      songData.title,
      songData.author,
      songData.copyright,
      songData.ccli,
      songData.key,
      songData.tempo
    )
  });

  // Verse and chorus slides
  songData.verses.forEach((verse, index) => {
    // Add verse
    slides.push({
      templateId: 'song-template',
      content: SongTemplate.createVerseSlide(songData.title, index + 1, verse)
    });

    // Add chorus after each verse (if exists)
    if (songData.chorus) {
      slides.push({
        templateId: 'song-template',
        content: SongTemplate.createChorusSlide(songData.title, songData.chorus)
      });
    }
  });

  // Bridge slide (if exists)
  if (songData.bridge) {
    slides.push({
      templateId: 'song-template',
      content: SongTemplate.createBridgeSlide(songData.title, songData.bridge)
    });

    // Chorus after bridge
    if (songData.chorus) {
      slides.push({
        templateId: 'song-template',
        content: SongTemplate.createChorusSlide(songData.title, songData.chorus)
      });
    }
  }

  // Ending slide
  slides.push({
    templateId: 'song-template',
    content: SongTemplate.createEndingSlide(
      songData.title,
      songData.copyright,
      songData.ccli,
      songData.author
    )
  });

  return slides;
}

export function createScriptureSlides(
  scriptureData: {
    verses: string;
    book: string;
    chapter: number;
    verseRange: string;
    translation?: string;
    theme?: 'reading' | 'meditation' | 'memory' | 'announcement';
  }
): SlideGenerationOptions[] {
  const maxWordsPerSlide = 50;
  const splitSlides = ScriptureTemplate.splitLongPassage(
    scriptureData.verses,
    `${scriptureData.book} ${scriptureData.chapter}:${scriptureData.verseRange}`,
    maxWordsPerSlide
  );

  return splitSlides.map(slide => ({
    templateId: 'scripture-template',
    content: {
      verse: slide.verse,
      reference: slide.reference,
      translation: scriptureData.translation || 'NIV',
      book: scriptureData.book,
      chapter: scriptureData.chapter,
      verseRange: scriptureData.verseRange,
      theme: scriptureData.theme || 'reading',
      showTranslation: true,
      emphasizeReference: slide.totalSlides === 1
    } as ScriptureSlideContent
  }));
}

export function createAnnouncementSlides(
  announcementData: {
    title: string;
    message: string;
    type?: 'event' | 'announcement' | 'reminder' | 'welcome' | 'celebration';
    date?: string;
    time?: string;
    location?: string;
    contact?: string;
    urgency?: 'low' | 'medium' | 'high';
    imageUrl?: string;
    callToAction?: string;
  }
): SlideGenerationOptions[] {
  return [{
    templateId: 'announcement-template',
    content: {
      title: announcementData.title,
      message: announcementData.message,
      type: announcementData.type || 'announcement',
      date: announcementData.date,
      time: announcementData.time,
      location: announcementData.location,
      contact: announcementData.contact,
      urgency: announcementData.urgency || 'medium',
      imageUrl: announcementData.imageUrl,
      callToAction: announcementData.callToAction,
      showLogo: false
    } as AnnouncementSlideContent
  }];
}

export function getSlideSize(sizeName: string): Size {
  const standardSize = STANDARD_SLIDE_SIZES.find(size => size.name === sizeName);
  return standardSize ? { width: standardSize.width, height: standardSize.height } : DEFAULT_SLIDE_SIZE;
}

export function calculateOptimalFontSize(
  text: string,
  bounds: { width: number; height: number },
  fontFamily: string = 'Arial',
  minSize: number = 12,
  maxSize: number = 72
): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 24;

  let fontSize = maxSize;

  while (fontSize >= minSize) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);

    if (metrics.width <= bounds.width) {
      // Simple height estimation (actual height calculation would require more complex text metrics)
      const estimatedHeight = fontSize * 1.2; // rough line height
      if (estimatedHeight <= bounds.height) {
        return fontSize;
      }
    }

    fontSize -= 2;
  }

  return minSize;
}

export function hexToColor(hex: string): Color {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 1
  };
}

export function colorToHex(color: Color): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

export function validateTemplateContent(content: any, templateId: string): { valid: boolean; errors: string[] } {
  const template = templateManager.getTemplate(templateId);
  if (!template) {
    return { valid: false, errors: ['Template not found'] };
  }

  return template.validateContent(content);
}

export function getTemplatePreview(templateId: string, sampleContent?: any) {
  const template = templateManager.getTemplate(templateId);
  if (!template) {
    return null;
  }

  // Generate sample content based on template type
  let content = sampleContent;

  if (!content) {
    switch (template.category) {
      case 'song':
        content = {
          title: 'Amazing Grace',
          lyrics: 'Amazing grace, how sweet the sound\nThat saved a wretch like me',
          section: 'verse',
          sectionNumber: 1,
          showChords: false,
          showCopyright: false
        };
        break;
      case 'scripture':
        content = {
          verse: 'For God so loved the world that he gave his one and only Son...',
          reference: 'John 3:16',
          translation: 'NIV',
          showTranslation: true,
          theme: 'reading'
        };
        break;
      case 'announcement':
        content = {
          title: 'Church Event',
          message: 'Join us for this special occasion!',
          date: 'Sunday, December 15th',
          time: '6:00 PM',
          type: 'event',
          urgency: 'medium'
        };
        break;
    }
  }

  if (!content) {
    return null;
  }

  return templateManager.generateSlide({
    templateId,
    content
  });
}