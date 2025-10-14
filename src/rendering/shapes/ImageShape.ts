import { Shape } from '../core/Shape';
import { RenderContext } from '../types/rendering';
import { ShapeType, ShapeProps, ImageStyle } from '../types/shapes';
import { Rectangle } from '../types/geometry';

export interface ImageShapeProps extends ShapeProps {
  src?: string;
  imageStyle?: ImageStyle;
  crossOrigin?: string;
  alt?: string;
}

export enum ImageLoadState {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}

export class ImageShape extends Shape {
  public readonly type = ShapeType.IMAGE;
  public src: string;
  public imageStyle: ImageStyle;
  public crossOrigin?: string;
  public alt: string;

  private image: HTMLImageElement | null = null;
  private loadState: ImageLoadState = ImageLoadState.UNLOADED;
  private loadPromise: Promise<void> | null = null;
  private loadCallbacks: Array<(success: boolean) => void> = [];

  constructor(props: ImageShapeProps = {}, style: ImageStyle = {}) {
    super(props, style);
    this.src = props.src || '';
    this.imageStyle = { ...style };
    this.crossOrigin = props.crossOrigin;
    this.alt = props.alt || '';

    if (this.src) {
      this.loadImage();
    }
  }

  public render(context: RenderContext): void {
    if (!(context.context instanceof CanvasRenderingContext2D)) {
      console.warn('ImageShape requires Canvas 2D context');
      return;
    }

    if (this.loadState !== ImageLoadState.LOADED || !this.image) {
      this.renderPlaceholder(context);
      return;
    }

    const ctx = context.context;

    ctx.save();
    this.applyTransformation(ctx);
    this.applyStyle(ctx);

    const drawInfo = this.calculateDrawInfo();

    // Apply image-specific styles
    if (this.imageStyle.opacity !== undefined) {
      ctx.globalAlpha *= this.imageStyle.opacity;
    }

    if (this.imageStyle.filter) {
      ctx.filter = this.imageStyle.filter;
    }

    // Draw the image
    ctx.drawImage(
      this.image,
      drawInfo.sx, drawInfo.sy, drawInfo.sw, drawInfo.sh,
      drawInfo.dx, drawInfo.dy, drawInfo.dw, drawInfo.dh
    );

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
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, this.size.width, this.size.height);

