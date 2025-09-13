import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { databaseIPC } from './database-ipc';

// Types
export interface Translation {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isDefault: boolean;
}

export interface Version {
  id: string;
  name: string;
  fullName: string;
  translationId: string;
  description?: string | null;
  isDefault: boolean;
  year?: number | null;
  publisher?: string | null;
  translation?: Translation;
}

export interface Book {
  id: number;
  name: string;
  shortName: string;
  testament: string;
  category: string;
  chapters: number;
  order: number;
}

export interface Verse {
  id: string;
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
  versionId: string;
  book?: Book;
  version?: Version;
}

export interface ScriptureReference {
  bookName: string;
  chapter: number;
  verse: number;
}

export interface BibleState {
  translations: Translation[];
  versions: Version[];
  books: Book[];
  selectedTranslation: string | null;
  selectedVersion: string | null;
  selectedBook: number | null;
  selectedChapter: number | null;
  selectedVerse: number | null;
  verses: Verse[];
  searchResults: Verse[];
  currentReference: string; // For the combined input field
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Utility function to parse scripture references
export const parseScriptureReference = (input: string): ScriptureReference | null => {
  // Clean up the input
  const cleaned = input.trim();
  
  // Regular expressions for different formats
  const patterns = [
    // "John 3:16", "1 John 3:16", "2 Timothy 1:1"
    /^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+):(\d+)$/,
    // "John 3" (assumes verse 1)
    /^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+)$/,
    // Just book name (assumes chapter 1, verse 1)
    /^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*)$/
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const bookName = match[1].trim();
      const chapter = match[2] ? parseInt(match[2]) : 1;
      const verse = match[3] ? parseInt(match[3]) : 1;
      
      return {
        bookName,
        chapter: Math.max(1, chapter),
        verse: Math.max(1, verse)
      };
    }
  }
  
  return null;
};

// Utility function to find book by name (fuzzy matching)
export const findBookByName = (books: Book[], bookName: string): Book | null => {
  const normalized = bookName.toLowerCase().trim();
  
  // First try exact match
  let book = books.find(b => 
    b.name.toLowerCase() === normalized || 
    b.shortName.toLowerCase() === normalized
  );
  
  if (book) return book;
  
  // Try partial match
  book = books.find(b => 
    b.name.toLowerCase().includes(normalized) || 
    normalized.includes(b.name.toLowerCase()) ||
    b.shortName.toLowerCase().includes(normalized) ||
    normalized.includes(b.shortName.toLowerCase())
  );
  
  if (book) return book;
  
  // Try starting with
  book = books.find(b => 
    b.name.toLowerCase().startsWith(normalized) ||
    b.shortName.toLowerCase().startsWith(normalized)
  );
  
  return book || null;
};

// Async thunks
export const loadTranslations = createAsyncThunk(
  'bible/loadTranslations',
  async () => {
    const translations = await databaseIPC.loadTranslations();
    return translations;
  }
);

export const loadVersions = createAsyncThunk(
  'bible/loadVersions',
  async (translationId?: string) => {
    const versions = await databaseIPC.loadVersions(translationId);
    return versions;
  }
);

export const loadBooks = createAsyncThunk(
  'bible/loadBooks',
  async () => {
    const books = await databaseIPC.loadBooks();
    return books;
  }
);

export const loadVerses = createAsyncThunk(
  'bible/loadVerses',
  async ({ versionId, bookId, chapter }: { versionId: string; bookId: number; chapter: number }) => {
    const verses = await databaseIPC.loadVerses({ versionId, bookId, chapter });
    return verses;
  }
);

export const searchVerses = createAsyncThunk(
  'bible/searchVerses',
  async ({ query, versionId }: { query: string; versionId?: string }) => {
    const verses = await databaseIPC.searchVerses({ query, versionId });
    return verses;
  }
);

