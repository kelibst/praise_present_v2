import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Lightbulb,
  Volume2,
  Video,
  Image as ImageIcon,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Edit3,
  Check,
  X
} from 'lucide-react';

/**
 * CueManager Component
 *
 * Manages technical cues for plan items (lighting, sound, video, media).
 * Provides visual timeline of cues and execution tracking.
 */

export type CueType = 'lighting' | 'sound' | 'video' | 'media' | 'other';

export interface TechnicalCue {
  id: string;
  type: CueType;
  title: string;
  description?: string;
  timing: 'before' | 'start' | 'during' | 'end' | 'after';
  offset?: number; // seconds from timing point
  priority: 'low' | 'normal' | 'high' | 'critical';
  assignee?: string;
  completed?: boolean;
  completedAt?: Date;
}

interface CueManagerProps {
  cues: TechnicalCue[];
  onChange: (cues: TechnicalCue[]) => void;
  readOnly?: boolean;
  showCompleted?: boolean;
  className?: string;
}

const CUE_TYPES: {
  value: CueType;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}[] = [
  {
    value: 'lighting',
    label: 'Lighting',
    icon: Lightbulb,
    color: 'text-yellow-400 bg-yellow-900/20'
  },
  {
    value: 'sound',
    label: 'Sound',
    icon: Volume2,
    color: 'text-blue-400 bg-blue-900/20'
  },
  {
    value: 'video',
    label: 'Video',
    icon: Video,
    color: 'text-purple-400 bg-purple-900/20'
  },
  {
    value: 'media',
    label: 'Media',
    icon: ImageIcon,
    color: 'text-green-400 bg-green-900/20'
  },
  {
    value: 'other',
    label: 'Other',
    icon: AlertCircle,
    color: 'text-gray-400 bg-gray-900/20'
  }
];

const TIMING_OPTIONS = [
  { value: 'before', label: 'Before Item', icon: ChevronLeft },
  { value: 'start', label: 'At Start', icon: Play },
  { value: 'during', label: 'During Item', icon: Clock },
  { value: 'end', label: 'At End', icon: Square },
  { value: 'after', label: 'After Item', icon: ChevronRight }
] as const;

const PRIORITY_COLORS = {
  low: 'text-gray-400',
  normal: 'text-blue-400',
  high: 'text-yellow-400',
  critical: 'text-red-400'
};

