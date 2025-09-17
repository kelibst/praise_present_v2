import { databaseIPC } from '../../hooks/database-ipc';
import { Translation, Version, Book, Verse } from '../bibleSlice';
import { FuzzyBookMatcher, BookMatch } from '../../components/bible/SmartScriptureInput/fuzzyMatch';
import { createAbbreviationMap } from '../../components/bible/SmartScriptureInput/bookAbbreviations';

export interface ScriptureReference {
  bookName: string;
  chapter: number;
  verses: number[];
}

export interface ParsedScriptureReference {
  book: Book | null;
  chapter: number;
  verses: number[];
  isValid: boolean;
  error?: string;
}

export interface ScriptureVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  bookId?: number;
  versionId?: string;
}

export interface ScriptureSelection {
  verses: ScriptureVerse[];
  reference: string;
  translation: string;
  versionId: string;
}

export class BibleService {
  private translations: Translation[] = [];
  private versions: Version[] = [];
  private books: Book[] = [];
  private initialized = false;
  private fuzzyMatcher: FuzzyBookMatcher;
  private abbreviationMap: Map<string, string>;

  constructor() {
    this.fuzzyMatcher = new FuzzyBookMatcher();
    this.abbreviationMap = createAbbreviationMap();
    this.initialize();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔧 BibleService: Initializing...');

      // Load basic data
      this.translations = await databaseIPC.loadTranslations();
      this.versions = await databaseIPC.loadVersions();
      this.books = await databaseIPC.loadBooks();

      // Initialize fuzzy matcher with loaded books
      this.fuzzyMatcher.setBooks(this.books);

      this.initialized = true;
      console.log('✅ BibleService: Initialized successfully', {
        translations: this.translations.length,
        versions: this.versions.length,
        books: this.books.length
      });
    } catch (error) {
      console.error('❌ BibleService: Failed to initialize:', error);
      throw error;
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // Get all available translations
  async getTranslations(): Promise<Translation[]> {
    await this.ensureInitialized();
    return this.translations;
  }

  // Get versions for a specific translation (or all if not specified)
  async getVersions(translationId?: string): Promise<Version[]> {
    await this.ensureInitialized();
    if (translationId) {
      return this.versions.filter(v => v.translationId === translationId);
    }
    return this.versions;
  }

  // Get all Bible books
  async getBooks(): Promise<Book[]> {
    await this.ensureInitialized();
    return this.books;
  }

  // Get default version (prefer KJV, fallback to first available)
  async getDefaultVersion(): Promise<Version | null> {
    await this.ensureInitialized();

    let defaultVersion = this.versions.find(v =>
      v.name.toLowerCase().includes('kjv') || v.isDefault
    );

    if (!defaultVersion && this.versions.length > 0) {
      defaultVersion = this.versions[0];
    }

    return defaultVersion || null;
  }

  // Parse scripture reference string like "John 3:16" or "John 3:16-17"
  parseScriptureReference(input: string): ScriptureReference | null {
    const cleaned = input.trim();

    // Pattern for "Book Chapter:Verse" or "Book Chapter:Verse-Verse"
    const pattern = /^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+):(\d+)(?:-(\d+))?$/;
    const match = cleaned.match(pattern);

    if (match) {
      const bookName = match[1].trim();
      const chapter = parseInt(match[2]);
      const startVerse = parseInt(match[3]);
      const endVerse = match[4] ? parseInt(match[4]) : startVerse;

      const verses = [];
      for (let i = startVerse; i <= endVerse; i++) {
        verses.push(i);
      }

      return { bookName, chapter, verses };
    }

    return null;
  }

