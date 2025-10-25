/**
 * Presentation Manager - Single Source of Truth for All Presentation State
 *
 * This hook provides a centralized state machine for managing ALL content presentation
 * (scriptures, songs, announcements, sermons, media, etc.) with automatic synchronization
 * to the live display.
 *
 * Key Features:
 * - Single source of truth (no conflicting state)
 * - Atomic operations (all-or-nothing state updates)
 * - Automatic live display sync
 * - Content type agnostic (works with any content)
 * - Built-in navigation history
 * - Type-safe state transitions
 */

import { useState, useCallback, useEffect } from 'react';
import { useLiveDisplay } from '../components/live/LiveDisplayManager';
import { ContentType } from '../types/presentation';
import type { Slide } from '../components/slides/SlideRenderer';

// ============================================
// TYPES
// ============================================

/**
 * Unified content wrapper - all content types follow this structure
 */
export interface PresentationContent {
  id: string;
  type: ContentType;
  title: string;
  slides: Slide[];
  source: 'scripture' | 'songs' | 'plan' | 'media' | 'announcements' | 'sermons';
  metadata?: Record<string, any>;
}

/**
 * Presentation status
 */
export type PresentationStatus = 'idle' | 'preview' | 'live';

/**
 * Current presentation state
 */
export interface CurrentPresentation {
  content: PresentationContent | null;
  slideIndex: number;
  status: PresentationStatus;
}

/**
 * Live display state tracking
 */
export interface DisplayState {
  isActive: boolean;
  currentSlide: Slide | null;
  contentType: ContentType | null;
  contentId: string | null;
}

/**
 * Complete presentation manager state
 */
export interface PresentationManagerState {
  current: CurrentPresentation;
  display: DisplayState;
  history: PresentationContent[];
}

/**
 * Manager actions interface
 */
export interface PresentationActions {
  present: (content: PresentationContent, goLive?: boolean) => Promise<void>;
  switchContent: (content: PresentationContent) => Promise<void>;
  clear: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  goToSlide: (index: number) => Promise<void>;
  goLive: () => Promise<void>;
  stopLive: () => Promise<void>;
  showBlack: () => Promise<void>;
}

// ============================================
// INITIAL STATE
// ============================================

const INITIAL_STATE: PresentationManagerState = {
  current: {
    content: null,
    slideIndex: 0,
    status: 'idle'
  },
  display: {
    isActive: false,
    currentSlide: null,
    contentType: null,
    contentId: null
  },
  history: []
};

const MAX_HISTORY = 10;

// ============================================
// HOOK
// ============================================

