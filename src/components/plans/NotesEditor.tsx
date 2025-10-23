import React, { useState } from 'react';
import {
  FileText,
  User,
  Mic,
  Eye,
  EyeOff,
  Bold,
  Italic,
  List,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

/**
 * NotesEditor Component
 *
 * Multi-level notes editor for plan items:
 * - Operator Notes: Technical cues for booth operators (private)
 * - Speaker Notes: Notes for presenters/pastors (visible to speakers)
 * - Public Notes: Notes for congregation (visible in handouts/bulletins)
 */

export interface ItemNotes {
  notes?: string; // General notes
  operatorNotes?: string; // Technical/booth operator notes
  speakerNotes?: string; // Speaker/presenter notes
}

interface NotesEditorProps {
  notes: ItemNotes;
  onChange: (notes: ItemNotes) => void;
  showOperatorNotes?: boolean;
  showSpeakerNotes?: boolean;
  className?: string;
}

type NoteType = 'general' | 'operator' | 'speaker';

interface NoteSection {
  type: NoteType;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  placeholder: string;
  key: keyof ItemNotes;
}

const NOTE_SECTIONS: NoteSection[] = [
  {
    type: 'general',
    label: 'General Notes',
    icon: FileText,
    color: 'text-gray-400 bg-gray-900/20',
    description: 'General notes about this item',
    placeholder: 'Add general notes...',
    key: 'notes'
  },
  {
    type: 'operator',
    label: 'Operator Notes',
    icon: User,
    color: 'text-blue-400 bg-blue-900/20',
    description: 'Technical cues for booth operators (private)',
    placeholder: 'Add technical notes for operators (lighting, sound, video cues)...',
    key: 'operatorNotes'
  },
  {
    type: 'speaker',
    label: 'Speaker Notes',
    icon: Mic,
    color: 'text-purple-400 bg-purple-900/20',
    description: 'Notes for presenters/pastors',
    placeholder: 'Add notes for speakers/presenters...',
    key: 'speakerNotes'
  }
];

export const NotesEditor: React.FC<NotesEditorProps> = ({
  notes,
  onChange,
  showOperatorNotes = true,
  showSpeakerNotes = true,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<NoteType>>(
    new Set(['general'])
  );
  const [focusedSection, setFocusedSection] = useState<NoteType | null>(null);

  const toggleSection = (type: NoteType) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedSections(newExpanded);
  };

  const handleNoteChange = (key: keyof ItemNotes, value: string) => {
    onChange({
      ...notes,
      [key]: value
    });
  };

  const applyFormatting = (
    type: NoteType,
    format: 'bold' | 'italic' | 'list',
    textareaRef: HTMLTextAreaElement
  ) => {
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = textareaRef.value.substring(start, end);
    const key = NOTE_SECTIONS.find(s => s.type === type)?.key;

    if (!key) return;

    let formattedText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case 'list':
        formattedText = selectedText
          .split('\n')
          .map(line => line.trim() ? `- ${line}` : line)
          .join('\n');
        cursorOffset = 2;
        break;
    }

    const newValue =
      textareaRef.value.substring(0, start) +
      formattedText +
      textareaRef.value.substring(end);

    handleNoteChange(key, newValue);

    // Restore selection
    setTimeout(() => {
      textareaRef.focus();
      textareaRef.setSelectionRange(
        start + cursorOffset,
        start + formattedText.length - (format === 'list' ? 0 : cursorOffset)
      );
    }, 0);
  };

  const renderNoteSection = (section: NoteSection) => {
    // Filter sections based on props
    if (section.type === 'operator' && !showOperatorNotes) return null;
    if (section.type === 'speaker' && !showSpeakerNotes) return null;

    const Icon = section.icon;
    const isExpanded = expandedSections.has(section.type);
    const isFocused = focusedSection === section.type;
    const value = notes[section.key] || '';
    const hasContent = value.trim().length > 0;

    return (
      <div
        key={section.type}
        className={`
          border-2 rounded-lg overflow-hidden transition-all
          ${isFocused ? 'border-blue-500' : 'border-gray-700'}
          ${hasContent && !isExpanded ? 'bg-gray-900/30' : ''}
        `}
      >
        {/* Header */}
        <div
          onClick={() => toggleSection(section.type)}
          className={`
            flex items-center justify-between p-3 cursor-pointer
            hover:bg-gray-700/50 transition-colors
            ${section.color}
          `}
        >
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            <Icon className="w-5 h-5" />
            <div>
              <div className="font-medium text-white">{section.label}</div>
              <div className="text-xs text-gray-400">{section.description}</div>
            </div>
          </div>

          {/* Content indicator when collapsed */}
          {!isExpanded && hasContent && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <FileText className="w-4 h-4" />
              <span>{value.split('\n').length} lines</span>
            </div>
          )}
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-3 bg-gray-900/50">
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 mb-2 pb-2 border-b border-gray-700">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const textarea = document.getElementById(
                    `notes-${section.type}`
                  ) as HTMLTextAreaElement;
                  if (textarea) applyFormatting(section.type, 'bold', textarea);
                }}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Bold (Markdown: **text**)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const textarea = document.getElementById(
                    `notes-${section.type}`
                  ) as HTMLTextAreaElement;
                  if (textarea) applyFormatting(section.type, 'italic', textarea);
                }}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Italic (Markdown: *text*)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const textarea = document.getElementById(
                    `notes-${section.type}`
                  ) as HTMLTextAreaElement;
                  if (textarea) applyFormatting(section.type, 'list', textarea);
                }}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>

              <div className="flex-1" />

              <div className="text-xs text-gray-500">
                Markdown supported
              </div>
            </div>

            {/* Textarea */}
            <textarea
              id={`notes-${section.type}`}
              value={value}
              onChange={(e) => handleNoteChange(section.key, e.target.value)}
              onFocus={() => setFocusedSection(section.type)}
              onBlur={() => setFocusedSection(null)}
              placeholder={section.placeholder}
              rows={5}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y font-mono text-sm"
            />

            {/* Character count */}
            <div className="mt-2 text-xs text-gray-500 text-right">
              {value.length} characters
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {NOTE_SECTIONS.map(section => renderNoteSection(section))}

      {/* Notes Summary (when all collapsed) */}
      {expandedSections.size === 0 && (
        <div className="p-3 bg-gray-900/30 rounded-lg border border-gray-700 text-center">
          <div className="text-sm text-gray-400">
            All notes sections collapsed
          </div>
          <button
            onClick={() => setExpandedSections(new Set(['general', 'operator', 'speaker']))}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300"
          >
            Expand All
          </button>
        </div>
      )}
    </div>
  );
};

