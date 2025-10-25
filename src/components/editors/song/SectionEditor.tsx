import React, { useState } from 'react';
import { SongSection } from '../../../rendering/content/SongContent';
import { ChordAlignmentHelper } from './ChordAlignmentHelper';

interface SectionEditorProps {
  section: SongSection | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: SongSection) => void;
  showChords: boolean;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  isOpen,
  onClose,
  onSave,
  showChords
}) => {
  const [editingSection, setEditingSection] = useState<SongSection>(
    section || {
      id: `section-${Date.now()}`,
      type: 'verse',
      number: 1,
      lyrics: '',
      chords: ''
    }
  );
  const [chordMode, setChordMode] = useState<'manual' | 'helper'>('manual');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!editingSection.lyrics.trim()) {
      alert('Please enter lyrics for this section');
      return;
    }
    onSave(editingSection);
    onClose();
  };

  const sectionTypes: Array<{
    value: SongSection['type'];
    label: string;
    description: string;
  }> = [
    { value: 'verse', label: 'Verse', description: 'Main lyrical content' },
    { value: 'chorus', label: 'Chorus', description: 'Repeated refrain' },
    { value: 'bridge', label: 'Bridge', description: 'Contrasting section' },
    { value: 'pre-chorus', label: 'Pre-Chorus', description: 'Before the chorus' },
    { value: 'tag', label: 'Tag', description: 'Ending phrase' },
    { value: 'intro', label: 'Intro', description: 'Opening instrumental' },
    { value: 'outro', label: 'Outro', description: 'Closing' },
    { value: 'instrumental', label: 'Instrumental', description: 'Music only' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">
            {section ? 'Edit Section' : 'Add Section'}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Section Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {sectionTypes.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() => setEditingSection({ ...editingSection, type: value })}
                  className={`
                    px-4 py-3 rounded-lg border-2 text-left transition-all
                    ${editingSection.type === value
                      ? 'border-blue-500 bg-blue-900 bg-opacity-30'
                      : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                    }
                  `}
                >
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs text-gray-400 mt-1">{description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Verse Number (for verses only) */}
          {editingSection.type === 'verse' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Verse Number
              </label>
              <input
                type="number"
                min="1"
                value={editingSection.number || 1}
                onChange={(e) => setEditingSection({
                  ...editingSection,
                  number: parseInt(e.target.value) || 1
                })}
                className="w-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Lyrics */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lyrics *
            </label>
            <textarea
              value={editingSection.lyrics}
              onChange={(e) => setEditingSection({ ...editingSection, lyrics: e.target.value })}
              rows={12}
              placeholder="Enter lyrics here... (one line per text line)"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Each line will appear as a separate line on the slide
            </p>
          </div>

          {/* Chords (if enabled) */}
          {showChords && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Chords (optional)
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setChordMode('manual')}
                    className={`px-2 py-1 rounded text-xs ${
                      chordMode === 'manual'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => setChordMode('helper')}
                    className={`px-2 py-1 rounded text-xs ${
                      chordMode === 'helper'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Helper
                  </button>
                </div>
              </div>

              {chordMode === 'manual' ? (
                <>
                  <textarea
                    value={editingSection.chords || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, chords: e.target.value })}
                    rows={12}
                    placeholder="Enter chords here... (align with lyrics above)"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Tip: Use spaces to align chords with lyrics
                  </p>

                  {/* Example */}
                  <div className="bg-gray-800 rounded p-4 mt-3">
                    <p className="text-xs font-medium text-gray-400 mb-2">Example:</p>
                    <pre className="text-xs text-gray-300">
                      {`       C           G           Am
Amazing grace how sweet the sound
     F         C        G
That saved a wretch like me`}
                    </pre>
                  </div>
                </>
              ) : (
                <ChordAlignmentHelper
                  lyrics={editingSection.lyrics}
                  chords={editingSection.chords}
                  onChange={(chords) => setEditingSection({ ...editingSection, chords })}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {section ? 'Update Section' : 'Add Section'}
          </button>
        </div>
      </div>
    </div>
  );
};
