import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  ScriptureSettings,
  SongSettings,
  AnnouncementSettings,
  AllFeatureSettings,
  selectFeatureSettings,
  selectScriptureSettings,
  selectSongSettings,
  selectAnnouncementSettings,
  selectFeatureSettingsLoading,
  selectFeatureSettingsError,
  updateFeatureSettings,
  updateFeatureBackground,
  updateFeatureTypography,
  saveFeatureSettings,
  loadFeatureSettings,
  resetFeatureSettings,
  clearError as clearFeatureSettingsError
} from '../lib/featureSettingsSlice';
import { SlideBackground } from '../components/formatting/BackgroundToolbar';
import { AppDispatch } from '../lib/store';

/**
 * Hook for managing feature-specific settings (scriptures, songs, announcements)
 *
 * Provides CRUD operations for persisting background, typography, and other
 * feature-specific configuration that should apply to all slides of that type.
 *
 * Usage:
 * ```typescript
 * const { scriptureSettings, updateScriptureBackground, saveScripture } = useFeatureSettings();
 *
 * // Update background
 * updateScriptureBackground({ type: 'color', value: '#1a1a1a' });
 *
 * // Save to database
 * await saveScripture();
 * ```
 */
export const useFeatureSettings = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Selectors
  const allSettings = useSelector(selectFeatureSettings);
  const scriptureSettings = useSelector(selectScriptureSettings);
  const songSettings = useSelector(selectSongSettings);
  const announcementSettings = useSelector(selectAnnouncementSettings);
  const isLoading = useSelector(selectFeatureSettingsLoading);
  const error = useSelector(selectFeatureSettingsError);

  // Generic update for any feature
  const updateSettings = useCallback(
    (feature: keyof AllFeatureSettings, settings: Partial<ScriptureSettings | SongSettings | AnnouncementSettings>) => {
      dispatch(updateFeatureSettings({ feature, settings }));
    },
    [dispatch]
  );

  // Scripture-specific operations
  const updateScriptureBackground = useCallback(
    (background: SlideBackground) => {
      dispatch(updateFeatureBackground({ feature: 'scriptures', background }));
    },
    [dispatch]
  );

  const updateScriptureTypography = useCallback(
    (typography: Partial<ScriptureSettings['typography']>) => {
      dispatch(updateFeatureTypography({ feature: 'scriptures', typography }));
    },
    [dispatch]
  );

  const saveScripture = useCallback(
    async (settings?: ScriptureSettings) => {
      const settingsToSave = settings || scriptureSettings;
      return dispatch(saveFeatureSettings({ feature: 'scriptures', settings: settingsToSave }));
    },
    [dispatch, scriptureSettings]
  );

  const resetScripture = useCallback(
    () => {
      return dispatch(resetFeatureSettings('scriptures'));
    },
    [dispatch]
  );

  // Song-specific operations
  const updateSongBackground = useCallback(
    (background: SlideBackground) => {
      dispatch(updateFeatureBackground({ feature: 'songs', background }));
    },
    [dispatch]
  );

  const updateSongTypography = useCallback(
    (typography: Partial<SongSettings['typography']>) => {
      dispatch(updateFeatureTypography({ feature: 'songs', typography }));
    },
    [dispatch]
  );

  const saveSong = useCallback(
    async (settings?: SongSettings) => {
      const settingsToSave = settings || songSettings;
      return dispatch(saveFeatureSettings({ feature: 'songs', settings: settingsToSave }));
    },
    [dispatch, songSettings]
  );

  const resetSong = useCallback(
    () => {
      return dispatch(resetFeatureSettings('songs'));
    },
    [dispatch]
  );

  // Announcement-specific operations
  const updateAnnouncementBackground = useCallback(
    (background: SlideBackground) => {
      dispatch(updateFeatureBackground({ feature: 'announcements', background }));
    },
    [dispatch]
  );

  const updateAnnouncementTypography = useCallback(
    (typography: Partial<AnnouncementSettings['typography']>) => {
      dispatch(updateFeatureTypography({ feature: 'announcements', typography }));
    },
    [dispatch]
  );

  const saveAnnouncement = useCallback(
    async (settings?: AnnouncementSettings) => {
      const settingsToSave = settings || announcementSettings;
      return dispatch(saveFeatureSettings({ feature: 'announcements', settings: settingsToSave }));
    },
    [dispatch, announcementSettings]
  );

  const resetAnnouncement = useCallback(
    () => {
      return dispatch(resetFeatureSettings('announcements'));
    },
    [dispatch]
  );

  // General operations
  const loadSettings = useCallback(
    () => {
      return dispatch(loadFeatureSettings());
    },
    [dispatch]
  );

  const resetAll = useCallback(
    () => {
      return dispatch(resetFeatureSettings('all'));
    },
    [dispatch]
  );

  const clearError = useCallback(
    () => {
      dispatch(clearFeatureSettingsError());
    },
    [dispatch]
  );

  return {
    // All settings
    allSettings,
    isLoading,
    error,

    // Scripture
    scriptureSettings,
    updateScriptureBackground,
    updateScriptureTypography,
    saveScripture,
    resetScripture,

    // Songs
    songSettings,
    updateSongBackground,
    updateSongTypography,
    saveSong,
    resetSong,

    // Announcements
    announcementSettings,
    updateAnnouncementBackground,
    updateAnnouncementTypography,
    saveAnnouncement,
    resetAnnouncement,

    // General
    updateSettings,
    loadSettings,
    resetAll,
    clearError
  };
};

export default useFeatureSettings;
