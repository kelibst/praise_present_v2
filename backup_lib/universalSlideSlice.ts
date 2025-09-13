import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

// ===== UNIVERSAL SLIDE INTERFACES =====

// Base slide interface that all content types will implement
export interface UniversalSlide {
  id: string;
  type: 'scripture' | 'song' | 'media' | 'note' | 'announcement' | 'custom';
  title: string;
  subtitle?: string;
  content: any; // Type-specific content
  template: SlideTemplate;
  background: SlideBackground;
  textFormatting: TextFormatting;
  metadata: SlideMetadata;
  transitions: SlideTransitions;
  timing?: SlideTiming;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Enhanced Slide template system
export interface SlideTemplate {
  id: string;
  name: string;
  category: 'title' | 'content' | 'verse' | 'song' | 'media' | 'text-heavy' | 'title-focus' | 'balanced' | 'minimal' | 'custom';
  description?: string;
  textZones: TextZone[];
  mediaZones: MediaZone[];
  globalConstraints: {
    maxTextElements: number;
    preserveAspectRatio: boolean;
    responsiveScaling: boolean;
    minFontSize: number;
    maxFontSize: number;
  };
  layout: {
    type: 'fixed' | 'flexible' | 'grid';
    backgroundOpacity: number;
    padding: { top: number; right: number; bottom: number; left: number; };
    margins: { top: number; right: number; bottom: number; left: number; };
    safeArea: Rectangle; // Area guaranteed to be visible on all displays
  };
  defaultFormatting: TextFormatting;
  metadata: {
    version: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    isBuiltIn: boolean;
    usage: number;
  };
}

export interface TextZone {
  id: string;
  name: string;
  bounds: Rectangle;
  defaultFormatting: TextFormatting;
  contentRules: {
    maxCharacters?: number;
    maxLines?: number;
    allowedTypes: TextElement['type'][];
    requireContent: boolean;
  };
  autoResize: {
    enabled: boolean;
    strategy: 'font-size' | 'bounds' | 'both';
    minSize: number;
    maxSize: number;
    maintainAspectRatio: boolean;
  };
  overflow: {
    behavior: 'clip' | 'wrap' | 'scroll' | 'scale-down';
    showEllipsis: boolean;
  };
  priority: number; // For layout resolution conflicts
}

export interface MediaZone {
  id: string;
  name: string;
  bounds: Rectangle;
  aspectRatioConstraints: {
    enforce: boolean;
    ratio: number; // width/height
    fit: 'contain' | 'cover' | 'fill' | 'scale-down';
  };
  alignment: {
    horizontal: 'left' | 'center' | 'right';
    vertical: 'top' | 'middle' | 'bottom';
  };
  overlay: {
    allowText: boolean;
    textZones: TextZone[];
    blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
  };
  supportedTypes: ('image' | 'video' | 'audio')[];
  priority: number;
}

// Background system
export interface SlideBackground {
  type: 'solid' | 'gradient' | 'image' | 'video';
  colors?: string[];
  imageUrl?: string;
  videoUrl?: string;
  opacity: number;
  overlay?: {
    color: string;
    opacity: number;
  };
}

// Enhanced Text formatting
export interface TextFormatting {
  font: {
    family: string;
    size: number;
    weight: 'normal' | 'bold' | 'light' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    style: 'normal' | 'italic' | 'oblique';
    color: string;
    strokeColor?: string;
    strokeWidth?: number;
  };
  spacing: {
    letterSpacing: number;
    lineHeight: number;
    paragraphSpacing: number;
    wordSpacing?: number;
  };
  effects: {
    shadow?: { x: number; y: number; blur: number; spread: number; color: string; };
    textShadow?: string; // CSS text-shadow property
    animations?: {
      entrance?: 'fade' | 'slideIn' | 'typewriter' | 'bounce' | 'none';
      emphasis?: 'pulse' | 'glow' | 'shake' | 'none';
      duration?: number;
      delay?: number;
    };
    transform?: {
      rotation?: number;
      scale?: number;
      skewX?: number;
      skewY?: number;
    };
  };
  alignment: {
    horizontal: 'left' | 'center' | 'right' | 'justify';
    vertical: 'top' | 'middle' | 'bottom';
  };
}

// Rich Text Content System
export interface RichTextContent {
  elements: TextElement[];
  formatRules: FormatRule[];
  positioning: ContentPositioning;
  metadata: {
    version: string;
    lastModified: string;
    wordCount: number;
    estimatedReadTime: number; // in seconds
  };
}

export interface TextElement {
  id: string;
  type: 'text' | 'heading' | 'emphasis' | 'verse' | 'chorus' | 'bridge';
  content: string;
  formatting: TextFormatting;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    zIndex: number;
  };
  alignment: {
    horizontal: 'left' | 'center' | 'right' | 'justify';
    vertical: 'top' | 'middle' | 'bottom';
  };
  constraints?: {
    minFontSize?: number;
    maxFontSize?: number;
    autoResize: boolean;
    preserveAspectRatio: boolean;
  };
}

