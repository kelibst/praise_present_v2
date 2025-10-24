import { Shape } from '../../rendering';

/**
 * Shape cache to avoid regenerating identical slides
 * Cache key format: "itemType:content:backgroundType:backgroundValue:settings"
 */

const shapeCache = new Map<string, Shape[]>();
const MAX_CACHE_SIZE = 100; // Limit cache size to prevent memory issues

/**
 * Generate cache key for shape caching
 * Only regenerate shapes if content or styling actually changed
 */
export const generateShapeCacheKey = (
  itemType: string,
  content: string,
  backgroundType: string,
  backgroundValue: string,
  settings: any
): string => {
  // Create a stable key based on actual content, not object references
  return `${itemType}:${content}:${backgroundType}:${backgroundValue}:${JSON.stringify(settings)}`;
};

/**
 * Get shapes from cache if available
 */
export const getFromCache = (cacheKey: string): Shape[] | undefined => {
  return shapeCache.get(cacheKey);
};

/**
 * Add shapes to cache with LRU eviction
 */
export const addToCache = (cacheKey: string, shapes: Shape[]): void => {
  // LRU eviction: remove first (oldest) key if cache is full
  if (shapeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = shapeCache.keys().next().value;
    if (firstKey) {
      shapeCache.delete(firstKey);
    }
  }
  shapeCache.set(cacheKey, shapes);
};

/**
 * Check if cache has a key
 */
export const hasInCache = (cacheKey: string): boolean => {
  return shapeCache.has(cacheKey);
};

/**
 * Clear the entire cache
 */
export const clearCache = (): void => {
  shapeCache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: shapeCache.size,
    maxSize: MAX_CACHE_SIZE,
    utilization: (shapeCache.size / MAX_CACHE_SIZE) * 100
  };
};
