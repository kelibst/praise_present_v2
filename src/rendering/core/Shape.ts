import { Point, Size, Rectangle, Transform, Matrix, createBounds } from '../types/geometry';
import { RenderContext } from '../types/rendering';
import { ShapeProps, ShapeStyle, ShapeType, defaultShapeProps } from '../types/shapes';

export abstract class Shape {
  public readonly id: string;
  public position: Point;
  public size: Size;
  public rotation: number;
  public opacity: number;
  public zIndex: number;
  public visible: boolean;
  public transform: Transform;
  public style: ShapeStyle;
  public metadata: Record<string, any>; // For identifying shape purpose (verse/reference/translation)
  public abstract readonly type: ShapeType;

  // Dirty flag tracking for selective rendering optimization
  private _dirty: boolean = true; // Start dirty to ensure first render

  constructor(props: ShapeProps = {}, style: ShapeStyle = {}) {
    const mergedProps = { ...defaultShapeProps, ...props };

    this.id = mergedProps.id || this.generateId();
    this.position = { ...mergedProps.position };
    this.size = { ...mergedProps.size };
    this.rotation = mergedProps.rotation;
    this.opacity = mergedProps.opacity;
    this.zIndex = mergedProps.zIndex;
    this.visible = mergedProps.visible;
    this.transform = { ...mergedProps.transform };
    this.metadata = mergedProps.metadata || {};
    this.style = { ...style };
  }

