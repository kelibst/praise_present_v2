import { ipcMain } from 'electron';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
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
 * Get image dimensions
 */
async function getImageDimensions(filePath: string): Promise<{ width: number; height: number } | null> {
  // TODO: Implement using sharp or similar library
  // For now, return null
  return null;
}

/**
 * Get video metadata
 */
async function getVideoMetadata(filePath: string): Promise<{ width?: number; height?: number; duration?: number } | null> {
  // TODO: Implement using ffprobe or similar library
  // For now, return null
  return null;
}

/**
 * Save file to filesystem
 */
async function saveFileToFilesystem(
  dataUrl: string,
  originalName: string,
  type: 'image' | 'video'
): Promise<{ path: string; size: number }> {
  // Extract base64 data
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URL');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const size = buffer.length;

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

  return { path: storagePath, size };
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

      // Save file
      const { path: storagePath, size } = await saveFileToFilesystem(
        filePath,
        originalName,
        type
      );

      // Get dimensions/metadata
      let width: number | undefined;
      let height: number | undefined;
      let duration: number | undefined;

      if (type === 'image') {
        const dims = await getImageDimensions(storagePath);
        if (dims) {
          width = dims.width;
          height = dims.height;
        }
      } else {
        const meta = await getVideoMetadata(storagePath);
        if (meta) {
          width = meta.width;
          height = meta.height;
          duration = meta.duration;
        }
      }

      // Create database entry
      const mediaItem = await MediaService.createMediaItem({
        filename: path.basename(storagePath),
        originalName,
        path: storagePath,
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
  }) => {
    try {
      const items = await MediaService.getMediaItems(options);
      return { success: true, data: items };
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