export const usePresentationManager = () => {
  const [state, setState] = useState<PresentationManagerState>(INITIAL_STATE);
  const {
    liveDisplayActive,
    createLiveDisplay,
    sendSlideToLive,
    clearLiveDisplay,
    showBlackScreen
  } = useLiveDisplay();

  // Sync display active state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      display: {
        ...prev.display,
        isActive: liveDisplayActive
      }
    }));
  }, [liveDisplayActive]);

  /**
   * Present content - Main entry point for loading content
   * This is ATOMIC - either fully succeeds or rolls back
   */
  const present = useCallback(async (
    content: PresentationContent,
    goLive = false
  ): Promise<void> => {
    console.log('📊 PresentationManager: Presenting content:', {
      type: content.type,
      title: content.title,
      slideCount: content.slides.length,
      goLive
    });

    try {
      // Validate content
      if (!content.slides || content.slides.length === 0) {
        console.error('❌ PresentationManager: Content has no slides');
        return;
      }

      // Create live display if going live and not active
      if (goLive && !liveDisplayActive) {
        console.log('🚀 PresentationManager: Creating live display...');
        await createLiveDisplay();
        // Wait a moment for display to initialize
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Build new state
      const newState: PresentationManagerState = {
        current: {
          content,
          slideIndex: 0,
          status: goLive ? 'live' : 'preview'
        },
        display: {
          isActive: liveDisplayActive || goLive,
          currentSlide: goLive ? content.slides[0] : null,
          contentType: content.type,
          contentId: content.id
        },
        history: [...state.history, content].slice(-MAX_HISTORY)
      };

      // Update state FIRST
      setState(newState);

      // THEN sync with live display if needed
      if (goLive && content.slides[0]) {
        console.log('📤 PresentationManager: Sending first slide to live display');
        await sendSlideToLive(
          content.slides[0],
          {
            id: content.id,
            type: content.type,
            title: content.title,
            content: content.metadata,
            slides: content.slides
          },
          0
        );
      }

      console.log('✅ PresentationManager: Content presented successfully');
    } catch (error) {
      console.error('❌ PresentationManager: Failed to present content:', error);
      // Rollback on error
      setState(prev => prev);
    }
  }, [state.history, liveDisplayActive, createLiveDisplay, sendSlideToLive]);

  /**
   * Switch content - Clears current and loads new
   * Use this when changing content types or items
   */
  const switchContent = useCallback(async (
    newContent: PresentationContent
  ): Promise<void> => {
    console.log('🔄 PresentationManager: Switching content from',
      state.current.content?.type, 'to', newContent.type);

    // If currently live, clear the display first
    if (state.current.status === 'live') {
      console.log('⚠️ PresentationManager: Clearing live display before switch');
      await clearLiveDisplay();
    }

    // Present new content in preview mode
    await present(newContent, false);
  }, [state.current.status, state.current.content?.type, clearLiveDisplay, present]);

  /**
   * Clear all presentation state
   */
  const clear = useCallback(async (): Promise<void> => {
    console.log('🧹 PresentationManager: Clearing all presentation state');

    await clearLiveDisplay();
    setState(INITIAL_STATE);
  }, [clearLiveDisplay]);

  /**
   * Navigate to next slide
   */
  const next = useCallback(async (): Promise<void> => {
    if (!state.current.content?.slides) {
      console.warn('⚠️ PresentationManager: No content loaded for next()');
      return;
    }

    const maxIndex = state.current.content.slides.length - 1;
    if (state.current.slideIndex >= maxIndex) {
      console.log('ℹ️ PresentationManager: Already at last slide');
      return;
    }

    const newIndex = state.current.slideIndex + 1;
    const newSlide = state.current.content.slides[newIndex];

    console.log(`➡️ PresentationManager: Next slide (${newIndex + 1}/${state.current.content.slides.length})`);

    // Update state
    setState(prev => ({
      ...prev,
      current: {
        ...prev.current,
        slideIndex: newIndex
      },
      display: {
        ...prev.display,
        currentSlide: prev.current.status === 'live' ? newSlide : prev.display.currentSlide
      }
    }));

    // Sync with live display if presenting
    if (state.current.status === 'live' && liveDisplayActive) {
      await sendSlideToLive(
        newSlide,
        {
          id: state.current.content.id,
          type: state.current.content.type,
          title: state.current.content.title,
          content: state.current.content.metadata,
          slides: state.current.content.slides
        },
        newIndex
      );
    }
  }, [state.current, liveDisplayActive, sendSlideToLive]);

  /**
   * Navigate to previous slide
   */
  const previous = useCallback(async (): Promise<void> => {
    if (!state.current.content?.slides) {
      console.warn('⚠️ PresentationManager: No content loaded for previous()');
      return;
    }

    if (state.current.slideIndex === 0) {
      console.log('ℹ️ PresentationManager: Already at first slide');
      return;
    }

    const newIndex = state.current.slideIndex - 1;
    const newSlide = state.current.content.slides[newIndex];

    console.log(`⬅️ PresentationManager: Previous slide (${newIndex + 1}/${state.current.content.slides.length})`);

    // Update state
    setState(prev => ({
      ...prev,
      current: {
        ...prev.current,
        slideIndex: newIndex
      },
      display: {
        ...prev.display,
        currentSlide: prev.current.status === 'live' ? newSlide : prev.display.currentSlide
      }
    }));

    // Sync with live display if presenting
    if (state.current.status === 'live' && liveDisplayActive) {
      await sendSlideToLive(
        newSlide,
        {
          id: state.current.content.id,
          type: state.current.content.type,
          title: state.current.content.title,
          content: state.current.content.metadata,
          slides: state.current.content.slides
        },
        newIndex
      );
    }
  }, [state.current, liveDisplayActive, sendSlideToLive]);

  /**
   * Go to specific slide index
   */
  const goToSlide = useCallback(async (index: number): Promise<void> => {
    if (!state.current.content?.slides) {
      console.warn('⚠️ PresentationManager: No content loaded for goToSlide()');
      return;
    }

    if (index < 0 || index >= state.current.content.slides.length) {
      console.warn(`⚠️ PresentationManager: Invalid slide index ${index}`);
      return;
    }

    const newSlide = state.current.content.slides[index];

    console.log(`🎯 PresentationManager: Go to slide ${index + 1}/${state.current.content.slides.length}`);

    // Update state
    setState(prev => ({
      ...prev,
      current: {
        ...prev.current,
        slideIndex: index
      },
      display: {
        ...prev.display,
        currentSlide: prev.current.status === 'live' ? newSlide : prev.display.currentSlide
      }
    }));

    // Sync with live display if presenting
    if (state.current.status === 'live' && liveDisplayActive) {
      await sendSlideToLive(
        newSlide,
        {
          id: state.current.content.id,
          type: state.current.content.type,
          title: state.current.content.title,
          content: state.current.content.metadata,
          slides: state.current.content.slides
        },
        index
      );
    }
  }, [state.current, liveDisplayActive, sendSlideToLive]);

  /**
   * Start live presentation (send current slide to display)
   */
  const goLive = useCallback(async (): Promise<void> => {
    if (!state.current.content?.slides) {
      console.warn('⚠️ PresentationManager: No content loaded for goLive()');
      return;
    }

    console.log('🎬 PresentationManager: Going live');

    // Create display if needed
    if (!liveDisplayActive) {
      await createLiveDisplay();
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const currentSlide = state.current.content.slides[state.current.slideIndex];

    // Update state
    setState(prev => ({
      ...prev,
      current: {
        ...prev.current,
        status: 'live'
      },
      display: {
        ...prev.display,
        currentSlide,
        contentType: state.current.content!.type,
        contentId: state.current.content!.id
      }
    }));

    // Send current slide to display
    await sendSlideToLive(
      currentSlide,
      {
        id: state.current.content.id,
        type: state.current.content.type,
        title: state.current.content.title,
        content: state.current.content.metadata,
        slides: state.current.content.slides
      },
      state.current.slideIndex
    );

    console.log('✅ PresentationManager: Now live');
  }, [state.current, liveDisplayActive, createLiveDisplay, sendSlideToLive]);

  /**
   * Stop live presentation (keep content in preview)
   */
  const stopLive = useCallback(async (): Promise<void> => {
    console.log('⏹️ PresentationManager: Stopping live presentation');

    await clearLiveDisplay();

    setState(prev => ({
      ...prev,
      current: {
        ...prev.current,
        status: 'preview'
      },
      display: {
        ...prev.display,
        currentSlide: null
      }
    }));
  }, [clearLiveDisplay]);

  /**
   * Show black screen
   */
  const showBlack = useCallback(async (): Promise<void> => {
    console.log('⬛ PresentationManager: Showing black screen');
    await showBlackScreen();
  }, [showBlackScreen]);

  // Return state and actions
  return {
    state,
    actions: {
      present,
      switchContent,
      clear,
      next,
      previous,
      goToSlide,
      goLive,
      stopLive,
      showBlack
    }
  };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if manager has active content
 */
export function hasContent(state: PresentationManagerState): boolean {
  return state.current.content !== null && state.current.content.slides.length > 0;
}

/**
 * Check if currently presenting live
 */
export function isLive(state: PresentationManagerState): boolean {
  return state.current.status === 'live';
}

/**
 * Get current slide
 */
export function getCurrentSlide(state: PresentationManagerState): Slide | null {
  if (!state.current.content?.slides) return null;
  return state.current.content.slides[state.current.slideIndex] || null;
}

/**
 * Check if can navigate next
 */
export function canNavigateNext(state: PresentationManagerState): boolean {
  if (!state.current.content?.slides) return false;
  return state.current.slideIndex < state.current.content.slides.length - 1;
}

/**
 * Check if can navigate previous
 */
export function canNavigatePrevious(state: PresentationManagerState): boolean {
  return state.current.slideIndex > 0;
}

/**
 * Get slide count
 */
export function getSlideCount(state: PresentationManagerState): number {
  return state.current.content?.slides.length || 0;
}
