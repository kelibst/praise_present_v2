import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { ScriptureVerse } from "./services/bibleService";
import { scriptureNavigationService, NavigatedVerse, VerseGroup } from "./services/scriptureNavigationService";

export interface ScriptureNavigationState {
  // Current navigation context
  currentVerses: NavigatedVerse[];           // Currently selected verses
  currentGroups: VerseGroup[];               // Grouped verses for slides
  currentGroupIndex: number;                 // Current group/slide index
  currentVerseIndexInGroup: number;          // Current verse within the group

  // Navigation metadata
  canNavigatePrevious: boolean;              // Can navigate to previous verse
  canNavigateNext: boolean;                  // Can navigate to next verse
  canNavigatePreviousChapter: boolean;       // Can navigate to previous chapter
  canNavigateNextChapter: boolean;           // Can navigate to next chapter
  canNavigatePreviousBook: boolean;          // Can navigate to previous book
  canNavigateNextBook: boolean;              // Can navigate to next book

  // Navigation mode
  navigationMode: 'slide' | 'verse';         // Navigate by slide or individual verse

  // Loading states
  isNavigating: boolean;
  navigationError: string | null;

  // Cache for faster navigation
  navigationCache: {
    [verseId: string]: {
      previous: NavigatedVerse | null;
      next: NavigatedVerse | null;
    };
  };
}

const initialState: ScriptureNavigationState = {
  currentVerses: [],
  currentGroups: [],
  currentGroupIndex: 0,
  currentVerseIndexInGroup: 0,
  canNavigatePrevious: false,
  canNavigateNext: false,
  canNavigatePreviousChapter: false,
  canNavigateNextChapter: false,
  canNavigatePreviousBook: false,
  canNavigateNextBook: false,
  navigationMode: 'slide',
  isNavigating: false,
  navigationError: null,
  navigationCache: {},
};

// Async thunks for navigation
export const navigateToPreviousVerse = createAsyncThunk(
  'scriptureNavigation/navigateToPreviousVerse',
  async (_, { getState }) => {
    const state = getState() as any;
    const navigation = state.scriptureNavigation as ScriptureNavigationState;

    // Get the current verse
    const currentGroup = navigation.currentGroups[navigation.currentGroupIndex];
    if (!currentGroup) throw new Error('No current verse group');

    const currentVerse = currentGroup.verses[navigation.currentVerseIndexInGroup];
    if (!currentVerse) throw new Error('No current verse');

    // Navigate to previous verse using the service
    const previousVerse = await scriptureNavigationService.getPreviousVerse(currentVerse);
    if (!previousVerse) throw new Error('No previous verse available');

    return previousVerse;
  }
);

export const navigateToNextVerse = createAsyncThunk(
  'scriptureNavigation/navigateToNextVerse',
  async (_, { getState }) => {
    const state = getState() as any;
    const navigation = state.scriptureNavigation as ScriptureNavigationState;

    // Get the current verse
    const currentGroup = navigation.currentGroups[navigation.currentGroupIndex];
    if (!currentGroup) throw new Error('No current verse group');

    const currentVerse = currentGroup.verses[navigation.currentVerseIndexInGroup];
    if (!currentVerse) throw new Error('No current verse');

    // Navigate to next verse using the service
    const nextVerse = await scriptureNavigationService.getNextVerse(currentVerse);
    if (!nextVerse) throw new Error('No next verse available');

    return nextVerse;
  }
);

export const navigateToPreviousChapter = createAsyncThunk(
  'scriptureNavigation/navigateToPreviousChapter',
  async (_, { getState }) => {
    const state = getState() as any;
    const navigation = state.scriptureNavigation as ScriptureNavigationState;

    const currentGroup = navigation.currentGroups[navigation.currentGroupIndex];
    if (!currentGroup) throw new Error('No current verse group');

    const currentVerse = currentGroup.verses[0]; // Use first verse of group for chapter nav
    if (!currentVerse) throw new Error('No current verse');

    // Get the first verse of previous chapter
    const prevChapterVerse = await scriptureNavigationService.getFirstVerseOfPreviousChapter(currentVerse);
    if (!prevChapterVerse) throw new Error('No previous chapter available');

    return prevChapterVerse;
  }
);

export const navigateToNextChapter = createAsyncThunk(
  'scriptureNavigation/navigateToNextChapter',
  async (_, { getState }) => {
    const state = getState() as any;
    const navigation = state.scriptureNavigation as ScriptureNavigationState;

    const currentGroup = navigation.currentGroups[navigation.currentGroupIndex];
    if (!currentGroup) throw new Error('No current verse group');

    const currentVerse = currentGroup.verses[0]; // Use first verse of group for chapter nav
    if (!currentVerse) throw new Error('No current verse');

    // Get the first verse of next chapter
    const nextChapterVerse = await scriptureNavigationService.getFirstVerseOfNextChapter(currentVerse);
    if (!nextChapterVerse) throw new Error('No next chapter available');

    return nextChapterVerse;
  }
);

