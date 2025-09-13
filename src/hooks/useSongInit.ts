import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../lib/store';
import { initializeSongDefaults, selectSongInitialized, selectSongLoading } from '../lib/songSlice';

/**
 * Hook to initialize the song system with defaults
 * Similar to useBibleInit but for songs
 */
export const useSongInit = () => {
  const dispatch = useDispatch<AppDispatch>();
  const initialized = useSelector(selectSongInitialized);
  const loading = useSelector(selectSongLoading);

  useEffect(() => {
    if (!initialized && !loading) {
      console.log('useSongInit: Initializing song system...');
      dispatch(initializeSongDefaults());
    }
  }, [dispatch, initialized, loading]);

  return {
    initialized,
    loading,
  };
}; 