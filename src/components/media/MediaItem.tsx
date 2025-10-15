import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Trash2,
  Eye,
  Check,
  Monitor,
  Calendar,
} from 'lucide-react';
import { MediaItem as MediaItemType } from '@prisma/client';

interface MediaItemProps {
  /**
   * Media item data
   */
  item: MediaItemType;

  /**
   * Whether this item is selected
   */
  isSelected?: boolean;

  /**
   * Callback when item is clicked
   */
  onClick?: (item: MediaItemType) => void;

  /**
   * Callback when item is selected (checkbox)
   */
  onSelect?: (item: MediaItemType) => void;

  /**
   * Callback when view is requested
   */
  onView?: (item: MediaItemType) => void;

  /**
   * Callback when use as background is requested
   */
  onUseAsBackground?: (item: MediaItemType) => void;

  /**
   * Callback when delete is requested
   */
  onDelete?: (item: MediaItemType) => void;
}

/**
 * MediaItem - Individual media card component
 *
 * Features:
 * - Thumbnail display (image or video poster)
 * - Metadata overlay on hover
 * - Selection checkbox
 * - Action buttons (View, Use, Delete)
 * - File size badge
 * - Type indicator icon
 */
export const MediaItem: React.FC<MediaItemProps> = ({
  item,
  isSelected = false,
  onClick,
  onSelect,
  onView,
  onUseAsBackground,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  /**
   * Format file size to human readable
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Format date to relative time
   */
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const isImage = item.type === 'image';
  const isVideo = item.type === 'video';

  return (
    <div
      className={`
        relative group rounded-lg overflow-hidden
        bg-secondary border-2 transition-all duration-200
        ${
          isSelected
            ? 'border-primary shadow-lg scale-[1.02]'
            : 'border-transparent hover:border-primary/50 hover:shadow-md'
        }
        cursor-pointer
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(item)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
        {isImage && !imageError ? (
          <img
            src={item.path}
            alt={item.originalName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : isVideo && !imageError ? (
          <div className="relative w-full h-full">
            <video
              src={item.path}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            {/* Play icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="w-12 h-12 text-white" fill="white" />
            </div>
          </div>
        ) : (
          // Fallback placeholder
          <div className="w-full h-full flex items-center justify-center">
            {isImage ? (
              <ImageIcon className="w-16 h-16 text-gray-400" />
            ) : (
              <VideoIcon className="w-16 h-16 text-gray-400" />
            )}
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-xs font-medium text-white flex items-center gap-1">
          {isImage ? (
            <ImageIcon className="w-3 h-3" />
          ) : (
            <VideoIcon className="w-3 h-3" />
          )}
          {item.type.toUpperCase()}
        </div>

        {/* Selection Checkbox */}
        {onSelect && (
          <button
            className={`
              absolute top-2 right-2 w-6 h-6 rounded
              flex items-center justify-center
              transition-all duration-200
              ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300'
              }
              ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'}
            `}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
          >
            {isSelected && <Check className="w-4 h-4" />}
          </button>
        )}

        {/* Action Buttons (on hover) */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
            {onView && (
              <button
                className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(item);
                }}
                title="View"
              >
                <Eye className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
            )}

            {onUseAsBackground && (
              <button
                className="p-2 bg-primary/90 rounded-full hover:bg-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onUseAsBackground(item);
                }}
                title="Use as Background"
              >
                <Monitor className="w-5 h-5 text-primary-foreground" />
              </button>
            )}

            {onDelete && (
              <button
                className="p-2 bg-red-500/90 rounded-full hover:bg-red-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                title="Delete"
              >
                <Trash2 className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-3">
        {/* Filename */}
        <p
          className="text-sm font-medium text-foreground truncate"
          title={item.originalName}
        >
          {item.originalName}
        </p>

        {/* Details */}
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(item.createdAt)}</span>
          </div>

          <span className="font-medium">{formatFileSize(item.size)}</span>
        </div>

        {/* Dimensions (if available) */}
        {item.width && item.height && (
          <p className="text-xs text-muted-foreground mt-1">
            {item.width} × {item.height}
            {item.duration && ` • ${Math.floor(item.duration)}s`}
          </p>
        )}

        {/* Category Tag */}
        {item.category && (
          <div className="mt-2">
            <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
              {item.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaItem;
