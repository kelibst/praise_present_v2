import { Shape } from '../core/Shape';
import { RenderContext } from '../types/rendering';
import { ShapeType, ShapeProps, BackgroundStyle } from '../types/shapes';
import { Color, Gradient, colorToString } from '../types/geometry';
import { ImageShape, ImageLoadState } from './ImageShape';
import { VideoShape, VideoLoadState } from './VideoShape';

export interface BackgroundShapeProps extends ShapeProps {
  backgroundStyle: BackgroundStyle;
}

export class BackgroundShape extends Shape {
  public readonly type = ShapeType.BACKGROUND;
  public backgroundStyle: BackgroundStyle;
  private imageShape: ImageShape | null = null;
  private videoShape: VideoShape | null = null;

  constructor(props: BackgroundShapeProps) {
    // Background shapes typically fill the entire canvas/slide
    super(props, {});

    // Generate ID after type is set (fixes 'shape_undefined_...' issue)
    if (!this.id) {
      this.id = this.generateId(ShapeType.BACKGROUND);
    }

    this.backgroundStyle = props.backgroundStyle;

    // Background shapes are typically at the lowest z-index
    this.zIndex = -1000;

    // Initialize image shape if background type is image
    // Do this AFTER setting zIndex so initialization is complete
    if (this.backgroundStyle.type === 'image' && this.backgroundStyle.imageUrl) {
      this.createImageShape();
    }

    // Initialize video shape if background type is video
    if (this.backgroundStyle.type === 'video' && this.backgroundStyle.videoUrl) {
      this.createVideoShape();
    }
  }

  private createImageShape(): void {
    if (!this.backgroundStyle.imageUrl) return;

    this.imageShape = new ImageShape(
      {
        position: this.position,
        size: this.size,
        visible: true,
        opacity: this.opacity
      },
      this.backgroundStyle.imageStyle
    );

    // Start loading the image (rendering engine loop will pick it up when loaded)
    this.imageShape.setSrc(this.backgroundStyle.imageUrl);
  }

  private createVideoShape(): void {
    if (!this.backgroundStyle.videoUrl) return;

    this.videoShape = new VideoShape(
      {
        position: this.position,
        size: this.size,
        visible: true,
        opacity: this.opacity,
        src: this.backgroundStyle.videoUrl,
        loop: true,
        muted: true,
        autoplay: true,
        videoStyle: this.backgroundStyle.imageStyle || { objectFit: 'cover' }
      }
    );
  }

  public render(context: RenderContext): void {
    if (!(context.context instanceof CanvasRenderingContext2D)) {
      // Reduce warning frequency to prevent console spam
      if (Math.random() < 0.01) {
        console.warn('BackgroundShape requires Canvas 2D context');
      }
      return;
    }

    const ctx = context.context;

    ctx.save();
    this.applyTransformation(ctx);
    this.applyStyle(ctx);

    switch (this.backgroundStyle.type) {
      case 'color':
        this.renderColorBackground(ctx);
        break;
      case 'gradient':
        this.renderGradientBackground(ctx);
        break;
      case 'image':
        this.renderImageBackground(ctx, context);
        break;
      case 'video':
        this.renderVideoBackground(ctx, context);
        break;
    }

    this.resetStyle(ctx);
    ctx.restore();
  }

  private renderColorBackground(ctx: CanvasRenderingContext2D): void {
    if (!this.backgroundStyle.color) return;

    ctx.fillStyle = colorToString(this.backgroundStyle.color);
    ctx.fillRect(0, 0, this.size.width, this.size.height);
  }

