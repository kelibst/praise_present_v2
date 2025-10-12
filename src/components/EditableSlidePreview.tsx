import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  SlideRenderer,
  createSlideRenderer,
  RenderingEngine,
  TextShape,
  Shape,
  ResponsiveRenderingEngine,
  ResponsiveTextShape,
  ResponsiveLayoutManager,
  LayoutMode,
  percent,
  px,
  createFlexiblePosition,
  createFlexibleSize,
  AdvancedLayoutMode,
  AdvancedLayoutManager
} from '../rendering';
import { RenderQuality } from '../rendering/types/rendering';
import { GeneratedSlide } from '../rendering/SlideGenerator';
import { createColor } from '../rendering/types/geometry';
import { ResourceManager } from '../rendering/utils/ResourceManager';
import { isTextShape } from '../rendering/utils/shapeTypeGuards';
import { ResponsiveControlPanel, ResponsiveControlConfig, DEFAULT_RESPONSIVE_CONFIG } from './controls/ResponsiveControlPanel';
import {
  PreviewSyncManager,
  SyncEventType,
  emitSlideUpdated,
  emitTextEdited,
  emitConfigUpdated,
  emitResponsiveUpdated
} from '../rendering/sync/PreviewSyncManager';

interface EditableSlidePreviewProps {
  /** Content to render in the preview */
  content?: any;
  /** Target resolution for the live display (default: 1920x1080) */
  targetResolution?: { width: number; height: number };
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
  targetResolution = { width: 1920, height: 1080 },
  editable = true,
  onContentChange,
  onSlideGenerated,
  backgroundColor = '#000000',
  showControls = true,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ResponsiveRenderingEngine | null>(null);
  const slideRendererRef = useRef<SlideRenderer | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSlide, setCurrentSlide] = useState<GeneratedSlide | null>(null);
  const [editableShapes, setEditableShapes] = useState<EditableShape[]>([]);
  const [activeEditId, setActiveEditId] = useState<string | null>(null);
  const [editPosition, setEditPosition] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Responsive controls configuration
  const [responsiveConfig, setResponsiveConfig] = useState<ResponsiveControlConfig>(DEFAULT_RESPONSIVE_CONFIG);
  const [showResponsiveControls, setShowResponsiveControls] = useState(false);

  // Sync manager for real-time updates
  const syncManagerRef = useRef<PreviewSyncManager | null>(null);

  // SIMPLIFIED: Canvas always uses target resolution, CSS handles scaling
  // No more dynamic dimension detection - industry standard approach
  const canvasWidth = targetResolution.width;   // Always 1920
  const canvasHeight = targetResolution.height; // Always 1080

  // Initialize rendering engine and slide renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    const resourceManager = ResourceManager.getInstance();
    const resourceId = `editable-preview-${Date.now()}`;

    // Start maintenance schedule for resource cleanup (only once globally)
    if (typeof window !== 'undefined' && !(window as any).__resourceMaintenanceStarted) {
      resourceManager.startMaintenanceSchedule(300000); // 5 minutes
      (window as any).__resourceMaintenanceStarted = true;
    }

    try {
      // SIMPLIFIED: Set canvas to target resolution (1920x1080) BEFORE engine creation
      // CSS will handle scaling down for preview
      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = canvasHeight;

      console.log('🔧 EditableSlidePreview: PHASE 1 DIAGNOSTICS - Canvas initialization', {
        canvasWidth,
        canvasHeight,
        targetResolution,
        canvasActualWidth: canvasRef.current.width,
        canvasActualHeight: canvasRef.current.height,
        canvasClientWidth: canvasRef.current.clientWidth,
        canvasClientHeight: canvasRef.current.clientHeight,
        canvasStyleWidth: canvasRef.current.style.width,
        canvasStyleHeight: canvasRef.current.style.height
      });

      // SIMPLIFIED: Disable responsive features for preview - not needed!
      // We render at full resolution and let CSS scale it down
      const engine = new ResponsiveRenderingEngine({
        canvas: canvasRef.current,
        enableDebug: false,
        enableResponsive: false, // DISABLED - CSS handles scaling
        settings: {
          quality: RenderQuality.HIGH,
          targetFPS: 30,
          enableCaching: true,
          enableGPUAcceleration: true,
          debugMode: false
        }
      });

      console.log('✅ EditableSlidePreview: Rendering engine created with fixed resolution');

      engineRef.current = engine;

      // Initialize sync manager
      syncManagerRef.current = PreviewSyncManager.getInstance({
        debounceMs: 150,
        enableBatching: true,
        batchTimeoutMs: 50,
        enableLogging: true
      });

      // Set up sync event listeners for real-time updates
      const configUnsubscribe = syncManagerRef.current.subscribe(
        SyncEventType.CONFIG_UPDATED,
        (event: any) => {
          console.log('🔄 EditableSlidePreview: Received config update sync event', event);
          if (event.source !== 'preview') {
            // Update our config to match the change from live display or controls
            setResponsiveConfig(event.config);

            // Re-render with new config
            if (engineRef.current && currentSlide) {
              engineRef.current.render();
            }
          }
        }
      );

      const textEditUnsubscribe = syncManagerRef.current.subscribe(
        SyncEventType.TEXT_EDITED,
        (event: any) => {
          console.log('🔄 EditableSlidePreview: Received text edit sync event', event);
          if (event.source !== 'preview') {
            // Update text from external source (live display)
            const shapeToUpdate = editableShapes.find(s => s.originalShape.id === event.shapeId);
            if (shapeToUpdate && shapeToUpdate.originalShape.setText) {
              shapeToUpdate.originalShape.setText(event.newText);

              // Re-render the slide
              if (engineRef.current) {
                engineRef.current.render();
              }

              // Update our state
              setEditableShapes(prev => prev.map(s => ({
                ...s,
                originalText: s.originalShape.id === event.shapeId ? event.newText : s.originalText,
                editingText: s.originalShape.id === event.shapeId ? event.newText : s.editingText
              })));
            }
          }
        }
      );

      // Store unsubscribe functions for cleanup
      (syncManagerRef.current as any)._unsubscribeFunctions = [
        configUnsubscribe,
        textEditUnsubscribe
      ];

      console.log('🔄 EditableSlidePreview: Sync manager initialized with event listeners');

      // Register engine with resource manager for proper cleanup
      resourceManager.registerEngine(resourceId, engine);

      // SIMPLIFIED: No dimension watching needed!
      // Canvas is fixed at target resolution, CSS handles preview scaling

      // Create slide renderer with target resolution
      console.log('🎯 EditableSlidePreview: Creating SlideRenderer with target resolution for responsive system');

      const slideRenderer = createSlideRenderer(engine, {
        slideSize: targetResolution, // Use target resolution for responsive scaling
        onRender: () => {
          // Update editable shapes after render
          console.log('🎨 EditableSlidePreview: SlideRenderer onRender callback triggered');
          updateEditableShapes();
        }
      });

      console.log('✅ EditableSlidePreview: SlideRenderer created successfully');

      slideRendererRef.current = slideRenderer;
      setIsInitialized(true);
      setError(null);

      console.log('EditableSlidePreview initialized successfully');

    } catch (err) {
      console.error('Failed to initialize EditableSlidePreview:', err);
      setError(`Initialization failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    return () => {
      // Clean up sync manager listeners
      if (syncManagerRef.current && (syncManagerRef.current as any)._unsubscribeFunctions) {
        (syncManagerRef.current as any)._unsubscribeFunctions.forEach((unsubscribe: () => void) => {
          unsubscribe();
        });
      }

      // Clean up all resources for this component
      resourceManager.cleanup(resourceId);

      if (slideRendererRef.current) {
        slideRendererRef.current.dispose();
      }

      // Engine cleanup is handled by ResourceManager, but clean up refs
      engineRef.current = null;
      slideRendererRef.current = null;
      syncManagerRef.current = null;

      console.log(`EditableSlidePreview: Cleaned up resources for ${resourceId}`);
    };
    // SIMPLIFIED: Engine initializes once with target resolution, never changes
    // No need for dimension update logic - CSS handles scaling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  // Render content when it changes - optimized for stability
  const contentId = React.useMemo(() => {
    if (!content) return null;
    return `${content.type}-${content.slide?.id || Date.now()}`;
  }, [content?.type, content?.slide?.id]);

  // Use ref to store the last slide ID to prevent infinite loops
  const lastSlideIdRef = React.useRef<string | null>(null);

  // Store the callback in a ref to prevent dependencies on changing functions
  const onSlideGeneratedRef = React.useRef(onSlideGenerated);
  onSlideGeneratedRef.current = onSlideGenerated;

  // Stable callback ref to prevent infinite loops
  const stableOnSlideGenerated = React.useCallback((slide: GeneratedSlide) => {
    // Only call the callback if it exists and if this is a meaningful change
    if (onSlideGeneratedRef.current && slide.id !== lastSlideIdRef.current) {
      lastSlideIdRef.current = slide.id;
      onSlideGeneratedRef.current(slide);
    }
  }, []); // No dependencies - fully stable

  useEffect(() => {
    console.log('🔍 EditableSlidePreview: useEffect triggered', {
      hasSlideRenderer: !!slideRendererRef.current,
      isInitialized,
      hasContent: !!content,
      contentType: content?.type,
      slideShapeCount: content?.slide?.shapes?.length
    });

    if (!slideRendererRef.current || !isInitialized || !contentId) {
      console.log('❌ EditableSlidePreview: Not ready to render', {
        hasSlideRenderer: !!slideRendererRef.current,
        isInitialized,
        hasContentId: !!contentId
      });
      return;
    }

    try {
      let slide: GeneratedSlide;

      if (content) {
        console.log('🎯 EditableSlidePreview: Processing content', {
          type: content.type,
          hasSlide: !!content.slide,
          shapeCount: content.slide?.shapes?.length,
          firstShapeType: content.slide?.shapes?.[0]?.type,
          firstShapeConstructor: content.slide?.shapes?.[0]?.constructor?.name
        });

        // Check if content is already a rendered slide (template-slide type)
        if (content.type === 'template-slide' && content.slide && content.slide.shapes) {
          console.log('🚀 EditableSlidePreview: Using responsive slide rendering');

          // CRITICAL FIX: Convert ResponsiveTextShape to simple TextShape
          // Templates generate ResponsiveTextShape instances, but we need simple TextShape
          // for preview mode with fixed 1920x1080 resolution and CSS scaling
          const shapes = content.slide.shapes.map((shape: any) => {
            // Check if this is a text-based shape (TextShape or ResponsiveTextShape)
            if (shape.type === 'text' || shape instanceof ResponsiveTextShape) {
              console.log('📝 Converting to simple TextShape for preview at full resolution:', {
                originalType: shape.constructor.name,
                position: shape.position,
                size: shape.size,
                text: shape.text?.substring(0, 30)
              });

              // Extract text - ResponsiveTextShape might have getText() method
              const text = typeof shape.getText === 'function' ? shape.getText() : shape.text;

              // Use simple TextShape with absolute pixel positions (for 1920x1080)
              return new TextShape({
                text: text || '',
                position: {
                  x: shape.position?.x || 0,
                  y: shape.position?.y || 0
                },
                size: {
                  width: shape.size?.width || 100,
                  height: shape.size?.height || 50
                },
                textStyle: shape.textStyle || {}
              });
            }
            // For non-text shapes, return the original shape
            return shape;
          });

          // Add shapes to the engine (no responsive shapes for preview)
          console.log('🎯 EditableSlidePreview: Adding simple shapes to engine');
          engineRef.current?.clearShapes();
          shapes.forEach((shape: Shape) => {
            engineRef.current?.addShape(shape);
          });

          // Create slide object for tracking
          slide = {
            id: content.slide.id,
            contentId: `preview-${content.slide.id}`,
            templateId: 'preview-slide',
            shapes: shapes,
            metadata: {
              generatedAt: new Date(),
              shapeCount: shapes.length,
              templateName: 'Preview Slide'
            }
          };

          console.log('✅ EditableSlidePreview: Simple shapes added to engine');
        } else {
          console.log('🔄 EditableSlidePreview: Using normal renderContent');
          // Render provided content through normal conversion
          slide = slideRendererRef.current.renderContent(content);
        }
      } else {
        console.log('📝 EditableSlidePreview: Using default slide');
        // Render default preview content
        slide = slideRendererRef.current.renderDefaultSlide();
      }

      console.log('💾 EditableSlidePreview: Setting current slide', {
        slideId: slide.id,
        shapeCount: slide.shapes.length
      });

      setCurrentSlide(slide);
      setError(null);

      // Notify parent of slide generation only if it's a new slide
      setTimeout(() => {
        stableOnSlideGenerated(slide);
      }, 0);

      console.log('🎉 EditableSlidePreview: Rendering completed successfully');

    } catch (err) {
      console.error('❌ EditableSlidePreview: Error rendering content:', err);
      setError(`Rendering error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [contentId, isInitialized]); // Remove callback dependency since it's now stable

  // Update editable shapes after rendering
  const updateEditableShapes = useCallback(() => {
    if (!currentSlide || !editable) {
      setEditableShapes([]);
      return;
    }

    const shapes: EditableShape[] = [];

    currentSlide.shapes.forEach((shape, index) => {
      // Only text shapes are editable for now
      // Use type guard to check if it's a text shape
      if (isTextShape(shape)) {
        try {
          const bounds = shape.getBounds();

          shapes.push({
            id: `shape-${index}`,
            originalShape: shape,
            bounds,
            isEditing: false,
            originalText: shape.text || '',
            editingText: shape.text || ''
          });
        } catch (err) {
          console.warn('EditableSlidePreview: Could not process text shape:', err);
        }
      } else {
        // Log non-text shapes for debugging
        console.log('EditableSlidePreview: Skipping non-text shape', {
          index,
          type: shape?.type,
          constructor: shape?.constructor?.name,
          hasGetText: typeof (shape as any)?.getText === 'function'
        });
      }
    });

    setEditableShapes(shapes);
  }, [currentSlide, editable]);

  // Cancel editing - define first to avoid dependency issues
  const cancelEditing = useCallback(() => {
    setActiveEditId(null);
    setEditPosition(null);
    setEditableShapes(prev => prev.map(s => ({
      ...s,
      isEditing: false,
      editingText: s.originalText
    })));
  }, []);

  // Handle canvas click for text editing (now responsive-aware)
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editable || !canvasRef.current || !engineRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const canvasPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    // Scale the click coordinates to match the target resolution (1920x1080)
    // The canvas is rendered at full resolution but CSS-scaled to fit the container
    // We need to convert from the displayed size to the actual canvas coordinates
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;

    const targetPoint = {
      x: canvasPoint.x * scaleX,
      y: canvasPoint.y * scaleY
    };

    console.log('🎯 EditableSlidePreview: Click coordinate transformation', {
      canvas: canvasPoint,
      target: targetPoint,
      scale: { x: scaleX, y: scaleY },
      displayedSize: { width: rect.width, height: rect.height },
      canvasResolution: { width: canvasWidth, height: canvasHeight }
    });

    // Find clicked text shape (using target coordinates)
    const clickedShape = editableShapes.find(shape =>
      targetPoint.x >= shape.bounds.x &&
      targetPoint.x <= shape.bounds.x + shape.bounds.width &&
      targetPoint.y >= shape.bounds.y &&
      targetPoint.y <= shape.bounds.y + shape.bounds.height
    );

    if (clickedShape) {
      // Start editing this shape
      setActiveEditId(clickedShape.id);

      // Convert shape bounds back to displayed coordinates for input positioning
      const inputX = (clickedShape.bounds.x / scaleX);
      const inputY = (clickedShape.bounds.y / scaleY);

      setEditPosition({
        x: inputX + rect.left,
        y: inputY + rect.top
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
  }, [editable, editableShapes, cancelEditing, canvasWidth, canvasHeight]);

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

      // Emit sync event for text change
      if (syncManagerRef.current) {
        emitTextEdited(
          shapeId,
          newText,
          shape.originalText,
          'preview'
        );
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

  // Apply responsive configuration changes to the ResponsiveRenderingEngine
  useEffect(() => {
    if (!engineRef.current) return;

    const engine = engineRef.current;

    // Apply responsive settings
    engine.setResponsiveEnabled(responsiveConfig.responsive.enabled);

    // Apply performance settings
    engine.setSelectiveRenderingEnabled(responsiveConfig.performance.selectiveRendering);

    // Apply layout settings
    if (responsiveConfig.layout.mode && responsiveConfig.layout.mode !== AdvancedLayoutMode.SCRIPTURE_CENTERED) {
      engine.setAdvancedLayoutMode(responsiveConfig.layout.mode);
    } else if (responsiveConfig.layout.autoDetect) {
      // Auto-detect layout mode based on content
      const detectedMode = detectLayoutModeFromContent();
      if (detectedMode) {
        engine.setAdvancedLayoutMode(detectedMode);
      }
    }

    // Apply typography settings to all responsive text shapes
    const allShapes = engine.getAllShapes();
    let responsiveShapesUpdated = 0;

    allShapes.forEach((shape: Shape) => {
      if (shape instanceof ResponsiveTextShape) {
        // CRITICAL: Set layout manager for responsive calculations
        shape.setLayoutManager(engine.getLayoutManager());

        // Update responsive typography configuration
        shape.updateSmartScaling(
          responsiveConfig.smartScaling.enabled,
          responsiveConfig.smartScaling.context
        );

        // Update typography configuration with better scaling parameters
        shape.updateTypography({
          scaleRatio: 0.75, // Slightly more aggressive scaling
          minSize: responsiveConfig.smartScaling.minSize,
          maxSize: responsiveConfig.smartScaling.maxSize,
          lineHeightRatio: 1.2 // Better line spacing
        });

        // Update responsive configuration
        engine.updateResponsiveConfiguration(shape.id, {
          responsive: responsiveConfig.responsive.enabled,
          maintainAspectRatio: responsiveConfig.responsive.maintainAspectRatio
        });

        responsiveShapesUpdated++;
      }
    });

    // Trigger re-render with new configuration
    engine.requestRender();

    console.log('🎯 EditableSlidePreview: Applied responsive configuration to engine', {
      responsive: responsiveConfig.responsive.enabled,
      smartScaling: responsiveConfig.smartScaling.enabled,
      context: responsiveConfig.smartScaling.context,
      shapesUpdated: responsiveShapesUpdated,
      totalShapes: allShapes.length,
      hasLayoutManager: !!engine.getLayoutManager()
    });

  }, [responsiveConfig]);

  // Apply responsive configuration when content changes (newly loaded shapes)
  useEffect(() => {
    if (!engineRef.current || !content) return;

    const engine = engineRef.current;

    // Wait for content to be fully loaded, then apply responsive configuration
    const applyTimer = setTimeout(() => {
      const allShapes = engine.getAllShapes();
      let newShapesConfigured = 0;

      allShapes.forEach((shape: Shape) => {
        if (shape instanceof ResponsiveTextShape) {
          // Ensure layout manager is set for newly added shapes
          shape.setLayoutManager(engine.getLayoutManager());

          // Apply current responsive configuration if not already configured
          if (!shape.typography) {
            shape.updateTypography({
              scaleRatio: 0.75,
              minSize: responsiveConfig.smartScaling.minSize,
              maxSize: responsiveConfig.smartScaling.maxSize,
              lineHeightRatio: 1.2
            });
            newShapesConfigured++;
          }

          // Ensure smart scaling is properly configured
          shape.updateSmartScaling(
            responsiveConfig.smartScaling.enabled,
            responsiveConfig.smartScaling.context
          );
        }
      });

      if (newShapesConfigured > 0) {
        engine.requestRender();
        console.log('🔄 EditableSlidePreview: Configured newly loaded shapes', {
          newShapesConfigured,
          totalShapes: allShapes.length,
          contentType: content.type
        });
      }
    }, 100); // Small delay to ensure shapes are fully loaded

    return () => clearTimeout(applyTimer);
  }, [content, responsiveConfig]);

  // Auto-detect layout mode based on content type and context
  const detectLayoutModeFromContent = useCallback((): AdvancedLayoutMode | null => {
    if (!content) return null;

    // Detect based on content type
    if (content.type === 'template-slide' && content.slide) {
      // Look for content hints in the slide
      const textShapes = content.slide.shapes.filter((shape: any) => shape.type === 'text');
      const totalTextLength = textShapes.reduce((sum: number, shape: any) => sum + (shape.text?.length || 0), 0);

      // Scripture detection (usually longer text, specific formatting)
      if (textShapes.length <= 3 && totalTextLength > 50) {
        // Check if it looks like a verse + reference
        const hasReference = textShapes.some((shape: any) =>
          shape.text && /\d+:\d+/.test(shape.text) && shape.text.length < 30
        );
        if (hasReference) {
          return AdvancedLayoutMode.SCRIPTURE_VERSE_REFERENCE;
        }
        return AdvancedLayoutMode.SCRIPTURE_CENTERED;
      }

      // Song detection (multiple verses, shorter lines)
      if (textShapes.length >= 2 && totalTextLength < 200) {
        return AdvancedLayoutMode.SONG_TITLE_VERSE;
      }

      // Announcement detection (varied content)
      if (textShapes.length >= 3) {
        return AdvancedLayoutMode.ANNOUNCEMENT_HEADER;
      }
    }

    // Legacy content type detection
    switch (content.type) {
      case 'scripture':
        return AdvancedLayoutMode.SCRIPTURE_CENTERED;
      case 'song':
        return AdvancedLayoutMode.SONG_TITLE_VERSE;
      case 'announcement':
        return AdvancedLayoutMode.ANNOUNCEMENT_HEADER;
      default:
        return null;
    }
  }, [content]);

  // Emit sync events when responsive configuration changes
  useEffect(() => {
    if (syncManagerRef.current && responsiveConfig !== DEFAULT_RESPONSIVE_CONFIG) {
      // Determine which sections changed by comparing with default
      const changedSections: (keyof ResponsiveControlConfig)[] = [];
      const changedKeys: string[] = [];

      Object.keys(responsiveConfig).forEach(section => {
        const sectionKey = section as keyof ResponsiveControlConfig;
        const defaultSection = DEFAULT_RESPONSIVE_CONFIG[sectionKey];
        const currentSection = responsiveConfig[sectionKey];

        if (JSON.stringify(defaultSection) !== JSON.stringify(currentSection)) {
          changedSections.push(sectionKey);

          if (typeof currentSection === 'object' && currentSection !== null) {
            Object.keys(currentSection).forEach(key => {
              if ((currentSection as any)[key] !== (defaultSection as any)?.[key]) {
                changedKeys.push(`${section}.${key}`);
              }
            });
          }
        }
      });

      if (changedSections.length > 0) {
        // Emit config update event for each changed section
        changedSections.forEach(section => {
          emitConfigUpdated(
            responsiveConfig,
            section,
            changedKeys.filter(key => key.startsWith(`${section}.`)),
            'preview'
          );
        });
      }
    }
  }, [responsiveConfig]);

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

  // Export current slide for live display (available for future use)
  // const exportForLiveDisplay = useCallback(() => {
  //   if (!currentSlide) return null;

  //   return {
  //     type: 'template-slide',
  //     slide: {
  //       id: currentSlide.id,
  //       shapes: currentSlide.shapes,
  //       background: {
  //         type: 'color',
  //         value: backgroundColor
  //       }
  //     }
  //   };
  // }, [currentSlide, backgroundColor]);

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

      {/* Preview Canvas Container - SIMPLIFIED */}
      {/* Container defines preview window size, canvas is always 1920x1080 */}
      <div
        ref={containerRef}
        className="relative w-full h-full bg-black rounded-lg border border-gray-700 flex items-center justify-center"
        style={{
          aspectRatio: `${targetResolution.width} / ${targetResolution.height}`
        }}
      >
        {/* Canvas is ALWAYS target resolution - CSS scales it to fit container */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            backgroundColor,
            cursor: editable ? 'pointer' : 'default',
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'contain' // Browser GPU scales the canvas automatically!
          }}
          className="rounded-lg"
        />
      </div>

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

      {/* Responsive Controls Toggle */}
      {showControls && (
        <div className="absolute top-2 right-2 z-30">
          <button
            onClick={() => setShowResponsiveControls(!showResponsiveControls)}
            className={`p-2 rounded-lg transition-colors ${
              showResponsiveControls
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            title="Toggle responsive controls"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      )}

      {/* Responsive Controls Panel */}
      {showResponsiveControls && showControls && (
        <div className="absolute top-14 right-2 w-96 z-40">
          <ResponsiveControlPanel
            config={responsiveConfig}
            onChange={setResponsiveConfig}
            onReset={() => setResponsiveConfig(DEFAULT_RESPONSIVE_CONFIG)}
            collapsed={false}
          />
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