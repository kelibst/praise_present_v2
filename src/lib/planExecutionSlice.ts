import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { PlanItemWithContent, PlanWithItems } from '../types/plan';

/**
 * Plan Execution State Management
 *
 * This Redux slice manages the live execution state of service plans,
 * tracking timing, progress, and live presentation status.
 */

export interface PlanExecutionState {
  // Current plan being executed
  activePlan: PlanWithItems | null;
  currentItemIndex: number;

  // Execution status
  isExecuting: boolean;
  isPaused: boolean;
  isLive: boolean; // Whether currently presenting live

  // Timing information
  startedAt: number | null; // timestamp
  pausedAt: number | null;
  completedAt: number | null;
  currentItemStartedAt: number | null;

  // Item-specific timing (actual vs. planned)
  itemTimings: Record<string, {
    itemId: string;
    plannedDuration: number; // minutes
    actualStart: number | null; // timestamp
    actualEnd: number | null;
    actualDuration: number | null; // minutes
  }>;

  // Progress tracking
  totalDuration: number; // Total planned duration in minutes
  elapsedDuration: number; // Total elapsed time in minutes
  remainingDuration: number;

  // Schedule deviation
  isAheadOfSchedule: boolean;
  isBehindSchedule: boolean;
  scheduleDeviation: number; // minutes (positive = ahead, negative = behind)

  // Auto-advance settings
  autoAdvanceEnabled: boolean;
  autoAdvanceDelay: number; // seconds between items

  // Live display integration
  liveDisplayActive: boolean;
  currentSlideIndex: number;
}

const initialState: PlanExecutionState = {
  activePlan: null,
  currentItemIndex: 0,
  isExecuting: false,
  isPaused: false,
  isLive: false,
  startedAt: null,
  pausedAt: null,
  completedAt: null,
  currentItemStartedAt: null,
  itemTimings: {},
  totalDuration: 0,
  elapsedDuration: 0,
  remainingDuration: 0,
  isAheadOfSchedule: false,
  isBehindSchedule: false,
  scheduleDeviation: 0,
  autoAdvanceEnabled: false,
  autoAdvanceDelay: 3,
  liveDisplayActive: false,
  currentSlideIndex: 0
};

export const planExecutionSlice = createSlice({
  name: 'planExecution',
  initialState,
  reducers: {
    // Start executing a plan
    startPlanExecution: (state, action: PayloadAction<PlanWithItems>) => {
      const plan = action.payload;
      const now = Date.now();

      state.activePlan = plan;
      state.isExecuting = true;
      state.isPaused = false;
      state.startedAt = now;
      state.currentItemIndex = 0;
      state.currentItemStartedAt = now;
      state.completedAt = null;

      // Calculate total duration
      state.totalDuration = plan.planItems.reduce((sum, item) => sum + (item.duration || 0), 0);
      state.remainingDuration = state.totalDuration;
      state.elapsedDuration = 0;

      // Initialize item timings
      state.itemTimings = {};
      plan.planItems.forEach(item => {
        state.itemTimings[item.id] = {
          itemId: item.id,
          plannedDuration: item.duration || 0,
          actualStart: null,
          actualEnd: null,
          actualDuration: null
        };
      });

      // Mark first item as started
      if (plan.planItems[0]) {
        state.itemTimings[plan.planItems[0].id].actualStart = now;
      }
    },

    // Pause execution
    pausePlanExecution: (state) => {
      if (state.isExecuting && !state.isPaused) {
        state.isPaused = true;
        state.pausedAt = Date.now();
      }
    },

    // Resume execution
    resumePlanExecution: (state) => {
      if (state.isExecuting && state.isPaused && state.pausedAt) {
        state.isPaused = false;

        // Adjust timing for paused duration
        const pausedDuration = Date.now() - state.pausedAt;
        if (state.startedAt) {
          state.startedAt += pausedDuration;
        }
        if (state.currentItemStartedAt) {
          state.currentItemStartedAt += pausedDuration;
        }

        state.pausedAt = null;
      }
    },

    // Stop execution completely
    stopPlanExecution: (state) => {
      if (state.isExecuting) {
        const now = Date.now();
        state.completedAt = now;
        state.isExecuting = false;
        state.isPaused = false;
        state.isLive = false;

        // Mark current item as ended
        if (state.activePlan && state.activePlan.planItems[state.currentItemIndex]) {
          const currentItem = state.activePlan.planItems[state.currentItemIndex];
          const timing = state.itemTimings[currentItem.id];
          if (timing && !timing.actualEnd) {
            timing.actualEnd = now;
            if (timing.actualStart) {
              timing.actualDuration = Math.round((now - timing.actualStart) / 60000); // Convert to minutes
            }
          }
        }
      }
    },

    // Navigate to next item
    nextPlanItem: (state) => {
      if (!state.activePlan || !state.isExecuting) return;

      const now = Date.now();
      const currentItem = state.activePlan.planItems[state.currentItemIndex];

      // Mark current item as ended
      if (currentItem) {
        const timing = state.itemTimings[currentItem.id];
        if (timing && !timing.actualEnd) {
          timing.actualEnd = now;
          if (timing.actualStart) {
            timing.actualDuration = Math.round((now - timing.actualStart) / 60000);
            state.elapsedDuration += timing.actualDuration;
          }
        }
      }

      // Move to next item
      if (state.currentItemIndex < state.activePlan.planItems.length - 1) {
        state.currentItemIndex++;
        state.currentItemStartedAt = now;
        state.currentSlideIndex = 0;

        // Mark next item as started
        const nextItem = state.activePlan.planItems[state.currentItemIndex];
        if (nextItem) {
          state.itemTimings[nextItem.id].actualStart = now;
        }
      } else {
        // Reached end of plan
        state.completedAt = now;
        state.isExecuting = false;
        state.isLive = false;
      }

      // Update remaining duration
      state.remainingDuration = state.totalDuration - state.elapsedDuration;
    },

    // Navigate to previous item
    previousPlanItem: (state) => {
      if (!state.activePlan || !state.isExecuting) return;

      const now = Date.now();
      const currentItem = state.activePlan.planItems[state.currentItemIndex];

      // Mark current item as not started (reset timing)
      if (currentItem) {
        const timing = state.itemTimings[currentItem.id];
        if (timing) {
          timing.actualStart = null;
          timing.actualEnd = null;
          timing.actualDuration = null;
        }
      }

      // Move to previous item
      if (state.currentItemIndex > 0) {
        state.currentItemIndex--;
        state.currentItemStartedAt = now;
        state.currentSlideIndex = 0;

        // Mark previous item as started
        const prevItem = state.activePlan.planItems[state.currentItemIndex];
        if (prevItem) {
          state.itemTimings[prevItem.id].actualStart = now;
        }
      }
    },

    // Jump to specific item
    goToPlanItem: (state, action: PayloadAction<number>) => {
      if (!state.activePlan || !state.isExecuting) return;

      const targetIndex = action.payload;
      if (targetIndex >= 0 && targetIndex < state.activePlan.planItems.length) {
        const now = Date.now();

        // Mark current item as ended
        const currentItem = state.activePlan.planItems[state.currentItemIndex];
        if (currentItem) {
          const timing = state.itemTimings[currentItem.id];
          if (timing && !timing.actualEnd && timing.actualStart) {
            timing.actualEnd = now;
            timing.actualDuration = Math.round((now - timing.actualStart) / 60000);
          }
        }

        state.currentItemIndex = targetIndex;
        state.currentItemStartedAt = now;
        state.currentSlideIndex = 0;

        // Mark target item as started
        const targetItem = state.activePlan.planItems[targetIndex];
        if (targetItem) {
          state.itemTimings[targetItem.id].actualStart = now;
        }
      }
    },

    // Go live (start presenting on live display)
    goLive: (state) => {
      if (state.isExecuting && !state.isLive) {
        state.isLive = true;
        state.liveDisplayActive = true;
      }
    },

    // Clear live display
    clearLive: (state) => {
      state.isLive = false;
    },

    // Update elapsed time (called by interval timer)
    updateElapsedTime: (state) => {
      if (!state.isExecuting || state.isPaused || !state.startedAt) return;

      const now = Date.now();
      const totalElapsed = Math.round((now - state.startedAt) / 60000); // minutes
      state.elapsedDuration = totalElapsed;
      state.remainingDuration = Math.max(0, state.totalDuration - totalElapsed);

      // Calculate schedule deviation
      // Sum actual durations of completed items vs. their planned durations
      let actualSum = 0;
      let plannedSum = 0;

      for (let i = 0; i < state.currentItemIndex; i++) {
        const item = state.activePlan?.planItems[i];
        if (item) {
          const timing = state.itemTimings[item.id];
          if (timing) {
            actualSum += timing.actualDuration || 0;
            plannedSum += timing.plannedDuration;
          }
        }
      }

      state.scheduleDeviation = plannedSum - actualSum;
      state.isAheadOfSchedule = state.scheduleDeviation > 2; // More than 2 minutes ahead
      state.isBehindSchedule = state.scheduleDeviation < -2; // More than 2 minutes behind
    },

    // Set slide index for current item
    setCurrentSlideIndex: (state, action: PayloadAction<number>) => {
      state.currentSlideIndex = action.payload;
    },

    // Toggle auto-advance
    toggleAutoAdvance: (state) => {
      state.autoAdvanceEnabled = !state.autoAdvanceEnabled;
    },

    // Set auto-advance delay
    setAutoAdvanceDelay: (state, action: PayloadAction<number>) => {
      state.autoAdvanceDelay = Math.max(0, action.payload);
    },

    // Set live display active status
    setLiveDisplayActive: (state, action: PayloadAction<boolean>) => {
      state.liveDisplayActive = action.payload;
    },

    // Reset execution state
    resetPlanExecution: () => initialState
  }
});

export const {
  startPlanExecution,
  pausePlanExecution,
  resumePlanExecution,
  stopPlanExecution,
  nextPlanItem,
  previousPlanItem,
  goToPlanItem,
  goLive,
  clearLive,
  updateElapsedTime,
  setCurrentSlideIndex,
  toggleAutoAdvance,
  setAutoAdvanceDelay,
  setLiveDisplayActive,
  resetPlanExecution
} = planExecutionSlice.actions;

// Selectors
export const selectPlanExecution = (state: RootState) => state.planExecution;
export const selectActivePlan = (state: RootState) => state.planExecution.activePlan;
export const selectCurrentPlanItem = (state: RootState) => {
  const { activePlan, currentItemIndex } = state.planExecution;
  return activePlan?.planItems[currentItemIndex] || null;
};
export const selectNextPlanItem = (state: RootState) => {
  const { activePlan, currentItemIndex } = state.planExecution;
  if (!activePlan) return null;
  return activePlan.planItems[currentItemIndex + 1] || null;
};
export const selectPreviousPlanItem = (state: RootState) => {
  const { activePlan, currentItemIndex } = state.planExecution;
  if (!activePlan || currentItemIndex === 0) return null;
  return activePlan.planItems[currentItemIndex - 1] || null;
};
export const selectIsExecuting = (state: RootState) => state.planExecution.isExecuting;
export const selectIsPaused = (state: RootState) => state.planExecution.isPaused;
export const selectIsLive = (state: RootState) => state.planExecution.isLive;
export const selectPlanProgress = (state: RootState) => {
  const { activePlan, currentItemIndex } = state.planExecution;
  if (!activePlan || activePlan.planItems.length === 0) return 0;
  return Math.round((currentItemIndex / activePlan.planItems.length) * 100);
};
export const selectScheduleStatus = (state: RootState) => ({
  isAheadOfSchedule: state.planExecution.isAheadOfSchedule,
  isBehindSchedule: state.planExecution.isBehindSchedule,
  deviation: state.planExecution.scheduleDeviation
});

export default planExecutionSlice.reducer;