const scriptureNavigationSlice = createSlice({
  name: "scriptureNavigation",
  initialState,
  reducers: {
    // Set the current scripture selection
    setScriptureSelection: (state, action: PayloadAction<{
      verses: NavigatedVerse[];
      groups?: VerseGroup[];
    }>) => {
      const { verses, groups } = action.payload;

      state.currentVerses = verses;
      state.currentGroups = groups || scriptureNavigationService.groupConsecutiveVerses(verses);
      state.currentGroupIndex = 0;
      state.currentVerseIndexInGroup = 0;

      // Update navigation capabilities based on first verse
      if (verses.length > 0) {
        const firstVerse = verses[0];
        const lastVerse = verses[verses.length - 1];

        // Check navigation possibilities
        state.canNavigatePrevious = !!firstVerse.previousId;
        state.canNavigateNext = !!lastVerse.nextId;

        // For chapter navigation, check if we're at chapter boundaries
        state.canNavigatePreviousChapter = firstVerse.verse !== 1 || !!firstVerse.previousId;
        state.canNavigateNextChapter = !!lastVerse.nextId;

        // Book navigation (simplified - check if at book boundaries)
        state.canNavigatePreviousBook = firstVerse.chapter !== 1 || firstVerse.verse !== 1 || !!firstVerse.previousId;
        state.canNavigateNextBook = !!lastVerse.nextId;
      } else {
        // No verses selected
        state.canNavigatePrevious = false;
        state.canNavigateNext = false;
        state.canNavigatePreviousChapter = false;
        state.canNavigateNextChapter = false;
        state.canNavigatePreviousBook = false;
        state.canNavigateNextBook = false;
      }

      state.navigationError = null;
    },

    // Navigate within current selection (slide-based)
    navigateToPreviousSlide: (state) => {
      if (state.currentGroupIndex > 0) {
        state.currentGroupIndex--;
        state.currentVerseIndexInGroup = 0;
      }
    },

    navigateToNextSlide: (state) => {
      if (state.currentGroupIndex < state.currentGroups.length - 1) {
        state.currentGroupIndex++;
        state.currentVerseIndexInGroup = 0;
      }
    },

    // Navigate within current group (verse-based)
    navigateToPreviousVerseInGroup: (state) => {
      if (state.currentVerseIndexInGroup > 0) {
        state.currentVerseIndexInGroup--;
      } else if (state.currentGroupIndex > 0) {
        // Move to previous group's last verse
        state.currentGroupIndex--;
        const prevGroup = state.currentGroups[state.currentGroupIndex];
        state.currentVerseIndexInGroup = prevGroup.verses.length - 1;
      }
    },

    navigateToNextVerseInGroup: (state) => {
      const currentGroup = state.currentGroups[state.currentGroupIndex];
      if (state.currentVerseIndexInGroup < currentGroup.verses.length - 1) {
        state.currentVerseIndexInGroup++;
      } else if (state.currentGroupIndex < state.currentGroups.length - 1) {
        // Move to next group's first verse
        state.currentGroupIndex++;
        state.currentVerseIndexInGroup = 0;
      }
    },

    // Set navigation mode
    setNavigationMode: (state, action: PayloadAction<'slide' | 'verse'>) => {
      state.navigationMode = action.payload;
    },

    // Set current slide/group index directly
    setCurrentGroupIndex: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.currentGroups.length) {
        state.currentGroupIndex = index;
        state.currentVerseIndexInGroup = 0;
      }
    },

    // Cache navigation for a verse
    cacheNavigation: (state, action: PayloadAction<{
      verseId: string;
      previous: NavigatedVerse | null;
      next: NavigatedVerse | null;
    }>) => {
      const { verseId, previous, next } = action.payload;
      state.navigationCache[verseId] = { previous, next };
    },

    // Clear navigation cache
    clearNavigationCache: (state) => {
      state.navigationCache = {};
    },

    // Clear navigation state
    clearNavigation: (state) => {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    // Handle navigateToPreviousVerse
    builder
      .addCase(navigateToPreviousVerse.pending, (state) => {
        state.isNavigating = true;
        state.navigationError = null;
      })
      .addCase(navigateToPreviousVerse.fulfilled, (state, action) => {
        state.isNavigating = false;
        // Replace current selection with the new verse
        const newVerse = action.payload;
        state.currentVerses = [newVerse];
        state.currentGroups = [{ verses: [newVerse], reference: newVerse.reference, isConsecutive: true }];
        state.currentGroupIndex = 0;
        state.currentVerseIndexInGroup = 0;

        // Update navigation capabilities
        state.canNavigatePrevious = !!newVerse.previousId;
        state.canNavigateNext = !!newVerse.nextId;
      })
      .addCase(navigateToPreviousVerse.rejected, (state, action) => {
        state.isNavigating = false;
        state.navigationError = action.error.message || 'Failed to navigate to previous verse';
      });

    // Handle navigateToNextVerse
    builder
      .addCase(navigateToNextVerse.pending, (state) => {
        state.isNavigating = true;
        state.navigationError = null;
      })
      .addCase(navigateToNextVerse.fulfilled, (state, action) => {
        state.isNavigating = false;
        // Replace current selection with the new verse
        const newVerse = action.payload;
        state.currentVerses = [newVerse];
        state.currentGroups = [{ verses: [newVerse], reference: newVerse.reference, isConsecutive: true }];
        state.currentGroupIndex = 0;
        state.currentVerseIndexInGroup = 0;

        // Update navigation capabilities
        state.canNavigatePrevious = !!newVerse.previousId;
        state.canNavigateNext = !!newVerse.nextId;
      })
      .addCase(navigateToNextVerse.rejected, (state, action) => {
        state.isNavigating = false;
        state.navigationError = action.error.message || 'Failed to navigate to next verse';
      });

    // Handle navigateToPreviousChapter
    builder
      .addCase(navigateToPreviousChapter.pending, (state) => {
        state.isNavigating = true;
        state.navigationError = null;
      })
      .addCase(navigateToPreviousChapter.fulfilled, (state, action) => {
        state.isNavigating = false;
        const newVerse = action.payload;
        state.currentVerses = [newVerse];
        state.currentGroups = [{ verses: [newVerse], reference: newVerse.reference, isConsecutive: true }];
        state.currentGroupIndex = 0;
        state.currentVerseIndexInGroup = 0;

        // Update navigation capabilities
        state.canNavigatePrevious = !!newVerse.previousId;
        state.canNavigateNext = !!newVerse.nextId;
        state.canNavigatePreviousChapter = newVerse.verse !== 1 || !!newVerse.previousId;
        state.canNavigateNextChapter = !!newVerse.nextId;
      })
      .addCase(navigateToPreviousChapter.rejected, (state, action) => {
        state.isNavigating = false;
        state.navigationError = action.error.message || 'Failed to navigate to previous chapter';
      });

    // Handle navigateToNextChapter
    builder
      .addCase(navigateToNextChapter.pending, (state) => {
        state.isNavigating = true;
        state.navigationError = null;
      })
      .addCase(navigateToNextChapter.fulfilled, (state, action) => {
        state.isNavigating = false;
        const newVerse = action.payload;
        state.currentVerses = [newVerse];
        state.currentGroups = [{ verses: [newVerse], reference: newVerse.reference, isConsecutive: true }];
        state.currentGroupIndex = 0;
        state.currentVerseIndexInGroup = 0;

        // Update navigation capabilities
        state.canNavigatePrevious = !!newVerse.previousId;
        state.canNavigateNext = !!newVerse.nextId;
        state.canNavigatePreviousChapter = newVerse.verse !== 1 || !!newVerse.previousId;
        state.canNavigateNextChapter = !!newVerse.nextId;
      })
      .addCase(navigateToNextChapter.rejected, (state, action) => {
        state.isNavigating = false;
        state.navigationError = action.error.message || 'Failed to navigate to next chapter';
      });
  },
});

