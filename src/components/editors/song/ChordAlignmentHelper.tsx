import React, { useState, useEffect } from 'react';

interface ChordAlignmentHelperProps {
  lyrics: string;
  chords?: string;
  onChange: (chords: string) => void;
}

interface ChordPosition {
  chord: string;
  position: number;
  lineIndex: number;
}

export const ChordAlignmentHelper: React.FC<ChordAlignmentHelperProps> = ({
  lyrics,
  chords = '',
  onChange
}) => {
  const [chordPositions, setChordPositions] = useState<ChordPosition[]>([]);
  const [selectedLine, setSelectedLine] = useState(0);
  const [newChord, setNewChord] = useState('');

  const lyricLines = lyrics.split('\n');

  // Parse existing chords
  useEffect(() => {
    if (!chords) {
      setChordPositions([]);
      return;
    }

    const positions: ChordPosition[] = [];
    const chordLines = chords.split('\n');

    chordLines.forEach((line, lineIndex) => {
      let position = 0;
      let currentChord = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === ' ') {
          if (currentChord) {
            positions.push({
              chord: currentChord,
              position,
              lineIndex
            });
            currentChord = '';
          }
          position++;
        } else {
          currentChord += char;
        }
      }

      if (currentChord) {
        positions.push({
          chord: currentChord,
          position,
          lineIndex
        });
      }
    });

    setChordPositions(positions);
  }, [chords]);

  const generateChordString = (positions: ChordPosition[]): string => {
    const lines: string[] = Array(lyricLines.length).fill('');

    positions.forEach(({ chord, position, lineIndex }) => {
      if (lineIndex >= lines.length) return;

      // Ensure the line is long enough
      while (lines[lineIndex].length < position) {
        lines[lineIndex] += ' ';
      }

      // Insert the chord
      lines[lineIndex] =
        lines[lineIndex].substring(0, position) +
        chord +
        lines[lineIndex].substring(position + chord.length);
    });

    return lines.join('\n');
  };

  const addChord = (lineIndex: number, position: number, chord: string) => {
    const newPositions = [
      ...chordPositions,
      { chord, position, lineIndex }
    ].sort((a, b) => {
      if (a.lineIndex !== b.lineIndex) return a.lineIndex - b.lineIndex;
      return a.position - b.position;
    });

    setChordPositions(newPositions);
    onChange(generateChordString(newPositions));
  };

  const removeChord = (index: number) => {
    const newPositions = chordPositions.filter((_, i) => i !== index);
    setChordPositions(newPositions);
    onChange(generateChordString(newPositions));
  };

  const handleAddChord = () => {
    if (!newChord.trim()) return;
    addChord(selectedLine, 0, newChord.trim());
    setNewChord('');
  };

  const handleQuickChord = (chord: string) => {
    addChord(selectedLine, 0, chord);
  };

  const commonChords = [
    // Major chords
    'C', 'D', 'E', 'F', 'G', 'A', 'B',
    // Minor chords
    'Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm',
    // Seventh chords
    'C7', 'D7', 'E7', 'F7', 'G7', 'A7', 'B7',
    // Common variations
    'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7',
    'Csus4', 'Dsus4', 'Esus4', 'Gsus4', 'Asus4'
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Chord Alignment Helper</h4>
        <button
          onClick={() => {
            setChordPositions([]);
            onChange('');
          }}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Clear All Chords
        </button>
      </div>

      {/* Line Selector */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Select Line</label>
        <select
          value={selectedLine}
          onChange={(e) => setSelectedLine(parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:border-blue-500 focus:outline-none"
        >
          {lyricLines.map((line, index) => (
            <option key={index} value={index}>
              Line {index + 1}: {line.slice(0, 40)}{line.length > 40 ? '...' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Add Chord */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newChord}
          onChange={(e) => setNewChord(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddChord()}
          placeholder="Enter chord (e.g., C, Am, G7)"
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleAddChord}
          disabled={!newChord.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm"
        >
          Add
        </button>
      </div>

      {/* Quick Chords */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Quick Add</label>
        <div className="flex flex-wrap gap-1">
          {commonChords.slice(0, 14).map(chord => (
            <button
              key={chord}
              onClick={() => handleQuickChord(chord)}
              className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs font-mono"
            >
              {chord}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Preview</label>
        <div className="bg-gray-800 border border-gray-700 rounded p-3 font-mono text-xs overflow-x-auto">
          {lyricLines.map((line, lineIndex) => {
            const lineChords = chordPositions.filter(c => c.lineIndex === lineIndex);

            return (
              <div key={lineIndex} className="mb-3">
                {/* Chord line */}
                <div className="text-blue-400 h-4">
                  {lineChords.map((chordPos, i) => (
                    <span
                      key={i}
                      style={{
                        position: 'relative',
                        left: `${chordPos.position}ch`
                      }}
                      className="inline-block cursor-pointer hover:text-blue-300 group"
                      onClick={() => {
                        const index = chordPositions.findIndex(
                          c => c.lineIndex === lineIndex && c.position === chordPos.position && c.chord === chordPos.chord
                        );
                        if (index >= 0) removeChord(index);
                      }}
                      title="Click to remove"
                    >
                      {chordPos.chord}
                      <span className="opacity-0 group-hover:opacity-100 text-red-400 ml-1">×</span>
                    </span>
                  ))}
                </div>
                {/* Lyric line */}
                <div className="text-gray-300">
                  {line || ' '}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Chords List */}
      {chordPositions.length > 0 && (
        <div>
          <label className="block text-xs text-gray-400 mb-2">Chords ({chordPositions.length})</label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {chordPositions.map((chordPos, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-2 py-1 bg-gray-800 rounded text-xs"
              >
                <span className="font-mono">
                  Line {chordPos.lineIndex + 1}, Pos {chordPos.position}: <span className="text-blue-400">{chordPos.chord}</span>
                </span>
                <button
                  onClick={() => removeChord(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-2 bg-blue-900 bg-opacity-20 border border-blue-700 rounded text-xs text-blue-300">
        <p className="font-medium mb-1">Tips:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-400">
          <li>Add chords at the beginning of lines, then adjust position as needed</li>
          <li>Click on a chord in the preview to remove it</li>
          <li>Use quick-add buttons for common chords</li>
          <li>Chords will be aligned above the lyrics in the final presentation</li>
        </ul>
      </div>
    </div>
  );
};
