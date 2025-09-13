import {
  convertVerseToSlide,
  convertVersesToSlide,
  convertSongSlideToSlide,
  convertSongToSlides,
  convertNoteToSlide,
  convertAnnouncementToSlide,
  createBlankSlide,
  DEFAULT_TEMPLATES,
  DEFAULT_BACKGROUNDS
} from '../slideConverters';
import { Verse, Book, Version } from '../bibleSlice';
import { Song, SongSlide } from '../songSlice';
import { UniversalSlide } from '../universalSlideSlice';

// Mock Date.now to return consistent timestamp with counter for unique IDs
const MOCK_TIMESTAMP = 1640995200000; // 2022-01-01 00:00:00
const MOCK_ISO_DATE = '2022-01-01T00:00:00.000Z';
let idCounter = 0;

beforeEach(() => {
  jest.clearAllMocks();
  idCounter = 0;
  
  // Mock Date.now to increment counter for unique IDs
  (Date.now as jest.Mock).mockImplementation(() => MOCK_TIMESTAMP + idCounter++);
  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(MOCK_ISO_DATE);
});

describe('slideConverters', () => {
  // ===== MOCK DATA =====
  
  const mockBook: Book = {
    id: 1,
    name: 'John',
    shortName: 'Jn',
    testament: 'NT',
    category: 'Gospel',
    chapters: 21,
    order: 43
  };

  const mockVersion: Version = {
    id: 'kjv',
    name: 'King James Version',
    fullName: 'King James Version (KJV)',
    translationId: 'kjv',
    isDefault: true,
    year: 1611,
    publisher: 'Cambridge University Press'
  };

  const mockVerse: Verse = {
    id: 'verse-john-3-16',
    bookId: 1,
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    versionId: 'kjv',
    book: mockBook,
    version: mockVersion
  };

  const mockSongSlide: SongSlide = {
    id: 'slide-verse-1',
    type: 'verse',
    number: 1,
    title: 'Verse 1',
    content: 'Amazing grace how sweet the sound\nThat saved a wretch like me\nI once was lost but now am found\nWas blind but now I see',
    chords: 'G C G D Em C G D G'
  };

  const mockSong: Song = {
    id: 'song-amazing-grace',
    title: 'Amazing Grace',
    artist: 'John Newton',
    author: 'John Newton',
    lyrics: 'Amazing grace how sweet the sound...',
    structure: {
      slides: [mockSongSlide],
      order: ['slide-verse-1']
    },
    chords: 'Key of G',
    ccliNumber: '22025',
    key: 'G',
    tempo: '90',
    tags: ['hymn', 'grace', 'classic'],
    category: 'Hymn',
    copyright: 'Public Domain',
    notes: 'Traditional hymn, excellent for communion',
    createdAt: MOCK_ISO_DATE,
    updatedAt: MOCK_ISO_DATE,
    usageCount: 15
  };

  // ===== convertVerseToSlide TESTS =====
  
  describe('convertVerseToSlide', () => {
    it('should convert a verse with complete data to Universal Slide', () => {
      const slide = convertVerseToSlide(mockVerse, 'King James Version');

      expect(slide).toBeValidUniversalSlide();
      expect(slide.id).toBe('scripture-verse-john-3-16');
      expect(slide.type).toBe('scripture');
      expect(slide.title).toBe('John 3:16');
      
      // Check content structure
      expect(slide.content.verses).toHaveLength(1);
      expect(slide.content.verses[0]).toEqual({
        book: 'John',
        chapter: 3,
        verse: 16,
        text: mockVerse.text
      });
      expect(slide.content.reference).toBe('John 3:16');
      expect(slide.content.version).toBe('King James Version');
      expect(slide.content.translation).toBe('King James Version');

      // Check template and styling
      expect(slide.template).toEqual(DEFAULT_TEMPLATES.scripture);
      expect(slide.background).toEqual(DEFAULT_BACKGROUNDS.darkBlue);
      expect(slide.textFormatting).toEqual(DEFAULT_TEMPLATES.scripture.defaultStyling);

      // Check metadata
      expect(slide.metadata.source).toBe('John 3:16');
      expect(slide.metadata.usageCount).toBe(0);
      expect(slide.metadata.tags).toContain('scripture');
      expect(slide.metadata.tags).toContain('bible');
      expect(slide.metadata.tags).toContain('NT');
      expect(slide.metadata.category).toBe('scripture');

      // Check transitions
      expect(slide.transitions.enter).toBe('fade');
      expect(slide.transitions.exit).toBe('fade');
      expect(slide.transitions.duration).toBe(300);

      // Check timestamps
      expect(slide.createdAt).toBe(MOCK_ISO_DATE);
      expect(slide.updatedAt).toBe(MOCK_ISO_DATE);
    });

    it('should handle verse with missing book data', () => {
      const verseWithoutBook: Verse = {
        ...mockVerse,
        book: undefined
      };

      const slide = convertVerseToSlide(verseWithoutBook);

      expect(slide).toBeValidUniversalSlide();
      expect(slide.title).toBe('Unknown 3:16');
      expect(slide.content.verses[0].book).toBe('Unknown');
      expect(slide.metadata.tags).toContain('unknown');
    });

    it('should handle verse with missing version data', () => {
      const verseWithoutVersion: Verse = {
        ...mockVerse,
        version: undefined
      };

      const slide = convertVerseToSlide(verseWithoutVersion);

      expect(slide).toBeValidUniversalSlide();
      expect(slide.content.version).toBe('Unknown');
      expect(slide.content.translation).toBe('Unknown');
    });

    it('should use provided version override', () => {
      const customVersion = 'New International Version';
      const slide = convertVerseToSlide(mockVerse, customVersion);

      expect(slide.content.version).toBe(customVersion);
      expect(slide.content.translation).toBe(customVersion);
    });

    it('should handle minimal verse data', () => {
      const minimalVerse: Verse = {
        id: 'minimal-verse',
        bookId: 0,
        chapter: 1,
        verse: 1,
        text: 'Test verse text',
        versionId: 'test'
      };

      const slide = convertVerseToSlide(minimalVerse);

      expect(slide).toBeValidUniversalSlide();
      expect(slide.title).toBe('Unknown 1:1');
      expect(slide.content.verses[0].text).toBe('Test verse text');
    });
  });

  // ===== convertVersesToSlide TESTS =====
  
  describe('convertVersesToSlide', () => {
    const mockVerse2: Verse = {
      id: 'verse-john-3-17',
      bookId: 1,
      chapter: 3,
      verse: 17,
      text: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
      versionId: 'kjv',
      book: mockBook,
      version: mockVersion
    };

    it('should convert multiple verses to single slide', () => {
      const verses = [mockVerse, mockVerse2];
      const reference = 'John 3:16-17';
      const slide = convertVersesToSlide(verses, reference, 'King James Version');

      expect(slide).toBeValidUniversalSlide();
      expect(slide.id).toBe('scripture-verse-john-3-16-verse-john-3-17');
      expect(slide.type).toBe('scripture');
      expect(slide.title).toBe('John 3:16-17');
      
      // Check content structure
      expect(slide.content.verses).toHaveLength(2);
      expect(slide.content.verses[0].verse).toBe(16);
      expect(slide.content.verses[1].verse).toBe(17);
      expect(slide.content.reference).toBe('John 3:16-17');
    });

    it('should handle empty verses array', () => {
      const slide = convertVersesToSlide([], 'Unknown Reference');

      expect(slide).toBeValidUniversalSlide();
      expect(slide.content.verses).toHaveLength(0);
      expect(slide.content.version).toBe('Unknown');
    });

    it('should use first verse for version when no override provided', () => {
      const verses = [mockVerse, mockVerse2];
      const slide = convertVersesToSlide(verses, 'John 3:16-17');

      expect(slide.content.version).toBe('King James Version');
      expect(slide.content.translation).toBe('King James Version');
    });
  });

  // ===== convertSongSlideToSlide TESTS =====
  
  describe('convertSongSlideToSlide', () => {
    it('should convert song slide with complete data to Universal Slide', () => {
      const slide = convertSongSlideToSlide(mockSong, mockSongSlide);

      expect(slide).toBeValidUniversalSlide();
      expect(slide.id).toBe('song-song-amazing-grace-slide-verse-1');
      expect(slide.type).toBe('song');
      expect(slide.title).toBe('Amazing Grace - Verse 1');
      
      // Check content structure
      expect(slide.content.songId).toBe('song-amazing-grace');
      expect(slide.content.slideId).toBe('slide-verse-1');
      expect(slide.content.slideType).toBe('verse');
      expect(slide.content.slideNumber).toBe(1);
      expect(slide.content.lyrics).toBe(mockSongSlide.content);
      expect(slide.content.chords).toBe(mockSongSlide.chords);
      expect(slide.content.key).toBe('G');
      expect(slide.content.tempo).toBe('90');
      expect(slide.content.ccliNumber).toBe('22025');

      // Check template and styling
      expect(slide.template).toEqual(DEFAULT_TEMPLATES.song);
      expect(slide.background).toEqual(DEFAULT_BACKGROUNDS.ocean);

      // Check metadata
      expect(slide.metadata.source).toBe('Amazing Grace');
      expect(slide.metadata.usageCount).toBe(15);
      expect(slide.metadata.tags).toContain('song');
      expect(slide.metadata.tags).toContain('worship');
      expect(slide.metadata.category).toBe('song');
      expect(slide.metadata.copyright).toBe('Public Domain');
    });

    it('should handle song with minimal data', () => {
      const minimalSong: Song = {
        id: 'minimal-song',
        title: 'Test Song',
        lyrics: 'Test lyrics',
        structure: { slides: [], order: [] },
        tags: [],
        createdAt: MOCK_ISO_DATE,
        updatedAt: MOCK_ISO_DATE,
        usageCount: 0
      };

      const minimalSlide: SongSlide = {
        id: 'minimal-slide',
        type: 'chorus',
        title: 'Chorus',
        content: 'Test chorus content'
      };

      const slide = convertSongSlideToSlide(minimalSong, minimalSlide);

      expect(slide).toBeValidUniversalSlide();
      expect(slide.title).toBe('Test Song - Chorus');
      expect(slide.content.key).toBeUndefined();
      expect(slide.content.tempo).toBeUndefined();
      expect(slide.metadata.usageCount).toBe(0);
    });

    it('should handle all slide types correctly', () => {
      const slideTypes: Array<SongSlide['type']> = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'tag'];
      
      slideTypes.forEach(type => {
        const testSlide: SongSlide = {
          ...mockSongSlide,
          type,
          title: type.charAt(0).toUpperCase() + type.slice(1)
        };

        const slide = convertSongSlideToSlide(mockSong, testSlide);
        expect(slide.content.slideType).toBe(type);
      });
    });
  });

  // ===== convertSongToSlides TESTS =====
  
  describe('convertSongToSlides', () => {
    it('should convert complete song to multiple slides', () => {
      const verseSlide: SongSlide = {
        id: 'verse-1',
        type: 'verse',
        number: 1,
        title: 'Verse 1',
        content: 'Amazing grace how sweet the sound'
      };

      const chorusSlide: SongSlide = {
        id: 'chorus-1',
        type: 'chorus',
        title: 'Chorus',
        content: 'How sweet the sound'
      };

      const fullSong: Song = {
        ...mockSong,
        structure: {
          slides: [verseSlide, chorusSlide],
          order: ['verse-1', 'chorus-1']
        }
      };

      const slides = convertSongToSlides(fullSong);

      expect(slides).toHaveLength(2);
      expect(slides[0].title).toBe('Amazing Grace - Verse 1');
      expect(slides[1].title).toBe('Amazing Grace - Chorus');
      expect(slides[0].content.slideType).toBe('verse');
      expect(slides[1].content.slideType).toBe('chorus');
    });

    it('should return empty array for song without structure', () => {
      const songWithoutStructure: Song = {
        ...mockSong,
        structure: { slides: [], order: [] }
      };

      const slides = convertSongToSlides(songWithoutStructure);
      expect(slides).toHaveLength(0);
    });

    it('should return empty array for song with undefined structure', () => {
      const songWithUndefinedStructure: Song = {
        ...mockSong,
        structure: undefined as any
      };

      const slides = convertSongToSlides(songWithUndefinedStructure);
      expect(slides).toHaveLength(0);
    });
  });

  // ===== convertNoteToSlide TESTS =====
  
  describe('convertNoteToSlide', () => {
    it('should convert note with text and bullet points to Universal Slide', () => {
      const title = 'Sermon Notes';
      const text = 'Main point about grace and mercy';
      const bulletPoints = ['Grace is unmerited favor', 'Mercy is not getting what we deserve', 'Both are gifts from God'];

      const slide = convertNoteToSlide(title, text, bulletPoints);

      expect(slide).toBeValidUniversalSlide();
      expect(slide.type).toBe('note');
      expect(slide.title).toBe(title);
      
      // Check content
      expect(slide.content.text).toBe(text);
      expect(slide.content.bulletPoints).toEqual(bulletPoints);
      expect(slide.content.richText).toBe(false);

      // Check template and styling
      expect(slide.template).toEqual(DEFAULT_TEMPLATES.note);
      expect(slide.background).toEqual(DEFAULT_BACKGROUNDS.black);

      // Check metadata
      expect(slide.metadata.tags).toContain('note');
      expect(slide.metadata.tags).toContain('text');
      expect(slide.metadata.category).toBe('note');
    });

    it('should handle note with only text', () => {
      const title = 'Simple Note';
      const text = 'Just some text content';

      const slide = convertNoteToSlide(title, text);

      expect(slide).toBeValidUniversalSlide();
      expect(slide.content.text).toBe(text);
      expect(slide.content.bulletPoints).toBeUndefined();
    });

    it('should handle empty text', () => {
      const slide = convertNoteToSlide('Empty Note', '');

      expect(slide).toBeValidUniversalSlide();
      expect(slide.content.text).toBe('');
    });

    it('should generate unique IDs for different notes created at same time', () => {
      const slide1 = convertNoteToSlide('Note 1', 'Content 1');
      const slide2 = convertNoteToSlide('Note 2', 'Content 2');

      // IDs should be different because of the counter mechanism
      expect(slide1.id).not.toBe(slide2.id);
      expect(slide1.id).toBe(`note-${MOCK_TIMESTAMP}`);
      expect(slide2.id).toBe(`note-${MOCK_TIMESTAMP + 1}`);
      expect(slide1.id).toMatch(/^note-\d+$/);
      expect(slide2.id).toMatch(/^note-\d+$/);
    });
  });

  // ===== convertAnnouncementToSlide TESTS =====
  
  describe('convertAnnouncementToSlide', () => {
    it('should convert announcement with complete options to Universal Slide', () => {
      const title = 'Church Potluck';
      const message = 'Join us for our monthly potluck dinner this Saturday at 6 PM in the fellowship hall.';
      const options = {
        startDate: '2022-01-15',
        endDate: '2022-01-15',
        priority: 'high' as const,
        contactInfo: 'Contact Mary at 555-1234'
      };

      const slide = convertAnnouncementToSlide(title, message, options);

      expect(slide).toBeValidUniversalSlide();
      expect(slide.type).toBe('announcement');
      expect(slide.title).toBe(title);
      
      // Check content
      expect(slide.content.title).toBe(title);
      expect(slide.content.message).toBe(message);
      expect(slide.content.startDate).toBe('2022-01-15');
      expect(slide.content.endDate).toBe('2022-01-15');
      expect(slide.content.priority).toBe('high');
      expect(slide.content.contactInfo).toBe('Contact Mary at 555-1234');

      // Check template and styling
      expect(slide.template).toEqual(DEFAULT_TEMPLATES.note);
      expect(slide.background).toEqual(DEFAULT_BACKGROUNDS.darkBlue);

      // Check metadata
      expect(slide.metadata.tags).toContain('announcement');
      expect(slide.metadata.tags).toContain('high');
      expect(slide.metadata.category).toBe('announcement');

      // Check transitions (should be different from default)
      expect(slide.transitions.enter).toBe('slide-up');
      expect(slide.transitions.exit).toBe('slide-down');
      expect(slide.transitions.duration).toBe(500);
    });

    it('should handle announcement with minimal data', () => {
      const title = 'Simple Announcement';
      const message = 'Basic message';

      const slide = convertAnnouncementToSlide(title, message);

      expect(slide).toBeValidUniversalSlide();
      expect(slide.content.priority).toBe('medium'); // default priority
      expect(slide.content.startDate).toBeUndefined();
      expect(slide.content.endDate).toBeUndefined();
      expect(slide.content.contactInfo).toBeUndefined();
      expect(slide.metadata.tags).toContain('medium');
    });

    it('should handle all priority levels', () => {
      const priorities: Array<'low' | 'medium' | 'high' | 'urgent'> = ['low', 'medium', 'high', 'urgent'];
      
      priorities.forEach(priority => {
        const slide = convertAnnouncementToSlide('Test', 'Message', { priority });
        expect(slide.content.priority).toBe(priority);
        expect(slide.metadata.tags).toContain(priority);
      });
    });
  });

  // ===== createBlankSlide TESTS =====
  
  describe('createBlankSlide', () => {
    it('should create blank slide with default type', () => {
      const slide = createBlankSlide();

      expect(slide).toBeValidUniversalSlide();
      expect(slide.type).toBe('custom');
      expect(slide.title).toBe('New Slide');
      expect(slide.content).toEqual({});
      expect(slide.template).toEqual(DEFAULT_TEMPLATES.note);
      expect(slide.background).toEqual(DEFAULT_BACKGROUNDS.black);
    });

    it('should create blank slide with specified type', () => {
      const types: Array<UniversalSlide['type']> = ['scripture', 'song', 'media', 'note', 'announcement', 'custom'];
      
      types.forEach(type => {
        const slide = createBlankSlide(type);
        expect(slide.type).toBe(type);
        expect(slide.metadata.tags).toContain(type);
        expect(slide.metadata.category).toBe(type);
      });
    });

    it('should create note-specific content for note type', () => {
      const slide = createBlankSlide('note');
      
      expect(slide.content).toEqual({
        text: '',
        bulletPoints: []
      });
    });

    it('should generate unique IDs for different blank slides', () => {
      const slide1 = createBlankSlide();
      const slide2 = createBlankSlide();

      // IDs should be different because of the counter mechanism
      expect(slide1.id).not.toBe(slide2.id);
      expect(slide1.id).toBe(`custom-${MOCK_TIMESTAMP}`);
      expect(slide2.id).toBe(`custom-${MOCK_TIMESTAMP + 1}`);
      expect(slide1.id).toMatch(/^custom-\d+$/);
      expect(slide2.id).toMatch(/^custom-\d+$/);
    });
  });

  // ===== DEFAULT TEMPLATES AND BACKGROUNDS TESTS =====
  
  describe('DEFAULT_TEMPLATES', () => {
    it('should have all required template types', () => {
      expect(DEFAULT_TEMPLATES.scripture).toBeDefined();
      expect(DEFAULT_TEMPLATES.song).toBeDefined();
      expect(DEFAULT_TEMPLATES.note).toBeDefined();
    });

    it('should have valid template structure', () => {
      Object.values(DEFAULT_TEMPLATES).forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.layout).toBeDefined();
        expect(template.defaultStyling).toBeDefined();
        expect(template.defaultStyling.titleFont).toBeDefined();
        expect(template.defaultStyling.contentFont).toBeDefined();
      });
    });
  });

  describe('DEFAULT_BACKGROUNDS', () => {
    it('should have all required background types', () => {
      expect(DEFAULT_BACKGROUNDS.darkBlue).toBeDefined();
      expect(DEFAULT_BACKGROUNDS.black).toBeDefined();
      expect(DEFAULT_BACKGROUNDS.ocean).toBeDefined();
    });

    it('should have valid background structure', () => {
      Object.values(DEFAULT_BACKGROUNDS).forEach(background => {
        expect(background.type).toBeDefined();
        expect(background.colors).toBeDefined();
        expect(background.opacity).toBeDefined();
      });
    });
  });

  // ===== INTEGRATION TESTS =====
  
  describe('Integration Tests', () => {
    it('should maintain consistent timestamp handling across all converters', () => {
      const verse = convertVerseToSlide(mockVerse);
      const song = convertSongSlideToSlide(mockSong, mockSongSlide);
      const note = convertNoteToSlide('Test', 'Test');
      const announcement = convertAnnouncementToSlide('Test', 'Test');
      const blank = createBlankSlide();

      const slides = [verse, song, note, announcement, blank];
      slides.forEach(slide => {
        // All slides should have the same ISO date string for createdAt and updatedAt
        expect(slide.createdAt).toBe(MOCK_ISO_DATE);
        expect(slide.updatedAt).toBe(MOCK_ISO_DATE);
      });
      
      // IDs may have different timestamps due to counter, but that's expected
      expect(verse.id).toMatch(/^scripture-/);
      expect(song.id).toMatch(/^song-/);
      expect(note.id).toMatch(/^note-\d+$/);
      expect(announcement.id).toMatch(/^announcement-\d+$/);
      expect(blank.id).toMatch(/^custom-\d+$/);
    });

    it('should create slides that work together in collections', () => {
      const slides = [
        convertVerseToSlide(mockVerse),
        convertSongSlideToSlide(mockSong, mockSongSlide),
        convertNoteToSlide('Sermon Point', 'Main teaching point'),
        convertAnnouncementToSlide('Upcoming Event', 'Details about event')
      ];

      slides.forEach(slide => {
        expect(slide).toBeValidUniversalSlide();
        expect(slide.id).toBeDefined();
        expect(slide.type).toBeDefined();
        expect(slide.title).toBeDefined();
      });

      // Ensure all IDs are unique
      const ids = slides.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should handle edge cases gracefully across all converters', () => {
      // Test with various edge cases
      const edgeCases = [
        () => convertVerseToSlide({ ...mockVerse, text: '' }),
        () => convertNoteToSlide('', ''),
        () => convertAnnouncementToSlide('', ''),
        () => createBlankSlide('custom')
      ];

      edgeCases.forEach(testCase => {
        expect(() => testCase()).not.toThrow();
        const slide = testCase();
        expect(slide).toBeValidUniversalSlide();
      });
    });
  });
}); 