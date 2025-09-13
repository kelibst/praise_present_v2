import { DisplayInfo } from "@/services/DisplayManager";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface DisplaySettings {
  selectedLiveDisplayId: number | null;
  isLiveDisplayActive: boolean;
  liveDisplayFullscreen: boolean;
  liveDisplayAlwaysOnTop: boolean;
  testMode: boolean;
}

export interface DisplayState {
  displays: DisplayInfo[];
  primaryDisplay: DisplayInfo | null;
  secondaryDisplay: DisplayInfo | null;
  selectedLiveDisplay: DisplayInfo | null;
  settings: DisplaySettings;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
  displayCaptures: Record<number, string>; // displayId -> base64 image
  capturingDisplays: number[]; // displayIds currently being captured
}

const initialState: DisplayState = {
  displays: [],
  primaryDisplay: null,
  secondaryDisplay: null,
  selectedLiveDisplay: null,
  settings: {
    selectedLiveDisplayId: null,
    isLiveDisplayActive: false,
    liveDisplayFullscreen: true,
    liveDisplayAlwaysOnTop: true,
    testMode: false,
  },
  isLoading: false,
  error: null,
  lastUpdated: 0,
  displayCaptures: {},
  capturingDisplays: [],
};

// Async thunk to get displays from main process
export const refreshDisplays = createAsyncThunk(
  "display/refreshDisplays",
  async (_, { rejectWithValue }) => {
    try {
      // Using the generic IPC invoke pattern
      const result = await window.electronAPI?.invoke("display:getDisplays");
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to get displays"
      );
    }
  }
);

// Async thunk to capture display
export const captureDisplay = createAsyncThunk(
  "display/captureDisplay",
  async (displayId: number, { rejectWithValue }) => {
    try {
      const result = await window.electronAPI?.invoke(
        "display:captureDisplay",
        displayId
      );
      return { displayId, screenshot: result };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to capture display"
      );
    }
  }
);

// Async thunk to test display
export const testDisplay = createAsyncThunk(
  "display/testDisplay",
  async (displayId: number, { rejectWithValue }) => {
    try {
      const result = await window.electronAPI?.invoke(
        "display:testDisplay",
        displayId
      );
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to test display"
      );
    }
  }
);

// Async thunk to save display settings
export const saveDisplaySettings = createAsyncThunk(
  "display/saveDisplaySettings",
  async (settings: Partial<DisplaySettings>, { rejectWithValue }) => {
    try {
      const result = await window.electronAPI?.invoke(
        "display:saveSettings",
        settings
      );
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    }
  }
);

