import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Clock, User, FileText } from 'lucide-react';
import { PlanItemWithContent } from '../../types/plan';

/**
 * PlanItemQuickEdit Component
 *
 * Inline editing for plan item properties (title, duration, notes, assignee)
 * without opening a full modal editor.
 */

interface PlanItemQuickEditProps {
  item: PlanItemWithContent;
  field: 'title' | 'duration' | 'notes' | 'assignee';
  isEditing: boolean;
  onSave: (field: string, value: any) => void;
  onCancel: () => void;
  className?: string;
}

export const PlanItemQuickEdit: React.FC<PlanItemQuickEditProps> = ({
  item,
  field,
  isEditing,
  onSave,
  onCancel,
  className = ''
}) => {
  const [value, setValue] = useState<any>('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Initialize value when editing starts
  useEffect(() => {
    if (isEditing) {
      switch (field) {
        case 'title':
          setValue(item.title || '');
          break;
        case 'duration':
          setValue(item.duration || 0);
          break;
        case 'notes':
          setValue(item.notes || '');
          break;
        case 'assignee':
          setValue(item.assignee || '');
          break;
      }

      // Focus input after render
      setTimeout(() => {
        inputRef.current?.focus();
        if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
          inputRef.current.select();
        }
      }, 0);
    }
  }, [isEditing, field, item]);

  const handleSave = () => {
    // Validate
    if (field === 'title' && !value.trim()) {
      onCancel();
      return;
    }

    if (field === 'duration') {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 0) {
        onCancel();
        return;
      }
      onSave(field, numValue);
    } else {
      onSave(field, value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && field !== 'notes') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isEditing) {
    // Display mode
    return (
      <div className={`${className}`}>
        {renderDisplayValue()}
      </div>
    );
  }

  // Edit mode
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {renderInput()}

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="p-1.5 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded transition-colors"
        title="Save"
      >
        <Check className="w-4 h-4" />
      </button>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
        title="Cancel"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  function renderDisplayValue() {
    switch (field) {
      case 'title':
        return (
          <span className="font-medium text-white">{item.title}</span>
        );

      case 'duration':
        return (
          <div className="flex items-center gap-1.5 text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{item.duration || 0} min</span>
          </div>
        );

      case 'notes':
        return (
          <div className="flex items-start gap-1.5 text-gray-400">
            <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-sm line-clamp-2">{item.notes || 'No notes'}</span>
          </div>
        );

      case 'assignee':
        return (
          <div className="flex items-center gap-1.5 text-gray-400">
            <User className="w-4 h-4" />
            <span className="text-sm">{item.assignee || 'Unassigned'}</span>
          </div>
        );

      default:
        return null;
    }
  }

  function renderInput() {
    switch (field) {
      case 'title':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter title..."
            className="flex-1 px-3 py-1.5 bg-gray-700 border border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'duration':
        return (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="number"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0"
              className="w-20 px-3 py-1.5 bg-gray-700 border border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
            />
            <span className="text-sm text-gray-400">min</span>
          </div>
        );

      case 'notes':
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // Allow Enter for new lines in textarea
              if (e.key === 'Escape') {
                onCancel();
              }
              // Ctrl+Enter or Cmd+Enter to save
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="Enter notes... (Ctrl+Enter to save)"
            rows={3}
            className="flex-1 px-3 py-2 bg-gray-700 border border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        );

      case 'assignee':
        return (
          <div className="flex items-center gap-2 flex-1">
            <User className="w-4 h-4 text-gray-400" />
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter name..."
              className="flex-1 px-3 py-1.5 bg-gray-700 border border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      default:
        return null;
    }
  }
};

// Inline Edit Wrapper Component
interface InlineEditWrapperProps {
  value: string | number | null | undefined;
  field: 'title' | 'duration' | 'notes' | 'assignee';
  item: PlanItemWithContent;
  onSave: (field: string, value: any) => void;
  renderValue?: (value: any) => React.ReactNode;
  className?: string;
}

export const InlineEditWrapper: React.FC<InlineEditWrapperProps> = ({
  value,
  field,
  item,
  onSave,
  renderValue,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (field: string, newValue: any) => {
    onSave(field, newValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <PlanItemQuickEdit
        item={item}
        field={field}
        isEditing={isEditing}
        onSave={handleSave}
        onCancel={handleCancel}
        className={className}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-gray-700/50 rounded px-2 py-1 transition-colors ${className}`}
      title={`Click to edit ${field}`}
    >
      {renderValue ? renderValue(value) : value || `No ${field}`}
    </div>
  );
};

export default PlanItemQuickEdit;
