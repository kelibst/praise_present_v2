import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Megaphone, Calendar, MapPin, User, Image as ImageIcon, Settings as SettingsIcon } from 'lucide-react';

/**
 * AnnouncementDetailsPage - Placeholder for full announcement editor
 *
 * TODO: This is a placeholder page. Future implementation should include:
 * - Full announcement editor with rich text
 * - Image upload for announcement header
 * - Date/time picker for events
 * - Location and contact information fields
 * - Multiple slide support
 * - Background and typography customization
 * - Preview panel with live editing
 * - Save to database
 * - Integration with media library
 * - Template selection
 * - Recurring announcements support
 */
export const AnnouncementDetailsPage: React.FC = () => {
  const { announcementId } = useParams<{ announcementId: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('New Announcement');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');

  const handleSave = () => {
    console.log('Saving announcement:', {
      id: announcementId,
      title,
      message,
      date,
      time,
      location,
      contact
    });
    // TODO: Implement save to database
    alert('Save functionality coming soon!');
  };

  const handleAddToService = () => {
    console.log('Adding announcement to service');
    // TODO: Implement add to service
    alert('Add to service functionality coming soon!');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/live')}
              className="p-2 hover:bg-secondary rounded transition-colors"
              title="Back to Live Presentation"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-yellow-400" />
                {announcementId === 'new' ? 'New Announcement' : 'Edit Announcement'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {announcementId === 'new' ? 'Create a new announcement' : `Editing announcement #${announcementId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleAddToService}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2 transition-colors"
            >
              <Megaphone className="w-4 h-4" />
              Add to Service
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Coming Soon Banner */}
          <div className="p-6 bg-yellow-500/10 border-2 border-yellow-500/50 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-4xl">🚧</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                  Full Announcement Editor - Coming Soon!
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This is a placeholder page. The full announcement editor is under development and will include:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Rich text editing with formatting options</li>
                  <li>Image upload and management</li>
                  <li>Date and time picker for events</li>
                  <li>Location and contact information fields</li>
                  <li>Multiple slide support for long announcements</li>
                  <li>Background and typography customization</li>
                  <li>Live preview panel</li>
                  <li>Template library for common announcement types</li>
                  <li>Recurring announcement scheduling</li>
                  <li>Integration with church calendar</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Basic Form (Placeholder) */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-yellow-400" />
              Basic Information
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                  placeholder="Announcement title..."
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                  rows={6}
                  placeholder="Enter announcement message..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {message.length} characters • TODO: Add rich text editor
                </p>
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-muted-foreground">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                  placeholder="Event location..."
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Contact
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                  placeholder="Contact person or email..."
                />
              </div>

              {/* Image Upload (Disabled) */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Header Image
                </label>
                <button
                  disabled
                  className="w-full px-4 py-3 border-2 border-dashed border-border rounded bg-secondary/50 text-muted-foreground cursor-not-allowed"
                >
                  TODO: Image upload coming soon
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel (Placeholder) */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Preview</h2>
            <div className="aspect-video bg-secondary rounded flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Megaphone className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <div>Slide preview coming soon</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetailsPage;
