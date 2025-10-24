import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../lib/store';
import {
  selectServiceItems,
  updateServiceItem,
  addServiceItem as addServiceItemAction,
  reorderServiceItems,
  setServiceItems
} from '../../lib/serviceItemsSlice';
import { ServiceItem } from '../../components/service/ServiceItem';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';

interface UseServiceItemsProps {
  generateSlidesForItem: (item: ServiceItem, autoPresent?: boolean) => Promise<ServiceItem | null>;
  setSelectedItem: (item: ServiceItem | null) => void;
  setCurrentSlideIndex: (index: number) => void;
  setPresentationMode: (mode: 'preview' | 'live') => void;
  sendSlideToLive: (slide: any, item: ServiceItem, index: number) => Promise<void>;
  liveDisplayActive: boolean;
  createLiveDisplay: () => Promise<void>;
  setIsPresenting: (presenting: boolean) => void;
}

/**
 * Custom hook for service item management (CRUD, reordering, selection, presentation)
 */
export const useServiceItems = ({
  generateSlidesForItem,
  setSelectedItem,
  setCurrentSlideIndex,
  setPresentationMode,
  sendSlideToLive,
  liveDisplayActive,
  createLiveDisplay,
  setIsPresenting
}: UseServiceItemsProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const serviceItems = useSelector(selectServiceItems);

  /**
   * Add a new service item
   */
  const addServiceItem = useCallback((item: ServiceItem) => {
    const newItem = {
      ...item,
      id: `${item.type}-${Date.now()}`,
      order: serviceItems.length + 1
    };
    dispatch(addServiceItemAction(newItem));
  }, [dispatch, serviceItems.length]);

  /**
   * Handle service item selection (single click) - Preview
   */
  const handleServiceItemSelect = useCallback((item: ServiceItem, event: React.MouseEvent) => {
    event.stopPropagation();

    // CRITICAL: Only generate slides if they don't exist
    // This preserves toolbar edits made to existing slides
    if (!item.slides || item.slides.length === 0) {
      console.log('📝 Generating slides for new item:', item.id);
      generateSlidesForItem(item, false);
    } else {
      console.log('✅ Using existing slides for item:', item.id, 'slides:', item.slides.length);
      setSelectedItem(item);
      setCurrentSlideIndex(0);
      setPresentationMode('preview');
    }
  }, [generateSlidesForItem, setSelectedItem, setCurrentSlideIndex, setPresentationMode]);

  /**
   * Handle service item presentation (double click) - Present Live
   */
  const handleServiceItemPresent = useCallback(async (item: ServiceItem, event: React.MouseEvent) => {
    event.stopPropagation();

    const needsGeneration = !item.slides || item.slides.length === 0;

    if (!liveDisplayActive) {
      // Create live display if it doesn't exist
      await createLiveDisplay();
      // Wait a moment for live display to be ready
      setTimeout(() => {
        if (needsGeneration) {
          generateSlidesForItem(item, true);
        } else {
          setSelectedItem(item);
          setCurrentSlideIndex(0);
          setPresentationMode('live');
          if (item.slides && item.slides.length > 0) {
            sendSlideToLive(item.slides[0], item, 0);
            setIsPresenting(true);
          }
        }
      }, 500);
    } else {
      if (needsGeneration) {
        generateSlidesForItem(item, true);
      } else {
        setSelectedItem(item);
        setCurrentSlideIndex(0);
        setPresentationMode('live');
        if (item.slides && item.slides.length > 0) {
          sendSlideToLive(item.slides[0], item, 0);
          setIsPresenting(true);
        }
      }
    }
  }, [
    liveDisplayActive,
    createLiveDisplay,
    generateSlidesForItem,
    setSelectedItem,
    setCurrentSlideIndex,
    setPresentationMode,
    sendSlideToLive,
    setIsPresenting
  ]);

  /**
   * Handle service item edit
   */
  const handleServiceItemEdit = useCallback((item: ServiceItem) => {
    console.log('📝 Editing service item:', item.id);
    // Edit functionality - could open a modal or inline editor
    // For now, just select the item
    setSelectedItem(item);
  }, [setSelectedItem]);

  /**
   * Handle service item deletion
   */
  const handleServiceItemDelete = useCallback((itemId: string) => {
    console.log('🗑️ Deleting service item:', itemId);
    const updatedItems = serviceItems.filter(item => item.id !== itemId);
    dispatch(setServiceItems(updatedItems));
  }, [dispatch, serviceItems]);

  /**
   * Handle drag end for service item reordering
   */
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = serviceItems.findIndex((item) => item.id === active.id);
    const newIndex = serviceItems.findIndex((item) => item.id === over.id);

    const reorderedItems = arrayMove(serviceItems, oldIndex, newIndex);

    // Update order numbers and dispatch to Redux
    const itemsWithOrder = reorderedItems.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    dispatch(reorderServiceItems(itemsWithOrder));
  }, [dispatch, serviceItems]);

  /**
   * Quick add announcement
   */
  const quickAddAnnouncement = useCallback(() => {
    const announcement: ServiceItem = {
      id: `announcement-${Date.now()}`,
      type: 'announcement',
      title: 'New Announcement',
      content: {
        text: 'Announcement text',
        description: ''
      },
      duration: 60,
      order: serviceItems.length + 1
    };
    addServiceItem(announcement);
    generateSlidesForItem(announcement);
  }, [addServiceItem, generateSlidesForItem, serviceItems.length]);

  /**
   * Add inline song at specific position
   */
  const addInlineSong = useCallback(async (song: any, position: number) => {
    const songItem: ServiceItem = {
      id: `song-${Date.now()}`,
      type: 'song',
      title: song.title,
      content: {
        lyrics: song.lyrics || '',
        artist: song.artist || ''
      },
      order: position + 1
    };

    // Insert at specific position
    const newItems = [...serviceItems];
    newItems.splice(position, 0, songItem);

    // Update order for all items
    const reorderedItems = newItems.map((item, index) => ({ ...item, order: index + 1 }));
    dispatch(setServiceItems(reorderedItems));

    // Generate slides for the new song
    await generateSlidesForItem(songItem);
  }, [dispatch, serviceItems, generateSlidesForItem]);

  /**
   * Add inline scripture at specific position
   */
  const addInlineScripture = useCallback(async (scripture: any, position: number) => {
    const scriptureItem: ServiceItem = {
      id: `scripture-${Date.now()}`,
      type: 'scripture',
      title: scripture.reference,
      content: {
        reference: scripture.reference,
        book: scripture.book,
        chapter: scripture.chapter,
        verses: scripture.text ? [scripture] : []
      },
      order: position + 1
    };

    const newItems = [...serviceItems];
    newItems.splice(position, 0, scriptureItem);

    const reorderedItems = newItems.map((item, index) => ({ ...item, order: index + 1 }));
    dispatch(setServiceItems(reorderedItems));

    await generateSlidesForItem(scriptureItem);
  }, [dispatch, serviceItems, generateSlidesForItem]);

  /**
   * Add inline presentation at specific position
   */
  const addInlinePresentation = useCallback(async (presentation: any, position: number) => {
    const presentationItem: ServiceItem = {
      id: `media-${Date.now()}`,
      type: 'media',
      title: presentation.title,
      content: presentation.content || {},
      order: position + 1
    };

    const newItems = [...serviceItems];
    newItems.splice(position, 0, presentationItem);

    const reorderedItems = newItems.map((item, index) => ({ ...item, order: index + 1 }));
    dispatch(setServiceItems(reorderedItems));

    await generateSlidesForItem(presentationItem);
  }, [dispatch, serviceItems, generateSlidesForItem]);

  /**
   * Add inline announcement at specific position
   */
  const addInlineAnnouncement = useCallback(async (
    announcement: { title: string; content: string; duration?: number },
    position: number
  ) => {
    const announcementItem: ServiceItem = {
      id: `announcement-${Date.now()}`,
      type: 'announcement',
      title: announcement.title,
      content: {
        text: announcement.content,
        description: ''
      },
      duration: announcement.duration || 60,
      order: position + 1
    };

    const newItems = [...serviceItems];
    newItems.splice(position, 0, announcementItem);

    const reorderedItems = newItems.map((item, index) => ({ ...item, order: index + 1 }));
    dispatch(setServiceItems(reorderedItems));

    await generateSlidesForItem(announcementItem);
  }, [dispatch, serviceItems, generateSlidesForItem]);

  return {
    serviceItems,
    addServiceItem,
    handleServiceItemSelect,
    handleServiceItemPresent,
    handleServiceItemEdit,
    handleServiceItemDelete,
    handleDragEnd,
    quickAddAnnouncement,
    addInlineSong,
    addInlineScripture,
    addInlinePresentation,
    addInlineAnnouncement
  };
};
