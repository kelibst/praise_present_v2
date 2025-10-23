import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Edit3,
  Trash2,
  Plus,
  Clock,
  ListOrdered
} from 'lucide-react';

/**
 * PlanSectionHeader Component
 *
 * Collapsible section header for grouping plan items
 * (e.g., Opening, Worship, Message, Closing)
 */

export interface PlanSection {
  id: string;
  planId: string;
  name: string;
  order: number;
  color?: string;
  icon?: string;
  collapsed: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemCount?: number;
  totalDuration?: number;
}

interface PlanSectionHeaderProps {
  section: PlanSection;
  itemCount: number;
  totalDuration: number;
  isCollapsed?: boolean;
  isDragging?: boolean;
  onToggleCollapse?: () => void;
  onEdit?: (section: PlanSection) => void;
  onDelete?: (sectionId: string) => void;
  onAddItem?: (sectionId: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  className?: string;
}

// Default section colors
const DEFAULT_SECTION_COLORS: Record<string, string> = {
  'Opening': '#3b82f6', // blue
  'Worship': '#8b5cf6', // purple
  'Message': '#10b981', // green
  'Closing': '#f59e0b', // amber
  'default': '#6b7280' // gray
};

export const PlanSectionHeader: React.FC<PlanSectionHeaderProps> = ({
  section,
  itemCount,
  totalDuration,
  isCollapsed = false,
  isDragging = false,
  onToggleCollapse,
  onEdit,
  onDelete,
  onAddItem,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Get section color
  const sectionColor = section.color || DEFAULT_SECTION_COLORS[section.name] || DEFAULT_SECTION_COLORS.default;

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative rounded-lg border-2 transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isHovered ? 'shadow-lg scale-[1.01]' : ''}
        ${className}
      `}
      style={{
        borderColor: sectionColor,
        backgroundColor: `${sectionColor}15` // 15% opacity
      }}
    >
      {/* Left Border Accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: sectionColor }}
      />

      {/* Header Content */}
      <div className="flex items-center gap-3 p-3 pl-4">
        {/* Drag Handle */}
        <button
          className="cursor-move text-gray-400 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Drag to reorder section"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Collapse/Expand Button */}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-gray-700/50 transition-colors"
          title={isCollapsed ? 'Expand section' : 'Collapse section'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* Section Icon (if provided) */}
        {section.icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: sectionColor }}
          >
            {section.icon}
          </div>
        )}

        {/* Section Name */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg font-bold truncate"
            style={{ color: sectionColor }}
          >
            {section.name}
          </h3>
        </div>

        {/* Section Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          {/* Item Count */}
          <div className="flex items-center gap-1.5">
            <ListOrdered className="w-4 h-4" />
            <span className="font-medium">{itemCount}</span>
            <span className="text-xs">items</span>
          </div>

          {/* Total Duration */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{formatDuration(totalDuration)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Add Item */}
          {onAddItem && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddItem(section.id);
              }}
              className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-700/50 rounded transition-colors"
              title="Add item to this section"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {/* Edit Section */}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(section);
              }}
              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700/50 rounded transition-colors"
              title="Edit section"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          {/* Delete Section */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (itemCount > 0) {
                  if (confirm(`Delete section "${section.name}" with ${itemCount} items?`)) {
                    onDelete(section.id);
                  }
                } else {
                  onDelete(section.id);
                }
              }}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700/50 rounded transition-colors"
              title="Delete section"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapsed Indicator - Quick Preview */}
      {isCollapsed && itemCount > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="flex-1 h-px bg-gray-700" />
            <span>{itemCount} items hidden</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>
        </div>
      )}
    </div>
  );
};

// Section Editor Modal Component
interface SectionEditorModalProps {
  section?: PlanSection | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color?: string; icon?: string }) => void;
}

export const SectionEditorModal: React.FC<SectionEditorModalProps> = ({
  section,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(section?.name || '');
  const [color, setColor] = useState(section?.color || DEFAULT_SECTION_COLORS.default);
  const [icon, setIcon] = useState(section?.icon || '');

  React.useEffect(() => {
    if (section) {
      setName(section.name);
      setColor(section.color || DEFAULT_SECTION_COLORS.default);
      setIcon(section.icon || '');
    } else {
      setName('');
      setColor(DEFAULT_SECTION_COLORS.default);
      setIcon('');
    }
  }, [section]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      color: color,
      icon: icon.trim() || undefined
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {section ? 'Edit Section' : 'Create Section'}
        </h3>

        <div className="space-y-4">
          {/* Section Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Section Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Opening, Worship, Message"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Section Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(DEFAULT_SECTION_COLORS).map(([key, value]) => {
                if (key === 'default') return null;
                return (
                  <button
                    key={key}
                    onClick={() => setColor(value)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      color === value ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: value }}
                    title={key}
                  />
                );
              })}
              {/* Custom color input */}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer"
                title="Custom color"
              />
            </div>
          </div>

          {/* Section Icon (emoji) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Icon (emoji or single character)
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value.slice(0, 2))}
              placeholder="e.g., 🎵, 📖, 💬"
              maxLength={2}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-center text-2xl"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {section ? 'Save Changes' : 'Create Section'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanSectionHeader;
