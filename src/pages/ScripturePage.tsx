import React, { useState, useMemo } from 'react';
import { Book, Search, Filter, Clock, User, Plus, ExternalLink, BookOpen, Heart, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BibleSelector from '../components/bible/BibleSelector';
import { bibleService } from '../lib/services/bibleService';

// Types
interface ScriptureVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  bookId: string;
  versionId: string;
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

interface SavedScripture {
  id: string;
  title: string;
  reference: string;
  verses: ScriptureVerse[];
  notes?: string;
  tags: string[];
  createdAt: Date;
  lastUsed?: Date;
}

const ScripturePage: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [selectedVerses, setSelectedVerses] = useState<ScriptureVerse[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<SavedScripture[]>([]);
  const [savedScriptures, setSavedScriptures] = useState<SavedScripture[]>([]);
  const [favorites, setFavorites] = useState<SavedScripture[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scriptureToSave, setScriptureToSave] = useState<{
    title: string;
    verses: ScriptureVerse[];
    notes: string;
    tags: string[];
  } | null>(null);

  // Filter categories
  const categories = ['All', 'Salvation', 'Faith', 'Love', 'Hope', 'Peace', 'Joy', 'Prayer', 'Worship', 'Service'];

  // Filtered saved scriptures
  const filteredScriptures = useMemo(() => {
    let filtered = savedScriptures;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(scripture =>
        scripture.tags.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase()))
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(scripture =>
        scripture.title.toLowerCase().includes(term) ||
        scripture.reference.toLowerCase().includes(term) ||
        scripture.verses.some(verse => verse.text.toLowerCase().includes(term)) ||
        scripture.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [savedScriptures, searchTerm, selectedCategory]);

  // Handle verse selection from BibleSelector
  const handleVerseSelect = (verses: ScriptureVerse[]) => {
    setSelectedVerses(verses);
  };

  // Add scripture to current service
  const addToCurrentService = (verses: ScriptureVerse[]) => {
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

    // Store in localStorage for LivePresentationPage to pick up
    const currentItems = JSON.parse(localStorage.getItem('pendingServiceItems') || '[]');
    currentItems.push(scriptureItem);
    localStorage.setItem('pendingServiceItems', JSON.stringify(currentItems));

    // Update recently used
    const recentRef: SavedScripture = {
      id: `recent-${Date.now()}`,
      title,
      reference: title,
      verses,
      tags: ['recent'],
      createdAt: new Date(),
      lastUsed: new Date()
    };

    setRecentlyUsed(prev => {
      const updated = [recentRef, ...prev.filter(item => item.reference !== title)];
      return updated.slice(0, 10); // Keep only last 10
    });

    // Show feedback
    alert(`"${title}" has been added to the current service!`);
  };

  // Save scripture for later use
  const handleSaveScripture = (verses: ScriptureVerse[]) => {
    if (verses.length === 0) return;

    const firstVerse = verses[0];
    let defaultTitle = `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}`;

    if (verses.length > 1) {
      const verseNumbers = verses.map(v => v.verse).sort((a, b) => a - b);
      const isConsecutive = verseNumbers.every((v, i) => i === 0 || v === verseNumbers[i - 1] + 1);

      if (isConsecutive && verseNumbers.length > 1) {
        defaultTitle = `${firstVerse.book} ${firstVerse.chapter}:${verseNumbers[0]}-${verseNumbers[verseNumbers.length - 1]}`;
      } else {
        defaultTitle = `${firstVerse.book} ${firstVerse.chapter}:${verseNumbers.join(',')}`;
      }
    }

    setScriptureToSave({
      title: defaultTitle,
      verses,
      notes: '',
      tags: []
    });
    setShowSaveDialog(true);
  };

  // Handle save dialog submission
  const handleSaveSubmit = () => {
    if (!scriptureToSave) return;

    const savedScripture: SavedScripture = {
      id: `saved-${Date.now()}`,
      title: scriptureToSave.title,
      reference: scriptureToSave.title,
      verses: scriptureToSave.verses,
      notes: scriptureToSave.notes,
      tags: scriptureToSave.tags,
      createdAt: new Date()
    };

    setSavedScriptures(prev => [savedScripture, ...prev]);
    setShowSaveDialog(false);
    setScriptureToSave(null);
  };

  // Toggle favorite
  const toggleFavorite = (scripture: SavedScripture) => {
    const isFavorite = favorites.some(fav => fav.id === scripture.id);

    if (isFavorite) {
      setFavorites(prev => prev.filter(fav => fav.id !== scripture.id));
    } else {
      setFavorites(prev => [scripture, ...prev]);
    }
  };

  const formatLyrics = (text: string) => {
    return text.split('\n').map((line, index) => (
      <div key={index} className={line.trim() === '' ? 'h-2' : ''}>
        {line || <br />}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Book className="w-8 h-8 text-purple-400" />
              Scripture Library
            </h1>
            <p className="text-muted-foreground mt-1">Search, manage, and add Bible verses to your service</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/live')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              Go to Live Presentation
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold">{savedScriptures.length}</div>
                <div className="text-sm text-muted-foreground">Saved Scriptures</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-400" />
              <div>
                <div className="text-2xl font-bold">{favorites.length}</div>
                <div className="text-sm text-muted-foreground">Favorites</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <History className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold">{recentlyUsed.length}</div>
                <div className="text-sm text-muted-foreground">Recently Used</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Filter className="w-8 h-8 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold">{filteredScriptures.length}</div>
                <div className="text-sm text-muted-foreground">Filtered Results</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Used Section */}
        {recentlyUsed.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-green-400" />
              Recently Used
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentlyUsed.map(scripture => (
                <button
                  key={scripture.id}
                  onClick={() => addToCurrentService(scripture.verses)}
                  className="flex-shrink-0 bg-card border border-border rounded-lg p-3 hover:bg-secondary/50 transition-colors min-w-[200px]"
                >
                  <div className="font-medium text-sm">{scripture.title}</div>
                  <div className="text-xs text-muted-foreground">{scripture.verses.length} verse{scripture.verses.length !== 1 ? 's' : ''}</div>
                  <div className="text-xs text-muted-foreground">{scripture.verses[0].translation}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Bible Selector and Current Selection */}
          <div className="space-y-6">
            {/* Bible Selector */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-400" />
                Search Bible
              </h3>
              <BibleSelector onVerseSelect={handleVerseSelect} />
            </div>

            {/* Current Selection */}
            {selectedVerses.length > 0 && (
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold mb-4">Current Selection</h3>

                <div className="space-y-4">
                  {/* Verses Display */}
                  <div className="bg-background p-4 rounded border border-border max-h-64 overflow-y-auto">
                    {selectedVerses.map((verse, index) => (
                      <div key={verse.id} className="mb-3 last:mb-0">
                        <div className="text-sm text-muted-foreground mb-1">
                          {verse.book} {verse.chapter}:{verse.verse} ({verse.translation})
                        </div>
                        <div className="text-foreground leading-relaxed">
                          {verse.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => addToCurrentService(selectedVerses)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                    >
                      Add to Current Service
                    </button>
                    <button
                      onClick={() => handleSaveScripture(selectedVerses)}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Saved Scriptures Management */}
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter Saved Scriptures
              </h3>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search saved scriptures..."
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
            </div>

            {/* Saved Scriptures List */}
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-3">Saved Scriptures ({filteredScriptures.length})</h3>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredScriptures.map(scripture => {
                  const isFavorite = favorites.some(fav => fav.id === scripture.id);

                  return (
                    <div key={scripture.id} className="bg-background p-3 rounded border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{scripture.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {scripture.verses.length} verse{scripture.verses.length !== 1 ? 's' : ''} • {scripture.verses[0]?.translation}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleFavorite(scripture)}
                            className={`p-1 rounded ${isFavorite ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'}`}
                          >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Tags */}
                      {scripture.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {scripture.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {scripture.notes && (
                        <div className="text-sm text-muted-foreground mb-2 italic">
                          {scripture.notes}
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        onClick={() => addToCurrentService(scripture.verses)}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Add to Service
                      </button>
                    </div>
                  );
                })}

                {filteredScriptures.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Book className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <div className="text-lg font-medium mb-2">No saved scriptures found</div>
                    <div className="text-sm">Try adjusting your search or save some scriptures to get started</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Scripture Dialog */}
        {showSaveDialog && scriptureToSave && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Save Scripture</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={scriptureToSave.title}
                    onChange={(e) => setScriptureToSave(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                  <textarea
                    value={scriptureToSave.notes}
                    onChange={(e) => setScriptureToSave(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                    rows={3}
                    placeholder="Add notes about this scripture..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={scriptureToSave.tags.join(', ')}
                    onChange={(e) => setScriptureToSave(prev => prev ? {
                      ...prev,
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    } : null)}
                    className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                    placeholder="salvation, faith, hope"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setScriptureToSave(null);
                  }}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Scripture
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScripturePage;