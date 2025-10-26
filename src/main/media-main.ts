import { ipcMain } from 'electron';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { MediaService, CreateMediaItemInput } from '../lib/services/mediaService';

/**
 * Media IPC Handlers
 *
 * Handles file upload, storage, and database operations for media items.
 * Supports both base64 storage (small files) and filesystem storage (large files).
 */

// Constants
const SMALL_FILE_THRESHOLD = 2 * 1024 * 1024; // 2MB - store as base64
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Calculate SHA-256 hash of file content
 */
function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Get user data directory for media storage
 */
function getMediaDirectory(type: 'images' | 'videos'): string {
  const userDataPath = app.getPath('userData');
  const mediaPath = path.join(userDataPath, 'media', type);

  // Ensure directory exists
  if (!fs.existsSync(mediaPath)) {
    fs.mkdirSync(mediaPath, { recursive: true });
  }

  return mediaPath;
}

/**
 * Generate unique filename
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const basename = path.basename(originalName, ext);
  const sanitized = basename.replace(/[^a-zA-Z0-9]/g, '_');
  return `${sanitized}_${timestamp}_${random}${ext}`;
}

/**
 * Get image dimensions from data URL or file
 * Uses simple buffer parsing for common formats (JPEG, PNG)
 */
async function getImageDimensions(filePath: string): Promise<{ width: number; height: number; format?: string } | null> {
  try {
    let buffer: Buffer;

    // Get buffer from either data URL or file
    if (filePath.startsWith('data:')) {
      const matches = filePath.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) return null;
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      if (!fs.existsSync(filePath)) return null;
      buffer = fs.readFileSync(filePath);
    }

    // Parse dimensions based on file signature
    // PNG: Check for IHDR chunk
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
        format: 'png'
      };
    }

    // JPEG: Parse SOF marker
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) break;
        const marker = buffer[offset + 1];
        const size = buffer.readUInt16BE(offset + 2);

        // SOF markers
        if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7) ||
            (marker >= 0xC9 && marker <= 0xCB) || (marker >= 0xCD && marker <= 0xCF)) {
          return {
            height: buffer.readUInt16BE(offset + 5),
            width: buffer.readUInt16BE(offset + 7),
            format: 'jpeg'
          };
        }
        offset += 2 + size;
      }
    }

    // For other formats or if parsing fails, return null
    // TODO: Add WebP, GIF support if needed
    console.warn('Could not parse image dimensions - unsupported format or corrupted file');
    return null;
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return null;
  }
}

/**
 * Get video metadata
 * Note: Full metadata extraction requires ffmpeg/ffprobe which needs external binaries
 * For now, we'll extract basic info from the file or return null
 * TODO: Implement proper video metadata extraction when ffmpeg is properly configured
 */
async function getVideoMetadata(filePath: string): Promise<{ width?: number; height?: number; duration?: number; format?: string } | null> {
  try {
    // For now, we can't reliably extract video metadata without ffmpeg
    // Return null - the upload will still succeed, just without dimensions/duration
    console.log('ℹ️ Video metadata extraction requires ffmpeg - skipping for now');
    return null;
  } catch (error) {
    console.error('Error getting video metadata:', error);
    return null;
  }
}

/**
 * Generate thumbnail for video
 * Note: Requires ffmpeg which needs external binaries
 * TODO: Implement when ffmpeg is properly configured
 */
async function generateVideoThumbnail(videoPath: string, outputDir: string): Promise<string | null> {
  try {
    // Skip thumbnail generation for now
    console.log('ℹ️ Video thumbnail generation requires ffmpeg - skipping for now');
    return null;
  } catch (error) {
    console.error('Error in generateVideoThumbnail:', error);
    return null;
  }
}

/**
 * Save file to filesystem
 */
