import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../lib/store';
import { loadTranslations, loadBooks } from '../lib/bibleSlice';

export const useBibleInit = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Initialize Bible data when the app starts
    const initializeBibleData = async () => {
      try {
        console.log('Initializing Bible data...');
        await dispatch(loadTranslations()).unwrap();
        await dispatch(loadBooks()).unwrap();
        console.log('Bible data initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Bible data:', error);
      }
    };

    initializeBibleData();
  }, [dispatch]);
}; 