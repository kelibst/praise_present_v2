import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { RootState } from './store';
import type { Slide } from '../components/slides/SlideRenderer';

/**
 * Enhanced Presentation Slice - Centralized State Management
 *
 * This slice manages all presentation state across the entire app:
 * - Current content being presented (songs, scriptures, announcements, etc.)
 * - Slide navigation and tracking
 * - Live display synchronization
 * - Per-tab presentation tracking
 * - History for quick switching
 *
 * Benefits:
 * - Single source of truth for all presentation state
 * - Redux DevTools for debugging presentation issues
 * - Automatic persistence via existing middleware
 * - Cross-component state access
 * - Performance tracking via middleware
 */

// ============================================================================
// Types
// ============================================================================

export type ContentType = 'scripture' | 'song' | 'announcement' | 'sermon' | 'media' | 'slide' | 'placeholder';
export type PresentationStatus = 'idle' | 'preview' | 'live';
export type ActiveTab = 'home' | 'scripture' | 'songs' | 'media' | 'announcements' | 'service' | 'plan' | 'plans';

export interface PresentationContent {
  id: string;
  type: ContentType;
  title: string;
  slides: Slide[];
  source: string; // Where this content came from (tab name)
  metadata?: any; // Type-specific metadata (verses, song lyrics, etc.)
}

export interface CurrentPresentation {
  content: PresentationContent | null;
  slideIndex: number;
  status: PresentationStatus;
  owner: ActiveTab | null; // Which tab owns this presentation
}

export interface DisplayState {
  isActive: boolean;
  currentSlide: Slide | null;
  contentType: ContentType | null;
  contentId: string | null;
  slideIndex: number;
}

export interface TabPresentationState {
  tabName: ActiveTab;
  contentId: string | null;
  slideIndex: number;
  isLive: boolean;
}

export interface PresentationState {
  // Current presentation being shown/previewed
  current: CurrentPresentation;

  // Live display state
  display: DisplayState;

  // History of recently presented content (for quick switching)
  history: PresentationContent[];

  // Per-tab tracking (know what's active on each tab)
  tabs: {
    [K in ActiveTab]?: TabPresentationState;
  };

  // Settings
  maxHistorySize: number;
  autoGoLive: boolean; // Auto go live on double-click
}

// ============================================================================
// Initial State
// ============================================================================

const createDefaultPlaceholder = (): PresentationContent => ({
  id: `placeholder-${Date.now()}`,
  type: 'placeholder',
  title: 'PraisePresent',
  source: 'system',
  slides: [{
    id: 'placeholder-slide',
    shapes: [],
    background: {
      type: 'gradient',
      gradient: {
        start: '#1a1a2e',
        end: '#16213e',
        direction: 'diagonal'
      }
    }
  }],
  metadata: {
    mainText: 'Welcome to PraisePresent',
    subText: 'Presentation System Ready',
  }
});

const initialState: PresentationState = {
  current: {
    content: null,
    slideIndex: 0,
    status: 'idle',
    owner: null
  },
  display: {
    isActive: false,
    currentSlide: null,
    contentType: null,
    contentId: null,
    slideIndex: 0
  },
  history: [],
  tabs: {},
  maxHistorySize: 10,
  autoGoLive: false
};

// ============================================================================
// Slice
// ============================================================================

