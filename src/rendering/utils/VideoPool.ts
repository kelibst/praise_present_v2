/**
 * VideoPool - Singleton video element pool for reusing video elements across slides
 *
 * Problem: When switching slides with video backgrounds, creating new video elements
 * causes them to reload and show gray placeholder during loading.
 *
 * Solution: Pool video elements by URL and reuse them across slides. This keeps
 * videos playing continuously without interruption during slide transitions.
 */

interface PooledVideo {
  element: HTMLVideoElement;
  url: string;
  referenceCount: number;
  lastUsed: number;
}

export class VideoPool {
  private static instance: VideoPool | null = null;
  private pool: Map<string, PooledVideo> = new Map();
  private readonly MAX_POOL_SIZE = 10; // Limit to prevent memory issues
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds
  private cleanupTimer: number | null = null;

  private constructor() {
    this.startCleanupTimer();
  }

  public static getInstance(): VideoPool {
    if (!VideoPool.instance) {
      VideoPool.instance = new VideoPool();
    }
    return VideoPool.instance;
  }

  /**
   * Get or create a video element for the given URL
   * Returns an existing playing video if available, or creates a new one
   */
  public async acquire(
    url: string,
    options: {
      loop?: boolean;
      muted?: boolean;
      autoplay?: boolean;
      playbackRate?: number;
    } = {}
  ): Promise<HTMLVideoElement> {
    // DEBUG: Log all pool URLs for comparison
    console.log('🔍 VideoPool: Attempting to acquire video', {
      requestedUrl: url,
      poolSize: this.pool.size,
      poolUrls: Array.from(this.pool.keys()),
      exactMatch: this.pool.has(url)
    });

    // Check if we already have this video in the pool
    const pooled = this.pool.get(url);

    if (pooled) {
      // Video already exists - reuse it
      pooled.referenceCount++;
      pooled.lastUsed = Date.now();
      console.log('♻️ VideoPool: Reusing existing video', {
        url,
        referenceCount: pooled.referenceCount,
        currentTime: pooled.element.currentTime.toFixed(2),
        paused: pooled.element.paused
      });
      return pooled.element;
    }

    // Create new video element
    console.log('🎬 VideoPool: Creating new video element (no match found)', {
      url,
      urlLength: url.length,
      urlPreview: url.substring(0, 100) + '...'
    });
    const video = await this.createVideoElement(url, options);

    // Add to pool
    this.pool.set(url, {
      element: video,
      url,
      referenceCount: 1,
      lastUsed: Date.now()
    });

    // Enforce pool size limit
    this.enforcePoolSizeLimit();

    return video;
  }

  /**
   * Release a video element back to the pool
   * Decrements reference count but keeps video playing
   */
  public release(url: string): void {
    const pooled = this.pool.get(url);
    if (!pooled) {
      console.warn('⚠️ VideoPool: Attempted to release non-existent video', { url });
      return;
    }

    const oldCount = pooled.referenceCount;
    pooled.referenceCount = Math.max(0, pooled.referenceCount - 1);
    pooled.lastUsed = Date.now();

    console.log('⬇️ VideoPool: Released video', {
      url: url.substring(0, 50) + '...',
      referenceCount: `${oldCount} → ${pooled.referenceCount}`,
      stillInPool: true,
      videoStillPlaying: !pooled.element.paused
    });

    // Don't remove immediately - keep it cached for quick reuse
  }

  /**
   * Force removal of a video from the pool
   * Use when video is no longer needed
   */
  public remove(url: string): void {
    const pooled = this.pool.get(url);
    if (!pooled) return;

    console.log('🗑️ VideoPool: Removing video from pool', { url });

    // Stop and cleanup video
    pooled.element.pause();
    pooled.element.src = '';
    pooled.element.load();

    // CRITICAL: Remove from DOM
    if (pooled.element.parentNode) {
      pooled.element.parentNode.removeChild(pooled.element);
      console.log('🗑️ VideoPool: Removed video element from DOM');
    }

    // Remove visibility handler if exists
    if ((pooled.element as any)._visibilityHandler) {
      document.removeEventListener('visibilitychange', (pooled.element as any)._visibilityHandler);
    }

    this.pool.delete(url);
  }

  /**
   * Clear all videos from the pool
   */
  public clear(): void {
    console.log('🧹 VideoPool: Clearing all videos');

    for (const [url] of this.pool) {
      this.remove(url);
    }
  }

  /**
   * Get pool statistics for debugging
   */
  public getStats(): {
    totalVideos: number;
    activeVideos: number;
    cachedVideos: number;
    urls: string[];
  } {
    let activeVideos = 0;
    let cachedVideos = 0;

    for (const pooled of this.pool.values()) {
      if (pooled.referenceCount > 0) {
        activeVideos++;
      } else {
        cachedVideos++;
      }
    }

    return {
      totalVideos: this.pool.size,
      activeVideos,
      cachedVideos,
      urls: Array.from(this.pool.keys())
    };
  }

