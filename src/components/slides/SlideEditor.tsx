import React, { useRef, useState, useCallback, useEffect } from 'react';
import { SlideRenderer, Slide } from './SlideRenderer';
import { TextShape } from '../../rendering/shapes/TextShape';
import { isTextShape } from '../../rendering/utils/shapeTypeGuards';

// Resize handle types (8-handle system: 4 corners + 4 edges)
type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

interface SlideEditorProps {
  /**
   * The slide to edit
   */
  slide: Slide;

  /**
   * Callback when slide is modified
   */
  onSlideChange?: (updatedSlide: Slide) => void;

  /**
   * Callback when a shape is selected (for formatting toolbar)
   */
  onShapeSelect?: (shape: TextShape | null) => void;

  /**
   * Whether editing is enabled
   */
  editable?: boolean;

  /**
   * Target resolution for rendering
   * Default: 1920x1080 (Full HD presentation standard)
   */
  targetResolution?: { width: number; height: number };

  /**
   * Optional CSS class for the container
   */
  className?: string;
}

/**
 * SlideEditor - Slide component with shape selection (PowerPoint pattern)
 *
 * This component wraps SlideRenderer and adds shape selection capabilities.
 * Unlike click-to-edit, this uses PowerPoint's selection model:
 * - Click shape → Shape selected (visual indicator shown)
 * - Formatting toolbar appears with all controls
 * - Text editing happens in toolbar, not on canvas
 *
 * Key features:
 * - Click on text to select shape
 * - Visual selection indicator (border/highlight)
 * - Coordinate transformation from display → canvas (1920x1080)
 * - Updates via formatting toolbar
 *
 * The coordinate transformation is critical:
 * - Display size might be 305x171 (preview)
 * - Canvas is always 1920x1080
 * - We scale click coordinates: canvasX = displayX * (1920 / displayWidth)
 */