  protected generateId(): string {
    return `shape_${this.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Mark this shape as dirty (needs re-rendering)
   */
  public markDirty(): void {
    this._dirty = true;
  }

  /**
   * Mark this shape as clean (rendered)
   */
  public markClean(): void {
    this._dirty = false;
  }

  /**
   * Check if this shape needs re-rendering
   */
  public isDirty(): boolean {
    return this._dirty;
  }

  public abstract render(context: RenderContext): void;

  public getBounds(): Rectangle {
    const { position, size, transform } = this;
    const x = position.x + transform.x;
    const y = position.y + transform.y;
    const width = size.width * transform.scaleX;
    const height = size.height * transform.scaleY;

    return { x, y, width, height };
  }

  public getTransformedBounds(): Rectangle {
    const bounds = this.getBounds();

    if (this.rotation === 0 && this.transform.rotation === 0) {
      return bounds;
    }

    const totalRotation = this.rotation + this.transform.rotation;
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    const cos = Math.cos(totalRotation);
    const sin = Math.sin(totalRotation);

    const corners = [
      { x: bounds.x, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { x: bounds.x, y: bounds.y + bounds.height }
    ];

    const transformedCorners = corners.map(corner => {
      const dx = corner.x - centerX;
      const dy = corner.y - centerY;
      return {
        x: centerX + dx * cos - dy * sin,
        y: centerY + dx * sin + dy * cos
      };
    });

    const minX = Math.min(...transformedCorners.map(c => c.x));
    const minY = Math.min(...transformedCorners.map(c => c.y));
    const maxX = Math.max(...transformedCorners.map(c => c.x));
    const maxY = Math.max(...transformedCorners.map(c => c.y));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  public hitTest(point: Point): boolean {
    const bounds = this.getTransformedBounds();
    return point.x >= bounds.x &&
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y &&
           point.y <= bounds.y + bounds.height;
  }

  public containsPoint(point: Point): boolean {
    return this.hitTest(point);
  }

  public isInViewport(viewportBounds: Rectangle): boolean {
    return this.isVisible(viewportBounds);
  }

  public isVisible(viewportBounds: Rectangle): boolean {
    if (!this.visible || this.opacity <= 0) {
      return false;
    }

    const shapeBounds = this.getTransformedBounds();
    return this.boundsIntersect(shapeBounds, viewportBounds);
  }

  protected boundsIntersect(a: Rectangle, b: Rectangle): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  public getTransformationMatrix(): Matrix {
    const { position, transform, rotation } = this;
    const totalX = position.x + transform.x;
    const totalY = position.y + transform.y;
    const totalRotation = rotation + transform.rotation;
    const scaleX = transform.scaleX;
    const scaleY = transform.scaleY;

    if (totalRotation === 0 && scaleX === 1 && scaleY === 1) {
      return [1, 0, 0, 1, totalX, totalY];
    }

    const cos = Math.cos(totalRotation);
    const sin = Math.sin(totalRotation);

    return [
      cos * scaleX,
      sin * scaleX,
      -sin * scaleY,
      cos * scaleY,
      totalX,
      totalY
    ];
  }

  protected applyTransformation(ctx: CanvasRenderingContext2D): void {
    const matrix = this.getTransformationMatrix();
    ctx.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
  }

  protected applyStyle(ctx: CanvasRenderingContext2D): void {
    if (this.style.opacity !== undefined) {
      ctx.globalAlpha = this.style.opacity * this.opacity;
    } else {
      ctx.globalAlpha = this.opacity;
    }

    if (this.style.shadowColor) {
      ctx.shadowColor = `rgba(${this.style.shadowColor.r}, ${this.style.shadowColor.g}, ${this.style.shadowColor.b}, ${this.style.shadowColor.a || 1})`;
      ctx.shadowBlur = this.style.shadowBlur || 0;
      ctx.shadowOffsetX = this.style.shadowOffsetX || 0;
      ctx.shadowOffsetY = this.style.shadowOffsetY || 0;
    }
  }

  protected resetStyle(ctx: CanvasRenderingContext2D): void {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  public clone(): Shape {
    const cloned = Object.create(Object.getPrototypeOf(this));
    cloned.id = this.generateId();
    cloned.position = { ...this.position };
    cloned.size = { ...this.size };
    cloned.rotation = this.rotation;
    cloned.opacity = this.opacity;
    cloned.zIndex = this.zIndex;
    cloned.visible = this.visible;
    cloned.transform = { ...this.transform };
    cloned.metadata = { ...this.metadata };
    cloned.style = { ...this.style };
    return cloned;
  }

  public moveTo(position: Point): void {
    if (this.position.x !== position.x || this.position.y !== position.y) {
      this.position.x = position.x;
      this.position.y = position.y;
      this.markDirty();
    }
  }

  public moveBy(delta: Point): void {
    if (delta.x !== 0 || delta.y !== 0) {
      this.position.x += delta.x;
      this.position.y += delta.y;
      this.markDirty();
    }
  }

  public resize(size: Size): void {
    const newWidth = Math.max(0, size.width);
    const newHeight = Math.max(0, size.height);
    if (this.size.width !== newWidth || this.size.height !== newHeight) {
      this.size.width = newWidth;
      this.size.height = newHeight;
      this.markDirty();
    }
  }

  public rotate(angle: number): void {
    if (this.rotation !== angle) {
      this.rotation = angle;
      this.markDirty();
    }
  }

  public scale(scaleX: number, scaleY?: number): void {
    const newScaleY = scaleY ?? scaleX;
    if (this.transform.scaleX !== scaleX || this.transform.scaleY !== newScaleY) {
      this.transform.scaleX = scaleX;
      this.transform.scaleY = newScaleY;
      this.markDirty();
    }
  }

  public setOpacity(opacity: number): void {
    const newOpacity = Math.max(0, Math.min(1, opacity));
    if (this.opacity !== newOpacity) {
      this.opacity = newOpacity;
      this.markDirty();
    }
  }

  public setZIndex(zIndex: number): void {
    if (this.zIndex !== zIndex) {
      this.zIndex = zIndex;
      this.markDirty();
    }
  }

  public show(): void {
    if (!this.visible) {
      this.visible = true;
      this.markDirty();
    }
  }

  public hide(): void {
    if (this.visible) {
      this.visible = false;
      this.markDirty();
    }
  }

  public toJSON(): any {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      size: this.size,
      rotation: this.rotation,
      opacity: this.opacity,
      zIndex: this.zIndex,
      visible: this.visible,
      transform: this.transform,
      style: this.style
    };
  }
}