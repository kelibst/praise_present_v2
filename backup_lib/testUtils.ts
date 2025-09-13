import { Verse, Book, Version } from './bibleSlice';
import { Song, SongSlide } from './songSlice';
import { UniversalSlide } from './universalSlideSlice';

// ===== MOCK DATA FACTORY FUNCTIONS =====

export const createMockBook = (overrides: Partial<Book> = {}): Book => ({
  id: 1,
  name: 'John',
  shortName: 'Jn',
  testament: 'NT',
  category: 'Gospel',
  chapters: 21,
  order: 43,
  ...overrides
});

export const createMockVersion = (overrides: Partial<Version> = {}): Version => ({
  id: 'kjv',
  name: 'King James Version',
  fullName: 'King James Version (KJV)',
  translationId: 'kjv',
  isDefault: true,
  year: 1611,
  publisher: 'Cambridge University Press',
  ...overrides
});

export const createMockVerse = (overrides: Partial<Verse> = {}): Verse => ({
  id: 'verse-john-3-16',
  bookId: 1,
  chapter: 3,
  verse: 16,
  text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  versionId: 'kjv',
  book: createMockBook(),
  version: createMockVersion(),
  ...overrides
});

export const createMockSongSlide = (overrides: Partial<SongSlide> = {}): SongSlide => ({
  id: 'slide-verse-1',
  type: 'verse',
  number: 1,
  title: 'Verse 1',
  content: 'Amazing grace how sweet the sound\nThat saved a wretch like me\nI once was lost but now am found\nWas blind but now I see',
  chords: 'G C G D Em C G D G',
  ...overrides
});

export const createMockSong = (overrides: Partial<Song> = {}): Song => ({
  id: 'song-amazing-grace',
  title: 'Amazing Grace',
  artist: 'John Newton',
  author: 'John Newton',
  lyrics: 'Amazing grace how sweet the sound...',
  structure: {
    slides: [createMockSongSlide()],
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
  createdAt: '2022-01-01T00:00:00.000Z',
  updatedAt: '2022-01-01T00:00:00.000Z',
  usageCount: 15,
  ...overrides
});

// ===== TEST ASSERTION HELPERS =====

export const assertValidUniversalSlide = (slide: any): asserts slide is UniversalSlide => {
  const requiredFields = [
    'id', 'type', 'title', 'content', 'template', 'background', 
    'textFormatting', 'metadata', 'transitions', 'createdAt', 'updatedAt'
  ];
  
  requiredFields.forEach(field => {
    expect(slide).toHaveProperty(field);
    expect(slide[field]).toBeDefined();
  });

  // Validate slide type
  const validTypes = ['scripture', 'song', 'media', 'note', 'announcement', 'custom'];
  expect(validTypes).toContain(slide.type);

  // Validate ID format
  expect(slide.id).toMatch(/^[a-z]+-/);

  // Validate dates
  expect(slide.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  expect(slide.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);

  // Validate metadata structure
  expect(slide.metadata).toHaveProperty('usageCount');
  expect(slide.metadata).toHaveProperty('tags');
  expect(Array.isArray(slide.metadata.tags)).toBe(true);

  // Validate transitions
  expect(slide.transitions).toHaveProperty('enter');
  expect(slide.transitions).toHaveProperty('exit');
  expect(slide.transitions).toHaveProperty('duration');
  expect(typeof slide.transitions.duration).toBe('number');
};

// ===== MOCK IMPLEMENTATIONS =====

export const createMockElectronAPI = () => ({
  invoke: jest.fn(),
  send: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
});

export const mockDateConsistently = (timestamp: number = 1640995200000) => {
  const mockDate = new Date(timestamp);
  const isoString = mockDate.toISOString();
  
  jest.spyOn(Date, 'now').mockReturnValue(timestamp);
  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(isoString);
  
  return { timestamp, isoString };
};

// ===== TEST DATA COLLECTIONS =====

export const sampleVerses: Verse[] = [
  createMockVerse({
    id: 'john-3-16',
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
  }),
  createMockVerse({
    id: 'psalm-23-1',
    bookId: 19,
    chapter: 23,
    verse: 1,
    text: 'The Lord is my shepherd; I shall not want.',
    book: createMockBook({ id: 19, name: 'Psalms', shortName: 'Ps', testament: 'OT' })
  }),
  createMockVerse({
    id: 'romans-8-28',
    bookId: 45,
    chapter: 8,
    verse: 28,
    text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
    book: createMockBook({ id: 45, name: 'Romans', shortName: 'Rom', testament: 'NT' })
  })
];

export const sampleSongs: Song[] = [
  createMockSong({
    id: 'amazing-grace',
    title: 'Amazing Grace'
  }),
  createMockSong({
    id: 'how-great-thou-art',
    title: 'How Great Thou Art',
    artist: 'Stuart K. Hine',
    key: 'A',
    tempo: '85',
    tags: ['hymn', 'praise', 'classic']
  }),
  createMockSong({
    id: 'cornerstone',
    title: 'Cornerstone',
    artist: 'Hillsong',
    key: 'C',
    tempo: '120',
    tags: ['contemporary', 'worship', 'christ']
  })
];

// ===== PERFORMANCE TEST HELPERS =====

export const measurePerformance = async (fn: () => void | Promise<void>, iterations: number = 1000) => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  return { average, min, max, times };
};

// ===== VALIDATION HELPERS =====

export const validateSlideContent = (slide: UniversalSlide, expectedType: UniversalSlide['type']) => {
  expect(slide.type).toBe(expectedType);
  
  switch (expectedType) {
    case 'scripture':
      expect(slide.content).toHaveProperty('verses');
      expect(slide.content).toHaveProperty('reference');
      expect(Array.isArray(slide.content.verses)).toBe(true);
      break;
      
    case 'song':
      expect(slide.content).toHaveProperty('songId');
      expect(slide.content).toHaveProperty('lyrics');
      expect(slide.content).toHaveProperty('slideType');
      break;
      
    case 'note':
      expect(slide.content).toHaveProperty('text');
      expect(typeof slide.content.text).toBe('string');
      break;
      
    case 'announcement':
      expect(slide.content).toHaveProperty('title');
      expect(slide.content).toHaveProperty('message');
      expect(slide.content).toHaveProperty('priority');
      break;
  }
}; 