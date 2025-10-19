/**
 * Scripture Navigation Service
 *
 * Provides instant O(1) navigation between Bible verses using prospective
 * database-level navigation metadata. No runtime computation required!
 *
 * This service replaces the old "stressful method" of manual verse grouping
 * and iteration with simple direct ID lookups.
 */

import { ScriptureVerse } from './bibleService';

export interface NavigatedVerse extends ScriptureVerse {
  // Navigation metadata from database
  globalIndex?: number | null;
  previousId?: string | null;
  nextId?: string | null;
  chapterFirstVerseId?: string | null;
  chapterLastVerseId?: string | null;
  bookFirstVerseId?: string | null;
  bookLastVerseId?: string | null;
}

export interface VerseGroup {
  verses: NavigatedVerse[];
  reference: string;
  isConsecutive: boolean;
}

export class ScriptureNavigationService {
  /**
   * Get the next verse using pre-computed navigation (O(1) lookup)
   */
  async getNextVerse(currentVerse: NavigatedVerse): Promise<NavigatedVerse | null> {
    if (!currentVerse.nextId) {
      return null;
    }

    try {
      const nextVerse = await window.electronAPI?.invoke('database:query', {
        model: 'verse',
        operation: 'findUnique',
        params: {
          where: { id: currentVerse.nextId }
        }
      });
      if (!nextVerse) return null;

      return this.convertToNavigatedVerse(nextVerse);
    } catch (error) {
      console.error('❌ Failed to get next verse:', error);
      return null;
    }
  }

  /**
   * Get the previous verse using pre-computed navigation (O(1) lookup)
   */
  async getPreviousVerse(currentVerse: NavigatedVerse): Promise<NavigatedVerse | null> {
    if (!currentVerse.previousId) {
      return null;
    }

    try {
      const prevVerse = await window.electronAPI?.invoke('database:query', {
        model: 'verse',
        operation: 'findUnique',
        params: {
          where: { id: currentVerse.previousId }
        }
      });
      if (!prevVerse) return null;

      return this.convertToNavigatedVerse(prevVerse);
    } catch (error) {
      console.error('❌ Failed to get previous verse:', error);
      return null;
    }
  }

  /**
   * Jump to the first verse of the current chapter (O(1) lookup)
   */
  async getFirstVerseOfChapter(currentVerse: NavigatedVerse): Promise<NavigatedVerse | null> {
    if (!currentVerse.chapterFirstVerseId) {
      return null;
    }

    try {
      const firstVerse = await window.electronAPI?.invoke('database:query', {
        model: 'verse',
        operation: 'findUnique',
        params: {
          where: { id: currentVerse.chapterFirstVerseId }
        }
      });
      if (!firstVerse) return null;

      return this.convertToNavigatedVerse(firstVerse);
    } catch (error) {
      console.error('❌ Failed to get first verse of chapter:', error);
      return null;
    }
  }

  /**
   * Jump to the last verse of the current chapter (O(1) lookup)
   */
  async getLastVerseOfChapter(currentVerse: NavigatedVerse): Promise<NavigatedVerse | null> {
    if (!currentVerse.chapterLastVerseId) {
      return null;
    }

    try {
      const lastVerse = await window.electronAPI?.invoke('database:query', {
        model: 'verse',
        operation: 'findUnique',
        params: {
          where: { id: currentVerse.chapterLastVerseId }
        }
      });
      if (!lastVerse) return null;

      return this.convertToNavigatedVerse(lastVerse);
    } catch (error) {
      console.error('❌ Failed to get last verse of chapter:', error);
      return null;
    }
  }

  /**
   * Jump to the next chapter's first verse (O(1) lookup)
   */
  async getFirstVerseOfNextChapter(currentVerse: NavigatedVerse): Promise<NavigatedVerse | null> {
    // First get the last verse of current chapter
    const lastVerseOfChapter = await this.getLastVerseOfChapter(currentVerse);
    if (!lastVerseOfChapter) return null;

    // Then get the next verse (which is the first verse of next chapter)
    return this.getNextVerse(lastVerseOfChapter);
  }