// New thunk for initializing defaults
export const initializeBibleDefaults = createAsyncThunk(
  'bible/initializeDefaults',
  async (_, { dispatch, getState }) => {
    const state = getState() as { bible: BibleState };
    
    // Load data in sequence
    await dispatch(loadTranslations());
    await dispatch(loadVersions());
    await dispatch(loadBooks());
    
    // Get updated state
    const updatedState = getState() as { bible: BibleState };
    
    // Find KJV version (assuming it has ID that contains 'kjv' or is marked as default)
    let defaultVersion = updatedState.bible.versions.find(v => 
      v.id.toLowerCase().includes('kjv') || v.name.toLowerCase().includes('kjv')
    );
    
    // Fallback to the first version if KJV not found
    if (!defaultVersion && updatedState.bible.versions.length > 0) {
      defaultVersion = updatedState.bible.versions[0];
    }
    
    // Find Genesis (usually the first book)
    const defaultBook = updatedState.bible.books.find(b => 
      b.name.toLowerCase() === 'genesis' || b.order === 1
    ) || updatedState.bible.books[0];
    
    if (defaultVersion && defaultBook) {
      // Load Genesis 1 verses
      await dispatch(loadVerses({
        versionId: defaultVersion.id,
        bookId: defaultBook.id,
        chapter: 1
      }));
      
      return {
        version: defaultVersion,
        book: defaultBook,
        chapter: 1,
        verse: 1
      };
    }
    
    return null;
  }
);

// New thunk for navigating to a scripture reference
export const navigateToReference = createAsyncThunk(
  'bible/navigateToReference',
  async (referenceInput: string, { dispatch, getState }) => {
    const state = getState() as { bible: BibleState };
    const reference = parseScriptureReference(referenceInput);
    
    if (!reference || !state.bible.selectedVersion) {
      throw new Error('Invalid reference or no version selected');
    }
    
    // Find the book
    const book = findBookByName(state.bible.books, reference.bookName);
    if (!book) {
      throw new Error(`Book "${reference.bookName}" not found`);
    }
    
    // Validate chapter and verse
    const chapter = Math.min(reference.chapter, book.chapters);
    const verse = reference.verse; // We'll validate this after loading verses
    
    // Load verses for the chapter
    const versesResult = await dispatch(loadVerses({
      versionId: state.bible.selectedVersion,
      bookId: book.id,
      chapter: chapter
    }));
    
    if (loadVerses.fulfilled.match(versesResult)) {
      const verses = versesResult.payload;
      //@ts-expect-error - v is unknown for now
      const maxVerse = Math.max(...verses.map(v => v.verse));
      const validVerse = Math.min(verse, maxVerse);
      
      return {
        book,
        chapter,
        verse: validVerse,
        verses
      };
    }
    
    throw new Error('Failed to load verses');
  }
);

// New thunk for loading books when version changes
export const loadBooksForVersion = createAsyncThunk(
  'bible/loadBooksForVersion',
  async (versionId: string, { dispatch, getState }) => {
    // Load books for this version
    await dispatch(loadBooks());
    
    // Get updated state
    const state = getState() as { bible: BibleState };
    
    // Find default book (Genesis) and load its first chapter
    const defaultBook = state.bible.books.find(b => 
      b.name.toLowerCase() === 'genesis' || b.order === 1
    ) || state.bible.books[0];
    
    if (defaultBook) {
      // Load Genesis 1 verses for the new version
      await dispatch(loadVerses({
        versionId: versionId,
        bookId: defaultBook.id,
        chapter: 1
      }));
      
      return {
        versionId,
        book: defaultBook,
        chapter: 1,
        verse: 1
      };
    }
    
    return { versionId };
  }
);

// Initial state
const initialState: BibleState = {
  translations: [],
  versions: [],
  books: [],
  selectedTranslation: null,
  selectedVersion: null,
  selectedBook: null,
  selectedChapter: null,
  selectedVerse: null,
  verses: [],
  searchResults: [],
  currentReference: '',
  loading: false,
  error: null,
  isInitialized: false,
};

