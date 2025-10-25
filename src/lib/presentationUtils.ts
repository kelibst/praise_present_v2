/**
 * Presentation Utilities
 *
 * Helper functions for managing presentation state in a content-type agnostic way
 */

import {
  PresentationItem,
  PresentationState,
  ServiceItem,
  ContentType,
  Slide
} from '../types/presentation';

// ============================================
// CONVERSION UTILITIES
// ============================================

/**
 * Convert legacy ServiceItem to unified PresentationItem
 * This helps with gradual migration of existing code
 */
export function serviceItemToPresentationItem(
  serviceItem: ServiceItem
): PresentationItem {
  return {
    id: serviceItem.id,
    type: serviceItem.type,
    title: serviceItem.title,
    content: serviceItem.content,
    slides: serviceItem.slides || [],
    metadata: extractMetadata(serviceItem)
  };
}

/**
 * Extract metadata from service item based on content type
 */
function extractMetadata(serviceItem: ServiceItem): PresentationItem['metadata'] {
  const content = serviceItem.content;

  switch (serviceItem.type) {
    case 'scripture':
      return {
        reference: content.reference,
        book: content.book,
        chapter: content.chapter,
        verses: content.verses
      };

    case 'song':
      return {
        author: content.author,
        artist: content.artist,
        key: content.key,
        tempo: content.tempo,
        copyright: content.copyright,
        ccliNumber: content.ccliNumber,
        tags: content.tags
      };

    default:
      return {};
  }
}

// ============================================
// PRESENTATION STATE HELPERS
// ============================================

/**
 * Select an item for presentation
 */
export function selectItem(
  currentState: PresentationState,
  item: PresentationItem
): PresentationState {
  return {
    activeItem: item,
    currentSlideIndex: 0,
    isLive: currentState.isLive,  // Maintain live state
    mode: 'preview'
  };
}

/**
 * Clear current selection
 */
export function clearSelection(currentState: PresentationState): PresentationState {
  return {
    activeItem: null,
    currentSlideIndex: 0,
    isLive: false,
    mode: 'preview'
  };
}

/**
 * Navigate to next slide
 */
export function goToNextSlide(currentState: PresentationState): PresentationState | null {
  if (!currentState.activeItem?.slides) return null;

  const maxIndex = currentState.activeItem.slides.length - 1;
  if (currentState.currentSlideIndex >= maxIndex) return null;

  return {
    ...currentState,
    currentSlideIndex: currentState.currentSlideIndex + 1
  };
}

/**
 * Navigate to previous slide
 */
export function goToPreviousSlide(currentState: PresentationState): PresentationState | null {
  if (!currentState.activeItem?.slides) return null;
  if (currentState.currentSlideIndex === 0) return null;

  return {
    ...currentState,
    currentSlideIndex: currentState.currentSlideIndex - 1
  };
}

/**
 * Go to specific slide index
 */
export function goToSlide(
  currentState: PresentationState,
  index: number
): PresentationState | null {
  if (!currentState.activeItem?.slides) return null;
  if (index < 0 || index >= currentState.activeItem.slides.length) return null;

  return {
    ...currentState,
    currentSlideIndex: index
  };
}

/**
 * Start live presentation
 */
export function goLive(currentState: PresentationState): PresentationState {
  return {
    ...currentState,
    isLive: true,
    mode: 'live'
  };
}

/**
 * Stop live presentation
 */
export function stopLive(currentState: PresentationState): PresentationState {
  return {
    ...currentState,
    isLive: false,
    mode: 'preview'
  };
}

// ============================================
// GETTERS
// ============================================

/**
 * Get current slide
 */
export function getCurrentSlide(state: PresentationState): Slide | null {
  if (!state.activeItem?.slides || state.activeItem.slides.length === 0) {
    return null;
  }

  return state.activeItem.slides[state.currentSlideIndex] || null;
}

/**
 * Get slide count
 */
export function getSlideCount(state: PresentationState): number {
  return state.activeItem?.slides?.length || 0;
}

/**
 * Check if can navigate next
 */
export function canNavigateNext(state: PresentationState): boolean {
  if (!state.activeItem?.slides) return false;
  return state.currentSlideIndex < state.activeItem.slides.length - 1;
}

/**
 * Check if can navigate previous
 */
export function canNavigatePrevious(state: PresentationState): boolean {
  return state.currentSlideIndex > 0;
}

/**
 * Check if item is being presented
 */
export function isItemActive(
  state: PresentationState,
  itemId: string
): boolean {
  return state.activeItem?.id === itemId;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate presentation item has required data
 */
export function isValidPresentationItem(item: any): item is PresentationItem {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.type === 'string' &&
    typeof item.title === 'string' &&
    Array.isArray(item.slides)
  );
}
