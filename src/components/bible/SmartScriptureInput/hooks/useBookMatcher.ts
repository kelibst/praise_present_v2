/**
 * Hook for intelligent book matching with suggestions
 */

import { useMemo, useCallback, useState } from 'react';
import { Book } from '../../../../lib/bibleSlice';
import { FuzzyBookMatcher, BookMatch } from '../fuzzyMatch';
import { ReferenceSuggestion } from '../types';

export const useBookMatcher = (books: Book[]) => {
  const [suggestions, setSuggestions] = useState<ReferenceSuggestion[]>([]);

  // Create memoized matcher instance
  const matcher = useMemo(() => {
    const m = new FuzzyBookMatcher();
    m.setBooks(books);
    return m;
  }, [books]);

  // Get book matches for input
  const getBookMatches = useCallback((input: string, limit: number = 5): BookMatch[] => {
    return matcher.findMatches(input, limit);
  }, [matcher]);

  // Get the best single match
  const getBestMatch = useCallback((input: string): BookMatch | null => {
    return matcher.getBestMatch(input);
  }, [matcher]);

  // Generate suggestions for autocomplete
  const generateSuggestions = useCallback((
    input: string,
    currentReference?: any
  ): ReferenceSuggestion[] => {
    const trimmedInput = input.trim().toLowerCase();

    if (!trimmedInput) {
      return [];
    }

    const suggestions: ReferenceSuggestion[] = [];
    const bookMatches = getBookMatches(trimmedInput, 3);

    // Add book suggestions
    bookMatches.forEach(match => {
      suggestions.push({
        text: match.book.name,
        reference: {
          book: match.book,
          chapter: null,
          verseStart: null,
          verseEnd: null,
          isValid: true,
          isComplete: false,
          rawInput: match.book.name
        },
        score: match.score,
        type: 'book'
      });

      // Add common chapter suggestions for matched books
      if (match.score > 800) { // High-confidence matches
        suggestions.push({
          text: `${match.book.name} 1`,
          reference: {
            book: match.book,
            chapter: 1,
            verseStart: null,
            verseEnd: null,
            isValid: true,
            isComplete: false,
            rawInput: `${match.book.name} 1`
          },
          score: match.score - 100,
          type: 'chapter'
        });

        suggestions.push({
          text: `${match.book.name} 1:1`,
          reference: {
            book: match.book,
            chapter: 1,
            verseStart: 1,
            verseEnd: null,
            isValid: true,
            isComplete: true,
            rawInput: `${match.book.name} 1:1`
          },
          score: match.score - 200,
          type: 'complete'
        });
      }
    });

    // Sort by score and limit
    const sortedSuggestions = suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setSuggestions(sortedSuggestions);
    return sortedSuggestions;
  }, [getBookMatches]);

  // Get suggestions for completion (when user types chapter/verse after book)
  const getCompletionSuggestions = useCallback((
    book: Book,
    currentInput: string
  ): ReferenceSuggestion[] => {
    const suggestions: ReferenceSuggestion[] = [];

    // Parse the current input to see what's been typed
    const chapterMatch = currentInput.match(/(\d+)$/);
    const verseMatch = currentInput.match(/(\d+):(\d+)$/);

    if (verseMatch) {
      // User has typed book + chapter + verse, suggest ranges
      const chapter = parseInt(verseMatch[1], 10);
      const verse = parseInt(verseMatch[2], 10);

      suggestions.push({
        text: `${book.name} ${chapter}:${verse}-${verse + 1}`,
        reference: {
          book,
          chapter,
          verseStart: verse,
          verseEnd: verse + 1,
          isValid: true,
          isComplete: true,
          rawInput: `${book.name} ${chapter}:${verse}-${verse + 1}`
        },
        score: 800,
        type: 'complete'
      });
    } else if (chapterMatch) {
      // User has typed book + chapter, suggest verse 1
      const chapter = parseInt(chapterMatch[1], 10);

      suggestions.push({
        text: `${book.name} ${chapter}:1`,
        reference: {
          book,
          chapter,
          verseStart: 1,
          verseEnd: null,
          isValid: true,
          isComplete: true,
          rawInput: `${book.name} ${chapter}:1`
        },
        score: 900,
        type: 'complete'
      });
    } else {
      // User has typed just book name, suggest chapter 1
      suggestions.push({
        text: `${book.name} 1`,
        reference: {
          book,
          chapter: 1,
          verseStart: null,
          verseEnd: null,
          isValid: true,
          isComplete: false,
          rawInput: `${book.name} 1`
        },
        score: 900,
        type: 'chapter'
      });

      suggestions.push({
        text: `${book.name} 1:1`,
        reference: {
          book,
          chapter: 1,
          verseStart: 1,
          verseEnd: null,
          isValid: true,
          isComplete: true,
          rawInput: `${book.name} 1:1`
        },
        score: 850,
        type: 'complete'
      });
    }

    return suggestions;
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    getBookMatches,
    getBestMatch,
    generateSuggestions,
    getCompletionSuggestions,
    clearSuggestions,
    suggestions
  };
};