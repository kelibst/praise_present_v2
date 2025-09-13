import { 
  UniversalSlide, 
  ScriptureSlideContent, 
  SongSlideContent, 
  SlideTemplate, 
  SlideBackground, 
  TextFormatting 
} from './universalSlideSlice';
import { Verse } from './bibleSlice';
import { Song, SongSlide } from './songSlice';

// Default templates
const DEFAULT_TEMPLATES = {
  scripture: {
    id: 'scripture-default',
    name: 'Scripture Default',
    category: 'verse' as const,
    layout: {
      titlePosition: 'bottom' as const,
      contentAlignment: 'center' as const,
      backgroundOpacity: 1,
      padding: 40,
      margins: { top: 60, right: 60, bottom: 60, left: 60 }
    },
    defaultStyling: {
      titleFont: {
        family: 'Arial, sans-serif',
        size: 48,
        weight: 'bold' as const,
        color: '#FFFFFF'
      },
      contentFont: {
        family: 'Arial, sans-serif',
        size: 36,
        weight: 'normal' as const,
        color: '#FFFFFF',
        lineHeight: 1.4
      }
    }
  } as SlideTemplate,

  song: {
    id: 'song-default',
    name: 'Song Default',
    category: 'song' as const,
    layout: {
      titlePosition: 'top' as const,
      contentAlignment: 'center' as const,
      backgroundOpacity: 1,
      padding: 40,
      margins: { top: 40, right: 60, bottom: 40, left: 60 }
    },
    defaultStyling: {
      titleFont: {
        family: 'Arial, sans-serif',
        size: 42,
        weight: 'bold' as const,
        color: '#FFFFFF'
      },
      contentFont: {
        family: 'Arial, sans-serif',
        size: 32,
        weight: 'normal' as const,
        color: '#FFFFFF',
        lineHeight: 1.3
      }
    }
  } as SlideTemplate,

  note: {
    id: 'note-default',
    name: 'Note Default',
    category: 'content' as const,
    layout: {
      titlePosition: 'top' as const,
      contentAlignment: 'left' as const,
      backgroundOpacity: 1,
      padding: 40,
      margins: { top: 40, right: 60, bottom: 40, left: 60 }
    },
    defaultStyling: {
      titleFont: {
        family: 'Arial, sans-serif',
        size: 48,
        weight: 'bold' as const,
        color: '#FFFFFF'
      },
      contentFont: {
        family: 'Arial, sans-serif',
        size: 28,
        weight: 'normal' as const,
        color: '#FFFFFF',
        lineHeight: 1.5
      }
    }
  } as SlideTemplate
};

// Default backgrounds
const DEFAULT_BACKGROUNDS = {
  darkBlue: {
    type: 'gradient' as const,
    colors: ['#1e3a8a', '#1e40af'],
    opacity: 1
  } as SlideBackground,

  black: {
    type: 'solid' as const,
    colors: ['#000000'],
    opacity: 1
  } as SlideBackground,

  ocean: {
    type: 'gradient' as const,
    colors: ['#0891b2', '#06b6d4'],
    opacity: 1
  } as SlideBackground
};

