import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Clock,
  Play,
  Pause,
  Square,
  TrendingUp,
  TrendingDown,
  Minus,
  Timer
} from 'lucide-react';
import {
  selectPlanExecution,
  startPlanExecution,
  pausePlanExecution,
  resumePlanExecution,
  stopPlanExecution,
  updateElapsedTime
} from '../../lib/planExecutionSlice';
import { PlanWithItems } from '../../types/plan';

/**
 * TimeTracker Component
 *
 * Displays real-time clock, elapsed time, remaining time, and schedule status
 * during live service presentation execution.
 */

interface TimeTrackerProps {
  plan?: PlanWithItems | null;
  onStartExecution?: () => void;
  className?: string;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({
  plan,
  onStartExecution,
  className = ''
}) => {
  const dispatch = useDispatch();
  const executionState = useSelector(selectPlanExecution);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());

      // Update elapsed time if executing
      if (executionState.isExecuting && !executionState.isPaused) {
        dispatch(updateElapsedTime());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [executionState.isExecuting, executionState.isPaused, dispatch]);

  // Format time as HH:MM:SS
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Format duration as HH:MM or MM:SS
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes * 60) % 60);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}h`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate estimated end time
  const getEstimatedEndTime = (): string => {
    if (!executionState.startedAt || !executionState.totalDuration) {
      return '--:--:--';
    }

    const endTime = new Date(executionState.startedAt + executionState.totalDuration * 60000);
    return formatTime(endTime);
  };

  // Get time warning color
  const getTimeWarningColor = (): string => {
    if (!executionState.totalDuration || executionState.totalDuration === 0) {
      return 'text-gray-400';
    }

    const progressPercent = (executionState.elapsedDuration / executionState.totalDuration) * 100;

    if (progressPercent >= 100) {
      return 'text-red-500 animate-pulse';
    } else if (progressPercent >= 80) {
      return 'text-yellow-500';
    }
    return 'text-green-500';
  };

  // Get schedule status
  const getScheduleStatus = () => {
    if (!executionState.isExecuting) {
      return {
        icon: Minus,
        text: 'Not Started',
        color: 'text-gray-400'
      };
    }

    if (executionState.isAheadOfSchedule) {
      return {
        icon: TrendingUp,
        text: `${Math.abs(executionState.scheduleDeviation)} min ahead`,
        color: 'text-green-500'
      };
    } else if (executionState.isBehindSchedule) {
      return {
        icon: TrendingDown,
        text: `${Math.abs(executionState.scheduleDeviation)} min behind`,
        color: 'text-red-500'
      };
    }

    return {
      icon: Minus,
      text: 'On Schedule',
      color: 'text-blue-500'
    };
  };

  const scheduleStatus = getScheduleStatus();
  const ScheduleIcon = scheduleStatus.icon;

  // Handle start/pause/resume/stop actions
  const handleStart = () => {
    if (plan) {
      dispatch(startPlanExecution(plan));
      onStartExecution?.();
    }
  };

  const handlePause = () => {
    dispatch(pausePlanExecution());
  };

  const handleResume = () => {
    dispatch(resumePlanExecution());
  };

  const handleStop = () => {
    dispatch(stopPlanExecution());
  };

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Time Tracker</h3>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {!executionState.isExecuting && (
            <button
              onClick={handleStart}
              disabled={!plan}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              title="Start plan execution"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
          )}

          {executionState.isExecuting && !executionState.isPaused && (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
              title="Pause execution"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}

          {executionState.isExecuting && executionState.isPaused && (
            <button
              onClick={handleResume}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
              title="Resume execution"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
          )}

          {executionState.isExecuting && (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              title="Stop execution"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Time Display Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Current Time */}
        <div className="bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase">Current Time</span>
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Elapsed Time */}
        <div className="bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase">Elapsed</span>
          </div>
          <div className={`text-2xl font-mono font-bold ${getTimeWarningColor()}`}>
            {executionState.isExecuting
              ? formatDuration(executionState.elapsedDuration)
              : '--:--'}
          </div>
        </div>

        {/* Remaining Time */}
        <div className="bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase">Remaining</span>
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {executionState.isExecuting
              ? formatDuration(executionState.remainingDuration)
              : formatDuration(executionState.totalDuration)}
          </div>
        </div>

        {/* Estimated End Time */}
        <div className="bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase">Est. End</span>
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {getEstimatedEndTime()}
          </div>
        </div>
      </div>

      {/* Schedule Status */}
      {executionState.isExecuting && (
        <div className="mt-4 flex items-center justify-between bg-gray-900 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <ScheduleIcon className={`w-5 h-5 ${scheduleStatus.color}`} />
            <span className="text-sm font-medium text-gray-300">Schedule Status:</span>
          </div>
          <div className={`text-sm font-bold ${scheduleStatus.color}`}>
            {scheduleStatus.text}
          </div>
        </div>
      )}

      {/* Paused Indicator */}
      {executionState.isPaused && (
        <div className="mt-4 bg-yellow-900/30 border border-yellow-600 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-400">
            <Pause className="w-4 h-4" />
            <span className="text-sm font-medium">Execution Paused</span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {executionState.isExecuting && executionState.totalDuration > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>
              {Math.round((executionState.elapsedDuration / executionState.totalDuration) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                executionState.elapsedDuration >= executionState.totalDuration
                  ? 'bg-red-500'
                  : executionState.elapsedDuration >= executionState.totalDuration * 0.8
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (executionState.elapsedDuration / executionState.totalDuration) * 100
                )}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
