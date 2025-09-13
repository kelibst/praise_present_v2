import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PresentationItem {
  id: string;
  type: "scripture" | "song" | "media" | "slide" | "placeholder";
  title: string;
  content: any;
  reference?: string;
  translation?: string;
}

export interface PresentationState {
  previewItem: PresentationItem | null;
  liveItem: PresentationItem | null;
}

// Create a default placeholder item
export const createDefaultPlaceholder = (): PresentationItem => ({
  id: "default-placeholder",
  type: "placeholder",
  title: "PraisePresent",
  content: {
    mainText: "Welcome to PraisePresent",
    subText: "Presentation System Ready",
    timestamp: new Date().toLocaleTimeString(),
  },
});

const initialState: PresentationState = {
  previewItem: createDefaultPlaceholder(),
  liveItem: createDefaultPlaceholder(),
};

const presentationSlice = createSlice({
  name: "presentation",
  initialState,
  reducers: {
    setPreviewItem: (state, action: PayloadAction<PresentationItem>) => {
      state.previewItem = action.payload;
    },
    setLiveItem: (state, action: PayloadAction<PresentationItem>) => {
      state.liveItem = action.payload;
    },
    sendPreviewToLive: (state) => {
      if (state.previewItem) {
        state.liveItem = state.previewItem;
      }
    },
    clearPreview: (state) => {
      state.previewItem = createDefaultPlaceholder();
    },
    clearLive: (state) => {
      state.liveItem = createDefaultPlaceholder();
    },
    resetToPlaceholder: (state) => {
      const placeholder = createDefaultPlaceholder();
      state.previewItem = placeholder;
      state.liveItem = placeholder;
    },
    // Actions for initialization
    initializePresentationSystem: (state) => {
      // Initialize system state
      console.log("Presentation system initialized");
    },
    sendContentToLiveDisplay: (state, action: PayloadAction<PresentationItem>) => {
      // Send content to live display
      state.liveItem = action.payload;
      console.log("Content sent to live display:", action.payload.title);
    },
  },
});

export const {
  setPreviewItem,
  setLiveItem,
  sendPreviewToLive,
  clearPreview,
  clearLive,
  resetToPlaceholder,
  initializePresentationSystem,
  sendContentToLiveDisplay,
} = presentationSlice.actions;

export default presentationSlice.reducer;