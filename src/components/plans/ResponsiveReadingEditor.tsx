import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  User,
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Volume2,
  Eye,
  ChevronDown,
  ChevronRight,
  Copy
} from 'lucide-react';

/**
 * ResponsiveReadingEditor Component
 *
 * Create and edit responsive readings for scripture passages:
 * - Assign parts (Leader, Congregation, All, Solo)
 * - Verse-by-verse or section-based divisions
 * - Visual formatting options
 * - Preview mode
 * - Common patterns (alternating, call-response)
 * - Export for printing/display
 */

export type ReadingPart = 'leader' | 'congregation' | 'all' | 'solo' | 'group1' | 'group2';

export interface ResponsiveSection {
  id: string;
  part: ReadingPart;
  text: string;
  reference?: string;
  order: number;
  emphasis?: boolean;
  notes?: string;
}

export interface ResponsiveReading {
  id?: string;
  title: string;
  scriptureRef: string;
  translation: string;
  sections: ResponsiveSection[];
  pattern?: 'alternating' | 'call-response' | 'custom';
  introText?: string;
  closingText?: string;
}

interface ResponsiveReadingEditorProps {
  reading?: ResponsiveReading;
  scriptureText?: string;
  onSave: (reading: ResponsiveReading) => void;
  onCancel: () => void;
  className?: string;
}

const PART_CONFIG: Record<
  ReadingPart,
  { label: string; icon: React.ComponentType<any>; color: string; bgColor: string }
> = {
  leader: {
    label: 'Leader',
    icon: User,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20'
  },
  congregation: {
    label: 'Congregation',
    icon: Users,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20'
  },
  all: {
    label: 'All',
    icon: Volume2,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20'
  },
  solo: {
    label: 'Solo',
    icon: User,
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20'
  },
  group1: {
    label: 'Group 1',
    icon: Users,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-900/20'
  },
  group2: {
    label: 'Group 2',
    icon: Users,
    color: 'text-pink-400',
    bgColor: 'bg-pink-900/20'
  }
};

export const ResponsiveReadingEditor: React.FC<ResponsiveReadingEditorProps> = ({
  reading,
  scriptureText,
  onSave,
  onCancel,
  className = ''
}) => {
  const [formData, setFormData] = useState<ResponsiveReading>(
    reading || {
      title: '',
      scriptureRef: '',
      translation: 'NIV',
      sections: [],
      pattern: 'custom'
    }
  );

  const [showPreview, setShowPreview] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);

  const handleAddSection = (part: ReadingPart = 'leader') => {
    const newSection: ResponsiveSection = {
      id: `section-${Date.now()}`,
      part,
      text: '',
      order: formData.sections.length
    };

    setFormData({
      ...formData,
      sections: [...formData.sections, newSection]
    });

    setEditingSectionId(newSection.id);
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<ResponsiveSection>) => {
    setFormData({
      ...formData,
      sections: formData.sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    });
  };

  const handleDeleteSection = (sectionId: string) => {
    setFormData({
      ...formData,
      sections: formData.sections
        .filter((section) => section.id !== sectionId)
        .map((section, index) => ({ ...section, order: index }))
    });
  };

  const handleDuplicateSection = (sectionId: string) => {
    const sectionToDuplicate = formData.sections.find((s) => s.id === sectionId);
    if (!sectionToDuplicate) return;

    const duplicated: ResponsiveSection = {
      ...sectionToDuplicate,
      id: `section-${Date.now()}`,
      order: formData.sections.length
    };

    setFormData({
      ...formData,
      sections: [...formData.sections, duplicated]
    });
  };

  const applyPattern = (pattern: 'alternating' | 'call-response') => {
    if (!scriptureText) return;

    const verses = scriptureText.split('\n').filter((v) => v.trim());
    const newSections: ResponsiveSection[] = [];

    if (pattern === 'alternating') {
      verses.forEach((verse, index) => {
        newSections.push({
          id: `section-${Date.now()}-${index}`,
          part: index % 2 === 0 ? 'leader' : 'congregation',
          text: verse.trim(),
          order: index
        });
      });
    } else if (pattern === 'call-response') {
      for (let i = 0; i < verses.length; i += 2) {
        if (verses[i]) {
          newSections.push({
            id: `section-${Date.now()}-${i}`,
            part: 'leader',
            text: verses[i].trim(),
            order: newSections.length
          });
        }
        if (verses[i + 1]) {
          newSections.push({
            id: `section-${Date.now()}-${i + 1}`,
            part: 'congregation',
            text: verses[i + 1].trim(),
            order: newSections.length
          });
        }
      }
    }

    setFormData({
      ...formData,
      pattern,
      sections: newSections
    });
  };

  const handleDragStart = (sectionId: string) => {
    setDraggedSectionId(sectionId);
  };

  const handleDragOver = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    if (!draggedSectionId || draggedSectionId === targetSectionId) return;

    const draggedIndex = formData.sections.findIndex((s) => s.id === draggedSectionId);
    const targetIndex = formData.sections.findIndex((s) => s.id === targetSectionId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSections = [...formData.sections];
    const [draggedSection] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedSection);

    setFormData({
      ...formData,
      sections: newSections.map((section, index) => ({ ...section, order: index }))
    });
  };

  const handleDragEnd = () => {
    setDraggedSectionId(null);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.scriptureRef.trim() || formData.sections.length === 0) {
      alert('Please fill in all required fields and add at least one section');
      return;
    }

    onSave(formData);
  };

  const renderSection = (section: ResponsiveSection, index: number) => {
    const config = PART_CONFIG[section.part];
    const Icon = config.icon;
    const isEditing = editingSectionId === section.id;

    return (
      <div
        key={section.id}
        draggable
        onDragStart={() => handleDragStart(section.id)}
        onDragOver={(e) => handleDragOver(e, section.id)}
        onDragEnd={handleDragEnd}
        className={`
          border-2 rounded-lg transition-all
          ${isEditing ? 'border-blue-500 bg-gray-800' : 'border-gray-700 bg-gray-900'}
          ${draggedSectionId === section.id ? 'opacity-50' : ''}
        `}
      >
        {/* Section Header */}
        <div className="flex items-center gap-3 p-3">
          {/* Drag Handle */}
          <button className="cursor-move text-gray-500 hover:text-gray-300">
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Order */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-sm font-medium text-gray-300">
            {index + 1}
          </div>

          {/* Part Selector */}
          <select
            value={section.part}
            onChange={(e) =>
              handleUpdateSection(section.id, { part: e.target.value as ReadingPart })
            }
            className={`px-3 py-1.5 rounded border-2 border-transparent ${config.bgColor} ${config.color} font-medium text-sm focus:outline-none focus:border-blue-500`}
          >
            {(Object.keys(PART_CONFIG) as ReadingPart[]).map((part) => (
              <option key={part} value={part}>
                {PART_CONFIG[part].label}
              </option>
            ))}
          </select>

          {/* Emphasis Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={section.emphasis}
              onChange={(e) => handleUpdateSection(section.id, { emphasis: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-xs text-gray-400">Bold</span>
          </label>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditingSectionId(isEditing ? null : section.id)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              {isEditing ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleDuplicateSection(section.id)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteSection(section.id)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section Content */}
        {isEditing ? (
          <div className="p-4 border-t border-gray-700 bg-gray-900/50 space-y-3">
            <textarea
              value={section.text}
              onChange={(e) => handleUpdateSection(section.id, { text: e.target.value })}
              placeholder="Enter the text for this section..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              autoFocus
            />
            <input
              type="text"
              value={section.reference || ''}
              onChange={(e) => handleUpdateSection(section.id, { reference: e.target.value })}
              placeholder="Optional verse reference (e.g., v. 12)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        ) : (
          <div className="px-4 pb-3">
            <div
              className={`text-white ${section.emphasis ? 'font-bold' : ''}`}
              onClick={() => setEditingSectionId(section.id)}
            >
              {section.text || <span className="text-gray-500 italic">Click to add text</span>}
            </div>
            {section.reference && (
              <div className="text-xs text-gray-400 mt-1">{section.reference}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPreview = () => {
    return (
      <div className="bg-white text-black p-8 rounded-lg">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">{formData.title}</h2>
          <div className="text-gray-600">
            {formData.scriptureRef} ({formData.translation})
          </div>
        </div>

        {/* Intro */}
        {formData.introText && (
          <div className="mb-6 text-gray-700 italic">{formData.introText}</div>
        )}

        {/* Sections */}
        <div className="space-y-4">
          {formData.sections.map((section) => {
            const config = PART_CONFIG[section.part];
            return (
              <div key={section.id} className="flex gap-4">
                <div className="w-32 text-right font-semibold" style={{ color: config.color.replace('text-', '#') }}>
                  {config.label}:
                </div>
                <div className={`flex-1 ${section.emphasis ? 'font-bold' : ''}`}>
                  {section.text}
                  {section.reference && (
                    <span className="text-gray-500 text-sm ml-2">({section.reference})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Closing */}
        {formData.closingText && (
          <div className="mt-6 text-gray-700 italic">{formData.closingText}</div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-green-400" />
          <div>
            <h3 className="text-lg font-medium text-white">Responsive Reading</h3>
            <div className="text-sm text-gray-400">Create call-and-response scripture reading</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded transition-colors
              ${showPreview ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
            `}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="flex-1 overflow-y-auto p-6">
          {renderPreview()}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          {/* Basic Info */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Psalm 23 - The Lord is My Shepherd"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Scripture Reference *</label>
                <input
                  type="text"
                  value={formData.scriptureRef}
                  onChange={(e) => setFormData({ ...formData, scriptureRef: e.target.value })}
                  placeholder="e.g., Psalm 23:1-6"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Translation</label>
              <select
                value={formData.translation}
                onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="NIV">NIV</option>
                <option value="ESV">ESV</option>
                <option value="KJV">KJV</option>
                <option value="NKJV">NKJV</option>
                <option value="NLT">NLT</option>
                <option value="NASB">NASB</option>
              </select>
            </div>
          </div>

          {/* Quick Patterns */}
          {scriptureText && formData.sections.length === 0 && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
              <div className="text-sm font-medium text-gray-300 mb-3">Quick Patterns</div>
              <div className="flex gap-2">
                <button
                  onClick={() => applyPattern('alternating')}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors text-white"
                >
                  Alternating (Leader/Cong.)
                </button>
                <button
                  onClick={() => applyPattern('call-response')}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors text-white"
                >
                  Call & Response
                </button>
              </div>
            </div>
          )}

          {/* Add Section Buttons */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-400">Add Section:</span>
            {(Object.keys(PART_CONFIG) as ReadingPart[]).map((part) => {
              const config = PART_CONFIG[part];
              const Icon = config.icon;
              return (
                <button
                  key={part}
                  onClick={() => handleAddSection(part)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded ${config.bgColor} ${config.color} hover:opacity-80 transition-opacity text-sm`}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Sections List */}
          <div className="space-y-3">
            {formData.sections.length === 0 ? (
              <div className="p-8 bg-gray-900/30 rounded-lg border border-gray-700 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <div className="text-lg font-medium text-gray-400 mb-2">No sections yet</div>
                <div className="text-sm text-gray-500">
                  Click buttons above to add sections for your responsive reading
                </div>
              </div>
            ) : (
              formData.sections.map((section, index) => renderSection(section, index))
            )}
          </div>

          {/* Optional Texts */}
          <div className="mt-4 bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-300 mb-3">Optional Texts</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Introduction</label>
                <textarea
                  value={formData.introText || ''}
                  onChange={(e) => setFormData({ ...formData, introText: e.target.value })}
                  placeholder="Optional introductory text before the reading..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Closing</label>
                <textarea
                  value={formData.closingText || ''}
                  onChange={(e) => setFormData({ ...formData, closingText: e.target.value })}
                  placeholder="Optional closing text after the reading..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveReadingEditor;
