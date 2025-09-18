import React, { useState } from 'react';
import { Book, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import BibleSelector from '../bible/BibleSelector';
import { ScriptureVerse } from '../../lib/services/bibleService';

// ServiceItem interface (matching the one in LivePresentationPage)
interface ServiceItem {
  id: string;
  type: 'scripture' | 'song' | 'announcement' | 'media' | 'sermon';
  title: string;
  content: any;
  slides?: any[];
  duration?: number;
  order?: number;
  notes?: string;
}

interface PlanScriptureSelectorProps {
  onScriptureAdd: (item: ServiceItem) => void;
  className?: string;
}

export const PlanScriptureSelector: React.FC<PlanScriptureSelectorProps> = ({
  onScriptureAdd,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle verse selection from BibleSelector
  const handleVerseSelect = (verses: ScriptureVerse[]) => {
    if (verses.length === 0) return;

    // Create scripture reference from verses
    const firstVerse = verses[0];

    // Build title from the verses
    let title = `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}`;
    if (verses.length > 1) {
      // Check if verses are consecutive
      const verseNumbers = verses.map(v => v.verse).sort((a, b) => a - b);
      const isConsecutive = verseNumbers.every((v, i) => i === 0 || v === verseNumbers[i - 1] + 1);

      if (isConsecutive && verseNumbers.length > 1) {
        title = `${firstVerse.book} ${firstVerse.chapter}:${verseNumbers[0]}-${verseNumbers[verseNumbers.length - 1]}`;
      } else {
        title = `${firstVerse.book} ${firstVerse.chapter}:${verseNumbers.join(',')}`;
      }
    }

    const scriptureItem: ServiceItem = {
      id: `scripture-${Date.now()}`,
      type: 'scripture',
      title,
      content: {
        verses: verses.map(v => ({
          id: v.id,
          book: v.book,
          chapter: v.chapter,
          verse: v.verse,
          text: v.text,
          translation: v.translation,
          bookId: v.bookId,
          versionId: v.versionId
        }))
      }
    };

    // Add to service items
    onScriptureAdd(scriptureItem);

    // Collapse the selector after adding
    setIsExpanded(false);
  };

  return (
    <div className={`bg-card rounded-lg border border-border ${className}`}>
      {/* Header with toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <Book className="w-5 h-5 text-purple-400" />
          <div className="text-left">
            <div className="font-medium text-foreground">Add Scripture</div>
            <div className="text-sm text-muted-foreground">Search and add Bible verses to your service</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-muted-foreground" />
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="border-t border-border p-4">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Search for Bible verses and add them to your service plan. You can organize and present them later.
            </p>
          </div>

          <BibleSelector
            onVerseSelect={handleVerseSelect}
            className="max-h-[500px] overflow-y-auto"
          />

          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              <strong>Tip:</strong> Selected scriptures will be added to your service items above.
              You can reorder them and present them individually when ready.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanScriptureSelector;