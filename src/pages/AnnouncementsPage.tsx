import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Plus, Search, Calendar, Edit, Trash2 } from 'lucide-react';

/**
 * AnnouncementsPage - Placeholder for announcements library/list page
 *
 * TODO: This is a placeholder page. Future implementation should include:
 * - List of all announcements from database
 * - Search and filter functionality
 * - Sort by date, title, type
 * - Quick preview on hover
 * - Bulk actions (delete, archive)
 * - Categories/tags
 * - Import/export
 * - Templates library
 * - Archived announcements view
 * - Analytics (views, presentations)
 */
export const AnnouncementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Placeholder data
  const placeholderAnnouncements = [
    {
      id: '1',
      title: 'Sunday Service Times Changed',
      message: 'Starting next week, our Sunday service will begin at 10:00 AM...',
      date: '2025-11-15',
      category: 'Service Update'
    },
    {
      id: '2',
      title: 'Youth Group Pizza Night',
      message: 'Join us for pizza and games this Friday at 6:00 PM...',
      date: '2025-11-08',
      category: 'Youth Event'
    },
    {
      id: '3',
      title: 'Thanksgiving Potluck',
      message: 'Bring your favorite dish to share at our annual Thanksgiving celebration...',
      date: '2025-11-28',
      category: 'Fellowship'
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-yellow-400" />
              Announcements
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage church announcements and events
            </p>
          </div>

          <button
            onClick={() => navigate('/announcements/new')}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Coming Soon Banner */}
          <div className="p-6 bg-yellow-500/10 border-2 border-yellow-500/50 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-4xl">🚧</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                  Announcements Library - Coming Soon!
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This is a placeholder page. The full announcements library is under development and will include:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside grid grid-cols-2 gap-x-4">
                  <li>Database-backed announcement storage</li>
                  <li>Advanced search and filtering</li>
                  <li>Category and tag management</li>
                  <li>Quick preview functionality</li>
                  <li>Bulk operations (delete, archive)</li>
                  <li>Announcement templates library</li>
                  <li>Import/export functionality</li>
                  <li>Analytics and presentation history</li>
                  <li>Recurring announcements</li>
                  <li>Calendar integration</li>
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
                  placeholder="Search announcements... (TODO: Implement search)"
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
                Placeholder Announcements (3)
              </h2>
              <div className="text-xs text-muted-foreground">
                TODO: Load from database
              </div>
            </div>

            {placeholderAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-card border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/announcements/${announcement.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                        {announcement.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {announcement.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {announcement.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/announcements/${announcement.id}`);
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
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Announcements Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first announcement
            </p>
            <button
              onClick={() => navigate('/announcements/new')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Announcement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