    // Draw border
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, this.size.width, this.size.height);

    // Draw status text
    const statusText = this.getStatusText();
    if (statusText) {
      ctx.fillStyle = '#666';
      ctx.font = '14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(statusText, this.size.width / 2, this.size.height / 2);
    }

    this.resetStyle(ctx);
    ctx.restore();
  }

  private getStatusText(): string {
    switch (this.loadState) {
      case ImageLoadState.LOADING:
        return 'Loading...';
      case ImageLoadState.ERROR:
        return 'Failed to load';
      case ImageLoadState.UNLOADED:
        return this.src ? 'Image' : 'No source';
      default:
        return '';
    }
  }

  private calculateDrawInfo(): {
    sx: number; sy: number; sw: number; sh: number;
    dx: number; dy: number; dw: number; dh: number;
  } {
    if (!this.image) {
      return { sx: 0, sy: 0, sw: 0, sh: 0, dx: 0, dy: 0, dw: 0, dh: 0 };
    }

    const imgWidth = this.image.naturalWidth;
    const imgHeight = this.image.naturalHeight;
    const { width: containerWidth, height: containerHeight } = this.size;

    const objectFit = this.imageStyle.objectFit || 'fill';

    let sx = 0, sy = 0, sw = imgWidth, sh = imgHeight;
    let dx = 0, dy = 0, dw = containerWidth, dh = containerHeight;

    switch (objectFit) {
      case 'contain': {
        const scale = Math.min(containerWidth / imgWidth, containerHeight / imgHeight);
        dw = imgWidth * scale;
        dh = imgHeight * scale;
        dx = (containerWidth - dw) / 2;
        dy = (containerHeight - dh) / 2;
        break;
      }

      case 'cover': {
        const scale = Math.max(containerWidth / imgWidth, containerHeight / imgHeight);
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;

        if (scaledWidth > containerWidth) {
          const cropWidth = containerWidth / scale;
          sx = (imgWidth - cropWidth) / 2;
          sw = cropWidth;
        }

        if (scaledHeight > containerHeight) {
          const cropHeight = containerHeight / scale;
          sy = (imgHeight - cropHeight) / 2;
          sh = cropHeight;
        }
        break;
      }

      case 'scale-down': {
        if (imgWidth <= containerWidth && imgHeight <= containerHeight) {
          // Original size
          dw = imgWidth;
          dh = imgHeight;
          dx = (containerWidth - dw) / 2;
          dy = (containerHeight - dh) / 2;
        } else {
          // Same as contain
          const scale = Math.min(containerWidth / imgWidth, containerHeight / imgHeight);
          dw = imgWidth * scale;
          dh = imgHeight * scale;
          dx = (containerWidth - dw) / 2;
          dy = (containerHeight - dh) / 2;
        }
        break;
      }

      case 'none': {
        dw = imgWidth;
        dh = imgHeight;
        // Handle objectPosition here if needed
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

  private async loadImage(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    if (!this.src) {
      this.loadState = ImageLoadState.UNLOADED;
      return Promise.resolve();
    }

    this.loadState = ImageLoadState.LOADING;

    this.loadPromise = new Promise((resolve, reject) => {
      const img = new Image();

      if (this.crossOrigin) {
        img.crossOrigin = this.crossOrigin;
      }

      img.onload = () => {
        this.image = img;
        this.loadState = ImageLoadState.LOADED;
        this.notifyLoadCallbacks(true);
        resolve();
      };

      img.onerror = () => {
        this.image = null;
        this.loadState = ImageLoadState.ERROR;
        this.notifyLoadCallbacks(false);
        reject(new Error(`Failed to load image: ${this.src}`));
      };

      img.src = this.src;
    });

    try {
      await this.loadPromise;
    } catch (error) {
      console.warn(`ImageShape load error:`, error);
    } finally {
      this.loadPromise = null;
    }
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

    this.src = src;
    this.image = null;
    this.loadState = ImageLoadState.UNLOADED;
    this.loadPromise = null;

    return this.loadImage();
  }

  public setImageStyle(style: Partial<ImageStyle>): void {
    this.imageStyle = { ...this.imageStyle, ...style };
  }

  public isLoaded(): boolean {
    return this.loadState === ImageLoadState.LOADED;
  }

  public isLoading(): boolean {
    return this.loadState === ImageLoadState.LOADING;
  }

  public hasError(): boolean {
    return this.loadState === ImageLoadState.ERROR;
  }

  public getLoadState(): ImageLoadState {
    return this.loadState;
  }

  public getImage(): HTMLImageElement | null {
    return this.image;
  }

  public getNaturalSize(): { width: number; height: number } | null {
    if (!this.image) return null;
    return {
      width: this.image.naturalWidth,
      height: this.image.naturalHeight
    };
  }

  public fitToNaturalSize(): void {
    if (!this.image) return;
    this.resize({
      width: this.image.naturalWidth,
      height: this.image.naturalHeight
    });
  }

  public onLoad(callback: (success: boolean) => void): void {
    if (this.loadState === ImageLoadState.LOADED) {
      callback(true);
    } else if (this.loadState === ImageLoadState.ERROR) {
      callback(false);
    } else {
      this.loadCallbacks.push(callback);
    }
  }

  public async waitForLoad(): Promise<boolean> {
    return new Promise((resolve) => {
      this.onLoad(resolve);
    });
  }

  public reload(): Promise<void> {
    const currentSrc = this.src;
    this.image = null;
    this.loadState = ImageLoadState.UNLOADED;
    this.loadPromise = null;
    return this.loadImage();
  }

  public preload(): Promise<void> {
    return this.loadImage();
  }

  public clone(): ImageShape {
    const cloned = new ImageShape(
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
        imageStyle: { ...this.imageStyle },
        crossOrigin: this.crossOrigin,
        alt: this.alt
      }
    );
    return cloned;
  }

  public toJSON(): any {
    return {
      ...super.toJSON(),
      src: this.src,
      imageStyle: this.imageStyle,
      crossOrigin: this.crossOrigin,
      alt: this.alt,
      loadState: this.loadState
    };
  }

  public static fromJSON(data: any): ImageShape {
    return new ImageShape(
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
        imageStyle: data.imageStyle,
        crossOrigin: data.crossOrigin,
        alt: data.alt
      }
    );
  }

  // Preload multiple images
  public static async preloadImages(sources: string[]): Promise<void[]> {
    const promises = sources.map(src => {
      const tempShape = new ImageShape({ src });
      return tempShape.preload();
    });

    return Promise.all(promises);
  }

  // Create image shape from file
  public static fromFile(file: File): Promise<ImageShape> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const src = e.target?.result as string;
        const shape = new ImageShape({ src, alt: file.name });
        resolve(shape);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }
}