import React, { useState } from 'react';
import { SongSection } from '../../../rendering/content/SongContent';

interface LyricImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (sections: SongSection[]) => void;
}

export const LyricImporter: React.FC<LyricImporterProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [rawLyrics, setRawLyrics] = useState('');
  const [detectedFormat, setDetectedFormat] = useState<'auto' | 'labeled' | 'blank-line'>('auto');

  if (!isOpen) return null;

  const detectFormat = (text: string): 'labeled' | 'blank-line' => {
    // Check if lyrics have section labels like [Verse 1], [Chorus], etc.
    const labeledPattern = /^\[?(verse|chorus|bridge|pre-chorus|tag|intro|outro|instrumental)/im;
    if (labeledPattern.test(text)) {
      return 'labeled';
    }
    return 'blank-line';
  };

  const parseLabeledLyrics = (text: string): SongSection[] => {
    const sections: SongSection[] = [];
    const lines = text.split('\n');
    let currentSection: Partial<SongSection> | null = null;
    let currentLyrics: string[] = [];

    const sectionPattern = /^\[?(verse|chorus|bridge|pre-chorus|tag|intro|outro|instrumental)\s*(\d+)?\]?/i;

    lines.forEach(line => {
      const match = line.match(sectionPattern);

      if (match) {
        // Save previous section
        if (currentSection) {
          sections.push({
            id: crypto.randomUUID(),
            type: currentSection.type!,
            number: currentSection.number,
            lyrics: currentLyrics.join('\n').trim()
          });
        }

        // Start new section
        const type = match[1].toLowerCase() as SongSection['type'];
        const number = match[2] ? parseInt(match[2]) : undefined;

        currentSection = { type, number };
        currentLyrics = [];
      } else if (currentSection) {
        // Add line to current section
        currentLyrics.push(line);
      }
    });

    // Save last section
    if (currentSection) {
      sections.push({
        id: crypto.randomUUID(),
        type: currentSection.type!,
        number: currentSection.number,
        lyrics: currentLyrics.join('\n').trim()
      });
    }

    return sections;
  };

  const parseBlankLineLyrics = (text: string): SongSection[] => {
    const sections: SongSection[] = [];
    const blocks = text.split(/\n\s*\n/).filter(block => block.trim());

    let verseCount = 1;
    let chorusCount = 0;

    blocks.forEach((block, index) => {
      const trimmed = block.trim();

      // Try to detect chorus (repeated sections)
      const isChorus = blocks.filter(b => b.trim() === trimmed).length > 1;

      if (isChorus && chorusCount === 0) {
        sections.push({
          id: crypto.randomUUID(),
          type: 'chorus',
          lyrics: trimmed
        });
        chorusCount++;
      } else if (isChorus) {
        // Reference the same chorus
        const chorusSection = sections.find(s => s.type === 'chorus' && s.lyrics === trimmed);
        if (chorusSection) {
          sections.push({ ...chorusSection, id: crypto.randomUUID() });
        }
      } else {
        sections.push({
          id: crypto.randomUUID(),
          type: 'verse',
          number: verseCount++,
          lyrics: trimmed
        });
      }
    });

    return sections;
  };

  const handleImport = () => {
    if (!rawLyrics.trim()) return;

    const format = detectedFormat === 'auto' ? detectFormat(rawLyrics) : detectedFormat;
    let sections: SongSection[] = [];

    try {
      if (format === 'labeled') {
        sections = parseLabeledLyrics(rawLyrics);
      } else {
        sections = parseBlankLineLyrics(rawLyrics);
      }

      if (sections.length > 0) {
        onImport(sections);
        setRawLyrics('');
        onClose();
      } else {
        alert('No sections could be detected. Please check the format.');
      }
    } catch (err) {
      console.error('Error parsing lyrics:', err);
      alert('Error parsing lyrics. Please check the format and try again.');
    }
  };

  const exampleLabeled = `[Verse 1]
Amazing grace, how sweet the sound
That saved a wretch like me

[Chorus]
Praise the Lord, praise the Lord
Let the earth hear His voice

[Verse 2]
I once was lost, but now I'm found
Was blind, but now I see`;

  const exampleBlankLine = `Amazing grace, how sweet the sound
That saved a wretch like me

Praise the Lord, praise the Lord
Let the earth hear His voice

I once was lost, but now I'm found
Was blind, but now I see

Praise the Lord, praise the Lord
Let the earth hear His voice`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold">Import Lyrics</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Import Format</label>
            <div className="flex gap-2">
              {[
                { value: 'auto', label: 'Auto-detect' },
                { value: 'labeled', label: 'Labeled Sections' },
                { value: 'blank-line', label: 'Blank Line Separated' }
              ].map(format => (
                <button
                  key={format.value}
                  onClick={() => setDetectedFormat(format.value as typeof detectedFormat)}
                  className={`
                    px-3 py-1.5 rounded text-sm font-medium transition-colors
                    ${detectedFormat === format.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }
                  `}
                >
                  {format.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Left: Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Paste Lyrics</label>
              <textarea
                value={rawLyrics}
                onChange={(e) => setRawLyrics(e.target.value)}
                placeholder="Paste your lyrics here..."
                className="w-full h-64 px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
              />
            </div>

            {/* Right: Examples */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">Examples</label>

              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-400">Labeled Format</div>
                <pre className="text-xs bg-gray-800 p-3 rounded overflow-auto max-h-28 border border-gray-700">
                  {exampleLabeled}
                </pre>
                <button
                  onClick={() => setRawLyrics(exampleLabeled)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Use this example
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-400">Blank Line Format</div>
                <pre className="text-xs bg-gray-800 p-3 rounded overflow-auto max-h-28 border border-gray-700">
                  {exampleBlankLine}
                </pre>
                <button
                  onClick={() => setRawLyrics(exampleBlankLine)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Use this example
                </button>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="p-3 bg-blue-900 bg-opacity-20 border border-blue-700 rounded text-xs text-blue-300">
            <p className="font-medium mb-1">Import Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-400">
              <li><strong>Labeled:</strong> Use [Verse 1], [Chorus], [Bridge], etc. to mark sections</li>
              <li><strong>Blank Line:</strong> Separate sections with blank lines; repeated sections detected as choruses</li>
              <li><strong>Auto-detect:</strong> Automatically chooses the best format</li>
              <li>Supported section types: Verse, Chorus, Bridge, Pre-Chorus, Tag, Intro, Outro, Instrumental</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800 bg-gray-850">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!rawLyrics.trim()}
            className={`
              px-4 py-2 rounded font-medium transition-colors
              ${!rawLyrics.trim()
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            Import Sections
          </button>
        </div>
      </div>
    </div>
  );
};
