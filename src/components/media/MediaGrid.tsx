import React from 'react';
import { MediaItem as MediaItemType } from '@prisma/client';
import MediaItem from './MediaItem';
import { ImageIcon } from 'lucide-react';

interface MediaGridProps {
  /**
   * Media items to display
   */
  items: MediaItemType[];

  /**
   * Selected item IDs
   */
  selectedItems?: string[];

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Empty state message
   */
  emptyMessage?: string;

  /**
   * Callback when item is clicked
   */
  onItemClick?: (item: MediaItemType) => void;

  /**
   * Callback when item is selected
   */
  onItemSelect?: (item: MediaItemType) => void;

  /**
   * Callback when view is requested
   */
  onItemView?: (item: MediaItemType) => void;

  /**
   * Callback when use as background is requested
   */
  onItemUseAsBackground?: (item: MediaItemType) => void;

  /**
   * Callback when delete is requested
   */
  onItemDelete?: (item: MediaItemType) => void;
}

/**
 * MediaGrid - Responsive grid layout for media items
 *
 * Features:
 * - Responsive grid (2-6 columns based on screen size)
 * - Loading skeleton
 * - Empty state
 * - Passes events to individual items
 */
export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  selectedItems = [],
  isLoading = false,
  emptyMessage = 'No media items found',
  onItemClick,
  onItemSelect,
  onItemView,
  onItemUseAsBackground,
  onItemDelete,
}) => {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <ImageIcon className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No Media Found
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {emptyMessage}
        </p>
      </div>
    );
  }

  // Grid display
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {items.map((item) => (
        <MediaItem
          key={item.id}
          item={item}
          isSelected={selectedItems.includes(item.id)}
          onClick={onItemClick}
          onSelect={onItemSelect}
          onView={onItemView}
          onUseAsBackground={onItemUseAsBackground}
          onDelete={onItemDelete}
        />
      ))}
    </div>
  );
};

export default MediaGrid;
