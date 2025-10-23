import React, { useState } from 'react';
import {
  BookOpen,
  Heart,
  Shield,
  Sun,
  Sparkles,
  Cross,
  Gift,
  Award,
  Search,
  X,
  Star,
  ChevronRight
} from 'lucide-react';

/**
 * ScriptureThemeSelector Component
 *
 * Browse and select scripture passages by theme:
 * - Pre-configured thematic collections
 * - Common worship themes (Love, Grace, Hope, Faith, etc.)
 * - Seasonal themes (Christmas, Easter, Advent, etc.)
 * - Topical themes (Prayer, Worship, Salvation, etc.)
 * - Search within themes
 * - Favorite passages
 */

export interface ScriptureTheme {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  category: 'worship' | 'seasonal' | 'topical' | 'doctrine';
  passages: ScripturePassage[];
}

export interface ScripturePassage {
  reference: string;
  translation?: string;
  preview: string;
  tags?: string[];
  isFavorite?: boolean;
}

interface ScriptureThemeSelectorProps {
  onSelect: (passage: ScripturePassage, theme: ScriptureTheme) => void;
  onClose: () => void;
  selectedTranslation?: string;
  favorites?: string[];
  onToggleFavorite?: (reference: string) => void;
  className?: string;
}

const SCRIPTURE_THEMES: ScriptureTheme[] = [
  {
    id: 'love',
    name: 'Love',
    description: "God's love and love for others",
    icon: Heart,
    color: 'text-pink-400 bg-pink-900/20',
    category: 'worship',
    passages: [
      { reference: '1 Corinthians 13:4-8', preview: 'Love is patient, love is kind...', tags: ['love', 'character'] },
      { reference: 'John 3:16', preview: 'For God so loved the world...', tags: ['love', 'salvation'] },
      { reference: '1 John 4:7-8', preview: 'Dear friends, let us love one another...', tags: ['love', 'God'] },
      { reference: 'Romans 8:38-39', preview: 'Nothing can separate us from the love of God...', tags: ['love', 'assurance'] }
    ]
  },
  {
    id: 'grace',
    name: 'Grace',
    description: "God's unmerited favor and mercy",
    icon: Gift,
    color: 'text-blue-400 bg-blue-900/20',
    category: 'doctrine',
    passages: [
      { reference: 'Ephesians 2:8-9', preview: 'For it is by grace you have been saved...', tags: ['grace', 'salvation'] },
      { reference: '2 Corinthians 12:9', preview: 'My grace is sufficient for you...', tags: ['grace', 'strength'] },
      { reference: 'Titus 2:11-12', preview: 'The grace of God has appeared...', tags: ['grace', 'teaching'] },
      { reference: 'Romans 5:20-21', preview: 'Where sin increased, grace increased all the more...', tags: ['grace', 'sin'] }
    ]
  },
  {
    id: 'hope',
    name: 'Hope',
    description: 'Hope and encouragement in Christ',
    icon: Sun,
    color: 'text-yellow-400 bg-yellow-900/20',
    category: 'worship',
    passages: [
      { reference: 'Jeremiah 29:11', preview: 'For I know the plans I have for you...', tags: ['hope', 'future'] },
      { reference: 'Romans 15:13', preview: 'May the God of hope fill you with all joy...', tags: ['hope', 'joy'] },
      { reference: 'Hebrews 6:19', preview: 'We have this hope as an anchor...', tags: ['hope', 'assurance'] },
      { reference: '1 Peter 1:3', preview: 'He has given us new birth into a living hope...', tags: ['hope', 'resurrection'] }
    ]
  },
  {
    id: 'faith',
    name: 'Faith',
    description: 'Trust and belief in God',
    icon: Shield,
    color: 'text-green-400 bg-green-900/20',
    category: 'worship',
    passages: [
      { reference: 'Hebrews 11:1', preview: 'Faith is confidence in what we hope for...', tags: ['faith', 'definition'] },
      { reference: 'Matthew 17:20', preview: 'If you have faith as small as a mustard seed...', tags: ['faith', 'power'] },
      { reference: 'Ephesians 2:8', preview: 'For by grace you have been saved through faith...', tags: ['faith', 'salvation'] },
      { reference: 'James 2:17', preview: 'Faith by itself, if not accompanied by action...', tags: ['faith', 'works'] }
    ]
  },
  {
    id: 'christmas',
    name: 'Christmas',
    description: 'Birth of Jesus and Advent season',
    icon: Sparkles,
    color: 'text-red-400 bg-red-900/20',
    category: 'seasonal',
    passages: [
      { reference: 'Luke 2:8-14', preview: 'And there were shepherds living out in the fields...', tags: ['christmas', 'birth'] },
      { reference: 'Matthew 1:18-23', preview: 'This is how the birth of Jesus came about...', tags: ['christmas', 'prophecy'] },
      { reference: 'John 1:1-14', preview: 'In the beginning was the Word...', tags: ['christmas', 'incarnation'] },
      { reference: 'Isaiah 9:6', preview: 'For to us a child is born...', tags: ['christmas', 'prophecy'] }
    ]
  },
  {
    id: 'easter',
    name: 'Easter',
    description: 'Resurrection and victory over death',
    icon: Cross,
    color: 'text-purple-400 bg-purple-900/20',
    category: 'seasonal',
    passages: [
      { reference: 'Matthew 28:1-10', preview: 'After the Sabbath, at dawn on the first day...', tags: ['easter', 'resurrection'] },
      { reference: '1 Corinthians 15:3-8', preview: 'Christ died for our sins...was buried...was raised...', tags: ['easter', 'gospel'] },
      { reference: 'John 11:25-26', preview: 'I am the resurrection and the life...', tags: ['easter', 'life'] },
      { reference: 'Romans 6:4', preview: 'We were buried with him through baptism...', tags: ['easter', 'new life'] }
    ]
  },
  {
    id: 'worship',
    name: 'Worship',
    description: 'Praise and worship of God',
    icon: Award,
    color: 'text-orange-400 bg-orange-900/20',
    category: 'topical',
    passages: [
      { reference: 'Psalm 100', preview: 'Shout for joy to the Lord, all the earth...', tags: ['worship', 'praise'] },
      { reference: 'Psalm 95:1-7', preview: 'Come, let us sing for joy to the Lord...', tags: ['worship', 'invitation'] },
      { reference: 'John 4:23-24', preview: 'True worshipers will worship in spirit and truth...', tags: ['worship', 'spirit'] },
      { reference: 'Revelation 4:8-11', preview: 'Holy, holy, holy is the Lord God Almighty...', tags: ['worship', 'heaven'] }
    ]
  },
  {
    id: 'prayer',
    name: 'Prayer',
    description: 'Communication with God',
    icon: BookOpen,
    color: 'text-cyan-400 bg-cyan-900/20',
    category: 'topical',
    passages: [
      { reference: 'Matthew 6:9-13', preview: "Our Father in heaven, hallowed be your name...", tags: ['prayer', 'lords prayer'] },
      { reference: 'Philippians 4:6-7', preview: 'Do not be anxious about anything, but in everything...', tags: ['prayer', 'peace'] },
      { reference: '1 Thessalonians 5:17', preview: 'Pray continually...', tags: ['prayer', 'continual'] },
      { reference: 'James 5:16', preview: 'The prayer of a righteous person is powerful...', tags: ['prayer', 'power'] }
    ]
  },
  {
    id: 'salvation',
    name: 'Salvation',
    description: 'Redemption through Jesus Christ',
    icon: Cross,
    color: 'text-indigo-400 bg-indigo-900/20',
    category: 'doctrine',
    passages: [
      { reference: 'Romans 10:9-10', preview: 'If you declare with your mouth, "Jesus is Lord"...', tags: ['salvation', 'confession'] },
      { reference: 'Acts 4:12', preview: 'Salvation is found in no one else...', tags: ['salvation', 'exclusive'] },
      { reference: 'Ephesians 2:8-9', preview: 'For it is by grace you have been saved...', tags: ['salvation', 'grace'] },
      { reference: '2 Corinthians 5:17', preview: 'Therefore, if anyone is in Christ, new creation...', tags: ['salvation', 'new life'] }
    ]
  }
];

