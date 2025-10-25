import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../store';

/**
 * Presentation Middleware - Automatic Live Display Synchronization
 *
 * This middleware automatically handles:
 * - Live display IPC communication when slides change
 * - Black screen commands
 * - Display window creation/closing
 * - Performance tracking for presentation actions
 *
 * Benefits:
 * - Components don't need to manually sync with live display
 * - Centralized IPC logic
 * - Automatic error handling
 * - Performance metrics
 */

// Track performance metrics
interface PresentationMetrics {
  slideChanges: number;
  averageSlideChangeTime: number;
  liveDisplaySyncs: number;
  errors: number;
}

const metrics: PresentationMetrics = {
  slideChanges: 0,
  averageSlideChangeTime: 0,
  liveDisplaySyncs: 0,
  errors: 0
};

/**
 * Send slide to live display via Electron IPC
 */
const sendSlideToLiveDisplay = async (slide: any, contentType: string, slideIndex: number) => {
  try {
    const startTime = performance.now();

    if (!window.electronAPI?.invoke) {
      console.warn('[PresentationMiddleware] Electron API not available');
      return;
    }

    // Send to live display
    await window.electronAPI.invoke('live-display:sendContent', {
      slide,
      contentType,
      slideIndex
    });

    const duration = performance.now() - startTime;
    metrics.liveDisplaySyncs++;

    console.log(`[PresentationMiddleware] Sent slide ${slideIndex + 1} to live display (${duration.toFixed(2)}ms)`);
  } catch (error) {
    console.error('[PresentationMiddleware] Error sending to live display:', error);
    metrics.errors++;
  }
};

/**
 * Show black screen on live display
 */
const showBlackScreenOnDisplay = async () => {
  try {
    if (!window.electronAPI?.invoke) {
      console.warn('[PresentationMiddleware] Electron API not available');
      return;
    }

    await window.electronAPI.invoke('live-display:showBlack', {});
    console.log('[PresentationMiddleware] Black screen sent to live display');
  } catch (error) {
    console.error('[PresentationMiddleware] Error showing black screen:', error);
    metrics.errors++;
  }
};

/**
 * Clear live display
 */
const clearLiveDisplay = async () => {
  try {
    if (!window.electronAPI?.invoke) {
      console.warn('[PresentationMiddleware] Electron API not available');
      return;
    }

    await window.electronAPI.invoke('live-display:clearContent', {});
    console.log('[PresentationMiddleware] Cleared live display');
  } catch (error) {
    console.error('[PresentationMiddleware] Error clearing live display:', error);
    metrics.errors++;
  }
};

/**
 * Create live display window
 */
const createLiveDisplayWindow = async () => {
  try {
    if (!window.electronAPI?.invoke) {
      console.warn('[PresentationMiddleware] Electron API not available');
      return false;
    }

    const result = await window.electronAPI.invoke('live-display:create', {});

    if (result?.success) {
      console.log('[PresentationMiddleware] Live display window created');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[PresentationMiddleware] Error creating live display:', error);
    metrics.errors++;
    return false;
  }
};

/**
 * Presentation Middleware
 */
export const presentationMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const startTime = performance.now();

  // Execute the action first
  const result = next(action);

  // Get current state after action
  const state = store.getState();
  const presentation = state.presentation;

  // Handle different action types
  if (action.type?.startsWith('presentation/')) {
    const actionType = action.type.split('/')[1];

    switch (actionType) {
      case 'nextSlide':
      case 'previousSlide':
      case 'goToSlide': {
        const duration = performance.now() - startTime;
        metrics.slideChanges++;
        metrics.averageSlideChangeTime =
          (metrics.averageSlideChangeTime * (metrics.slideChanges - 1) + duration) / metrics.slideChanges;

        // If live, sync with display
        if (presentation.current.status === 'live' && presentation.display.currentSlide) {
          sendSlideToLiveDisplay(
            presentation.display.currentSlide,
            presentation.display.contentType || 'unknown',
            presentation.display.slideIndex
          );
        }
        break;
      }

      case 'goLive': {
        // Create live display window if needed, then send current slide
        (async () => {
          if (!presentation.display.isActive) {
            await createLiveDisplayWindow();
          }

          if (presentation.display.currentSlide) {
            await sendSlideToLiveDisplay(
              presentation.display.currentSlide,
              presentation.display.contentType || 'unknown',
              presentation.display.slideIndex
            );
          }
        })();
        break;
      }

      case 'stopLive': {
        // Keep display window open but could clear content if desired
        console.log('[PresentationMiddleware] Live presentation stopped');
        break;
      }

      case 'presentContent': {
        // If going live immediately, create window and send first slide
        if (action.payload?.goLive && presentation.display.currentSlide) {
          (async () => {
            if (!presentation.display.isActive) {
              await createLiveDisplayWindow();
            }

            await sendSlideToLiveDisplay(
              presentation.display.currentSlide,
              presentation.display.contentType || 'unknown',
              presentation.display.slideIndex
            );
          })();
        }
        break;
      }

      case 'showBlackScreen': {
        showBlackScreenOnDisplay();
        break;
      }

      case 'clearPresentation': {
        // If was live, clear the display
        if (presentation.display.isActive) {
          clearLiveDisplay();
        }
        break;
      }

      default:
        break;
    }
  }

  return result;
};

/**
 * Get current metrics
 */
export const getPresentationMetrics = (): PresentationMetrics => ({
  ...metrics
});

/**
 * Reset metrics
 */
export const resetPresentationMetrics = () => {
  metrics.slideChanges = 0;
  metrics.averageSlideChangeTime = 0;
  metrics.liveDisplaySyncs = 0;
  metrics.errors = 0;
};
