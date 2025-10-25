/**
 * Unified Presentation System
 *
 * Content-type agnostic architecture for presenting any content (scripture, songs, announcements, etc.)
 * This eliminates the need for separate state management for each content type.
 */

// ============================================
// CORE TYPES
// ============================================

/**
 * All supported content types
 * Add new types here as features are added
 */
export type ContentType =
  | 'scripture'
  | 'song'
  | 'announcement'
  | 'sermon'
  | 'video'
  | 'media'
  | 'plan-item';

/**
 * Slide interface (common to all content types)
 */
export interface Slide {
  id: string;
  shapes?: any[];
  background?: {
    type: 'color' | 'image' | 'gradient';
    value: string;
  };
  verseNumbers?: number[];  // For scripture slides
  [key: string]: any;  // Extensible for content-specific properties
}

/**
 * Unified content item that works for ALL content types
 * This is the core abstraction that makes the system extensible
 */
export interface PresentationItem {
  id: string;
  type: ContentType;
  title: string;
  content: any;  // Type-specific data (scripture verses, song lyrics, announcement text, etc.)
  slides: Slide[];  // Every content type must generate slides
  metadata?: {
    // Scripture-specific
    reference?: string;      // "John 3:16-17"
    book?: string;
    chapter?: number;
    verses?: number[];

    // Song-specific
    author?: string;
    artist?: string;
    key?: string;
    tempo?: string;
    copyright?: string;
    ccliNumber?: string;

    // Media-specific
    duration?: number;
    fileType?: string;

    // Common
    tags?: string[];
    notes?: string;
    createdAt?: string;
    updatedAt?: string;

    // Extensible for future content types
    [key: string]: any;
  };
}

/**
 * Active presentation state - SINGLE SOURCE OF TRUTH
 * This is what drives the middle panel (preview/editor)
 */
export interface PresentationState {
  activeItem: PresentationItem | null;  // Currently selected item
  currentSlideIndex: number;             // Current slide in the active item
  isLive: boolean;                       // Is it being presented on live display?
  mode: 'preview' | 'edit' | 'live';    // Presentation mode
}

/**
 * Content library - all available content organized by type
 * This is what populates the left panel content browsers
 */
export interface ContentLibrary {
  scriptures: PresentationItem[];
  songs: PresentationItem[];
  announcements: PresentationItem[];
  media: PresentationItem[];
  currentService: PresentationItem[];  // Items added to current service
  // Future: sermons, videos, etc. - just add properties here
}

/**
 * Tab identifiers
 */
export type ActiveTab =
  | 'scripture'
  | 'songs'
  | 'announcements'
  | 'media'
  | 'plan'      // Current service
  | 'plans';    // Plan manager

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Helper to convert legacy ServiceItem to PresentationItem
 */
export interface ServiceItem {
  id: string;
  type: ContentType;
  title: string;
  content: any;
  slides?: Slide[];
  [key: string]: any;
}

/**
 * Presentation actions for state updates
 */
export type PresentationAction =
  | { type: 'SELECT_ITEM'; item: PresentationItem }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_SLIDE_INDEX'; index: number }
  | { type: 'NEXT_SLIDE' }
  | { type: 'PREVIOUS_SLIDE' }
  | { type: 'GO_LIVE' }
  | { type: 'STOP_LIVE' }
  | { type: 'SET_MODE'; mode: 'preview' | 'edit' | 'live' };

// ============================================
// INITIAL STATES
// ============================================

export const INITIAL_PRESENTATION_STATE: PresentationState = {
  activeItem: null,
  currentSlideIndex: 0,
  isLive: false,
  mode: 'preview'
};

export const INITIAL_CONTENT_LIBRARY: ContentLibrary = {
  scriptures: [],
  songs: [],
  announcements: [],
  media: [],
  currentService: []
};
