import React, { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectPlanExecution } from '../../lib/planExecutionSlice';
import { PlanWithItems, PlanItemType } from '../../types/plan';
import {
  Music,
  BookOpen,
  Film,
  MessageCircle,
  Clock,
  CheckCircle2,
  Circle,
  Play
} from 'lucide-react';

/**
 * PlanTimeline Component
 *
 * Visual timeline showing service plan items as colored bars,
 * with current position indicator and click-to-jump functionality.
 */

interface PlanTimelineProps {
  plan: PlanWithItems | null;
  onItemClick?: (index: number) => void;
  className?: string;
}

const ITEM_TYPE_COLORS: Record<PlanItemType, {
  bg: string;
  border: string;
  text: string;
}> = {
  song: {
    bg: 'bg-blue-500',
    border: 'border-blue-600',
    text: 'text-blue-100'
  },
  scripture: {
    bg: 'bg-green-500',
    border: 'border-green-600',
    text: 'text-green-100'
  },
  presentation: {
    bg: 'bg-purple-500',
    border: 'border-purple-600',
    text: 'text-purple-100'
  },
  announcement: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-600',
    text: 'text-yellow-100'
  },
  media: {
    bg: 'bg-red-500',
    border: 'border-red-600',
    text: 'text-red-100'
  },
  transition: {
    bg: 'bg-gray-500',
    border: 'border-gray-600',
    text: 'text-gray-100'
  }
};

const ITEM_TYPE_ICONS: Record<PlanItemType, React.ComponentType<any>> = {
  song: Music,
  scripture: BookOpen,
  presentation: Film,
  announcement: MessageCircle,
  media: Film,
  transition: Circle
};

