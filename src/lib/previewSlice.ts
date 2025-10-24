import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';

/**
 * Preview Slice - Ephemeral state for slide previewing and editing
 *
 * This slice handles all preview-related state that should NOT be persisted
 * to localStorage or database. It separates the preview UI state from the
 * permanent service items state.
 *
 * Key Benefits:
 * - Preview changes stay in memory (no localStorage writes)
 * - Navigation/editing doesn't trigger persistence
 * - Only save to serviceItems when user explicitly saves
 * - Reduces re-renders in components that don't need preview state
 */

export interface PreviewSlide {
  id: string;
  shapes: any[]; // Serialized shape data
  background?: any;
  verseNumbers?: number[];
  verseIds?: string[];
  duration?: number;
}

export interface PreviewItem {
  id: string;
  type: 'scripture' | 'song' | 'announcement' | 'media' | 'sermon';
  title: string;
  content: any;
  slides?: PreviewSlide[];
  duration?: number;
  order?: number;
  notes?: string;
}

export interface PreviewState {
  // Current item being previewed
  currentItem: PreviewItem | null;

  // Current slide index within the item
  currentSlideIndex: number;

  // Preview mode
  mode: 'editing' | 'viewing' | 'presenting';

  // Dirty flag - indicates unsaved changes
  isDirty: boolean;

  // Last saved state (for dirty checking)
  lastSavedItem: PreviewItem | null;

  // Loading state
  isGeneratingSlides: boolean;

  // Error state
  error: string | null;

  // History for undo/redo
  history: {
    past: PreviewItem[];
    future: PreviewItem[];
  };
}

const initialState: PreviewState = {
  currentItem: null,
  currentSlideIndex: 0,
  mode: 'viewing',
  isDirty: false,
  lastSavedItem: null,
  isGeneratingSlides: false,
  error: null,
  history: {
    past: [],
    future: []
  }
};

