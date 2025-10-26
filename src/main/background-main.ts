import { ipcMain } from 'electron';
import { BackgroundService } from '../lib/services/backgroundService';

/**
 * Background IPC Handlers
 *
 * Handles CRUD operations for background presets
 * Backgrounds can reference MediaItems for image/video backgrounds
 */

/**
 * Register all background-related IPC handlers
 */
export function registerBackgroundHandlers() {
  /**
   * Create a new background preset
   */
  ipcMain.handle('background:create', async (event, data: {
    name: string;
    type: 'color' | 'gradient' | 'image' | 'video';
    settings: string; // JSON string
    mediaItemId?: string;
    category?: string;
    isDefault?: boolean;
  }) => {
    try {
      const background = await BackgroundService.createBackground(data);
      return { success: true, data: background };
    } catch (error) {
      console.error('Error creating background:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create background',
      };
    }
  });

  /**
   * Get all backgrounds
   */
  ipcMain.handle('background:list', async (event, options?: {
    type?: 'color' | 'gradient' | 'image' | 'video';
    category?: string;
    includeUsage?: boolean;
  }) => {
    try {
      if (options?.includeUsage) {
        const backgrounds = await BackgroundService.getBackgroundsWithUsage(options);
        return { success: true, data: backgrounds };
      } else {
        const backgrounds = await BackgroundService.getBackgrounds(options);
        return { success: true, data: backgrounds };
      }
    } catch (error) {
      console.error('Error listing backgrounds:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list backgrounds',
      };
    }
  });

  /**
   * Get a single background by ID
   */
  ipcMain.handle('background:get', async (event, id: string) => {
    try {
      const background = await BackgroundService.getBackgroundById(id);

      if (!background) {
        return { success: false, error: 'Background not found' };
      }

      return { success: true, data: background };
    } catch (error) {
      console.error('Error getting background:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get background',
      };
    }
  });

  /**
   * Update a background
   */
  ipcMain.handle('background:update', async (event, data: {
    id: string;
    name?: string;
    settings?: string;
    mediaItemId?: string;
    category?: string;
    isDefault?: boolean;
  }) => {
    try {
      const { id, ...updates } = data;
      const background = await BackgroundService.updateBackground(id, updates);
      return { success: true, data: background };
    } catch (error) {
      console.error('Error updating background:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update background',
      };
    }
  });

  /**
   * Delete a background
   */
  ipcMain.handle('background:delete', async (event, id: string) => {
    try {
      // Check if background is used in any slides
      const check = await BackgroundService.canDeleteBackground(id);

      if (!check.canDelete) {
        const sampleTitles = check.slides?.slice(0, 3).map(s => s.title || 'Untitled').join(', ') || '';
        const moreText = check.usageCount > 3 ? ` and ${check.usageCount - 3} more` : '';

        return {
          success: false,
          error: `Cannot delete background. It is used in ${check.usageCount} slide${check.usageCount > 1 ? 's' : ''}: ${sampleTitles}${moreText}`,
          cannotDelete: true,
          usageCount: check.usageCount,
        };
      }

      await BackgroundService.deleteBackground(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting background:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete background',
      };
    }
  });

  /**
   * Delete multiple backgrounds
   */
  ipcMain.handle('background:deleteMany', async (event, ids: string[]) => {
    try {
      // Check each background for slide usage
      const usageChecks = await Promise.all(
        ids.map(id => BackgroundService.canDeleteBackground(id))
      );

      const cannotDelete = usageChecks.filter(check => !check.canDelete);

      if (cannotDelete.length > 0) {
        const totalSlides = cannotDelete.reduce((sum, check) => sum + check.usageCount, 0);
        return {
          success: false,
          error: `Cannot delete ${cannotDelete.length} background(s). They are used in ${totalSlides} slide(s).`,
          cannotDelete: true,
          usageCount: totalSlides,
        };
      }

      // Delete all backgrounds
      const count = await BackgroundService.deleteBackgrounds(ids);
      return { success: true, data: { deleted: count } };
    } catch (error) {
      console.error('Error deleting backgrounds:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete backgrounds',
      };
    }
  });

  /**
   * Get usage statistics for a background
   */
  ipcMain.handle('background:getUsage', async (event, id: string) => {
    try {
      const check = await BackgroundService.canDeleteBackground(id);
      return {
        success: true,
        data: {
          usageCount: check.usageCount,
          slides: check.slides || [],
        },
      };
    } catch (error) {
      console.error('Error getting background usage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get background usage',
      };
    }
  });

  /**
   * Set a background as default
   */
  ipcMain.handle('background:setDefault', async (event, id: string) => {
    try {
      const background = await BackgroundService.setAsDefault(id);
      return { success: true, data: background };
    } catch (error) {
      console.error('Error setting default background:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set default background',
      };
    }
  });

  /**
   * Get default background for a type
   */
  ipcMain.handle('background:getDefault', async (event, type?: 'color' | 'gradient' | 'image' | 'video') => {
    try {
      const background = await BackgroundService.getDefaultBackground(type);
      return { success: true, data: background };
    } catch (error) {
      console.error('Error getting default background:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get default background',
      };
    }
  });

  console.log('✅ Background IPC handlers registered');
}