export const CueManager: React.FC<CueManagerProps> = ({
  cues,
  onChange,
  readOnly = false,
  showCompleted = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingCueId, setEditingCueId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter cues
  const displayCues = showCompleted ? cues : cues.filter(c => !c.completed);

  // Add new cue
  const handleAddCue = () => {
    const newCue: TechnicalCue = {
      id: `cue-${Date.now()}`,
      type: 'other',
      title: '',
      timing: 'start',
      priority: 'normal'
    };

    onChange([...cues, newCue]);
    setEditingCueId(newCue.id);
    setShowAddForm(true);
  };

  // Update cue
  const handleUpdateCue = (cueId: string, updates: Partial<TechnicalCue>) => {
    onChange(
      cues.map(cue => (cue.id === cueId ? { ...cue, ...updates } : cue))
    );
  };

  // Delete cue
  const handleDeleteCue = (cueId: string) => {
    onChange(cues.filter(cue => cue.id !== cueId));
  };

  // Toggle completion
  const handleToggleComplete = (cueId: string) => {
    const cue = cues.find(c => c.id === cueId);
    if (!cue) return;

    handleUpdateCue(cueId, {
      completed: !cue.completed,
      completedAt: !cue.completed ? new Date() : undefined
    });
  };

  // Get cue type config
  const getCueTypeConfig = (type: CueType) => {
    return CUE_TYPES.find(t => t.value === type) || CUE_TYPES[4];
  };

  // Render cue item
  const renderCue = (cue: TechnicalCue, index: number) => {
    const isEditing = editingCueId === cue.id;
    const config = getCueTypeConfig(cue.type);
    const Icon = config.icon;

    if (isEditing) {
      return (
        <div key={cue.id} className="bg-gray-800 rounded-lg border-2 border-blue-500 p-4">
          <CueEditForm
            cue={cue}
            onSave={(updates) => {
              handleUpdateCue(cue.id, updates);
              setEditingCueId(null);
              setShowAddForm(false);
            }}
            onCancel={() => {
              if (!cue.title) {
                handleDeleteCue(cue.id);
              }
              setEditingCueId(null);
              setShowAddForm(false);
            }}
          />
        </div>
      );
    }

    return (
      <div
        key={cue.id}
        className={`
          flex items-center gap-3 p-3 rounded-lg border border-gray-700
          ${cue.completed ? 'bg-gray-900/50 opacity-60' : 'bg-gray-800'}
          ${!readOnly ? 'hover:border-gray-600' : ''}
          transition-all
        `}
      >
        {/* Completion Checkbox */}
        {!readOnly && (
          <button
            onClick={() => handleToggleComplete(cue.id)}
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center
              ${cue.completed
                ? 'bg-green-500 border-green-500'
                : 'border-gray-600 hover:border-gray-500'
              }
              transition-colors
            `}
          >
            {cue.completed && <Check className="w-3 h-3 text-white" />}
          </button>
        )}

        {/* Type Icon */}
        <div className={`p-2 rounded ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${cue.completed ? 'line-through text-gray-500' : 'text-white'}`}>
              {cue.title}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[cue.priority]}`}>
              {cue.priority}
            </span>
          </div>
          {cue.description && (
            <div className="text-sm text-gray-400 mt-1">{cue.description}</div>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>{TIMING_OPTIONS.find(t => t.value === cue.timing)?.label}</span>
            {cue.offset && <span>+{cue.offset}s</span>}
            {cue.assignee && <span>→ {cue.assignee}</span>}
          </div>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditingCueId(cue.id)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Edit cue"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteCue(cue.id)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
              title="Delete cue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          <AlertCircle className="w-5 h-5 text-orange-400" />
          <div>
            <h3 className="font-medium text-white">Technical Cues</h3>
            <div className="text-xs text-gray-400">
              {displayCues.length} cue{displayCues.length !== 1 ? 's' : ''}
              {cues.some(c => c.completed) && (
                <span className="ml-2">
                  ({cues.filter(c => c.completed).length} completed)
                </span>
              )}
            </div>
          </div>
        </div>

        {!readOnly && isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddCue();
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Cue
          </button>
        )}
      </div>

      {/* Cue List */}
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {displayCues.length === 0 ? (
            <div className="p-6 bg-gray-900/30 rounded-lg border border-gray-700 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <div className="text-sm text-gray-400">
                {readOnly
                  ? 'No technical cues for this item'
                  : 'No cues yet. Click "Add Cue" to create one.'}
              </div>
            </div>
          ) : (
            displayCues.map((cue, index) => renderCue(cue, index))
          )}
        </div>
      )}
    </div>
  );
};

// Cue Edit Form Component
interface CueEditFormProps {
  cue: TechnicalCue;
  onSave: (updates: Partial<TechnicalCue>) => void;
  onCancel: () => void;
}

const CueEditForm: React.FC<CueEditFormProps> = ({ cue, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<TechnicalCue>>(cue);

  const handleSave = () => {
    if (!formData.title?.trim()) {
      onCancel();
      return;
    }
    onSave(formData);
  };

  return (
    <div className="space-y-3">
      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
        <div className="grid grid-cols-5 gap-2">
          {CUE_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => setFormData({ ...formData, type: type.value })}
                className={`
                  p-3 rounded-lg border-2 flex flex-col items-center gap-1
                  ${formData.type === type.value
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                  }
                  transition-all
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Dim house lights, Start background music..."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional details..."
          rows={2}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Timing */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Timing</label>
          <select
            value={formData.timing || 'start'}
            onChange={(e) => setFormData({ ...formData, timing: e.target.value as any })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
          >
            {TIMING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
          <select
            value={formData.priority || 'normal'}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Assignee */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Assignee</label>
        <input
          type="text"
          value={formData.assignee || ''}
          onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
          placeholder="Person responsible..."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!formData.title?.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save Cue
        </button>
      </div>
    </div>
  );
};

export default CueManager;