// Convert Bible verse to Universal Slide
export const convertVerseToSlide = (verse: Verse, version?: string): UniversalSlide => {
  const reference = `${verse.book?.name || 'Unknown'} ${verse.chapter}:${verse.verse}`;
  
  const content: ScriptureSlideContent = {
    verses: [{
      book: verse.book?.name || 'Unknown',
      chapter: verse.chapter,
      verse: verse.verse,
      text: verse.text
    }],
    reference,
    version: version || verse.version?.name || 'Unknown',
    translation: version || verse.version?.name || 'Unknown'
  };

  return {
    id: `scripture-${verse.id}`,
    type: 'scripture',
    title: reference,
    content,
    template: DEFAULT_TEMPLATES.scripture,
    background: DEFAULT_BACKGROUNDS.darkBlue,
    textFormatting: DEFAULT_TEMPLATES.scripture.defaultStyling,
    metadata: {
      source: reference,
      usageCount: 0,
      tags: ['scripture', 'bible', verse.book?.testament || 'unknown'],
      category: 'scripture'
    },
    transitions: {
      enter: 'fade',
      exit: 'fade',
      duration: 300
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Convert multiple verses to Universal Slide
export const convertVersesToSlide = (verses: Verse[], reference: string, version?: string): UniversalSlide => {
  const content: ScriptureSlideContent = {
    verses: verses.map(verse => ({
      book: verse.book?.name || 'Unknown',
      chapter: verse.chapter,
      verse: verse.verse,
      text: verse.text
    })),
    reference,
    version: version || verses[0]?.version?.name || 'Unknown',
    translation: version || verses[0]?.version?.name || 'Unknown'
  };

  return {
    id: `scripture-${verses.map(v => v.id).join('-')}`,
    type: 'scripture',
    title: reference,
    content,
    template: DEFAULT_TEMPLATES.scripture,
    background: DEFAULT_BACKGROUNDS.darkBlue,
    textFormatting: DEFAULT_TEMPLATES.scripture.defaultStyling,
    metadata: {
      source: reference,
      usageCount: 0,
      tags: ['scripture', 'bible', verses[0]?.book?.testament || 'unknown'],
      category: 'scripture'
    },
    transitions: {
      enter: 'fade',
      exit: 'fade',
      duration: 300
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Convert Song slide to Universal Slide
export const convertSongSlideToSlide = (song: Song, songSlide: SongSlide): UniversalSlide => {
  const content: SongSlideContent = {
    songId: song.id,
    slideId: songSlide.id,
    slideType: songSlide.type,
    slideNumber: songSlide.number,
    lyrics: songSlide.content,
    chords: songSlide.chords,
    key: song.key,
    tempo: song.tempo,
    ccliNumber: song.ccliNumber
  };

  return {
    id: `song-${song.id}-${songSlide.id}`,
    type: 'song',
    title: `${song.title} - ${songSlide.title}`,
    content,
    template: DEFAULT_TEMPLATES.song,
    background: DEFAULT_BACKGROUNDS.ocean,
    textFormatting: DEFAULT_TEMPLATES.song.defaultStyling,
    metadata: {
      source: song.title,
      usageCount: song.usageCount || 0,
      tags: ['song', 'worship'],
      category: 'song',
      copyright: song.copyright
    },
    transitions: {
      enter: 'fade',
      exit: 'fade',
      duration: 300
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Convert entire Song to multiple Universal Slides
export const convertSongToSlides = (song: Song): UniversalSlide[] => {
  if (!song.structure?.slides) {
    return [];
  }

  return song.structure.slides.map(slide => convertSongSlideToSlide(song, slide));
};

// Convert text note to Universal Slide
export const convertNoteToSlide = (title: string, text: string, bulletPoints?: string[]): UniversalSlide => {
  const content = {
    text,
    bulletPoints,
    richText: false
  };

  return {
    id: `note-${Date.now()}`,
    type: 'note',
    title,
    content,
    template: DEFAULT_TEMPLATES.note,
    background: DEFAULT_BACKGROUNDS.black,
    textFormatting: DEFAULT_TEMPLATES.note.defaultStyling,
    metadata: {
      usageCount: 0,
      tags: ['note', 'text'],
      category: 'note'
    },
    transitions: {
      enter: 'fade',
      exit: 'fade',
      duration: 300
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Convert announcement to Universal Slide
export const convertAnnouncementToSlide = (title: string, message: string, options?: {
  startDate?: string;
  endDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  contactInfo?: string;
}): UniversalSlide => {
  const content = {
    title,
    message,
    startDate: options?.startDate,
    endDate: options?.endDate,
    priority: options?.priority || 'medium',
    contactInfo: options?.contactInfo
  };

  return {
    id: `announcement-${Date.now()}`,
    type: 'announcement',
    title,
    content,
    template: DEFAULT_TEMPLATES.note, // Reuse note template
    background: DEFAULT_BACKGROUNDS.darkBlue,
    textFormatting: DEFAULT_TEMPLATES.note.defaultStyling,
    metadata: {
      usageCount: 0,
      tags: ['announcement', options?.priority || 'medium'],
      category: 'announcement'
    },
    transitions: {
      enter: 'slide-up',
      exit: 'slide-down',
      duration: 500
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Helper function to create a blank slide
export const createBlankSlide = (type: UniversalSlide['type'] = 'custom'): UniversalSlide => {
  const template = DEFAULT_TEMPLATES.note; // Use note template as base
  
  return {
    id: `${type}-${Date.now()}`,
    type,
    title: 'New Slide',
    content: type === 'note' ? { text: '', bulletPoints: [] } : {},
    template,
    background: DEFAULT_BACKGROUNDS.black,
    textFormatting: template.defaultStyling,
    metadata: {
      usageCount: 0,
      tags: [type],
      category: type
    },
    transitions: {
      enter: 'fade',
      exit: 'fade',
      duration: 300
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Export default templates and backgrounds for use in editors
export { DEFAULT_TEMPLATES, DEFAULT_BACKGROUNDS }; 