  // Find book by name with fuzzy matching
  findBookByName(bookName: string): Book | null {
    const normalized = bookName.toLowerCase().trim();

    // Try exact match first
    let book = this.books.find(b =>
      b.name.toLowerCase() === normalized ||
      b.shortName.toLowerCase() === normalized
    );

    if (book) return book;

    // Try partial match
    book = this.books.find(b =>
      b.name.toLowerCase().includes(normalized) ||
      normalized.includes(b.name.toLowerCase()) ||
      b.shortName.toLowerCase().includes(normalized) ||
      normalized.includes(b.shortName.toLowerCase())
    );

    if (book) return book;

    // Try starting with
    book = this.books.find(b =>
      b.name.toLowerCase().startsWith(normalized) ||
      b.shortName.toLowerCase().startsWith(normalized)
    );

    return book || null;
  }

  // Validate and parse scripture reference
  async validateScriptureReference(input: string): Promise<ParsedScriptureReference> {
    await this.ensureInitialized();

    const reference = this.parseScriptureReference(input);
    if (!reference) {
      return {
        book: null,
        chapter: 0,
        verses: [],
        isValid: false,
        error: 'Invalid scripture reference format. Try "John 3:16" or "John 3:16-17"'
      };
    }

    const book = this.findBookByName(reference.bookName);
    if (!book) {
      return {
        book: null,
        chapter: 0,
        verses: [],
        isValid: false,
        error: `Book "${reference.bookName}" not found`
      };
    }

    if (reference.chapter < 1 || reference.chapter > book.chapters) {
      return {
        book,
        chapter: reference.chapter,
        verses: reference.verses,
        isValid: false,
        error: `Chapter ${reference.chapter} not found. ${book.name} has ${book.chapters} chapters.`
      };
    }

    return {
      book,
      chapter: reference.chapter,
      verses: reference.verses,
      isValid: true
    };
  }

  // Load verses for a specific reference
  async getVerses(versionId: string, bookId: number, chapter: number, verses?: number[]): Promise<ScriptureVerse[]> {
    try {
      console.log('📖 BibleService: Loading verses', { versionId, bookId, chapter, verses });

      const allVerses = await databaseIPC.loadVerses({ versionId, bookId, chapter });
      const version = this.versions.find(v => v.id === versionId);
      const book = this.books.find(b => b.id === bookId);

      if (!version || !book) {
        throw new Error('Version or book not found');
      }

      // Filter verses if specific verse numbers are requested
      let filteredVerses = allVerses;
      if (verses && verses.length > 0) {
        filteredVerses = allVerses.filter((v: Verse) => verses.includes(v.verse));
      }

      // Convert to ScriptureVerse format
      const scriptureVerses: ScriptureVerse[] = filteredVerses.map((v: Verse) => ({
        id: v.id,
        book: book.name,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
        translation: version.name,
        bookId: v.bookId,
        versionId: v.versionId
      }));

      console.log('✅ BibleService: Verses loaded successfully', { count: scriptureVerses.length });
      return scriptureVerses;
    } catch (error) {
      console.error('❌ BibleService: Failed to load verses:', error);
      throw error;
    }
  }

  // Get scripture by reference string
  async getScriptureByReference(reference: string, versionId?: string): Promise<ScriptureSelection> {
    await this.ensureInitialized();

    // Use default version if not specified
    if (!versionId) {
      const defaultVersion = await this.getDefaultVersion();
      if (!defaultVersion) {
        throw new Error('No Bible version available');
      }
      versionId = defaultVersion.id;
    }

    // Validate reference
    const parsed = await this.validateScriptureReference(reference);
    if (!parsed.isValid || !parsed.book) {
      throw new Error(parsed.error || 'Invalid scripture reference');
    }

    // Load verses
    const verses = await this.getVerses(versionId, parsed.book.id, parsed.chapter, parsed.verses);
    const version = this.versions.find(v => v.id === versionId);

    if (!version) {
      throw new Error('Version not found');
    }

    // Format reference string
    const formattedReference = this.formatReference(parsed.book.name, parsed.chapter, parsed.verses);

    return {
      verses,
      reference: formattedReference,
      translation: version.name,
      versionId
    };
  }

