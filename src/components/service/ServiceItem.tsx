import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

// Define types for service items and slides
interface Slide {
  id: string;
  shapes: any[];
  background?: {
    type: 'color' | 'image' | 'gradient';
    value: string;
  };
  duration?: number;
}

export interface ServiceItem {
  id: string;
  type: 'scripture' | 'song' | 'announcement' | 'media' | 'sermon';
  title: string;
  content: any;
  slides?: Slide[];
  duration?: number;
  order?: number;
  notes?: string;
  // Plan-specific fields (when item comes from a plan)
  planId?: string;
  planItemId?: string;
}

export interface SortableServiceItemProps {
  item: ServiceItem;
  index: number;
  isSelected: boolean;
  isLoading: boolean;
  isPresentingThis: boolean;
  onSelect: (item: ServiceItem, event: React.MouseEvent) => void;
  onPresent: (item: ServiceItem, event: React.MouseEvent) => void;
}

export const SortableServiceItem: React.FC<SortableServiceItemProps> = ({
  item,
  index,
  isSelected,
  isLoading,
  isPresentingThis,
  onSelect,
  onPresent,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative transition-all duration-200 ${
        isDragging ? 'z-50' : ''
      }`}
    >
      <div
        onClick={(e) => onSelect(item, e)}
        onDoubleClick={(e) => onPresent(item, e)}
        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
          isSelected
            ? isPresentingThis
              ? 'border-green-500 bg-green-500/10 dark:bg-green-900/30 shadow-lg'
              : 'border-primary bg-primary/10 dark:bg-blue-900/30 shadow-md'
            : 'border-border bg-secondary hover:bg-secondary/80 hover:border-border'
        } ${isLoading ? 'animate-pulse' : ''} ${
          isDragging
            ? 'scale-110 shadow-2xl opacity-85 rotate-2 bg-card/90 border-primary ring-2 ring-primary/50 backdrop-blur-sm'
            : 'hover:scale-[1.02] hover:shadow-lg'
        }`}
        title={`Single click to preview • Double click to present live • Drag to reorder`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className={`absolute left-1 top-1/2 transform -translate-y-1/2 transition-all duration-200 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted hover:scale-110 ${
            isDragging
              ? 'opacity-100 bg-primary text-primary-foreground scale-125'
              : 'opacity-0 group-hover:opacity-100'
          }`}
          title="Drag to reorder"
        >
          <GripVertical className={`w-4 h-4 transition-colors duration-200 ${
            isDragging
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`} />
        </div>

        <div className="flex items-center justify-between ml-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                {index + 1}
              </div>
              {/* Type icon */}
              {item.type === 'song' && <div className="text-blue-400">♪</div>}
              {item.type === 'scripture' && <div className="text-purple-400">📖</div>}
              {item.type === 'announcement' && <div className="text-yellow-400">📢</div>}
              {item.type === 'sermon' && <div className="text-green-400">🎯</div>}

              <div className="font-medium text-foreground">{item.title}</div>

              {isLoading && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              {isPresentingThis && (
                <div className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium animate-pulse">
                  LIVE
                </div>
              )}
              {item.planId && (
                <div className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 text-xs rounded border border-purple-300 dark:border-purple-600/30">
                  Plan Item
                </div>
              )}
            </div>

            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="capitalize">{item.type}</span>
              {item.slides && <span>• {item.slides.length} slides</span>}
              {item.duration && <span>• {item.duration}s</span>}
              {item.notes && <span>• Has notes</span>}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {isSelected && (
              <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary dark:bg-blue-900/50 dark:text-blue-300 border border-primary dark:border-blue-600/30">
                {isPresentingThis ? 'Live Mode' : 'Preview'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortableServiceItem;