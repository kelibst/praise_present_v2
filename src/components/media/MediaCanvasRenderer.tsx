import React, { useEffect, useRef, useState } from 'react';

interface MediaCanvasRendererProps {
  /**
   * Media path (base64 or file URL)
   */
  src: string;

  /**
   * Media type
   */
  type: 'image' | 'video';

  /**
   * Object fit mode
   */
  fit?: 'contain' | 'cover' | 'fill';

  /**
   * Auto-play video
   */
  autoPlay?: boolean;

  /**
   * Loop video
   */
  loop?: boolean;

  /**
   * Muted
   */
  muted?: boolean;

  /**
   * Class name for canvas
   */
  className?: string;
}

/**
 * MediaCanvasRenderer - Canvas-based media rendering (like VideoShape)
 *
 * This component uses the same approach as VideoShape:
 * - Creates off-screen HTMLVideoElement or HTMLImageElement
 * - Draws frames to canvas using drawImage()
 * - Handles continuous rendering for videos
 * - Works reliably with base64 encoded media
 */
export const MediaCanvasRenderer: React.FC<MediaCanvasRendererProps> = ({
  src,
  type,
  fit = 'contain',
  autoPlay = true,
  loop = true,
  muted = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate draw info based on object-fit
   */
  const calculateDrawInfo = (
    mediaWidth: number,
    mediaHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    objectFit: string
  ) => {
    let sx = 0, sy = 0, sw = mediaWidth, sh = mediaHeight;
    let dx = 0, dy = 0, dw = canvasWidth, dh = canvasHeight;

    switch (objectFit) {
      case 'contain': {
        const scale = Math.min(canvasWidth / mediaWidth, canvasHeight / mediaHeight);
        dw = mediaWidth * scale;
        dh = mediaHeight * scale;
        dx = (canvasWidth - dw) / 2;
        dy = (canvasHeight - dh) / 2;
        break;
      }

      case 'cover': {
        const scale = Math.max(canvasWidth / mediaWidth, canvasHeight / mediaHeight);
        const scaledWidth = mediaWidth * scale;
        const scaledHeight = mediaHeight * scale;

        if (scaledWidth > canvasWidth) {
          const cropWidth = canvasWidth / scale;
          sx = (mediaWidth - cropWidth) / 2;
          sw = cropWidth;
        }

        if (scaledHeight > canvasHeight) {
          const cropHeight = canvasHeight / scale;
          sy = (mediaHeight - cropHeight) / 2;
          sh = cropHeight;
        }
        break;
      }

      default: // 'fill'
        // Use full canvas dimensions (default values)
        break;
    }

    return { sx, sy, sw, sh, dx, dy, dw, dh };
  };

  /**
   * Render frame to canvas
   */
  const renderFrame = () => {
    const canvas = canvasRef.current;
    const media = mediaRef.current;

    if (!canvas || !media) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get media dimensions
    const mediaWidth = type === 'video'
      ? (media as HTMLVideoElement).videoWidth
      : (media as HTMLImageElement).naturalWidth;
    const mediaHeight = type === 'video'
      ? (media as HTMLVideoElement).videoHeight
      : (media as HTMLImageElement).naturalHeight;

    if (mediaWidth === 0 || mediaHeight === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate draw info
    const drawInfo = calculateDrawInfo(
      mediaWidth,
      mediaHeight,
      canvas.width,
      canvas.height,
      fit
    );

    // Draw media frame
    try {
      ctx.drawImage(
        media as any,
        drawInfo.sx, drawInfo.sy, drawInfo.sw, drawInfo.sh,
        drawInfo.dx, drawInfo.dy, drawInfo.dw, drawInfo.dh
      );
    } catch (err) {
      console.debug('Frame not ready:', err);
    }

    // Continue animation loop for videos
    if (type === 'video') {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
    }
  };

  /**
   * Load and setup media
   */
  useEffect(() => {
    setLoading(true);
    setError(null);

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (type === 'video') {
      // Create video element
      const video = document.createElement('video');
      video.src = src;
      video.loop = loop;
      video.muted = muted;
      video.playsInline = true;
      video.preload = 'auto';
      video.crossOrigin = 'anonymous';

      video.addEventListener('loadeddata', () => {
        console.log('✅ Video loaded successfully:', src.substring(0, 50));
        mediaRef.current = video;
        setLoading(false);

        // Start rendering
        renderFrame();

        // Start playback
        if (autoPlay) {
          video.play().catch(err => {
            console.warn('⚠️ Autoplay prevented:', err);
          });
        }
      });

      video.addEventListener('error', (e) => {
        console.error('❌ Video load error:', e);
        setError('Failed to load video');
        setLoading(false);
      });

      video.load();
      mediaRef.current = video;

    } else {
      // Create image element
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        console.log('✅ Image loaded successfully');
        mediaRef.current = img;
        setLoading(false);
        renderFrame();
      };

      img.onerror = () => {
        console.error('❌ Image load error');
        setError('Failed to load image');
        setLoading(false);
      };

      img.src = src;
    }

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (mediaRef.current) {
        if (type === 'video') {
          const video = mediaRef.current as HTMLVideoElement;
          video.pause();
          video.src = '';
          video.load();
        }
        mediaRef.current = null;
      }
    };
  }, [src, type, autoPlay, loop, muted]);

  // Re-render on fit change
  useEffect(() => {
    if (!loading && mediaRef.current) {
      renderFrame();
    }
  }, [fit]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className={`max-w-full max-h-full ${className}`}
        style={{ width: '100%', height: '100%' }}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
            <p>Loading {type}...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-500 text-center">
            <p className="text-xl mb-2">❌ {error}</p>
            <p className="text-sm opacity-70">Check console for details</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaCanvasRenderer;
