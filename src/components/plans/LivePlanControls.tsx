import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Clock,
  AlertCircle,
  CheckCircle,
  Radio,
  Eye,
  EyeOff,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RootState } from '../../lib/store';
import {
  startPlanExecution,
  pausePlanExecution,
  resumePlanExecution,
  stopPlanExecution,
  nextPlanItem,
  previousPlanItem,
  jumpToPlanItem
} from '../../lib/planExecutionSlice';
import { PlanItemWithContent } from '../../types/plan';

/**
 * LivePlanControls Component
 *
 * Live presentation controls for executing service plans:
 * - Start/pause/resume/stop execution
 * - Navigate between items (next/previous/jump)
 * - Current item display
 * - Live status indicator
 * - Auto-advance toggle
 * - Quick settings
 */

interface LivePlanControlsProps {
  planId: string;
  planTitle?: string;
  onGoLive?: (itemId: string) => void;
  onClearLive?: () => void;
  className?: string;
}

export const LivePlanControls: React.FC<LivePlanControlsProps> = ({
  planId,
  planTitle = 'Service Plan',
  onGoLive,
  onClearLive,
  className = ''
}) => {
  const dispatch = useDispatch();
  const executionState = useSelector((state: RootState) => state.planExecution);

  const [showSettings, setShowSettings] = useState(false);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(false);
  const [confirmStopDialog, setConfirmStopDialog] = useState(false);

  const isExecuting = executionState.isExecuting;
  const isPaused = executionState.isPaused;
  const isLive = executionState.isLive;
  const currentItem = executionState.activePlan?.items[executionState.currentItemIndex];
  const canGoNext = executionState.currentItemIndex < (executionState.activePlan?.items.length || 0) - 1;
  const canGoPrevious = executionState.currentItemIndex > 0;

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (executionState.activePlan) {
      dispatch(startPlanExecution(executionState.activePlan));
    }
  };

  const handlePause = () => {
    dispatch(pausePlanExecution());
  };

  const handleResume = () => {
    dispatch(resumePlanExecution());
  };

  const handleStop = () => {
    setConfirmStopDialog(true);
  };

  const confirmStop = () => {
    dispatch(stopPlanExecution());
    setConfirmStopDialog(false);
    if (onClearLive) {
      onClearLive();
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      dispatch(nextPlanItem());

      // Auto go live with next item
      if (isLive && onGoLive && executionState.activePlan) {
        const nextItem = executionState.activePlan.items[executionState.currentItemIndex + 1];
        if (nextItem) {
          onGoLive(nextItem.id);
        }
      }
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      dispatch(previousPlanItem());

      // Auto go live with previous item
      if (isLive && onGoLive && executionState.activePlan) {
        const prevItem = executionState.activePlan.items[executionState.currentItemIndex - 1];
        if (prevItem) {
          onGoLive(prevItem.id);
        }
      }
    }
  };

  const handleGoLive = () => {
    if (currentItem && onGoLive) {
      onGoLive(currentItem.id);
    }
  };

  const handleClearLive = () => {
    if (onClearLive) {
      onClearLive();
    }
  };

  // Auto-advance logic (when item duration expires)
  useEffect(() => {
    if (!autoAdvanceEnabled || !isExecuting || isPaused || !currentItem) return;

    const itemTiming = executionState.itemTimings[currentItem.id];
    if (!itemTiming || !itemTiming.startedAt) return;

    const plannedDuration = (currentItem.duration || 0) * 60 * 1000; // Convert to ms
    const elapsed = Date.now() - itemTiming.startedAt;

    if (elapsed >= plannedDuration && canGoNext) {
      handleNext();
    }
  }, [
    autoAdvanceEnabled,
    isExecuting,
    isPaused,
    currentItem,
    executionState.itemTimings,
    canGoNext
  ]);

  return (
    <div className={`${className}`}>
      {/* Main Controls */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            {isExecuting && (
              <div className="flex items-center gap-2">
                <div
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
                    ${
                      isLive
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-orange-500 text-white'
                    }
                  `}
                >
                  <Radio className="w-4 h-4" />
                  {isLive ? 'LIVE' : 'READY'}
                </div>
                {isPaused && (
                  <div className="px-3 py-1.5 rounded-full bg-yellow-500 text-gray-900 text-sm font-medium">
                    PAUSED
                  </div>
                )}
              </div>
            )}

            {/* Plan Title */}
            <div>
              <div className="text-sm text-gray-400">Now Running</div>
              <div className="font-medium text-white">{planTitle}</div>
            </div>
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Auto-advance items</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAdvanceEnabled}
                  onChange={(e) => setAutoAdvanceEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="text-xs text-gray-500">
              Automatically advance to next item when duration expires
            </div>
          </div>
        )}

        {/* Current Item Display */}
        {isExecuting && currentItem && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg border-2 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">Current Item</div>
              <div className="text-sm text-gray-400">
                Item {executionState.currentItemIndex + 1} of{' '}
                {executionState.activePlan?.items.length}
              </div>
            </div>
            <div className="text-xl font-medium text-white mb-2">{currentItem.title}</div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{currentItem.duration || 0} min planned</span>
              </div>
              {currentItem.notes && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="truncate max-w-xs">{currentItem.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Time Display */}
        {isExecuting && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-800 rounded p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Elapsed</div>
              <div className="text-lg font-mono font-medium text-white">
                {formatTime(executionState.elapsedDuration)}
              </div>
            </div>
            <div className="bg-gray-800 rounded p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Remaining</div>
              <div className="text-lg font-mono font-medium text-white">
                {formatTime(
                  Math.max(0, executionState.totalDuration - executionState.elapsedDuration)
                )}
              </div>
            </div>
            <div className="bg-gray-800 rounded p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Deviation</div>
              <div
                className={`text-lg font-mono font-medium ${
                  executionState.scheduleDeviation > 0
                    ? 'text-red-400'
                    : executionState.scheduleDeviation < 0
                    ? 'text-green-400'
                    : 'text-white'
                }`}
              >
                {executionState.scheduleDeviation > 0 ? '+' : ''}
                {formatTime(Math.abs(executionState.scheduleDeviation))}
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2">
          {/* Start/Stop */}
          {!isExecuting ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Play className="w-5 h-5" />
              Start Plan
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Square className="w-5 h-5" />
              Stop
            </button>
          )}

          {/* Pause/Resume */}
          {isExecuting &&
            (isPaused ? (
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Play className="w-5 h-5" />
                Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            ))}

          {/* Previous */}
          <button
            onClick={handlePrevious}
            disabled={!isExecuting || !canGoPrevious}
            className="p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous item"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Next */}
          <button
            onClick={handleNext}
            disabled={!isExecuting || !canGoNext}
            className="p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next item"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Go Live / Clear */}
          {isExecuting && (
            <>
              {isLive ? (
                <button
                  onClick={handleClearLive}
                  className="flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  title="Clear live display"
                >
                  <EyeOff className="w-5 h-5" />
                  Clear
                </button>
              ) : (
                <button
                  onClick={handleGoLive}
                  className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors animate-pulse"
                  title="Send to live display"
                >
                  <Eye className="w-5 h-5" />
                  Go Live
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm Stop Dialog */}
      {confirmStopDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-medium text-white">Stop Plan Execution?</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to stop the plan execution? All timing data will be saved, but
              you'll need to restart from the beginning.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmStopDialog(false)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStop}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Stop Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePlanControls;