export const PlanTimeline: React.FC<PlanTimelineProps> = ({
  plan,
  onItemClick,
  className = ''
}) => {
  const executionState = useSelector(selectPlanExecution);
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentItemRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Auto-scroll to current item
  useEffect(() => {
    if (executionState.isExecuting && currentItemRef.current && timelineRef.current) {
      const timeline = timelineRef.current;
      const currentItem = currentItemRef.current;

      const timelineRect = timeline.getBoundingClientRect();
      const itemRect = currentItem.getBoundingClientRect();

      // Check if current item is out of view
      if (itemRect.left < timelineRect.left || itemRect.right > timelineRect.right) {
        // Scroll to center the current item
        const scrollLeft = currentItem.offsetLeft - (timeline.clientWidth / 2) + (currentItem.clientWidth / 2);
        timeline.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [executionState.currentItemIndex, executionState.isExecuting]);

  if (!plan || plan.planItems.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg border border-gray-700 p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No plan items to display</p>
        </div>
      </div>
    );
  }

  const totalDuration = plan.planItems.reduce((sum, item) => sum + (item.duration || 0), 0);

  // Calculate bar widths based on duration
  const getBarWidth = (duration: number): string => {
    if (totalDuration === 0) {
      return `${100 / plan.planItems.length}%`;
    }
    // Minimum width of 60px, maximum based on duration percentage
    const percentage = (duration / totalDuration) * 100;
    return `max(60px, ${percentage}%)`;
  };

  // Handle item click
  const handleItemClick = (index: number) => {
    if (onItemClick) {
      onItemClick(index);
    }
  };

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Get item status
  const getItemStatus = (index: number) => {
    if (!executionState.isExecuting) {
      return 'pending';
    }

    if (index < executionState.currentItemIndex) {
      return 'completed';
    } else if (index === executionState.currentItemIndex) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Service Timeline</h3>
        </div>
        <div className="text-sm text-gray-400">
          {plan.planItems.length} items • {formatDuration(totalDuration)} total
        </div>
      </div>

      {/* Timeline Scroll Container */}
      <div
        ref={timelineRef}
        className="overflow-x-auto p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        <div className="flex gap-2 min-w-max">
          {plan.planItems.map((item, index) => {
            const status = getItemStatus(index);
            const isHovered = hoveredIndex === index;
            const colors = ITEM_TYPE_COLORS[item.type as PlanItemType] || ITEM_TYPE_COLORS.announcement;
            const Icon = ITEM_TYPE_ICONS[item.type as PlanItemType] || MessageCircle;
            const timing = executionState.itemTimings[item.id];

            return (
              <div
                key={item.id}
                ref={status === 'active' ? currentItemRef : null}
                className={`
                  relative flex-shrink-0 rounded-lg border-2 overflow-hidden cursor-pointer
                  transition-all duration-200 group
                  ${status === 'active'
                    ? `${colors.border} ${colors.bg} shadow-lg scale-105 ring-2 ring-blue-400`
                    : status === 'completed'
                    ? 'border-gray-600 bg-gray-700 opacity-60'
                    : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  }
                  ${isHovered ? 'scale-105 z-10' : ''}
                `}
                style={{ width: getBarWidth(item.duration || 0) }}
                onClick={() => handleItemClick(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Item Content */}
                <div className="p-3 h-full flex flex-col justify-between">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${status === 'active' ? colors.text : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium uppercase tracking-wide truncate ${status === 'active' ? colors.text : 'text-gray-400'}`}>
                        {item.type}
                      </span>
                    </div>

                    {/* Status Icon */}
                    {status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    )}
                    {status === 'active' && (
                      <Play className={`w-4 h-4 flex-shrink-0 ${colors.text} animate-pulse`} />
                    )}
                    {status === 'pending' && (
                      <Circle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    )}
                  </div>

                  {/* Title */}
                  <h4 className={`text-sm font-semibold mb-1 line-clamp-2 ${status === 'active' ? 'text-white' : 'text-gray-300'}`}>
                    {item.title}
                  </h4>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs">
                    <div className={`flex items-center gap-1 ${status === 'active' ? colors.text : 'text-gray-400'}`}>
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(item.duration || 0)}</span>
                    </div>

                    {/* Actual Duration (if completed) */}
                    {timing?.actualDuration && (
                      <div className={`
                        px-1.5 py-0.5 rounded text-xs font-medium
                        ${timing.actualDuration > (item.duration || 0)
                          ? 'bg-red-900/50 text-red-300'
                          : timing.actualDuration < (item.duration || 0)
                          ? 'bg-green-900/50 text-green-300'
                          : 'bg-gray-900/50 text-gray-300'
                        }
                      `}>
                        {formatDuration(timing.actualDuration)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar (for active item) */}
                {status === 'active' && executionState.currentItemStartedAt && item.duration && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900/50">
                    <div
                      className={`h-full ${colors.bg} transition-all duration-1000`}
                      style={{
                        width: `${Math.min(
                          100,
                          ((Date.now() - executionState.currentItemStartedAt) / (item.duration * 60000)) * 100
                        )}%`
                      }}
                    />
                  </div>
                )}

                {/* Hover Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg whitespace-nowrap z-20">
                    <div className="text-xs font-medium text-white mb-1">{item.title}</div>
                    <div className="text-xs text-gray-400">
                      Item {index + 1} of {plan.planItems.length}
                    </div>
                    {item.notes && (
                      <div className="text-xs text-gray-400 mt-1 max-w-xs line-clamp-2">
                        {item.notes}
                      </div>
                    )}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                      <div className="border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 p-3 bg-gray-900/50 border-t border-gray-700 text-xs">
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded ${ITEM_TYPE_COLORS.song.bg}`} />
          <span className="text-gray-400">Song</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded ${ITEM_TYPE_COLORS.scripture.bg}`} />
          <span className="text-gray-400">Scripture</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded ${ITEM_TYPE_COLORS.presentation.bg}`} />
          <span className="text-gray-400">Presentation</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded ${ITEM_TYPE_COLORS.announcement.bg}`} />
          <span className="text-gray-400">Announcement</span>
        </div>
      </div>
    </div>
  );
};

export default PlanTimeline;