// Compact Notes Display Component (for read-only display)
interface CompactNotesDisplayProps {
  notes: ItemNotes;
  showOperatorNotes?: boolean;
  showSpeakerNotes?: boolean;
  className?: string;
}

export const CompactNotesDisplay: React.FC<CompactNotesDisplayProps> = ({
  notes,
  showOperatorNotes = false,
  showSpeakerNotes = false,
  className = ''
}) => {
  const hasNotes = notes.notes?.trim();
  const hasOperatorNotes = notes.operatorNotes?.trim();
  const hasSpeakerNotes = notes.speakerNotes?.trim();

  if (!hasNotes && !hasOperatorNotes && !hasSpeakerNotes) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {hasNotes && (
        <div className="flex items-start gap-2 text-sm">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-gray-300 whitespace-pre-wrap">
            {notes.notes}
          </div>
        </div>
      )}

      {showOperatorNotes && hasOperatorNotes && (
        <div className="flex items-start gap-2 text-sm">
          <User className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-blue-300 whitespace-pre-wrap">
            {notes.operatorNotes}
          </div>
        </div>
      )}

      {showSpeakerNotes && hasSpeakerNotes && (
        <div className="flex items-start gap-2 text-sm">
          <Mic className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-purple-300 whitespace-pre-wrap">
            {notes.speakerNotes}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesEditor;
