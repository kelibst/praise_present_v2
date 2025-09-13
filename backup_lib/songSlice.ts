import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

// ===== INTERFACES =====
export interface SongSlide {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'tag';
  number?: number; // For verse1, verse2, etc.
  title: string; // "Verse 1", "Chorus", etc.
  content: string;
  chords?: string;
}

export interface SongStructure {
  slides: SongSlide[];
  order: string[]; // Array of slide IDs in presentation order
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  author?: string;
  lyrics: string;
  structure: SongStructure;
  chords?: string;
  ccliNumber?: string;
  key?: string;
  tempo?: string;
  tags: string[];
  category?: string;
  copyright?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  usageCount: number;
}

export interface SongFilters {
  category?: string;
  key?: string;
  tempo?: string;
  artist?: string;
  ccliNumber?: string;
  tags?: string[];
  usage?: 'recent' | 'frequent' | 'favorites';
}

export interface SongSearchParams {
  query?: string;
  filters?: SongFilters;
  limit?: number;
  offset?: number;
}

export interface SongState {
  // Data
  songs: Song[];
  currentSong: Song | null;
  selectedSongs: Song[];
  
  // Search & Filtering
  searchQuery: string;
  searchResults: Song[];
  filters: SongFilters;
  categories: string[];
  
  // Presentation State
  currentSlide: SongSlide | null;
  slideIndex: number;
  songStructure: SongStructure | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Recent & Favorites
  recentSongs: Song[];
  favoriteSongs: Song[];
  
  // Import State
  importing: boolean;
  importProgress: number;
  importError: string | null;
}

// ===== ASYNC THUNKS =====

// Initialize song system with defaults
export const initializeSongDefaults = createAsyncThunk(
  'songs/initializeSongDefaults',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Initializing song system...');
      
      // Load recent songs and favorites
      const [recentSongs, favoriteSongs, categories] = await Promise.all([
        window.electronAPI.invoke('db:getRecentSongs', { limit: 10 }),
        window.electronAPI.invoke('db:getFavoriteSongs', { limit: 20 }),
        window.electronAPI.invoke('db:getSongCategories')
      ]);
      
      return {
        recentSongs: recentSongs || [],
        favoriteSongs: favoriteSongs || [],
        categories: categories || []
      };
    } catch (error) {
      console.error('Failed to initialize song system:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to initialize songs');
    }
  }
);

// Load songs with search and filtering
export const loadSongs = createAsyncThunk(
  'songs/loadSongs',
  async (params: SongSearchParams = {}, { rejectWithValue }) => {
    try {
      console.log('Loading songs with params:', params);
      
      const songs = await window.electronAPI.invoke('db:loadSongs', params);
      return songs || [];
    } catch (error) {
      console.error('Failed to load songs:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load songs');
    }
  }
);

// Search songs
export const searchSongs = createAsyncThunk(
  'songs/searchSongs',
  async (searchParams: SongSearchParams, { rejectWithValue }) => {
    try {
      console.log('Searching songs:', searchParams);
      
      const results = await window.electronAPI.invoke('db:searchSongs', searchParams);
      return results || [];
    } catch (error) {
      console.error('Failed to search songs:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search songs');
    }
  }
);

// Get single song with full details
export const getSong = createAsyncThunk(
  'songs/getSong',
  async (songId: string, { rejectWithValue }) => {
    try {
      console.log('Getting song:', songId);
      
      const song = await window.electronAPI.invoke('db:getSong', songId);
      if (!song) {
        throw new Error('Song not found');
      }
      
      return song;
    } catch (error) {
      console.error('Failed to get song:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to get song');
    }
  }
);

// Create new song
export const createSong = createAsyncThunk(
  'songs/createSong',
  async (songData: Partial<Song>, { rejectWithValue }) => {
    try {
      console.log('Creating new song:', songData);
      
      const newSong = await window.electronAPI.invoke('db:createSong', songData);
      return newSong;
    } catch (error) {
      console.error('Failed to create song:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create song');
    }
  }
);

// Update existing song
export const updateSong = createAsyncThunk(
  'songs/updateSong',
  async (song: Song, { rejectWithValue }) => {
    try {
      console.log('Updating song:', song.id);
      
      const updatedSong = await window.electronAPI.invoke('db:updateSong', song);
      return updatedSong;
    } catch (error) {
      console.error('Failed to update song:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update song');
    }
  }
);

