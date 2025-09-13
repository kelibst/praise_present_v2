import { Shape } from '../core/Shape';
import { RenderContext } from '../types/rendering';
import { ShapeType, ShapeProps, RectangleStyle } from '../types/shapes';
import { Color, Gradient, colorToString } from '../types/geometry';

export interface RectangleShapeProps extends ShapeProps {
  borderRadius?: number | [number, number, number, number];
}

export class RectangleShape extends Shape {
  public readonly type = ShapeType.RECTANGLE;
  public rectangleStyle: RectangleStyle;
  public borderRadius: number | [number, number, number, number];

  constructor(props: RectangleShapeProps = {}, style: RectangleStyle = {}) {
    super(props, style);
    this.rectangleStyle = { ...this.style, ...style };
    this.borderRadius = props.borderRadius || 0;
  }

  public render(context: RenderContext): void {
    if (!(context.context instanceof CanvasRenderingContext2D)) {
      console.warn('RectangleShape requires Canvas 2D context');
      return;
    }

    const ctx = context.context;

    ctx.save();
    this.applyTransformation(ctx);
    this.applyStyle(ctx);

    // Create the rectangle path
    this.createPath(ctx);

    // Fill the rectangle
    if (this.rectangleStyle.fill) {
      this.applyFill(ctx, this.rectangleStyle.fill);
      ctx.fill();
    }

    // Stroke the rectangle
    if (this.rectangleStyle.stroke) {
      this.applyStroke(ctx, this.rectangleStyle.stroke);
      ctx.stroke();
    }

    this.resetStyle(ctx);
    ctx.restore();
  }

  private createPath(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.size;
    const radius = this.borderRadius;

    if (typeof radius === 'number' && radius <= 0) {
      // Simple rectangle
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      return;
    }

    // Rounded rectangle
    ctx.beginPath();

    if (typeof radius === 'number') {
      // Single radius for all corners
      const r = Math.min(radius, width / 2, height / 2);
      this.roundedRect(ctx, 0, 0, width, height, r);
    } else {
      // Individual radius for each corner [topLeft, topRight, bottomRight, bottomLeft]
      const [tl, tr, br, bl] = radius;
      this.roundedRectWithCorners(ctx, 0, 0, width, height, tl, tr, br, bl);
    }
  }

  private roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private roundedRectWithCorners(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    topLeft: number,
    topRight: number,
    bottomRight: number,
    bottomLeft: number
  ): void {
    const maxRadius = Math.min(width / 2, height / 2);
    const tl = Math.min(topLeft, maxRadius);
    const tr = Math.min(topRight, maxRadius);
    const br = Math.min(bottomRight, maxRadius);
    const bl = Math.min(bottomLeft, maxRadius);

    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + width - tr, y);
    if (tr > 0) ctx.quadraticCurveTo(x + width, y, x + width, y + tr);
    ctx.lineTo(x + width, y + height - br);
    if (br > 0) ctx.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
    ctx.lineTo(x + bl, y + height);
    if (bl > 0) ctx.quadraticCurveTo(x, y + height, x, y + height - bl);
    ctx.lineTo(x, y + tl);
    if (tl > 0) ctx.quadraticCurveTo(x, y, x + tl, y);
    ctx.closePath();
  }

  private applyFill(ctx: CanvasRenderingContext2D, fill: Color | Gradient): void {
    if ('r' in fill) {
      // Solid color
      ctx.fillStyle = colorToString(fill);
    } else {
      // Gradient
      const gradient = this.createGradient(ctx, fill);
      ctx.fillStyle = gradient;
    }
  }

  private createGradient(ctx: CanvasRenderingContext2D, gradient: Gradient): CanvasGradient {
    const { width, height } = this.size;
    let canvasGradient: CanvasGradient;

    if (gradient.type === 'linear') {
      const angle = gradient.angle || 0;
      const radians = (angle * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);

      // Calculate gradient line endpoints
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

  private applyStroke(ctx: CanvasRenderingContext2D, stroke: { width: number; color: Color; style?: string }): void {
    ctx.strokeStyle = colorToString(stroke.color);
    ctx.lineWidth = stroke.width;

    if (stroke.style) {
      switch (stroke.style) {
        case 'dashed':
          ctx.setLineDash([5, 5]);
          break;
        case 'dotted':
          ctx.setLineDash([2, 2]);
          break;
        default:
          ctx.setLineDash([]);
      }
    }
  }

  public setBorderRadius(radius: number | [number, number, number, number]): void {
    this.borderRadius = radius;
  }

  public setFill(fill: Color | Gradient): void {
    this.rectangleStyle.fill = fill;
  }

  public setStroke(stroke: { width: number; color: Color; style?: 'solid' | 'dashed' | 'dotted' }): void {
    this.rectangleStyle.stroke = stroke;
  }

  public clone(): RectangleShape {
    const cloned = new RectangleShape(
      {
        id: this.generateId(),
        position: { ...this.position },
        size: { ...this.size },
        rotation: this.rotation,
        opacity: this.opacity,
        zIndex: this.zIndex,
        visible: this.visible,
        transform: { ...this.transform },
        borderRadius: Array.isArray(this.borderRadius) ? [...this.borderRadius] : this.borderRadius
      },
      { ...this.rectangleStyle }
    );
    return cloned;
  }

  public toJSON(): any {
    return {
      ...super.toJSON(),
      borderRadius: this.borderRadius,
      rectangleStyle: this.rectangleStyle
    };
  }

  public static fromJSON(data: any): RectangleShape {
    return new RectangleShape(
      {
        id: data.id,
        position: data.position,
        size: data.size,
        rotation: data.rotation,
        opacity: data.opacity,
        zIndex: data.zIndex,
        visible: data.visible,
        transform: data.transform,
        borderRadius: data.borderRadius
      },
      data.rectangleStyle || {}
    );
  }
}