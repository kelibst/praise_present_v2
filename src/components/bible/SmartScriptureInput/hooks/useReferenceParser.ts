/**
 * Hook for parsing scripture references with intelligent matching
 */

import { useMemo, useCallback } from 'react';
import { Book } from '../../../../lib/bibleSlice';
import { ParsedReference } from '../types';
import { getBestBookMatch } from '../fuzzyMatch';

export const useReferenceParser = (books: Book[]) => {
  // Memoize book lookup for performance
  const bookLookup = useMemo(() => {
    const lookup = new Map<string, Book>();
    books.forEach(book => {
      lookup.set(book.name.toLowerCase(), book);
      lookup.set(book.shortName.toLowerCase(), book);
    });
    return lookup;
  }, [books]);

  const parseReference = useCallback((input: string): ParsedReference => {
    const trimmedInput = input.trim();

    // Initialize result with default values
    const result: ParsedReference = {
      book: null,
      chapter: null,
      verseStart: null,
      verseEnd: null,
      isValid: false,
      isComplete: false,
      rawInput: trimmedInput
    };

    // Handle empty input
    if (!trimmedInput) {
      return result;
    }

    // Regular expressions for different reference formats
    const patterns = [
      // "John 3:16-17" or "John 3:16" or "1 John 3:16"
      /^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+):(\d+)(?:-(\d+))?$/,
      // "John 3" (chapter only)
      /^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+)$/,
      // "John" (book only)
      /^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*)$/
    ];

    let matched = false;

    for (const pattern of patterns) {
      const match = trimmedInput.match(pattern);
      if (match) {
        matched = true;
        const bookText = match[1].trim();
        const chapterText = match[2];
        const verseStartText = match[3];
        const verseEndText = match[4];

        // Find the best matching book
        const book = getBestBookMatch(bookText, books);
        if (book) {
          result.book = book;
          result.isValid = true;

          // Parse chapter
          if (chapterText) {
            const chapter = parseInt(chapterText, 10);
            if (!isNaN(chapter) && chapter > 0) {
              result.chapter = chapter;

              // Parse verse start
              if (verseStartText) {
                const verseStart = parseInt(verseStartText, 10);
                if (!isNaN(verseStart) && verseStart > 0) {
                  result.verseStart = verseStart;

                  // Parse verse end (for ranges)
                  if (verseEndText) {
                    const verseEnd = parseInt(verseEndText, 10);
                    if (!isNaN(verseEnd) && verseEnd >= verseStart) {
                      result.verseEnd = verseEnd;
                      result.isComplete = true;
                    } else {
                      result.isValid = false;
                      result.error = 'Invalid verse range';
                    }
                  } else {
                    result.isComplete = true;
                  }
                }
              }
            } else {
              result.isValid = false;
              result.error = 'Invalid chapter number';
            }
          }
        } else {
          // Try partial matching for book names
          const possibleBook = findPartialBookMatch(bookText, books);
          if (possibleBook) {
            result.book = possibleBook;
            result.isValid = false; // Mark as invalid but with suggestion
            result.error = `Did you mean "${possibleBook.name}"?`;
          } else {
            result.isValid = false;
            result.error = `Book "${bookText}" not found`;
          }
        }
        break;
      }
    }

    // If no pattern matched, try to find a book match anyway
    if (!matched) {
      const book = getBestBookMatch(trimmedInput, books);
      if (book) {
        result.book = book;
        result.isValid = true;
      } else {
        result.isValid = false;
        result.error = 'Invalid reference format';
      }
    }

    return result;
  }, [books, bookLookup]);

  return { parseReference };
};

// Helper function to find partial book matches
function findPartialBookMatch(input: string, books: Book[]): Book | null {
  const normalized = input.toLowerCase();

  // Look for books that start with the input
  const startsWith = books.find(book =>
    book.name.toLowerCase().startsWith(normalized) ||
    book.shortName.toLowerCase().startsWith(normalized)
  );

  if (startsWith) return startsWith;

  // Look for books that contain the input
  const contains = books.find(book =>
    book.name.toLowerCase().includes(normalized) ||
    book.shortName.toLowerCase().includes(normalized)
  );

  return contains || null;
}