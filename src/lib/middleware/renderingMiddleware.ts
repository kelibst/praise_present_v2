import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { markShapeDirty, scheduleRender } from '../renderingSlice';
import { updatePreviewSlide, setPreviewSlides } from '../previewSlice';

/**
 * Rendering Middleware - Automatic dirty tracking and render scheduling
 *
 * This middleware intercepts Redux actions that modify slide content and
 * automatically marks affected shapes as dirty and schedules rendering.
 *
 * Key Benefits:
 * - No manual dirty flag management
 * - Automatic selective rendering
 * - Coalesces rapid updates within single frame
 * - Redux DevTools shows what triggered renders
 * - Centralized render scheduling logic
 */

interface ShapeChange {
  shapeId: string;
  bounds?: { x: number; y: number; width: number; height: number };
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Analyze action to determine affected shapes
 */
const analyzeShapeChanges = (action: any, state: RootState): ShapeChange[] => {
  const changes: ShapeChange[] = [];

  // Handle preview slide updates
  if (action.type === 'preview/updatePreviewSlide') {
    const { index, slide } = action.payload;
    const currentItem = state.preview.currentItem;

    if (currentItem?.slides && currentItem.slides[index]) {
      const oldSlide = currentItem.slides[index];
      const newSlide = { ...oldSlide, ...slide };

      // Check if shapes changed
      if (newSlide.shapes && oldSlide.shapes) {
        // Compare shapes to find changes
        newSlide.shapes.forEach((newShape: any, i: number) => {
          const oldShape = oldSlide.shapes?.[i];

          if (!oldShape || hasShapeChanged(oldShape, newShape)) {
            changes.push({
              shapeId: newShape.id || `shape-${i}`,
              bounds: newShape.position ? {
                x: newShape.position.x,
                y: newShape.position.y,
                width: newShape.size?.width || 100,
                height: newShape.size?.height || 100
              } : undefined,
              priority: 'HIGH'
            });
          }
        });
      }
    }
  }

  // Handle full slide replacement
  if (action.type === 'preview/setPreviewSlides') {
    // Mark all shapes as dirty (full render)
    const slides = action.payload;
    slides.forEach((slide: any, slideIndex: number) => {
      slide.shapes?.forEach((shape: any, shapeIndex: number) => {
        changes.push({
          shapeId: shape.id || `slide-${slideIndex}-shape-${shapeIndex}`,
          bounds: shape.position ? {
            x: shape.position.x,
            y: shape.position.y,
            width: shape.size?.width || 100,
            height: shape.size?.height || 100
          } : undefined,
          priority: 'MEDIUM'
        });
      });
    });
  }

  // Handle text shape updates (typing, editing)
  if (action.type.includes('updateText') || action.type.includes('editText')) {
    // High priority for text updates (user is actively editing)
    const shapeId = action.payload?.shapeId;
    if (shapeId) {
      changes.push({
        shapeId,
        priority: 'HIGH'
      });
    }
  }

  // Handle position/transform updates (dragging, resizing)
  if (action.type.includes('Position') || action.type.includes('Transform')) {
    const shapeId = action.payload?.shapeId;
    const bounds = action.payload?.bounds;

    if (shapeId) {
      changes.push({
        shapeId,
        bounds,
        priority: 'IMMEDIATE' // Immediate for smooth dragging
      });
    }
  }

  return changes;
};

/**
 * Check if shape properties changed
 */
const hasShapeChanged = (oldShape: any, newShape: any): boolean => {
  // Quick reference check
  if (oldShape === newShape) return false;

  // Check key properties
  const keys = ['position', 'size', 'rotation', 'opacity', 'visible', 'text', 'style'];

  return keys.some(key => {
    const oldVal = oldShape[key];
    const newVal = newShape[key];

    // Deep comparison for objects
    if (typeof oldVal === 'object' && typeof newVal === 'object') {
      return JSON.stringify(oldVal) !== JSON.stringify(newVal);
    }

    return oldVal !== newVal;
  });
};

/**
 * Frame coalescing - batch updates within same frame
 */
let pendingUpdates: Map<string, ShapeChange[]> = new Map();
let rafId: number | null = null;

const flushPendingUpdates = (dispatch: any) => {
  if (pendingUpdates.size === 0) {
    rafId = null;
    return;
  }

  // Dispatch all pending updates
  pendingUpdates.forEach((changes, engineId) => {
    // Mark shapes dirty
    changes.forEach(change => {
      dispatch(markShapeDirty({
        engineId,
        shapeId: change.shapeId,
        bounds: change.bounds,
        priority: change.priority
      }));
    });

    // Determine render type based on number of changes
    const renderType = changes.length > 10 ? 'full' : 'selective';
    const priority = changes.some(c => c.priority === 'IMMEDIATE') ? 'IMMEDIATE' :
                     changes.some(c => c.priority === 'HIGH') ? 'HIGH' : 'MEDIUM';

    // Schedule render
    dispatch(scheduleRender({
      engineId,
      type: renderType,
      priority,
      shapeIds: changes.map(c => c.shapeId)
    }));
  });

  // Clear pending updates
  pendingUpdates.clear();
  rafId = null;
};

/**
 * Create rendering middleware
 */
export const createRenderingMiddleware = (): Middleware<{}, RootState> => {
  return (store) => (next) => (action) => {
    // First, let the action pass through
    const result = next(action);

    // Analyze changes
    const state = store.getState();
    const changes = analyzeShapeChanges(action, state);

    if (changes.length === 0) {
      return result;
    }

    // Determine which engine to update (preview vs live)
    const engineId = state.preview.mode === 'presenting' ? 'live' : 'preview';

    // Add to pending updates
    if (!pendingUpdates.has(engineId)) {
      pendingUpdates.set(engineId, []);
    }
    pendingUpdates.get(engineId)!.push(...changes);

    // Schedule flush on next animation frame (coalesce updates)
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        flushPendingUpdates(store.dispatch);
      });
    }

    return result;
  };
};

/**
 * Export singleton instance
 */
export const renderingMiddleware = createRenderingMiddleware();
