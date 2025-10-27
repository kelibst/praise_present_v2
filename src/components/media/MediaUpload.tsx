import React, { useState, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Video as VideoIcon, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../lib/store';
import { uploadMediaItem, setUploadProgress, selectDuplicateMessage, clearDuplicateMessage } from '../../lib/mediaSlice';
import VideoDurationWarning from './VideoDurationWarning';

interface MediaUploadProps {
  /**
   * Media type to accept (images or videos)
   */
  type: 'image' | 'video';

  /**
   * Optional category to assign to uploaded media
   */
  category?: string;

  /**
   * Callback after successful upload
   */
  onUploadComplete?: () => void;
}

const IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

const IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif,.svg';
const VIDEO_EXTENSIONS = '.mp4,.webm,.ogg,.mov';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

// Video duration limits (in seconds)
const MAX_VIDEO_DURATION_SOFT = 5 * 60; // 5 minutes - show warning
const MAX_VIDEO_DURATION_HARD = 10 * 60; // 10 minutes - reject upload

/**
 * MediaUpload - Drag-and-drop file upload component
 *
 * Features:
 * - Drag and drop zone
 * - File picker button
 * - File validation (type and size)
 * - Upload progress indication
 * - Visual feedback for drag state
 */
export const MediaUpload: React.FC<MediaUploadProps> = ({
  type,
  category,
  onUploadComplete,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [showDurationWarning, setShowDurationWarning] = useState(false);
  const [durationWarningType, setDurationWarningType] = useState<'warning' | 'error'>('warning');

  const duplicateMessage = useSelector(selectDuplicateMessage);

  const allowedFormats = type === 'image' ? IMAGE_FORMATS : VIDEO_FORMATS;
  const allowedExtensions = type === 'image' ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS;
  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

  // Clear duplicate message when component unmounts or type changes
  useEffect(() => {
    return () => {
      dispatch(clearDuplicateMessage());
    };
  }, [dispatch, type]);

  /**
   * Validate file type and size
   */
  const validateFile = (file: File): string | null => {
    if (!allowedFormats.includes(file.type)) {
      return `Invalid file type. Allowed: ${allowedExtensions}`;
    }

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null;
  };

  /**
   * Get video duration using HTML5 video element
   */
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;

        // Check for invalid durations
        if (!isFinite(duration) || duration === 0) {
          reject(new Error('Could not determine video duration'));
          return;
        }

        resolve(duration);
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  /**
   * Validate video duration
   * Returns: null (ok), 'warning' (5-10min), or 'error' (>10min)
   */
  const validateVideoDuration = (duration: number): 'ok' | 'warning' | 'error' => {
    if (duration > MAX_VIDEO_DURATION_HARD) {
      return 'error';
    }
    if (duration > MAX_VIDEO_DURATION_SOFT) {
      return 'warning';
    }
    return 'ok';
  };

  /**
   * Proceed with file upload (after validation)
   */
  const proceedWithUpload = async (file: File) => {
    setIsUploading(true);

    try {
      // For Electron, we'll pass the file path
      // In a real implementation, we'd use the file system API
      // For now, we'll create a data URL
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string;

          // Upload via IPC
          await dispatch(
            uploadMediaItem({
              filePath: result, // In production, this would be a real file path
              type,
              category,
            })
          ).unwrap();

          setIsUploading(false);
          setPendingFile(null);
          onUploadComplete?.();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed');
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
    }
  };

  /**
   * Handle file upload with duration validation for videos
   */
  const handleFileUpload = async (file: File) => {
    setError(null);

    // Validate file type and size
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // For videos, check duration before uploading
    if (type === 'video') {
      try {
        const duration = await getVideoDuration(file);
        const durationValidation = validateVideoDuration(duration);

        if (durationValidation === 'error') {
          // Block upload - show error modal
          setVideoDuration(duration);
          setDurationWarningType('error');
          setShowDurationWarning(true);
          setPendingFile(null); // Don't save file for error
          return;
        }

        if (durationValidation === 'warning') {
          // Show warning - allow user to decide
          setVideoDuration(duration);
          setDurationWarningType('warning');
          setShowDurationWarning(true);
          setPendingFile(file); // Save file for later upload if user confirms
          return;
        }

        // Duration is OK, proceed with upload
        await proceedWithUpload(file);
      } catch (err) {
        // Could not get duration - allow upload anyway with warning
        console.warn('Could not determine video duration:', err);
        setError('Could not determine video duration. Uploading anyway...');
        await proceedWithUpload(file);
      }
    } else {
      // Images don't need duration check
      await proceedWithUpload(file);
    }
  };

  /**
   * Handle duration warning confirm (user wants to upload anyway)
   */
  const handleDurationWarningConfirm = async () => {
    setShowDurationWarning(false);
    if (pendingFile) {
      await proceedWithUpload(pendingFile);
    }
  };

  /**
   * Handle duration warning cancel
   */
  const handleDurationWarningCancel = () => {
    setShowDurationWarning(false);
    setPendingFile(null);
    setVideoDuration(0);
  };

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]); // Upload first file only
      }
    },
    [type, category]
  );

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="w-full">
      {/* Upload Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-all duration-200 ease-in-out
          ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.02]'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Upload Icon and Text */}
        <div className="flex flex-col items-center justify-center gap-4">
          {type === 'image' ? (
            <ImageIcon className="w-12 h-12 text-gray-400" />
          ) : (
            <VideoIcon className="w-12 h-12 text-gray-400" />
          )}

          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              {isDragging
                ? `Drop ${type} here`
                : `Drag and drop ${type}s here`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse
            </p>
          </div>

          {/* File Input */}
          <input
            type="file"
            accept={allowedExtensions}
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          {/* Upload Button */}
          <button
            className="
              flex items-center gap-2 px-4 py-2
              bg-primary text-primary-foreground
              rounded-md hover:bg-primary/90
              transition-colors
              pointer-events-none
            "
          >
            <Upload className="w-4 h-4" />
            <span>Select {type}</span>
          </button>

          {/* File Info */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Supported formats: {allowedExtensions}</p>
            <p>Maximum size: {maxSize / (1024 * 1024)}MB</p>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Duplicate Message */}
      {duplicateMessage && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Duplicate File Detected
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                {duplicateMessage}
              </p>
            </div>
            <button
              onClick={() => dispatch(clearDuplicateMessage())}
              className="text-yellow-500 hover:text-yellow-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Upload Failed
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Video Duration Warning Modal */}
      <VideoDurationWarning
        duration={videoDuration}
        type={durationWarningType}
        open={showDurationWarning}
        onConfirm={durationWarningType === 'warning' ? handleDurationWarningConfirm : undefined}
        onCancel={handleDurationWarningCancel}
      />
    </div>
  );
};

export default MediaUpload;
