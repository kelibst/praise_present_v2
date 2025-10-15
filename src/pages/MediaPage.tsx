import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Search,
  Trash2,
  X,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { AppDispatch } from '../lib/store';
import {
  fetchMediaItems,
  deleteMediaItems,
  selectFilteredMediaItems,
  selectIsLoading,
  selectError,
  selectSelectedItems,
  selectFilterType,
  setFilterType,
  setSearchQuery,
  toggleSelectItem,
  clearSelection,
  selectSearchQuery,
} from '../lib/mediaSlice';
import { MediaItem as MediaItemType } from '@prisma/client';
import MediaGrid from '../components/media/MediaGrid';
import MediaUpload from '../components/media/MediaUpload';
import MediaPreview from '../components/media/MediaPreview';
import { useLiveDisplay } from '../components/live/LiveDisplayManager';

/**
 * MediaPage - Main media management page
 *
 * Features:
 * - Category tabs (All, Images, Videos)
 * - Upload area with drag-and-drop
 * - Media grid display
 * - Search and filtering
 * - Bulk selection and delete
 * - Integration with live display
 */
const MediaPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Redux state
  const items = useSelector(selectFilteredMediaItems);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const selectedItems = useSelector(selectSelectedItems);
  const filterType = useSelector(selectFilterType);
  const searchQuery = useSelector(selectSearchQuery);

  // Local state
  const [showUpload, setShowUpload] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItemType | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Live display hook
  const {
    liveDisplayActive,
    createLiveDisplay,
    sendMediaToLive,
  } = useLiveDisplay();

  // Load media items on mount
  useEffect(() => {
    dispatch(fetchMediaItems());
  }, [dispatch]);

  /**
   * Handle category tab change
   */
  const handleCategoryChange = (type: 'all' | 'image' | 'video') => {
    dispatch(setFilterType(type));
    dispatch(clearSelection());
  };

  /**
   * Handle search input
   */
  const handleSearchChange = (query: string) => {
    dispatch(setSearchQuery(query));
  };

  /**
   * Handle item selection
   */
  const handleItemSelect = (item: MediaItemType) => {
    dispatch(toggleSelectItem(item.id));
  };

  /**
   * Handle item view
   */
  const handleItemView = (item: MediaItemType) => {
    setPreviewItem(item);
    setPreviewOpen(true);
  };

  /**
   * Handle send to live display
   */
  const handleSendToLive = async (item: MediaItemType) => {
    // Ensure live display is active
    if (!liveDisplayActive) {
      const create = confirm('Live display is not active. Create it now?');
      if (create) {
        await createLiveDisplay();
      } else {
        return;
      }
    }

    // Send media to live display
    await sendMediaToLive(item, {
      fit: 'contain',
      autoPlay: item.type === 'video',
      loop: item.type === 'video',
    });

    // Show success message (could use toast notification)
    console.log('Sent to live display:', item.originalName);
  };

  /**
   * Handle use as background (alias for send to live)
   */
  const handleUseAsBackground = (item: MediaItemType) => {
    handleSendToLive(item);
  };

  /**
   * Handle add to service
   */
  const handleAddToService = (item: MediaItemType) => {
    // TODO: Create media service item and navigate to LivePresentationPage
    console.log('Add to service:', item);
    // For now, just navigate to live page
    // navigate('/live');
  };

  /**
   * Handle delete single item
   */
  const handleItemDelete = (item: MediaItemType) => {
    if (confirm(`Delete "${item.originalName}"?`)) {
      dispatch(deleteMediaItems([item.id]));
    }
  };

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;

    setDeleteConfirmOpen(false);
    dispatch(deleteMediaItems(selectedItems));
    dispatch(clearSelection());
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    dispatch(fetchMediaItems());
  };

  /**
   * Handle upload complete
   */
  const handleUploadComplete = () => {
    setShowUpload(false);
    dispatch(fetchMediaItems());
  };

  // Statistics
  const stats = {
    total: items.length,
    images: items.filter((item) => item.type === 'image').length,
    videos: items.filter((item) => item.type === 'video').length,
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Media Library</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your images and videos
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="p-2 rounded-md hover:bg-accent transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Upload Toggle Button */}
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                {showUpload ? (
                  <>
                    <X className="w-4 h-4" />
                    Close Upload
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    Upload Media
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`
                px-4 py-2 rounded-md font-medium transition-all
                ${
                  filterType === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-accent'
                }
              `}
            >
              All ({stats.total})
            </button>

            <button
              onClick={() => handleCategoryChange('image')}
              className={`
                px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2
                ${
                  filterType === 'image'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-accent'
                }
              `}
            >
              <ImageIcon className="w-4 h-4" />
              Images ({stats.images})
            </button>

            <button
              onClick={() => handleCategoryChange('video')}
              className={`
                px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2
                ${
                  filterType === 'video'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-accent'
                }
              `}
            >
              <VideoIcon className="w-4 h-4" />
              Videos ({stats.videos})
            </button>
          </div>

          {/* Search Bar and Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedItems.length} selected
                </span>
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => dispatch(clearSelection())}
                  className="px-3 py-2 bg-secondary text-foreground rounded-md hover:bg-accent transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upload Area */}
        {showUpload && (
          <div className="px-6 pb-6">
            <MediaUpload
              type={filterType === 'video' ? 'video' : 'image'}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <MediaGrid
          items={items}
          selectedItems={selectedItems}
          isLoading={isLoading}
          emptyMessage={
            filterType === 'all'
              ? 'No media uploaded yet. Click "Upload Media" to get started.'
              : `No ${filterType}s found. Try uploading some or changing your filters.`
          }
          onItemSelect={handleItemSelect}
          onItemView={handleItemView}
          onItemUseAsBackground={handleUseAsBackground}
          onItemDelete={handleItemDelete}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Delete {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              This action cannot be undone. The media files will be permanently
              deleted from your library.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-secondary text-foreground rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      <MediaPreview
        item={previewItem}
        allItems={items}
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewItem(null);
        }}
        onSendToLive={handleSendToLive}
        onAddToService={handleAddToService}
        onDelete={handleItemDelete}
      />
    </div>
  );
};

export default MediaPage;
