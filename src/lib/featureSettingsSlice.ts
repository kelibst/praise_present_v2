import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { SlideBackground } from "../components/formatting/BackgroundToolbar";
import { TextStyle } from "../rendering/types/shapes";

// Feature-specific settings types
export interface ScriptureSettings {
  background: SlideBackground;
  typography: {
    verseFontSize: number;
    referenceFontSize: number;
    translationFontSize: number;
    fontFamily: string;
    textColor: string;
    textAlign: "left" | "center" | "right";
    bold: boolean;
    italic: boolean;
    lineHeight: number;
  };
}

export interface SongSettings {
  background: SlideBackground;
  typography: {
    titleFontSize: number;
    lyricsFontSize: number;
    fontFamily: string;
    textColor: string;
    textAlign: "left" | "center" | "right";
    bold: boolean;
    italic: boolean;
    lineHeight: number;
  };
}

export interface AnnouncementSettings {
  background: SlideBackground;
  typography: {
    titleFontSize: number;
    bodyFontSize: number;
    fontFamily: string;
    textColor: string;
    textAlign: "left" | "center" | "right";
    bold: boolean;
    italic: boolean;
    lineHeight: number;
  };
}

export interface AllFeatureSettings {
  scriptures: ScriptureSettings;
  songs: SongSettings;
  announcements: AnnouncementSettings;
}

export interface FeatureSettingsState {
  settings: AllFeatureSettings;
  isLoading: boolean;
  error: string | null;
  lastSaved: number | null;
}

// Default settings for each feature
export const defaultScriptureSettings: ScriptureSettings = {
  background: {
    type: "color",
    value: "#1a1a1a",
    opacity: 1.0
  },
  typography: {
    verseFontSize: 64,
    referenceFontSize: 36,
    translationFontSize: 28,
    fontFamily: "Arial",
    textColor: "#ffffff",
    textAlign: "center",
    bold: false,
    italic: false,
    lineHeight: 1.5
  }
};

export const defaultSongSettings: SongSettings = {
  background: {
    type: "color",
    value: "#1e3a5f",
    opacity: 1.0
  },
  typography: {
    titleFontSize: 72,
    lyricsFontSize: 56,
    fontFamily: "Arial",
    textColor: "#ffffff",
    textAlign: "center",
    bold: true,
    italic: false,
    lineHeight: 1.5
  }
};

export const defaultAnnouncementSettings: AnnouncementSettings = {
  background: {
    type: "gradient",
    gradient: {
      start: "#1e3a5f",
      end: "#4a4a4a",
      direction: "vertical"
    },
    opacity: 1.0
  },
  typography: {
    titleFontSize: 72,
    bodyFontSize: 48,
    fontFamily: "Arial",
    textColor: "#ffffff",
    textAlign: "center",
    bold: true,
    italic: false,
    lineHeight: 1.5
  }
};

const defaultAllSettings: AllFeatureSettings = {
  scriptures: defaultScriptureSettings,
  songs: defaultSongSettings,
  announcements: defaultAnnouncementSettings
};

// Load settings from localStorage
const loadSettingsFromStorage = (): AllFeatureSettings => {
  try {
    const stored = localStorage.getItem("praisePresent_featureSettings");
    if (stored) {
      const parsedSettings = JSON.parse(stored);

      // Deep merge with defaults to ensure all properties exist
      // This is critical for gradient backgrounds which have nested structure
      return {
        scriptures: {
          ...defaultScriptureSettings,
          ...parsedSettings.scriptures,
          background: parsedSettings.scriptures?.background || defaultScriptureSettings.background,
          typography: {
            ...defaultScriptureSettings.typography,
            ...(parsedSettings.scriptures?.typography || {})
          }
        },
        songs: {
          ...defaultSongSettings,
          ...parsedSettings.songs,
          background: parsedSettings.songs?.background || defaultSongSettings.background,
          typography: {
            ...defaultSongSettings.typography,
            ...(parsedSettings.songs?.typography || {})
          }
        },
        announcements: {
          ...defaultAnnouncementSettings,
          ...parsedSettings.announcements,
          background: parsedSettings.announcements?.background || defaultAnnouncementSettings.background,
          typography: {
            ...defaultAnnouncementSettings.typography,
            ...(parsedSettings.announcements?.typography || {})
          }
        }
      };
    }
  } catch (error) {
    console.warn("Failed to load feature settings from localStorage:", error);
  }
  return defaultAllSettings;
};