export const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  onSlideChange,
  onShapeSelect,
  editable = true,
  targetResolution = { width: 1920, height: 1080 },
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedShape, setSelectedShape] = useState<TextShape | null>(null);
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number>(-1);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [draggedShapeOriginalPos, setDraggedShapeOriginalPos] = useState<{ x: number; y: number } | null>(null);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Cursor state
  const [cursor, setCursor] = useState<string>('default');

  // CRITICAL: Update selected shape when slide changes
  // This ensures the selected shape stays in sync with the slide's shape array
  useEffect(() => {
    if (selectedShapeIndex >= 0 && selectedShapeIndex < slide.shapes.length) {
      const updatedShape = slide.shapes[selectedShapeIndex];
      if (isTextShape(updatedShape)) {
        console.log('🔄 SlideEditor: Updating selected shape from slide', {
          shapeId: updatedShape.id,
          fontSize: updatedShape.textStyle?.fontSize,
          color: updatedShape.textStyle?.color
        });
        setSelectedShape(updatedShape as TextShape);
        if (onShapeSelect) {
          onShapeSelect(updatedShape as TextShape);
        }
      }
    }
  }, [slide, selectedShapeIndex, onShapeSelect]);

  // Store canvas reference when rendered
  const handleRendered = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  // Helper: Transform display coordinates to canvas coordinates
  const displayToCanvas = useCallback((displayX: number, displayY: number): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = targetResolution.width / rect.width;
    const scaleY = targetResolution.height / rect.height;

    return {
      x: displayX * scaleX,
      y: displayY * scaleY
    };
  }, [targetResolution]);

  // Helper: Get resize handle at position (canvas coordinates)
  const getResizeHandleAtPosition = useCallback((canvasX: number, canvasY: number, bounds: { x: number; y: number; width: number; height: number }): ResizeHandle | null => {
    const handleSize = 12; // Hit zone radius in canvas pixels

    // Helper to check if point is within handle radius
    const isNear = (px: number, py: number, targetX: number, targetY: number) => {
      const dx = px - targetX;
      const dy = py - targetY;
      return Math.sqrt(dx * dx + dy * dy) <= handleSize;
    };

    const { x, y, width, height } = bounds;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Check corners first (priority over edges)
    if (isNear(canvasX, canvasY, x, y)) return 'nw';
    if (isNear(canvasX, canvasY, x + width, y)) return 'ne';
    if (isNear(canvasX, canvasY, x, y + height)) return 'sw';
    if (isNear(canvasX, canvasY, x + width, y + height)) return 'se';

    // Check edges
    if (isNear(canvasX, canvasY, centerX, y)) return 'n';
    if (isNear(canvasX, canvasY, centerX, y + height)) return 's';
    if (isNear(canvasX, canvasY, x + width, centerY)) return 'e';
    if (isNear(canvasX, canvasY, x, centerY)) return 'w';

    return null;
  }, []);

  // Helper: Get cursor for resize handle
  const getCursorForHandle = (handle: ResizeHandle | null): string => {
    if (!handle) return 'move';

    switch (handle) {
      case 'nw': case 'se': return 'nwse-resize';
      case 'ne': case 'sw': return 'nesw-resize';
      case 'n': case 's': return 'ns-resize';
      case 'e': case 'w': return 'ew-resize';
      default: return 'move';
    }
  };

  // Handle mouse down - start drag or resize
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!editable || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Get click position relative to canvas display
    const displayX = event.clientX - rect.left;
    const displayY = event.clientY - rect.top;

    // Transform to canvas coordinates
    const canvasPos = displayToCanvas(displayX, displayY);

    // If there's a selected shape, check if clicking on resize handle
    if (selectedShape) {
      const bounds = selectedShape.getBounds();
      const handle = getResizeHandleAtPosition(canvasPos.x, canvasPos.y, bounds);

      if (handle) {
        // Start resizing
        setIsResizing(true);
        setResizeHandle(handle);
        setResizeStart({
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height
        });
        setDragStart({ x: canvasPos.x, y: canvasPos.y });
        return;
      }

      // Check if clicking within shape bounds (start drag)
      if (
        canvasPos.x >= bounds.x &&
        canvasPos.x <= bounds.x + bounds.width &&
        canvasPos.y >= bounds.y &&
        canvasPos.y <= bounds.y + bounds.height
      ) {
        setIsDragging(true);
        setDragStart({ x: canvasPos.x, y: canvasPos.y });
        setDraggedShapeOriginalPos({ x: selectedShape.position.x, y: selectedShape.position.y });
        return;
      }
    }

    // Find clicked shape for selection
    let clickedShape: TextShape | null = null;
    let clickedShapeIndex = -1;

    for (let i = slide.shapes.length - 1; i >= 0; i--) {
      const shape = slide.shapes[i];

      if (isTextShape(shape)) {
        const bounds = shape.getBounds();

        if (
          canvasPos.x >= bounds.x &&
          canvasPos.x <= bounds.x + bounds.width &&
          canvasPos.y >= bounds.y &&
          canvasPos.y <= bounds.y + bounds.height
        ) {
          clickedShape = shape as TextShape;
          clickedShapeIndex = i;
          break;
        }
      }
    }

    if (clickedShape) {
      // Select shape
      setSelectedShape(clickedShape);
      setSelectedShapeIndex(clickedShapeIndex);

      if (onShapeSelect) {
        onShapeSelect(clickedShape);
      }
    } else {
      // Clicked outside shapes - deselect
      setSelectedShape(null);
      setSelectedShapeIndex(-1);

      if (onShapeSelect) {
        onShapeSelect(null);
      }
    }
  }, [editable, selectedShape, slide.shapes, displayToCanvas, getResizeHandleAtPosition, onShapeSelect]);

  // Handle mouse move - perform drag or resize
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const displayX = event.clientX - rect.left;
    const displayY = event.clientY - rect.top;
    const canvasPos = displayToCanvas(displayX, displayY);

    // Update cursor based on hover state
    if (!isDragging && !isResizing && selectedShape) {
      const bounds = selectedShape.getBounds();
      const handle = getResizeHandleAtPosition(canvasPos.x, canvasPos.y, bounds);

      if (handle) {
        setCursor(getCursorForHandle(handle));
      } else if (
        canvasPos.x >= bounds.x &&
        canvasPos.x <= bounds.x + bounds.width &&
        canvasPos.y >= bounds.y &&
        canvasPos.y <= bounds.y + bounds.height
      ) {
        setCursor('move');
      } else {
        setCursor('default');
      }
    }

    // Perform drag
    if (isDragging && dragStart && draggedShapeOriginalPos && selectedShape && onSlideChange) {
      const deltaX = canvasPos.x - dragStart.x;
      const deltaY = canvasPos.y - dragStart.y;

      const newX = Math.max(0, Math.min(targetResolution.width - selectedShape.size.width, draggedShapeOriginalPos.x + deltaX));
      const newY = Math.max(0, Math.min(targetResolution.height - selectedShape.size.height, draggedShapeOriginalPos.y + deltaY));

      // Create updated slide with new shape position
      const updatedShapes = [...slide.shapes];
      const shapeToUpdate = updatedShapes[selectedShapeIndex] as TextShape;
      shapeToUpdate.position.x = newX;
      shapeToUpdate.position.y = newY;

      onSlideChange({
        ...slide,
        shapes: updatedShapes
      });
    }

    // Perform resize
    if (isResizing && resizeHandle && resizeStart && dragStart && selectedShape && onSlideChange) {
      const deltaX = canvasPos.x - dragStart.x;
      const deltaY = canvasPos.y - dragStart.y;

      let newX = resizeStart.x;
      let newY = resizeStart.y;
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;

      const minSize = 50; // Minimum size constraint

      // Apply resize based on handle
      switch (resizeHandle) {
        case 'nw':
          newX = resizeStart.x + deltaX;
          newY = resizeStart.y + deltaY;
          newWidth = resizeStart.width - deltaX;
          newHeight = resizeStart.height - deltaY;
          break;
        case 'ne':
          newY = resizeStart.y + deltaY;
          newWidth = resizeStart.width + deltaX;
          newHeight = resizeStart.height - deltaY;
          break;
        case 'sw':
          newX = resizeStart.x + deltaX;
          newWidth = resizeStart.width - deltaX;
          newHeight = resizeStart.height + deltaY;
          break;
        case 'se':
          newWidth = resizeStart.width + deltaX;
          newHeight = resizeStart.height + deltaY;
          break;
        case 'n':
          newY = resizeStart.y + deltaY;
          newHeight = resizeStart.height - deltaY;
          break;
        case 's':
          newHeight = resizeStart.height + deltaY;
          break;
        case 'e':
          newWidth = resizeStart.width + deltaX;
          break;
        case 'w':
          newX = resizeStart.x + deltaX;
          newWidth = resizeStart.width - deltaX;
          break;
      }

      // Apply constraints
      if (newWidth < minSize) {
        newWidth = minSize;
        if (resizeHandle.includes('w')) {
          newX = resizeStart.x + resizeStart.width - minSize;
        }
      }

      if (newHeight < minSize) {
        newHeight = minSize;
        if (resizeHandle.includes('n')) {
          newY = resizeStart.y + resizeStart.height - minSize;
        }
      }

      // Boundary constraints
      newX = Math.max(0, Math.min(targetResolution.width - newWidth, newX));
      newY = Math.max(0, Math.min(targetResolution.height - newHeight, newY));

      // Create updated slide with new shape size
      const updatedShapes = [...slide.shapes];
      const shapeToUpdate = updatedShapes[selectedShapeIndex] as TextShape;
      shapeToUpdate.position.x = newX;
      shapeToUpdate.position.y = newY;
      shapeToUpdate.size.width = newWidth;
      shapeToUpdate.size.height = newHeight;

      onSlideChange({
        ...slide,
        shapes: updatedShapes
      });
    }
  }, [
    canvasRef,
    displayToCanvas,
    isDragging,
    isResizing,
    selectedShape,
    dragStart,
    draggedShapeOriginalPos,
    resizeHandle,
    resizeStart,
    selectedShapeIndex,
    slide,
    onSlideChange,
    targetResolution,
    getResizeHandleAtPosition,
    getCursorForHandle
  ]);

  // Handle mouse up - end drag or resize
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      setDragStart(null);
      setDraggedShapeOriginalPos(null);
      setResizeHandle(null);
      setResizeStart(null);
      setCursor('default');
    }
  }, [isDragging, isResizing]);

  // Get selection bounds for visual indicator
  const getSelectionBounds = (): { x: number; y: number; width: number; height: number } | null => {
    if (!selectedShape || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const bounds = selectedShape.getBounds();

    // Transform canvas coordinates (1920x1080) to display coordinates
    const scaleX = rect.width / targetResolution.width;
    const scaleY = rect.height / targetResolution.height;

    return {
      x: bounds.x * scaleX,
      y: bounds.y * scaleY,
      width: bounds.width * scaleX,
      height: bounds.height * scaleY
    };
  };

  const selectionBounds = getSelectionBounds();

  return (
    <div
      className={`relative w-full h-full ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        cursor: editable ? cursor : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none' // Prevent text selection during drag
      }}
    >
      <div
        className="relative"
        style={{
          width: '100%',
          aspectRatio: '16/9',
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <SlideRenderer
          slide={slide}
          targetResolution={targetResolution}
          onRendered={handleRendered}
          className="w-full h-full"
        />

        {/* Visual Selection Indicator (PowerPoint-style blue border) */}
        {selectedShape && selectionBounds && (
          <div
            className="absolute"
            style={{
              left: `${selectionBounds.x}px`,
              top: `${selectionBounds.y}px`,
              width: `${selectionBounds.width}px`,
              height: `${selectionBounds.height}px`,
              border: '2px solid #0078D4',
              borderRadius: '2px',
              boxShadow: '0 0 0 1px rgba(0, 120, 212, 0.3)',
              pointerEvents: 'none'
            }}
          >
            {/* 8 Resize Handles - Now interactive via mouse events */}
            {/* Corner handles */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-blue-600 rounded-full pointer-events-auto cursor-nwse-resize" style={{ pointerEvents: 'auto' }} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-blue-600 rounded-full pointer-events-auto cursor-nesw-resize" style={{ pointerEvents: 'auto' }} />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-blue-600 rounded-full pointer-events-auto cursor-nesw-resize" style={{ pointerEvents: 'auto' }} />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-600 rounded-full pointer-events-auto cursor-nwse-resize" style={{ pointerEvents: 'auto' }} />

            {/* Edge handles */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-600 rounded-full pointer-events-auto cursor-ns-resize" style={{ pointerEvents: 'auto' }} />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-600 rounded-full pointer-events-auto cursor-ns-resize" style={{ pointerEvents: 'auto' }} />
            <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-3 bg-white border-2 border-blue-600 rounded-full pointer-events-auto cursor-ew-resize" style={{ pointerEvents: 'auto' }} />
            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-3 h-3 bg-white border-2 border-blue-600 rounded-full pointer-events-auto cursor-ew-resize" style={{ pointerEvents: 'auto' }} />
          </div>
        )}
      </div>

      {/* Selection Instructions */}
      {editable && !selectedShape && (
        <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded pointer-events-none">
          💡 Click text to select • Drag to move • Drag handles to resize
        </div>
      )}

      {/* Dragging feedback */}
      {isDragging && selectedShape && (
        <div className="absolute top-2 right-2 text-xs text-white bg-blue-600 px-2 py-1 rounded pointer-events-none">
          Moving: {Math.round(selectedShape.position.x)} × {Math.round(selectedShape.position.y)}
        </div>
      )}

      {/* Resizing feedback */}
      {isResizing && selectedShape && (
        <div className="absolute top-2 right-2 text-xs text-white bg-green-600 px-2 py-1 rounded pointer-events-none">
          Size: {Math.round(selectedShape.size.width)} × {Math.round(selectedShape.size.height)}
        </div>
      )}
    </div>
  );
};

export default SlideEditor;
