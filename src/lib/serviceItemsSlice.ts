import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ServiceItem } from '../components/service/ServiceItem';
import { serializeSlides, deserializeSlides } from './utils/shapeSerializer';

export interface ServiceItemsState {
  items: ServiceItem[];
  isLoading: boolean;
  error: string | null;
  lastSaved: number | null;
}

// Load service items from localStorage
const loadServiceItemsFromStorage = (): ServiceItem[] => {
  try {
    const stored = localStorage.getItem('praisePresent_serviceItems');
    if (stored) {
      const parsed = JSON.parse(stored);

      // Deserialize slides (convert plain objects back to Shape instances)
      const itemsWithDeserializedSlides = parsed.map((item: any) => ({
        ...item,
        slides: item.slides ? deserializeSlides(item.slides) : undefined
      }));

      console.log('📦 Redux: Loaded service items from localStorage:', {
        count: itemsWithDeserializedSlides.length,
        items: itemsWithDeserializedSlides.map((item: ServiceItem) => ({
          id: item.id,
          title: item.title,
          hasSlides: !!item.slides,
          slideCount: item.slides?.length || 0
        }))
      });

      return itemsWithDeserializedSlides;
    }
  } catch (error) {
    console.warn('Redux: Failed to load service items from localStorage:', error);
  }
  return [];
};

// Save service items to localStorage
const saveServiceItemsToStorage = (items: ServiceItem[]): void => {
  try {
    // Serialize slides (convert Shape instances to plain objects)
    const itemsWithSerializedSlides = items.map(item => ({
      ...item,
      slides: item.slides ? serializeSlides(item.slides) : undefined
    }));

    localStorage.setItem('praisePresent_serviceItems', JSON.stringify(itemsWithSerializedSlides));
    console.log('💾 Redux: Saved service items to localStorage:', {
      count: items.length,
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        slideCount: item.slides?.length || 0
      }))
    });
  } catch (error) {
    console.error('Redux: Failed to save service items to localStorage:', error);
  }
};

const initialState: ServiceItemsState = {
  items: loadServiceItemsFromStorage(),
  isLoading: false,
  error: null,
  lastSaved: null
};

// Async thunk for saving service items to database
export const saveServiceItemsToDatabase = createAsyncThunk(
  'serviceItems/saveToDatabase',
  async (items: ServiceItem[], { rejectWithValue }) => {
    try {
      // TODO: Implement database save via IPC
      // For each item, serialize slides to JSON string
      // await window.electronAPI?.invoke('db:saveServiceItems', items.map(item => ({
      //   ...item,
      //   slides: JSON.stringify(item.slides)
      // })));

      // Save to localStorage as fallback
      saveServiceItemsToStorage(items);

      return { items, timestamp: Date.now() };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to save service items'
      );
    }
  }
);

// Async thunk for loading service items from database
export const loadServiceItemsFromDatabase = createAsyncThunk(
  'serviceItems/loadFromDatabase',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Load from database via IPC
      // const dbItems = await window.electronAPI?.invoke('db:loadServiceItems');
      // if (dbItems) {
      //   // Parse slides JSON strings back to objects
      //   return dbItems.map((item: any) => ({
      //     ...item,
      //     slides: item.slides ? JSON.parse(item.slides) : undefined
      //   }));
      // }

      // For now, load from localStorage
      return loadServiceItemsFromStorage();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to load service items'
      );
    }
  }
);

const serviceItemsSlice = createSlice({
  name: 'serviceItems',
  initialState,
  reducers: {
    // Add a new service item
    addServiceItem: (state, action: PayloadAction<ServiceItem>) => {
      state.items.push(action.payload);
      state.lastSaved = Date.now();
      saveServiceItemsToStorage(state.items);
    },

    // Update an existing service item
    updateServiceItem: (state, action: PayloadAction<ServiceItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
        state.lastSaved = Date.now();
        saveServiceItemsToStorage(state.items);

        console.log('✅ Redux: Updated service item:', {
          id: action.payload.id,
          title: action.payload.title,
          slideCount: action.payload.slides?.length || 0
        });
      }
    },

    // Update slides for a specific service item
    updateServiceItemSlides: (
      state,
      action: PayloadAction<{ itemId: string; slides: any[] }>
    ) => {
      const index = state.items.findIndex(item => item.id === action.payload.itemId);
      if (index !== -1) {
        state.items[index].slides = action.payload.slides;
        state.lastSaved = Date.now();
        saveServiceItemsToStorage(state.items);

        console.log('🎨 Redux: Updated service item slides:', {
          itemId: action.payload.itemId,
          slideCount: action.payload.slides.length
        });
      }
    },

    // Remove a service item
    removeServiceItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.lastSaved = Date.now();
      saveServiceItemsToStorage(state.items);
    },

    // Reorder service items
    reorderServiceItems: (state, action: PayloadAction<ServiceItem[]>) => {
      state.items = action.payload;
      state.lastSaved = Date.now();
      saveServiceItemsToStorage(state.items);
    },

    // Set all service items (replace entire list)
    setServiceItems: (state, action: PayloadAction<ServiceItem[]>) => {
      state.items = action.payload;
      state.lastSaved = Date.now();
      saveServiceItemsToStorage(state.items);
    },

    // Clear all service items
    clearServiceItems: (state) => {
      state.items = [];
      state.lastSaved = Date.now();
      saveServiceItemsToStorage([]);
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    }
  },

  extraReducers: (builder) => {
    builder
      // Save to database
      .addCase(saveServiceItemsToDatabase.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveServiceItemsToDatabase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.lastSaved = action.payload.timestamp;
      })
      .addCase(saveServiceItemsToDatabase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Load from database
      .addCase(loadServiceItemsFromDatabase.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadServiceItemsFromDatabase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(loadServiceItemsFromDatabase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  addServiceItem,
  updateServiceItem,
  updateServiceItemSlides,
  removeServiceItem,
  reorderServiceItems,
  setServiceItems,
  clearServiceItems,
  clearError
} = serviceItemsSlice.actions;

// Selectors
export const selectServiceItems = (state: { serviceItems: ServiceItemsState }) =>
  state.serviceItems.items;
export const selectServiceItemById = (itemId: string) => (state: { serviceItems: ServiceItemsState }) =>
  state.serviceItems.items.find(item => item.id === itemId);
export const selectServiceItemsLoading = (state: { serviceItems: ServiceItemsState }) =>
  state.serviceItems.isLoading;
export const selectServiceItemsError = (state: { serviceItems: ServiceItemsState }) =>
  state.serviceItems.error;
export const selectServiceItemsLastSaved = (state: { serviceItems: ServiceItemsState }) =>
  state.serviceItems.lastSaved;

export default serviceItemsSlice.reducer;