async function saveFileToFilesystem(
  dataUrl: string,
  originalName: string,
  type: 'image' | 'video'
): Promise<{ path: string; size: number; fileHash: string }> {
  // Extract base64 data
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URL');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const size = buffer.length;

  // Calculate file hash for deduplication
  const fileHash = calculateFileHash(buffer);

  // Validate size
  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (size > maxSize) {
    throw new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
  }

  // Determine storage strategy
  let storagePath: string;

  if (size < SMALL_FILE_THRESHOLD) {
    // Store as base64 (embed in path)
    storagePath = dataUrl;
  } else {
    // Save to filesystem
    const mediaDir = getMediaDirectory(type === 'image' ? 'images' : 'videos');
    const filename = generateUniqueFilename(originalName);
    const filePath = path.join(mediaDir, filename);

    fs.writeFileSync(filePath, buffer);
    storagePath = filePath;
  }

  return { path: storagePath, size, fileHash };
}

/**
 * Delete file from filesystem
 */
function deleteFileFromFilesystem(filePath: string): void {
  // Only delete if it's a filesystem path (not base64)
  if (!filePath.startsWith('data:')) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
}

/**
 * Initialize media IPC handlers
 */
export function initializeMediaHandlers() {
  /**
   * Upload media item
   */
  ipcMain.handle('media:upload', async (event, data: {
    filePath: string; // Data URL or file path
    type: 'image' | 'video';
    category?: string;
  }) => {
    try {
      const { filePath, type, category } = data;

      // Extract filename from data URL or path
      let originalName = 'untitled';
      if (filePath.startsWith('data:')) {
        // Try to extract from data URL (if filename was embedded)
        originalName = `${type}_${Date.now()}`;
      } else {
        originalName = path.basename(filePath);
      }

      // Extract MIME type
      let mimeType = '';
      if (filePath.startsWith('data:')) {
        const match = filePath.match(/^data:([^;]+);/);
        mimeType = match ? match[1] : '';
      } else {
        // Guess from extension
        const ext = path.extname(originalName).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.webp') mimeType = 'image/webp';
        else if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.mp4') mimeType = 'video/mp4';
        else if (ext === '.webm') mimeType = 'video/webm';
        else if (ext === '.ogg') mimeType = 'video/ogg';
        else if (ext === '.mov') mimeType = 'video/quicktime';
      }

      // Save file and calculate hash
      const { path: storagePath, size, fileHash } = await saveFileToFilesystem(
        filePath,
        originalName,
        type
      );

      // Check for duplicate based on file hash
      console.log('🔍 Checking for duplicate file...');
      const existingMedia = await MediaService.findMediaByHash(fileHash);
      if (existingMedia) {
        console.log('⚠️ Duplicate file detected:', existingMedia.originalName);

        // Clean up the newly uploaded file if it was written to filesystem
        // (Don't delete if it's stored as base64 data URL)
        if (!storagePath.startsWith('data:')) {
          deleteFileFromFilesystem(storagePath);
          console.log('🗑️ Cleaned up duplicate file from filesystem');
        }

        // Return existing media item with a flag indicating it's a duplicate
        return {
          success: true,
          data: existingMedia,
          duplicate: true,
          message: `File already exists as "${existingMedia.originalName}"`
        };
      }
      console.log('✅ No duplicate found, proceeding with upload');

      // Get dimensions/metadata
      let width: number | undefined;
      let height: number | undefined;
      let duration: number | undefined;
      let thumbnailPath: string | undefined;

      if (type === 'image') {
        console.log('📐 Extracting image dimensions...');
        const dims = await getImageDimensions(storagePath);
        if (dims) {
          width = dims.width;
          height = dims.height;
          console.log(`✅ Image dimensions: ${width}x${height}`);
        } else {
          console.warn('⚠️ Could not extract image dimensions');
        }
      } else if (type === 'video') {
        console.log('📐 Extracting video metadata...');
        const meta = await getVideoMetadata(storagePath);
        if (meta) {
          width = meta.width;
          height = meta.height;
          duration = meta.duration;
          console.log(`✅ Video metadata: ${width}x${height}, ${duration}s`);
        } else {
          console.warn('⚠️ Could not extract video metadata');
        }

        // Generate thumbnail for videos (only for filesystem-stored videos)
        if (!storagePath.startsWith('data:')) {
          console.log('🎬 Generating video thumbnail...');
          const thumbnailDir = getMediaDirectory('images'); // Store thumbnails with images
          thumbnailPath = await generateVideoThumbnail(storagePath, thumbnailDir) || undefined;
          if (thumbnailPath) {
            console.log('✅ Video thumbnail generated:', thumbnailPath);
          } else {
            console.warn('⚠️ Could not generate video thumbnail');
          }
        }
      }

      // Create database entry
      const mediaItem = await MediaService.createMediaItem({
        filename: path.basename(storagePath),
        originalName,
        path: storagePath,
        fileHash,
        thumbnailPath,
        type,
        mimeType,
        size,
        width,
        height,
        duration,
        category,
      });

      return { success: true, data: mediaItem };
    } catch (error) {
      console.error('Error uploading media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  });

  /**
   * List media items
   */
  ipcMain.handle('media:list', async (event, options?: {
    type?: 'image' | 'video';
    category?: string;
    search?: string;
    includeReferences?: boolean;
  }) => {
    try {
      if (options?.includeReferences) {
        const items = await MediaService.getMediaItemsWithReferences(options);
        return { success: true, data: items };
      } else {
        const items = await MediaService.getMediaItems(options);
        return { success: true, data: items };
      }
    } catch (error) {
      console.error('Error listing media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list media',
      };
    }
  });

  /**
   * Get single media item
   */
  ipcMain.handle('media:get', async (event, id: string) => {
    try {
      const item = await MediaService.getMediaItemById(id);
      if (!item) {
        return { success: false, error: 'Media item not found' };
      }
      return { success: true, data: item };
    } catch (error) {
      console.error('Error getting media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get media',
      };
    }
  });

  /**
   * Update media item
   */
  ipcMain.handle('media:update', async (event, data: {
    id: string;
    updates: {
      tags?: string[];
      category?: string;
      description?: string;
    };
  }) => {
    try {
      const { id, updates } = data;
      const item = await MediaService.updateMediaItem(id, updates);
      return { success: true, data: item };
    } catch (error) {
      console.error('Error updating media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update media',
      };
    }
  });

  /**
   * Delete media item(s)
   */
  ipcMain.handle('media:delete', async (event, data: { ids: string[] }) => {
    try {
      const { ids } = data;

      // Check each item for references before deleting
      const referenceChecks = await Promise.all(
        ids.map((id) => MediaService.canDeleteMediaItem(id))
      );

      // Find items that cannot be deleted
      const cannotDelete = referenceChecks.filter(check => !check.canDelete);

      if (cannotDelete.length > 0) {
        const totalReferences = cannotDelete.reduce((sum, check) => sum + check.referenceCount, 0);
        const firstReferences = cannotDelete[0].references?.slice(0, 3).join(', ') || '';
        const moreText = cannotDelete[0].referenceCount! > 3 ? ` and ${cannotDelete[0].referenceCount! - 3} more` : '';

        return {
          success: false,
          error: `Cannot delete ${cannotDelete.length} item(s). They are used in ${totalReferences} background(s): ${firstReferences}${moreText}`,
          cannotDelete: true,
          referenceCount: totalReferences,
        };
      }

      // Get items to delete (for file cleanup)
      const itemsToDelete = await Promise.all(
        ids.map((id) => MediaService.getMediaItemById(id))
      );

      // Delete from database
      await MediaService.deleteMediaItems(ids);

      // Delete files from filesystem
      itemsToDelete.forEach((item) => {
        if (item) {
          deleteFileFromFilesystem(item.path);
        }
      });

      return { success: true, data: { deleted: ids.length } };
    } catch (error) {
      console.error('Error deleting media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete media',
      };
    }
  });

  /**
   * Get media statistics
   */
  ipcMain.handle('media:stats', async () => {
    try {
      const stats = await MediaService.getMediaStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting media stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      };
    }
  });

  console.log('Media IPC handlers initialized');
}
