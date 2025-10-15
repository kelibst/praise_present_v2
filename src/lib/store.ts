import { configureStore } from '@reduxjs/toolkit';
import presentationSlice from './presentationSlice';
import bibleSlice from './bibleSlice';
import settingsSlice from './settingSlice';
import featureSettingsSlice from './featureSettingsSlice';
import serviceItemsSlice from './serviceItemsSlice';

// Store configuration with presentation slice
export const store = configureStore({
  reducer: {
    presentation: presentationSlice,
    bible: bibleSlice,
    settings: settingsSlice,
    featureSettings: featureSettingsSlice,
    serviceItems: serviceItemsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore serviceItems completely - we handle serialization manually
        // Shape instances need to stay as class instances for rendering
        // We serialize/deserialize when saving to/loading from localStorage
        ignoredActionPaths: ['payload', 'payload.slides', 'meta.arg'],
        ignoredPaths: ['serviceItems'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;