export const ScriptureThemeSelector: React.FC<ScriptureThemeSelectorProps> = ({
  onSelect,
  onClose,
  selectedTranslation = 'NIV',
  favorites = [],
  onToggleFavorite,
  className = ''
}) => {
  const [selectedTheme, setSelectedTheme] = useState<ScriptureTheme | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filter themes
  const filteredThemes = SCRIPTURE_THEMES.filter((theme) => {
    if (filterCategory !== 'all' && theme.category !== filterCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        theme.name.toLowerCase().includes(query) ||
        theme.description.toLowerCase().includes(query) ||
        theme.passages.some((p) => p.reference.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleSelectPassage = (passage: ScripturePassage, theme: ScriptureTheme) => {
    onSelect({ ...passage, translation: selectedTranslation }, theme);
  };

  const renderThemeCard = (theme: ScriptureTheme) => {
    const Icon = theme.icon;

    return (
      <button
        key={theme.id}
        onClick={() => setSelectedTheme(theme)}
        className={`
          p-4 rounded-lg border-2 text-left transition-all
          ${
            selectedTheme?.id === theme.id
              ? 'border-blue-500 bg-blue-900/30'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
          }
        `}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded ${theme.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-white">{theme.name}</div>
            <div className="text-xs text-gray-400">{theme.passages.length} passages</div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        <div className="text-sm text-gray-400">{theme.description}</div>
      </button>
    );
  };

  const renderPassageList = () => {
    if (!selectedTheme) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-white">{selectedTheme.name}</h3>
            <div className="text-sm text-gray-400">{selectedTheme.description}</div>
          </div>
          <button
            onClick={() => setSelectedTheme(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectedTheme.passages.map((passage) => {
          const isFavorite = favorites.includes(passage.reference);

          return (
            <div
              key={passage.reference}
              className="p-4 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-white">{passage.reference}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">
                      {selectedTranslation}
                    </span>
                    {isFavorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                  </div>
                  <div className="text-sm text-gray-300 mb-2">{passage.preview}</div>
                  {passage.tags && passage.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {passage.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {onToggleFavorite && (
                    <button
                      onClick={() => onToggleFavorite(passage.reference)}
                      className="p-2 text-gray-400 hover:text-yellow-400 rounded transition-colors"
                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </button>
                  )}
                  <button
                    onClick={() => handleSelectPassage(passage, selectedTheme)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-green-400" />
            <div>
              <h2 className="text-xl font-medium text-white">Scripture by Theme</h2>
              <div className="text-sm text-gray-400 mt-1">Browse curated scripture collections</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-700 bg-gray-900">
          <div className="flex gap-3 mb-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search themes or passages..."
                className="w-full pl-11 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="worship">Worship</option>
              <option value="seasonal">Seasonal</option>
              <option value="topical">Topical</option>
              <option value="doctrine">Doctrine</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTheme ? (
            renderPassageList()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredThemes.length > 0 ? (
                filteredThemes.map((theme) => renderThemeCard(theme))
              ) : (
                <div className="col-span-2 p-8 text-center text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <div>No themes found</div>
                  <div className="text-sm mt-1">Try adjusting your search or filters</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScriptureThemeSelector;
