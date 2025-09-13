import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { Verse } from "./bibleSlice";

export interface PresentationItem {
  id: string;
  type: "scripture" | "song" | "media" | "slide" | "placeholder" | "universal-slide";
  title: string;
  content: any; // Flexible content based on type
  reference?: string; // For scripture
  translation?: string; // For scripture
  verse?: Verse; // For scripture items
  universalSlide?: any; // For universal slide items
}

export interface PresentationState {
  previewItem: PresentationItem | null;
  liveItem: PresentationItem | null;
  scriptureList: Verse[];
  selectedVersion: string | null;
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

// Async thunk to send content to live display
export const sendContentToLiveDisplay = createAsyncThunk(
  "presentation/sendContentToLiveDisplay",
  async (content: PresentationItem, { rejectWithValue }) => {
    try {
      // Ensure live display is created (will use selected display or fallback to secondary)
      const liveStatus = await window.electronAPI?.invoke(
        "live-display:getStatus"
      );

      if (!liveStatus?.hasWindow) {
        console.log("Creating live display window...");
        const createResult = await window.electronAPI?.invoke(
          "live-display:create",
          {}
        );
        if (!createResult?.success) {
          throw new Error("Failed to create live display window");
        }
      }

      // Show the live display window
      await window.electronAPI?.invoke("live-display:show");

      // Convert presentation content to live display format
      let liveContent: any = null;

      if (content.type === "scripture") {
        liveContent = {
          type: "scripture",
          reference: content.reference,
          content: content.content,
          verse: content.content,
          title: content.title,
          translation: content.translation,
          subtitle: content.translation,
        };
      } else if (content.type === "placeholder") {
        liveContent = {
          type: "placeholder",
          title: content.title,
          content: content.content,
        };
      } else if (content.type === "song") {
        liveContent = {
          type: "song",
          title: content.title,
          content: content.content,
          lines: content.content?.lines || [],
          subtitle: content.content?.artist || content.content?.album,
        };
      } else if (content.type === "media") {
        liveContent = {
          type: "media",
          title: content.title,
          content: content.content,
          subtitle: content.content?.description,
        };
      } else if (content.type === "slide") {
        liveContent = {
          type: "slide",
          title: content.title,
          content: content.content,
          subtitle: content.content?.notes,
        };
      } else if (content.type === "universal-slide") {
        liveContent = {
          type: "universal-slide",
          title: content.title,
          content: content.content,
          subtitle: content.reference,
          universalSlide: content.universalSlide,
        };
      } else {
        // Handle other content types (announcement, etc.)
        liveContent = {
          type: content.type,
          title: content.title,
          content: content.content,
          subtitle: content.content?.subtitle,
        };
      }

      // Send content to live display
      await window.electronAPI?.invoke("live-display:sendContent", liveContent);

      return content;
    } catch (error) {
      console.error("Failed to send content to live display:", error);
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to send content to live display"
      );
    }
  }
);

// Async thunk specifically for sending verses to live display
export const sendVerseToLiveDisplay = createAsyncThunk(
  "presentation/sendVerseToLiveDisplay",
  async (verse: Verse, { dispatch }) => {
    // Create presentation item from verse
    const presentationItem: PresentationItem = {
      id: verse.id,
      type: "scripture",
      title: `${verse.book?.name} ${verse.chapter}:${verse.verse}`,
      content: verse.text,
      reference: `${verse.book?.name} ${verse.chapter}:${verse.verse}`,
      translation: verse.version?.name,
      verse: verse,
    };

    // Send to live display
    await dispatch(sendContentToLiveDisplay(presentationItem)).unwrap();

    return presentationItem;
  }
);

