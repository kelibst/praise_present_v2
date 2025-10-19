/**
 * Scripture Reference Formatter
 *
 * Utility functions for formatting scripture references.
 * This replaces the duplicate logic scattered across components.
 */

import { ScriptureVerse } from './bibleService';

/**
 * Format scripture verses into a display-friendly reference string
 * Examples:
 *  - Single verse: "John 3:16"
 *  - Consecutive verses: "John 3:16-18"
 *  - Non-consecutive verses: "John 3:16,18,20"
 */
export function formatScriptureReference(verses: ScriptureVerse[]): string {
  if (verses.length === 0) return '';

  const firstVerse = verses[0];

  if (verses.length === 1) {
    return `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}`;
  }

  // Check if all verses are from the same book and chapter
  const sameBookChapter = verses.every(v =>
    v.book === firstVerse.book && v.chapter === firstVerse.chapter
  );

  if (!sameBookChapter) {
    // Different chapters/books - just list them all
    return verses.map(v => `${v.book} ${v.chapter}:${v.verse}`).join('; ');
  }

  // Same chapter - check if consecutive
  const verseNumbers = verses.map(v => v.verse).sort((a, b) => a - b);
  const isConsecutive = verseNumbers.every((v, i) =>
    i === 0 || v === verseNumbers[i - 1] + 1
  );

  if (isConsecutive && verseNumbers.length > 1) {
    // Consecutive: "John 3:16-18"
    return `${firstVerse.book} ${firstVerse.chapter}:${verseNumbers[0]}-${verseNumbers[verseNumbers.length - 1]}`;
  } else {
    // Non-consecutive: "John 3:16,18,20"
    return `${firstVerse.book} ${firstVerse.chapter}:${verseNumbers.join(',')}`;
  }
}

/**
 * Get a short reference for display (just the book and verses)
 * Example: "John 3:16-18"
 */
export function formatShortReference(verses: ScriptureVerse[]): string {
  return formatScriptureReference(verses);
}

/**
 * Get a detailed reference with translation
 * Example: "John 3:16-18 (KJV)"
 */
export function formatReferenceWithTranslation(verses: ScriptureVerse[]): string {
  if (verses.length === 0) return '';
  const reference = formatScriptureReference(verses);
  const translation = verses[0].translation;
  return `${reference} (${translation})`;
}
