import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

// ===== INTERFACES =====

export interface SlideContent {
  type: 'text' | 'title' | 'bullet' | 'image' | 'mixed';
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  textAlign: 'left' | 'center' | 'right';
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  fontWeight: 'normal' | 'bold';
  textColor: string;
  backgroundColor?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface Slide {
  id: string;
  presentationId?: string;
  templateId?: string;
  title?: string;
  content: string; // JSON string of SlideContent
  backgroundId?: string;
  order: number;
  duration?: number; // Auto-advance duration in seconds
  transition?: string; // Transition type
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Computed fields (not in database)
  parsedContent?: SlideContent;
  background?: Background;
  template?: Template;
}

export interface Presentation {
  id: string;
  title: string;
  description?: string;
  templateId?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  usageCount: number;
  
  // Relationships
  slides?: Slide[];
  template?: Template;
  totalSlides?: number;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isDefault: boolean;
  settings: string; // JSON settings for fonts, colors, layouts
  createdAt: string;
  updatedAt: string;
}

export interface Background {
  id: string;
  name: string;
  type: 'color' | 'gradient' | 'image' | 'video';
  settings: string; // JSON settings (color, gradient stops, media path, etc.)
  category?: string;
  isDefault: boolean;
  mediaItemId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PresentationFilters {
  category?: string;
  tags?: string[];
  template?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  usage?: 'recent' | 'frequent' | 'favorites';
}

export interface PresentationSearchParams {
  query?: string;
  filters?: PresentationFilters;
  limit?: number;
  offset?: number;
}

export interface SlideState {
  // Data Management
  presentations: Presentation[];
  currentPresentation: Presentation | null;
  slides: Slide[];
  currentSlide: Slide | null;
  slideIndex: number;
  
  // Templates & Backgrounds
  templates: Template[];
  backgrounds: Background[];
  currentTemplate: Template | null;
  selectedBackground: Background | null;
  
  // Search & Filtering
  searchQuery: string;
  searchResults: Presentation[];
  filters: PresentationFilters;
  categories: string[];
  
  // UI State
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Recent & Favorites
  recentPresentations: Presentation[];
  favoritePresentations: Presentation[];
  
  // Editing State
  editingSlide: Slide | null;
  editingPresentation: Presentation | null;
  slideEditor: {
    isOpen: boolean;
    mode: 'create' | 'edit';
    selectedTemplate: Template | null;
  };
  
  // Presentation State
  presentationPlayer: {
    isPlaying: boolean;
    autoAdvance: boolean;
    currentSlideIndex: number;
    totalSlides: number;
  };
}

// ===== ASYNC THUNKS =====

// Initialize slides system with defaults
export const initializeSlidesDefaults = createAsyncThunk(
  'slides/initializeSlidesDefaults',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Initializing slides system...');
      
      // Load recent presentations, templates, and backgrounds
      const [recentPresentations, templates, backgrounds, categories] = await Promise.all([
        window.electronAPI.invoke('db:getRecentPresentations', { limit: 10 }),
        window.electronAPI.invoke('db:getTemplates'),
        window.electronAPI.invoke('db:getBackgrounds'),
        window.electronAPI.invoke('db:getPresentationCategories')
      ]);
      
      return {
        recentPresentations: recentPresentations || [],
        templates: templates || [],
        backgrounds: backgrounds || [],
        categories: categories || []
      };
    } catch (error) {
      console.error('Failed to initialize slides system:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to initialize slides');
    }
  }
);

// Load presentations with search and filtering
export const loadPresentations = createAsyncThunk(
  'slides/loadPresentations',
  async (params: PresentationSearchParams = {}, { rejectWithValue }) => {
    try {
      console.log('Loading presentations with params:', params);
      
      const presentations = await window.electronAPI.invoke('db:loadPresentations', params);
      return presentations || [];
    } catch (error) {
      console.error('Failed to load presentations:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load presentations');
    }
  }
);

// Search presentations
export const searchPresentations = createAsyncThunk(
  'slides/searchPresentations',
  async (searchParams: PresentationSearchParams, { rejectWithValue }) => {
    try {
      console.log('Searching presentations:', searchParams);
      
      const results = await window.electronAPI.invoke('db:searchPresentations', searchParams);
      return results || [];
    } catch (error) {
      console.error('Failed to search presentations:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search presentations');
    }
  }
);