  // Format reference string from components
  formatReference(bookName: string, chapter: number, verses: number[]): string {
    if (verses.length === 1) {
      return `${bookName} ${chapter}:${verses[0]}`;
    } else if (verses.length > 1) {
      const sortedVerses = [...verses].sort((a, b) => a - b);
      const first = sortedVerses[0];
      const last = sortedVerses[sortedVerses.length - 1];

      // Check if verses are consecutive
      const isConsecutive = sortedVerses.every((v, i) => i === 0 || v === sortedVerses[i - 1] + 1);

      if (isConsecutive && sortedVerses.length > 1) {
        return `${bookName} ${chapter}:${first}-${last}`;
      } else {
        return `${bookName} ${chapter}:${sortedVerses.join(',')}`;
      }
    }

    return `${bookName} ${chapter}`;
  }

  // Search verses by text
  async searchVerses(query: string, versionId?: string): Promise<ScriptureVerse[]> {
    try {
      await this.ensureInitialized();

      // Use default version if not specified
      if (!versionId) {
        const defaultVersion = await this.getDefaultVersion();
        if (!defaultVersion) {
          throw new Error('No Bible version available');
        }
        versionId = defaultVersion.id;
      }

      console.log('🔍 BibleService: Searching verses', { query, versionId });

      const searchResults = await databaseIPC.searchVerses({ query, versionId });
      const version = this.versions.find(v => v.id === versionId);

      if (!version) {
        throw new Error('Version not found');
      }

      // Convert to ScriptureVerse format
      const scriptureVerses: ScriptureVerse[] = searchResults.map((v: Verse) => {
        const book = this.books.find(b => b.id === v.bookId);
        return {
          id: v.id,
          book: book?.name || 'Unknown',
          chapter: v.chapter,
          verse: v.verse,
          text: v.text,
          translation: version.name,
          bookId: v.bookId,
          versionId: v.versionId
        };
      });

      console.log('✅ BibleService: Search completed', { results: scriptureVerses.length });
      return scriptureVerses;
    } catch (error) {
      console.error('❌ BibleService: Search failed:', error);
      throw error;
    }
  }

  // Get popular/common verses (predefined list for now)
  async getPopularVerses(versionId?: string): Promise<ScriptureVerse[]> {
    const popularRefs = [
      'John 3:16',
      'Romans 3:23',
      'Romans 6:23',
      'Romans 10:9',
      'Ephesians 2:8',
      'Psalm 23:1',
      'Isaiah 41:10',
      '1 Corinthians 13:4',
      'Philippians 4:13',
      'Jeremiah 29:11'
    ];

    const verses: ScriptureVerse[] = [];

    for (const ref of popularRefs) {
      try {
        const scripture = await this.getScriptureByReference(ref, versionId);
        verses.push(...scripture.verses);
      } catch (error) {
        console.warn(`Failed to load popular verse: ${ref}`, error);
      }
    }

    return verses;
  }

  // Get verses by theme/topic
  async getVersesByTheme(theme: string, versionId?: string): Promise<ScriptureVerse[]> {
    const themes: Record<string, string[]> = {
      'love': [
        'John 3:16', '1 Corinthians 13:4-7', '1 John 4:8', 'Romans 8:38-39'
      ],
      'hope': [
        'Jeremiah 29:11', 'Romans 15:13', 'Psalm 42:5', 'Isaiah 40:31'
      ],
      'faith': [
        'Hebrews 11:1', 'Romans 10:17', 'Ephesians 2:8-9', 'Matthew 17:20'
      ],
      'peace': [
        'Philippians 4:6-7', 'John 14:27', 'Isaiah 26:3', 'Romans 5:1'
      ],
      'joy': [
        'Nehemiah 8:10', 'Psalm 16:11', 'Romans 15:13', 'Philippians 4:4'
      ],
      'strength': [
        'Philippians 4:13', 'Isaiah 41:10', 'Psalm 46:1', '2 Corinthians 12:9'
      ],
      'comfort': [
        'Psalm 23:4', '2 Corinthians 1:3-4', 'Matthew 11:28-30', 'Isaiah 40:1'
      ],
      'forgiveness': [
        '1 John 1:9', 'Ephesians 4:32', 'Colossians 3:13', 'Matthew 6:14'
      ],
      'salvation': [
        'Romans 10:9', 'Acts 16:31', 'John 14:6', 'Romans 3:23'
      ],
      'wisdom': [
        'Proverbs 3:5-6', 'James 1:5', 'Proverbs 9:10', 'Ecclesiastes 3:1'
      ]
    };

    const themeRefs = themes[theme.toLowerCase()];
    if (!themeRefs) {
      console.warn(`Theme "${theme}" not found`);
      return [];
    }

    const verses: ScriptureVerse[] = [];

    for (const ref of themeRefs) {
      try {
        const scripture = await this.getScriptureByReference(ref, versionId);
        verses.push(...scripture.verses);
      } catch (error) {
        console.warn(`Failed to load theme verse: ${ref}`, error);
      }
    }

    return verses;
  }

