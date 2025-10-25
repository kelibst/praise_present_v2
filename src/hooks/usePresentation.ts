import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { AppDispatch } from '../lib/store';
import {
  selectCurrentPresentation,
  selectDisplayState,
  selectHasContent,
  selectIsLive,
  selectCurrentSlide,
  selectSlideCount,
  selectCanNavigateNext,
  selectCanNavigatePrevious,
  selectCurrentContentInfo,
  selectHistory,
  presentContent,
  switchContent,
  nextSlide,
  previousSlide,
  goToSlide,
  goLive,
  stopLive,
  clearPresentation,
  clearTabPresentation,
  showBlackScreen,
  PresentationContent,
  ActiveTab
} from '../lib/presentationSlice';

/**
 * Custom hook for easy access to presentation state and actions
 *
 * Usage:
 * const presentation = usePresentation();
 *
 * // Access state
 * presentation.hasContent
 * presentation.isLive
 * presentation.currentSlide
 * presentation.slideIndex
 *
 * // Call actions
 * presentation.present(content, { goLive: true })
 * presentation.next()
 * presentation.previous()
 * presentation.goLive()
 */
export const usePresentation = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Selectors
  const current = useSelector(selectCurrentPresentation);
  const display = useSelector(selectDisplayState);
  const hasContent = useSelector(selectHasContent);
  const isLive = useSelector(selectIsLive);
  const currentSlide = useSelector(selectCurrentSlide);
  const slideCount = useSelector(selectSlideCount);
  const canGoNext = useSelector(selectCanNavigateNext);
  const canGoPrevious = useSelector(selectCanNavigatePrevious);
  const contentInfo = useSelector(selectCurrentContentInfo);
  const history = useSelector(selectHistory);

  // Actions
  const present = useCallback((content: PresentationContent, options?: { goLive?: boolean; tabName?: ActiveTab }) => {
    dispatch(presentContent({
      content,
      goLive: options?.goLive,
      tabName: options?.tabName
    }));
  }, [dispatch]);

  const switchTo = useCallback((content: PresentationContent) => {
    dispatch(switchContent(content));
  }, [dispatch]);

  const next = useCallback(() => {
    dispatch(nextSlide());
  }, [dispatch]);

  const previous = useCallback(() => {
    dispatch(previousSlide());
  }, [dispatch]);

  const jumpTo = useCallback((slideIndex: number) => {
    dispatch(goToSlide(slideIndex));
  }, [dispatch]);

  const startLive = useCallback(() => {
    dispatch(goLive());
  }, [dispatch]);

  const stopLivePresentation = useCallback(() => {
    dispatch(stopLive());
  }, [dispatch]);

  const clear = useCallback(() => {
    dispatch(clearPresentation());
  }, [dispatch]);

  const clearTab = useCallback((tabName: ActiveTab) => {
    dispatch(clearTabPresentation(tabName));
  }, [dispatch]);

  const showBlack = useCallback(() => {
    dispatch(showBlackScreen());
  }, [dispatch]);

  // Computed values
  const slideNumber = current.slideIndex + 1; // 1-indexed for display
  const slideProgress = useMemo(() => {
    if (!hasContent || slideCount === 0) return 0;
    return ((slideNumber) / slideCount) * 100;
  }, [hasContent, slideNumber, slideCount]);

  return {
    // State
    current,
    display,
    hasContent,
    isLive,
    currentSlide,
    slideIndex: current.slideIndex,
    slideNumber, // 1-indexed
    slideCount,
    slideProgress,
    canGoNext,
    canGoPrevious,
    contentInfo,
    history,
    status: current.status,
    owner: current.owner,

    // Actions
    present,
    switchTo,
    next,
    previous,
    jumpTo,
    startLive,
    stopLive: stopLivePresentation,
    clear,
    clearTab,
    showBlack
  };
};

/**
 * Hook to check if a specific tab has an active presentation
 */
export const useTabPresentation = (tabName: ActiveTab) => {
  const current = useSelector(selectCurrentPresentation);

  const isOwnedByTab = current.owner === tabName;
  const hasActiveContent = current.content !== null && isOwnedByTab;

  return {
    isActive: hasActiveContent,
    isLive: hasActiveContent && current.status === 'live',
    contentId: hasActiveContent ? current.content?.id : null,
    slideIndex: hasActiveContent ? current.slideIndex : 0
  };
};
