import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Clock, MapPin, Phone, Save, X } from 'lucide-react';
import {
  AnnouncementContentType,
  AnnouncementData,
  AnnouncementSlideSettings,
  AnnouncementType,
  AnnouncementUrgency
} from '../../rendering/content';
import { BaseEditorProps, EditorToolbar, EditorPanelContainer } from './BaseEditor';
import { SlideRenderer } from '../slides/SlideRenderer';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

/**
 * AnnouncementEditor - Editor for announcement content
 *
 * Features:
 * - Announcement type selection (event, reminder, welcome, celebration)
 * - Urgency level (low, medium, high)
 * - Event details (date, time, location, contact)
 * - Typography customization
 * - Background customization
 * - Live preview
 */
export const AnnouncementEditor: React.FC<BaseEditorProps<AnnouncementData, AnnouncementSlideSettings>> = ({
  content,
  onContentChange,
  onSlidesGenerated,
  currentSlideIndex = 0,
  readOnly = false,
  onSave,
  onCancel
}) => {
  const announcementContent = content as AnnouncementContentType;
  const [slides, setSlides] = useState(announcementContent.generateSlides());
  const [panelVisibility, setPanelVisibility] = useState({
    leftPanel: true,
    rightPanel: true
  });

  // Regenerate slides when content changes
  useEffect(() => {
    const newSlides = announcementContent.generateSlides();
    setSlides(newSlides);
    onSlidesGenerated?.(newSlides);
  }, [content, onSlidesGenerated]);

  const handleMetadataChange = (updates: Partial<AnnouncementData['metadata']>) => {
    Object.assign(announcementContent.content.metadata, updates);
    onContentChange(announcementContent.clone());
  };

  const handleEventDetailsChange = (updates: Partial<NonNullable<AnnouncementData['eventDetails']>>) => {
    announcementContent.updateEventDetails(updates);
    onContentChange(announcementContent.clone());
  };

  const handleTypographyChange = (updates: Partial<AnnouncementSlideSettings['typography']>) => {
    announcementContent.settings.typography = {
      ...announcementContent.settings.typography,
      ...updates
    };
    onContentChange(announcementContent.clone());
  };

  const handleLayoutChange = (layout: AnnouncementSlideSettings['layout']) => {
    announcementContent.settings.layout = layout;
    onContentChange(announcementContent.clone());
  };

  const currentSlide = slides[currentSlideIndex];

  const urgencyColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#dc2626'
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Toolbar */}
      <EditorToolbar
        title={announcementContent.content.metadata.title}
        subtitle={`${announcementContent.content.metadata.type.charAt(0).toUpperCase() + announcementContent.content.metadata.type.slice(1)} • ${slides.length} slide`}
        actions={[
          {
            id: 'cancel',
            label: 'Cancel',
            icon: <X className="w-4 h-4" />,
            onClick: () => onCancel?.(),
            variant: 'secondary'
          },
          {
            id: 'save',
            label: 'Save',
            icon: <Save className="w-4 h-4" />,
            onClick: () => onSave?.(),
            variant: 'primary'
          }
        ]}
        onBack={onCancel}
      />

      {/* Main Content */}
      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* Left Panel - Content Editing */}
        {panelVisibility.leftPanel && (
          <>
            <Panel defaultSize={25} minSize={20} maxSize={40}>
              <EditorPanelContainer
                title="Announcement Content"
                icon={<Megaphone className="w-4 h-4" />}
                onClose={() => setPanelVisibility(prev => ({ ...prev, leftPanel: false }))}
              >
                <div className="space-y-4">
                  {/* Type & Urgency */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <select
                      value={announcementContent.content.metadata.type}
                      onChange={(e) => handleMetadataChange({ type: e.target.value as AnnouncementType })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                    >
                      <option value="event">Event</option>
                      <option value="announcement">Announcement</option>
                      <option value="reminder">Reminder</option>
                      <option value="welcome">Welcome</option>
                      <option value="celebration">Celebration</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Urgency</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['low', 'medium', 'high'] as AnnouncementUrgency[]).map(urgency => (
                        <button
                          key={urgency}
                          onClick={() => announcementContent.setUrgency(urgency)}
                          disabled={readOnly}
                          className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                            announcementContent.content.metadata.urgency === urgency
                              ? 'text-white'
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                          style={{
                            backgroundColor: announcementContent.content.metadata.urgency === urgency
                              ? urgencyColors[urgency]
                              : undefined
                          }}
                        >
                          {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <input
                      type="text"
                      value={announcementContent.content.metadata.title}
                      onChange={(e) => handleMetadataChange({ title: e.target.value })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                      placeholder="Announcement title"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <textarea
                      value={announcementContent.content.message}
                      onChange={(e) => {
                        announcementContent.content.message = e.target.value;
                        onContentChange(announcementContent.clone());
                      }}
                      disabled={readOnly}
                      rows={4}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm resize-none"
                      placeholder="Main announcement message"
                    />
                  </div>

                  {/* Details */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Additional Details</label>
                    <textarea
                      value={announcementContent.content.details || ''}
                      onChange={(e) => {
                        announcementContent.content.details = e.target.value;
                        onContentChange(announcementContent.clone());
                      }}
                      disabled={readOnly}
                      rows={3}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm resize-none"
                      placeholder="Optional additional details"
                    />
                  </div>

                  {/* Event Details (if type is event) */}
                  {announcementContent.content.metadata.type === 'event' && (
                    <div className="space-y-3 pt-3 border-t border-border">
                      <h3 className="text-sm font-medium">Event Details</h3>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Date
                        </label>
                        <input
                          type="text"
                          value={announcementContent.content.eventDetails?.date || ''}
                          onChange={(e) => handleEventDetailsChange({ date: e.target.value })}
                          disabled={readOnly}
                          className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                          placeholder="e.g., Friday, March 15th"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Time
                        </label>
                        <input
                          type="text"
                          value={announcementContent.content.eventDetails?.time || ''}
                          onChange={(e) => handleEventDetailsChange({ time: e.target.value })}
                          disabled={readOnly}
                          className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                          placeholder="e.g., 7:00 PM - 9:00 PM"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Location
                        </label>
                        <input
                          type="text"
                          value={announcementContent.content.eventDetails?.location || ''}
                          onChange={(e) => handleEventDetailsChange({ location: e.target.value })}
                          disabled={readOnly}
                          className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                          placeholder="e.g., Main Sanctuary"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Contact
                        </label>
                        <input
                          type="text"
                          value={announcementContent.content.eventDetails?.contact || ''}
                          onChange={(e) => handleEventDetailsChange({ contact: e.target.value })}
                          disabled={readOnly}
                          className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                          placeholder="e.g., John (555-1234)"
                        />
                      </div>
                    </div>
                  )}

                  {/* Call to Action */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Call to Action</label>
                    <input
                      type="text"
                      value={announcementContent.content.callToAction || ''}
                      onChange={(e) => {
                        announcementContent.content.callToAction = e.target.value;
                        onContentChange(announcementContent.clone());
                      }}
                      disabled={readOnly}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                      placeholder="e.g., Join Us!"
                    />
                  </div>
                </div>
              </EditorPanelContainer>
            </Panel>
            <PanelResizeHandle className="w-1 bg-border hover:bg-blue-500 transition-colors" />
          </>
        )}

        {/* Center Panel - Preview */}
        <Panel defaultSize={50} minSize={30}>
          <div className="h-full bg-background flex flex-col">
            {/* Preview Header */}
            <div className="flex-shrink-0 border-b border-border bg-card px-4 py-2">
              <div className="text-sm font-medium text-foreground">Live Preview</div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-6 bg-gray-950 overflow-hidden">
              {currentSlide ? (
                <div className="w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                  <SlideRenderer
                    slide={{
                      id: currentSlide.id,
                      shapes: currentSlide.shapes,
                      background: currentSlide.background
                    }}
                    targetResolution={{ width: 1920, height: 1080 }}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Megaphone className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <div>No preview available</div>
                </div>
              )}
            </div>
          </div>
        </Panel>

        {/* Right Panel - Settings */}
        {panelVisibility.rightPanel && (
          <>
            <PanelResizeHandle className="w-1 bg-border hover:bg-blue-500 transition-colors" />
            <Panel defaultSize={25} minSize={20} maxSize={35}>
              <EditorPanelContainer
                title="Slide Settings"
                onClose={() => setPanelVisibility(prev => ({ ...prev, rightPanel: false }))}
              >
                <div className="space-y-4">
                  {/* Layout */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Layout</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['centered', 'left-aligned', 'modern', 'classic'] as const).map(layout => (
                        <button
                          key={layout}
                          onClick={() => handleLayoutChange(layout)}
                          disabled={readOnly}
                          className={`px-3 py-2 rounded text-xs transition-colors ${
                            announcementContent.settings.layout === layout
                              ? 'bg-blue-600 text-white'
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                        >
                          {layout.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Typography */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Typography</h3>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Title Size: {announcementContent.settings.typography.titleFontSize}px
                      </label>
                      <input
                        type="range"
                        min="32"
                        max="120"
                        value={announcementContent.settings.typography.titleFontSize}
                        onChange={(e) => handleTypographyChange({ titleFontSize: parseInt(e.target.value) })}
                        disabled={readOnly}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Message Size: {announcementContent.settings.typography.messageFontSize}px
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        value={announcementContent.settings.typography.messageFontSize}
                        onChange={(e) => handleTypographyChange({ messageFontSize: parseInt(e.target.value) })}
                        disabled={readOnly}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Title Color</label>
                      <input
                        type="color"
                        value={announcementContent.settings.typography.titleColor}
                        onChange={(e) => handleTypographyChange({ titleColor: e.target.value })}
                        disabled={readOnly}
                        className="w-full h-10 rounded"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Message Color</label>
                      <input
                        type="color"
                        value={announcementContent.settings.typography.messageColor}
                        onChange={(e) => handleTypographyChange({ messageColor: e.target.value })}
                        disabled={readOnly}
                        className="w-full h-10 rounded"
                      />
                    </div>
                  </div>

                  {/* Background */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Background Color</label>
                    <input
                      type="color"
                      value={announcementContent.settings.background.type === 'color' ? announcementContent.settings.background.value : '#1a1a2e'}
                      onChange={(e) => {
                        announcementContent.settings.background = {
                          type: 'color',
                          value: e.target.value
                        };
                        onContentChange(announcementContent.clone());
                      }}
                      disabled={readOnly}
                      className="w-full h-12 rounded"
                    />
                  </div>

                  {/* Show Border */}
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={announcementContent.settings.showBorder}
                      onChange={(e) => {
                        announcementContent.settings.showBorder = e.target.checked;
                        onContentChange(announcementContent.clone());
                      }}
                      disabled={readOnly}
                    />
                    Show Border
                  </label>
                </div>
              </EditorPanelContainer>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
};