  /**
   * Jump to the previous chapter's first verse (O(1) lookup)
   */
  async getFirstVerseOfPreviousChapter(currentVerse: NavigatedVerse): Promise<NavigatedVerse | null> {
    // First get the first verse of current chapter
    const firstVerseOfChapter = await this.getFirstVerseOfChapter(currentVerse);
    if (!firstVerseOfChapter) return null;

    // Then get the previous verse (which is the last verse of previous chapter)
    const lastVerseOfPrevChapter = await this.getPreviousVerse(firstVerseOfChapter);
    if (!lastVerseOfPrevChapter) return null;

    // Finally get the first verse of that chapter
    return this.getFirstVerseOfChapter(lastVerseOfPrevChapter);
  }

  /**
   * Jump to the first verse of the book (O(1) lookup)
   */
  async getFirstVerseOfBook(currentVerse: NavigatedVerse): Promise<NavigatedVerse | null> {
    if (!currentVerse.bookFirstVerseId) {
      return null;
    }

    try {
      const firstVerse = await window.electronAPI?.invoke('database:query', {
        model: 'verse',
        operation: 'findUnique',
        params: {
          where: { id: currentVerse.bookFirstVerseId }
        }
      });
      if (!firstVerse) return null;

      return this.convertToNavigatedVerse(firstVerse);
    } catch (error) {
      console.error('❌ Failed to get first verse of book:', error);
      return null;
    }
  }

  /**
   * Jump to the last verse of the book (O(1) lookup)
   */
  async getLastVerseOfBook(currentVerse: NavigatedVerse): Promise<NavigatedVerse | null> {
    if (!currentVerse.bookLastVerseId) {
      return null;
    }

    try {
      const lastVerse = await window.electronAPI?.invoke('database:query', {
        model: 'verse',
        operation: 'findUnique',
        params: {
          where: { id: currentVerse.bookLastVerseId }
        }
      });
      if (!lastVerse) return null;

      return this.convertToNavigatedVerse(lastVerse);
    } catch (error) {
      console.error('❌ Failed to get last verse of book:', error);
      return null;
    }
  }

  /**
   * Group consecutive verses efficiently using globalIndex
   * This replaces the old "stressful method" with a simple O(n) operation
   */
  groupConsecutiveVerses(verses: NavigatedVerse[]): VerseGroup[] {
    if (verses.length === 0) return [];

    // Sort by globalIndex for guaranteed order
    const sorted = [...verses].sort((a, b) => {
      if (a.globalIndex && b.globalIndex) {
        return a.globalIndex - b.globalIndex;
      }
      // Fallback if globalIndex is missing
      if (a.book !== b.book) return a.book.localeCompare(b.book);
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verse - b.verse;
    });

    const groups: VerseGroup[] = [];
    let currentGroup: NavigatedVerse[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      // Check if consecutive using globalIndex (O(1) check!)
      const isConsecutive =
        prev.globalIndex !== null &&
        curr.globalIndex !== null &&
        prev.globalIndex !== undefined &&
        curr.globalIndex !== undefined &&
        curr.globalIndex === prev.globalIndex + 1;

      if (isConsecutive) {
        currentGroup.push(curr);
      } else {
        // Save current group and start new one
        groups.push(this.createVerseGroup(currentGroup));
        currentGroup = [curr];
      }
    }

    // Don't forget the last group
    if (currentGroup.length > 0) {
      groups.push(this.createVerseGroup(currentGroup));
    }

    return groups;
  }

