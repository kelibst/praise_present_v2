import { createSlice } from '@reduxjs/toolkit';
import { services as initialServices } from './servicesData';

const servicesSlice = createSlice({
  name: 'services',
  initialState: initialServices,
  reducers: {
    // Add reducers here for future functionality
  },
});

export default servicesSlice.reducer; 