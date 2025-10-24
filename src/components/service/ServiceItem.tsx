import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Save, X } from 'lucide-react';

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
  onEdit?: (item: ServiceItem) => void;
  onDelete?: (itemId: string) => void;
}

export const SortableServiceItem: React.FC<SortableServiceItemProps> = ({
  item,
  index,
  isSelected,
  isLoading,
  isPresentingThis,
  onSelect,
  onPresent,
  onEdit,
  onDelete,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDuration, setEditDuration] = useState(item.duration || 60);
  const [editNotes, setEditNotes] = useState(item.notes || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditTitle(item.title);
    setEditDuration(item.duration || 60);
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit({
        ...item,
        title: editTitle,
        duration: editDuration,
        notes: editNotes
      });
    }
    setIsEditMode(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(false);
    setEditTitle(item.title);
    setEditDuration(item.duration || 60);
    setEditNotes(item.notes || '');
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(item.id);
    }
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

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
            {isEditMode ? (
              /* Edit Mode */
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                    {index + 1}
                  </div>
                  {item.type === 'song' && <div className="text-blue-400">♪</div>}
                  {item.type === 'scripture' && <div className="text-purple-400">📖</div>}
                  {item.type === 'announcement' && <div className="text-yellow-400">📢</div>}
                  {item.type === 'sermon' && <div className="text-green-400">🎯</div>}
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 px-2 py-1 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Title"
                  />
                </div>
                <div className="flex items-center gap-2 ml-6">
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseInt(e.target.value) || 60)}
                    className="w-20 px-2 py-1 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Duration"
                  />
                  <span className="text-xs text-muted-foreground">seconds</span>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="flex-1 px-2 py-1 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Notes (optional)"
                  />
                </div>
                <div className="flex gap-2 ml-6">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <>
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
                  {item.slides && item.slides.length > 0 ? (
                    <span className="text-green-400">• {item.slides.length} slide{item.slides.length !== 1 ? 's' : ''}</span>
                  ) : (
                    <span className="text-yellow-400">• No slides yet</span>
                  )}
                  {item.duration && <span>• {item.duration}s</span>}
                  {item.notes && <span>• Has notes</span>}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEditMode && !showDeleteConfirm && (
              <>
                {/* Edit/Delete buttons - shown on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {onEdit && (
                    <button
                      onClick={handleEditClick}
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      title="Edit item"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDeleteClick}
                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {isSelected && (
                  <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary dark:bg-blue-900/50 dark:text-blue-300 border border-primary dark:border-blue-600/30">
                    {isPresentingThis ? 'Live Mode' : 'Preview'}
                  </div>
                )}
              </>
            )}

            {/* Delete confirmation */}
            {showDeleteConfirm && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleConfirmDelete}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortableServiceItem;