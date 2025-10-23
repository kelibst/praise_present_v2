import React, { useState, useEffect } from 'react';
import {
  Save,
  X,
  Plus,
  Trash2,
  GripVertical,
  AlertCircle,
  FileText,
  Copy,
  Settings,
  ChevronDown,
  ChevronRight,
  Music,
  BookOpen,
  Film,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { PlanItemType } from '../../types/plan';

/**
 * TemplateEditor Component
 *
 * Create and edit custom plan templates with:
 * - Add/remove/reorder items
 * - Set default durations and settings
 * - Define template variables
 * - Preview template structure
 * - Save for reuse
 */

export interface TemplateItem {
  id: string;
  type: PlanItemType;
  title: string;
  duration?: number;
  notes?: string;
  variables?: Record<string, string>;
  order: number;
}

export interface PlanTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'seasonal' | 'service-type' | 'custom';
  tags?: string[];
  items: TemplateItem[];
  variables?: string[]; // List of variable names used
  totalDuration?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TemplateEditorProps {
  template?: PlanTemplate;
  onSave: (template: PlanTemplate) => void;
  onCancel: () => void;
  className?: string;
}

const ITEM_TYPE_CONFIG: Record<
  PlanItemType,
  { label: string; icon: React.ComponentType<any>; color: string }
> = {
  song: { label: 'Song', icon: Music, color: 'text-blue-400 bg-blue-900/20' },
  scripture: { label: 'Scripture', icon: BookOpen, color: 'text-green-400 bg-green-900/20' },
  presentation: { label: 'Presentation', icon: Film, color: 'text-purple-400 bg-purple-900/20' },
  announcement: { label: 'Announcement', icon: MessageSquare, color: 'text-orange-400 bg-orange-900/20' },
  transition: { label: 'Transition', icon: ArrowRight, color: 'text-gray-400 bg-gray-900/20' }
};

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
  className = ''
}) => {
  const [templateData, setTemplateData] = useState<PlanTemplate>(
    template || {
      id: `template-${Date.now()}`,
      name: '',
      description: '',
      category: 'custom',
      tags: [],
      items: [],
      variables: []
    }
  );

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showVariablesPanel, setShowVariablesPanel] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Calculate total duration
  useEffect(() => {
    const total = templateData.items.reduce((sum, item) => sum + (item.duration || 0), 0);
    setTemplateData((prev) => ({ ...prev, totalDuration: total }));
  }, [templateData.items]);

  // Extract variables from items
  useEffect(() => {
    const variablePattern = /\{([A-Z_]+)\}/g;
    const variableSet = new Set<string>();

    templateData.items.forEach((item) => {
      // Check title
      const titleMatches = item.title.matchAll(variablePattern);
      for (const match of titleMatches) {
        variableSet.add(match[1]);
      }

      // Check notes
      if (item.notes) {
        const notesMatches = item.notes.matchAll(variablePattern);
        for (const match of notesMatches) {
          variableSet.add(match[1]);
        }
      }
    });

    setTemplateData((prev) => ({
      ...prev,
      variables: Array.from(variableSet)
    }));
  }, [templateData.items]);

  const handleAddItem = (type: PlanItemType) => {
    const newItem: TemplateItem = {
      id: `item-${Date.now()}`,
      type,
      title: '',
      duration: type === 'transition' ? 1 : 5,
      order: templateData.items.length
    };

    setTemplateData((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setEditingItemId(newItem.id);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<TemplateItem>) => {
    setTemplateData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  };

  const handleDeleteItem = (itemId: string) => {
    setTemplateData((prev) => ({
      ...prev,
      items: prev.items
        .filter((item) => item.id !== itemId)
        .map((item, index) => ({ ...item, order: index }))
    }));
  };

  const handleDuplicateItem = (itemId: string) => {
    const itemToDuplicate = templateData.items.find((item) => item.id === itemId);
    if (!itemToDuplicate) return;

    const duplicatedItem: TemplateItem = {
      ...itemToDuplicate,
      id: `item-${Date.now()}`,
      title: `${itemToDuplicate.title} (Copy)`,
      order: templateData.items.length
    };

    setTemplateData((prev) => ({
      ...prev,
      items: [...prev.items, duplicatedItem]
    }));
  };

  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetItemId) return;

    const draggedIndex = templateData.items.findIndex((item) => item.id === draggedItemId);
    const targetIndex = templateData.items.findIndex((item) => item.id === targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...templateData.items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    setTemplateData((prev) => ({
      ...prev,
      items: newItems.map((item, index) => ({ ...item, order: index }))
    }));
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };

  const validateTemplate = (): boolean => {
    const newErrors: string[] = [];

    if (!templateData.name.trim()) {
      newErrors.push('Template name is required');
    }

    if (templateData.items.length === 0) {
      newErrors.push('Template must have at least one item');
    }

    templateData.items.forEach((item, index) => {
      if (!item.title.trim()) {
        newErrors.push(`Item ${index + 1} must have a title`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!validateTemplate()) return;

    onSave({
      ...templateData,
      updatedAt: new Date()
    });
  };

  const renderItemEditor = (item: TemplateItem, index: number) => {
    const config = ITEM_TYPE_CONFIG[item.type];
    const Icon = config.icon;
    const isEditing = editingItemId === item.id;

    return (
      <div
        key={item.id}
        draggable
        onDragStart={() => handleDragStart(item.id)}
        onDragOver={(e) => handleDragOver(e, item.id)}
        onDragEnd={handleDragEnd}
        className={`
          border-2 rounded-lg transition-all
          ${isEditing ? 'border-blue-500 bg-gray-800' : 'border-gray-700 bg-gray-900'}
          ${draggedItemId === item.id ? 'opacity-50' : ''}
        `}
      >
        {/* Item Header */}
        <div className="flex items-center gap-3 p-3">
          {/* Drag Handle */}
          <button
            className="cursor-move text-gray-500 hover:text-gray-300"
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Order Number */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-sm font-medium text-gray-300">
            {index + 1}
          </div>

          {/* Type Icon */}
          <div className={`p-2 rounded ${config.color}`}>
            <Icon className="w-4 h-4" />
          </div>

          {/* Title */}
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={item.title}
                onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                placeholder={`Enter ${config.label.toLowerCase()} title... (use {VARIABLE} for placeholders)`}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            ) : (
              <div
                onClick={() => setEditingItemId(item.id)}
                className="font-medium text-white cursor-pointer hover:text-blue-400"
              >
                {item.title || <span className="text-gray-500 italic">Click to edit title</span>}
              </div>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>{config.label}</span>
              <span>•</span>
              <span>{item.duration || 0} min</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditingItemId(isEditing ? null : item.id)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title={isEditing ? 'Collapse' : 'Expand'}
            >
              {isEditing ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleDuplicateItem(item.id)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Duplicate item"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteItem(item.id)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
              title="Delete item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Editor */}
        {isEditing && (
          <div className="p-4 border-t border-gray-700 space-y-3 bg-gray-900/50">
            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={item.duration || 0}
                onChange={(e) => handleUpdateItem(item.id, { duration: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={item.notes || ''}
                onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                placeholder="Add notes or instructions... (use {VARIABLE} for placeholders)"
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="text-xs text-gray-500">
              Tip: Use {'{VARIABLE_NAME}'} in title or notes to create placeholders that can be filled when applying the template.
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={templateData.name}
            onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
            placeholder="Template Name"
            className="w-full text-xl font-bold bg-transparent border-none text-white placeholder-gray-500 focus:outline-none"
          />
          <input
            type="text"
            value={templateData.description || ''}
            onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
            placeholder="Add a description..."
            className="w-full mt-1 text-sm bg-transparent border-none text-gray-400 placeholder-gray-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVariablesPanel(!showVariablesPanel)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded transition-colors text-sm
              ${showVariablesPanel
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
            `}
          >
            <Settings className="w-4 h-4" />
            Variables ({templateData.variables?.length || 0})
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Template
          </button>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="m-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="font-medium text-red-400">Validation Errors</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-300">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Template Info */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={templateData.category}
                onChange={(e) => setTemplateData({ ...templateData, category: e.target.value as any })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="custom">Custom</option>
                <option value="service-type">Service Type</option>
                <option value="seasonal">Seasonal</option>
              </select>
            </div>

            {/* Total Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Total Duration</label>
              <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white">
                {templateData.totalDuration || 0} minutes
              </div>
            </div>

            {/* Item Count */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Items</label>
              <div className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white">
                {templateData.items.length} items
              </div>
            </div>
          </div>

          {/* Add Item Buttons */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-700">
            <span className="text-sm text-gray-400">Add Item:</span>
            {(Object.keys(ITEM_TYPE_CONFIG) as PlanItemType[]).map((type) => {
              const config = ITEM_TYPE_CONFIG[type];
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => handleAddItem(type)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded transition-colors text-sm
                    ${config.color} border border-transparent hover:border-gray-600
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {templateData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <FileText className="w-16 h-16 text-gray-600 mb-4" />
                <div className="text-lg font-medium text-gray-400 mb-2">
                  No items yet
                </div>
                <div className="text-sm text-gray-500">
                  Click an item type above to add items to your template
                </div>
              </div>
            ) : (
              templateData.items.map((item, index) => renderItemEditor(item, index))
            )}
          </div>
        </div>

        {/* Variables Panel */}
        {showVariablesPanel && (
          <div className="w-80 bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white">Template Variables</h3>
              <button
                onClick={() => setShowVariablesPanel(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {templateData.variables && templateData.variables.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm text-gray-400 mb-3">
                  These variables were detected in your template items:
                </div>
                {templateData.variables.map((variable) => (
                  <div
                    key={variable}
                    className="p-3 bg-gray-800 border border-gray-700 rounded"
                  >
                    <div className="font-mono text-sm text-blue-400">
                      {'{' + variable + '}'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Users will be prompted to fill this when applying the template
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-gray-500 text-sm">
                <Settings className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                No variables detected yet.
                <div className="mt-2">
                  Add {'{VARIABLE_NAME}'} in item titles or notes to create fillable placeholders.
                </div>
              </div>
            )}

            <div className="mt-6 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300">
              <div className="font-medium mb-2">Variable Naming Tips:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Use UPPERCASE with underscores</li>
                <li>Be descriptive: {'{OPENING_SONG}'}</li>
                <li>Keep consistent across items</li>
                <li>Examples: {'{SERMON_TITLE}'}, {'{PASTOR_NAME}'}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateEditor;
