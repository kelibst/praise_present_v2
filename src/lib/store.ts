import { configureStore } from '@reduxjs/toolkit';
import presentationSlice from './presentationSlice';
import bibleSlice from './bibleSlice';
import settingsSlice from './settingSlice';

// Store configuration with presentation slice
export const store = configureStore({
  reducer: {
    presentation: presentationSlice,
    bible: bibleSlice,
    settings: settingsSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;