export interface FormatRule {
  id: string;
  selector: string; // CSS-like selector for targeting elements
  priority: number;
  formatting: Partial<TextFormatting>;
  conditions?: {
    contentLength?: { min?: number; max?: number; };
    slideType?: string[];
    templateCategory?: string[];
  };
}

export interface ContentPositioning {
  containerBounds: Rectangle;
  contentFlow: 'vertical' | 'horizontal' | 'grid';
  spacing: {
    between: number;
    padding: { top: number; right: number; bottom: number; left: number; };
    margin: { top: number; right: number; bottom: number; left: number; };
  };
  overflow: 'visible' | 'hidden' | 'scroll' | 'auto-scale';
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Slide metadata
export interface SlideMetadata {
  source?: string; // For scripture: "John 3:16 KJV", for songs: "Amazing Grace"
  duration?: number; // Auto-advance timing
  usageCount: number;
  lastUsed?: string;
  tags: string[];
  category?: string;
  copyright?: string;
}

// Transition effects
export interface SlideTransitions {
  enter: 'fade' | 'slide-right' | 'slide-left' | 'slide-up' | 'slide-down' | 'zoom' | 'none';
  exit: 'fade' | 'slide-right' | 'slide-left' | 'slide-up' | 'slide-down' | 'zoom' | 'none';
  duration: number; // milliseconds
}

// Auto-timing for slides
export interface SlideTiming {
  autoAdvance: boolean;
  duration: number; // seconds
  pauseOnInteraction: boolean;
}

// Type-specific content interfaces
export interface ScriptureSlideContent {
  verses: Array<{
    book: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  reference: string;
  version: string;
  translation: string;
}

export interface SongSlideContent {
  songId: string;
  slideId: string;
  slideType: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'tag';
  slideNumber?: number | string;
  lyrics: string;
  chords?: string;
  key?: string;
  tempo?: number;
  ccliNumber?: string;
}

export interface MediaSlideContent {
  mediaType: 'image' | 'video' | 'audio';
  mediaUrl: string;
  duration?: number;
  autoPlay: boolean;
  loop: boolean;
  volume?: number;
  overlayText?: string;
}

export interface NoteSlideContent {
  text: string;
  bulletPoints?: string[];
  richText?: boolean;
  speakerNotes?: string;
}

export interface AnnouncementSlideContent {
  title: string;
  message: string;
  startDate?: string;
  endDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  contactInfo?: string;
}

// Presentation/Service collection
export interface SlideCollection {
  id: string;
  name: string;
  description?: string;
  slides: UniversalSlide[];
  currentSlideIndex: number;
  autoAdvance: boolean;
  loop: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: {
    serviceDate?: string;
    serviceType?: string;
    theme?: string;
    tags: string[];
  };
}

// Player state for presentations
export interface SlidePlayer {
  currentCollection: SlideCollection | null;
  currentSlide: UniversalSlide | null;
  currentSlideIndex: number;
  totalSlides: number;
  isPlaying: boolean;
  isPaused: boolean;
  autoAdvance: boolean;
  timeRemaining?: number;
  history: string[]; // Slide IDs of previously shown slides
}

// Search and filtering
export interface SlideFilters {
  type?: ('scripture' | 'song' | 'media' | 'note' | 'announcement' | 'custom')[];
  tags?: string[];
  dateRange?: { start: string; end: string; };
  usage?: 'frequent' | 'recent' | 'never' | 'all';
  source?: string;
}

// ===== STATE INTERFACE =====
export interface UniversalSlideState {
  // All slides
  slides: UniversalSlide[];
  
