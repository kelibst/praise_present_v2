import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  SlideRenderer,
  createSlideRenderer,
  RenderingEngine,
  TextShape
} from '../rendering';
import { RenderQuality } from '../rendering/types/rendering';
import { GeneratedSlide } from '../rendering/SlideGenerator';
import { createColor } from '../rendering/types/geometry';

interface EditableSlidePreviewProps {
  /** Content to render in the preview */
  content?: any;
  /** Width of the preview canvas */
  width?: number;
  /** Height of the preview canvas */
  height?: number;
  /** Whether editing is enabled */
  editable?: boolean;
  /** Callback when slide content is modified */
  onContentChange?: (content: any) => void;
  /** Callback when slide is generated/updated */
  onSlideGenerated?: (slide: GeneratedSlide) => void;
  /** Background color for the preview area */
  backgroundColor?: string;
  /** Show edit controls */
  showControls?: boolean;
  /** Optional CSS class name */
  className?: string;
}

interface EditableShape {
  id: string;
  originalShape: TextShape;
  bounds: { x: number; y: number; width: number; height: number };
  isEditing: boolean;
  originalText: string;
  editingText: string;
}

/**
 * EditableSlidePreview provides a preview window with click-to-edit functionality
 * This serves as the canonical slide representation that preview and live displays use
 */
