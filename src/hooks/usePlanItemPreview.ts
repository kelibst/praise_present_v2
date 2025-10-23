import { useState, useEffect, useCallback } from 'react';
import { PlanItemWithContent } from '../types/plan';

/**
 * usePlanItemPreview Hook
 *
 * Manages content loading and status for plan item previews.
 * Handles async content fetching via IPC and status tracking.
 */

export type ContentStatus = 'ready' | 'missing' | 'loading' | 'error';

interface ContentData {
  status: ContentStatus;
  data: any;
  error?: string;
}

export const usePlanItemPreview = (item: PlanItemWithContent) => {
  const [contentData, setContentData] = useState<ContentData>({
    status: 'loading',
    data: null
  });

  const loadContent = useCallback(async () => {
    setContentData({ status: 'loading', data: null });

    try {
      // Check if content reference exists
      const hasContentReference =
        (item.type === 'song' && item.songId) ||
        (item.type === 'scripture' && item.scriptureRef) ||
        (item.type === 'presentation' && item.presentationId) ||
        item.type === 'announcement' ||
        item.type === 'transition';

      if (!hasContentReference) {
        setContentData({
          status: 'missing',
          data: null,
          error: 'No content linked to this item'
        });
        return;
      }

      // For announcements and transitions, content is in the item itself
      if (item.type === 'announcement' || item.type === 'transition') {
        setContentData({
          status: 'ready',
          data: {
            title: item.title,
            notes: item.notes,
            settings: item.settings ? JSON.parse(item.settings) : null
          }
        });
        return;
      }

      // Load content via IPC
      if (!window.electronAPI?.invoke) {
        setContentData({
          status: 'error',
          data: null,
          error: 'Electron API not available'
        });
        return;
      }

      let data = null;

      switch (item.type) {
        case 'song':
          if (item.songId) {
            data = await window.electronAPI.invoke('db:getSong', item.songId);
          }
          break;

        case 'scripture':
          if (item.scriptureRef) {
            const verses = await window.electronAPI.invoke('db:searchVerses', {
              query: item.scriptureRef,
              limit: 20
            });
            data = verses && verses.length > 0 ? { verses } : null;
          }
          break;

        case 'presentation':
          if (item.presentationId) {
            data = await window.electronAPI.invoke('db:getPresentation', item.presentationId);
          }
          break;
      }

      if (data) {
        setContentData({
          status: 'ready',
          data
        });
      } else {
        setContentData({
          status: 'missing',
          data: null,
          error: `${item.type} not found in database`
        });
      }
    } catch (error) {
      console.error('Error loading plan item content:', error);
      setContentData({
        status: 'error',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [item.type, item.songId, item.scriptureRef, item.presentationId, item.title, item.notes, item.settings]);

  // Load content when item changes
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Reload function for manual refresh
  const reload = useCallback(() => {
    loadContent();
  }, [loadContent]);

  return {
    status: contentData.status,
    data: contentData.data,
    error: contentData.error,
    isLoading: contentData.status === 'loading',
    isReady: contentData.status === 'ready',
    isMissing: contentData.status === 'missing',
    isError: contentData.status === 'error',
    reload
  };
};

// Hook for generating thumbnails/previews
export const useItemThumbnail = (item: PlanItemWithContent) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      // For now, return null - thumbnail generation can be implemented later
      // This could use canvas to render a mini version of the slide
      setThumbnail(null);
    };

    generateThumbnail();
  }, [item]);

  return thumbnail;
};

// Hook for checking content readiness
export const useContentReadiness = (items: PlanItemWithContent[]) => {
  const [readiness, setReadiness] = useState<{
    ready: number;
    missing: number;
    total: number;
    percentage: number;
  }>({
    ready: 0,
    missing: 0,
    total: 0,
    percentage: 0
  });

  useEffect(() => {
    const checkReadiness = async () => {
      let ready = 0;
      let missing = 0;

      for (const item of items) {
        // Check if item has content
        const hasContent =
          (item.type === 'song' && item.songId) ||
          (item.type === 'scripture' && item.scriptureRef) ||
          (item.type === 'presentation' && item.presentationId) ||
          item.type === 'announcement' ||
          item.type === 'transition';

        if (hasContent) {
          ready++;
        } else {
          missing++;
        }
      }

      const total = items.length;
      const percentage = total > 0 ? Math.round((ready / total) * 100) : 0;

      setReadiness({
        ready,
        missing,
        total,
        percentage
      });
    };

    checkReadiness();
  }, [items]);

  return readiness;
};

export default usePlanItemPreview;
