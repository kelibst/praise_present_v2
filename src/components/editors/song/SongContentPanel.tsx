import React, { useState } from 'react';
import { SongData, SongSection } from '../../../rendering/content/SongContent';
import { SectionEditor } from './SectionEditor';
import { LyricImporter } from './LyricImporter';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SongContentPanelProps {
  song: SongData;
  onChange: (updates: Partial<SongData>) => void;
  readOnly?: boolean;
  showChords: boolean;
}

interface SortableSectionProps {
  section: SongSection;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const SortableSection: React.FC<SortableSectionProps> = ({
  section,
  index,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sectionLabel = section.type === 'verse' && section.number
    ? `Verse ${section.number}`
    : section.type.charAt(0).toUpperCase() + section.type.slice(1);

  const getSectionColor = (type: SongSection['type']) => {
    const colors = {
      verse: 'bg-blue-900 border-blue-700',
      chorus: 'bg-purple-900 border-purple-700',
      bridge: 'bg-green-900 border-green-700',
      'pre-chorus': 'bg-yellow-900 border-yellow-700',
      tag: 'bg-pink-900 border-pink-700',
      intro: 'bg-gray-800 border-gray-700',
      outro: 'bg-gray-800 border-gray-700',
      instrumental: 'bg-orange-900 border-orange-700'
    };
    return colors[type] || 'bg-gray-800 border-gray-700';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        border-2 rounded-lg p-3 ${getSectionColor(section.type)}
        bg-opacity-20 hover:bg-opacity-30 transition-all
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-1 text-gray-400 hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">{sectionLabel}</span>
              <span className="text-xs text-gray-500">#{index + 1}</span>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2 font-mono">
              {section.lyrics || '(No lyrics)'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className={`p-1 rounded text-xs ${
                canMoveUp
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              title="Move up"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className={`p-1 rounded text-xs ${
                canMoveDown
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              title="Move down"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
              title="Edit"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
              title="Delete"
            >
              Del
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SongContentPanel: React.FC<SongContentPanelProps> = ({
  song,
  onChange,
  readOnly,
  showChords
}) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SongSection | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [importerOpen, setImporterOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = song.sections.findIndex((s) => s.id === active.id);
      const newIndex = song.sections.findIndex((s) => s.id === over.id);

      const newSections = arrayMove(song.sections, oldIndex, newIndex);
      onChange({ sections: newSections });
    }
  };

  const handleAddSection = () => {
    setEditingSection(null);
    setEditingIndex(-1);
    setEditorOpen(true);
  };

  const handleEditSection = (section: SongSection, index: number) => {
    setEditingSection(section);
    setEditingIndex(index);
    setEditorOpen(true);
  };

  const handleSaveSection = (section: SongSection) => {
    if (editingIndex >= 0) {
      // Update existing
      const newSections = [...song.sections];
      newSections[editingIndex] = section;
      onChange({ sections: newSections });
    } else {
      // Add new
      onChange({ sections: [...song.sections, section] });
    }
  };

  const handleDeleteSection = (index: number) => {
    if (confirm('Delete this section?')) {
      const newSections = song.sections.filter((_, i) => i !== index);
      onChange({ sections: newSections });
    }
  };

  const handleMoveSection = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= song.sections.length) return;

    const newSections = arrayMove(song.sections, index, newIndex);
    onChange({ sections: newSections });
  };

  const handleImportLyrics = (sections: SongSection[]) => {
    onChange({ sections: [...song.sections, ...sections] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Sections</h4>
        <div className="flex gap-2">
          <button
            onClick={() => setImporterOpen(true)}
            disabled={readOnly}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import
          </button>
          <button
            onClick={handleAddSection}
            disabled={readOnly}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Section
          </button>
        </div>
      </div>

      {song.sections.length === 0 ? (
        <div className="text-center py-8 text-gray-400 bg-gray-800 bg-opacity-30 rounded-lg border-2 border-dashed border-gray-700">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p className="text-sm">No sections added yet</p>
          <p className="text-xs mt-1">Click "Add Section" to get started</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={song.sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {song.sections.map((section, index) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  index={index}
                  onEdit={() => handleEditSection(section, index)}
                  onDelete={() => handleDeleteSection(index)}
                  onMoveUp={() => handleMoveSection(index, -1)}
                  onMoveDown={() => handleMoveSection(index, 1)}
                  canMoveUp={index > 0}
                  canMoveDown={index < song.sections.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <SectionEditor
        section={editingSection}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveSection}
        showChords={showChords}
      />

      <LyricImporter
        isOpen={importerOpen}
        onClose={() => setImporterOpen(false)}
        onImport={handleImportLyrics}
      />
    </div>
  );
};
