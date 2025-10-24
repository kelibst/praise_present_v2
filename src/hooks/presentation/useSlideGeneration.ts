import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../lib/store';
import { updateServiceItem } from '../../lib/serviceItemsSlice';
import {
  ScriptureTemplate,
  SongTemplate,
  AnnouncementTemplate,
  Shape
} from '../../rendering';
import { DEFAULT_SLIDE_SIZE } from '../../rendering/templates/templateUtils';
import { ServiceItem } from '../../components/service/ServiceItem';
import { Slide as NewSlide } from '../../components/slides';
import { scriptureNavigationService, NavigatedVerse } from '../../lib/services/scriptureNavigationService';
import { parseSongLyrics } from '../../lib/presentation/songParser';
import { generateShapeCacheKey, getFromCache, addToCache } from '../../lib/presentation/slideCache';

// Extended Slide interface with scripture-specific properties
interface Slide extends NewSlide {
  duration?: number;
  verseNumbers?: number[];
  verseIds?: string[];
}

interface UseSlideGenerationProps {
  scriptureSettings: any;
  songSettings: any;
  liveDisplayActive: boolean;
  sendSlideToLive: (slide: Slide, item: ServiceItem, index: number) => Promise<void>;
}

/**
 * Custom hook for slide generation logic (scripture, songs, announcements)
 * Handles caching, template generation, and Redux state updates
 */
