import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Trash2,
  ZoomIn,
  ZoomOut,
  Plus,
  Play,
  Pause,
} from 'lucide-react';
import { MediaItem as MediaItemType } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';

interface MediaPreviewProps {
  /**
   * Media item to preview
   */
  item: MediaItemType | null;

  /**
   * All media items for navigation
   */
  allItems?: MediaItemType[];

  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when modal closes
   */
  onClose: () => void;

  /**
   * Callback when send to live is requested
   */
  onSendToLive?: (item: MediaItemType) => void;

  /**
   * Callback when add to service is requested
   */
  onAddToService?: (item: MediaItemType) => void;

  /**
   * Callback when delete is requested
   */
  onDelete?: (item: MediaItemType) => void;
}

/**
 * MediaPreview - Full-screen media preview modal
 *
 * Features:
 * - Full-screen image/video display
 * - Navigation between items
 * - Zoom controls for images
 * - Video playback controls
 * - Metadata display
 * - Action buttons (Send to Live, Add to Service, Delete)
 * - Keyboard shortcuts
 */
export const MediaPreview: React.FC<MediaPreviewProps> = ({
  item,
  allItems = [],
  open,
  onClose,
  onSendToLive,
  onAddToService,
  onDelete,
}) => {
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  // Reset zoom when item changes
  useEffect(() => {
    setZoom(1);
    setIsPlaying(false);
  }, [item?.id]);

  // Get current item index
  const currentIndex = item && allItems.length > 0
    ? allItems.findIndex((i) => i.id === item.id)
    : -1;

  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex >= 0 && currentIndex < allItems.length - 1;

  /**
   * Navigate to previous item
   */
  const handlePrevious = useCallback(() => {
    if (canNavigatePrev && allItems[currentIndex - 1]) {
      // No need to call onClose, just update the item
      // Parent component should handle this
    }
  }, [canNavigatePrev, currentIndex, allItems]);

  /**
   * Navigate to next item
   */
  const handleNext = useCallback(() => {
    if (canNavigateNext && allItems[currentIndex + 1]) {
      // Parent component should handle this
    }
  }, [canNavigateNext, currentIndex, allItems]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (canNavigatePrev) handlePrevious();
          break;
        case 'ArrowRight':
          if (canNavigateNext) handleNext();
          break;
        case ' ':
          e.preventDefault();
          if (item?.type === 'video' && videoElement) {
            if (isPlaying) {
              videoElement.pause();
            } else {
              videoElement.play();
            }
            setIsPlaying(!isPlaying);
          }
          break;
        case '+':
        case '=':
          if (item?.type === 'image') {
            setZoom((z) => Math.min(z + 0.25, 5));
          }
          break;
        case '-':
        case '_':
          if (item?.type === 'image') {
            setZoom((z) => Math.max(z - 0.25, 0.25));
          }
          break;
        case '0':
          if (item?.type === 'image') {
            setZoom(1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, item, isPlaying, canNavigatePrev, canNavigateNext, handlePrevious, handleNext, onClose, videoElement]);

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Format duration
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!item) return null;

  const isImage = item.type === 'image';
  const isVideo = item.type === 'video';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-screen-2xl w-full h-screen p-0 bg-black/95 border-none">
        {/* Hidden title and description for accessibility */}
        <DialogTitle className="sr-only">
          {item.originalName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Preview of {item.type} file: {item.originalName}.
          {isImage && 'Use +/- keys to zoom, arrow keys to navigate.'}
          {isVideo && 'Use space to play/pause, arrow keys to navigate.'}
        </DialogDescription>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Navigation Arrows */}
        {allItems.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              disabled={!canNavigatePrev}
              className={`
                absolute left-4 top-1/2 -translate-y-1/2 z-50
                p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors
                ${!canNavigatePrev ? 'opacity-30 cursor-not-allowed' : ''}
              `}
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>

            <button
              onClick={handleNext}
              disabled={!canNavigateNext}
              className={`
                absolute right-4 top-1/2 -translate-y-1/2 z-50
                p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors
                ${!canNavigateNext ? 'opacity-30 cursor-not-allowed' : ''}
              `}
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          </>
        )}

        {/* Media Display Area */}
        <div className="flex flex-col items-center justify-center w-full h-full p-8">
          {isImage ? (
            <div className="relative max-w-full max-h-full overflow-auto">
              <img
                src={item.path}
                alt={item.originalName}
                className="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          ) : (
            <div className="relative max-w-full max-h-full">
              <video
                ref={setVideoElement}
                src={item.path}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
          )}

          {/* Zoom Controls for Images */}
          {isImage && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-full px-4 py-2">
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                disabled={zoom <= 0.25}
              >
                <ZoomOut className="w-5 h-5 text-white" />
              </button>
              <span className="text-white font-medium min-w-[4rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.25, 5))}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                disabled={zoom >= 5}
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Metadata and Actions Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6">
          <div className="flex items-end justify-between">
            {/* Metadata */}
            <div className="text-white space-y-1">
              <h3 className="text-xl font-semibold">{item.originalName}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                {item.width && item.height && (
                  <span>{item.width} × {item.height}</span>
                )}
                <span>{formatFileSize(item.size)}</span>
                {item.duration && (
                  <span>{formatDuration(item.duration)}</span>
                )}
                <span className="px-2 py-0.5 bg-white/20 rounded text-xs uppercase">
                  {item.type}
                </span>
                {item.category && (
                  <span className="px-2 py-0.5 bg-primary/30 rounded text-xs">
                    {item.category}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {onSendToLive && (
                <button
                  onClick={() => onSendToLive(item)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors"
                >
                  <Monitor className="w-4 h-4" />
                  Send to Live
                </button>
              )}

              {onAddToService && (
                <button
                  onClick={() => onAddToService(item)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add to Service
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm(`Delete "${item.originalName}"?`)) {
                      onDelete(item);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-4 text-xs text-gray-400 flex items-center gap-4">
            <span>ESC: Close</span>
            {allItems.length > 1 && (
              <span>← →: Navigate</span>
            )}
            {isImage && (
              <span>+/-: Zoom • 0: Reset</span>
            )}
            {isVideo && (
              <span>SPACE: Play/Pause</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPreview;
