/**
 * Hook for lazy loading and caching chapter verses
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Book } from '../../../../lib/bibleSlice';
import { ScriptureVerse, bibleService } from '../../../../lib/services/bibleService';
import { ChapterData, ChapterVerseCache, LoadingState } from '../types';

interface UseChapterVersesParams {
  book: Book | null;
  chapter: number | null;
  versionId: string;
  cacheSize?: number;
  debounceMs?: number;
}

interface UseChapterVersesReturn {
  verses: ScriptureVerse[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
  getCachedChapters: () => string[];
}

export const useChapterVerses = ({
  book,
  chapter,
  versionId,
  cacheSize = 20,
  debounceMs = 300
}: UseChapterVersesParams): UseChapterVersesReturn => {
  const [verses, setVerses] = useState<ScriptureVerse[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    retryCount: 0
  });

  const cacheRef = useRef<ChapterVerseCache>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate cache key
  const getCacheKey = useCallback((book: Book, chapter: number, versionId: string): string => {
    return `${book.id}-${chapter}-${versionId}`;
  }, []);

  // Clean up old cache entries if cache is too large
  const cleanupCache = useCallback(() => {
    const keys = Object.keys(cacheRef.current);
    if (keys.length > cacheSize) {
      // Sort by loadedAt timestamp and remove oldest
      const sortedKeys = keys.sort((a, b) => {
        return cacheRef.current[a].loadedAt - cacheRef.current[b].loadedAt;
      });

      const keysToRemove = sortedKeys.slice(0, keys.length - cacheSize);
      keysToRemove.forEach(key => {
        delete cacheRef.current[key];
      });
    }
  }, [cacheSize]);

  // Load verses from API
  const loadVerses = useCallback(async (
    targetBook: Book,
    targetChapter: number,
    targetVersionId: string,
    signal?: AbortSignal
  ): Promise<ScriptureVerse[]> => {
    try {
      setLoadingState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));

      const loadedVerses = await bibleService.getVerses(
        targetVersionId,
        targetBook.id,
        targetChapter
      );

      if (signal?.aborted) {
        throw new Error('Request aborted');
      }

      // Cache the loaded data
      const cacheKey = getCacheKey(targetBook, targetChapter, targetVersionId);
      const chapterData: ChapterData = {
        book: targetBook,
        chapter: targetChapter,
        versionId: targetVersionId,
        verses: loadedVerses,
        loadedAt: Date.now()
      };

      cacheRef.current[cacheKey] = chapterData;
      cleanupCache();

      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        retryCount: 0
      }));

      return loadedVerses;
    } catch (error) {
      if (signal?.aborted) {
        return []; // Don't update state for aborted requests
      }

      console.error('Failed to load chapter verses:', error);

      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load verses',
        retryCount: prev.retryCount + 1
      }));

      return [];
    }
  }, [getCacheKey, cleanupCache]);

  // Track active requests to prevent duplicates
  const activeRequestsRef = useRef<Set<string>>(new Set());

  // Get verses from cache or load them
  const getVerses = useCallback(async (
    targetBook: Book,
    targetChapter: number,
    targetVersionId: string
  ): Promise<ScriptureVerse[]> => {
    const cacheKey = getCacheKey(targetBook, targetChapter, targetVersionId);
    const cachedData = cacheRef.current[cacheKey];

    // Return cached data if available and not too old (5 minutes)
    if (cachedData && Date.now() - cachedData.loadedAt < 5 * 60 * 1000) {
      setVerses(cachedData.verses);
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));
      return cachedData.verses;
    }

    // Prevent duplicate requests for the same data
    if (activeRequestsRef.current.has(cacheKey)) {
      console.log('🔄 Duplicate request prevented for:', cacheKey);
      return verses; // Return current verses while request is in progress
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Mark request as active
    activeRequestsRef.current.add(cacheKey);

    try {
      // Load fresh data
      const loadedVerses = await loadVerses(
        targetBook,
        targetChapter,
        targetVersionId,
        abortControllerRef.current.signal
      );

      setVerses(loadedVerses);
      return loadedVerses;
    } finally {
      // Remove from active requests
      activeRequestsRef.current.delete(cacheKey);
    }
  }, [getCacheKey, loadVerses, verses]);

  // Debounced loading effect
  useEffect(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Skip if we don't have required data
    if (!book || !chapter || !versionId) {
      setVerses([]);
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: null
      }));
      return;
    }

    // Debounce the loading
    debounceTimeoutRef.current = setTimeout(() => {
      getVerses(book, chapter, versionId);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [book, chapter, versionId, getVerses, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Manual refetch function
  const refetch = useCallback(async (): Promise<void> => {
    if (!book || !chapter || !versionId) return;

    // Remove from cache to force fresh load
    const cacheKey = getCacheKey(book, chapter, versionId);
    delete cacheRef.current[cacheKey];

    await getVerses(book, chapter, versionId);
  }, [book, chapter, versionId, getCacheKey, getVerses]);

  // Clear cache function
  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  // Get list of cached chapters
  const getCachedChapters = useCallback((): string[] => {
    return Object.keys(cacheRef.current);
  }, []);

  return {
    verses,
    loading: loadingState.isLoading,
    error: loadingState.error,
    refetch,
    clearCache,
    getCachedChapters
  };
};