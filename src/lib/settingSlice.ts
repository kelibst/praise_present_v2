import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Define the structure of application settings
export interface AppSettings {
  // Theme settings
  theme: "light" | "dark" | "system";

  // Display settings
  selectedLiveDisplayId: number | null;
  isLiveDisplayActive: boolean;
  liveDisplayFullscreen: boolean;
  liveDisplayAlwaysOnTop: boolean;

  // General settings
  language: string;
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // minutes
  defaultBibleVersion: string | null;

  // Presentation settings
  defaultTransition: "fade" | "slide" | "none";
  transitionDuration: number; // milliseconds

  // Audio settings (for future use)
  audioEnabled: boolean;
  audioVolume: number;

  // Advanced settings
  debugMode: boolean;
  performanceMode: boolean;
}

export interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  lastSaved: number | null;
}

// Default settings
const defaultSettings: AppSettings = {
  theme: "system",
  selectedLiveDisplayId: null,
  isLiveDisplayActive: false,
  liveDisplayFullscreen: true,
  liveDisplayAlwaysOnTop: true,
  language: "en",
  autoSaveEnabled: true,
  autoSaveInterval: 5,
  defaultBibleVersion: null,
  defaultTransition: "fade",
  transitionDuration: 500,
  audioEnabled: true,
  audioVolume: 80,
  debugMode: false,
  performanceMode: false,
};

// Load settings from localStorage
const loadSettingsFromStorage = (): AppSettings => {
  try {
    const stored = localStorage.getItem("praisePresent_settings");
    if (stored) {
      const parsedSettings = JSON.parse(stored);
      // Merge with defaults to ensure all properties exist
      return { ...defaultSettings, ...parsedSettings };
    }
  } catch (error) {
    console.warn("Failed to load settings from localStorage:", error);
  }
  return defaultSettings;
};

// Save settings to localStorage
const saveSettingsToStorage = (settings: AppSettings): void => {
  try {
    localStorage.setItem("praisePresent_settings", JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
};

const initialState: SettingsState = {
  settings: loadSettingsFromStorage(),
  isLoading: false,
  error: null,
  lastSaved: null,
};

// Async thunk for saving settings (could extend to save to server later)
export const saveSettings = createAsyncThunk(
  "settings/saveSettings",
  async (
    settingsUpdate: Partial<AppSettings>,
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { settings: SettingsState };
      const newSettings = { ...state.settings.settings, ...settingsUpdate };

      // Save to localStorage
      saveSettingsToStorage(newSettings);

      // Could also save to main process/database here
      // await window.electronAPI?.invoke('settings:save', newSettings);

      return { settings: newSettings, timestamp: Date.now() };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    }
  }
);

// Async thunk for resetting settings
export const resetSettings = createAsyncThunk(
  "settings/resetSettings",
  async (_, { rejectWithValue }) => {
    try {
      // Clear localStorage
      localStorage.removeItem("praisePresent_settings");

      // Save default settings
      saveSettingsToStorage(defaultSettings);

      return { settings: defaultSettings, timestamp: Date.now() };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to reset settings"
      );
    }
  }
);

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    // Quick settings updates that automatically save
    updateSetting: (
      state,
      action: PayloadAction<{ key: keyof AppSettings; value: any }>
    ) => {
      const { key, value } = action.payload;
      (state.settings as any)[key] = value;
      state.lastSaved = Date.now();

      // Save to localStorage immediately
      saveSettingsToStorage(state.settings);
    },

    updateMultipleSettings: (
      state,
      action: PayloadAction<Partial<AppSettings>>
    ) => {
      state.settings = { ...state.settings, ...action.payload };
      state.lastSaved = Date.now();

      // Save to localStorage immediately
      saveSettingsToStorage(state.settings);
    },

    // Theme-specific actions
    setTheme: (state, action: PayloadAction<"light" | "dark" | "system">) => {
      state.settings.theme = action.payload;
      state.lastSaved = Date.now();
      saveSettingsToStorage(state.settings);
    },

    // Display-specific actions
    setSelectedLiveDisplay: (state, action: PayloadAction<number | null>) => {
      state.settings.selectedLiveDisplayId = action.payload;
      state.lastSaved = Date.now();
      saveSettingsToStorage(state.settings);
    },

    setLiveDisplayActive: (state, action: PayloadAction<boolean>) => {
      state.settings.isLiveDisplayActive = action.payload;
      state.lastSaved = Date.now();
      saveSettingsToStorage(state.settings);
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Save settings
      .addCase(saveSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload.settings;
        state.lastSaved = action.payload.timestamp;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Reset settings
      .addCase(resetSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload.settings;
        state.lastSaved = action.payload.timestamp;
      })
      .addCase(resetSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  updateSetting,
  updateMultipleSettings,
  setTheme,
  setSelectedLiveDisplay,
  setLiveDisplayActive,
  clearError,
} = settingsSlice.actions;

// Selectors
export const selectSettings = (state: { settings: SettingsState }) =>
  state.settings.settings;
export const selectTheme = (state: { settings: SettingsState }) =>
  state.settings.settings.theme;
export const selectSelectedLiveDisplayId = (state: {
  settings: SettingsState;
}) => state.settings.settings.selectedLiveDisplayId;
export const selectIsLiveDisplayActive = (state: { settings: SettingsState }) =>
  state.settings.settings.isLiveDisplayActive;
export const selectSettingsLoading = (state: { settings: SettingsState }) =>
  state.settings.isLoading;
export const selectSettingsError = (state: { settings: SettingsState }) =>
  state.settings.error;
export const selectLastSaved = (state: { settings: SettingsState }) =>
  state.settings.lastSaved;

export default settingsSlice.reducer;
