import { PrismaClient, Background } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateBackgroundInput {
  name: string;
  type: 'color' | 'gradient' | 'image' | 'video';
  settings: string; // JSON string of background settings
  mediaItemId?: string;
  category?: string;
  isDefault?: boolean;
}

export interface UpdateBackgroundInput {
  name?: string;
  settings?: string;
  mediaItemId?: string;
  category?: string;
  isDefault?: boolean;
}

/**
 * BackgroundService - Business logic for background presets
 *
 * Manages CRUD operations for background presets that can be reused across slides
 */
export class BackgroundService {
  /**
   * Create a new background preset
   */
  static async createBackground(input: CreateBackgroundInput): Promise<Background> {
    return await prisma.background.create({
      data: {
        name: input.name,
        type: input.type,
        settings: input.settings,
        mediaItemId: input.mediaItemId,
        category: input.category,
        isDefault: input.isDefault || false,
      },
      include: {
        mediaItem: true,
      },
    });
  }

  /**
   * Get all backgrounds with optional filtering
   */
  static async getBackgrounds(options: {
    type?: 'color' | 'gradient' | 'image' | 'video';
    category?: string;
  } = {}): Promise<Background[]> {
    const where: any = {};

    if (options.type) {
      where.type = options.type;
    }

    if (options.category) {
      where.category = options.category;
    }

    return await prisma.background.findMany({
      where,
      include: {
        mediaItem: true,
      },
      orderBy: [
        { isDefault: 'desc' }, // Defaults first
        { name: 'asc' },
      ],
    });
  }

  /**
   * Get a single background by ID
   */
  static async getBackgroundById(id: string): Promise<Background | null> {
    return await prisma.background.findUnique({
      where: { id },
      include: {
        mediaItem: true,
      },
    });
  }

  /**
   * Update a background
   */
  static async updateBackground(
    id: string,
    updates: UpdateBackgroundInput
  ): Promise<Background> {
    return await prisma.background.update({
      where: { id },
      data: updates,
      include: {
        mediaItem: true,
      },
    });
  }

  /**
   * Delete a background
   */
  static async deleteBackground(id: string): Promise<void> {
    await prisma.background.delete({
      where: { id },
    });
  }

  /**
   * Delete multiple backgrounds
   */
  static async deleteBackgrounds(ids: string[]): Promise<number> {
    const result = await prisma.background.deleteMany({
      where: {
        id: { in: ids },
      },
    });
    return result.count;
  }

  /**
   * Get usage count for a background (how many slides use it)
   */
  static async getBackgroundUsageCount(id: string): Promise<number> {
    return await prisma.slide.count({
      where: { backgroundId: id },
    });
  }

  /**
   * Check if a background can be safely deleted
   */
  static async canDeleteBackground(id: string): Promise<{
    canDelete: boolean;
    usageCount: number;
    slides?: Array<{ id: string; title: string | null }>;
  }> {
    const usageCount = await this.getBackgroundUsageCount(id);

    if (usageCount === 0) {
      return { canDelete: true, usageCount: 0 };
    }

    // Get sample slides using this background
    const slides = await prisma.slide.findMany({
      where: { backgroundId: id },
      take: 5,
      select: {
        id: true,
        title: true,
      },
    });

    return {
      canDelete: false,
      usageCount,
      slides,
    };
  }

  /**
   * Get backgrounds with their usage counts
   */
  static async getBackgroundsWithUsage(options: {
    type?: 'color' | 'gradient' | 'image' | 'video';
    category?: string;
  } = {}): Promise<Array<Background & { usageCount: number }>> {
    const backgrounds = await this.getBackgrounds(options);

    const backgroundsWithCounts = await Promise.all(
      backgrounds.map(async (bg) => {
        const usageCount = await this.getBackgroundUsageCount(bg.id);
        return { ...bg, usageCount };
      })
    );

    return backgroundsWithCounts;
  }

  /**
   * Get default background for a specific type
   */
  static async getDefaultBackground(
    type?: 'color' | 'gradient' | 'image' | 'video'
  ): Promise<Background | null> {
    const where: any = { isDefault: true };

    if (type) {
      where.type = type;
    }

    return await prisma.background.findFirst({
      where,
      include: {
        mediaItem: true,
      },
    });
  }

  /**
   * Set a background as default (clears other defaults of same type)
   */
  static async setAsDefault(id: string): Promise<Background> {
    const background = await this.getBackgroundById(id);
    if (!background) {
      throw new Error('Background not found');
    }

    // Clear other defaults of the same type
    await prisma.background.updateMany({
      where: {
        type: background.type,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // Set this one as default
    return await this.updateBackground(id, { isDefault: true });
  }
}
