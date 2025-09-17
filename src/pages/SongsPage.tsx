import React, { useState, useMemo } from 'react';
import { Music, Search, Filter, Clock, User, Tag, ChevronDown, ChevronRight, Plus, Edit, Trash2, Save, X, Play, Settings, Download, Upload } from 'lucide-react';
import { sampleSongs } from '../../data/sample-songs';

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

const SongsPage: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>(sampleSongs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showChords, setShowChords] = useState(false);
  const [expandedSong, setExpandedSong] = useState<string | null>(null);
  const [editingMode, setEditingMode] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);

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

  // Get recently used songs
  const recentSongs = useMemo(() => {
    return songs.filter(song => recentlyUsed.includes(song.id)).slice(0, 5);
  }, [songs, recentlyUsed]);

  const handleSongClick = (song: Song) => {
    setSelectedSong(song);
    if (expandedSong === song.id) {
      setExpandedSong(null);
    } else {
      setExpandedSong(song.id);
    }
  };

  const handleAddToService = (song: Song) => {
    // Add to recently used
    setRecentlyUsed(prev => {
      const updated = [song.id, ...prev.filter(id => id !== song.id)];
      return updated.slice(0, 10); // Keep only last 10
    });

    // This would integrate with the live presentation service
    // For now, we'll show a notification
    console.log('Adding song to current service:', song.title);

    // TODO: Integrate with LivePresentationPage service items
    // This could be done through context, localStorage, or IPC
    const serviceItem: ServiceItem = {
      id: `song-${song.id}-${Date.now()}`,
      type: 'song',
      title: song.title,
      content: song
    };

    // Store in localStorage for LivePresentationPage to pick up
    const currentItems = JSON.parse(localStorage.getItem('pendingServiceItems') || '[]');
    currentItems.push(serviceItem);
    localStorage.setItem('pendingServiceItems', JSON.stringify(currentItems));

    // Show feedback to user
    alert(`"${song.title}" has been added to the current service!`);
  };

  const handleEditSong = (song: Song) => {
    setEditingSong({ ...song });
    setEditingMode(true);
  };

  const handleSaveSong = () => {
    if (!editingSong) return;

    setSongs(prev =>
      prev.map(song => song.id === editingSong.id ? editingSong : song)
    );
    setEditingMode(false);
    setEditingSong(null);
  };

  const handleDeleteSong = (songId: string) => {
    if (confirm('Are you sure you want to delete this song?')) {
      setSongs(prev => prev.filter(song => song.id !== songId));
      if (selectedSong?.id === songId) {
        setSelectedSong(null);
        setExpandedSong(null);
      }
    }
  };

  const handleAddNewSong = () => {
    const newSong: Song = {
      id: `song-${Date.now()}`,
      title: 'New Song',
      author: '',
      lyrics: '',
      key: 'C',
      tempo: '120 BPM',
      category: 'Contemporary',
      copyright: '',
      tags: []
    };
    setEditingSong(newSong);
    setEditingMode(true);
    setShowAddDialog(false);
  };

  const formatLyrics = (lyrics: string) => {
    return lyrics.split('\n').map((line, index) => (
      <div key={index} className={line.trim() === '' ? 'h-2' : ''}>
        {line || <br />}
      </div>
    ));
  };

  if (editingMode && editingSong) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Music className="w-8 h-8 text-blue-400" />
              {editingSong.id.includes('song-') && editingSong.id !== `song-${Date.now()}` ? 'Edit Song' : 'Add New Song'}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={handleSaveSong}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Song
              </button>
              <button
                onClick={() => {
                  setEditingMode(false);
                  setEditingSong(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={editingSong.title}
                    onChange={(e) => setEditingSong(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                    placeholder="Song title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Author *</label>
                  <input
                    type="text"
                    value={editingSong.author}
                    onChange={(e) => setEditingSong(prev => prev ? { ...prev, author: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                    placeholder="Song author/composer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Artist</label>
                  <input
                    type="text"
                    value={editingSong.artist || ''}
                    onChange={(e) => setEditingSong(prev => prev ? { ...prev, artist: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                    placeholder="Performing artist"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Key</label>
                    <select
                      value={editingSong.key}
                      onChange={(e) => setEditingSong(prev => prev ? { ...prev, key: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                    >
                      {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(key => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tempo</label>
                    <input
                      type="text"
                      value={editingSong.tempo}
                      onChange={(e) => setEditingSong(prev => prev ? { ...prev, tempo: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                      placeholder="e.g., 120 BPM"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={editingSong.category}
                    onChange={(e) => setEditingSong(prev => prev ? { ...prev, category: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                  >
                    <option value="Contemporary">Contemporary</option>
                    <option value="Hymn">Hymn</option>
                    <option value="Gospel">Gospel</option>
                    <option value="Worship">Worship</option>
                    <option value="Christmas">Christmas</option>
                    <option value="Easter">Easter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Copyright</label>
                  <input
                    type="text"
                    value={editingSong.copyright}
                    onChange={(e) => setEditingSong(prev => prev ? { ...prev, copyright: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                    placeholder="Copyright information"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">CCLI Number</label>
                  <input
                    type="text"
                    value={editingSong.ccliNumber || ''}
                    onChange={(e) => setEditingSong(prev => prev ? { ...prev, ccliNumber: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                    placeholder="CCLI license number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={editingSong.tags.join(', ')}
                    onChange={(e) => setEditingSong(prev => prev ? { ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) } : null)}
                    className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                    placeholder="worship, contemporary, upbeat"
                  />
                </div>
              </div>
            </div>

            {/* Lyrics */}
            <div>
              <label className="block text-sm font-medium mb-2">Lyrics *</label>
              <textarea
                value={editingSong.lyrics}
                onChange={(e) => setEditingSong(prev => prev ? { ...prev, lyrics: e.target.value } : null)}
                className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                rows={12}
                placeholder="Enter song lyrics here..."
              />
            </div>

            {/* Chords */}
            <div>
              <label className="block text-sm font-medium mb-2">Chords (optional)</label>
              <textarea
                value={editingSong.chords || ''}
                onChange={(e) => setEditingSong(prev => prev ? { ...prev, chords: e.target.value } : null)}
                className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                rows={4}
                placeholder="Enter chord progressions here..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={editingSong.notes || ''}
                onChange={(e) => setEditingSong(prev => prev ? { ...prev, notes: e.target.value } : null)}
                className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                rows={3}
                placeholder="Add any notes about this song..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Music className="w-8 h-8 text-blue-400" />
              Song Library
            </h1>
            <p className="text-muted-foreground mt-1">Manage your church's song collection</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddDialog(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Song
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Music className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold">{songs.length}</div>
                <div className="text-sm text-muted-foreground">Total Songs</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Tag className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold">{categories.length - 1}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold">{recentSongs.length}</div>
                <div className="text-sm text-muted-foreground">Recently Used</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Play className="w-8 h-8 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold">{filteredSongs.length}</div>
                <div className="text-sm text-muted-foreground">Filtered Results</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Used Section */}
        {recentSongs.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Recently Used
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentSongs.map(song => (
                <button
                  key={song.id}
                  onClick={() => handleAddToService(song)}
                  className="flex-shrink-0 bg-card border border-border rounded-lg p-3 hover:bg-secondary/50 transition-colors min-w-[200px]"
                >
                  <div className="font-medium text-sm">{song.title}</div>
                  <div className="text-xs text-muted-foreground">{song.author}</div>
                  <div className="text-xs text-muted-foreground">{song.category}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Search and Filters */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border p-4 space-y-4 sticky top-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search & Filter
              </h3>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search songs, authors, lyrics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded bg-input text-foreground placeholder-muted-foreground"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showChords}
                    onChange={(e) => setShowChords(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Show Chords</span>
                </label>
              </div>

              {/* Results Count */}
              <div className="text-sm text-muted-foreground pt-2 border-t border-border">
                {filteredSongs.length} song{filteredSongs.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>

          {/* Right Panel - Songs List */}
          <div className="lg:col-span-2">
            <div className="space-y-3">
              {filteredSongs.map((song) => {
                const isExpanded = expandedSong === song.id;

                return (
                  <div
                    key={song.id}
                    className="bg-card border border-border rounded-lg overflow-hidden"
                  >
                    {/* Song Header */}
                    <div
                      onClick={() => handleSongClick(song)}
                      className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            <Music className="w-4 h-4 text-blue-400" />
                            <div className="font-medium">{song.title}</div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 ml-10">
                            by {song.author} {song.artist && `• ${song.artist}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSong(song);
                              }}
                              className="p-1 rounded hover:bg-muted transition-colors"
                              title="Edit song"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSong(song.id);
                              }}
                              className="p-1 rounded hover:bg-muted transition-colors text-red-400"
                              title="Delete song"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Song Details */}
                    {isExpanded && (
                      <div className="border-t border-border p-4 bg-secondary/20">
                        <div className="space-y-4">
                          {/* Song Metadata */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Key: <span className="text-foreground">{song.key}</span></div>
                              <div className="text-muted-foreground">Tempo: <span className="text-foreground">{song.tempo}</span></div>
                              <div className="text-muted-foreground">Category: <span className="text-foreground">{song.category}</span></div>
                            </div>
                            <div>
                              {song.ccliNumber && (
                                <div className="text-muted-foreground">CCLI: <span className="text-foreground">{song.ccliNumber}</span></div>
                              )}
                              <div className="text-muted-foreground">Copyright: <span className="text-foreground text-xs">{song.copyright}</span></div>
                            </div>
                          </div>

                          {/* Tags */}
                          {song.tags.length > 0 && (
                            <div>
                              <div className="text-sm text-muted-foreground mb-2">Tags:</div>
                              <div className="flex flex-wrap gap-1">
                                {song.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Lyrics */}
                          <div>
                            <div className="text-sm text-muted-foreground mb-2">Lyrics:</div>
                            <div className="bg-background p-3 rounded text-sm max-h-48 overflow-y-auto border border-border">
                              {song.verses && song.verses.length > 0 ? (
                                <div className="space-y-4">
                                  {song.verses.map((verse, index) => (
                                    <div key={verse.id}>
                                      <div className="text-blue-400 font-medium mb-1 capitalize">
                                        {verse.type} {verse.number}
                                      </div>
                                      <div className="leading-relaxed">
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
                                <div className="leading-relaxed">
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
                              <div className="text-sm text-muted-foreground mb-2">Notes:</div>
                              <div className="text-sm bg-blue-900/20 p-2 rounded border border-blue-800">
                                {song.notes}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleAddToService(song)}
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Add to Current Service
                            </button>
                            <button
                              onClick={() => handleEditSong(song)}
                              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
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
              <div className="text-center py-12 text-muted-foreground">
                <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <div className="text-xl font-medium mb-2">No songs found</div>
                <div className="text-sm">Try adjusting your search or filter options</div>
              </div>
            )}
          </div>
        </div>

        {/* Add Song Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Add New Song</h3>
              <p className="text-muted-foreground mb-6">
                Choose how you'd like to add a new song to your library.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleAddNewSong}
                  className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-3"
                >
                  <Edit className="w-5 h-5" />
                  Create New Song
                </button>
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="w-full p-3 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-3"
                >
                  <Upload className="w-5 h-5" />
                  Import from File (Coming Soon)
                </button>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongsPage;