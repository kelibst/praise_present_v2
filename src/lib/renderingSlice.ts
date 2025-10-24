import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';

/**
 * Rendering Slice - Centralized rendering state management
 *
 * This slice manages the state of rendering engines (preview, live) and
 * provides a single source of truth for render scheduling, dirty tracking,
 * and performance metrics.
 *
 * Key Benefits:
 * - Centralized render state (no scattered RenderingEngine instances)
 * - Components can subscribe to specific engine metrics
 * - Easier to implement render scheduling/prioritization
 * - Debug rendering issues via Redux DevTools
 * - Coordinate rendering across multiple displays
 */

export type RenderPriority = 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW' | 'BACKGROUND';
export type RenderStatus = 'idle' | 'rendering' | 'error';

export interface DirtyRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  shapeIds: string[];
  priority: RenderPriority;
  timestamp: number;
}

export interface RenderTask {
  id: string;
  engineId: string;
  type: 'full' | 'selective' | 'shape';
  priority: RenderPriority;
  region?: DirtyRegion;
  shapeIds?: string[];
  timestamp: number;
  retries?: number;
}

export interface PerformanceMetrics {
  fps: number;
  avgRenderTime: number;
  lastRenderTime: number;
  totalRenders: number;
  selectiveRenders: number;
  fullRenders: number;
  skippedFrames: number;
  shapeCount: number;
  visibleShapeCount: number;
  lastUpdate: number;
}

export interface EngineState {
  id: string;
  status: RenderStatus;
  lastRender: number;
  metrics: PerformanceMetrics;
  error: string | null;
}

export interface RenderingState {
  // Rendering engines (preview, live, etc.)
  engines: {
    [engineId: string]: EngineState;
  };

  // Render task queue
  renderQueue: RenderTask[];

  // Dirty regions per engine
  dirtyRegions: {
    [engineId: string]: DirtyRegion[];
  };

  // Dirty shapes per engine (for selective rendering)
  dirtyShapes: {
    [engineId: string]: Set<string>;
  };

  // Global rendering settings
  settings: {
    enableSelectiveRendering: boolean;
    enablePerformanceTracking: boolean;
    maxDirtyRegions: number;
    renderBatchSize: number;
    targetFPS: number;
  };

  // Performance monitoring
  globalMetrics: {
    totalEngines: number;
    activeEngines: number;
    totalRenderTasks: number;
    averageFPS: number;
  };
}

const initialState: RenderingState = {
  engines: {},
  renderQueue: [],
  dirtyRegions: {},
  dirtyShapes: {},
  settings: {
    enableSelectiveRendering: true,
    enablePerformanceTracking: true,
    maxDirtyRegions: 20,
    renderBatchSize: 5,
    targetFPS: 60
  },
  globalMetrics: {
    totalEngines: 0,
    activeEngines: 0,
    totalRenderTasks: 0,
    averageFPS: 60
  }
};

export const renderingSlice = createSlice({
  name: 'rendering',
  initialState,
  reducers: {
    /**
     * Register a new rendering engine
     */
    registerEngine: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      if (!state.engines[id]) {
        state.engines[id] = {
          id,
          status: 'idle',
          lastRender: Date.now(),
          metrics: {
            fps: 60,
            avgRenderTime: 0,
            lastRenderTime: 0,
            totalRenders: 0,
            selectiveRenders: 0,
            fullRenders: 0,
            skippedFrames: 0,
            shapeCount: 0,
            visibleShapeCount: 0,
            lastUpdate: Date.now()
          },
          error: null
        };
        state.dirtyRegions[id] = [];
        state.dirtyShapes[id] = new Set();
        state.globalMetrics.totalEngines++;
      }
    },

    /**
     * Unregister a rendering engine
     */
    unregisterEngine: (state, action: PayloadAction<string>) => {
      const engineId = action.payload;
      if (state.engines[engineId]) {
        delete state.engines[engineId];
        delete state.dirtyRegions[engineId];
        delete state.dirtyShapes[engineId];
        state.globalMetrics.totalEngines--;
        // Remove pending tasks for this engine
        state.renderQueue = state.renderQueue.filter(task => task.engineId !== engineId);
      }
    },

    /**
     * Mark a shape as dirty (needs re-rendering)
     */
    markShapeDirty: (state, action: PayloadAction<{
      engineId: string;
      shapeId: string;
      bounds?: { x: number; y: number; width: number; height: number };
      priority?: RenderPriority;
    }>) => {
      const { engineId, shapeId, bounds, priority = 'MEDIUM' } = action.payload;

      if (!state.dirtyShapes[engineId]) {
        state.dirtyShapes[engineId] = new Set();
      }

      (state.dirtyShapes[engineId] as any).add(shapeId);

      // Add dirty region if bounds provided
      if (bounds && state.dirtyRegions[engineId]) {
        const existingRegion = state.dirtyRegions[engineId].find(r =>
          Math.abs(r.x - bounds.x) < 10 &&
          Math.abs(r.y - bounds.y) < 10
        );

        if (existingRegion) {
          // Merge with existing region
          existingRegion.shapeIds.push(shapeId);
          existingRegion.width = Math.max(existingRegion.width, bounds.width);
          existingRegion.height = Math.max(existingRegion.height, bounds.height);
        } else {
          // Create new region
          state.dirtyRegions[engineId].push({
            ...bounds,
            shapeIds: [shapeId],
            priority,
            timestamp: Date.now()
          });
        }

        // Limit number of dirty regions
        if (state.dirtyRegions[engineId].length > state.settings.maxDirtyRegions) {
          // Force full render by clearing regions
          state.dirtyRegions[engineId] = [];
          // Schedule full render task
          state.renderQueue.push({
            id: `full-${engineId}-${Date.now()}`,
            engineId,
            type: 'full',
            priority: 'HIGH',
            timestamp: Date.now()
          });
        }
      }
    },

    /**
     * Clear dirty shapes for an engine
     */
    clearDirtyShapes: (state, action: PayloadAction<string>) => {
      const engineId = action.payload;
      if (state.dirtyShapes[engineId]) {
        (state.dirtyShapes[engineId] as any) = new Set();
      }
      if (state.dirtyRegions[engineId]) {
        state.dirtyRegions[engineId] = [];
      }
    },

    /**
     * Schedule a render task
     */
    scheduleRender: (state, action: PayloadAction<{
      engineId: string;
      type?: 'full' | 'selective' | 'shape';
      priority?: RenderPriority;
      shapeIds?: string[];
    }>) => {
      const { engineId, type = 'selective', priority = 'MEDIUM', shapeIds } = action.payload;

      // Check if similar task already queued
      const existingTask = state.renderQueue.find(
        task => task.engineId === engineId && task.type === type
      );

      if (existingTask) {
        // Update priority if higher
        const priorityOrder = { IMMEDIATE: 0, HIGH: 1, MEDIUM: 2, LOW: 3, BACKGROUND: 4 };
        if (priorityOrder[priority] < priorityOrder[existingTask.priority]) {
          existingTask.priority = priority;
        }
        // Merge shape IDs if provided
        if (shapeIds && existingTask.shapeIds) {
          existingTask.shapeIds = Array.from(new Set([...existingTask.shapeIds, ...shapeIds]));
        }
      } else {
        // Add new task
        state.renderQueue.push({
          id: `${type}-${engineId}-${Date.now()}`,
          engineId,
          type,
          priority,
          shapeIds,
          timestamp: Date.now(),
          retries: 0
        });
        state.globalMetrics.totalRenderTasks++;
      }

      // Sort queue by priority
      state.renderQueue.sort((a, b) => {
        const priorityOrder = { IMMEDIATE: 0, HIGH: 1, MEDIUM: 2, LOW: 3, BACKGROUND: 4 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    },

    /**
     * Complete a render task
     */
    completeRenderTask: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      state.renderQueue = state.renderQueue.filter(task => task.id !== taskId);
    },

    /**
     * Retry a failed render task
     */
    retryRenderTask: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      const task = state.renderQueue.find(t => t.id === taskId);
      if (task) {
        task.retries = (task.retries || 0) + 1;
        task.timestamp = Date.now();
        // Move to end of queue if retrying
        if (task.retries > 3) {
          state.renderQueue = state.renderQueue.filter(t => t.id !== taskId);
        }
      }
    },

    /**
     * Update engine status
     */
    setEngineStatus: (state, action: PayloadAction<{
      engineId: string;
      status: RenderStatus;
      error?: string;
    }>) => {
      const { engineId, status, error } = action.payload;
      if (state.engines[engineId]) {
        state.engines[engineId].status = status;
        state.engines[engineId].error = error || null;
        if (status === 'rendering') {
          state.globalMetrics.activeEngines = Object.values(state.engines).filter(e => e.status === 'rendering').length;
        }
      }
    },

    /**
     * Update engine performance metrics
     */
    updateEngineMetrics: (state, action: PayloadAction<{
      engineId: string;
      metrics: Partial<PerformanceMetrics>;
    }>) => {
      const { engineId, metrics } = action.payload;
      if (state.engines[engineId]) {
        state.engines[engineId].metrics = {
          ...state.engines[engineId].metrics,
          ...metrics,
          lastUpdate: Date.now()
        };
        state.engines[engineId].lastRender = Date.now();

        // Update global metrics
        const allMetrics = Object.values(state.engines).map(e => e.metrics);
        state.globalMetrics.averageFPS =
          allMetrics.reduce((sum, m) => sum + m.fps, 0) / allMetrics.length;
      }
    },

    /**
     * Update rendering settings
     */
    updateRenderingSettings: (state, action: PayloadAction<Partial<RenderingState['settings']>>) => {
      state.settings = {
        ...state.settings,
        ...action.payload
      };
    }
  }
});

// Actions
export const {
  registerEngine,
  unregisterEngine,
  markShapeDirty,
  clearDirtyShapes,
  scheduleRender,
  completeRenderTask,
  retryRenderTask,
  setEngineStatus,
  updateEngineMetrics,
  updateRenderingSettings
} = renderingSlice.actions;

// Selectors
export const selectRendering = (state: RootState) => state.rendering;
export const selectEngine = (engineId: string) => (state: RootState) =>
  state.rendering.engines[engineId];
export const selectEngineMetrics = (engineId: string) => (state: RootState) =>
  state.rendering.engines[engineId]?.metrics;
export const selectRenderQueue = (state: RootState) => state.rendering.renderQueue;
export const selectDirtyShapes = (engineId: string) => (state: RootState) =>
  state.rendering.dirtyShapes[engineId];
export const selectDirtyRegions = (engineId: string) => (state: RootState) =>
  state.rendering.dirtyRegions[engineId];
export const selectGlobalMetrics = (state: RootState) => state.rendering.globalMetrics;
export const selectRenderingSettings = (state: RootState) => state.rendering.settings;

export default renderingSlice.reducer;
