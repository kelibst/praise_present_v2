import { useEffect } from 'react';

interface UsePresentationKeyboardProps {
  goToNext: () => Promise<void>;
  goToPrevious: () => Promise<void>;
  presentCurrentSlide: () => Promise<void>;
  showBlackScreen: () => Promise<void>;
  clearLiveDisplay: () => Promise<void>;
  liveDisplayActive: boolean;
  selectedItem: any;
  currentSlideIndex: number;
  setPresentationMode: (mode: 'preview' | 'live') => void;
  setIsPresenting: (presenting: boolean) => void;
}

/**
 * Custom hook for presentation keyboard shortcuts
 * Handles Space/Enter/Arrows for navigation, B for black screen, Esc to clear, F to present
 */
export const usePresentationKeyboard = ({
  goToNext,
  goToPrevious,
  presentCurrentSlide,
  showBlackScreen,
  clearLiveDisplay,
  liveDisplayActive,
  selectedItem,
  currentSlideIndex,
  setPresentationMode,
  setIsPresenting
}: UsePresentationKeyboardProps) => {
  useEffect(() => {
    const handleKeyPress = async (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Prevent default for our shortcuts
      const shortcuts = [' ', 'Enter', 'Backspace', 'ArrowLeft', 'ArrowRight', 'Escape', 'KeyB', 'KeyF'];
      if (shortcuts.includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case 'Space':
        case 'Enter':
        case 'ArrowRight':
          // Next (unified)
          await goToNext();
          break;

        case 'Backspace':
        case 'ArrowLeft':
          // Previous (unified)
          await goToPrevious();
          break;

        case 'KeyB':
          // Black screen
          if (liveDisplayActive) {
            await showBlackScreen();
          }
          break;

        case 'Escape':
          // Clear live display
          if (liveDisplayActive) {
            await clearLiveDisplay();
            setPresentationMode('preview');
            setIsPresenting(false);
          }
          break;

        case 'KeyF':
          // Go to live mode (present current slide)
          if (selectedItem?.slides && selectedItem.slides[currentSlideIndex] && liveDisplayActive) {
            await presentCurrentSlide();
            setPresentationMode('live');
            setIsPresenting(true);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [
    goToNext,
    goToPrevious,
    presentCurrentSlide,
    showBlackScreen,
    clearLiveDisplay,
    liveDisplayActive,
    selectedItem,
    currentSlideIndex,
    setPresentationMode,
    setIsPresenting
  ]);
};