// Slice
const bibleSlice = createSlice({
  name: 'bible',
  initialState,
  reducers: {
    setSelectedTranslation: (state, action: PayloadAction<string>) => {
      state.selectedTranslation = action.payload;
      // Clear version and verses when translation changes
      state.selectedVersion = null;
      state.verses = [];
      state.selectedChapter = null;
      state.selectedVerse = null;
    },
    setSelectedVersion: (state, action: PayloadAction<string>) => {
      state.selectedVersion = action.payload;
      // Clear verses when version changes
      state.verses = [];
      state.selectedChapter = null;
      state.selectedVerse = null;
    },
    setSelectedBook: (state, action: PayloadAction<number>) => {
      state.selectedBook = action.payload;
      // Clear verses when book changes
      state.verses = [];
      state.selectedChapter = null;
      state.selectedVerse = null;
    },
    setSelectedChapter: (state, action: PayloadAction<number>) => {
      state.selectedChapter = action.payload;
      state.selectedVerse = null;
    },
    setSelectedVerse: (state, action: PayloadAction<number>) => {
      state.selectedVerse = action.payload;
    },
    setCurrentReference: (state, action: PayloadAction<string>) => {
      state.currentReference = action.payload;
    },
    updateCurrentReferenceFromState: (state) => {
      if (state.selectedBook && state.selectedChapter) {
        const book = state.books.find(b => b.id === state.selectedBook);
        if (book) {
          const verse = state.selectedVerse || 1;
          state.currentReference = `${book.name} ${state.selectedChapter}:${verse}`;
        }
      }
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Initialize defaults
    builder
      .addCase(initializeBibleDefaults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeBibleDefaults.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.selectedVersion = action.payload.version.id;
          state.selectedBook = action.payload.book.id;
          state.selectedChapter = action.payload.chapter;
          state.selectedVerse = action.payload.verse;
          state.currentReference = `${action.payload.book.name} ${action.payload.chapter}:${action.payload.verse}`;
        }
        state.isInitialized = true;
      })
      .addCase(initializeBibleDefaults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to initialize Bible defaults';
        state.isInitialized = true;
      });

    // Navigate to reference
    builder
      .addCase(navigateToReference.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(navigateToReference.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.selectedBook = action.payload.book.id;
          state.selectedChapter = action.payload.chapter;
          state.selectedVerse = action.payload.verse;
          state.verses = action.payload.verses;
          state.currentReference = `${action.payload.book.name} ${action.payload.chapter}:${action.payload.verse}`;
        }
      })
      .addCase(navigateToReference.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to navigate to reference';
      });

    // Load translations
    builder
      .addCase(loadTranslations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTranslations.fulfilled, (state, action) => {
        state.loading = false;
        state.translations = action.payload;
        // Set default translation if none selected
        if (!state.selectedTranslation && action.payload.length > 0) {
          const defaultTranslation = action.payload.find((t: Translation) => t.isDefault) || action.payload[0];
          state.selectedTranslation = defaultTranslation.id;
        }
      })
      .addCase(loadTranslations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load translations';
      });

    // Load versions
    builder
      .addCase(loadVersions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadVersions.fulfilled, (state, action) => {
        state.loading = false;
        state.versions = action.payload;
        // Set default version if none selected - prefer KJV
        if (!state.selectedVersion && action.payload.length > 0) {
          let defaultVersion = action.payload.find((v: Version) => 
            v.id.toLowerCase().includes('kjv') || v.name.toLowerCase().includes('kjv')
          );
          
          if (!defaultVersion) {
            defaultVersion = action.payload.find((v: Version) => v.isDefault) || action.payload[0];
          }
          
          state.selectedVersion = defaultVersion.id;
        }
      })
      .addCase(loadVersions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load versions';
      });

    // Load books
    builder
      .addCase(loadBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.books = action.payload;
        // Set default book if none selected - prefer Genesis
        if (!state.selectedBook && action.payload.length > 0) {
          const defaultBook = action.payload.find((b: Book) => 
            b.name.toLowerCase() === 'genesis' || b.order === 1
          ) || action.payload[0];
          
          state.selectedBook = defaultBook.id;
          state.selectedChapter = 1;
          state.selectedVerse = 1;
        }
      })
      .addCase(loadBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load books';
      });

    // Load verses
    builder
      .addCase(loadVerses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadVerses.fulfilled, (state, action) => {
        state.loading = false;
        state.verses = action.payload;
        // Update the current chapter and book from the loaded verses
        if (action.payload && action.payload.length > 0) {
          const firstVerse = action.payload[0];
          state.selectedBook = firstVerse.bookId;
          state.selectedChapter = firstVerse.chapter;
        }
      })
      .addCase(loadVerses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load verses';
      });

    // Search verses
    builder
      .addCase(searchVerses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchVerses.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchVerses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to search verses';
      });

    // Load books for version
    builder
      .addCase(loadBooksForVersion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadBooksForVersion.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.book) {
          state.selectedBook = action.payload.book.id;
          state.selectedChapter = action.payload.chapter;
          state.selectedVerse = action.payload.verse;
          state.currentReference = `${action.payload.book.name} ${action.payload.chapter}:${action.payload.verse}`;
        }
      })
      .addCase(loadBooksForVersion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load books for version';
      });
  },
});

export const {
  setSelectedTranslation,
  setSelectedVersion,
  setSelectedBook,
  setSelectedChapter,
  setSelectedVerse,
  setCurrentReference,
  updateCurrentReferenceFromState,
  clearSearchResults,
  clearError,
} = bibleSlice.actions;

export default bibleSlice.reducer; 