// Get single presentation with slides
export const getPresentation = createAsyncThunk(
  'slides/getPresentation',
  async (presentationId: string, { rejectWithValue }) => {
    try {
      console.log('Getting presentation:', presentationId);
      
      const presentation = await window.electronAPI.invoke('db:getPresentation', presentationId);
      if (!presentation) {
        throw new Error(`Presentation with ID ${presentationId} not found`);
      }
      
      return presentation;
    } catch (error) {
      console.error('Failed to get presentation:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to get presentation');
    }
  }
);

// Create new presentation
export const createPresentation = createAsyncThunk(
  'slides/createPresentation',
  async (presentationData: Partial<Presentation>, { rejectWithValue }) => {
    try {
      console.log('Creating new presentation:', presentationData);
      
      const newPresentation = await window.electronAPI.invoke('db:createPresentation', presentationData);
      return newPresentation;
    } catch (error) {
      console.error('Failed to create presentation:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create presentation');
    }
  }
);

// Update existing presentation
export const updatePresentation = createAsyncThunk(
  'slides/updatePresentation',
  async (presentation: Presentation, { rejectWithValue }) => {
    try {
      console.log('Updating presentation:', presentation);
      
      const updatedPresentation = await window.electronAPI.invoke('db:updatePresentation', presentation);
      return updatedPresentation;
    } catch (error) {
      console.error('Failed to update presentation:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update presentation');
    }
  }
);

// Delete presentation
export const deletePresentation = createAsyncThunk(
  'slides/deletePresentation',
  async (presentationId: string, { rejectWithValue }) => {
    try {
      console.log('Deleting presentation:', presentationId);
      
      await window.electronAPI.invoke('db:deletePresentation', presentationId);
      return presentationId;
    } catch (error) {
      console.error('Failed to delete presentation:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete presentation');
    }
  }
);

// Create new slide
export const createSlide = createAsyncThunk(
  'slides/createSlide',
  async (slideData: Partial<Slide>, { rejectWithValue }) => {
    try {
      console.log('Creating new slide:', slideData);
      
      const newSlide = await window.electronAPI.invoke('db:createSlide', slideData);
      return newSlide;
    } catch (error) {
      console.error('Failed to create slide:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create slide');
    }
  }
);

// Update existing slide
export const updateSlide = createAsyncThunk(
  'slides/updateSlide',
  async (slide: Slide, { rejectWithValue }) => {
    try {
      console.log('Updating slide:', slide);
      
      const updatedSlide = await window.electronAPI.invoke('db:updateSlide', slide);
      return updatedSlide;
    } catch (error) {
      console.error('Failed to update slide:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update slide');
    }
  }
);

// Delete slide
export const deleteSlide = createAsyncThunk(
  'slides/deleteSlide',
  async (slideId: string, { rejectWithValue }) => {
    try {
      console.log('Deleting slide:', slideId);
      
      await window.electronAPI.invoke('db:deleteSlide', slideId);
      return slideId;
    } catch (error) {
      console.error('Failed to delete slide:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete slide');
    }
  }
);

// Reorder slides in presentation
export const reorderSlides = createAsyncThunk(
  'slides/reorderSlides',
  async (params: { presentationId: string; slideOrders: { id: string; order: number }[] }, { rejectWithValue }) => {
    try {
      console.log('Reordering slides:', params);
      
      const reorderedSlides = await window.electronAPI.invoke('db:reorderSlides', params);
      return reorderedSlides;
    } catch (error) {
      console.error('Failed to reorder slides:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to reorder slides');
    }
  }
);

// Update presentation usage
export const updatePresentationUsage = createAsyncThunk(
  'slides/updatePresentationUsage',
  async (presentationId: string, { rejectWithValue }) => {
    try {
      console.log('Updating presentation usage:', presentationId);
      
      const updatedPresentation = await window.electronAPI.invoke('db:updatePresentationUsage', presentationId);
      return updatedPresentation;
    } catch (error) {
      console.error('Failed to update presentation usage:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update presentation usage');
    }
  }
);

// ===== UTILITY FUNCTIONS =====

// Parse slide content from JSON string
export const parseSlideContent = (contentJson: string): SlideContent => {
  try {
    return JSON.parse(contentJson);
  } catch (error) {
    console.warn('Failed to parse slide content, using default:', error);
    return {
      type: 'text',
      title: 'Untitled Slide',
      body: 'Click to edit content',
      textAlign: 'center',
      fontSize: 'large',
      fontWeight: 'normal',
      textColor: '#000000'
    };
  }
};

