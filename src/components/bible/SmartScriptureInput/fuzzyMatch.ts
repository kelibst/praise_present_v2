/**
 * Fuzzy matching utilities for smart scripture reference input
 * Provides intelligent book name matching with scoring
 */

import { Book } from '../../../lib/bibleSlice';
import { BOOK_ABBREVIATIONS, createAbbreviationMap, getBookOrder } from './bookAbbreviations';

export interface BookMatch {
  book: Book;
  score: number;
  matchType: 'exact' | 'abbreviation' | 'startsWith' | 'contains' | 'fuzzy';
  matchedText: string;
}

export class FuzzyBookMatcher {
  private abbreviationMap: Map<string, string>;
  private books: Book[] = [];

  constructor() {
    this.abbreviationMap = createAbbreviationMap();
  }

  setBooks(books: Book[]): void {
    this.books = books;
  }

  /**
   * Find the best matching books for a given input
   */
  findMatches(input: string, limit: number = 5): BookMatch[] {
    if (!input.trim()) {
      return [];
    }

    const normalizedInput = input.toLowerCase().trim();
    const matches: BookMatch[] = [];

    // Score each book
    this.books.forEach(book => {
      const score = this.calculateBookScore(book, normalizedInput);
      if (score.score > 0) {
        matches.push({
          book,
          score: score.score,
          matchType: score.matchType,
          matchedText: score.matchedText
        });
      }
    });

    // Sort by score (higher is better) and then by book order
    matches.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return getBookOrder(a.book.name) - getBookOrder(b.book.name);
    });

    return matches.slice(0, limit);
  }

  /**
   * Get the best single match for auto-completion
   */
  getBestMatch(input: string): BookMatch | null {
    const matches = this.findMatches(input, 1);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Calculate match score for a book against input
   */
  private calculateBookScore(book: Book, normalizedInput: string): {
    score: number;
    matchType: BookMatch['matchType'];
    matchedText: string;
  } {
    const bookName = book.name.toLowerCase();
    const shortName = book.shortName.toLowerCase();

    // 1. Exact match (highest priority)
    if (bookName === normalizedInput || shortName === normalizedInput) {
      return { score: 1000, matchType: 'exact', matchedText: book.name };
    }

    // 2. Abbreviation match (very high priority)
    const abbreviationMatch = this.abbreviationMap.get(normalizedInput);
    if (abbreviationMatch && abbreviationMatch.toLowerCase() === bookName) {
      return { score: 900, matchType: 'abbreviation', matchedText: book.name };
    }

    // 3. Starts with match (high priority)
    if (bookName.startsWith(normalizedInput) || shortName.startsWith(normalizedInput)) {
      const matchLength = normalizedInput.length;
      const totalLength = Math.min(bookName.length, shortName.length);
      const score = 800 + (matchLength / totalLength) * 100;
      return { score, matchType: 'startsWith', matchedText: book.name };
    }

    // 4. Contains match (medium priority)
    if (bookName.includes(normalizedInput) || shortName.includes(normalizedInput)) {
      const score = 600 + this.calculateContainsScore(bookName, normalizedInput);
      return { score, matchType: 'contains', matchedText: book.name };
    }

    // 5. Fuzzy match (lower priority)
    const fuzzyScore = this.calculateFuzzyScore(bookName, normalizedInput);
    if (fuzzyScore > 0.3) { // Threshold for fuzzy matching
      return { score: fuzzyScore * 400, matchType: 'fuzzy', matchedText: book.name };
    }

    return { score: 0, matchType: 'fuzzy', matchedText: '' };
  }

  /**
   * Calculate score for contains matches based on position and length
   */
  private calculateContainsScore(text: string, input: string): number {
    const index = text.indexOf(input);
    if (index === -1) return 0;

    // Earlier position = higher score
    const positionScore = (text.length - index) / text.length;
    // Longer match relative to text = higher score
    const lengthScore = input.length / text.length;

    return (positionScore + lengthScore) * 50;
  }

  /**
   * Calculate fuzzy match score using Levenshtein distance
   */
  private calculateFuzzyScore(text: string, input: string): number {
    const distance = this.levenshteinDistance(text, input);
    const maxLength = Math.max(text.length, input.length);

    if (maxLength === 0) return 1;

    const similarity = 1 - (distance / maxLength);
    return Math.max(0, similarity);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}

/**
 * Utility function to get book suggestions for auto-complete
 */
export const getBookSuggestions = (
  input: string,
  books: Book[],
  limit: number = 5
): BookMatch[] => {
  const matcher = new FuzzyBookMatcher();
  matcher.setBooks(books);
  return matcher.findMatches(input, limit);
};

/**
 * Get the best book match for a given input
 */
export const getBestBookMatch = (input: string, books: Book[]): Book | null => {
  const matcher = new FuzzyBookMatcher();
  matcher.setBooks(books);
  const match = matcher.getBestMatch(input);
  return match ? match.book : null;
};