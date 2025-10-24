import React, { useState, useEffect } from 'react';
import { Music, BookOpen, FileText, Mic, Search, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ==================== INTERFACES ====================

interface Song {
  id: string;
  title: string;
  artist?: string;
  lyrics?: string;
  tags?: string[];
}

interface Scripture {
  id: string;
  reference: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  text?: string;
}

interface Presentation {
  id: string;
  name: string;
  slideCount: number;
  thumbnail?: string;
  tags?: string[];
}

// ==================== INLINE SONG SELECTOR ====================

interface InlineSongSelectorProps {
  onSelect: (song: Song) => void;
  onCancel: () => void;
}

export const InlineSongSelector: React.FC<InlineSongSelectorProps> = ({ onSelect, onCancel }) => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('songs:getAll');
        if (result?.success && result.songs) {
          setSongs(result.songs);
        }
      }
    } catch (error) {
      console.error('Error loading songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSongs = songs.filter(song => {
    const matchesSearch = search === '' ||
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      (song.artist?.toLowerCase().includes(search.toLowerCase()) || false);

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => song.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  // Get all unique tags from songs
  const allTags = Array.from(new Set(songs.flatMap(song => song.tags || [])));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-foreground">Select Song</h3>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-secondary rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or artist..."
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {allTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Songs List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading songs...</div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No songs found. {search && 'Try a different search term.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSongs.map(song => (
              <div
                key={song.id}
                className="p-3 bg-secondary rounded-lg transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">
                      {song.title}
                    </h4>
                    {song.artist && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {song.artist}
                      </p>
                    )}
                    {song.tags && song.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {song.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        onCancel();
                        navigate(`/songs/${song.id}`);
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs flex items-center gap-1 whitespace-nowrap"
                      title="View details and customize slides"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Details
                    </button>
                    <button
                      onClick={() => onSelect(song)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs whitespace-nowrap"
                      title="Quick add to service"
                    >
                      Quick Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== INLINE SCRIPTURE SELECTOR ====================

interface InlineScriptureSelectorProps {
  onSelect: (scripture: Scripture) => void;
  onCancel: () => void;
}

export const InlineScriptureSelector: React.FC<InlineScriptureSelectorProps> = ({ onSelect, onCancel }) => {
  const [mode, setMode] = useState<'browse' | 'search'>('browse');
  const [books, setBooks] = useState<string[]>([]);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('bible:getBooks');
        if (result?.success && result.books) {
          setBooks(result.books);
        }
      }
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSelect = (book: string) => {
    // For simplicity, create a scripture reference for the whole book
    // In a full implementation, you'd show chapters and verses
    onSelect({
      id: `scripture-${Date.now()}`,
      reference: `${book} 1:1`,
      book,
      chapter: 1,
      verseStart: 1
    });
  };

  const handleSearchSelect = () => {
    if (search.trim()) {
      // Parse search as reference (e.g., "John 3:16")
      const parts = search.trim().split(' ');
      const book = parts[0];
      const reference = search.trim();

      onSelect({
        id: `scripture-${Date.now()}`,
        reference,
        book,
        chapter: 1,
        verseStart: 1
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-foreground">Select Scripture</h3>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-secondary rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 p-4 border-b border-border">
        <button
          onClick={() => setMode('browse')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            mode === 'browse'
              ? 'bg-purple-600 text-white'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          Browse Books
        </button>
        <button
          onClick={() => setMode('search')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            mode === 'search'
              ? 'bg-purple-600 text-white'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          Type Reference
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {mode === 'browse' ? (
          loading ? (
            <div className="text-center text-muted-foreground py-8">Loading books...</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {books.map(book => (
                <button
                  key={book}
                  onClick={() => handleBookSelect(book)}
                  className="p-3 bg-secondary hover:bg-purple-900/30 rounded-lg text-left transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground group-hover:text-purple-400">
                      {book}
                    </span>
                    <BookOpen className="w-4 h-4 text-purple-400" />
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Enter Scripture Reference
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g., John 3:16 or Psalm 23:1-6"
                className="w-full px-4 py-2 bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSelect();
                  }
                }}
              />
            </div>
            <button
              onClick={handleSearchSelect}
              disabled={!search.trim()}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
            >
              Add Scripture
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== INLINE PRESENTATION SELECTOR ====================

interface InlinePresentationSelectorProps {
  onSelect: (presentation: Presentation) => void;
  onCancel: () => void;
}

export const InlinePresentationSelector: React.FC<InlinePresentationSelectorProps> = ({ onSelect, onCancel }) => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('presentations:getAll');
        if (result?.success && result.presentations) {
          setPresentations(result.presentations);
        }
      }
    } catch (error) {
      console.error('Error loading presentations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPresentations = presentations.filter(presentation =>
    search === '' || presentation.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-foreground">Select Presentation</h3>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-secondary rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search presentations..."
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Presentations Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading presentations...</div>
        ) : filteredPresentations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No presentations found.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredPresentations.map(presentation => (
              <button
                key={presentation.id}
                onClick={() => onSelect(presentation)}
                className="p-4 bg-secondary hover:bg-secondary/80 rounded-lg text-left transition-colors group"
              >
                {/* Thumbnail placeholder */}
                <div className="aspect-video bg-gray-800 rounded-md mb-3 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-green-400" />
                </div>
                <h4 className="font-medium text-foreground group-hover:text-green-400 transition-colors truncate">
                  {presentation.name}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {presentation.slideCount} slides
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== INLINE ANNOUNCEMENT EDITOR ====================

interface InlineAnnouncementEditorProps {
  onSave: (announcement: { title: string; content: string; duration?: number }) => void;
  onCancel: () => void;
}

export const InlineAnnouncementEditor: React.FC<InlineAnnouncementEditorProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [duration, setDuration] = useState<number>(30);

  const handleSave = () => {
    if (title.trim() && content.trim()) {
      onSave({ title, content, duration });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-foreground">Create Announcement</h3>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-secondary rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title..."
              className="w-full px-4 py-2 bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Announcement content..."
              rows={6}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Duration (seconds)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              min={10}
              max={300}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-medium rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!title.trim() || !content.trim()}
          className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
        >
          Add Announcement
        </button>
      </div>
    </div>
  );
};