  // Get available themes
  getAvailableThemes(): string[] {
    return [
      'love', 'hope', 'faith', 'peace', 'joy',
      'strength', 'comfort', 'forgiveness', 'salvation', 'wisdom'
    ];
  }

  // Bookmark functionality (using localStorage for now)
  saveBookmark(verse: ScriptureVerse, note?: string): void {
    try {
      const bookmarks = this.getBookmarks();
      const bookmark = {
        id: `bookmark-${Date.now()}`,
        verse,
        note,
        createdAt: new Date().toISOString()
      };

      bookmarks.push(bookmark);
      localStorage.setItem('bible-bookmarks', JSON.stringify(bookmarks));

      console.log('✅ BibleService: Bookmark saved', bookmark);
    } catch (error) {
      console.error('❌ BibleService: Failed to save bookmark:', error);
    }
  }

  getBookmarks(): Array<{id: string; verse: ScriptureVerse; note?: string; createdAt: string}> {
    try {
      const stored = localStorage.getItem('bible-bookmarks');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ BibleService: Failed to load bookmarks:', error);
      return [];
    }
  }

  removeBookmark(bookmarkId: string): void {
    try {
      const bookmarks = this.getBookmarks();
      const filtered = bookmarks.filter(b => b.id !== bookmarkId);
      localStorage.setItem('bible-bookmarks', JSON.stringify(filtered));

      console.log('✅ BibleService: Bookmark removed', bookmarkId);
    } catch (error) {
      console.error('❌ BibleService: Failed to remove bookmark:', error);
    }
  }

  // Recently used verses (using localStorage for now)
  addToRecentlyUsed(verse: ScriptureVerse): void {
    try {
      const recent = this.getRecentlyUsedVerses();

      // Remove if already exists
      const filtered = recent.filter(r => r.verse.id !== verse.id);

      // Add to beginning
      filtered.unshift({
        verse,
        usedAt: new Date().toISOString()
      });

      // Keep only last 20
      const limited = filtered.slice(0, 20);

      localStorage.setItem('bible-recent-verses', JSON.stringify(limited));

      console.log('✅ BibleService: Added to recently used', verse);
    } catch (error) {
      console.error('❌ BibleService: Failed to add to recently used:', error);
    }
  }

  getRecentlyUsedVerses(): Array<{verse: ScriptureVerse; usedAt: string}> {
    try {
      const stored = localStorage.getItem('bible-recent-verses');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ BibleService: Failed to load recently used verses:', error);
      return [];
    }
  }

  // Get verses for a complete chapter
  async getChapterVerses(versionId: string, bookId: number, chapter: number): Promise<ScriptureVerse[]> {
    return this.getVerses(versionId, bookId, chapter);
  }

  // Utility method to get book by ID
  getBookById(bookId: number): Book | null {
    return this.books.find(b => b.id === bookId) || null;
  }

  // Utility method to get version by ID
  getVersionById(versionId: string): Version | null {
    return this.versions.find(v => v.id === versionId) || null;
  }

  // Enhanced book matching methods

