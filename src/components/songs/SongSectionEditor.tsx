import React, { useState } from 'react';
import { Plus, Trash2, Edit3, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

export interface SongSection {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'outro' | 'intro';
  number?: number;
  lyrics: string;
  chords?: string;
}

interface SongSectionEditorProps {
  sections: SongSection[];
  onChange: (sections: SongSection[]) => void;
  readOnly?: boolean;
  className?: string;
}

const SECTION_COLORS = {
  verse: 'bg-blue-900/30 border-blue-700',
  chorus: 'bg-green-900/30 border-green-700',
  bridge: 'bg-purple-900/30 border-purple-700',
  'pre-chorus': 'bg-yellow-900/30 border-yellow-700',
  outro: 'bg-red-900/30 border-red-700',
  intro: 'bg-cyan-900/30 border-cyan-700'
};

const SECTION_LABELS = {
  verse: 'Verse',
  chorus: 'Chorus',
  bridge: 'Bridge',
  'pre-chorus': 'Pre-Chorus',
  outro: 'Outro',
  intro: 'Intro'
};

export const SongSectionEditor: React.FC<SongSectionEditorProps> = ({
  sections,
  onChange,
  readOnly = false,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(sections.map(s => s.id)));
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const toggleExpand = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const addSection = () => {
    const newSection: SongSection = {
      id: `section-${Date.now()}`,
      type: 'verse',
      number: sections.filter(s => s.type === 'verse').length + 1,
      lyrics: ''
    };
    onChange([...sections, newSection]);
    setExpandedSections(new Set([...expandedSections, newSection.id]));
    setEditingSection(newSection.id);
  };

  const deleteSection = (sectionId: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      onChange(sections.filter(s => s.id !== sectionId));
    }
  };

  const updateSection = (sectionId: string, updates: Partial<SongSection>) => {
    onChange(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    onChange(newSections);
  };

  return (
    <div className={`bg-card rounded-lg border border-border p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-purple-400" />
          Lyrics & Sections
        </h3>
        {!readOnly && (
          <button
            onClick={addSection}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        )}
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <div>No sections yet</div>
          <div className="text-sm mt-1">Click "Add Section" to start adding lyrics</div>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => {
            const isExpanded = expandedSections.has(section.id);
            const isEditing = editingSection === section.id;
            const colorClass = SECTION_COLORS[section.type];

            return (
              <div
                key={section.id}
                className={`border rounded-lg overflow-hidden ${colorClass}`}
              >
                {/* Section Header */}
                <div
                  className="p-3 cursor-pointer hover:bg-secondary/20 transition-colors flex items-center justify-between"
                  onClick={() => !isEditing && toggleExpand(section.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {!readOnly && (
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {SECTION_LABELS[section.type]} {section.number}
                      </div>
                      {!isExpanded && (
                        <div className="text-xs text-muted-foreground truncate">
                          {section.lyrics.substring(0, 60)}{section.lyrics.length > 60 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === sections.length - 1}
                        className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="p-1 rounded hover:bg-muted transition-colors text-red-400"
                        title="Delete section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Section Content */}
                {isExpanded && (
                  <div className="border-t border-border/50 p-4 bg-background/50 space-y-3">
                    {/* Section Type & Number */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">Type</label>
                        <select
                          value={section.type}
                          onChange={(e) => updateSection(section.id, { type: e.target.value as SongSection['type'] })}
                          disabled={readOnly}
                          className="w-full px-2 py-1 border border-border rounded bg-input text-foreground text-sm disabled:opacity-50"
                        >
                          {Object.entries(SECTION_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">Number</label>
                        <input
                          type="number"
                          value={section.number || ''}
                          onChange={(e) => updateSection(section.id, { number: parseInt(e.target.value) || undefined })}
                          disabled={readOnly}
                          className="w-full px-2 py-1 border border-border rounded bg-input text-foreground text-sm disabled:opacity-50"
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    {/* Lyrics */}
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Lyrics</label>
                      <textarea
                        value={section.lyrics}
                        onChange={(e) => updateSection(section.id, { lyrics: e.target.value })}
                        onFocus={() => setEditingSection(section.id)}
                        onBlur={() => setEditingSection(null)}
                        disabled={readOnly}
                        className="w-full px-3 py-2 border border-border rounded bg-input text-foreground text-sm disabled:opacity-50 font-mono"
                        rows={6}
                        placeholder="Enter lyrics here..."
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {section.lyrics.split('\n').length} lines • {section.lyrics.length} characters
                      </div>
                    </div>

                    {/* Chords (optional) */}
                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">Chords (optional)</label>
                      <textarea
                        value={section.chords || ''}
                        onChange={(e) => updateSection(section.id, { chords: e.target.value })}
                        disabled={readOnly}
                        className="w-full px-3 py-2 border border-border rounded bg-input text-foreground text-sm disabled:opacity-50 font-mono"
                        rows={2}
                        placeholder="C - G - Am - F"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
