import React, { useState } from 'react';
import { Image as ImageIcon, Video as VideoIcon, FolderOpen, Upload as UploadIcon, X } from 'lucide-react';
import { MediaItem as MediaItemType } from '@prisma/client';
import MediaPickerDialog from './MediaPickerDialog';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../lib/store';
import { uploadMediaItem } from '../../lib/mediaSlice';

interface MediaPickerProps {
  /**
   * Type of media to select
   */
  type: 'image' | 'video';

  /**
   * Currently selected media item
   */
  selectedMedia: MediaItemType | null;

  /**
   * Callback when media is selected
   */
  onMediaSelect: (item: MediaItemType) => void;

  /**
   * Callback when media is cleared
   */
  onMediaClear: () => void;

  /**
   * Label for the picker
   */
  label?: string;
}

/**
 * MediaPicker - Compact media picker component
 *
 * Features:
 * - Shows selected media thumbnail
 * - Quick upload button
 * - Browse library button
 * - Clear selection button
 */
export const MediaPicker: React.FC<MediaPickerProps> = ({
  type,
  selectedMedia,
  onMediaSelect,
  onMediaClear,
  label = 'Media',
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  /**
   * Handle file upload via file input
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const result = event.target?.result as string;
          const uploadResult = await dispatch(
            uploadMediaItem({
              filePath: result,
              type,
            })
          ).unwrap();

          // Auto-select the newly uploaded media
          onMediaSelect(uploadResult.data);
          setUploading(false);
        } catch (err) {
          console.error('Upload failed:', err);
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploading(false);
    }

    // Reset input
    e.target.value = '';
  };

  const TypeIcon = type === 'image' ? ImageIcon : VideoIcon;
  const acceptedFormats = type === 'image'
    ? '.jpg,.jpeg,.png,.webp,.gif,.svg'
    : '.mp4,.webm,.ogg,.mov';

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      {/* Selected Media Preview */}
      {selectedMedia ? (
        <div className="relative group">
          {/* Thumbnail */}
          <div className="relative h-32 bg-secondary rounded-lg overflow-hidden">
            {type === 'image' ? (
              <img
                src={selectedMedia.path}
                alt={selectedMedia.originalName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={selectedMedia.path}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                  <VideoIcon className="w-8 h-8 text-white" />
                </div>
              </div>
            )}

            {/* Clear button */}
            <button
              onClick={onMediaClear}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filename */}
          <p className="mt-2 text-sm text-muted-foreground truncate" title={selectedMedia.originalName}>
            {selectedMedia.originalName}
          </p>
        </div>
      ) : (
        /* No Selection - Show Upload/Browse Buttons */
        <div className="space-y-2">
          {/* Quick Upload */}
          <label className="block">
            <input
              type="file"
              accept={acceptedFormats}
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <div
              className={`
                flex items-center justify-center gap-2 h-12 px-4
                border-2 border-dashed rounded-lg cursor-pointer
                transition-colors
                ${
                  uploading
                    ? 'border-gray-300 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                    : 'border-border hover:border-primary hover:bg-secondary'
                }
              `}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                </>
              ) : (
                <>
                  <UploadIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Upload {type}</span>
                </>
              )}
            </div>
          </label>

          {/* Browse Library */}
          <button
            onClick={() => setDialogOpen(true)}
            className="w-full flex items-center justify-center gap-2 h-12 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Browse Library</span>
          </button>
        </div>
      )}

      {/* Media Picker Dialog */}
      <MediaPickerDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={onMediaSelect}
        typeFilter={type}
        title={`Select ${type === 'image' ? 'Image' : 'Video'}`}
      />
    </div>
  );
};

export default MediaPicker;
