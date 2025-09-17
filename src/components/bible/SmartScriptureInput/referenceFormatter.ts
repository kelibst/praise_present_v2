/**
 * Reference formatting utilities for smart scripture input
 */

import { Book } from '../../../lib/bibleSlice';
import { ParsedReference } from './types';

/**
 * Format a reference object into a readable string
 */
export const formatReference = (reference: ParsedReference): string => {
  if (!reference.book) {
    return reference.rawInput;
  }

  let formatted = reference.book.name;

  if (reference.chapter !== null) {
    formatted += ` ${reference.chapter}`;

    if (reference.verseStart !== null) {
      formatted += `:${reference.verseStart}`;

      if (reference.verseEnd !== null && reference.verseEnd !== reference.verseStart) {
        formatted += `-${reference.verseEnd}`;
      }
    }
  }

  return formatted;
};

/**
 * Format a short reference (book abbreviation + chapter:verse)
 */
export const formatShortReference = (reference: ParsedReference): string => {
  if (!reference.book) {
    return reference.rawInput;
  }

  let formatted = reference.book.shortName || reference.book.name;

  if (reference.chapter !== null) {
    formatted += ` ${reference.chapter}`;

    if (reference.verseStart !== null) {
      formatted += `:${reference.verseStart}`;

      if (reference.verseEnd !== null && reference.verseEnd !== reference.verseStart) {
        formatted += `-${reference.verseEnd}`;
      }
    }
  }

  return formatted;
};

/**
 * Format reference for display in suggestions
 */
export const formatSuggestionText = (
  book: Book,
  chapter?: number,
  verse?: number
): string => {
  let text = book.name;

  if (chapter !== undefined) {
    text += ` ${chapter}`;

    if (verse !== undefined) {
      text += `:${verse}`;
    }
  }

  return text;
};

/**
 * Get display text for current input state
 */
export const getDisplayText = (
  input: string,
  reference: ParsedReference,
  showFormattedVersion: boolean = false
): string => {
  if (!showFormattedVersion || !reference.isValid) {
    return input;
  }

  return formatReference(reference);
};

/**
 * Create a standardized reference key for comparison
 */
export const createReferenceKey = (reference: ParsedReference): string => {
  if (!reference.book) return '';

  const parts = [reference.book.id.toString()];

  if (reference.chapter !== null) {
    parts.push(reference.chapter.toString());

    if (reference.verseStart !== null) {
      parts.push(reference.verseStart.toString());

      if (reference.verseEnd !== null && reference.verseEnd !== reference.verseStart) {
        parts.push(reference.verseEnd.toString());
      }
    }
  }

  return parts.join(':');
};

/**
 * Check if two references are equal
 */
export const areReferencesEqual = (ref1: ParsedReference, ref2: ParsedReference): boolean => {
  return createReferenceKey(ref1) === createReferenceKey(ref2);
};

/**
 * Generate completion suggestions for partial input
 */
export const generateCompletionSuggestions = (
  reference: ParsedReference,
  maxSuggestions: number = 3
): string[] => {
  const suggestions: string[] = [];

  if (!reference.book) {
    return suggestions;
  }

  // If only book is specified, suggest chapter 1
  if (reference.chapter === null) {
    suggestions.push(`${reference.book.name} 1`);
    suggestions.push(`${reference.book.name} 1:1`);
    return suggestions.slice(0, maxSuggestions);
  }

  // If chapter is specified but no verse, suggest verse 1
  if (reference.verseStart === null) {
    suggestions.push(`${reference.book.name} ${reference.chapter}:1`);
    return suggestions.slice(0, maxSuggestions);
  }

  // If complete reference, suggest next verse or chapter
  if (reference.verseStart !== null) {
    // Suggest next verse
    suggestions.push(`${reference.book.name} ${reference.chapter}:${reference.verseStart + 1}`);

    // Suggest verse range
    if (reference.verseEnd === null) {
      suggestions.push(`${reference.book.name} ${reference.chapter}:${reference.verseStart}-${reference.verseStart + 1}`);
    }

    // Suggest next chapter
    suggestions.push(`${reference.book.name} ${reference.chapter + 1}:1`);
  }

  return suggestions.slice(0, maxSuggestions);
};