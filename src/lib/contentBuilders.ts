/**
 * Content Builders - Standardized adapters for converting various content types
 * into the unified PresentationContent format.
 *
 * Each builder function takes raw data (scripture verses, songs, announcements, etc.)
 * and generates slides using the appropriate template, then wraps everything in
 * a PresentationContent object.
 */

import { PresentationContent } from './presentationSlice';
import type { Slide } from '../components/slides/SlideRenderer';
import { ScriptureTemplate } from '../rendering/templates/ScriptureTemplate';
import { SongTemplate } from '../rendering/templates/SongTemplate';
import { AnnouncementTemplate } from '../rendering/templates/AnnouncementTemplate';
import { Shape } from '../rendering/core/Shape';

// ============================================
// TYPES
// ============================================

export interface NavigatedVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation?: string;
}

export interface VerseGroup {
  verses: NavigatedVerse[];
  reference: string;
  isConsecutive: boolean;
}

// Import actual settings types from feature settings slice
import type { ScriptureSettings, SongSettings } from '../lib/featureSettingsSlice';

export interface SongSection {
  type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'tag' | 'intro' | 'outro';
  number?: number;
  lyrics: string;
}

export interface ServiceItem {
  id: string;
  type: string;
  title: string;
  content: any;
  slides?: Slide[];
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_SLIDE_SIZE = { width: 1920, height: 1080 };
const MAX_CACHE_SIZE = 100;

// Shape cache for performance optimization
const shapeCache = new Map<string, Shape[]>();

// ============================================
// SCRIPTURE CONTENT BUILDER
// ============================================

/**
 * Build presentation content from scripture verses
 */
export async function buildScriptureContent(
  verses: NavigatedVerse[],
  settings: ScriptureSettings,
  groupedVerses: VerseGroup[]
): Promise<PresentationContent> {
  console.log('📖 Building scripture content:', {
    verseCount: verses.length,
    groupCount: groupedVerses.length
  });

  const scriptureTemplate = new ScriptureTemplate(DEFAULT_SLIDE_SIZE);
  const slides: Slide[] = [];

  for (const group of groupedVerses) {
    const groupVerses = group.verses;

    if (groupVerses.length === 1) {
      // Single verse slide
      const verse = groupVerses[0];
      const scriptureSlideContent = {
        verse: verse.text || 'Loading...',
        reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
        translation: verse.translation || 'KJV',
        book: verse.book,
        chapter: verse.chapter,
        verseNumber: verse.verse,
        theme: 'reading' as const,
        showTranslation: true,
        emphasizeReference: true,
        featureSettings: {
          background: settings.background,
          typography: settings.typography
        }
      };

      // Check cache
      const cacheKey = generateShapeCacheKey(
        'scripture-single',
        verse.text || '',
        settings.background.type,
        settings.background.value || '',
        settings.typography
      );

      let shapes: Shape[];
      if (shapeCache.has(cacheKey)) {
        shapes = shapeCache.get(cacheKey)!;
      } else {
        shapes = scriptureTemplate.generateSlide(scriptureSlideContent);

        // Add to cache with LRU eviction
        if (shapeCache.size >= MAX_CACHE_SIZE) {
          const firstKey = shapeCache.keys().next().value;
          if (firstKey) shapeCache.delete(firstKey);
        }
        shapeCache.set(cacheKey, shapes);
      }

      const slideBackground = buildSlideBackground(settings.background);

      slides.push({
        id: `scripture-${verse.id || Date.now()}`,
        shapes: shapes,
        background: slideBackground,
        verseNumbers: [verse.verse],
        verseIds: [verse.id]
      });
    } else {
      // Multiple consecutive verses
      const firstVerse = groupVerses[0];
      const lastVerse = groupVerses[groupVerses.length - 1];
      const combinedText = groupVerses.map(v => `${v.verse} ${v.text}`).join(' ');

      const scriptureSlideContent = {
        verse: combinedText,
        reference: `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.verse}`,
        translation: firstVerse.translation || 'KJV',
        book: firstVerse.book,
        chapter: firstVerse.chapter,
        verseNumber: firstVerse.verse,
        theme: 'reading' as const,
        showTranslation: true,
        emphasizeReference: true,
        featureSettings: {
          background: settings.background,
          typography: settings.typography
        }
      };

      // Check cache
      const cacheKey = generateShapeCacheKey(
        'scripture-group',
        combinedText,
        settings.background.type,
        settings.background.value || '',
        settings.typography
      );

      let shapes: Shape[];
      if (shapeCache.has(cacheKey)) {
        shapes = shapeCache.get(cacheKey)!;
      } else {
        shapes = scriptureTemplate.generateSlide(scriptureSlideContent);

        // Add to cache with LRU eviction
        if (shapeCache.size >= MAX_CACHE_SIZE) {
          const firstKey = shapeCache.keys().next().value;
          if (firstKey) shapeCache.delete(firstKey);
        }
        shapeCache.set(cacheKey, shapes);
      }

      const slideBackground = buildSlideBackground(settings.background);

      slides.push({
        id: `scripture-group-${firstVerse.id}-${lastVerse.id}`,
        shapes: shapes,
        background: slideBackground,
        verseNumbers: groupVerses.map(v => v.verse),
        verseIds: groupVerses.map(v => v.id)
      });
    }
  }

  // Format reference for title
  const reference = formatScriptureReference(verses);

  return {
    id: `scripture-${Date.now()}`,
    type: 'scripture',
    title: reference,
    slides,
    source: 'scripture',
    metadata: {
      verses,
      reference,
      settings
    }
  };
}

/**
 * Build presentation content from a song
 */
export function buildSongContent(
  song: ServiceItem,
  settings: SongSettings
): PresentationContent {
  console.log('🎵 Building song content:', song.title);

  const songTemplate = new SongTemplate(DEFAULT_SLIDE_SIZE);
  const slides: Slide[] = [];
  const songContent = song.content;

  // Parse song sections
  const sections = parseSongSections(songContent);

  // Generate slides for each section
  sections.forEach((section, index) => {
    const songSlideContent = {
      title: song.title || songContent.title || 'Untitled Song',
      lyrics: String(section.lyrics || ''),
      section: section.type,
      sectionNumber: section.number,
      author: songContent.author,
      copyright: songContent.copyright,
      ccli: songContent.ccli || songContent.ccliNumber,
      key: songContent.key,
      tempo: songContent.tempo,
      showChords: false,
      showCopyright: index === sections.length - 1,
      // 🔑 KEY: Pass feature settings to template
      featureSettings: {
        background: settings.background,
        typography: settings.typography
      }
    };

    const shapes = songTemplate.generateSlide(songSlideContent);
    const slideBackground = buildSlideBackground(settings.background);

    slides.push({
      id: `song-${section.type}-${section.number || index}`,
      shapes: shapes,
      background: slideBackground
    });
  });

  return {
    id: song.id,
    type: 'song',
    title: song.title,
    slides,
    source: 'songs',
    metadata: {
      author: songContent.author,
      artist: songContent.artist,
      copyright: songContent.copyright,
      ccli: songContent.ccli || songContent.ccliNumber,
      key: songContent.key,
      tempo: songContent.tempo
    }
  };
}

/**
 * Build presentation content from an announcement
 */
export function buildAnnouncementContent(
  announcement: ServiceItem
): PresentationContent {
  console.log('📢 Building announcement content:', announcement.title);

  const announcementTemplate = new AnnouncementTemplate(DEFAULT_SLIDE_SIZE);

  const announcementSlideContent = {
    title: announcement.title || 'Announcement',
    message: announcement.content.text || '',
    details: announcement.content.details,
    date: announcement.content.date,
    time: announcement.content.time,
    location: announcement.content.location,
    contact: announcement.content.contact,
    imageUrl: announcement.content.imageUrl,
    callToAction: announcement.content.callToAction,
    type: (announcement.content.announcementType || 'announcement') as 'event' | 'announcement' | 'reminder' | 'welcome' | 'celebration',
    urgency: (announcement.content.urgency || 'medium') as 'low' | 'medium' | 'high',
    showLogo: false
  };

  const shapes = announcementTemplate.generateSlide(announcementSlideContent);

  const slideBackground = {
    type: 'color' as const,
    value: '#1a1a1a',
    opacity: 1
  };

  const slides: Slide[] = [{
    id: `announcement-${announcement.id}`,
    shapes: shapes,
    background: slideBackground
  }];

  return {
    id: announcement.id,
    type: 'announcement',
    title: announcement.title,
    slides,
    source: 'announcements',
    metadata: {
      text: announcement.content.text,
      announcementType: announcement.content.announcementType,
      urgency: announcement.content.urgency
    }
  };
}

/**
 * Convert existing ServiceItem to PresentationContent
 * This is useful for plan items that already have slides
 */
export function serviceItemToContent(item: ServiceItem): PresentationContent {
  return {
    id: item.id,
    type: item.type as any,
    title: item.title,
    slides: item.slides || [],
    source: 'plan',
    metadata: item.content
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Parse song content into sections
 */
function parseSongSections(songContent: any): SongSection[] {
  // If already has structured verses
  if (songContent.verses && Array.isArray(songContent.verses)) {
    const sections: SongSection[] = songContent.verses.map((verse: string, index: number) => ({
      type: 'verse' as const,
      number: index + 1,
      lyrics: verse
    }));

    // Add chorus if exists
    if (songContent.chorus) {
      sections.push({
        type: 'chorus',
        number: 1,
        lyrics: songContent.chorus
      });
    }

    return sections;
  }

  // Parse from lyrics string
  const lyricsString = String(songContent.lyrics || 'No lyrics available');
  return parseSongLyrics(lyricsString);
}

/**
 * Parse song lyrics string into sections
 */
function parseSongLyrics(lyrics: string): SongSection[] {
  const sections: SongSection[] = [];

  // Split by section markers like [Verse 1], [Chorus], etc.
  const sectionRegex = /\[(Verse|Chorus|Bridge|Pre-Chorus|Tag|Intro|Outro)\s*(\d*)\]/gi;
  const parts = lyrics.split(sectionRegex);

  if (parts.length > 1) {
    // Has section markers
    for (let i = 1; i < parts.length; i += 3) {
      const sectionType = parts[i].toLowerCase().replace('-', '') as any;
      const sectionNumber = parts[i + 1] ? parseInt(parts[i + 1]) : undefined;
      const sectionLyrics = parts[i + 2]?.trim() || '';

      if (sectionLyrics) {
        sections.push({
          type: sectionType,
          number: sectionNumber,
          lyrics: sectionLyrics
        });
      }
    }
  } else {
    // No section markers - split by blank lines
    const paragraphs = lyrics.split(/\n\s*\n/).filter(p => p.trim());

    paragraphs.forEach((paragraph, index) => {
      sections.push({
        type: 'verse',
        number: index + 1,
        lyrics: paragraph.trim()
      });
    });
  }

  return sections.length > 0 ? sections : [{
    type: 'verse',
    number: 1,
    lyrics: lyrics
  }];
}

/**
 * Format scripture reference for display
 */
function formatScriptureReference(verses: NavigatedVerse[]): string {
  if (!verses || verses.length === 0) return 'Scripture';

  const first = verses[0];
  const last = verses[verses.length - 1];

  if (verses.length === 1) {
    return `${first.book} ${first.chapter}:${first.verse}`;
  }

  if (first.chapter === last.chapter) {
    return `${first.book} ${first.chapter}:${first.verse}-${last.verse}`;
  }

  return `${first.book} ${first.chapter}:${first.verse} - ${last.chapter}:${last.verse}`;
}

/**
 * Build slide background from settings
 */
function buildSlideBackground(background: ScriptureSettings['background'] | SongSettings['background']): any {
  if (background.type === 'gradient' && background.gradient) {
    return {
      type: 'gradient' as const,
      gradient: {
        start: background.gradient.start,
        end: background.gradient.end,
        direction: background.gradient.direction
      },
      opacity: background.opacity
    };
  }

  return {
    type: background.type as 'color' | 'image',
    value: background.value || '#1a1a1a',
    opacity: background.opacity
  };
}

/**
 * Generate cache key for shape caching
 */
function generateShapeCacheKey(
  type: string,
  content: string,
  bgType: string,
  bgValue: string,
  typography: any
): string {
  return `${type}:${content.substring(0, 50)}:${bgType}:${bgValue}:${JSON.stringify(typography)}`;
}