export const useSlideGeneration = ({
  scriptureSettings,
  songSettings,
  liveDisplayActive,
  sendSlideToLive
}: UseSlideGenerationProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);

  /**
   * Generate slides for a service item
   * Returns the updated item with generated slides
   */
  const generateSlidesForItem = async (
    item: ServiceItem,
    autoPresent = false
  ): Promise<ServiceItem | null> => {
    if (isGeneratingSlides) return null;

    // If item already has slides, use them (preserves customizations)
    if (item.slides && item.slides.length > 0) {
      console.log('📋 Using existing slides for item (preserving customizations):', {
        itemId: item.id,
        slideCount: item.slides.length
      });

      // Auto-present if requested
      if (autoPresent && item.slides[0] && liveDisplayActive) {
        await sendSlideToLive(item.slides[0], item, 0);
      }

      return item;
    }

    try {
      setIsGeneratingSlides(true);
      let slides: Slide[] = [];

      // Generate Scripture Slides
      if (item.type === 'scripture' && item.content.verses) {
        slides = await generateScriptureSlides(item);
      }
      // Generate Song Slides
      else if (item.type === 'song' && item.content.lyrics) {
        slides = generateSongSlides(item);
      }
      // Generate Announcement Slides
      else if (item.type === 'announcement' && item.content.text) {
        slides = generateAnnouncementSlides(item);
      }

      const updatedItem: ServiceItem = { ...item, slides };

      // Update the item in Redux store
      dispatch(updateServiceItem(updatedItem));

      // Auto-present if requested
      if (autoPresent && slides.length > 0 && liveDisplayActive) {
        await sendSlideToLive(slides[0] as any, updatedItem, 0);
      }

      return updatedItem;
    } catch (error) {
      console.error('Failed to generate slides:', error);
      return null;
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  /**
   * Generate scripture slides with verse grouping and caching
   */
  const generateScriptureSlides = async (item: ServiceItem): Promise<Slide[]> => {
    const slides: Slide[] = [];
    const scriptureTemplate = new ScriptureTemplate(DEFAULT_SLIDE_SIZE);

    // Use navigation service to group consecutive verses efficiently
    const groupedVerses = scriptureNavigationService.groupConsecutiveVerses(
      item.content.verses as NavigatedVerse[]
    );

    for (const group of groupedVerses) {
      const verses = group.verses;

      if (verses.length === 1) {
        // Single verse slide
        const verse = verses[0];
        const scriptureContent = {
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
            background: scriptureSettings.background,
            typography: scriptureSettings.typography
          }
        };

        // Check cache before generating shapes
        const cacheKey = generateShapeCacheKey(
          'scripture-single',
          verse.text || '',
          scriptureSettings.background.type,
          scriptureSettings.background.value || '',
          scriptureSettings.typography
        );

        let shapes: Shape[];
        const cachedShapes = getFromCache(cacheKey);

        if (cachedShapes) {
          console.log('✅ Using cached shapes for verse:', verse.verse);
          shapes = cachedShapes;
        } else {
          console.log('🔨 Generating new shapes for verse:', verse.verse);
          shapes = scriptureTemplate.generateSlide(scriptureContent);
          addToCache(cacheKey, shapes);
        }

        const slideBackground = createSlideBackground(scriptureSettings.background);

        slides.push({
          id: `scripture-${verse.id || Date.now()}`,
          shapes: shapes,
          background: slideBackground,
          verseNumbers: [verse.verse],
          verseIds: [verse.id]
        });
      } else {
        // Multiple consecutive verses on one slide
        const firstVerse = verses[0];
        const lastVerse = verses[verses.length - 1];
        const combinedText = verses.map(v => `${v.verse} ${v.text}`).join(' ');

        const scriptureContent = {
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
            background: scriptureSettings.background,
            typography: scriptureSettings.typography
          }
        };

        // Check cache
        const cacheKey = generateShapeCacheKey(
          'scripture-group',
          combinedText,
          scriptureSettings.background.type,
          scriptureSettings.background.value || '',
          scriptureSettings.typography
        );

        let shapes: Shape[];
        const cachedShapes = getFromCache(cacheKey);

        if (cachedShapes) {
          console.log('✅ Using cached shapes for verse group:', `${firstVerse.verse}-${lastVerse.verse}`);
          shapes = cachedShapes;
        } else {
          console.log('🔨 Generating new shapes for verse group:', `${firstVerse.verse}-${lastVerse.verse}`);
          shapes = scriptureTemplate.generateSlide(scriptureContent);
          addToCache(cacheKey, shapes);
        }

        const slideBackground = createSlideBackground(scriptureSettings.background);

        slides.push({
          id: `scripture-group-${firstVerse.id}-${lastVerse.id}`,
          shapes: shapes,
          background: slideBackground,
          verseNumbers: verses.map(v => v.verse),
          verseIds: verses.map(v => v.id)
        });
      }
    }

    return slides;
  };

  /**
   * Generate song slides from lyrics
   */
  const generateSongSlides = (item: ServiceItem): Slide[] => {
    const slides: Slide[] = [];
    const songTemplate = new SongTemplate(DEFAULT_SLIDE_SIZE);
    const songContent = item.content;

    // Handle structured verses array
    if (songContent.verses && Array.isArray(songContent.verses)) {
      songContent.verses.forEach((verse: string, index: number) => {
        const songSlideContent = {
          title: songContent.title || 'Untitled Song',
          lyrics: verse,
          section: 'verse',
          sectionNumber: index + 1,
          author: songContent.author,
          copyright: songContent.copyright,
          ccli: songContent.ccli,
          key: songContent.key,
          tempo: songContent.tempo,
          showChords: false,
          showCopyright: index === songContent.verses.length - 1
        };

        const shapes = songTemplate.generateSlide(songSlideContent);
        const slideBackground = createSlideBackground(songSettings.background);

        slides.push({
          id: `song-verse-${index}`,
          shapes: shapes,
          background: slideBackground
        });
      });

      // Add chorus if exists
      if (songContent.chorus) {
        const chorusContent = {
          title: songContent.title || 'Untitled Song',
          lyrics: songContent.chorus,
          section: 'chorus',
          sectionNumber: 1,
          author: songContent.author,
          copyright: songContent.copyright,
          ccli: songContent.ccli,
          showChords: false,
          showCopyright: false
        };

        const shapes = songTemplate.generateSlide(chorusContent);
        const slideBackground = createSlideBackground(songSettings.background);

        slides.push({
          id: 'song-chorus',
          shapes: shapes,
          background: slideBackground
        });
      }
    } else {
      // Handle simple lyrics string - parse into sections
      const lyricsString = String(songContent.lyrics || 'No lyrics available');
      const sections = parseSongLyrics(lyricsString);

      console.log('🎵 Parsed song sections:', {
        title: item.title,
        sectionCount: sections.length,
        sections: sections.map(s => `${s.type}${s.number ? ` ${s.number}` : ''}`)
      });

      sections.forEach((section, index) => {
        const songSlideContent = {
          title: item.title || songContent.title || 'Untitled Song',
          lyrics: String(section.lyrics || ''),
          section: section.type,
          sectionNumber: section.number,
          author: songContent.author,
          copyright: songContent.copyright,
          ccli: songContent.ccli || songContent.ccliNumber,
          key: songContent.key,
          tempo: songContent.tempo,
          showChords: false,
          showCopyright: index === sections.length - 1
        };

        const shapes = songTemplate.generateSlide(songSlideContent);
        const slideBackground = createSlideBackground(songSettings.background);

        slides.push({
          id: `song-${section.type}-${section.number || index}`,
          shapes: shapes,
          background: slideBackground
        });
      });
    }

    return slides;
  };

  /**
   * Generate announcement slides
   */
  const generateAnnouncementSlides = (item: ServiceItem): Slide[] => {
    const announcementTemplate = new AnnouncementTemplate(DEFAULT_SLIDE_SIZE);

    console.log('📢 Generating announcement slide:', {
      title: item.title,
      contentLength: item.content.text?.length
    });

    const announcementContent = {
      title: item.title || 'Announcement',
      message: item.content.text || '',
      details: item.content.details,
      date: item.content.date,
      time: item.content.time,
      location: item.content.location,
      contact: item.content.contact,
      imageUrl: item.content.imageUrl,
      callToAction: item.content.callToAction,
      type: (item.content.announcementType || 'announcement') as 'event' | 'announcement' | 'reminder' | 'welcome' | 'celebration',
      urgency: (item.content.urgency || 'medium') as 'low' | 'medium' | 'high',
      showLogo: false
    };

    const shapes = announcementTemplate.generateSlide(announcementContent);

    // Use default dark background for announcements
    const slideBackground = {
      type: 'color' as const,
      value: '#1a1a1a',
      opacity: 1
    };

    console.log('✅ Announcement slide generated');

    return [{
      id: `announcement-${item.id}`,
      shapes: shapes,
      background: slideBackground
    }];
  };

  /**
   * Helper: Create slide background from settings
   */
  const createSlideBackground = (backgroundSettings: any) => {
    if (backgroundSettings.type === 'gradient' && backgroundSettings.gradient) {
      return {
        type: 'gradient' as const,
        gradient: {
          start: backgroundSettings.gradient.start,
          end: backgroundSettings.gradient.end,
          direction: backgroundSettings.gradient.direction
        },
        opacity: backgroundSettings.opacity
      };
    }

    return {
      type: backgroundSettings.type as 'color' | 'image',
      value: backgroundSettings.value || '#1a1a1a',
      opacity: backgroundSettings.opacity
    };
  };

  return {
    generateSlidesForItem,
    isGeneratingSlides
  };
};