  /**
   * Create and load a new video element
   */
  private async createVideoElement(
    url: string,
    options: {
      loop?: boolean;
      muted?: boolean;
      autoplay?: boolean;
      playbackRate?: number;
    }
  ): Promise<HTMLVideoElement> {
    const video = document.createElement('video');

    // Set video attributes
    video.loop = options.loop !== undefined ? options.loop : true;
    video.muted = options.muted !== undefined ? options.muted : true;
    video.autoplay = options.autoplay !== undefined ? options.autoplay : true;
    video.playbackRate = options.playbackRate || 1.0;
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';

    // CRITICAL FIX: Video must be in DOM for frames to update in background windows
    // Hide it visually but keep it active for canvas drawImage()
    video.style.position = 'absolute';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '-9999';

    // CRITICAL: Add to DOM immediately - this is required for background video updates
    document.body.appendChild(video);
    console.log('🎬 VideoPool: Added video element to DOM (hidden)', { url });

    // CRITICAL FIX: Prevent browser from throttling video in background windows
    // These attributes ensure video keeps playing even when window is not visible
    (video as any).disablePictureInPicture = false; // Allow PIP if needed
    video.setAttribute('playsinline', 'true'); // iOS compatibility
    video.setAttribute('webkit-playsinline', 'true'); // Older iOS

    // Keep video playing in background by preventing pause on visibility change
    this.preventBackgroundPause(video);

    // Wait for video to load
    await new Promise<void>((resolve, reject) => {
      const loadedHandler = () => {
        video.removeEventListener('loadeddata', loadedHandler);
        video.removeEventListener('error', errorHandler);

        // Start playback if autoplay is enabled
        if (video.autoplay) {
          video.play().catch(err => {
            console.warn('VideoPool: Autoplay prevented, user interaction may be required', err);
          });
        }

        resolve();
      };

      const errorHandler = (e: Event) => {
        video.removeEventListener('loadeddata', loadedHandler);
        video.removeEventListener('error', errorHandler);
        reject(new Error(`Failed to load video: ${url}`));
      };

      video.addEventListener('loadeddata', loadedHandler);
      video.addEventListener('error', errorHandler);

      video.src = url;
      video.load();
    });

    return video;
  }

  /**
   * Prevent browser from pausing video when window goes to background
   * This is critical for live display windows
   */
  private preventBackgroundPause(video: HTMLVideoElement): void {
    // Prevent pause events caused by visibility changes
    video.addEventListener('pause', (e) => {
      // If video was paused by browser (not by user), resume it
      if (!video.ended && video.readyState >= 2) {
        setTimeout(() => {
          if (video.paused && !video.ended) {
            console.log('🎬 VideoPool: Resuming video paused by browser');
            video.play().catch(err => {
              console.warn('VideoPool: Failed to resume video:', err);
            });
          }
        }, 100);
      }
    });

    // Handle visibility change to keep video playing
    if (typeof document !== 'undefined') {
      const visibilityHandler = () => {
        if (!document.hidden && video.paused && !video.ended) {
          console.log('🎬 VideoPool: Page became visible, resuming video');
          video.play().catch(err => {
            console.warn('VideoPool: Failed to resume on visibility change:', err);
          });
        }
      };

      document.addEventListener('visibilitychange', visibilityHandler);

      // Store handler for cleanup (if needed later)
      (video as any)._visibilityHandler = visibilityHandler;
    }

    // REMOVED: Keep-alive interval was interfering with normal playback
    // The combination of frequent play() calls + rendering was causing slow playback
    // The pause event handler above is sufficient for recovery
  }

  /**
   * Enforce maximum pool size by removing least recently used videos
   */
  private enforcePoolSizeLimit(): void {
    if (this.pool.size <= this.MAX_POOL_SIZE) return;

    // Find videos with zero references, sorted by last used time
    const unused = Array.from(this.pool.entries())
      .filter(([_, pooled]) => pooled.referenceCount === 0)
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);

    // Remove oldest unused videos until we're under the limit
    const toRemove = this.pool.size - this.MAX_POOL_SIZE;
    for (let i = 0; i < Math.min(toRemove, unused.length); i++) {
      this.remove(unused[i][0]);
    }
  }

  /**
   * Periodically cleanup unused videos
   */
  private startCleanupTimer(): void {
    if (typeof window === 'undefined') return; // Skip in non-browser environments

    this.cleanupTimer = window.setInterval(() => {
      this.cleanupUnusedVideos();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Remove videos that haven't been used in a while
   */
  private cleanupUnusedVideos(): void {
    const now = Date.now();
    const UNUSED_THRESHOLD = 60000; // 1 minute

    for (const [url, pooled] of this.pool) {
      if (
        pooled.referenceCount === 0 &&
        now - pooled.lastUsed > UNUSED_THRESHOLD
      ) {
        console.log('🧹 VideoPool: Cleaning up unused video', { url, lastUsed: pooled.lastUsed });
        this.remove(url);
      }
    }
  }

  /**
   * Cleanup when the pool is destroyed
   */
  public destroy(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}