  /**
   * Find books using fuzzy matching with scoring
   */
  findBooksWithScore(input: string, limit: number = 5): BookMatch[] {
    if (!this.initialized) {
      console.warn('BibleService not initialized for fuzzy matching');
      return [];
    }

    return this.fuzzyMatcher.findMatches(input, limit);
  }

  /**
   * Get the best matching book for input using intelligent matching
   */
  findBestBookMatch(input: string): Book | null {
    if (!this.initialized) {
      console.warn('BibleService not initialized for book matching');
      return this.findBookByName(input); // Fallback to original method
    }

    const match = this.fuzzyMatcher.getBestMatch(input);
    return match ? match.book : null;
  }

  /**
   * Enhanced findBookByName that includes abbreviation support
   */
  findBookByNameEnhanced(bookName: string): Book | null {
    const normalized = bookName.toLowerCase().trim();

    // First try abbreviation lookup
    const abbreviationMatch = this.abbreviationMap.get(normalized);
    if (abbreviationMatch) {
      const book = this.books.find(b =>
        b.name.toLowerCase() === abbreviationMatch.toLowerCase()
      );
      if (book) return book;
    }

    // Fall back to original fuzzy matching
    return this.findBookByName(bookName);
  }

  /**
   * Get book suggestions for auto-completion
   */
  getBookSuggestions(input: string, limit: number = 5): BookMatch[] {
    return this.findBooksWithScore(input, limit);
  }

  /**
   * Check if a book name or abbreviation is valid
   */
  isValidBookName(input: string): boolean {
    const book = this.findBestBookMatch(input);
    return book !== null;
  }

  /**
   * Get all possible abbreviations for a book
   */
  getBookAbbreviations(bookName: string): string[] {
    // This would need to be implemented by reverse-looking up the abbreviations map
    const abbreviations: string[] = [];

    for (const [abbrev, fullName] of Array.from(this.abbreviationMap.entries())) {
      if (fullName.toLowerCase() === bookName.toLowerCase()) {
        abbreviations.push(abbrev);
      }
    }

    return abbreviations;
  }

  /**
   * Parse and validate a complete scripture reference with enhanced matching
   */
  async parseAndValidateReference(
    input: string,
    versionId?: string
  ): Promise<{
    book: Book | null;
    chapter: number;
    verses: number[];
    isValid: boolean;
    error?: string;
    suggestion?: string;
  }> {
    await this.ensureInitialized();

    // Use default version if not specified
    if (!versionId) {
      const defaultVersion = await this.getDefaultVersion();
      if (!defaultVersion) {
        return {
          book: null,
          chapter: 0,
          verses: [],
          isValid: false,
          error: 'No Bible version available'
        };
      }
      versionId = defaultVersion.id;
    }

    // Parse the reference using enhanced matching
    const parsed = this.parseScriptureReference(input);
    if (!parsed) {
      return {
        book: null,
        chapter: 0,
        verses: [],
        isValid: false,
        error: 'Invalid reference format'
      };
    }

    // Find book using enhanced matching
    const book = this.findBestBookMatch(parsed.bookName);
    if (!book) {
      // Try to get suggestions
      const suggestions = this.findBooksWithScore(parsed.bookName, 3);
      const suggestion = suggestions.length > 0 ? suggestions[0].book.name : undefined;

      return {
        book: null,
        chapter: parsed.chapter,
        verses: parsed.verses,
        isValid: false,
        error: `Book "${parsed.bookName}" not found`,
        suggestion
      };
    }

    // Validate chapter
    if (parsed.chapter < 1 || parsed.chapter > book.chapters) {
      return {
        book,
        chapter: parsed.chapter,
        verses: parsed.verses,
        isValid: false,
        error: `${book.name} has only ${book.chapters} chapters`
      };
    }

    // For now, assume verses are valid (full validation would require loading verse data)
    return {
      book,
      chapter: parsed.chapter,
      verses: parsed.verses,
      isValid: true
    };
  }
}

// Export singleton instance
export const bibleService = new BibleService();