const displaySlice = createSlice({
  name: "display",
  initialState,
  reducers: {
    setDisplays: (state, action: PayloadAction<DisplayInfo[]>) => {
      state.displays = action.payload;
      state.primaryDisplay = action.payload.find((d) => d.isPrimary) || null;
      state.secondaryDisplay = action.payload.find((d) => !d.isPrimary) || null;
      state.lastUpdated = Date.now();
    },

    setSelectedLiveDisplay: (state, action: PayloadAction<number | null>) => {
      const displayId = action.payload;
      state.settings.selectedLiveDisplayId = displayId;
      state.selectedLiveDisplay = displayId
        ? state.displays.find((d) => d.id === displayId) || null
        : null;
    },

    updateDisplaySettings: (
      state,
      action: PayloadAction<Partial<DisplaySettings>>
    ) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    setLiveDisplayActive: (state, action: PayloadAction<boolean>) => {
      state.settings.isLiveDisplayActive = action.payload;
    },

    toggleTestMode: (state) => {
      state.settings.testMode = !state.settings.testMode;
    },

    clearDisplayError: (state) => {
      state.error = null;
    },

    setDisplayError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    clearDisplayCapture: (state, action: PayloadAction<number>) => {
      delete state.displayCaptures[action.payload];
    },

    clearAllDisplayCaptures: (state) => {
      state.displayCaptures = {};
    },
  },

  extraReducers: (builder) => {
    builder
      // Refresh displays
      .addCase(refreshDisplays.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshDisplays.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          const { displays, primaryDisplay, secondaryDisplay } = action.payload;
          state.displays = displays;
          state.primaryDisplay = primaryDisplay;
          state.secondaryDisplay = secondaryDisplay;
          state.lastUpdated = Date.now();

          // Update selected display if it's no longer available
          if (state.settings.selectedLiveDisplayId) {
            const stillExists = displays.find(
              (d: DisplayInfo) => d.id === state.settings.selectedLiveDisplayId
            );
            if (!stillExists) {
              state.settings.selectedLiveDisplayId = null;
              state.selectedLiveDisplay = null;
            } else {
              state.selectedLiveDisplay = stillExists;
            }
          }
        }
      })
      .addCase(refreshDisplays.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Capture display
      .addCase(captureDisplay.pending, (state, action) => {
        const displayId = action.meta.arg;
        if (!state.capturingDisplays.includes(displayId)) {
          state.capturingDisplays.push(displayId);
        }
      })
      .addCase(captureDisplay.fulfilled, (state, action) => {
        const { displayId, screenshot } = action.payload;
        state.capturingDisplays = state.capturingDisplays.filter(
          (id) => id !== displayId
        );
        if (screenshot) {
          state.displayCaptures[displayId] = screenshot;
        }
      })
      .addCase(captureDisplay.rejected, (state, action) => {
        const displayId = action.meta.arg;
        state.capturingDisplays = state.capturingDisplays.filter(
          (id) => id !== displayId
        );
        state.error = action.payload as string;
      })

      // Test display
      .addCase(testDisplay.pending, (state) => {
        state.settings.testMode = true;
      })
      .addCase(testDisplay.fulfilled, (state) => {
        state.settings.testMode = false;
      })
      .addCase(testDisplay.rejected, (state, action) => {
        state.settings.testMode = false;
        state.error = action.payload as string;
      })

      // Save settings
      .addCase(saveDisplaySettings.fulfilled, (state, action) => {
        if (action.payload) {
          state.settings = { ...state.settings, ...action.payload };
        }
      })
      .addCase(saveDisplaySettings.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setDisplays,
  setSelectedLiveDisplay,
  updateDisplaySettings,
  setLiveDisplayActive,
  toggleTestMode,
  clearDisplayError,
  setDisplayError,
  clearDisplayCapture,
  clearAllDisplayCaptures,
} = displaySlice.actions;

export default displaySlice.reducer;

// Selectors
export const selectDisplays = (state: { display: DisplayState }) =>
  state.display.displays;
export const selectPrimaryDisplay = (state: { display: DisplayState }) =>
  state.display.primaryDisplay;
export const selectSecondaryDisplay = (state: { display: DisplayState }) =>
  state.display.secondaryDisplay;
export const selectSelectedLiveDisplay = (state: { display: DisplayState }) =>
  state.display.selectedLiveDisplay;
export const selectDisplaySettings = (state: { display: DisplayState }) =>
  state.display.settings;
export const selectHasMultipleDisplays = (state: { display: DisplayState }) =>
  state.display.displays.length > 1;
export const selectDisplayCount = (state: { display: DisplayState }) =>
  state.display.displays.length;
export const selectDisplayLoading = (state: { display: DisplayState }) =>
  state.display.isLoading;
export const selectDisplayError = (state: { display: DisplayState }) =>
  state.display.error;
export const selectDisplayCaptures = (state: { display: DisplayState }) =>
  state.display.displayCaptures;
export const selectCapturingDisplays = (state: { display: DisplayState }) =>
  state.display.capturingDisplays;
export const selectDisplayCapture =
  (displayId: number) => (state: { display: DisplayState }) =>
    state.display.displayCaptures[displayId];
export const selectIsCapturing =
  (displayId: number) => (state: { display: DisplayState }) =>
    state.display.capturingDisplays.includes(displayId);
