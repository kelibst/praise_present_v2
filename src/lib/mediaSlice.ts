import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MediaItem } from '@prisma/client';
import { RootState } from './store';

export interface MediaState {
  items: MediaItem[];
  selectedItems: string[];
  filterType: 'all' | 'image' | 'video';
  filterCategory: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number | null;
}

const initialState: MediaState = {
  items: [],
  selectedItems: [],
  filterType: 'all',
  filterCategory: null,
  searchQuery: '',
  isLoading: false,
  error: null,
  uploadProgress: null,
};

// Async thunks for IPC communication

/**
 * Fetch media items from database
 */
export const fetchMediaItems = createAsyncThunk(
  'media/fetchItems',
  async (options: {
    type?: 'image' | 'video';
    category?: string;
    search?: string;
  } = {}) => {
    const result = await window.electronAPI?.invoke('media:list', options);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to fetch media items');
    }
    return result.data as MediaItem[];
  }
);

/**
 * Upload a new media item
 */
export const uploadMediaItem = createAsyncThunk(
  'media/upload',
  async (file: {
    filePath: string;
    type: 'image' | 'video';
    category?: string;
  }) => {
    const result = await window.electronAPI?.invoke('media:upload', file);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to upload media');
    }
    return result.data as MediaItem;
  }
);

/**
 * Delete media item(s)
 */
export const deleteMediaItems = createAsyncThunk(
  'media/delete',
  async (ids: string[]) => {
    const result = await window.electronAPI?.invoke('media:delete', { ids });
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to delete media');
    }
    return ids;
  }
);

/**
 * Update media item metadata
 */
export const updateMediaItem = createAsyncThunk(
  'media/update',
  async ({
    id,
    updates,
  }: {
    id: string;
    updates: {
      tags?: string[];
      category?: string;
      description?: string;
    };
  }) => {
    const result = await window.electronAPI?.invoke('media:update', {
      id,
      updates,
    });
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to update media');
    }
    return result.data as MediaItem;
  }
);

// Slice
const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    // Filter actions
    setFilterType: (state, action: PayloadAction<'all' | 'image' | 'video'>) => {
      state.filterType = action.payload;
    },

    setFilterCategory: (state, action: PayloadAction<string | null>) => {
      state.filterCategory = action.payload;
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    // Selection actions
    toggleSelectItem: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const index = state.selectedItems.indexOf(id);
      if (index > -1) {
        state.selectedItems.splice(index, 1);
      } else {
        state.selectedItems.push(id);
      }
    },

    selectAllItems: (state) => {
      state.selectedItems = state.items.map((item) => item.id);
    },

    clearSelection: (state) => {
      state.selectedItems = [];
    },

    // Upload progress
    setUploadProgress: (state, action: PayloadAction<number | null>) => {
      state.uploadProgress = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Fetch media items
    builder
      .addCase(fetchMediaItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMediaItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchMediaItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch media';
      });

    // Upload media item
    builder
      .addCase(uploadMediaItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadMediaItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.unshift(action.payload); // Add to beginning
        state.uploadProgress = null;
      })
      .addCase(uploadMediaItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to upload media';
        state.uploadProgress = null;
      });

    // Delete media items
    builder
      .addCase(deleteMediaItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteMediaItems.fulfilled, (state, action) => {
        state.isLoading = false;
        const deletedIds = action.payload;
        state.items = state.items.filter((item) => !deletedIds.includes(item.id));
        state.selectedItems = state.selectedItems.filter(
          (id) => !deletedIds.includes(id)
        );
      })
      .addCase(deleteMediaItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete media';
      });

    // Update media item
    builder
      .addCase(updateMediaItem.pending, (state) => {
        state.error = null;
      })
      .addCase(updateMediaItem.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.items.findIndex((item) => item.id === updated.id);
        if (index > -1) {
          state.items[index] = updated;
        }
      })
      .addCase(updateMediaItem.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update media';
      });
  },
});

// Actions
export const {
  setFilterType,
  setFilterCategory,
  setSearchQuery,
  toggleSelectItem,
  selectAllItems,
  clearSelection,
  setUploadProgress,
  clearError,
} = mediaSlice.actions;

// Selectors
export const selectMediaItems = (state: RootState) => state.media.items;
export const selectSelectedItems = (state: RootState) => state.media.selectedItems;
export const selectFilterType = (state: RootState) => state.media.filterType;
export const selectFilterCategory = (state: RootState) => state.media.filterCategory;
export const selectSearchQuery = (state: RootState) => state.media.searchQuery;
export const selectIsLoading = (state: RootState) => state.media.isLoading;
export const selectError = (state: RootState) => state.media.error;
export const selectUploadProgress = (state: RootState) => state.media.uploadProgress;

// Filtered items selector
export const selectFilteredMediaItems = (state: RootState) => {
  let filtered = state.media.items;

  // Filter by type
  if (state.media.filterType !== 'all') {
    filtered = filtered.filter((item) => item.type === state.media.filterType);
  }

  // Filter by category
  if (state.media.filterCategory) {
    filtered = filtered.filter(
      (item) => item.category === state.media.filterCategory
    );
  }

  // Filter by search query
  if (state.media.searchQuery) {
    const query = state.media.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.originalName.toLowerCase().includes(query) ||
        item.filename.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
    );
  }

  return filtered;
};

export default mediaSlice.reducer;