export const EditableSlidePreview: React.FC<EditableSlidePreviewProps> = ({
  content,
  width = 800,
  height = 450,
  editable = true,
  onContentChange,
  onSlideGenerated,
  backgroundColor = '#000000',
  showControls = true,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RenderingEngine | null>(null);
  const slideRendererRef = useRef<SlideRenderer | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSlide, setCurrentSlide] = useState<GeneratedSlide | null>(null);
  const [editableShapes, setEditableShapes] = useState<EditableShape[]>([]);
  const [activeEditId, setActiveEditId] = useState<string | null>(null);
  const [editPosition, setEditPosition] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize rendering engine and slide renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const engine = new RenderingEngine({
        canvas: canvasRef.current,
        enableDebug: false,
        settings: {
          quality: RenderQuality.HIGH,
          targetFPS: 30, // Lower FPS for preview to save resources
          enableCaching: true,
          enableGPUAcceleration: true,
          debugMode: false
        }
      });

      engineRef.current = engine;

      // Create slide renderer with preview optimizations
      const slideRenderer = createSlideRenderer(engine, {
        slideSize: { width, height },
        onRender: () => {
          // Update editable shapes after render
          updateEditableShapes();
        }
      });

      slideRendererRef.current = slideRenderer;
      setIsInitialized(true);
      setError(null);

      console.log('EditableSlidePreview initialized successfully');

    } catch (err) {
      console.error('Failed to initialize EditableSlidePreview:', err);
      setError(`Initialization failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    return () => {
      if (slideRendererRef.current) {
        slideRendererRef.current.dispose();
      }
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, [width, height]);

  // Render content when it changes
  useEffect(() => {
    if (!slideRendererRef.current || !isInitialized) return;

    try {
      let slide: GeneratedSlide;

      if (content) {
        // Render provided content
        slide = slideRendererRef.current.renderContent(content);
      } else {
        // Render default preview content
        slide = slideRendererRef.current.renderDefaultSlide();
      }

      setCurrentSlide(slide);
      setError(null);

      // Notify parent of slide generation
      if (onSlideGenerated) {
        onSlideGenerated(slide);
      }

    } catch (err) {
      console.error('Error rendering content in preview:', err);
      setError(`Rendering error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [content, isInitialized, onSlideGenerated]);

  // Update editable shapes after rendering
  const updateEditableShapes = useCallback(() => {
    if (!currentSlide || !editable) {
      setEditableShapes([]);
      return;
    }

    const shapes: EditableShape[] = [];

    currentSlide.shapes.forEach((shape, index) => {
      // Only text shapes are editable for now
      if (shape instanceof TextShape) {
        const bounds = shape.getBounds();

        shapes.push({
          id: `shape-${index}`,
          originalShape: shape,
          bounds,
          isEditing: false,
          originalText: shape.getText() || '',
          editingText: shape.getText() || ''
        });
      }
    });

    setEditableShapes(shapes);
  }, [currentSlide, editable]);

  // Handle canvas click for text editing
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editable || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    // Find clicked text shape
    const clickedShape = editableShapes.find(shape =>
      clickX >= shape.bounds.x &&
      clickX <= shape.bounds.x + shape.bounds.width &&
      clickY >= shape.bounds.y &&
      clickY <= shape.bounds.y + shape.bounds.height
    );

    if (clickedShape) {
      // Start editing this shape
      setActiveEditId(clickedShape.id);
      setEditPosition({
        x: (shape.bounds.x / scaleX) + rect.left,
        y: (shape.bounds.y / scaleY) + rect.top
      });

      // Update shape editing state
      setEditableShapes(prev => prev.map(s => ({
        ...s,
        isEditing: s.id === clickedShape.id,
        editingText: s.id === clickedShape.id ? s.originalText : s.editingText
      })));

      // Focus the input after state update
      setTimeout(() => {
        if (editInputRef.current) {
          editInputRef.current.focus();
          editInputRef.current.select();
        }
      }, 0);
    } else {
      // Cancel any active editing
      cancelEditing();
    }
  }, [editable, editableShapes, width, height]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setActiveEditId(null);
    setEditPosition(null);
    setEditableShapes(prev => prev.map(s => ({
      ...s,
      isEditing: false,
      editingText: s.originalText
    })));
  }, []);

  // Save text changes
  const saveTextEdit = useCallback((shapeId: string, newText: string) => {
    const shape = editableShapes.find(s => s.id === shapeId);
    if (!shape || !currentSlide) return;

    try {
      // Update the shape text
      shape.originalShape.setText(newText);

      // Update editable shapes state
      setEditableShapes(prev => prev.map(s => ({
        ...s,
        originalText: s.id === shapeId ? newText : s.originalText,
        editingText: s.id === shapeId ? newText : s.editingText,
        isEditing: false
      })));

      // Re-render the slide
      if (engineRef.current) {
        engineRef.current.render();
      }

      // Notify parent of content change
      if (onContentChange && content) {
        // Create updated content structure
        const updatedContent = {
          ...content,
          // Add modification timestamp
          lastModified: new Date().toISOString()
        };

        onContentChange(updatedContent);
      }

      // Clear editing state
      setActiveEditId(null);
      setEditPosition(null);

      console.log(`Text updated for shape ${shapeId}: "${newText}"`);

    } catch (err) {
      console.error('Error saving text edit:', err);
      setError(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [editableShapes, currentSlide, content, onContentChange]);

  // Handle input key events
  const handleInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // Save changes
      if (activeEditId) {
        const currentText = (event.target as HTMLInputElement).value;
        saveTextEdit(activeEditId, currentText);
      }
    } else if (event.key === 'Escape') {
      // Cancel editing
      cancelEditing();
    }
  }, [activeEditId, saveTextEdit, cancelEditing]);

  // Handle input blur (save changes)
  const handleInputBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    if (activeEditId) {
      const currentText = event.target.value;
      saveTextEdit(activeEditId, currentText);
    }
  }, [activeEditId, saveTextEdit]);

  // Export current slide for live display
  const exportForLiveDisplay = useCallback(() => {
    if (!currentSlide) return null;

    return {
      type: 'template-slide',
      slide: {
        id: currentSlide.id,
        shapes: currentSlide.shapes,
        background: {
          type: 'color',
          value: backgroundColor
        }
      }
    };
  }, [currentSlide, backgroundColor]);

  // Get current editing text
  const getCurrentEditText = () => {
    if (!activeEditId) return '';
    const shape = editableShapes.find(s => s.id === activeEditId);
    return shape ? shape.editingText : '';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-50 z-50">
          <div className="bg-red-800 text-white p-4 rounded-lg max-w-md">
            <h3 className="font-bold text-lg mb-2">Preview Error</h3>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Preview Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: 'auto',
          backgroundColor,
          cursor: editable ? 'pointer' : 'default',
          border: '1px solid #333'
        }}
        className="block"
      />

      {/* Text Editing Input */}
      {activeEditId && editPosition && (
        <input
          ref={editInputRef}
          type="text"
          value={getCurrentEditText()}
          onChange={(e) => {
            const newText = e.target.value;
            setEditableShapes(prev => prev.map(s => ({
              ...s,
              editingText: s.id === activeEditId ? newText : s.editingText
            })));
          }}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          style={{
            position: 'absolute',
            left: editPosition.x,
            top: editPosition.y,
            zIndex: 1000,
            padding: '4px 8px',
            border: '2px solid #4A90E2',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'white',
            color: 'black',
            minWidth: '100px'
          }}
        />
      )}

      {/* Controls */}
      {showControls && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
          <span>
            {editable ? '💡 Click text to edit' : '👁️ Preview only'}
          </span>
          {currentSlide && (
            <span className="text-gray-500">
              • {currentSlide.shapes.length} shapes
            </span>
          )}
          {activeEditId && (
            <span className="text-blue-400">
              • Editing text (Enter to save, Esc to cancel)
            </span>
          )}
        </div>
      )}

      {/* Initialization Status */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="text-white text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Initializing preview...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableSlidePreview;

// Export utility for getting live display content
export { EditableSlidePreview as EditablePreview };