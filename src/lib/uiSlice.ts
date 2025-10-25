import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { RootState } from './store';
import type { ActiveTab } from './presentationSlice';

/**
 * UI Slice - Centralized UI State Management
 *
 * Manages all UI-related state for the LivePresentationPage:
 * - Active tab selection
 * - Modal visibility and state
 * - Panel layout (visibility and sizes)
 * - Loading states
 * - Pending items from other pages
 *
 * Benefits:
 * - Single source of truth for UI state
 * - Consistent persistence strategy
 * - Easy debugging with Redux DevTools
 * - No scattered useState hooks
 */

// ============================================================================
// Types
// ============================================================================

export type ScriptureSubTab = 'browse' | 'type';

export type LoadingStatus =
  | { type: 'idle' }
  | { type: 'generating-slides'; itemId: string }
  | { type: 'loading-plan'; planId: string; error?: string }
  | { type: 'initializing-service' }
  | { type: 'executing-service' };

export interface InlineMediaModalState {
  open: boolean;
  mediaType: 'song' | 'scripture' | 'presentation' | 'announcement' | null;
  insertPosition: number;
}

export interface PanelLayout {
  visibility: {
    left: boolean;
    middle: boolean;
    right: boolean;
  };
  sizes: number[];
}

export interface PendingSongItem {
  id: string;
  title: string;
  content: any;
  slides?: any[];
  addedAt: number;
}

export interface UIState {
  // Tab Management
  activeTab: ActiveTab;
  scriptureSubTab: ScriptureSubTab;

  // Modals
  settingsModalOpen: boolean;
  inlineMediaModal: InlineMediaModalState;
  propertyPanelVisible: boolean;

  // Panel Layout
  panelLayout: PanelLayout;

  // Loading States (unified state machine)
  loadingState: LoadingStatus;

  // Cross-page pending items (replaces localStorage polling!)
  pendingSongs: PendingSongItem[];

  // Active verse highlighting (for scripture tab)
  activeVerseNumbers: number[];

  // Service management
  currentServiceId: string | null;
}

// ============================================================================
// Initial State
// ============================================================================

const loadPanelLayoutFromStorage = (): PanelLayout => {
  try {
    const visibilityStr = localStorage.getItem('live-presentation-panel-visibility');
    const sizesStr = localStorage.getItem('live-presentation-panel-sizes');

    return {
      visibility: visibilityStr
        ? JSON.parse(visibilityStr)
        : { left: true, middle: true, right: true },
      sizes: sizesStr ? JSON.parse(sizesStr) : [25, 50, 25]
    };
  } catch (error) {
    console.warn('[uiSlice] Error loading panel layout from storage:', error);
    return {
      visibility: { left: true, middle: true, right: true },
      sizes: [25, 50, 25]
    };
  }
};

const initialState: UIState = {
  activeTab: 'scripture',
  scriptureSubTab: 'browse',
  settingsModalOpen: false,
  inlineMediaModal: {
    open: false,
    mediaType: null,
    insertPosition: 0
  },
  propertyPanelVisible: false,
  panelLayout: loadPanelLayoutFromStorage(),
  loadingState: { type: 'idle' },
  pendingSongs: [],
  activeVerseNumbers: [],
  currentServiceId: null
};

