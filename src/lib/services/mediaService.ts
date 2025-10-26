import { PrismaClient, MediaItem } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateMediaItemInput {
  filename: string;
  originalName: string;
  path: string;
  fileHash?: string;
  thumbnailPath?: string;
  type: 'image' | 'video';
  mimeType: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  tags?: string[];
  category?: string;
  description?: string;
}

export interface UpdateMediaItemInput {
  tags?: string[];
  category?: string;
  description?: string;
}

export interface MediaQueryOptions {
  type?: 'image' | 'video';
  category?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'lastUsed' | 'filename' | 'size';
  sortOrder?: 'asc' | 'desc';
}

/**
 * MediaService - Database operations for media items
 *
 * Handles CRUD operations for images and videos stored in the database.
 * Supports filtering, search, and pagination for efficient media management.
 */
export class MediaService {
  /**
   * Create a new media item
   */
  static async createMediaItem(input: CreateMediaItemInput): Promise<MediaItem> {
    const tagsJson = input.tags ? JSON.stringify(input.tags) : null;

    return await prisma.mediaItem.create({
      data: {
        filename: input.filename,
        originalName: input.originalName,
        path: input.path,
        fileHash: input.fileHash,
        thumbnailPath: input.thumbnailPath,
        type: input.type,
        mimeType: input.mimeType,
        size: input.size,
        duration: input.duration,
        width: input.width,
        height: input.height,
        tags: tagsJson,
        category: input.category,
        description: input.description,
      },
    });
  }

  /**
   * Get all media items with optional filtering
   */
  static async getMediaItems(options: MediaQueryOptions = {}): Promise<MediaItem[]> {
    const {
      type,
      category,
      tags,
      search,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { originalName: { contains: search } },
        { filename: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Tags filtering would require JSON parsing in query
    // For now, we'll filter tags in-memory if needed

    const items = await prisma.mediaItem.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
    });

    // Filter by tags if provided (in-memory)
    if (tags && tags.length > 0) {
      return items.filter((item) => {
        if (!item.tags) return false;
        const itemTags = JSON.parse(item.tags);
        return tags.some((tag) => itemTags.includes(tag));
      });
    }

    return items;
  }

  /**
   * Get a single media item by ID
   */
  static async getMediaItemById(id: string): Promise<MediaItem | null> {
    return await prisma.mediaItem.findUnique({
      where: { id },
    });
  }

  /**
   * Find media item by file hash (for duplicate detection)
   */
  static async findMediaByHash(fileHash: string): Promise<MediaItem | null> {
    return await prisma.mediaItem.findFirst({
      where: { fileHash },
    });
  }

  /**
   * Get reference count for a media item (how many backgrounds use it)
   */
  static async getMediaReferenceCount(mediaItemId: string): Promise<number> {
    const count = await prisma.background.count({
      where: { mediaItemId },
    });
    return count;
  }

  /**
   * Get media items with their reference counts
   */
  static async getMediaItemsWithReferences(options: {
    type?: 'image' | 'video';
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Array<MediaItem & { referenceCount: number }>> {
    const items = await this.getMediaItems(options);

    // For each item, get its reference count
    const itemsWithCounts = await Promise.all(
      items.map(async (item) => {
        const referenceCount = await this.getMediaReferenceCount(item.id);
        return { ...item, referenceCount };
      })
    );

    return itemsWithCounts;
  }

  /**
   * Check if a media item can be safely deleted (has no references)
   */
  static async canDeleteMediaItem(mediaItemId: string): Promise<{ canDelete: boolean; referenceCount: number; references?: string[] }> {
    const referenceCount = await this.getMediaReferenceCount(mediaItemId);

    if (referenceCount === 0) {
      return { canDelete: true, referenceCount: 0 };
    }

    // Get the background names that reference this media
    const backgrounds = await prisma.background.findMany({
      where: { mediaItemId },
      select: { id: true, name: true },
    });

    return {
      canDelete: false,
      referenceCount,
      references: backgrounds.map(bg => bg.name),
    };
  }

  /**
   * Update a media item
   */
  static async updateMediaItem(
    id: string,
    input: UpdateMediaItemInput
  ): Promise<MediaItem> {
    const tagsJson = input.tags ? JSON.stringify(input.tags) : undefined;

    return await prisma.mediaItem.update({
      where: { id },
      data: {
        tags: tagsJson,
        category: input.category,
        description: input.description,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update last used timestamp
   */
  static async markMediaItemUsed(id: string): Promise<MediaItem> {
    return await prisma.mediaItem.update({
      where: { id },
      data: {
        lastUsed: new Date(),
      },
    });
  }

  /**
   * Delete a media item
   */
  static async deleteMediaItem(id: string): Promise<MediaItem> {
    return await prisma.mediaItem.delete({
      where: { id },
    });
  }

  /**
   * Delete multiple media items
   */
  static async deleteMediaItems(ids: string[]): Promise<number> {
    const result = await prisma.mediaItem.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return result.count;
  }

  /**
   * Get media statistics
   */
  static async getMediaStats(): Promise<{
    totalImages: number;
    totalVideos: number;
    totalSize: number;
  }> {
    const images = await prisma.mediaItem.count({
      where: { type: 'image' },
    });

    const videos = await prisma.mediaItem.count({
      where: { type: 'video' },
    });

    const allMedia = await prisma.mediaItem.findMany({
      select: { size: true },
    });

    const totalSize = allMedia.reduce((sum, item) => sum + item.size, 0);

    return {
      totalImages: images,
      totalVideos: videos,
      totalSize,
    };
  }

  /**
   * Get all unique categories
   */
  static async getCategories(): Promise<string[]> {
    const items = await prisma.mediaItem.findMany({
      where: {
        category: {
          not: null,
        },
      },
      select: { category: true },
      distinct: ['category'],
    });

    return items
      .map((item) => item.category)
      .filter((cat): cat is string => cat !== null);
  }

  /**
   * Get all unique tags
   */
  static async getTags(): Promise<string[]> {
    const items = await prisma.mediaItem.findMany({
      where: {
        tags: {
          not: null,
        },
      },
      select: { tags: true },
    });

    const allTags = new Set<string>();
    items.forEach((item) => {
      if (item.tags) {
        const tags = JSON.parse(item.tags);
        tags.forEach((tag: string) => allTags.add(tag));
      }
    });

    return Array.from(allTags);
  }
}

export default MediaService;
