import { useEffect, useRef, useState, useCallback } from 'react';
import { SharedRenderingContext, ViewportConfig, RenderingMetrics } from '../rendering/context/SharedRenderingContext';

/**
 * Options for the shared rendering hook
 */
export interface UseSharedRenderingOptions {
  viewportId: string;
  width: number;
  height: number;
  targetResolution?: { width: number; height: number };
  priority?: 'high' | 'medium' | 'low';
  editable?: boolean;
  enableCache?: boolean;
  autoInitialize?: boolean;
}

/**
 * Return type for the useSharedRendering hook
 */
export interface UseSharedRenderingReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isReady: boolean;
  renderContent: (content: any, options?: { forceUpdate?: boolean; useSelectiveUpdate?: boolean }) => Promise<boolean>;
  requestRender: (content?: any) => string;
  metrics: RenderingMetrics | null;
  error: string | null;
  clearCache: () => void;
}

/**
 * React hook for using the SharedRenderingContext with automatic viewport management
 */
export const useSharedRendering = (options: UseSharedRenderingOptions): UseSharedRenderingReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<RenderingMetrics | null>(null);

  const sharedContextRef = useRef<SharedRenderingContext | null>(null);

  // Initialize shared context and register viewport
  useEffect(() => {
    const initializeContext = async () => {
      try {
        if (!canvasRef.current) {
          console.warn('useSharedRendering: Canvas ref not available');
          return;
        }

        // Get shared context instance
        const context = SharedRenderingContext.getInstance();
        sharedContextRef.current = context;

        // Initialize if not already done
        if (options.autoInitialize !== false) {
          const initialized = await context.initialize();
          if (!initialized) {
            throw new Error('Failed to initialize SharedRenderingContext');
          }
        }

        // Create viewport configuration
        const viewportConfig: ViewportConfig = {
          id: options.viewportId,
          canvas: canvasRef.current,
          width: options.width,
          height: options.height,
          targetResolution: options.targetResolution || { width: 1920, height: 1080 },
          priority: options.priority || 'medium',
          editable: options.editable || false
        };

        // Register viewport
        const registered = context.registerViewport(viewportConfig);
        if (!registered) {
          throw new Error('Failed to register viewport');
        }

        setIsReady(true);
        setError(null);

        // Update metrics
        setMetrics(context.getMetrics());

        console.log(`✅ useSharedRendering: Initialized viewport ${options.viewportId}`);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown initialization error';
        setError(errorMessage);
        setIsReady(false);
        console.error('❌ useSharedRendering: Initialization failed:', err);
      }
    };

    initializeContext();

    // Cleanup on unmount
    return () => {
      if (sharedContextRef.current) {
        sharedContextRef.current.unregisterViewport(options.viewportId);
        console.log(`🗑️ useSharedRendering: Cleaned up viewport ${options.viewportId}`);
      }
    };
  }, [options.viewportId, options.width, options.height, options.autoInitialize]);

  // Update canvas dimensions when size changes
  useEffect(() => {
    if (canvasRef.current && isReady) {
      canvasRef.current.width = options.width;
      canvasRef.current.height = options.height;
      canvasRef.current.style.width = `${options.width}px`;
      canvasRef.current.style.height = `${options.height}px`;

      // Re-register viewport with new dimensions
      if (sharedContextRef.current) {
        const viewportConfig: ViewportConfig = {
          id: options.viewportId,
          canvas: canvasRef.current,
          width: options.width,
          height: options.height,
          targetResolution: options.targetResolution || { width: 1920, height: 1080 },
          priority: options.priority || 'medium',
          editable: options.editable || false
        };

        sharedContextRef.current.registerViewport(viewportConfig);
      }
    }
  }, [options.width, options.height, isReady]);

  // Render content function
  const renderContent = useCallback(async (
    content: any,
    renderOptions: { forceUpdate?: boolean; useSelectiveUpdate?: boolean } = {}
  ): Promise<boolean> => {
    if (!isReady || !sharedContextRef.current) {
      console.warn('useSharedRendering: Not ready for rendering');
      return false;
    }

    try {
      const success = await sharedContextRef.current.renderToViewport(
        options.viewportId,
        content,
        {
          forceUpdate: renderOptions.forceUpdate,
          useCache: options.enableCache !== false,
          useSelectiveUpdate: renderOptions.useSelectiveUpdate
        }
      );

      if (success) {
        // Update metrics after successful render
        setMetrics(sharedContextRef.current.getMetrics());
        setError(null);
      }

      return success;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Render error';
      setError(errorMessage);
      console.error('❌ useSharedRendering: Render failed:', err);
      return false;
    }
  }, [isReady, options.viewportId, options.enableCache]);

  // Request batched render
  const requestRender = useCallback((content?: any) => {
    if (sharedContextRef.current) {
      return sharedContextRef.current.requestRender(options.viewportId, content);
    }
    return '';
  }, [options.viewportId]);

  // Clear cache function
  const clearCache = useCallback(() => {
    if (sharedContextRef.current) {
      sharedContextRef.current.clearCache();
      setMetrics(sharedContextRef.current.getMetrics());
    }
  }, []);

  return {
    canvasRef,
    isReady,
    renderContent,
    requestRender,
    metrics,
    error,
    clearCache
  };
};

/**
 * Hook for getting global rendering metrics
 */
export const useRenderingMetrics = (): RenderingMetrics | null => {
  const [metrics, setMetrics] = useState<RenderingMetrics | null>(null);

  useEffect(() => {
    const context = SharedRenderingContext.getInstance();

    const updateMetrics = () => {
      setMetrics(context.getMetrics());
    };

    // Update metrics initially
    updateMetrics();

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
};

export default useSharedRendering;