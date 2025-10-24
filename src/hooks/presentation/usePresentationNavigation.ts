import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../lib/store';
import {
  navigateToPreviousVerse,
  navigateToNextVerse,
  navigateToPreviousChapter,
  navigateToNextChapter,
  setCurrentGroupIndex,
  selectScriptureNavigation
} from '../../lib/scriptureNavigationSlice';
import { ServiceItem } from '../../components/service/ServiceItem';
import { Slide as NewSlide } from '../../components/slides';
import { ScriptureVerse } from '../../lib/services/bibleService';

interface Slide extends NewSlide {
  duration?: number;
  verseNumbers?: number[];
  verseIds?: string[];
}

interface UsePresentationNavigationProps {
  selectedItem: ServiceItem | null;
  currentSlideIndex: number;
  presentationMode: 'preview' | 'live';
  liveDisplayActive: boolean;
  setCurrentSlideIndex: (index: number) => void;
  sendSlideToLive: (slide: Slide, item: ServiceItem, index: number) => Promise<void>;
  handleScriptureSelect: (verses: ScriptureVerse[]) => Promise<void>;
}

/**
 * Custom hook for presentation navigation
 * Handles slide navigation, scripture verse navigation, and chapter navigation
 */
export const usePresentationNavigation = ({
  selectedItem,
  currentSlideIndex,
  presentationMode,
  liveDisplayActive,
  setCurrentSlideIndex,
  sendSlideToLive,
  handleScriptureSelect
}: UsePresentationNavigationProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const scriptureNav = useSelector(selectScriptureNavigation);

  /**
   * Navigate to previous slide or verse
   */
  const goToPrevious = useCallback(async () => {
    // For scriptures with single verse, navigate through Bible
    if (selectedItem?.type === 'scripture' && selectedItem.slides?.length === 1) {
      if (!scriptureNav.canNavigatePrevious) return;

      console.log('⬆️ Navigating to previous verse in Bible');
      const result = await dispatch(navigateToPreviousVerse()).unwrap();
      if (result) {
        await handleScriptureSelect([result as ScriptureVerse]);
      }
    }
    // For regular slides or multiple verse slides
    else if (selectedItem?.slides && currentSlideIndex > 0) {
      const newIndex = currentSlideIndex - 1;
      console.log('⬅️ Moving to slide:', newIndex);
      setCurrentSlideIndex(newIndex);

      // Update Redux navigation state if scripture
      if (selectedItem.type === 'scripture' && scriptureNav.currentGroups.length > 0) {
        dispatch(setCurrentGroupIndex(newIndex));
      }

      // Send to live display if in presentation mode
      if (presentationMode === 'live' && liveDisplayActive && selectedItem.slides[newIndex]) {
        await sendSlideToLive(selectedItem.slides[newIndex], selectedItem, newIndex);
      }
    }
  }, [
    selectedItem,
    currentSlideIndex,
    scriptureNav,
    dispatch,
    presentationMode,
    liveDisplayActive,
    setCurrentSlideIndex,
    sendSlideToLive,
    handleScriptureSelect
  ]);

  /**
   * Navigate to next slide or verse
   */
  const goToNext = useCallback(async () => {
    // For scriptures with single verse, navigate through Bible
    if (selectedItem?.type === 'scripture' && selectedItem.slides?.length === 1) {
      if (!scriptureNav.canNavigateNext) return;

      console.log('⬇️ Navigating to next verse in Bible');
      const result = await dispatch(navigateToNextVerse()).unwrap();
      if (result) {
        await handleScriptureSelect([result as ScriptureVerse]);
      }
    }
    // For regular slides or multiple verse slides
    else if (selectedItem?.slides && currentSlideIndex < selectedItem.slides.length - 1) {
      const newIndex = currentSlideIndex + 1;
      console.log('➡️ Moving to slide:', newIndex);
      setCurrentSlideIndex(newIndex);

      // Update Redux navigation state if scripture
      if (selectedItem.type === 'scripture' && scriptureNav.currentGroups.length > 0) {
        dispatch(setCurrentGroupIndex(newIndex));
      }

      // Send to live display if in presentation mode
      if (presentationMode === 'live' && liveDisplayActive && selectedItem.slides[newIndex]) {
        await sendSlideToLive(selectedItem.slides[newIndex], selectedItem, newIndex);
      }
    }
  }, [
    selectedItem,
    currentSlideIndex,
    scriptureNav,
    dispatch,
    presentationMode,
    liveDisplayActive,
    setCurrentSlideIndex,
    sendSlideToLive,
    handleScriptureSelect
  ]);

  /**
   * Navigate to previous verse (explicit scripture navigation)
   */
  const goToPreviousVerse = useCallback(async () => {
    if (selectedItem?.type !== 'scripture' || !scriptureNav.canNavigatePrevious) return;

    console.log('⬆️ Navigating to previous verse in Bible');
    const result = await dispatch(navigateToPreviousVerse()).unwrap();
    if (result) {
      await handleScriptureSelect([result as ScriptureVerse]);
    }
  }, [selectedItem, scriptureNav.canNavigatePrevious, dispatch, handleScriptureSelect]);

  /**
   * Navigate to next verse (explicit scripture navigation)
   */
  const goToNextVerse = useCallback(async () => {
    if (selectedItem?.type !== 'scripture' || !scriptureNav.canNavigateNext) return;

    console.log('⬇️ Navigating to next verse in Bible');
    const result = await dispatch(navigateToNextVerse()).unwrap();
    if (result) {
      await handleScriptureSelect([result as ScriptureVerse]);
    }
  }, [selectedItem, scriptureNav.canNavigateNext, dispatch, handleScriptureSelect]);

  /**
   * Navigate to previous chapter
   */
  const goToPreviousChapter = useCallback(async () => {
    if (selectedItem?.type !== 'scripture' || !scriptureNav.canNavigatePreviousChapter) return;

    console.log('⏮️ Navigating to previous chapter');
    const result = await dispatch(navigateToPreviousChapter()).unwrap();
    if (result) {
      await handleScriptureSelect([result as ScriptureVerse]);
    }
  }, [selectedItem, scriptureNav.canNavigatePreviousChapter, dispatch, handleScriptureSelect]);

  /**
   * Navigate to next chapter
   */
  const goToNextChapter = useCallback(async () => {
    if (selectedItem?.type !== 'scripture' || !scriptureNav.canNavigateNextChapter) return;

    console.log('⏭️ Navigating to next chapter');
    const result = await dispatch(navigateToNextChapter()).unwrap();
    if (result) {
      await handleScriptureSelect([result as ScriptureVerse]);
    }
  }, [selectedItem, scriptureNav.canNavigateNextChapter, dispatch, handleScriptureSelect]);

  /**
   * Present current slide to live display
   */
  const presentCurrentSlide = useCallback(async () => {
    if (selectedItem?.slides && selectedItem.slides[currentSlideIndex]) {
      await sendSlideToLive(selectedItem.slides[currentSlideIndex], selectedItem, currentSlideIndex);
    }
  }, [selectedItem, currentSlideIndex, sendSlideToLive]);

  return {
    goToPrevious,
    goToNext,
    goToPreviousVerse,
    goToNextVerse,
    goToPreviousChapter,
    goToNextChapter,
    presentCurrentSlide,
    // Return navigation state for UI
    canNavigatePrevious: selectedItem?.type === 'scripture' && selectedItem.slides?.length === 1
      ? scriptureNav.canNavigatePrevious
      : (selectedItem?.slides && currentSlideIndex > 0),
    canNavigateNext: selectedItem?.type === 'scripture' && selectedItem.slides?.length === 1
      ? scriptureNav.canNavigateNext
      : (selectedItem?.slides && currentSlideIndex < (selectedItem?.slides?.length || 0) - 1),
    canNavigatePreviousChapter: scriptureNav.canNavigatePreviousChapter,
    canNavigateNextChapter: scriptureNav.canNavigateNextChapter,
    isNavigating: scriptureNav.isNavigating
  };
};
