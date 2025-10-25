import React, { useState } from 'react';
import { SongData, SongSection } from '../../../rendering/content/SongContent';
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

interface ArrangementEditorProps {
  song: SongData;
  onChange: (updates: Partial<SongData>) => void;
  readOnly?: boolean;
}

interface SortableArrangementItemProps {
  sectionId: string;
  index: number;
  section: SongSection | undefined;
  onRemove: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const SortableArrangementItem: React.FC<SortableArrangementItemProps> = ({
  sectionId,
  index,
  section,
  onRemove,
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
  } = useSortable({ id: `arrangement-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSectionLabel = (section: SongSection | undefined) => {
    if (!section) return `Section ID: ${sectionId} (Not Found)`;

    const label = section.type === 'verse' && section.number
      ? `Verse ${section.number}`
      : section.type.charAt(0).toUpperCase() + section.type.slice(1);

    return label;
  };

  const getSectionColor = (type: SongSection['type'] | undefined) => {
    if (!type) return 'bg-red-900 border-red-700';

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
        border-2 rounded-lg p-3 ${getSectionColor(section?.type)}
        bg-opacity-20 hover:bg-opacity-30 transition-all
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{getSectionLabel(section)}</span>
            <span className="text-xs text-gray-500">#{index + 1}</span>
          </div>

          {section && (
            <p className="text-xs text-gray-400 line-clamp-1 font-mono ml-2">
              {section.lyrics?.split('\n')[0] || '(No lyrics)'}
            </p>
          )}
        </div>

        <button
          onClick={onRemove}
          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
          title="Remove from arrangement"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export const ArrangementEditor: React.FC<ArrangementEditorProps> = ({
  song,
  onChange,
  readOnly
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().replace('arrangement-', ''));
      const newIndex = parseInt(over.id.toString().replace('arrangement-', ''));

      const newArrangement = arrayMove(song.arrangement || [], oldIndex, newIndex);
      onChange({ arrangement: newArrangement });
    }
  };

  const handleAddToArrangement = () => {
    if (!selectedSectionId) return;

    const newArrangement = [...(song.arrangement || []), selectedSectionId];
    onChange({ arrangement: newArrangement });
    setSelectedSectionId('');
  };

  const handleRemoveFromArrangement = (index: number) => {
    const newArrangement = song.arrangement?.filter((_, i) => i !== index) || [];
    onChange({ arrangement: newArrangement });
  };

  const handleClearArrangement = () => {
    if (confirm('Clear the entire arrangement?')) {
      onChange({ arrangement: [] });
    }
  };

  const handleAutoArrange = () => {
    // Auto-arrange: intro, verses/choruses, bridge, outro
    const arrangement: string[] = [];

    // Add intro if exists
    const intro = song.sections.find(s => s.type === 'intro');
    if (intro) arrangement.push(intro.id);

    // Add verses and choruses alternating
    const verses = song.sections.filter(s => s.type === 'verse');
    const choruses = song.sections.filter(s => s.type === 'chorus');
    const preChorus = song.sections.find(s => s.type === 'pre-chorus');

    verses.forEach((verse, i) => {
      arrangement.push(verse.id);
      if (preChorus && i === 0) arrangement.push(preChorus.id);
      if (choruses[0]) arrangement.push(choruses[0].id);
    });

    // Add bridge if exists, followed by chorus
    const bridge = song.sections.find(s => s.type === 'bridge');
    if (bridge) {
      arrangement.push(bridge.id);
      if (choruses[0]) arrangement.push(choruses[0].id);
    }

    // Add tag if exists
    const tag = song.sections.find(s => s.type === 'tag');
    if (tag) arrangement.push(tag.id);

    // Add outro if exists
    const outro = song.sections.find(s => s.type === 'outro');
    if (outro) arrangement.push(outro.id);

    onChange({ arrangement });
  };

  const arrangement = song.arrangement || [];
  const availableSections = song.sections.filter(s => s.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Arrangement</h4>
        <div className="flex gap-2">
          {arrangement.length > 0 && (
            <button
              onClick={handleClearArrangement}
              disabled={readOnly}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-xs"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleAutoArrange}
            disabled={readOnly || song.sections.length === 0}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-xs"
          >
            Auto-Arrange
          </button>
        </div>
      </div>

      {/* Add Section to Arrangement */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-400">Add Section</label>
        <div className="flex gap-2">
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            disabled={readOnly || availableSections.length === 0}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:border-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select a section...</option>
            {availableSections.map(section => {
              const label = section.type === 'verse' && section.number
                ? `Verse ${section.number}`
                : section.type.charAt(0).toUpperCase() + section.type.slice(1);
              return (
                <option key={section.id} value={section.id}>
                  {label} - {section.lyrics?.split('\n')[0]?.slice(0, 30) || '(No lyrics)'}
                </option>
              );
            })}
          </select>
          <button
            onClick={handleAddToArrangement}
            disabled={readOnly || !selectedSectionId}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>
      </div>

      {/* Arrangement List */}
      {arrangement.length === 0 ? (
        <div className="text-center py-8 text-gray-400 bg-gray-800 bg-opacity-30 rounded-lg border-2 border-dashed border-gray-700">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">No arrangement set</p>
          <p className="text-xs mt-1">Add sections or use auto-arrange</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={arrangement.map((_, i) => `arrangement-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {arrangement.map((sectionId, index) => {
                const section = song.sections.find(s => s.id === sectionId);
                return (
                  <SortableArrangementItem
                    key={`arrangement-${index}`}
                    sectionId={sectionId}
                    index={index}
                    section={section}
                    onRemove={() => handleRemoveFromArrangement(index)}
                    canMoveUp={index > 0}
                    canMoveDown={index < arrangement.length - 1}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Info/Help */}
      <div className="mt-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-700 rounded text-xs text-blue-300">
        <p className="font-medium mb-1">Arrangement Tips:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-400">
          <li>Drag sections to reorder the flow</li>
          <li>Add the same section multiple times (e.g., chorus repeats)</li>
          <li>Use "Auto-Arrange" for a standard song structure</li>
          <li>Empty arrangement will use sections in order they were created</li>
        </ul>
      </div>
    </div>
  );
};