// Save settings to localStorage
const saveSettingsToStorage = (settings: AllFeatureSettings): void => {
  try {
    localStorage.setItem("praisePresent_featureSettings", JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save feature settings to localStorage:", error);
  }
};

const initialState: FeatureSettingsState = {
  settings: loadSettingsFromStorage(),
  isLoading: false,
  error: null,
  lastSaved: null
};

// Async thunk for saving feature settings to database
export const saveFeatureSettings = createAsyncThunk(
  "featureSettings/save",
  async (
    { feature, settings }: { feature: keyof AllFeatureSettings; settings: ScriptureSettings | SongSettings | AnnouncementSettings },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { featureSettings: FeatureSettingsState };
      const newSettings = {
        ...state.featureSettings.settings,
        [feature]: settings
      };

      // Save to localStorage
      saveSettingsToStorage(newSettings);

      // TODO: Save to database via IPC
      // await window.electronAPI?.invoke('feature-settings:save', { feature, settings: JSON.stringify(settings) });

      return { settings: newSettings, timestamp: Date.now() };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to save feature settings"
      );
    }
  }
);

// Async thunk for loading feature settings from database
export const loadFeatureSettings = createAsyncThunk(
  "featureSettings/load",
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Load from database via IPC
      // const dbSettings = await window.electronAPI?.invoke('feature-settings:load');
      // if (dbSettings) {
      //   return dbSettings;
      // }

      // For now, load from localStorage
      return loadSettingsFromStorage();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to load feature settings"
      );
    }
  }
);

// Async thunk for resetting feature settings
export const resetFeatureSettings = createAsyncThunk(
  "featureSettings/reset",
  async (feature: keyof AllFeatureSettings | "all", { getState, rejectWithValue }) => {
    try {
      const state = getState() as { featureSettings: FeatureSettingsState };
      let newSettings: AllFeatureSettings;

      if (feature === "all") {
        newSettings = defaultAllSettings;
      } else {
        newSettings = {
          ...state.featureSettings.settings,
          [feature]: defaultAllSettings[feature]
        };
      }

      // Save to localStorage
      saveSettingsToStorage(newSettings);

      // TODO: Save to database
      // await window.electronAPI?.invoke('feature-settings:reset', feature);

      return { settings: newSettings, timestamp: Date.now() };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to reset feature settings"
      );
    }
  }
);

const featureSettingsSlice = createSlice({
  name: "featureSettings",
  initialState,
  reducers: {
    // Quick update for specific feature
    updateFeatureSettings: (
      state,
      action: PayloadAction<{ feature: keyof AllFeatureSettings; settings: Partial<ScriptureSettings | SongSettings | AnnouncementSettings> }>
    ) => {
      const { feature, settings } = action.payload;
      state.settings[feature] = {
        ...state.settings[feature],
        ...settings
      } as any;
      state.lastSaved = Date.now();

      // Save to localStorage immediately
      saveSettingsToStorage(state.settings);
    },

    // Update background for a specific feature
    updateFeatureBackground: (
      state,
      action: PayloadAction<{ feature: keyof AllFeatureSettings; background: SlideBackground }>
    ) => {
      const { feature, background } = action.payload;
      (state.settings[feature] as any).background = background;
      state.lastSaved = Date.now();

      saveSettingsToStorage(state.settings);
    },

    // Update typography for a specific feature
    updateFeatureTypography: (
      state,
      action: PayloadAction<{ feature: keyof AllFeatureSettings; typography: Partial<any> }>
    ) => {
      const { feature, typography } = action.payload;
      (state.settings[feature] as any).typography = {
        ...(state.settings[feature] as any).typography,
        ...typography
      };
      state.lastSaved = Date.now();

      saveSettingsToStorage(state.settings);
    },

    clearError: (state) => {
      state.error = null;
    }
  },

  extraReducers: (builder) => {
    builder
      // Save settings
      .addCase(saveFeatureSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveFeatureSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload.settings;
        state.lastSaved = action.payload.timestamp;
      })
      .addCase(saveFeatureSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Load settings
      .addCase(loadFeatureSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadFeatureSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(loadFeatureSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Reset settings
      .addCase(resetFeatureSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetFeatureSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload.settings;
        state.lastSaved = action.payload.timestamp;
      })
      .addCase(resetFeatureSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  updateFeatureSettings,
  updateFeatureBackground,
  updateFeatureTypography,
  clearError
} = featureSettingsSlice.actions;

// Selectors
export const selectFeatureSettings = (state: { featureSettings: FeatureSettingsState }) =>
  state.featureSettings.settings;
export const selectScriptureSettings = (state: { featureSettings: FeatureSettingsState }) =>
  state.featureSettings.settings.scriptures;
export const selectSongSettings = (state: { featureSettings: FeatureSettingsState }) =>
  state.featureSettings.settings.songs;
export const selectAnnouncementSettings = (state: { featureSettings: FeatureSettingsState }) =>
  state.featureSettings.settings.announcements;
export const selectFeatureSettingsLoading = (state: { featureSettings: FeatureSettingsState }) =>
  state.featureSettings.isLoading;
export const selectFeatureSettingsError = (state: { featureSettings: FeatureSettingsState }) =>
  state.featureSettings.error;
export const selectFeatureSettingsLastSaved = (state: { featureSettings: FeatureSettingsState }) =>
  state.featureSettings.lastSaved;

export default featureSettingsSlice.reducer;
