import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  Search,
  Upload as UploadIcon,
  Image as ImageIcon,
  Video as VideoIcon,
} from 'lucide-react';
import { AppDispatch } from '../../lib/store';
import {
  fetchMediaItems,
  selectFilteredMediaItems,
  selectIsLoading,
  setFilterType,
  setSearchQuery,
  selectFilterType,
  selectSearchQuery,
} from '../../lib/mediaSlice';
import { MediaItem as MediaItemType } from '@prisma/client';
import MediaGrid from './MediaGrid';
import MediaUpload from './MediaUpload';

interface MediaPickerDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Callback when dialog should close
   */
  onClose: () => void;

  /**
   * Callback when media is selected
   */
  onSelect: (item: MediaItemType) => void;

  /**
   * Type filter (images only, videos only, or both)
   */
  typeFilter?: 'image' | 'video' | 'all';

  /**
   * Dialog title
   */
  title?: string;
}

/**
 * MediaPickerDialog - Modal dialog for selecting media from library
 *
 * Features:
 * - Browse media library
 * - Search and filter
 * - Upload new media inline
 * - Select media and return to caller
 */
export const MediaPickerDialog: React.FC<MediaPickerDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  typeFilter = 'all',
  title = 'Select Media',
}) => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const items = useSelector(selectFilteredMediaItems);
  const isLoading = useSelector(selectIsLoading);
  const filterType = useSelector(selectFilterType);
  const searchQuery = useSelector(selectSearchQuery);

  // Local state
  const [showUpload, setShowUpload] = useState(false);

  // Load media items when dialog opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchMediaItems());
      // Set filter type based on typeFilter prop
      if (typeFilter !== 'all') {
        dispatch(setFilterType(typeFilter));
      }
    }
  }, [isOpen, typeFilter, dispatch]);

  // Reset search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      dispatch(setSearchQuery(''));
    }
  }, [isOpen, dispatch]);

  /**
   * Handle media item selection
   */
  const handleSelect = (item: MediaItemType) => {
    onSelect(item);
    onClose();
  };

  /**
   * Handle upload completion
   */
  const handleUploadComplete = () => {
    setShowUpload(false);
    dispatch(fetchMediaItems()); // Refresh list
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Dialog */}
      <div className="bg-background rounded-lg shadow-2xl w-[90vw] h-[90vh] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b bg-secondary/30">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Type Filter (only if typeFilter is 'all') */}
          {typeFilter === 'all' && (
            <div className="flex gap-2">
              <button
                onClick={() => dispatch(setFilterType('all'))}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${
                    filterType === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-secondary'
                  }
                `}
              >
                All
              </button>
              <button
                onClick={() => dispatch(setFilterType('image'))}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                  ${
                    filterType === 'image'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-secondary'
                  }
                `}
              >
                <ImageIcon className="w-4 h-4" />
                Images
              </button>
              <button
                onClick={() => dispatch(setFilterType('video'))}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                  ${
                    filterType === 'video'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-secondary'
                  }
                `}
              >
                <VideoIcon className="w-4 h-4" />
                Videos
              </button>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={() => setShowUpload(!showUpload)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${
                showUpload
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-secondary border border-border'
              }
            `}
          >
            <UploadIcon className="w-4 h-4" />
            Upload New
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {showUpload && (
            <div className="mb-6">
              <MediaUpload
                type={typeFilter === 'video' ? 'video' : 'image'}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          )}

          <MediaGrid
            items={items}
            isLoading={isLoading}
            emptyMessage={`No ${typeFilter === 'all' ? 'media' : typeFilter + 's'} found. Upload some to get started!`}
            onItemClick={handleSelect}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-secondary/30">
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? 's' : ''} available
          </p>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-background hover:bg-secondary border border-border rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaPickerDialog;