export const {
  setScriptureSelection,
  navigateToPreviousSlide,
  navigateToNextSlide,
  navigateToPreviousVerseInGroup,
  navigateToNextVerseInGroup,
  setNavigationMode,
  setCurrentGroupIndex,
  cacheNavigation,
  clearNavigationCache,
  clearNavigation,
} = scriptureNavigationSlice.actions;

// Selectors
export const selectScriptureNavigation = (state: any) => state.scriptureNavigation as ScriptureNavigationState;
export const selectCurrentVerseGroup = (state: any) => {
  const nav = state.scriptureNavigation as ScriptureNavigationState;
  return nav.currentGroups[nav.currentGroupIndex] || null;
};
export const selectCurrentVerse = (state: any) => {
  const nav = state.scriptureNavigation as ScriptureNavigationState;
  const group = nav.currentGroups[nav.currentGroupIndex];
  return group?.verses[nav.currentVerseIndexInGroup] || null;
};
export const selectCanNavigate = (state: any) => {
  const nav = state.scriptureNavigation as ScriptureNavigationState;
  return {
    previous: nav.navigationMode === 'slide'
      ? nav.currentGroupIndex > 0
      : nav.canNavigatePrevious,
    next: nav.navigationMode === 'slide'
      ? nav.currentGroupIndex < nav.currentGroups.length - 1
      : nav.canNavigateNext,
    previousChapter: nav.canNavigatePreviousChapter,
    nextChapter: nav.canNavigateNextChapter,
    previousBook: nav.canNavigatePreviousBook,
    nextBook: nav.canNavigateNextBook,
  };
};

export default scriptureNavigationSlice.reducer;