import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import servicesReducer from "./servicesSlice";
import bibleReducer from "./bibleSlice";
import presentationReducer, {
  setLiveItem,
  sendVerseToLive,
  clearLive,
  resetToPlaceholder,
} from "./presentationSlice";
import displayReducer from "./displaySlice";
import settingsReducer from "./settingSlice";
import songsReducer from "./songSlice";
import slidesReducer from "./slidesSlice";
import universalSlideReducer from "./universalSlideSlice";

// Create listener middleware for live display synchronization
const liveDisplayMiddleware = createListenerMiddleware();

// Listen for changes to the live item and sync with live display
liveDisplayMiddleware.startListening({
  actionCreator: setLiveItem,
  effect: async (action, listenerApi) => {
    const liveItem = action.payload;
    console.log("Live display middleware: syncing live item:", liveItem);

    try {
      // Convert presentation content to live display format
      let liveContent: any = null;

      if (liveItem.type === "scripture") {
        liveContent = {
          type: "scripture",
          reference: liveItem.reference,
          content: liveItem.content,
          verse: liveItem.content,
          title: liveItem.title,
          translation: liveItem.translation,
          subtitle: liveItem.translation,
        };
      } else if (liveItem.type === "placeholder") {
        liveContent = {
          type: "placeholder",
          title: liveItem.title,
          content: liveItem.content,
        };
      } else if (liveItem.type === "song") {
        liveContent = {
          type: "song",
          title: liveItem.title,
          content: liveItem.content,
          lines: liveItem.content?.lines || [],
          subtitle: liveItem.content?.artist || liveItem.content?.album,
        };
      } else if (liveItem.type === "media") {
        liveContent = {
          type: "media",
          title: liveItem.title,
          content: liveItem.content,
          subtitle: liveItem.content?.description,
        };
      } else if (liveItem.type === "slide") {
        liveContent = {
          type: "slide",
          title: liveItem.title,
          content: liveItem.content,
          subtitle: liveItem.content?.notes,
        };
      } else {
        // Handle other content types (announcement, etc.)
        liveContent = {
          type: liveItem.type,
          title: liveItem.title,
          content: liveItem.content,
          subtitle: liveItem.content?.subtitle,
        };
      }

      // Send content to live display via IPC
      if (window.electronAPI) {
        await window.electronAPI.invoke(
          "live-display:sendContent",
          liveContent
        );
      }
    } catch (error) {
      console.error("Failed to sync live display via middleware:", error);
    }
  },
});

// Listen for sendVerseToLive action
liveDisplayMiddleware.startListening({
  actionCreator: sendVerseToLive,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const liveItem = state.presentation.liveItem;
    console.log("Live display middleware: verse sent to live:", liveItem);

    try {
      if (liveItem && window.electronAPI) {
        const liveContent = {
          type: "scripture",
          reference: liveItem.reference,
          content: liveItem.content,
          verse: liveItem.content,
          title: liveItem.title,
          translation: liveItem.translation,
          subtitle: liveItem.translation,
        };
        await window.electronAPI.invoke(
          "live-display:sendContent",
          liveContent
        );
      }
    } catch (error) {
      console.error("Failed to sync scripture to live display:", error);
    }
  },
});

// Listen for clearLive action
liveDisplayMiddleware.startListening({
  actionCreator: clearLive,
  effect: async (action, listenerApi) => {
    console.log("Live display middleware: clearing live display");

    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke("live-display:clearContent");
      }
    } catch (error) {
      console.error("Failed to clear live display:", error);
    }
  },
});

// Listen for resetToPlaceholder action
liveDisplayMiddleware.startListening({
  actionCreator: resetToPlaceholder,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const liveItem = state.presentation.liveItem;
    console.log("Live display middleware: resetting to placeholder");

    try {
      if (liveItem && window.electronAPI) {
        const liveContent = {
          type: "placeholder",
          title: liveItem.title,
          content: liveItem.content,
        };
        await window.electronAPI.invoke(
          "live-display:sendContent",
          liveContent
        );
      }
    } catch (error) {
      console.error("Failed to reset live display to placeholder:", error);
    }
  },
});

export const store = configureStore({
  reducer: {
    services: servicesReducer,
    bible: bibleReducer,
    presentation: presentationReducer,
    display: displayReducer,
    settings: settingsReducer,
    songs: songsReducer,
    slides: slidesReducer,
    universalSlides: universalSlideReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(liveDisplayMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
