import { configureStore } from '@reduxjs/toolkit';
import presentationSlice from './presentationSlice';
import bibleSlice from './bibleSlice';
import settingsSlice from './settingSlice';
import featureSettingsSlice from './featureSettingsSlice';
import serviceItemsSlice from './serviceItemsSlice';
import mediaSlice from './mediaSlice';
import scriptureNavigationSlice from './scriptureNavigationSlice';
import planExecutionSlice from './planExecutionSlice';
import uiSlice from './uiSlice';
import { presentationMiddleware } from './middleware/presentationMiddleware';

// Store configuration with presentation slice
export const store = configureStore({
  reducer: {
    presentation: presentationSlice,
    ui: uiSlice,
    bible: bibleSlice,
    settings: settingsSlice,
    featureSettings: featureSettingsSlice,
    serviceItems: serviceItemsSlice,
    media: mediaSlice,
    scriptureNavigation: scriptureNavigationSlice,
    planExecution: planExecutionSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore serviceItems completely - we handle serialization manually
        // Shape instances need to stay as class instances for rendering
        // We serialize/deserialize when saving to/loading from localStorage
        // Ignore media items - they contain Date objects from Prisma
        // Ignore presentation slides - they contain Shape class instances
        ignoredActionPaths: ['payload', 'payload.slides', 'payload.content', 'meta.arg', 'payload.createdAt', 'payload.updatedAt', 'payload.lastUsed'],
        ignoredPaths: ['serviceItems', 'media.items', 'presentation.current.content.slides', 'presentation.display.currentSlide', 'presentation.history'],
      },
    })
    .concat(presentationMiddleware), // Add presentation middleware for auto live display sync
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;