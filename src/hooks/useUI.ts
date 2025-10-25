import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { AppDispatch } from '../lib/store';
import {
  selectActiveTab,
  selectScriptureSubTab,
  selectSettingsModalOpen,
  selectInlineMediaModal,
  selectPropertyPanelVisible,
  selectPanelLayout,
  selectLoadingState,
  selectPendingSongs,
  selectActiveVerseNumbers,
  selectCurrentServiceId,
  selectIsGeneratingSlides,
  selectIsPlanLoading,
  selectIsLoadingService,
  selectIsExecutingService,
  selectIsAnyLoading,
  selectPendingSongsCount,
  selectHasPendingSongs,
  selectPlanError,
  setActiveTab,
  setScriptureSubTab,
  setSettingsModalOpen,
  openInlineMediaModal,
  closeInlineMediaModal,
  setPropertyPanelVisible,
  setPanelVisibility,
  setPanelSizes,
  setLoadingState,
  addPendingSong,
  addPendingSongs,
  removePendingSong,
  clearPendingSongs,
  setActiveVerseNumbers,
  setCurrentServiceId,
  resetUIState,
  type LoadingStatus,
  type PendingSongItem
} from '../lib/uiSlice';
import type { ActiveTab } from '../lib/presentationSlice';

/**
 * Custom hook for easy access to UI state and actions
 *
 * Usage:
 * const ui = useUI();
 *
 * // Access state
 * ui.activeTab
 * ui.isLoading
 * ui.pendingSongs
 *
 * // Call actions
 * ui.setActiveTab('songs')
 * ui.setLoading({ type: 'generating-slides', itemId: '123' })
 */
export const useUI = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Selectors
  const activeTab = useSelector(selectActiveTab);
  const scriptureSubTab = useSelector(selectScriptureSubTab);
  const settingsModalOpen = useSelector(selectSettingsModalOpen);
  const inlineMediaModal = useSelector(selectInlineMediaModal);
  const propertyPanelVisible = useSelector(selectPropertyPanelVisible);
  const panelLayout = useSelector(selectPanelLayout);
  const loadingState = useSelector(selectLoadingState);
  const pendingSongs = useSelector(selectPendingSongs);
  const activeVerseNumbers = useSelector(selectActiveVerseNumbers);
  const currentServiceId = useSelector(selectCurrentServiceId);

  // Computed selectors
  const isGeneratingSlides = useSelector(selectIsGeneratingSlides);
  const isPlanLoading = useSelector(selectIsPlanLoading);
  const isLoadingService = useSelector(selectIsLoadingService);
  const isExecutingService = useSelector(selectIsExecutingService);
  const isAnyLoading = useSelector(selectIsAnyLoading);
  const pendingSongsCount = useSelector(selectPendingSongsCount);
  const hasPendingSongs = useSelector(selectHasPendingSongs);
  const planError = useSelector(selectPlanError);

  // Actions
  const switchTab = useCallback((tab: ActiveTab) => {
    dispatch(setActiveTab(tab));
  }, [dispatch]);

  const switchScriptureSubTab = useCallback((subTab: 'browse' | 'type') => {
    dispatch(setScriptureSubTab(subTab));
  }, [dispatch]);

  const toggleSettingsModal = useCallback((open: boolean) => {
    dispatch(setSettingsModalOpen(open));
  }, [dispatch]);

  const openMediaModal = useCallback((mediaType: 'song' | 'scripture' | 'presentation' | 'announcement', insertPosition: number) => {
    dispatch(openInlineMediaModal({ mediaType, insertPosition }));
  }, [dispatch]);

  const closeMediaModal = useCallback(() => {
    dispatch(closeInlineMediaModal());
  }, [dispatch]);

  const togglePropertyPanel = useCallback((visible: boolean) => {
    dispatch(setPropertyPanelVisible(visible));
  }, [dispatch]);

  const updatePanelVisibility = useCallback((visibility: Partial<{ left: boolean; middle: boolean; right: boolean }>) => {
    dispatch(setPanelVisibility(visibility));
  }, [dispatch]);

  const updatePanelSizes = useCallback((sizes: number[]) => {
    dispatch(setPanelSizes(sizes));
  }, [dispatch]);

  const setLoading = useCallback((loading: LoadingStatus) => {
    dispatch(setLoadingState(loading));
  }, [dispatch]);

  const clearLoading = useCallback(() => {
    dispatch(setLoadingState({ type: 'idle' }));
  }, [dispatch]);

  const addSongToPending = useCallback((song: PendingSongItem) => {
    dispatch(addPendingSong(song));
  }, [dispatch]);

  const addSongsToPending = useCallback((songs: PendingSongItem[]) => {
    dispatch(addPendingSongs(songs));
  }, [dispatch]);

  const removeSongFromPending = useCallback((songId: string) => {
    dispatch(removePendingSong(songId));
  }, [dispatch]);

  const clearAllPendingSongs = useCallback(() => {
    dispatch(clearPendingSongs());
  }, [dispatch]);

  const updateActiveVerses = useCallback((verseNumbers: number[]) => {
    dispatch(setActiveVerseNumbers(verseNumbers));
  }, [dispatch]);

  const updateServiceId = useCallback((serviceId: string | null) => {
    dispatch(setCurrentServiceId(serviceId));
  }, [dispatch]);

  const resetUI = useCallback(() => {
    dispatch(resetUIState());
  }, [dispatch]);

  return {
    // State
    activeTab,
    scriptureSubTab,
    settingsModalOpen,
    inlineMediaModal,
    propertyPanelVisible,
    panelLayout,
    loadingState,
    pendingSongs,
    activeVerseNumbers,
    currentServiceId,

    // Computed state
    isGeneratingSlides,
    isPlanLoading,
    isLoadingService,
    isExecutingService,
    isAnyLoading,
    isLoading: isAnyLoading, // Alias for convenience
    pendingSongsCount,
    hasPendingSongs,
    planError,

    // Actions
    setActiveTab: switchTab,
    setScriptureSubTab: switchScriptureSubTab,
    setSettingsModalOpen: toggleSettingsModal,
    openInlineMediaModal: openMediaModal,
    closeInlineMediaModal: closeMediaModal,
    setPropertyPanelVisible: togglePropertyPanel,
    setPanelVisibility: updatePanelVisibility,
    setPanelSizes: updatePanelSizes,
    setLoading,
    clearLoading,
    addPendingSong: addSongToPending,
    addPendingSongs: addSongsToPending,
    removePendingSong: removeSongFromPending,
    clearPendingSongs: clearAllPendingSongs,
    setActiveVerseNumbers: updateActiveVerses,
    setCurrentServiceId: updateServiceId,
    resetUIState: resetUI
  };
};

/**
 * Hook to check if a specific loading state is active
 */
export const useIsLoading = (type: LoadingStatus['type']) => {
  const loadingState = useSelector(selectLoadingState);
  return loadingState.type === type;
};