const presentationSlice = createSlice({
  name: "presentation",
  initialState,
  reducers: {
    /**
     * Present content - Main action for showing any content type
     * Atomic operation - validates, updates state, adds to history
     */
    presentContent: (state, action: PayloadAction<{
      content: PresentationContent;
      goLive?: boolean;
      tabName?: ActiveTab;
    }>) => {
      const { content, goLive = false, tabName } = action.payload;

      // Validate content has slides
      if (!content.slides || content.slides.length === 0) {
        console.warn('[PresentationSlice] Cannot present content without slides:', content);
        return;
      }

      // Update current presentation
      state.current = {
        content,
        slideIndex: 0,
        status: goLive ? 'live' : 'preview',
        owner: tabName || content.source as ActiveTab || null
      };

      // Add to history (avoid duplicates)
      const existingIndex = state.history.findIndex(item => item.id === content.id);
      if (existingIndex !== -1) {
        state.history.splice(existingIndex, 1);
      }
      state.history.unshift(content);

      // Limit history size
      if (state.history.length > state.maxHistorySize) {
        state.history = state.history.slice(0, state.maxHistorySize);
      }

      // Update tab tracking
      if (tabName) {
        state.tabs[tabName] = {
          tabName,
          contentId: content.id,
          slideIndex: 0,
          isLive: goLive
        };
      }

      // If going live, update display state
      if (goLive && content.slides[0]) {
        state.display = {
          isActive: true,
          currentSlide: content.slides[0],
          contentType: content.type,
          contentId: content.id,
          slideIndex: 0
        };
      }

      console.log(`[PresentationSlice] Presenting: ${content.title} (${content.slides.length} slides) ${goLive ? '[LIVE]' : '[Preview]'}`);
    },

    /**
     * Switch to different content (clears current if live)
     */
    switchContent: (state, action: PayloadAction<PresentationContent>) => {
      const content = action.payload;

      // If currently live, don't auto-clear (let user decide)
      // Just load the new content in preview mode
      state.current = {
        content,
        slideIndex: 0,
        status: state.current.status === 'live' ? 'preview' : 'idle',
        owner: content.source as ActiveTab || null
      };

      // Add to history
      const existingIndex = state.history.findIndex(item => item.id === content.id);
      if (existingIndex !== -1) {
        state.history.splice(existingIndex, 1);
      }
      state.history.unshift(content);

      if (state.history.length > state.maxHistorySize) {
        state.history = state.history.slice(0, state.maxHistorySize);
      }

      console.log(`[PresentationSlice] Switched to: ${content.title}`);
    },

    /**
     * Navigate to next slide
     */
    nextSlide: (state) => {
      if (!state.current.content) return;

      const maxIndex = state.current.content.slides.length - 1;
      if (state.current.slideIndex < maxIndex) {
        state.current.slideIndex++;

        // Update tab tracking
        if (state.current.owner) {
          const tabState = state.tabs[state.current.owner];
          if (tabState) {
            tabState.slideIndex = state.current.slideIndex;
          }
        }

        // If live, update display
        if (state.current.status === 'live') {
          const slide = state.current.content.slides[state.current.slideIndex];
          state.display.currentSlide = slide;
          state.display.slideIndex = state.current.slideIndex;
        }

        console.log(`[PresentationSlice] Next slide: ${state.current.slideIndex + 1}/${state.current.content.slides.length}`);
      }
    },

    /**
     * Navigate to previous slide
     */
    previousSlide: (state) => {
      if (!state.current.content) return;

      if (state.current.slideIndex > 0) {
        state.current.slideIndex--;

        // Update tab tracking
        if (state.current.owner) {
          const tabState = state.tabs[state.current.owner];
          if (tabState) {
            tabState.slideIndex = state.current.slideIndex;
          }
        }

        // If live, update display
        if (state.current.status === 'live') {
          const slide = state.current.content.slides[state.current.slideIndex];
          state.display.currentSlide = slide;
          state.display.slideIndex = state.current.slideIndex;
        }

        console.log(`[PresentationSlice] Previous slide: ${state.current.slideIndex + 1}/${state.current.content.slides.length}`);
      }
    },

    /**
     * Jump to specific slide
     */
    goToSlide: (state, action: PayloadAction<number>) => {
      if (!state.current.content) return;

      const targetIndex = action.payload;
      const maxIndex = state.current.content.slides.length - 1;

      if (targetIndex >= 0 && targetIndex <= maxIndex) {
        state.current.slideIndex = targetIndex;

        // Update tab tracking
        if (state.current.owner) {
          const tabState = state.tabs[state.current.owner];
          if (tabState) {
            tabState.slideIndex = targetIndex;
          }
        }

        // If live, update display
        if (state.current.status === 'live') {
          const slide = state.current.content.slides[targetIndex];
          state.display.currentSlide = slide;
          state.display.slideIndex = targetIndex;
        }

        console.log(`[PresentationSlice] Jump to slide: ${targetIndex + 1}/${state.current.content.slides.length}`);
      }
    },

    /**
     * Go live with current presentation
     */
    goLive: (state) => {
      if (!state.current.content) {
        console.warn('[PresentationSlice] Cannot go live without content');
        return;
      }

      state.current.status = 'live';

      // Update tab tracking
      if (state.current.owner) {
        const tabState = state.tabs[state.current.owner];
        if (tabState) {
          tabState.isLive = true;
        }
      }

      // Update display state
      const currentSlide = state.current.content.slides[state.current.slideIndex];
      state.display = {
        isActive: true,
        currentSlide,
        contentType: state.current.content.type,
        contentId: state.current.content.id,
        slideIndex: state.current.slideIndex
      };

      console.log(`[PresentationSlice] Going LIVE: ${state.current.content.title} (Slide ${state.current.slideIndex + 1})`);
    },

    /**
     * Stop live presentation
     */
    stopLive: (state) => {
      state.current.status = 'preview';

      // Update tab tracking
      if (state.current.owner) {
        const tabState = state.tabs[state.current.owner];
        if (tabState) {
          tabState.isLive = false;
        }
      }

      // Keep display active but mark status change
      state.display.isActive = false;

      console.log('[PresentationSlice] Stopped LIVE presentation');
    },

    /**
     * Clear current presentation
     */
    clearPresentation: (state) => {
      const wasLive = state.current.status === 'live';

      state.current = {
        content: null,
        slideIndex: 0,
        status: 'idle',
        owner: null
      };

      // If was live, keep display state for graceful transition
      if (!wasLive) {
        state.display = {
          isActive: false,
          currentSlide: null,
          contentType: null,
          contentId: null,
          slideIndex: 0
        };
      }

      console.log('[PresentationSlice] Cleared presentation');
    },

    /**
     * Clear presentation for specific tab
     */
    clearTabPresentation: (state, action: PayloadAction<ActiveTab>) => {
      const tabName = action.payload;

      // If this tab owns the current presentation, clear it
      if (state.current.owner === tabName) {
        // Only clear if not live
        if (state.current.status !== 'live') {
          state.current = {
            content: null,
            slideIndex: 0,
            status: 'idle',
            owner: null
          };
        }
      }

      // Clear tab tracking
      if (state.tabs[tabName]) {
        delete state.tabs[tabName];
      }

      console.log(`[PresentationSlice] Cleared tab: ${tabName}`);
    },

    /**
     * Show black screen on live display
     */
    showBlackScreen: (state) => {
      state.display = {
        isActive: true,
        currentSlide: null, // null = black screen
        contentType: null,
        contentId: null,
        slideIndex: 0
      };

      console.log('[PresentationSlice] Showing black screen');
    },

    /**
     * Update live display state (for external sync)
     */
    updateDisplayState: (state, action: PayloadAction<Partial<DisplayState>>) => {
      state.display = {
        ...state.display,
        ...action.payload
      };
    },

    /**
     * Update presentation settings
     */
    updateSettings: (state, action: PayloadAction<{
      maxHistorySize?: number;
      autoGoLive?: boolean;
    }>) => {
      if (action.payload.maxHistorySize !== undefined) {
        state.maxHistorySize = action.payload.maxHistorySize;
      }
      if (action.payload.autoGoLive !== undefined) {
        state.autoGoLive = action.payload.autoGoLive;
      }
    },

    /**
     * Load content from history
     */
    loadFromHistory: (state, action: PayloadAction<string>) => {
      const contentId = action.payload;
      const content = state.history.find(item => item.id === contentId);

      if (content) {
        state.current = {
          content,
          slideIndex: 0,
          status: 'preview',
          owner: content.source as ActiveTab || null
        };
        console.log(`[PresentationSlice] Loaded from history: ${content.title}`);
      }
    },

    /**
     * Save current presentation to tab memory
     */
    saveTabState: (state, action: PayloadAction<ActiveTab>) => {
      const tabName = action.payload;
      if (state.current.content) {
        state.tabs[tabName] = {
          tabName,
          contentId: state.current.content.id,
          slideIndex: state.current.slideIndex,
          isLive: state.current.status === 'live'
        };
        console.log(`[PresentationSlice] Saved ${tabName} tab state:`, { contentId: state.current.content.id, slideIndex: state.current.slideIndex });
      }
    },

    /**
     * Restore presentation from tab memory
     */
    restoreTabState: (state, action: PayloadAction<ActiveTab>) => {
      const tabName = action.payload;
      const tabState = state.tabs[tabName];
      if (tabState?.contentId) {
        const content = state.history.find(item => item.id === tabState.contentId);
        if (content) {
          state.current = {
            content,
            slideIndex: tabState.slideIndex,
            status: tabState.isLive ? 'live' : 'preview',
            owner: tabName
          };
          console.log(`[PresentationSlice] Restored ${tabName} tab:`, { title: content.title, slideIndex: tabState.slideIndex });
          if (tabState.isLive && content.slides[tabState.slideIndex]) {
            state.display = {
              isActive: true,
              currentSlide: content.slides[tabState.slideIndex],
              contentType: content.type,
              contentId: content.id,
              slideIndex: tabState.slideIndex
            };
          }
        }
      }
    },

    /**
     * Smart tab switch - saves current, restores target
     */
    switchTab: (state, action: PayloadAction<{ fromTab: ActiveTab; toTab: ActiveTab }>) => {
      const { fromTab, toTab } = action.payload;

      // Save current tab state
      if (state.current.content && state.current.owner === fromTab) {
        state.tabs[fromTab] = {
          tabName: fromTab,
          contentId: state.current.content.id,
          slideIndex: state.current.slideIndex,
          isLive: state.current.status === 'live'
        };
      }

      // Don't switch if live
      if (state.current.status === 'live') {
        console.log(`[PresentationSlice] Tab switch ${fromTab} → ${toTab} - keeping live presentation`);
        return;
      }

      // Restore target tab state
      const targetTabState = state.tabs[toTab];
      if (targetTabState?.contentId) {
        const content = state.history.find(item => item.id === targetTabState.contentId);
        if (content) {
          state.current = { content, slideIndex: targetTabState.slideIndex, status: 'preview', owner: toTab };
          console.log(`[PresentationSlice] Restored ${toTab} content: ${content.title}`);
          return;
        }
      }

      // No saved state - clear
      state.current = { content: null, slideIndex: 0, status: 'idle', owner: null };
      console.log(`[PresentationSlice] Cleared presentation for ${toTab} tab`);
    },

    /**
     * Update a specific slide in the current presentation
     * This is needed when slide formatting changes in the editor
     */
    updateSlide: (state, action: PayloadAction<{ slideIndex: number; slide: Slide }>) => {
      if (!state.current.content) return;

      const { slideIndex, slide } = action.payload;
      const maxIndex = state.current.content.slides.length - 1;

      if (slideIndex >= 0 && slideIndex <= maxIndex) {
        console.log(`[PresentationSlice] 🔄 Updating slide ${slideIndex + 1}/${state.current.content.slides.length}`, {
          contentId: state.current.content.id,
          slideId: slide.id,
          shapeCount: slide.shapes.length
        });

        // Update the slide in the content
        state.current.content.slides[slideIndex] = slide;

        // If this is the current slide and we're live, update display
        if (state.current.status === 'live' && state.current.slideIndex === slideIndex) {
          state.display.currentSlide = slide;
        }

        // Update history entry too (to persist changes)
        const historyIndex = state.history.findIndex(item => item.id === state.current.content!.id);
        if (historyIndex !== -1) {
          state.history[historyIndex].slides[slideIndex] = slide;
          console.log(`[PresentationSlice] ✅ Also updated history entry`);
        } else {
          console.warn(`[PresentationSlice] ⚠️ Content not found in history!`, state.current.content.id);
        }
      }
    }
  },
});

