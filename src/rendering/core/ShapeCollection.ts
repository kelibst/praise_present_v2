import { Shape } from './Shape';
import { Point, Rectangle } from '../types/geometry';

export class ShapeCollection {
  private shapes: Map<string, Shape> = new Map();
  private sortedShapes: Shape[] = [];
  private needsSort: boolean = false;

  public add(shape: Shape): void {
    this.shapes.set(shape.id, shape);
    this.needsSort = true;
  }

  public remove(shapeId: string): boolean {
    if (this.shapes.delete(shapeId)) {
      this.needsSort = true;
      return true;
    }
    return false;
  }

  public get(shapeId: string): Shape | undefined {
    return this.shapes.get(shapeId);
  }

  public has(shapeId: string): boolean {
    return this.shapes.has(shapeId);
  }

  public clear(): void {
    this.shapes.clear();
    this.sortedShapes = [];
    this.needsSort = false;
  }

  public getAll(): Shape[] {
    this.ensureSorted();
    return [...this.sortedShapes];
  }

  public getVisible(viewportBounds?: Rectangle): Shape[] {
    this.ensureSorted();

    if (!viewportBounds) {
      return this.sortedShapes.filter(shape => shape.visible && shape.opacity > 0);
    }

    return this.sortedShapes.filter(shape =>
      shape.visible &&
      shape.opacity > 0 &&
      shape.isVisible(viewportBounds)
    );
  }

  public getShapesAt(point: Point): Shape[] {
    this.ensureSorted();

    // Return shapes in reverse z-order (top to bottom) for hit testing
    const hitShapes: Shape[] = [];
    for (let i = this.sortedShapes.length - 1; i >= 0; i--) {
      const shape = this.sortedShapes[i];
      if (shape.visible && shape.hitTest(point)) {
        hitShapes.push(shape);
      }
    }

    return hitShapes;
  }

  public getTopShapeAt(point: Point): Shape | null {
    const shapes = this.getShapesAt(point);
    return shapes.length > 0 ? shapes[0] : null;
  }

  public moveToFront(shapeId: string): boolean {
    const shape = this.shapes.get(shapeId);
    if (!shape) return false;

    const maxZ = Math.max(0, ...Array.from(this.shapes.values()).map(s => s.zIndex));
    shape.zIndex = maxZ + 1;
    this.needsSort = true;
    return true;
  }

  public moveToBack(shapeId: string): boolean {
    const shape = this.shapes.get(shapeId);
    if (!shape) return false;

    const minZ = Math.min(0, ...Array.from(this.shapes.values()).map(s => s.zIndex));
    shape.zIndex = minZ - 1;
    this.needsSort = true;
    return true;
  }

  public moveForward(shapeId: string): boolean {
    const shape = this.shapes.get(shapeId);
    if (!shape) return false;

    shape.zIndex += 1;
    this.needsSort = true;
    return true;
  }

  public moveBackward(shapeId: string): boolean {
    const shape = this.shapes.get(shapeId);
    if (!shape) return false;

    shape.zIndex -= 1;
    this.needsSort = true;
    return true;
  }

  public setZIndex(shapeId: string, zIndex: number): boolean {
    const shape = this.shapes.get(shapeId);
    if (!shape) return false;

    shape.zIndex = zIndex;
    this.needsSort = true;
    return true;
  }

  public getBounds(): Rectangle | null {
    const visibleShapes = this.getVisible();
    if (visibleShapes.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const shape of visibleShapes) {
      const bounds = shape.getTransformedBounds();
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  public getShapeCount(): number {
    return this.shapes.size;
  }

  public getVisibleShapeCount(viewportBounds?: Rectangle): number {
    return this.getVisible(viewportBounds).length;
  }

  private ensureSorted(): void {
    if (this.needsSort) {
      this.sortedShapes = Array.from(this.shapes.values()).sort((a, b) => a.zIndex - b.zIndex);
      this.needsSort = false;
    }
  }

  public forEach(callback: (shape: Shape) => void): void {
    this.ensureSorted();
    this.sortedShapes.forEach(callback);
  }

  public map<T>(callback: (shape: Shape) => T): T[] {
    this.ensureSorted();
    return this.sortedShapes.map(callback);
  }

  public filter(predicate: (shape: Shape) => boolean): Shape[] {
    this.ensureSorted();
    return this.sortedShapes.filter(predicate);
  }

  public find(predicate: (shape: Shape) => boolean): Shape | undefined {
    this.ensureSorted();
    return this.sortedShapes.find(predicate);
  }

  public some(predicate: (shape: Shape) => boolean): boolean {
    return Array.from(this.shapes.values()).some(predicate);
  }

  public every(predicate: (shape: Shape) => boolean): boolean {
    return Array.from(this.shapes.values()).every(predicate);
  }

  public toArray(): Shape[] {
    return this.getAll();
  }

  public clone(): ShapeCollection {
    const cloned = new ShapeCollection();
    this.shapes.forEach(shape => {
      cloned.add(shape.clone());
    });
    return cloned;
  }

  public toJSON(): any {
    return {
      shapes: this.getAll().map(shape => shape.toJSON())
    };
  }

  public static fromJSON(data: any): ShapeCollection {
    const collection = new ShapeCollection();
    // TODO: Implement shape factory to create shapes from JSON
    // This will be implemented when we have all shape types ready
    return collection;
  }
}