  /**
   * Create a verse group with formatted reference
   */
  private createVerseGroup(verses: NavigatedVerse[]): VerseGroup {
    const first = verses[0];
    const last = verses[verses.length - 1];
    const isConsecutive = verses.length > 1;

    let reference: string;
    if (verses.length === 1) {
      reference = `${first.book} ${first.chapter}:${first.verse}`;
    } else if (first.chapter === last.chapter) {
      reference = `${first.book} ${first.chapter}:${first.verse}-${last.verse}`;
    } else {
      reference = `${first.book} ${first.chapter}:${first.verse} - ${last.chapter}:${last.verse}`;
    }

    return {
      verses,
      reference,
      isConsecutive
    };
  }

  /**
   * Get the verse position within its chapter
   * Example: "Verse 5 of 31" for Psalm 23:5
   */
  async getVersePosition(currentVerse: NavigatedVerse): Promise<{
    verseNumber: number;
    totalVerses: number;
    description: string;
  } | null> {
    if (!currentVerse.chapterFirstVerseId || !currentVerse.chapterLastVerseId) {
      return null;
    }

    try {
      const firstVerse = await window.electronAPI?.invoke('database:query', {
        model: 'verse',
        operation: 'findUnique',
        params: {
          where: { id: currentVerse.chapterFirstVerseId }
        }
      });
      const lastVerse = await window.electronAPI?.invoke('database:query', {
        model: 'verse',
        operation: 'findUnique',
        params: {
          where: { id: currentVerse.chapterLastVerseId }
        }
      });

      if (!firstVerse?.globalIndex || !lastVerse?.globalIndex || !currentVerse.globalIndex) {
        return null;
      }

      const totalVerses = lastVerse.globalIndex - firstVerse.globalIndex + 1;
      const verseNumber = currentVerse.globalIndex - firstVerse.globalIndex + 1;

      return {
        verseNumber,
        totalVerses,
        description: `Verse ${verseNumber} of ${totalVerses}`
      };
    } catch (error) {
      console.error('❌ Failed to get verse position:', error);
      return null;
    }
  }

  /**
   * Check if a verse is the first verse of its chapter
   */
  isFirstVerseOfChapter(verse: NavigatedVerse): boolean {
    return verse.id === verse.chapterFirstVerseId;
  }

  /**
   * Check if a verse is the last verse of its chapter
   */
  isLastVerseOfChapter(verse: NavigatedVerse): boolean {
    return verse.id === verse.chapterLastVerseId;
  }

  /**
   * Check if a verse is the first verse of its book
   */
  isFirstVerseOfBook(verse: NavigatedVerse): boolean {
    return verse.id === verse.bookFirstVerseId;
  }

  /**
   * Check if a verse is the last verse of its book
   */
  isLastVerseOfBook(verse: NavigatedVerse): boolean {
    return verse.id === verse.bookLastVerseId;
  }

  /**
   * Convert a raw Verse from database to NavigatedVerse with all metadata
   */
  private convertToNavigatedVerse(verse: any): NavigatedVerse {
    return {
      id: verse.id,
      book: verse.book?.name || 'Unknown',
      chapter: verse.chapter,
      verse: verse.verse,
      text: verse.text,
      translation: verse.version?.name || 'Unknown',
      bookId: verse.bookId,
      versionId: verse.versionId,
      globalIndex: verse.globalIndex,
      previousId: verse.previousId,
      nextId: verse.nextId,
      chapterFirstVerseId: verse.chapterFirstVerseId,
      chapterLastVerseId: verse.chapterLastVerseId,
      bookFirstVerseId: verse.bookFirstVerseId,
      bookLastVerseId: verse.bookLastVerseId
    };
  }

  /**
   * Format a reference string from verses
   */
  formatReference(verses: NavigatedVerse[]): string {
    if (verses.length === 0) return '';
    if (verses.length === 1) {
      const v = verses[0];
      return `${v.book} ${v.chapter}:${v.verse}`;
    }

    const groups = this.groupConsecutiveVerses(verses);
    return groups.map(g => g.reference).join('; ');
  }
}

// Export singleton instance
export const scriptureNavigationService = new ScriptureNavigationService();