// ===== INITIAL STATE =====
const initialState: SlideState = {
  // Data Management
  presentations: [],
  currentPresentation: null,
  slides: [],
  currentSlide: null,
  slideIndex: 0,
  
  // Templates & Backgrounds
  templates: [],
  backgrounds: [],
  currentTemplate: null,
  selectedBackground: null,
  
  // Search & Filtering
  searchQuery: '',
  searchResults: [],
  filters: {},
  categories: [],
  
  // UI State
  loading: false,
  error: null,
  initialized: false,
  
  // Recent & Favorites
  recentPresentations: [],
  favoritePresentations: [],
  
  // Editing State
  editingSlide: null,
  editingPresentation: null,
  slideEditor: {
    isOpen: false,
    mode: 'create',
    selectedTemplate: null,
  },
  
  // Presentation State
  presentationPlayer: {
    isPlaying: false,
    autoAdvance: false,
    currentSlideIndex: 0,
    totalSlides: 0,
  },
};

// ===== SLICE =====
const slidesSlice = createSlice({
  name: 'slides',
  initialState,
  reducers: {
    // Search & Filtering Actions
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    setFilters: (state, action: PayloadAction<PresentationFilters>) => {
      state.filters = action.payload;
    },
    
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.filters = {};
    },
    
    // Presentation Selection Actions
    selectPresentation: (state, action: PayloadAction<Presentation>) => {
      state.currentPresentation = action.payload;
      state.slides = action.payload.slides || [];
      state.slideIndex = 0;
      state.currentSlide = (action.payload.slides && action.payload.slides[0]) || null;
      state.presentationPlayer.currentSlideIndex = 0;
      state.presentationPlayer.totalSlides = action.payload.slides?.length || 0;
    },
    
    clearPresentationSelection: (state) => {
      state.currentPresentation = null;
      state.slides = [];
      state.currentSlide = null;
      state.slideIndex = 0;
      state.presentationPlayer.currentSlideIndex = 0;
      state.presentationPlayer.totalSlides = 0;
    },
    
    // Slide Navigation Actions
    setSlideIndex: (state, action: PayloadAction<number>) => {
      const slideIndex = action.payload;
      if (slideIndex >= 0 && slideIndex < state.slides.length) {
        state.slideIndex = slideIndex;
        state.currentSlide = state.slides[slideIndex];
        state.presentationPlayer.currentSlideIndex = slideIndex;
      }
    },
    
    nextSlide: (state) => {
      if (state.slideIndex < state.slides.length - 1) {
        state.slideIndex += 1;
        state.currentSlide = state.slides[state.slideIndex];
        state.presentationPlayer.currentSlideIndex = state.slideIndex;
      }
    },
    
    previousSlide: (state) => {
      if (state.slideIndex > 0) {
        state.slideIndex -= 1;
        state.currentSlide = state.slides[state.slideIndex];
        state.presentationPlayer.currentSlideIndex = state.slideIndex;
      }
    },
    
    // Template & Background Actions
    selectTemplate: (state, action: PayloadAction<Template>) => {
      state.currentTemplate = action.payload;
      state.slideEditor.selectedTemplate = action.payload;
    },
    
    selectBackground: (state, action: PayloadAction<Background>) => {
      state.selectedBackground = action.payload;
    },
    
    setTemplates: (state, action: PayloadAction<Template[]>) => {
      state.templates = action.payload;
    },
    
    setBackgrounds: (state, action: PayloadAction<Background[]>) => {
      state.backgrounds = action.payload;
    },
    
    // Editing Actions
    openSlideEditor: (state, action: PayloadAction<{ mode: 'create' | 'edit'; slide?: Slide }>) => {
      state.slideEditor.isOpen = true;
      state.slideEditor.mode = action.payload.mode;
      state.editingSlide = action.payload.slide || null;
    },
    
    closeSlideEditor: (state) => {
      state.slideEditor.isOpen = false;
      state.slideEditor.mode = 'create';
      state.editingSlide = null;
      state.slideEditor.selectedTemplate = null;
    },
    
    setEditingPresentation: (state, action: PayloadAction<Presentation | null>) => {
      state.editingPresentation = action.payload;
    },
    
    // Presentation Player Actions
    startPresentationPlayer: (state) => {
      state.presentationPlayer.isPlaying = true;
    },
    
    stopPresentationPlayer: (state) => {
      state.presentationPlayer.isPlaying = false;
    },
    
    toggleAutoAdvance: (state) => {
      state.presentationPlayer.autoAdvance = !state.presentationPlayer.autoAdvance;
    },
    
    // Favorites Actions
    addToFavorites: (state, action: PayloadAction<string>) => {
      const presentationId = action.payload;
      const presentation = state.presentations.find(p => p.id === presentationId);
      if (presentation && !state.favoritePresentations.find(f => f.id === presentationId)) {
        state.favoritePresentations.push(presentation);
      }
    },
    
    removeFromFavorites: (state, action: PayloadAction<string>) => {
      state.favoritePresentations = state.favoritePresentations.filter(p => p.id !== action.payload);
    },
    
    // Category Actions
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload;
    },
    
    // Error Actions
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // Initialize Slides System
    builder
      .addCase(initializeSlidesDefaults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeSlidesDefaults.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.recentPresentations = action.payload.recentPresentations;
        state.templates = action.payload.templates;
        state.backgrounds = action.payload.backgrounds;
        state.categories = action.payload.categories;
      })
      .addCase(initializeSlidesDefaults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Load Presentations
    builder
      .addCase(loadPresentations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPresentations.fulfilled, (state, action) => {
        state.loading = false;
        state.presentations = action.payload;
      })
      .addCase(loadPresentations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Search Presentations
    builder
      .addCase(searchPresentations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPresentations.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchPresentations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Get Presentation
    builder
      .addCase(getPresentation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPresentation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPresentation = action.payload;
        state.slides = action.payload.slides || [];
        state.slideIndex = 0;
        state.currentSlide = (action.payload.slides && action.payload.slides[0]) || null;
        state.presentationPlayer.currentSlideIndex = 0;
        state.presentationPlayer.totalSlides = action.payload.slides?.length || 0;
      })
      .addCase(getPresentation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Create Presentation
    builder
      .addCase(createPresentation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPresentation.fulfilled, (state, action) => {
        state.loading = false;
        state.presentations.unshift(action.payload);
        state.currentPresentation = action.payload;
      })
      .addCase(createPresentation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Update Presentation
    builder
      .addCase(updatePresentation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePresentation.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.presentations.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.presentations[index] = action.payload;
        }
        if (state.currentPresentation?.id === action.payload.id) {
          state.currentPresentation = action.payload;
        }
      })
      .addCase(updatePresentation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Delete Presentation
    builder
      .addCase(deletePresentation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePresentation.fulfilled, (state, action) => {
        state.loading = false;
        const presentationId = action.payload;
        state.presentations = state.presentations.filter(p => p.id !== presentationId);
        state.recentPresentations = state.recentPresentations.filter(p => p.id !== presentationId);
        state.favoritePresentations = state.favoritePresentations.filter(p => p.id !== presentationId);
        if (state.currentPresentation?.id === presentationId) {
          state.currentPresentation = null;
          state.slides = [];
          state.currentSlide = null;
          state.slideIndex = 0;
          state.presentationPlayer.currentSlideIndex = 0;
          state.presentationPlayer.totalSlides = 0;
        }
      })
      .addCase(deletePresentation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Create Slide
    builder
      .addCase(createSlide.fulfilled, (state, action) => {
        const newSlide = action.payload;
        state.slides.push(newSlide);
        // Sort slides by order
        state.slides.sort((a, b) => a.order - b.order);
        // Update current presentation
        if (state.currentPresentation) {
          state.currentPresentation.slides = state.slides;
          state.currentPresentation.totalSlides = state.slides.length;
        }
        state.presentationPlayer.totalSlides = state.slides.length;
      });
    
    // Update Slide
    builder
      .addCase(updateSlide.fulfilled, (state, action) => {
        const updatedSlide = action.payload;
        const index = state.slides.findIndex(s => s.id === updatedSlide.id);
        if (index !== -1) {
          state.slides[index] = updatedSlide;
        }
        if (state.currentSlide?.id === updatedSlide.id) {
          state.currentSlide = updatedSlide;
        }
        // Update current presentation
        if (state.currentPresentation) {
          state.currentPresentation.slides = state.slides;
        }
      });
    
    // Delete Slide
    builder
      .addCase(deleteSlide.fulfilled, (state, action) => {
        const slideId = action.payload;
        state.slides = state.slides.filter(s => s.id !== slideId);
        // Reorder remaining slides
        state.slides = state.slides.map((slide, index) => ({ ...slide, order: index }));
        // Update current slide if necessary
        if (state.currentSlide?.id === slideId) {
          state.currentSlide = state.slides[state.slideIndex] || state.slides[0] || null;
          if (state.slideIndex >= state.slides.length && state.slides.length > 0) {
            state.slideIndex = state.slides.length - 1;
            state.currentSlide = state.slides[state.slideIndex];
          }
        }
        // Update current presentation
        if (state.currentPresentation) {
          state.currentPresentation.slides = state.slides;
          state.currentPresentation.totalSlides = state.slides.length;
        }
        state.presentationPlayer.totalSlides = state.slides.length;
        state.presentationPlayer.currentSlideIndex = Math.min(state.slideIndex, state.slides.length - 1);
      });
    
    // Reorder Slides
    builder
      .addCase(reorderSlides.fulfilled, (state, action) => {
        state.slides = action.payload;
        // Update current presentation
        if (state.currentPresentation) {
          state.currentPresentation.slides = state.slides;
        }
      });
    
    // Update Presentation Usage
    builder
      .addCase(updatePresentationUsage.fulfilled, (state, action) => {
        const updatedPresentation = action.payload;
        const index = state.presentations.findIndex(p => p.id === updatedPresentation.id);
        if (index !== -1) {
          state.presentations[index] = updatedPresentation;
        }
        
        // Update recent presentations
        const recentIndex = state.recentPresentations.findIndex(p => p.id === updatedPresentation.id);
        if (recentIndex !== -1) {
          state.recentPresentations.splice(recentIndex, 1);
        }
        state.recentPresentations.unshift(updatedPresentation);
        
        // Keep only top 10 recent presentations
        if (state.recentPresentations.length > 10) {
          state.recentPresentations = state.recentPresentations.slice(0, 10);
        }
      });
  },
});

// ===== ACTIONS =====
export const {
  setSearchQuery,
  setFilters,
  clearSearch,
  selectPresentation,
  clearPresentationSelection,
  setSlideIndex,
  nextSlide,
  previousSlide,
  selectTemplate,
  selectBackground,
  setTemplates,
  setBackgrounds,
  openSlideEditor,
  closeSlideEditor,
  setEditingPresentation,
  startPresentationPlayer,
  stopPresentationPlayer,
  toggleAutoAdvance,
  addToFavorites,
  removeFromFavorites,
  setCategories,
  clearError,
} = slidesSlice.actions;

// ===== SELECTORS =====
export const selectPresentations = (state: { slides: SlideState }) => state.slides.presentations;
export const selectCurrentPresentation = (state: { slides: SlideState }) => state.slides.currentPresentation;
export const selectSlides = (state: { slides: SlideState }) => state.slides.slides;
export const selectCurrentSlide = (state: { slides: SlideState }) => state.slides.currentSlide;
export const selectSlideIndex = (state: { slides: SlideState }) => state.slides.slideIndex;
export const selectTemplates = (state: { slides: SlideState }) => state.slides.templates;
export const selectBackgrounds = (state: { slides: SlideState }) => state.slides.backgrounds;
export const selectCurrentTemplate = (state: { slides: SlideState }) => state.slides.currentTemplate;
export const selectSelectedBackground = (state: { slides: SlideState }) => state.slides.selectedBackground;
export const selectSearchResults = (state: { slides: SlideState }) => state.slides.searchResults;
export const selectRecentPresentations = (state: { slides: SlideState }) => state.slides.recentPresentations;
export const selectFavoritePresentations = (state: { slides: SlideState }) => state.slides.favoritePresentations;
export const selectSlidesLoading = (state: { slides: SlideState }) => state.slides.loading;
export const selectSlidesError = (state: { slides: SlideState }) => state.slides.error;
export const selectSlidesInitialized = (state: { slides: SlideState }) => state.slides.initialized;
export const selectSlideEditor = (state: { slides: SlideState }) => state.slides.slideEditor;
export const selectPresentationPlayer = (state: { slides: SlideState }) => state.slides.presentationPlayer;

export default slidesSlice.reducer; 