// ============================================================================
// Slice
// ============================================================================

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    /**
     * Set active tab
     */
    setActiveTab: (state, action: PayloadAction<ActiveTab>) => {
      const previousTab = state.activeTab;
      state.activeTab = action.payload;

      console.log(`[uiSlice] Tab changed: ${previousTab} → ${action.payload}`);

      // Clear active verses when leaving scripture tab
      if (previousTab === 'scripture' && action.payload !== 'scripture') {
        state.activeVerseNumbers = [];
      }
    },

    /**
     * Set scripture sub-tab
     */
    setScriptureSubTab: (state, action: PayloadAction<ScriptureSubTab>) => {
      state.scriptureSubTab = action.payload;
    },

    /**
     * Toggle settings modal
     */
    setSettingsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.settingsModalOpen = action.payload;
    },

    /**
     * Open inline media modal
     */
    openInlineMediaModal: (state, action: PayloadAction<{
      mediaType: 'song' | 'scripture' | 'presentation' | 'announcement';
      insertPosition: number;
    }>) => {
      state.inlineMediaModal = {
        open: true,
        mediaType: action.payload.mediaType,
        insertPosition: action.payload.insertPosition
      };
    },

    /**
     * Close inline media modal
     */
    closeInlineMediaModal: (state) => {
      state.inlineMediaModal = {
        open: false,
        mediaType: null,
        insertPosition: 0
      };
    },

    /**
     * Toggle property panel
     */
    setPropertyPanelVisible: (state, action: PayloadAction<boolean>) => {
      state.propertyPanelVisible = action.payload;
    },

    /**
     * Update panel visibility
     */
    setPanelVisibility: (state, action: PayloadAction<Partial<PanelLayout['visibility']>>) => {
      state.panelLayout.visibility = {
        ...state.panelLayout.visibility,
        ...action.payload
      };

      // Persist to localStorage
      try {
        localStorage.setItem(
          'live-presentation-panel-visibility',
          JSON.stringify(state.panelLayout.visibility)
        );
      } catch (error) {
        console.warn('[uiSlice] Error saving panel visibility:', error);
      }
    },

    /**
     * Update panel sizes
     */
    setPanelSizes: (state, action: PayloadAction<number[]>) => {
      state.panelLayout.sizes = action.payload;

      // Persist to localStorage
      try {
        localStorage.setItem(
          'live-presentation-panel-sizes',
          JSON.stringify(action.payload)
        );
      } catch (error) {
        console.warn('[uiSlice] Error saving panel sizes:', error);
      }
    },

    /**
     * Set loading state (unified state machine)
     */
    setLoadingState: (state, action: PayloadAction<LoadingStatus>) => {
      state.loadingState = action.payload;

      // Log state transitions for debugging
      console.log(`[uiSlice] Loading state: ${action.payload.type}`, action.payload);
    },

    /**
     * Add pending song (from SongsPage or other sources)
     * This replaces localStorage polling!
     */
    addPendingSong: (state, action: PayloadAction<PendingSongItem>) => {
      // Avoid duplicates
      const exists = state.pendingSongs.find(s => s.id === action.payload.id);
      if (!exists) {
        state.pendingSongs.push(action.payload);
        console.log(`[uiSlice] Added pending song: ${action.payload.title}`);
      }
    },

    /**
     * Add multiple pending songs
     */
    addPendingSongs: (state, action: PayloadAction<PendingSongItem[]>) => {
      action.payload.forEach(song => {
        const exists = state.pendingSongs.find(s => s.id === song.id);
        if (!exists) {
          state.pendingSongs.push(song);
        }
      });
      console.log(`[uiSlice] Added ${action.payload.length} pending songs`);
    },

    /**
     * Remove pending song (after adding to service)
     */
    removePendingSong: (state, action: PayloadAction<string>) => {
      state.pendingSongs = state.pendingSongs.filter(s => s.id !== action.payload);
      console.log(`[uiSlice] Removed pending song: ${action.payload}`);
    },

    /**
     * Clear all pending songs
     */
    clearPendingSongs: (state) => {
      const count = state.pendingSongs.length;
      state.pendingSongs = [];
      console.log(`[uiSlice] Cleared ${count} pending songs`);
    },

    /**
     * Set active verse numbers (for scripture highlighting)
     */
    setActiveVerseNumbers: (state, action: PayloadAction<number[]>) => {
      state.activeVerseNumbers = action.payload;
    },

    /**
     * Set current service ID
     */
    setCurrentServiceId: (state, action: PayloadAction<string | null>) => {
      state.currentServiceId = action.payload;
    },

    /**
     * Reset UI state (for testing or full reset)
     */
    resetUIState: (state) => {
      return {
        ...initialState,
        panelLayout: state.panelLayout, // Keep panel layout
        currentServiceId: state.currentServiceId // Keep service ID
      };
    }
  },
});

// ============================================================================
// Selectors
// ============================================================================

// Basic selectors
export const selectUIState = (state: RootState) => state.ui;
export const selectActiveTab = (state: RootState) => state.ui.activeTab;
export const selectScriptureSubTab = (state: RootState) => state.ui.scriptureSubTab;
export const selectSettingsModalOpen = (state: RootState) => state.ui.settingsModalOpen;
export const selectInlineMediaModal = (state: RootState) => state.ui.inlineMediaModal;
export const selectPropertyPanelVisible = (state: RootState) => state.ui.propertyPanelVisible;
export const selectPanelLayout = (state: RootState) => state.ui.panelLayout;
export const selectLoadingState = (state: RootState) => state.ui.loadingState;
export const selectPendingSongs = (state: RootState) => state.ui.pendingSongs;
export const selectActiveVerseNumbers = (state: RootState) => state.ui.activeVerseNumbers;
export const selectCurrentServiceId = (state: RootState) => state.ui.currentServiceId;

// Computed selectors
export const selectIsGeneratingSlides = createSelector(
  [selectLoadingState],
  (loadingState) => loadingState.type === 'generating-slides'
);

export const selectIsPlanLoading = createSelector(
  [selectLoadingState],
  (loadingState) => loadingState.type === 'loading-plan'
);

export const selectIsLoadingService = createSelector(
  [selectLoadingState],
  (loadingState) => loadingState.type === 'initializing-service'
);

export const selectIsExecutingService = createSelector(
  [selectLoadingState],
  (loadingState) => loadingState.type === 'executing-service'
);

export const selectIsAnyLoading = createSelector(
  [selectLoadingState],
  (loadingState) => loadingState.type !== 'idle'
);

export const selectPendingSongsCount = createSelector(
  [selectPendingSongs],
  (songs) => songs.length
);

export const selectHasPendingSongs = createSelector(
  [selectPendingSongs],
  (songs) => songs.length > 0
);

export const selectPlanError = createSelector(
  [selectLoadingState],
  (loadingState) => loadingState.type === 'loading-plan' ? loadingState.error : null
);

// ============================================================================
// Exports
// ============================================================================

export const {
  setActiveTab,
  setScriptureSubTab,
  setSettingsModalOpen,
  openInlineMediaModal,
  closeInlineMediaModal,
  setPropertyPanelVisible,
  setPanelVisibility,
  setPanelSizes,
  setLoadingState,
  addPendingSong,
  addPendingSongs,
  removePendingSong,
  clearPendingSongs,
  setActiveVerseNumbers,
  setCurrentServiceId,
  resetUIState
} = uiSlice.actions;

export default uiSlice.reducer;