  // Collections (services, presentations)
  collections: SlideCollection[];
  currentCollection: SlideCollection | null;
  
  // Player state
  player: SlidePlayer;
  
  // Preview and Live
  previewSlide: UniversalSlide | null;
  liveSlide: UniversalSlide | null;
  
  // Templates and Backgrounds
  templates: SlideTemplate[];
  backgrounds: SlideBackground[];
  
  // Search and filtering
  searchQuery: string;
  searchResults: UniversalSlide[];
  filters: SlideFilters;
  
  // UI state
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Editor state
  editingSlide: UniversalSlide | null;
  editingCollection: SlideCollection | null;
  
  // Recent and favorites
  recentSlides: UniversalSlide[];
  favoriteSlides: UniversalSlide[];
}

// ===== ASYNC THUNKS =====

// Load all slides with filtering
export const loadUniversalSlides = createAsyncThunk(
  'universalSlides/loadSlides',
  async (params: { filters?: SlideFilters; limit?: number; offset?: number }) => {
    // This will interface with the database
    const result = await window.electronAPI?.invoke('db:loadUniversalSlides', params);
    return result;
  }
);

// Load slide collections
export const loadSlideCollections = createAsyncThunk(
  'universalSlides/loadCollections',
  async () => {
    const result = await window.electronAPI?.invoke('db:loadSlideCollections');
    return result;
  }
);

// Create universal slide
export const createUniversalSlide = createAsyncThunk(
  'universalSlides/createSlide',
  async (slide: Omit<UniversalSlide, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await window.electronAPI?.invoke('db:createUniversalSlide', slide);
    return result;
  }
);

// Update universal slide
export const updateUniversalSlide = createAsyncThunk(
  'universalSlides/updateSlide',
  async (slide: UniversalSlide) => {
    const result = await window.electronAPI?.invoke('db:updateUniversalSlide', slide);
    return result;
  }
);

// Delete universal slide
export const deleteUniversalSlide = createAsyncThunk(
  'universalSlides/deleteSlide',
  async (slideId: string) => {
    await window.electronAPI?.invoke('db:deleteUniversalSlide', slideId);
    return slideId;
  }
);

// Search slides
export const searchUniversalSlides = createAsyncThunk(
  'universalSlides/searchSlides',
  async (params: { query: string; filters?: SlideFilters; limit?: number }) => {
    const result = await window.electronAPI?.invoke('db:searchUniversalSlides', params);
    return result;
  }
);

// Send slide to live display
export const sendSlideToLive = createAsyncThunk(
  'universalSlides/sendToLive',
  async (slide: UniversalSlide) => {
    await window.electronAPI?.invoke('display:sendSlideToLive', slide);
    return slide;
  }
);

// ===== INITIAL STATE =====
const initialState: UniversalSlideState = {
  slides: [],
  collections: [],
  currentCollection: null,
  
  player: {
    currentCollection: null,
    currentSlide: null,
    currentSlideIndex: 0,
    totalSlides: 0,
    isPlaying: false,
    isPaused: false,
    autoAdvance: false,
    history: [],
  },
  
  previewSlide: null,
  liveSlide: null,
  
  templates: [],
  backgrounds: [],
  
  searchQuery: '',
  searchResults: [],
  filters: {},
  
  loading: false,
  error: null,
  initialized: false,
  
  editingSlide: null,
  editingCollection: null,
  
  recentSlides: [],
  favoriteSlides: [],
};

// ===== SLICE =====
const universalSlideSlice = createSlice({
  name: 'universalSlides',
  initialState,
  reducers: {
    // Player controls
    playSlideshow: (state) => {
      state.player.isPlaying = true;
      state.player.isPaused = false;
    },
    
    pauseSlideshow: (state) => {
      state.player.isPlaying = false;
      state.player.isPaused = true;
    },
    
    stopSlideshow: (state) => {
      state.player.isPlaying = false;
      state.player.isPaused = false;
      state.player.currentSlideIndex = 0;
      if (state.player.currentCollection) {
        state.player.currentSlide = state.player.currentCollection.slides[0] || null;
      }
    },
    
    nextSlide: (state) => {
      if (state.player.currentCollection && state.player.currentSlideIndex < state.player.totalSlides - 1) {
        state.player.currentSlideIndex += 1;
        state.player.currentSlide = state.player.currentCollection.slides[state.player.currentSlideIndex];
        
        // Add to history
        if (state.player.currentSlide) {
          state.player.history.push(state.player.currentSlide.id);
        }
      }
    },
    
    previousSlide: (state) => {
      if (state.player.currentSlideIndex > 0) {
        state.player.currentSlideIndex -= 1;
        if (state.player.currentCollection) {
          state.player.currentSlide = state.player.currentCollection.slides[state.player.currentSlideIndex];
        }
      }
    },
    
    jumpToSlide: (state, action: PayloadAction<number>) => {
      const slideIndex = action.payload;
      if (state.player.currentCollection && slideIndex >= 0 && slideIndex < state.player.totalSlides) {
        state.player.currentSlideIndex = slideIndex;
        state.player.currentSlide = state.player.currentCollection.slides[slideIndex];
        
        // Add to history
        if (state.player.currentSlide) {
          state.player.history.push(state.player.currentSlide.id);
        }
      }
    },
    
    setAutoAdvance: (state, action: PayloadAction<boolean>) => {
      state.player.autoAdvance = action.payload;
      if (state.player.currentCollection) {
        state.player.currentCollection.autoAdvance = action.payload;
      }
    },
    
    // Preview and Live controls
    setPreviewSlide: (state, action: PayloadAction<UniversalSlide | null>) => {
      state.previewSlide = action.payload;
    },
    
    sendPreviewToLive: (state) => {
      if (state.previewSlide) {
        state.liveSlide = state.previewSlide;
      }
    },
    
    clearPreview: (state) => {
      state.previewSlide = null;
    },
    
    clearLive: (state) => {
      state.liveSlide = null;
    },
    
    // Collection management
    selectCollection: (state, action: PayloadAction<SlideCollection>) => {
      const collection = action.payload;
      state.currentCollection = collection;
      state.player.currentCollection = collection;
      state.player.totalSlides = collection.slides.length;
      state.player.currentSlideIndex = 0;
      state.player.currentSlide = collection.slides[0] || null;
      state.player.history = [];
    },
    
    // Search and filters
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    setFilters: (state, action: PayloadAction<SlideFilters>) => {
      state.filters = action.payload;
    },
    
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.filters = {};
    },
    
    // Editor state
    setEditingSlide: (state, action: PayloadAction<UniversalSlide | null>) => {
      state.editingSlide = action.payload;
    },
    
    setEditingCollection: (state, action: PayloadAction<SlideCollection | null>) => {
      state.editingCollection = action.payload;
    },
    
    // Favorites
    addToFavorites: (state, action: PayloadAction<string>) => {
      const slideId = action.payload;
      const slide = state.slides.find(s => s.id === slideId);
      if (slide && !state.favoriteSlides.find(f => f.id === slideId)) {
        state.favoriteSlides.push(slide);
      }
    },
    
    removeFromFavorites: (state, action: PayloadAction<string>) => {
      const slideId = action.payload;
      state.favoriteSlides = state.favoriteSlides.filter(s => s.id !== slideId);
    },
    
    // Error handling
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // Load slides
    builder
      .addCase(loadUniversalSlides.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUniversalSlides.fulfilled, (state, action) => {
        state.loading = false;
        state.slides = action.payload.slides || [];
        state.initialized = true;
      })
      .addCase(loadUniversalSlides.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load slides';
      });
    
    // Load collections
    builder
      .addCase(loadSlideCollections.fulfilled, (state, action) => {
        state.collections = action.payload || [];
      });
    
    // Create slide
    builder
      .addCase(createUniversalSlide.fulfilled, (state, action) => {
        state.slides.push(action.payload);
      });
    
    // Update slide
    builder
      .addCase(updateUniversalSlide.fulfilled, (state, action) => {
        const index = state.slides.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.slides[index] = action.payload;
        }
      });
    
