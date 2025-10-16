/**
 * Scripture Context Service
 *
 * Manages context memory for smart scripture input (EasyWorship-style)
 * - Remembers last selected book
 * - Auto-fills book when only chapter:verse is entered
 * - Clears context after inactivity
 */

import { Book } from '../bibleSlice';

const CONTEXT_STORAGE_KEY = 'scripture-context';
const CONTEXT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface ScriptureContext {
  lastBook: Book | null;
  lastReference: string | null;
  timestamp: number;
}

class ScriptureContextService {
  private context: ScriptureContext = {
    lastBook: null,
    lastReference: null,
    timestamp: Date.now()
  };
  private timeoutId: NodeJS.Timeout | null = null;

  constructor() {
    this.loadContext();
    this.startInactivityTimer();
  }

  /**
   * Load context from localStorage
   */
  private loadContext(): void {
    try {
      const stored = localStorage.getItem(CONTEXT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const age = Date.now() - parsed.timestamp;

        // Only load if less than timeout duration
        if (age < CONTEXT_TIMEOUT_MS) {
          this.context = parsed;
        } else {
          this.clearContext();
        }
      }
    } catch (error) {
      console.warn('Failed to load scripture context:', error);
      this.clearContext();
    }
  }

  /**
   * Save context to localStorage
   */
  private saveContext(): void {
    try {
      localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(this.context));
    } catch (error) {
      console.warn('Failed to save scripture context:', error);
    }
  }

  /**
   * Start inactivity timer that clears context after timeout
   */
  private startInactivityTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.clearContext();
    }, CONTEXT_TIMEOUT_MS);
  }

  /**
   * Set the last selected book and reference
   */
  setLastBook(book: Book, reference: string): void {
    this.context = {
      lastBook: book,
      lastReference: reference,
      timestamp: Date.now()
    };

    this.saveContext();
    this.startInactivityTimer();
  }

  /**
   * Get the last selected book
   */
  getLastBook(): Book | null {
    const age = Date.now() - this.context.timestamp;

    // Clear if expired
    if (age >= CONTEXT_TIMEOUT_MS) {
      this.clearContext();
      return null;
    }

    return this.context.lastBook;
  }

  /**
   * Get the last reference
   */
  getLastReference(): string | null {
    const age = Date.now() - this.context.timestamp;

    if (age >= CONTEXT_TIMEOUT_MS) {
      this.clearContext();
      return null;
    }

    return this.context.lastReference;
  }

  /**
   * Clear the context
   */
  clearContext(): void {
    this.context = {
      lastBook: null,
      lastReference: null,
      timestamp: Date.now()
    };

    try {
      localStorage.removeItem(CONTEXT_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear scripture context:', error);
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Reset the inactivity timer (called on user interaction)
   */
  resetTimer(): void {
    this.context.timestamp = Date.now();
    this.saveContext();
    this.startInactivityTimer();
  }

  /**
   * Check if input is likely a chapter:verse without book
   */
  isChapterVerseOnly(input: string): boolean {
    // Match patterns like "3:16" or "3:16-18" or "3"
    const chapterVersePattern = /^\d+(?::\d+(?:-\d+)?)?$/;
    return chapterVersePattern.test(input.trim());
  }

  /**
   * Get placeholder text showing last book
   */
  getPlaceholder(): string {
    const lastBook = this.getLastBook();
    if (lastBook) {
      return `Enter reference (Last: ${lastBook.name}) e.g., 3:16`;
    }
    return 'Enter scripture reference (e.g., John 3:16)';
  }

  /**
   * Auto-complete input with last book if applicable
   */
  autoCompleteWithLastBook(input: string): string | null {
    const lastBook = this.getLastBook();

    if (!lastBook || !this.isChapterVerseOnly(input)) {
      return null;
    }

    // Construct full reference
    return `${lastBook.name} ${input}`;
  }
}

// Export singleton instance
export const scriptureContext = new ScriptureContextService();