export const previewSlice = createSlice({
  name: 'preview',
  initialState,
  reducers: {
    /**
     * Set the current preview item (replaces currentItem entirely)
     */
    setPreviewItem: (state, action: PayloadAction<PreviewItem | null>) => {
      state.currentItem = action.payload;
      state.currentSlideIndex = 0;
      state.isDirty = false;
      state.lastSavedItem = action.payload ? JSON.parse(JSON.stringify(action.payload)) : null;
      state.error = null;
      // Clear history when loading new item
      state.history.past = [];
      state.history.future = [];
    },

    /**
     * Update preview item (partial update, marks as dirty)
     */
    updatePreviewItem: (state, action: PayloadAction<Partial<PreviewItem>>) => {
      if (state.currentItem) {
        // Save to history for undo
        state.history.past.push(JSON.parse(JSON.stringify(state.currentItem)));
        if (state.history.past.length > 50) {
          state.history.past.shift(); // Limit history size
        }
        state.history.future = []; // Clear redo stack

        // Update item
        state.currentItem = {
          ...state.currentItem,
          ...action.payload
        };
        state.isDirty = true;
      }
    },

    /**
     * Update specific slide in preview
     */
    updatePreviewSlide: (state, action: PayloadAction<{ index: number; slide: Partial<PreviewSlide> }>) => {
      if (state.currentItem?.slides) {
        const { index, slide } = action.payload;
        if (index >= 0 && index < state.currentItem.slides.length) {
          // Save to history
          state.history.past.push(JSON.parse(JSON.stringify(state.currentItem)));
          if (state.history.past.length > 50) {
            state.history.past.shift();
          }
          state.history.future = [];

          // Update slide
          state.currentItem.slides[index] = {
            ...state.currentItem.slides[index],
            ...slide
          };
          state.isDirty = true;
        }
      }
    },

    /**
     * Set all slides for current preview item
     */
    setPreviewSlides: (state, action: PayloadAction<PreviewSlide[]>) => {
      if (state.currentItem) {
        state.currentItem.slides = action.payload;
        state.isDirty = true;
      }
    },

    /**
     * Navigate to specific slide index
     */
    setPreviewSlideIndex: (state, action: PayloadAction<number>) => {
      const maxIndex = (state.currentItem?.slides?.length || 1) - 1;
      state.currentSlideIndex = Math.max(0, Math.min(action.payload, maxIndex));
    },

    /**
     * Navigate to next slide
     */
    nextPreviewSlide: (state) => {
      const maxIndex = (state.currentItem?.slides?.length || 1) - 1;
      if (state.currentSlideIndex < maxIndex) {
        state.currentSlideIndex++;
      }
    },

    /**
     * Navigate to previous slide
     */
    previousPreviewSlide: (state) => {
      if (state.currentSlideIndex > 0) {
        state.currentSlideIndex--;
      }
    },

    /**
     * Set preview mode
     */
    setPreviewMode: (state, action: PayloadAction<'editing' | 'viewing' | 'presenting'>) => {
      state.mode = action.payload;
    },

    /**
     * Mark preview as saved (clears dirty flag)
     */
    markPreviewSaved: (state) => {
      state.isDirty = false;
      state.lastSavedItem = state.currentItem ? JSON.parse(JSON.stringify(state.currentItem)) : null;
    },

    /**
     * Undo last change
     */
    undoPreview: (state) => {
      if (state.history.past.length > 0 && state.currentItem) {
        // Move current to future
        state.history.future.unshift(JSON.parse(JSON.stringify(state.currentItem)));
        // Restore from past
        const previous = state.history.past.pop();
        if (previous) {
          state.currentItem = previous;
          state.isDirty = true;
        }
      }
    },

    /**
     * Redo last undone change
     */
    redoPreview: (state) => {
      if (state.history.future.length > 0) {
        // Move current to past
        if (state.currentItem) {
          state.history.past.push(JSON.parse(JSON.stringify(state.currentItem)));
        }
        // Restore from future
        const next = state.history.future.shift();
        if (next) {
          state.currentItem = next;
          state.isDirty = true;
        }
      }
    },

    /**
     * Set slide generation loading state
     */
    setGeneratingSlides: (state, action: PayloadAction<boolean>) => {
      state.isGeneratingSlides = action.payload;
    },

    /**
     * Set error state
     */
    setPreviewError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Clear preview (reset to initial state)
     */
    clearPreview: (state) => {
      state.currentItem = null;
      state.currentSlideIndex = 0;
      state.isDirty = false;
      state.lastSavedItem = null;
      state.isGeneratingSlides = false;
      state.error = null;
      state.history.past = [];
      state.history.future = [];
    }
  }
});

// Actions
export const {
  setPreviewItem,
  updatePreviewItem,
  updatePreviewSlide,
  setPreviewSlides,
  setPreviewSlideIndex,
  nextPreviewSlide,
  previousPreviewSlide,
  setPreviewMode,
  markPreviewSaved,
  undoPreview,
  redoPreview,
  setGeneratingSlides,
  setPreviewError,
  clearPreview
} = previewSlice.actions;

// Selectors
export const selectPreview = (state: RootState) => state.preview;
export const selectCurrentPreviewItem = (state: RootState) => state.preview.currentItem;
export const selectCurrentPreviewSlide = (state: RootState) => {
  const { currentItem, currentSlideIndex } = state.preview;
  return currentItem?.slides?.[currentSlideIndex] || null;
};
export const selectPreviewSlideIndex = (state: RootState) => state.preview.currentSlideIndex;
export const selectPreviewMode = (state: RootState) => state.preview.mode;
export const selectIsPreviewDirty = (state: RootState) => state.preview.isDirty;
export const selectIsGeneratingSlides = (state: RootState) => state.preview.isGeneratingSlides;
export const selectPreviewError = (state: RootState) => state.preview.error;
export const selectCanUndo = (state: RootState) => state.preview.history.past.length > 0;
export const selectCanRedo = (state: RootState) => state.preview.history.future.length > 0;

export default previewSlice.reducer;