    // Delete slide
    builder
      .addCase(deleteUniversalSlide.fulfilled, (state, action) => {
        const slideId = action.payload;
        state.slides = state.slides.filter(s => s.id !== slideId);
        state.recentSlides = state.recentSlides.filter(s => s.id !== slideId);
        state.favoriteSlides = state.favoriteSlides.filter(s => s.id !== slideId);
      });
    
    // Search slides
    builder
      .addCase(searchUniversalSlides.fulfilled, (state, action) => {
        state.searchResults = action.payload.slides || [];
      });
    
    // Send to live
    builder
      .addCase(sendSlideToLive.fulfilled, (state, action) => {
        state.liveSlide = action.payload;
        
        // Update usage stats
        const slide = state.slides.find(s => s.id === action.payload.id);
        if (slide) {
          slide.metadata.usageCount += 1;
          slide.metadata.lastUsed = new Date().toISOString();
          
          // Update recent slides
          const recentIndex = state.recentSlides.findIndex(s => s.id === slide.id);
          if (recentIndex !== -1) {
            state.recentSlides.splice(recentIndex, 1);
          }
          state.recentSlides.unshift(slide);
          
          // Keep only top 20 recent slides
          if (state.recentSlides.length > 20) {
            state.recentSlides = state.recentSlides.slice(0, 20);
          }
        }
      });
  },
});