const initialState: PresentationState = {
  previewItem: createDefaultPlaceholder(),
  liveItem: createDefaultPlaceholder(),
  scriptureList: [],
  selectedVersion: null,
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
        // Note: The actual live display will be updated by the sendContentToLiveDisplay thunk
      }
    },
    clearPreview: (state) => {
      state.previewItem = createDefaultPlaceholder();
    },
    clearLive: (state) => {
      state.liveItem = createDefaultPlaceholder();
    },
    addToScriptureList: (state, action: PayloadAction<Verse>) => {
      // Check if verse already exists in list
      const exists = state.scriptureList.find(
        (v) => v.id === action.payload.id
      );
      if (!exists) {
        state.scriptureList.push(action.payload);
      }
    },
    removeFromScriptureList: (state, action: PayloadAction<string>) => {
      state.scriptureList = state.scriptureList.filter(
        (v) => v.id !== action.payload
      );
    },
    clearScriptureList: (state) => {
      state.scriptureList = [];
    },
    setSelectedVersion: (state, action: PayloadAction<string>) => {
      state.selectedVersion = action.payload;
    },
    sendVerseToPreview: (state, action: PayloadAction<Verse>) => {
      const verse = action.payload;
      const presentationItem: PresentationItem = {
        id: verse.id,
        type: "scripture",
        title: `${verse.book?.name} ${verse.chapter}:${verse.verse}`,
        content: verse.text,
        reference: `${verse.book?.name} ${verse.chapter}:${verse.verse}`,
        translation: verse.version?.name,
        verse: verse,
      };
      state.previewItem = presentationItem;
    },
    sendVerseToLive: (state, action: PayloadAction<Verse>) => {
      const verse = action.payload;
      const presentationItem: PresentationItem = {
        id: verse.id,
        type: "scripture",
        title: `${verse.book?.name} ${verse.chapter}:${verse.verse}`,
        content: verse.text,
        reference: `${verse.book?.name} ${verse.chapter}:${verse.verse}`,
        translation: verse.version?.name,
        verse: verse,
      };
      state.liveItem = presentationItem;
      // Note: The actual live display update will be handled by the middleware or thunk
    },
    resetToPlaceholder: (state) => {
      const placeholder = createDefaultPlaceholder();
      state.previewItem = placeholder;
      state.liveItem = placeholder;
    },
    setPlaceholderToPreview: (state) => {
      state.previewItem = createDefaultPlaceholder();
    },
    setPlaceholderToLive: (state) => {
      state.liveItem = createDefaultPlaceholder();
    },
    initializePresentationSystem: (state) => {
      // Initialize with placeholder if no content is set
      if (!state.previewItem) {
        state.previewItem = createDefaultPlaceholder();
      }
      if (!state.liveItem) {
        state.liveItem = createDefaultPlaceholder();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendContentToLiveDisplay.pending, (state) => {
        // Could add loading state if needed
      })
      .addCase(sendContentToLiveDisplay.fulfilled, (state, action) => {
        // Update the live item in Redux state when content is successfully sent
        state.liveItem = action.payload;
        console.log(
          "Content sent to live display successfully, Redux state updated"
        );
      })
      .addCase(sendContentToLiveDisplay.rejected, (state, action) => {
        console.error(
          "Failed to send content to live display:",
          action.payload
        );
      })
      .addCase(sendVerseToLiveDisplay.fulfilled, (state, action) => {
        // Update the live item in state when verse is successfully sent to live display
        state.liveItem = action.payload;
        console.log("Verse sent to live display successfully");
      })
      .addCase(sendVerseToLiveDisplay.rejected, (state, action) => {
        console.error("Failed to send verse to live display:", action.payload);
      });
  },
});

export const {
  setPreviewItem,
  setLiveItem,
  sendPreviewToLive,
  clearPreview,
  clearLive,
  addToScriptureList,
  removeFromScriptureList,
  clearScriptureList,
  setSelectedVersion,
  sendVerseToPreview,
  sendVerseToLive,
  resetToPlaceholder,
  setPlaceholderToPreview,
  setPlaceholderToLive,
  initializePresentationSystem,
} = presentationSlice.actions;

export default presentationSlice.reducer;
