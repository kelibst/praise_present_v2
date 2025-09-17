/**
 * Hook for validating scripture references against actual Bible data
 */

import { useCallback, useEffect, useState } from 'react';
import { Book } from '../../../../lib/bibleSlice';
import { ParsedReference, ValidationResult, ChapterVerseInfo } from '../types';
import { bibleService } from '../../../../lib/services/bibleService';

export const useValidation = (selectedVersionId: string | null) => {
  const [chapterVerseData, setChapterVerseData] = useState<Map<number, ChapterVerseInfo>>(new Map());
  const [loadingBooks, setLoadingBooks] = useState<Set<number>>(new Set());

  // Load chapter and verse count data for a book
  const loadBookData = useCallback(async (book: Book, versionId: string): Promise<ChapterVerseInfo> => {
    try {
      const bookData: ChapterVerseInfo = {
        maxChapter: book.chapters,
        maxVerse: 0,
        chapterVerseCounts: {}
      };

      // Load verse counts for each chapter
      for (let chapter = 1; chapter <= book.chapters; chapter++) {
        try {
          const verses = await bibleService.getVerses(versionId, book.id, chapter);
          const maxVerse = Math.max(...verses.map(v => v.verse), 0);
          bookData.chapterVerseCounts[chapter] = maxVerse;
          bookData.maxVerse = Math.max(bookData.maxVerse, maxVerse);
        } catch (error) {
          console.warn(`Failed to load verses for ${book.name} ${chapter}:`, error);
          // Use a reasonable default
          bookData.chapterVerseCounts[chapter] = 31; // Most chapters have fewer than 31 verses
        }
      }

      return bookData;
    } catch (error) {
      console.error(`Failed to load book data for ${book.name}:`, error);
      // Return reasonable defaults
      return {
        maxChapter: book.chapters,
        maxVerse: 31,
        chapterVerseCounts: {}
      };
    }
  }, []);

  // Get or load chapter/verse info for a book
  const getBookInfo = useCallback(async (book: Book, versionId: string): Promise<ChapterVerseInfo> => {
    // Check if we already have the data
    const existing = chapterVerseData.get(book.id);
    if (existing) {
      return existing;
    }

    // Check if we're already loading this book
    if (loadingBooks.has(book.id)) {
      // Wait for the loading to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const data = chapterVerseData.get(book.id);
          if (data) {
            clearInterval(checkInterval);
            resolve(data);
          }
        }, 100);
      });
    }

    // Load the data
    setLoadingBooks(prev => new Set(prev).add(book.id));

    try {
      const bookInfo = await loadBookData(book, versionId);
      setChapterVerseData(prev => new Map(prev).set(book.id, bookInfo));
      return bookInfo;
    } finally {
      setLoadingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(book.id);
        return newSet;
      });
    }
  }, [chapterVerseData, loadingBooks, loadBookData]);

  // Validate a parsed reference
  const validateReference = useCallback(async (
    reference: ParsedReference,
    versionId: string
  ): Promise<ValidationResult> => {
    // If the reference is not basically valid, return early
    if (!reference.isValid || !reference.book) {
      return {
        isValid: false,
        error: reference.error || 'Invalid reference'
      };
    }

    try {
      const bookInfo = await getBookInfo(reference.book, versionId);

      // Validate chapter
      if (reference.chapter !== null) {
        if (reference.chapter < 1 || reference.chapter > bookInfo.maxChapter) {
          return {
            isValid: false,
            error: `${reference.book.name} has only ${bookInfo.maxChapter} chapters`,
            autoCorrection: {
              ...reference,
              chapter: Math.min(Math.max(1, reference.chapter), bookInfo.maxChapter)
            }
          };
        }

        // Validate verse
        if (reference.verseStart !== null) {
          const maxVerseForChapter = bookInfo.chapterVerseCounts[reference.chapter] || bookInfo.maxVerse;

          if (reference.verseStart < 1 || reference.verseStart > maxVerseForChapter) {
            return {
              isValid: false,
              error: `${reference.book.name} ${reference.chapter} has only ${maxVerseForChapter} verses`,
              autoCorrection: {
                ...reference,
                verseStart: Math.min(Math.max(1, reference.verseStart), maxVerseForChapter)
              }
            };
          }

          // Validate verse end (for ranges)
          if (reference.verseEnd !== null) {
            if (reference.verseEnd < reference.verseStart || reference.verseEnd > maxVerseForChapter) {
              return {
                isValid: false,
                error: `Invalid verse range. ${reference.book.name} ${reference.chapter} has ${maxVerseForChapter} verses`,
                autoCorrection: {
                  ...reference,
                  verseEnd: Math.min(Math.max(reference.verseStart, reference.verseEnd), maxVerseForChapter)
                }
              };
            }
          }
        }
      }

      return { isValid: true };
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        error: 'Unable to validate reference'
      };
    }
  }, [getBookInfo]);

  // Get max chapter count for a book
  const getMaxChapter = useCallback((book: Book): number => {
    const info = chapterVerseData.get(book.id);
    return info?.maxChapter || book.chapters;
  }, [chapterVerseData]);

  // Get max verse count for a specific chapter
  const getMaxVerse = useCallback(async (
    book: Book,
    chapter: number,
    versionId: string
  ): Promise<number> => {
    if (!selectedVersionId) return 31; // Default fallback

    const bookInfo = await getBookInfo(book, versionId);
    return bookInfo.chapterVerseCounts[chapter] || bookInfo.maxVerse || 31;
  }, [getBookInfo, selectedVersionId]);

  // Clear cached data when version changes
  useEffect(() => {
    setChapterVerseData(new Map());
    setLoadingBooks(new Set());
  }, [selectedVersionId]);

  return {
    validateReference,
    getMaxChapter,
    getMaxVerse,
    isLoadingBook: (bookId: number) => loadingBooks.has(bookId)
  };
};