// ===== ACTIONS =====
export const {
  playSlideshow,
  pauseSlideshow,
  stopSlideshow,
  nextSlide,
  previousSlide,
  jumpToSlide,
  setAutoAdvance,
  setPreviewSlide,
  sendPreviewToLive,
  clearPreview,
  clearLive,
  selectCollection,
  setSearchQuery,
  setFilters,
  clearSearch,
  setEditingSlide,
  setEditingCollection,
  addToFavorites,
  removeFromFavorites,
  clearError,
} = universalSlideSlice.actions;

// ===== SELECTORS =====
export const selectAllSlides = (state: { universalSlides: UniversalSlideState }) => 
  state.universalSlides.slides;

export const selectSlidesByType = (type: UniversalSlide['type']) => 
  (state: { universalSlides: UniversalSlideState }) => 
    state.universalSlides.slides.filter(slide => slide.type === type);

export const selectCurrentCollection = (state: { universalSlides: UniversalSlideState }) => 
  state.universalSlides.currentCollection;

export const selectPlayer = (state: { universalSlides: UniversalSlideState }) => 
  state.universalSlides.player;

export const selectCurrentSlide = (state: { universalSlides: UniversalSlideState }) => 
  state.universalSlides.player.currentSlide;

export const selectPreviewSlide = (state: { universalSlides: UniversalSlideState }) => 
  state.universalSlides.previewSlide;

export const selectLiveSlide = (state: { universalSlides: UniversalSlideState }) => 
  state.universalSlides.liveSlide;

export const selectSearchResults = (state: { universalSlides: UniversalSlideState }) => 
  state.universalSlides.searchResults;

export const selectRecentSlides = (state: { universalSlides: UniversalSlideState }) => 
  state.universalSlides.recentSlides;

export const selectFavoriteSlides = (state: { universalSlides: UniversalSlideState }) => 
  state.universalSlides.favoriteSlides;

export const selectIsLoading = (state: { universalSlides: UniversalSlideState }) => 
  state.universalSlides.loading;

export const selectError = (state: { universalSlides: UniversalSlideState }) => 
  state.universalSlides.error;

export default universalSlideSlice.reducer; 