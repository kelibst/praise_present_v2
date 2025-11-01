import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Plus, Search, Calendar, Edit, Trash2, User } from 'lucide-react';

/**
 * SermonsPage - Placeholder for sermons library/list page
 *
 * TODO: This is a placeholder page. Future implementation should include:
 * - List of all sermons from database
 * - Search and filter functionality
 * - Sort by date, speaker, scripture, series
 * - Quick preview on hover
 * - Bulk actions (delete, archive)
 * - Series management
 * - Tags and categories
 * - Import/export
 * - Sermon series templates
 * - Archived sermons view
 * - Analytics (presentations, engagement)
 * - Notes and attachments per sermon
 */
export const SermonsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Placeholder data
  const placeholderSermons = [
    {
      id: '1',
      title: 'The Power of Faith',
      speaker: 'Pastor John Smith',
      date: '2025-11-03',
      scriptureReference: 'Hebrews 11:1-6',
      series: 'Faith Series',
      outlinePoints: 3
    },
    {
      id: '2',
      title: 'Walking in Love',
      speaker: 'Pastor Jane Doe',
      date: '2025-10-27',
      scriptureReference: '1 Corinthians 13',
      series: 'Love and Grace',
      outlinePoints: 4
    },
    {
      id: '3',
      title: 'Hope in Trials',
      speaker: 'Pastor John Smith',
      date: '2025-10-20',
      scriptureReference: 'James 1:2-4',
      series: null,
      outlinePoints: 5
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Mic className="w-6 h-6 text-green-400" />
              Sermons
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage sermon library and series
            </p>
          </div>

          <button
            onClick={() => navigate('/sermons/new')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Sermon
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Coming Soon Banner */}
          <div className="p-6 bg-green-500/10 border-2 border-green-500/50 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-4xl">🚧</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  Sermon Library - Coming Soon!
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This is a placeholder page. The full sermon library is under development and will include:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside grid grid-cols-2 gap-x-4">
                  <li>Database-backed sermon storage</li>
                  <li>Advanced search and filtering</li>
                  <li>Series and topic management</li>
                  <li>Quick preview functionality</li>
                  <li>Bulk operations (delete, archive)</li>
                  <li>Sermon templates library</li>
                  <li>Import/export functionality</li>
                  <li>Analytics and presentation history</li>
                  <li>Notes and attachments per sermon</li>
                  <li>Scripture passage integration</li>
                  <li>Speaker and date filtering</li>
                  <li>Sermon series tracking</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sermons... (TODO: Implement search)"
                  className="w-full pl-10 pr-4 py-2 border border-border rounded bg-input text-foreground disabled:opacity-50"
                  disabled
                />
              </div>
              <button
                disabled
                className="px-4 py-2 bg-secondary text-muted-foreground rounded cursor-not-allowed opacity-50"
              >
                Filter
              </button>
            </div>
          </div>

          {/* Placeholder List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Placeholder Sermons (3)
              </h2>
              <div className="text-xs text-muted-foreground">
                TODO: Load from database
              </div>
            </div>

            {placeholderSermons.map((sermon) => (
              <div
                key={sermon.id}
                className="bg-card border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/sermons/${sermon.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{sermon.title}</h3>
                      {sermon.series && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                          {sermon.series}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {sermon.speaker}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {sermon.date}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {sermon.scriptureReference} • {sermon.outlinePoints} points
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/sermons/${sermon.id}`);
                      }}
                      className="p-2 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Delete functionality coming soon!');
                      }}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State (hidden by placeholder data) */}
          <div className="hidden bg-card border border-border rounded-lg p-12 text-center">
            <Mic className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Sermons Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first sermon
            </p>
            <button
              onClick={() => navigate('/sermons/new')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Sermon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SermonsPage;
