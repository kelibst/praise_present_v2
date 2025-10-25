import { useState, useCallback } from 'react';

/**
 * Bible book names mapping
 */
export const BIBLE_BOOKS = [
  // Old Testament
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  // New Testament
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

/**
 * Available Bible translations
 */
export const BIBLE_TRANSLATIONS = [
  { value: 'kjv', label: 'King James Version (KJV)' },
  { value: 'asv', label: 'American Standard Version (ASV)' },
  { value: 'web', label: 'World English Bible (WEB)' },
  { value: 'net', label: 'New English Translation (NET)' }
];

/**
 * Bible verse data structure
 */
interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

/**
 * Bible data structure (loaded from JSON files)
 */
interface BibleData {
  resultset: {
    row: Array<{
      field: Array<{
        $: string;
      }>;
    }>;
  };
}

/**
 * Hook for Bible verse lookup
 */
export const useBibleLookup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load Bible data from JSON file
   */
  const loadBibleData = async (translation: string): Promise<BibleData | null> => {
    try {
      // Map translation codes to file names
      const fileMap: Record<string, string> = {
        'kjv': 'kjv.json',
        'asv': 'asv.json',
        'web': 'web.json',
        'net': 'net.json'
      };

      const fileName = fileMap[translation.toLowerCase()] || 'kjv.json';
      const filePath = `/src/database/json/${fileName}`;

      // Use window.electronAPI to read the file
      const data = await window.electronAPI?.invoke('read-bible-data', fileName);

      if (!data) {
        throw new Error(`Failed to load Bible data for ${translation}`);
      }

      return data as BibleData;
    } catch (err) {
      console.error('Error loading Bible data:', err);
      return null;
    }
  };

  /**
   * Parse Bible data and extract verses
   */
  const parseVerses = (
    data: BibleData,
    book: string,
    chapter: number,
    verseStart: number,
    verseEnd?: number
  ): string[] => {
    const verses: string[] = [];

    try {
      const rows = data.resultset.row;

      for (const row of rows) {
        const fields = row.field;
        if (fields.length >= 4) {
          const bookName = fields[1].$.trim();
          const chapterNum = parseInt(fields[2].$);
          const verseNum = parseInt(fields[3].$);
          const verseText = fields[4]?.$?.trim() || '';

          // Check if this verse matches our criteria
          if (
            bookName.toLowerCase() === book.toLowerCase() &&
            chapterNum === chapter &&
            verseNum >= verseStart &&
            (!verseEnd || verseNum <= verseEnd)
          ) {
            verses.push(verseText);
          }
        }
      }
    } catch (err) {
      console.error('Error parsing Bible verses:', err);
    }

    return verses;
  };

  /**
   * Fetch verses from the Bible
   */
  const fetchVerses = useCallback(async (
    book: string,
    chapter: number,
    verseStart: number,
    verseEnd: number | undefined,
    translation: string
  ): Promise<string[]> => {
    setLoading(true);
    setError(null);

    try {
      // Load Bible data
      const data = await loadBibleData(translation);

      if (!data) {
        throw new Error('Failed to load Bible data');
      }

      // Parse and extract verses
      const verses = parseVerses(data, book, chapter, verseStart, verseEnd);

      if (verses.length === 0) {
        throw new Error(`No verses found for ${book} ${chapter}:${verseStart}${verseEnd ? `-${verseEnd}` : ''}`);
      }

      setLoading(false);
      return verses;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return [];
    }
  }, []);

  /**
   * Get verse count for a chapter (useful for validation)
   */
  const getChapterVerseCount = useCallback(async (
    book: string,
    chapter: number,
    translation: string
  ): Promise<number> => {
    try {
      const data = await loadBibleData(translation);
      if (!data) return 0;

      const rows = data.resultset.row;
      let maxVerse = 0;

      for (const row of rows) {
        const fields = row.field;
        if (fields.length >= 4) {
          const bookName = fields[1].$.trim();
          const chapterNum = parseInt(fields[2].$);
          const verseNum = parseInt(fields[3].$);

          if (
            bookName.toLowerCase() === book.toLowerCase() &&
            chapterNum === chapter
          ) {
            maxVerse = Math.max(maxVerse, verseNum);
          }
        }
      }

      return maxVerse;
    } catch (err) {
      console.error('Error getting chapter verse count:', err);
      return 0;
    }
  }, []);

  /**
   * Search for verses containing specific text
   */
  const searchVerses = useCallback(async (
    searchText: string,
    translation: string,
    bookFilter?: string
  ): Promise<BibleVerse[]> => {
    setLoading(true);
    setError(null);

    try {
      const data = await loadBibleData(translation);
      if (!data) {
        throw new Error('Failed to load Bible data');
      }

      const results: BibleVerse[] = [];
      const rows = data.resultset.row;
      const searchLower = searchText.toLowerCase();

      for (const row of rows) {
        const fields = row.field;
        if (fields.length >= 4) {
          const bookName = fields[1].$.trim();
          const chapter = parseInt(fields[2].$);
          const verse = parseInt(fields[3].$);
          const text = fields[4]?.$?.trim() || '';

          // Apply book filter if specified
          if (bookFilter && bookName.toLowerCase() !== bookFilter.toLowerCase()) {
            continue;
          }

          // Check if verse contains search text
          if (text.toLowerCase().includes(searchLower)) {
            results.push({
              book: bookName,
              chapter,
              verse,
              text
            });
          }
        }

        // Limit results to prevent performance issues
        if (results.length >= 100) break;
      }

      setLoading(false);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return [];
    }
  }, []);

  return {
    fetchVerses,
    getChapterVerseCount,
    searchVerses,
    loading,
    error,
    BIBLE_BOOKS,
    BIBLE_TRANSLATIONS
  };
};