// ============================================================================
// Selectors
// ============================================================================

// Basic selectors
export const selectPresentationState = (state: RootState) => state.presentation;
export const selectCurrentPresentation = (state: RootState) => state.presentation.current;
export const selectDisplayState = (state: RootState) => state.presentation.display;
export const selectHistory = (state: RootState) => state.presentation.history;
export const selectTabs = (state: RootState) => state.presentation.tabs;

// Computed selectors
export const selectHasContent = createSelector(
  [selectCurrentPresentation],
  (current) => current.content !== null && current.content.slides.length > 0
);

export const selectIsLive = createSelector(
  [selectCurrentPresentation],
  (current) => current.status === 'live'
);

export const selectCurrentSlide = createSelector(
  [selectCurrentPresentation],
  (current) => {
    if (!current.content || current.slideIndex < 0) return null;
    return current.content.slides[current.slideIndex] || null;
  }
);

export const selectSlideCount = createSelector(
  [selectCurrentPresentation],
  (current) => current.content?.slides.length || 0
);

export const selectCanNavigateNext = createSelector(
  [selectCurrentPresentation],
  (current) => {
    if (!current.content) return false;
    return current.slideIndex < current.content.slides.length - 1;
  }
);

export const selectCanNavigatePrevious = createSelector(
  [selectCurrentPresentation],
  (current) => current.slideIndex > 0
);

export const selectCurrentContentInfo = createSelector(
  [selectCurrentPresentation],
  (current) => {
    if (!current.content) return null;
    return {
      id: current.content.id,
      type: current.content.type,
      title: current.content.title,
      slideCount: current.content.slides.length,
      currentSlide: current.slideIndex + 1,
      status: current.status,
      owner: current.owner
    };
  }
);

export const selectTabPresentation = (tabName: ActiveTab) => createSelector(
  [selectTabs],
  (tabs) => tabs[tabName] || null
);

// ============================================================================
// Exports
// ============================================================================

export const {
  presentContent,
  switchContent,
  nextSlide,
  previousSlide,
  goToSlide,
  goLive,
  stopLive,
  clearPresentation,
  clearTabPresentation,
  showBlackScreen,
  updateDisplayState,
  updateSettings,
  updateSlide,
  loadFromHistory,
  saveTabState,
  restoreTabState,
  switchTab
} = presentationSlice.actions;

export default presentationSlice.reducer;
