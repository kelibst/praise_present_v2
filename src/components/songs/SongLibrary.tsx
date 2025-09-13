import React, { useState, useMemo } from 'react';
import { Music, Search, Filter, Clock, User, Tag, ChevronDown, ChevronRight } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist?: string;
  author: string;
  lyrics: string;
  chords?: string;
  key: string;
  tempo: string;
  category: string;
  copyright: string;
  ccliNumber?: string;
  tags: string[];
  notes?: string;
  verses?: SongVerse[];
}

interface SongVerse {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'tag' | 'intro' | 'outro';
  number?: number;
  lyrics: string;
  chords?: string;
}

interface SongLibraryProps {
  songs: Song[];
  onSongSelect?: (song: Song) => void;
  className?: string;
}

const SongLibrary: React.FC<SongLibraryProps> = ({ songs, onSongSelect, className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showChords, setShowChords] = useState(false);
  const [expandedSong, setExpandedSong] = useState<string | null>(null);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...Array.from(new Set(songs.map(song => song.category)))];
    return cats;
  }, [songs]);

  // Filter songs based on search and category
  const filteredSongs = useMemo(() => {
    let filtered = songs;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(song => song.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(song =>
        song.title.toLowerCase().includes(term) ||
        song.author.toLowerCase().includes(term) ||
        song.artist?.toLowerCase().includes(term) ||
        song.tags.some(tag => tag.toLowerCase().includes(term)) ||
        song.lyrics.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [songs, searchTerm, selectedCategory]);

  const handleSongClick = (song: Song) => {
    setSelectedSong(song);
    if (expandedSong === song.id) {
      setExpandedSong(null);
    } else {
      setExpandedSong(song.id);
    }
  };

  const handleUseSong = (song: Song) => {
    if (onSongSelect) {
      onSongSelect(song);
    }
  };

  const formatLyrics = (lyrics: string) => {
    return lyrics.split('\n').map((line, index) => (
      <div key={index} className={line.trim() === '' ? 'h-2' : ''}>
        {line || <br />}
      </div>
    ));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search songs, authors, lyrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-600 rounded bg-gray-800 text-white text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowChords(!showChords)}
            className={`px-3 py-1 rounded text-sm border ${
              showChords
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-300'
            }`}
          >
            Show Chords
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        {filteredSongs.length} song{filteredSongs.length !== 1 ? 's' : ''} found
      </div>

      {/* Songs List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredSongs.map((song) => {
          const isExpanded = expandedSong === song.id;

          return (
            <div
              key={song.id}
              className="border border-gray-700 rounded-lg bg-gray-800 overflow-hidden"
            >
              {/* Song Header */}
              <div
                onClick={() => handleSongClick(song)}
                className="p-3 cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <Music className="w-4 h-4 text-blue-400" />
                      <div className="font-medium text-white">{song.title}</div>
                    </div>
                    <div className="text-sm text-gray-400 mt-1 ml-10">
                      by {song.author} {song.artist && `• ${song.artist}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {song.category}
                    </div>
                    <div className="flex items-center gap-1">
                      <Music className="w-3 h-3" />
                      {song.key}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {song.tempo}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Song Details */}
              {isExpanded && (
                <div className="border-t border-gray-700 p-4 bg-gray-850">
                  <div className="space-y-4">
                    {/* Song Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Key: <span className="text-white">{song.key}</span></div>
                        <div className="text-gray-400">Tempo: <span className="text-white">{song.tempo}</span></div>
                        <div className="text-gray-400">Category: <span className="text-white">{song.category}</span></div>
                      </div>
                      <div>
                        {song.ccliNumber && (
                          <div className="text-gray-400">CCLI: <span className="text-white">{song.ccliNumber}</span></div>
                        )}
                        <div className="text-gray-400">Copyright: <span className="text-white text-xs">{song.copyright}</span></div>
                      </div>
                    </div>

                    {/* Tags */}
                    {song.tags.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Tags:</div>
                        <div className="flex flex-wrap gap-1">
                          {song.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Structured Verses or Full Lyrics */}
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Lyrics:</div>
                      <div className="bg-gray-900 p-3 rounded text-sm text-gray-300 max-h-48 overflow-y-auto">
                        {song.verses && song.verses.length > 0 ? (
                          <div className="space-y-4">
                            {song.verses.map((verse, index) => (
                              <div key={verse.id}>
                                <div className="text-blue-400 font-medium mb-1 capitalize">
                                  {verse.type} {verse.number}
                                </div>
                                <div className="text-gray-300 leading-relaxed">
                                  {formatLyrics(verse.lyrics)}
                                </div>
                                {showChords && verse.chords && (
                                  <div className="text-yellow-400 text-xs mt-2 font-mono">
                                    {verse.chords}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-300 leading-relaxed">
                            {formatLyrics(song.lyrics)}
                            {showChords && song.chords && (
                              <div className="text-yellow-400 text-xs mt-4 font-mono">
                                {song.chords}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {song.notes && (
                      <div>
                        <div className="text-sm text-gray-400 mb-2">Notes:</div>
                        <div className="text-sm text-gray-300 bg-blue-900/20 p-2 rounded border border-blue-800">
                          {song.notes}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => handleUseSong(song)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                      >
                        Use This Song
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredSongs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <div>No songs found matching your criteria</div>
          <div className="text-sm mt-1">Try adjusting your search or filter options</div>
        </div>
      )}
    </div>
  );
};

export default SongLibrary;