  private renderGradientBackground(ctx: CanvasRenderingContext2D): void {
    if (!this.backgroundStyle.gradient) return;

    const gradient = this.createGradient(ctx, this.backgroundStyle.gradient);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.size.width, this.size.height);
  }

  private createGradient(ctx: CanvasRenderingContext2D, gradient: Gradient): CanvasGradient {
    const { width, height } = this.size;
    let canvasGradient: CanvasGradient;

    if (gradient.type === 'linear') {
      const angle = gradient.angle || 0;
      const radians = (angle * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);

      // Calculate gradient line endpoints based on angle
      const centerX = width / 2;
      const centerY = height / 2;
      const length = Math.sqrt(width * width + height * height) / 2;

      const x1 = centerX - cos * length;
      const y1 = centerY - sin * length;
      const x2 = centerX + cos * length;
      const y2 = centerY + sin * length;

      canvasGradient = ctx.createLinearGradient(x1, y1, x2, y2);
    } else {
      // Radial gradient
      const centerX = gradient.centerX !== undefined ? gradient.centerX * width : width / 2;
      const centerY = gradient.centerY !== undefined ? gradient.centerY * height : height / 2;
      const radius = Math.max(width, height) / 2;

      canvasGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    }

    // Add color stops
    for (const stop of gradient.stops) {
      canvasGradient.addColorStop(stop.offset, colorToString(stop.color));
    }

    return canvasGradient;
  }

  private renderImageBackground(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    if (!this.imageShape) return;

    if (this.imageShape.getLoadState() === ImageLoadState.LOADED) {
      // Update image shape properties to match background
      this.imageShape.position = this.position;
      this.imageShape.size = this.size;
      this.imageShape.opacity = this.opacity;

      // Render the image
      this.imageShape.render(context);
    } else {
      // Render placeholder while loading
      this.renderImagePlaceholder(ctx);
    }
  }

  private renderVideoBackground(ctx: CanvasRenderingContext2D, context: RenderContext): void {
    if (!this.videoShape) return;

    if (this.videoShape.getLoadState() === VideoLoadState.LOADED) {
      // Update video shape properties to match background
      this.videoShape.position = this.position;
      this.videoShape.size = this.size;
      this.videoShape.opacity = this.opacity;

      // Render the video
      this.videoShape.render(context);
    } else {
      // Render placeholder while loading
      this.renderVideoPlaceholder(ctx);
    }
  }

  private renderImagePlaceholder(ctx: CanvasRenderingContext2D): void {
    // Light gray background while image loads
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, this.size.width, this.size.height);

    // Loading indicator
    const centerX = this.size.width / 2;
    const centerY = this.size.height / 2;

    ctx.fillStyle = '#999';
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const loadState = this.imageShape?.getLoadState();
    let message = 'Loading background...';

    switch (loadState) {
      case ImageLoadState.ERROR:
        message = 'Failed to load background';
        ctx.fillStyle = '#d32f2f';
        break;
      case ImageLoadState.LOADING:
        message = 'Loading background...';
        break;
      default:
        message = 'No background image';
    }

    ctx.fillText(message, centerX, centerY);
  }

  private renderVideoPlaceholder(ctx: CanvasRenderingContext2D): void {
    // Dark background while video loads
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, this.size.width, this.size.height);

    // Loading indicator
    const centerX = this.size.width / 2;
    const centerY = this.size.height / 2;

    ctx.fillStyle = '#aaa';
    ctx.font = '16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const loadState = this.videoShape?.getLoadState();
    let message = 'Loading video...';

    switch (loadState) {
      case VideoLoadState.ERROR:
        message = 'Failed to load video';
        ctx.fillStyle = '#d32f2f';
        break;
      case VideoLoadState.LOADING:
        message = 'Loading video...';
        break;
      default:
        message = 'No background video';
    }

    ctx.fillText(message, centerX, centerY);

    // Draw play icon
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 30, 25, 0, Math.PI * 2);
    ctx.stroke();

    // Play triangle
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY - 40);
    ctx.lineTo(centerX - 10, centerY - 20);
    ctx.lineTo(centerX + 10, centerY - 30);
    ctx.closePath();
    ctx.fill();
  }

  // Public methods
  public setBackgroundColor(color: Color): void {
    // Cleanup video shape before removing it
    if (this.videoShape) {
      this.videoShape.destroy();
    }

    this.backgroundStyle = {
      type: 'color',
      color
    };
    this.imageShape = null;
    this.videoShape = null;
  }

  public setBackgroundGradient(gradient: Gradient): void {
    // Cleanup video shape before removing it
    if (this.videoShape) {
      this.videoShape.destroy();
    }

    this.backgroundStyle = {
      type: 'gradient',
      gradient
    };
    this.imageShape = null;
    this.videoShape = null;
  }

  public async setBackgroundImage(imageUrl: string, imageStyle?: any): Promise<void> {
    // Cleanup video shape before removing it
    if (this.videoShape) {
      this.videoShape.destroy();
    }

    this.backgroundStyle = {
      type: 'image',
      imageUrl,
      imageStyle: imageStyle || { objectFit: 'cover' }
    };

    this.videoShape = null;
    this.createImageShape();
    if (this.imageShape) {
      await this.imageShape.waitForLoad();
    }
  }

  public async setBackgroundVideo(videoUrl: string, videoStyle?: any): Promise<void> {
    this.backgroundStyle = {
      type: 'video',
      videoUrl,
      imageStyle: videoStyle || { objectFit: 'cover' }
    };

    this.imageShape = null;
    this.createVideoShape();
    if (this.videoShape) {
      await this.videoShape.waitForLoad();
    }
  }

  /**
   * Cleanup method to release resources
   * Should be called when the shape is destroyed
   */
  public destroy(): void {
    if (this.videoShape) {
      this.videoShape.destroy();
      this.videoShape = null;
    }
    this.imageShape = null;
  }

  public getBackgroundType(): 'color' | 'gradient' | 'image' | 'video' {
    return this.backgroundStyle.type;
  }

  public isImageLoaded(): boolean {
    return this.imageShape?.isLoaded() || false;
  }

  public isImageLoading(): boolean {
    return this.imageShape?.isLoading() || false;
  }

  public hasImageError(): boolean {
    return this.imageShape?.hasError() || false;
  }

  public async waitForImageLoad(): Promise<boolean> {
    if (!this.imageShape) return false;
    return this.imageShape.waitForLoad();
  }

  public isVideoLoaded(): boolean {
    return this.videoShape?.isLoaded() || false;
  }

  public isVideoLoading(): boolean {
    return this.videoShape?.isLoading() || false;
  }

  public hasVideoError(): boolean {
    return this.videoShape?.hasError() || false;
  }

  public async waitForVideoLoad(): Promise<boolean> {
    if (!this.videoShape) return false;
    return this.videoShape.waitForLoad();
  }

  public clone(): BackgroundShape {
    const cloned = new BackgroundShape({
      id: this.generateId(),
      position: { ...this.position },
      size: { ...this.size },
      rotation: this.rotation,
      opacity: this.opacity,
      zIndex: this.zIndex,
      visible: this.visible,
      transform: { ...this.transform },
      backgroundStyle: this.cloneBackgroundStyle()
    });
    return cloned;
  }

  private cloneBackgroundStyle(): BackgroundStyle {
    const style: BackgroundStyle = { ...this.backgroundStyle };

    if (style.color) {
      style.color = { ...style.color };
    }

    if (style.gradient) {
      style.gradient = {
        ...style.gradient,
        stops: style.gradient.stops.map(stop => ({
          ...stop,
          color: { ...stop.color }
        }))
      };
    }

    if (style.imageStyle) {
      style.imageStyle = { ...style.imageStyle };
    }

    return style;
  }

  public toJSON(): any {
    return {
      ...super.toJSON(),
      backgroundStyle: this.backgroundStyle
    };
  }

  public static fromJSON(data: any): BackgroundShape {
    return new BackgroundShape({
      id: data.id,
      position: data.position,
      size: data.size,
      rotation: data.rotation,
      opacity: data.opacity,
      zIndex: data.zIndex,
      visible: data.visible,
      transform: data.transform,
      backgroundStyle: data.backgroundStyle
    });
  }

  // Static factory methods for common background types
  public static createSolidColor(color: Color, width: number, height: number): BackgroundShape {
    return new BackgroundShape({
      size: { width, height },
      backgroundStyle: { type: 'color', color }
    });
  }

  public static createLinearGradient(
    stops: Array<{ offset: number; color: Color }>,
    angle: number = 0,
    width: number,
    height: number
  ): BackgroundShape {
    return new BackgroundShape({
      size: { width, height },
      backgroundStyle: {
        type: 'gradient',
        gradient: { type: 'linear', stops, angle }
      }
    });
  }

  public static createRadialGradient(
    stops: Array<{ offset: number; color: Color }>,
    centerX: number = 0.5,
    centerY: number = 0.5,
    width: number,
    height: number
  ): BackgroundShape {
    return new BackgroundShape({
      size: { width, height },
      backgroundStyle: {
        type: 'gradient',
        gradient: { type: 'radial', stops, centerX, centerY }
      }
    });
  }

  public static createImageBackground(
    imageUrl: string,
    width: number,
    height: number,
    objectFit: 'fill' | 'contain' | 'cover' | 'scale-down' | 'none' = 'cover'
  ): BackgroundShape {
    return new BackgroundShape({
      size: { width, height },
      backgroundStyle: {
        type: 'image',
        imageUrl,
        imageStyle: { objectFit }
      }
    });
  }

  public static createVideoBackground(
    videoUrl: string,
    width: number,
    height: number,
    objectFit: 'fill' | 'contain' | 'cover' | 'scale-down' | 'none' = 'cover'
  ): BackgroundShape {
    return new BackgroundShape({
      size: { width, height },
      backgroundStyle: {
        type: 'video',
        videoUrl,
        imageStyle: { objectFit }
      }
    });
  }
}