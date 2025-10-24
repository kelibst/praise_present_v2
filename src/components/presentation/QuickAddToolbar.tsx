import React from 'react';
import { Music, BookOpen, FileText, Mic } from 'lucide-react';

interface QuickAddToolbarProps {
  onAddSong: () => void;
  onAddScripture: () => void;
  onAddPresentation: () => void;
  onAddAnnouncement: () => void;
  className?: string;
}

/**
 * Reusable toolbar for quickly adding media items (songs, scripture, presentations, announcements)
 * Appears between service items with hover-to-reveal behavior
 */
export const QuickAddToolbar: React.FC<QuickAddToolbarProps> = ({
  onAddSong,
  onAddScripture,
  onAddPresentation,
  onAddAnnouncement,
  className = ''
}) => {
  return (
    <div className={`group ${className}`}>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-700 rounded-lg bg-gray-900/30 hover:bg-gray-900/50 hover:border-green-600 transition-all">
          <button
            onClick={onAddSong}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
          >
            <Music className="w-3 h-3" />
            Song
          </button>
          <button
            onClick={onAddScripture}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-medium transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            Scripture
          </button>
          <button
            onClick={onAddPresentation}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors"
          >
            <FileText className="w-3 h-3" />
            Presentation
          </button>
          <button
            onClick={onAddAnnouncement}
            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-xs font-medium transition-colors"
          >
            <Mic className="w-3 h-3" />
            Announcement
          </button>
        </div>
      </div>
    </div>
  );
};