// Delete song
export const deleteSong = createAsyncThunk(
  'songs/deleteSong',
  async (songId: string, { rejectWithValue }) => {
    try {
      console.log('Deleting song:', songId);
      
      await window.electronAPI.invoke('db:deleteSong', songId);
      return songId;
    } catch (error) {
      console.error('Failed to delete song:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete song');
    }
  }
);

// Update song usage (track when song is used)
export const updateSongUsage = createAsyncThunk(
  'songs/updateSongUsage',
  async (songId: string, { rejectWithValue }) => {
    try {
      console.log('Updating song usage:', songId);
      
      const updatedSong = await window.electronAPI.invoke('db:updateSongUsage', songId);
      return updatedSong;
    } catch (error) {
      console.error('Failed to update song usage:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update song usage');
    }
  }
);

// Import songs
export const importSongs = createAsyncThunk(
  'songs/importSongs',
  async (importData: { songs: Partial<Song>[], format: string }, { rejectWithValue }) => {
    try {
      console.log('Importing songs:', importData);
      
      const result = await window.electronAPI.invoke('db:importSongs', importData);
      return result;
    } catch (error) {
      console.error('Failed to import songs:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to import songs');
    }
  }
);

// ===== INITIAL STATE =====
const initialState: SongState = {
  // Data
  songs: [],
  currentSong: null,
  selectedSongs: [],
  
  // Search & Filtering
  searchQuery: '',
  searchResults: [],
  filters: {},
  categories: [],
  
  // Presentation State
  currentSlide: null,
  slideIndex: 0,
  songStructure: null,
  
  // UI State
  loading: false,
  error: null,
  initialized: false,
  
  // Recent & Favorites
  recentSongs: [],
  favoriteSongs: [],
  
  // Import State
  importing: false,
  importProgress: 0,
  importError: null,
};

// ===== SLICE =====
const songSlice = createSlice({
  name: 'songs',
  initialState,
  reducers: {
    // Search & Filtering Actions
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    setFilters: (state, action: PayloadAction<SongFilters>) => {
      state.filters = action.payload;
    },
    
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.filters = {};
    },
    
    // Song Selection Actions
    selectSong: (state, action: PayloadAction<Song>) => {
      state.currentSong = action.payload;
      state.songStructure = action.payload.structure;
      state.slideIndex = 0;
      state.currentSlide = action.payload.structure.slides[0] || null;
    },
    
    clearSongSelection: (state) => {
      state.currentSong = null;
      state.songStructure = null;
      state.currentSlide = null;
      state.slideIndex = 0;
    },
    
    // Presentation Actions
    setSongSlide: (state, action: PayloadAction<number>) => {
      const slideIndex = action.payload;
      if (state.songStructure && slideIndex >= 0 && slideIndex < state.songStructure.slides.length) {
        state.slideIndex = slideIndex;
        state.currentSlide = state.songStructure.slides[slideIndex];
      }
    },
    
    nextSlide: (state) => {
      if (state.songStructure && state.slideIndex < state.songStructure.slides.length - 1) {
        state.slideIndex += 1;
        state.currentSlide = state.songStructure.slides[state.slideIndex];
      }
    },
    
    previousSlide: (state) => {
      if (state.slideIndex > 0) {
        state.slideIndex -= 1;
        state.currentSlide = state.songStructure?.slides[state.slideIndex] || null;
      }
    },
    
    // Favorites Actions
    addToFavorites: (state, action: PayloadAction<string>) => {
      const songId = action.payload;
      const song = state.songs.find(s => s.id === songId);
      if (song && !state.favoriteSongs.find(f => f.id === songId)) {
        state.favoriteSongs.push(song);
      }
    },
    
    removeFromFavorites: (state, action: PayloadAction<string>) => {
      state.favoriteSongs = state.favoriteSongs.filter(song => song.id !== action.payload);
    },
    
    // Category Actions
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload;
    },
    
    // Error Actions
    clearError: (state) => {
      state.error = null;
      state.importError = null;
    },
    
    // Import Actions
    setImportProgress: (state, action: PayloadAction<number>) => {
      state.importProgress = action.payload;
    },
    
    resetImportState: (state) => {
      state.importing = false;
      state.importProgress = 0;
      state.importError = null;
    },
  },
  
  extraReducers: (builder) => {
    // Initialize Songs
    builder
      .addCase(initializeSongDefaults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeSongDefaults.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.recentSongs = action.payload.recentSongs;
        state.favoriteSongs = action.payload.favoriteSongs;
        state.categories = action.payload.categories;
      })
      .addCase(initializeSongDefaults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Load Songs
    builder
      .addCase(loadSongs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSongs.fulfilled, (state, action) => {
        state.loading = false;
        state.songs = action.payload;
      })
      .addCase(loadSongs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Search Songs
    builder
      .addCase(searchSongs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchSongs.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchSongs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Get Song
    builder
      .addCase(getSong.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSong.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSong = action.payload;
        state.songStructure = action.payload.structure;
        state.slideIndex = 0;
        state.currentSlide = action.payload.structure.slides[0] || null;
      })
      .addCase(getSong.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Create Song
    builder
      .addCase(createSong.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSong.fulfilled, (state, action) => {
        state.loading = false;
        state.songs.push(action.payload);
        state.currentSong = action.payload;
      })
      .addCase(createSong.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Update Song
    builder
      .addCase(updateSong.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSong.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.songs.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.songs[index] = action.payload;
        }
        if (state.currentSong?.id === action.payload.id) {
          state.currentSong = action.payload;
        }
      })
      .addCase(updateSong.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Delete Song
    builder
      .addCase(deleteSong.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSong.fulfilled, (state, action) => {
        state.loading = false;
        const songId = action.payload;
        state.songs = state.songs.filter(s => s.id !== songId);
        state.recentSongs = state.recentSongs.filter(s => s.id !== songId);
        state.favoriteSongs = state.favoriteSongs.filter(s => s.id !== songId);
        if (state.currentSong?.id === songId) {
          state.currentSong = null;
          state.songStructure = null;
          state.currentSlide = null;
          state.slideIndex = 0;
        }
      })
      .addCase(deleteSong.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Update Song Usage
    builder
      .addCase(updateSongUsage.fulfilled, (state, action) => {
        const updatedSong = action.payload;
        const index = state.songs.findIndex(s => s.id === updatedSong.id);
        if (index !== -1) {
          state.songs[index] = updatedSong;
        }
        
        // Update recent songs
        const recentIndex = state.recentSongs.findIndex(s => s.id === updatedSong.id);
        if (recentIndex !== -1) {
          state.recentSongs.splice(recentIndex, 1);
        }
        state.recentSongs.unshift(updatedSong);
        
        // Keep only top 10 recent songs
        if (state.recentSongs.length > 10) {
          state.recentSongs = state.recentSongs.slice(0, 10);
        }
      });
    
    // Import Songs
    builder
      .addCase(importSongs.pending, (state) => {
        state.importing = true;
        state.importError = null;
        state.importProgress = 0;
      })
      .addCase(importSongs.fulfilled, (state, action) => {
        state.importing = false;
        state.importProgress = 100;
        // Add imported songs to the list
        state.songs.push(...action.payload.songs);
      })
      .addCase(importSongs.rejected, (state, action) => {
        state.importing = false;
        state.importError = action.payload as string;
        state.importProgress = 0;
      });
  },
});

// ===== ACTIONS =====
export const {
  setSearchQuery,
  setFilters,
  clearSearch,
  selectSong,
  clearSongSelection,
  setSongSlide,
  nextSlide,
  previousSlide,
  addToFavorites,
  removeFromFavorites,
  setCategories,
  clearError,
  setImportProgress,
  resetImportState,
} = songSlice.actions;

// ===== SELECTORS =====
export const selectSongs = (state: { songs: SongState }) => state.songs.songs;
export const selectCurrentSong = (state: { songs: SongState }) => state.songs.currentSong;
export const selectCurrentSlide = (state: { songs: SongState }) => state.songs.currentSlide;
export const selectSongStructure = (state: { songs: SongState }) => state.songs.songStructure;
export const selectSearchResults = (state: { songs: SongState }) => state.songs.searchResults;
export const selectRecentSongs = (state: { songs: SongState }) => state.songs.recentSongs;
export const selectFavoriteSongs = (state: { songs: SongState }) => state.songs.favoriteSongs;
export const selectSongCategories = (state: { songs: SongState }) => state.songs.categories;
export const selectSongLoading = (state: { songs: SongState }) => state.songs.loading;
export const selectSongError = (state: { songs: SongState }) => state.songs.error;
export const selectSongInitialized = (state: { songs: SongState }) => state.songs.initialized;

export default songSlice.reducer; 