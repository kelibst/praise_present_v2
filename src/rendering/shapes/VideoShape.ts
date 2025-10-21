import { Shape } from '../core/Shape';
import { RenderContext } from '../types/rendering';
import { ShapeType, ShapeProps, ImageStyle } from '../types/shapes';
import { VideoPool } from '../utils/VideoPool';

export interface VideoShapeProps extends ShapeProps {
  src?: string;
  videoStyle?: ImageStyle; // Reuse ImageStyle for objectFit, opacity, etc.
  loop?: boolean;
  muted?: boolean;
  autoplay?: boolean;
  playbackRate?: number;
}

export enum VideoLoadState {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}

export class VideoShape extends Shape {
  public readonly type = ShapeType.IMAGE; // Reuse IMAGE type since video is similar
  public src: string;
  public videoStyle: ImageStyle;
  public loop: boolean;
  public muted: boolean;
  public autoplay: boolean;
  public playbackRate: number;

  private video: HTMLVideoElement | null = null;
  private loadState: VideoLoadState = VideoLoadState.UNLOADED;
  private loadPromise: Promise<void> | null = null;
  private loadCallbacks: Array<(success: boolean) => void> = [];
  private videoPool: VideoPool = VideoPool.getInstance();
  private isUsingPooledVideo: boolean = false;
  private videoFrameCallbackId: number | null = null;

  constructor(props: VideoShapeProps = {}, style: ImageStyle = {}) {
    super(props, style);
    this.src = props.src || '';
    this.videoStyle = { ...style };
    this.loop = props.loop !== undefined ? props.loop : true; // Default to loop
    this.muted = props.muted !== undefined ? props.muted : true; // Default to muted
    this.autoplay = props.autoplay !== undefined ? props.autoplay : true; // Default to autoplay
    this.playbackRate = props.playbackRate || 1.0;

    if (this.src) {
      this.loadVideo();
    }
  }

  public render(context: RenderContext): void {
    if (!(context.context instanceof CanvasRenderingContext2D)) {
      console.warn('VideoShape requires Canvas 2D context');
      return;
    }

    if (this.loadState !== VideoLoadState.LOADED || !this.video) {
      this.renderPlaceholder(context);
      return;
    }

    const ctx = context.context;

    ctx.save();
    this.applyTransformation(ctx);
    this.applyStyle(ctx);

    const drawInfo = this.calculateDrawInfo();

    // Apply video-specific styles
    if (this.videoStyle.opacity !== undefined) {
      ctx.globalAlpha *= this.videoStyle.opacity;
    }

    if (this.videoStyle.filter) {
      ctx.filter = this.videoStyle.filter;
    }

    // Draw the video frame
    try {
      ctx.drawImage(
        this.video,
        drawInfo.sx, drawInfo.sy, drawInfo.sw, drawInfo.sh,
        drawInfo.dx, drawInfo.dy, drawInfo.dw, drawInfo.dh
      );
    } catch (error) {
      // Video might not be ready yet, skip this frame
      console.debug('VideoShape: Frame not ready yet');
    }

    this.resetStyle(ctx);
    ctx.restore();
  }

  private renderPlaceholder(context: RenderContext): void {
    if (!(context.context instanceof CanvasRenderingContext2D)) return;

    const ctx = context.context;

    ctx.save();
    this.applyTransformation(ctx);
    this.applyStyle(ctx);

    // Draw placeholder rectangle
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, this.size.width, this.size.height);

    // Draw border
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.size.width, this.size.height);

    // Draw status text
    const statusText = this.getStatusText();
    if (statusText) {
      ctx.fillStyle = '#aaa';
      ctx.font = '16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(statusText, this.size.width / 2, this.size.height / 2);

      // Draw play icon placeholder
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const centerX = this.size.width / 2;
      const centerY = this.size.height / 2;
      ctx.arc(centerX, centerY - 30, 20, 0, Math.PI * 2);
      ctx.stroke();

      // Play triangle
      ctx.fillStyle = '#aaa';
      ctx.beginPath();
      ctx.moveTo(centerX - 8, centerY - 40);
      ctx.lineTo(centerX - 8, centerY - 20);
      ctx.lineTo(centerX + 8, centerY - 30);
      ctx.closePath();
      ctx.fill();
    }

    this.resetStyle(ctx);
    ctx.restore();
  }

  private getStatusText(): string {
    switch (this.loadState) {
      case VideoLoadState.LOADING:
        return 'Loading video...';
      case VideoLoadState.ERROR:
        return 'Failed to load video';
      case VideoLoadState.UNLOADED:
        return this.src ? 'Video' : 'No source';
      default:
        return '';
    }
  }

  private calculateDrawInfo(): {
    sx: number; sy: number; sw: number; sh: number;
    dx: number; dy: number; dw: number; dh: number;
  } {
    if (!this.video) {
      return { sx: 0, sy: 0, sw: 0, sh: 0, dx: 0, dy: 0, dw: 0, dh: 0 };
    }

    const vidWidth = this.video.videoWidth;
    const vidHeight = this.video.videoHeight;
    const { width: containerWidth, height: containerHeight } = this.size;

    const objectFit = this.videoStyle.objectFit || 'cover'; // Default to cover for videos

    let sx = 0, sy = 0, sw = vidWidth, sh = vidHeight;
    let dx = 0, dy = 0, dw = containerWidth, dh = containerHeight;

    switch (objectFit) {
      case 'contain': {
        const scale = Math.min(containerWidth / vidWidth, containerHeight / vidHeight);
        dw = vidWidth * scale;
        dh = vidHeight * scale;
        dx = (containerWidth - dw) / 2;
        dy = (containerHeight - dh) / 2;
        break;
      }

      case 'cover': {
        const scale = Math.max(containerWidth / vidWidth, containerHeight / vidHeight);
        const scaledWidth = vidWidth * scale;
        const scaledHeight = vidHeight * scale;

        if (scaledWidth > containerWidth) {
          const cropWidth = containerWidth / scale;
          sx = (vidWidth - cropWidth) / 2;
          sw = cropWidth;
        }

        if (scaledHeight > containerHeight) {
          const cropHeight = containerHeight / scale;
          sy = (vidHeight - cropHeight) / 2;
          sh = cropHeight;
        }
        break;
      }

      case 'scale-down': {
        if (vidWidth <= containerWidth && vidHeight <= containerHeight) {
          // Original size
          dw = vidWidth;
          dh = vidHeight;
          dx = (containerWidth - dw) / 2;
          dy = (containerHeight - dh) / 2;
        } else {
          // Same as contain
          const scale = Math.min(containerWidth / vidWidth, containerHeight / vidHeight);
          dw = vidWidth * scale;
          dh = vidHeight * scale;
          dx = (containerWidth - dw) / 2;
          dy = (containerHeight - dh) / 2;
        }
        break;
      }

      case 'none': {
        dw = vidWidth;
        dh = vidHeight;
        dx = (containerWidth - dw) / 2;
        dy = (containerHeight - dh) / 2;
        break;
      }

      default: // 'fill'
        // Use full container dimensions (default values)
        break;
    }

    return { sx, sy, sw, sh, dx, dy, dw, dh };
  }

  private async loadVideo(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    if (!this.src) {
      this.loadState = VideoLoadState.UNLOADED;
      return Promise.resolve();
    }

    this.loadState = VideoLoadState.LOADING;

    this.loadPromise = (async () => {
      try {
        // PERFORMANCE OPTIMIZATION: Use pooled video element to avoid gray flash
        // This reuses already-loaded and playing videos across slide transitions
        const video = await this.videoPool.acquire(this.src, {
          loop: this.loop,
          muted: this.muted,
          autoplay: this.autoplay,
          playbackRate: this.playbackRate
        });

        this.video = video;
        this.loadState = VideoLoadState.LOADED;
        this.isUsingPooledVideo = true;

        this.notifyLoadCallbacks(true);
      } catch (error) {
        console.warn(`VideoShape load error:`, error);
        this.video = null;
        this.loadState = VideoLoadState.ERROR;
        this.notifyLoadCallbacks(false);
        throw error;
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  private notifyLoadCallbacks(success: boolean): void {
    const callbacks = [...this.loadCallbacks];
    this.loadCallbacks = [];
    callbacks.forEach(callback => callback(success));
  }

  // Public methods
  public setSrc(src: string): Promise<void> {
    if (this.src === src) {
      return Promise.resolve();
    }

    // Release old video back to pool if changing source
    if (this.src && this.isUsingPooledVideo) {
      this.videoPool.release(this.src);
      this.isUsingPooledVideo = false;
    }

    this.src = src;
    this.video = null;
    this.loadState = VideoLoadState.UNLOADED;
    this.loadPromise = null;

    return this.loadVideo();
  }

  public setVideoStyle(style: Partial<ImageStyle>): void {
    this.videoStyle = { ...this.videoStyle, ...style };
  }

  public play(): void {
    if (this.video && this.loadState === VideoLoadState.LOADED) {
      this.video.play().catch(err => {
        console.warn('VideoShape: Play failed', err);
      });
    }
  }

  public pause(): void {
    if (this.video) {
      this.video.pause();
    }
  }

  public stop(): void {
    if (this.video) {
      this.video.pause();
      this.video.currentTime = 0;
    }
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    if (this.video) {
      this.video.playbackRate = rate;
    }
  }

  public setVolume(volume: number): void {
    if (this.video) {
      this.video.volume = Math.max(0, Math.min(1, volume));
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.video) {
      this.video.muted = muted;
    }
  }

  public isLoaded(): boolean {
    return this.loadState === VideoLoadState.LOADED;
  }

  public isLoading(): boolean {
    return this.loadState === VideoLoadState.LOADING;
  }

  public hasError(): boolean {
    return this.loadState === VideoLoadState.ERROR;
  }

  public getLoadState(): VideoLoadState {
    return this.loadState;
  }

  public getVideo(): HTMLVideoElement | null {
    return this.video;
  }

  public getDimensions(): { width: number; height: number } | null {
    if (!this.video) return null;
    return {
      width: this.video.videoWidth,
      height: this.video.videoHeight
    };
  }

  public getDuration(): number {
    return this.video?.duration || 0;
  }

  public getCurrentTime(): number {
    return this.video?.currentTime || 0;
  }

  public onLoad(callback: (success: boolean) => void): void {
    if (this.loadState === VideoLoadState.LOADED) {
      callback(true);
    } else if (this.loadState === VideoLoadState.ERROR) {
      callback(false);
    } else {
      this.loadCallbacks.push(callback);
    }
  }

  /**
   * Cleanup method to release video back to pool
   * Should be called when the shape is destroyed
   */
  public destroy(): void {
    // Cancel requestVideoFrameCallback if active
    if (this.videoFrameCallbackId !== null && this.video) {
      (this.video as any).cancelVideoFrameCallback?.(this.videoFrameCallbackId);
      this.videoFrameCallbackId = null;
    }

    if (this.src && this.isUsingPooledVideo) {
      console.log('🔄 VideoShape: Releasing video back to pool', { src: this.src });
      this.videoPool.release(this.src);
    }
    this.video = null;
    this.loadState = VideoLoadState.UNLOADED;
  }

  /**
   * Request a video frame callback for smooth playback
   * This is more reliable than RAF for background windows
   */
  public requestVideoFrame(callback: () => void): void {
    if (!this.video) return;

    // Use requestVideoFrameCallback if available (Chromium-based browsers)
    if (typeof (this.video as any).requestVideoFrameCallback === 'function') {
      this.videoFrameCallbackId = (this.video as any).requestVideoFrameCallback(() => {
        callback();
        // Re-request for next frame
        this.requestVideoFrame(callback);
      });
    }
  }

  public async waitForLoad(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onLoad(resolve);
    });
  }

  public clone(): VideoShape {
    const cloned = new VideoShape(
      {
        id: this.generateId(),
        position: { ...this.position },
        size: { ...this.size },
        rotation: this.rotation,
        opacity: this.opacity,
        zIndex: this.zIndex,
        visible: this.visible,
        transform: { ...this.transform },
        src: this.src,
        videoStyle: { ...this.videoStyle },
        loop: this.loop,
        muted: this.muted,
        autoplay: this.autoplay,
        playbackRate: this.playbackRate
      }
    );
    return cloned;
  }

  public toJSON(): any {
    return {
      ...super.toJSON(),
      src: this.src,
      videoStyle: this.videoStyle,
      loop: this.loop,
      muted: this.muted,
      autoplay: this.autoplay,
      playbackRate: this.playbackRate,
      loadState: this.loadState
    };
  }

  public static fromJSON(data: any): VideoShape {
    return new VideoShape(
      {
        id: data.id,
        position: data.position,
        size: data.size,
        rotation: data.rotation,
        opacity: data.opacity,
        zIndex: data.zIndex,
        visible: data.visible,
        transform: data.transform,
        src: data.src,
        videoStyle: data.videoStyle,
        loop: data.loop,
        muted: data.muted,
        autoplay: data.autoplay,
        playbackRate: data.playbackRate
      }
    );
  }

  // Cleanup method
  public dispose(): void {
    if (this.video) {
      this.video.pause();
      this.video.src = '';
      this.video.load();
      this.video = null;
    }
    this.loadCallbacks = [];
    this.loadPromise = null;
  }

  // Static factory method
  public static createVideoBackground(
    videoUrl: string,
    width: number,
    height: number,
    options: {
      loop?: boolean;
      muted?: boolean;
      autoplay?: boolean;
      objectFit?: 'fill' | 'contain' | 'cover' | 'scale-down' | 'none';
    } = {}
  ): VideoShape {
    return new VideoShape({
      src: videoUrl,
      size: { width, height },
      loop: options.loop !== undefined ? options.loop : true,
      muted: options.muted !== undefined ? options.muted : true,
      autoplay: options.autoplay !== undefined ? options.autoplay : true,
      videoStyle: {
        objectFit: options.objectFit || 'cover'
      }
    });
  }
}
