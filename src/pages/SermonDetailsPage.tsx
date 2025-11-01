import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Mic, Calendar, User, Plus, Trash2, Settings as SettingsIcon, BookOpen } from 'lucide-react';

/**
 * SermonDetailsPage - Placeholder for full sermon editor
 *
 * TODO: This is a placeholder page. Future implementation should include:
 * - Full sermon editor with rich text
 * - Outline point editor with sub-points
 * - Scripture passage integration
 * - Notes and attachments per point
 * - Multiple slide support
 * - Background and typography customization
 * - Preview panel with live editing
 * - Save to database
 * - Integration with media library
 * - Template selection
 * - Series management
 * - Speaker and date management
 * - Timer and duration tracking
 */
export const SermonDetailsPage: React.FC = () => {
  const { sermonId } = useParams<{ sermonId: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('New Sermon');
  const [speaker, setSpeaker] = useState('');
  const [date, setDate] = useState('');
  const [scriptureReference, setScriptureReference] = useState('');
  const [outlinePoints, setOutlinePoints] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    console.log('Saving sermon:', {
      id: sermonId,
      title,
      speaker,
      date,
      scriptureReference,
      outlinePoints,
      notes
    });
    // TODO: Implement save to database
    alert('Save functionality coming soon!');
  };

  const handleAddToService = () => {
    console.log('Adding sermon to service');
    // TODO: Implement add to service
    alert('Add to service functionality coming soon!');
  };

  const handleAddPoint = () => {
    setOutlinePoints([...outlinePoints, 'New Point']);
  };

  const handleUpdatePoint = (index: number, value: string) => {
    const newPoints = [...outlinePoints];
    newPoints[index] = value;
    setOutlinePoints(newPoints);
  };

  const handleDeletePoint = (index: number) => {
    const newPoints = outlinePoints.filter((_, i) => i !== index);
    setOutlinePoints(newPoints);
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
                <Mic className="w-6 h-6 text-green-400" />
                {sermonId === 'new' ? 'New Sermon' : 'Edit Sermon'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {sermonId === 'new' ? 'Create a new sermon' : `Editing sermon #${sermonId}`}
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
              <Mic className="w-4 h-4" />
              Add to Service
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Coming Soon Banner */}
          <div className="p-6 bg-green-500/10 border-2 border-green-500/50 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-4xl">🚧</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  Full Sermon Editor - Coming Soon!
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This is a placeholder page. The full sermon editor is under development and will include:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Rich text editing with formatting options</li>
                  <li>Outline point editor with sub-points and notes</li>
                  <li>Scripture passage integration (select and display verses)</li>
                  <li>Media attachments per point (images, videos, audio)</li>
                  <li>Multiple slide support for long sermons</li>
                  <li>Background and typography customization</li>
                  <li>Live preview panel with real-time editing</li>
                  <li>Template library for common sermon structures</li>
                  <li>Series management and tracking</li>
                  <li>Speaker and date management</li>
                  <li>Timer and duration tracking</li>
                  <li>Integration with church calendar</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Basic Form (Placeholder) */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-green-400" />
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
                  placeholder="Sermon title..."
                />
              </div>

              {/* Speaker */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Speaker
                </label>
                <input
                  type="text"
                  value={speaker}
                  onChange={(e) => setSpeaker(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                  placeholder="Speaker name..."
                />
              </div>

              {/* Date */}
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

              {/* Scripture Reference */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Scripture Reference
                </label>
                <input
                  type="text"
                  value={scriptureReference}
                  onChange={(e) => setScriptureReference(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
                  placeholder="e.g., John 3:16-17"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  TODO: Add scripture passage selector with verse display
                </p>
              </div>
            </div>
          </div>

          {/* Outline Points */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Mic className="w-5 h-5 text-green-400" />
                Sermon Outline
              </h2>
              <button
                onClick={handleAddPoint}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Point
              </button>
            </div>

            {outlinePoints.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded text-center text-sm text-muted-foreground">
                No outline points yet. Click "Add Point" to start building your sermon.
              </div>
            ) : (
              <div className="space-y-3">
                {outlinePoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-secondary/50 rounded">
                    <span className="text-sm font-bold text-muted-foreground mt-2 min-w-[32px]">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => handleUpdatePoint(index, e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded bg-input text-foreground mb-2"
                        placeholder={`Point ${index + 1}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        TODO: Add sub-points, notes, and scripture references per point
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeletePoint(index)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                      title="Delete point"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sermon Notes */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-400" />
              Sermon Notes
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded bg-input text-foreground"
              rows={8}
              placeholder="Enter sermon notes, additional details, or speaking points..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {notes.length} characters • TODO: Add rich text editor with formatting
            </p>
          </div>

          {/* Preview Panel (Placeholder) */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Preview</h2>
            <div className="aspect-video bg-secondary rounded flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mic className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <div>Slide preview coming soon</div>
                <p className="text-xs mt-2">Will show title slide, outline slide, and point slides</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SermonDetailsPage;
