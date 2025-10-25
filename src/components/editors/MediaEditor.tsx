import React, { useState, useEffect } from 'react';
import { Image, Video, Plus, Trash2, Settings, Save, X } from 'lucide-react';
import { MediaContentType, MediaData, MediaSlideSettings, MediaOverlay } from '../../rendering/content';
import { BaseEditorProps, EditorToolbar, EditorPanelContainer } from './BaseEditor';
import { SlideRenderer } from '../slides/SlideRenderer';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

/**
 * MediaEditor - Editor for image and video content
 *
 * Features:
 * - Media upload/URL input
 * - Transform controls (position, size, crop, rotation)
 * - Filter adjustments (brightness, contrast, saturation, blur)
 * - Overlay text management
 * - Video playback controls (for videos)
 * - Live preview
 */
export const MediaEditor: React.FC<BaseEditorProps<MediaData, MediaSlideSettings>> = ({
  content,
  onContentChange,
  onSlidesGenerated,
  currentSlideIndex = 0,
  onSlideIndexChange,
  readOnly = false,
  onSave,
  onCancel
}) => {
  const mediaContent = content as MediaContentType;
  const [slides, setSlides] = useState(mediaContent.generateSlides());
  const [panelVisibility, setPanelVisibility] = useState({
    leftPanel: true,
    rightPanel: true
  });

  // Regenerate slides when content changes
  useEffect(() => {
    const newSlides = mediaContent.generateSlides();
    setSlides(newSlides);
    onSlidesGenerated?.(newSlides);
  }, [content, onSlidesGenerated]);

  const handleMediaUrlChange = (url: string) => {
    mediaContent.settings.mediaUrl = url;
    onContentChange(mediaContent.clone());
  };

  const handleMediaTypeChange = (type: 'image' | 'video') => {
    mediaContent.settings.mediaType = type;
    onContentChange(mediaContent.clone());
  };

  const handleTransformChange = (updates: Partial<typeof mediaContent.settings.transform>) => {
    mediaContent.updateTransform(updates);
    onContentChange(mediaContent.clone());
  };

  const handleFilterChange = (filters: Partial<NonNullable<typeof mediaContent.settings.filters>>) => {
    mediaContent.updateFilters(filters);
    onContentChange(mediaContent.clone());
  };

  const handleAddOverlay = () => {
    const newOverlay: MediaOverlay = {
      id: `overlay-${Date.now()}`,
      text: 'New Text',
      position: { x: 960, y: 540 },
      size: { width: 800, height: 100 },
      style: {
        fontSize: 48,
        fontFamily: 'Arial',
        color: '#ffffff',
        textAlign: 'center',
        shadow: true
      }
    };
    mediaContent.addOverlay(newOverlay);
    onContentChange(mediaContent.clone());
  };

  const handleUpdateOverlay = (overlayId: string, updates: Partial<MediaOverlay>) => {
    mediaContent.updateOverlay(overlayId, updates);
    onContentChange(mediaContent.clone());
  };

  const handleRemoveOverlay = (overlayId: string) => {
    mediaContent.removeOverlay(overlayId);
    onContentChange(mediaContent.clone());
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Toolbar */}
      <EditorToolbar
        title={mediaContent.content.metadata.title}
        subtitle={`${mediaContent.settings.mediaType === 'video' ? 'Video' : 'Image'} • ${slides.length} slide`}
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
        {/* Left Panel - Media Settings */}
        {panelVisibility.leftPanel && (
          <>
            <Panel defaultSize={25} minSize={20} maxSize={40}>
              <EditorPanelContainer
                title="Media Settings"
                icon={mediaContent.settings.mediaType === 'video' ? <Video className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                onClose={() => setPanelVisibility(prev => ({ ...prev, leftPanel: false }))}
              >
                <div className="space-y-4">
                  {/* Media Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Media Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMediaTypeChange('image')}
                        disabled={readOnly}
                        className={`flex-1 px-3 py-2 rounded border transition-colors ${
                          mediaContent.settings.mediaType === 'image'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-secondary border-border hover:bg-secondary/80'
                        }`}
                      >
                        <Image className="w-4 h-4 mx-auto mb-1" />
                        <div className="text-xs">Image</div>
                      </button>
                      <button
                        onClick={() => handleMediaTypeChange('video')}
                        disabled={readOnly}
                        className={`flex-1 px-3 py-2 rounded border transition-colors ${
                          mediaContent.settings.mediaType === 'video'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-secondary border-border hover:bg-secondary/80'
                        }`}
                      >
                        <Video className="w-4 h-4 mx-auto mb-1" />
                        <div className="text-xs">Video</div>
                      </button>
                    </div>
                  </div>

                  {/* Media URL */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Media URL</label>
                    <input
                      type="text"
                      value={mediaContent.settings.mediaUrl}
                      onChange={(e) => handleMediaUrlChange(e.target.value)}
                      disabled={readOnly}
                      placeholder="Enter media URL or path"
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter a URL or file path to your media
                    </p>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <input
                      type="text"
                      value={mediaContent.content.metadata.title}
                      onChange={(e) => {
                        mediaContent.content.metadata.title = e.target.value;
                        onContentChange(mediaContent.clone());
                      }}
                      disabled={readOnly}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <textarea
                      value={mediaContent.content.metadata.description || ''}
                      onChange={(e) => {
                        mediaContent.content.metadata.description = e.target.value;
                        onContentChange(mediaContent.clone());
                      }}
                      disabled={readOnly}
                      rows={3}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm resize-none"
                    />
                  </div>

                  {/* Object Fit */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Object Fit</label>
                    <select
                      value={mediaContent.settings.transform.objectFit || 'cover'}
                      onChange={(e) => handleTransformChange({ objectFit: e.target.value as any })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                    >
                      <option value="cover">Cover (fill and crop)</option>
                      <option value="contain">Contain (fit inside)</option>
                      <option value="fill">Fill (stretch)</option>
                      <option value="scale-down">Scale Down</option>
                      <option value="none">None (original size)</option>
                    </select>
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
                  <div className="text-6xl mb-4">📷</div>
                  <div>No preview available</div>
                  <div className="text-sm mt-2">Enter a media URL to see preview</div>
                </div>
              )}
            </div>

            {/* Panel Toggles (if panels are hidden) */}
            {!panelVisibility.leftPanel && (
              <div className="absolute top-20 left-4">
                <button
                  onClick={() => setPanelVisibility(prev => ({ ...prev, leftPanel: true }))}
                  className="px-3 py-1.5 bg-card border border-border rounded text-sm hover:bg-secondary transition-colors"
                >
                  <Settings className="w-4 h-4 inline mr-1" />
                  Settings
                </button>
              </div>
            )}
            {!panelVisibility.rightPanel && (
              <div className="absolute top-20 right-4">
                <button
                  onClick={() => setPanelVisibility(prev => ({ ...prev, rightPanel: true }))}
                  className="px-3 py-1.5 bg-card border border-border rounded text-sm hover:bg-secondary transition-colors"
                >
                  <Settings className="w-4 h-4 inline mr-1" />
                  Filters & Overlays
                </button>
              </div>
            )}
          </div>
        </Panel>

        {/* Right Panel - Filters & Overlays */}
        {panelVisibility.rightPanel && (
          <>
            <PanelResizeHandle className="w-1 bg-border hover:bg-blue-500 transition-colors" />
            <Panel defaultSize={25} minSize={20} maxSize={35}>
              <EditorPanelContainer
                title="Filters & Overlays"
                icon={<Settings className="w-4 h-4" />}
                onClose={() => setPanelVisibility(prev => ({ ...prev, rightPanel: false }))}
              >
                <div className="space-y-6">
                  {/* Filters Section */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Filters</h3>
                    <div className="space-y-3">
                      {/* Brightness */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Brightness: {mediaContent.settings.filters?.brightness || 100}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={mediaContent.settings.filters?.brightness || 100}
                          onChange={(e) => handleFilterChange({ brightness: parseInt(e.target.value) })}
                          disabled={readOnly}
                          className="w-full"
                        />
                      </div>

                      {/* Contrast */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Contrast: {mediaContent.settings.filters?.contrast || 100}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={mediaContent.settings.filters?.contrast || 100}
                          onChange={(e) => handleFilterChange({ contrast: parseInt(e.target.value) })}
                          disabled={readOnly}
                          className="w-full"
                        />
                      </div>

                      {/* Saturation */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Saturation: {mediaContent.settings.filters?.saturation || 100}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={mediaContent.settings.filters?.saturation || 100}
                          onChange={(e) => handleFilterChange({ saturation: parseInt(e.target.value) })}
                          disabled={readOnly}
                          className="w-full"
                        />
                      </div>

                      {/* Blur */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Blur: {mediaContent.settings.filters?.blur || 0}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={mediaContent.settings.filters?.blur || 0}
                          onChange={(e) => handleFilterChange({ blur: parseInt(e.target.value) })}
                          disabled={readOnly}
                          className="w-full"
                        />
                      </div>

                      {/* Reset Filters */}
                      <button
                        onClick={() => handleFilterChange({ brightness: 100, contrast: 100, saturation: 100, blur: 0 })}
                        disabled={readOnly}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </div>

                  {/* Overlays Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium">Text Overlays</h3>
                      <button
                        onClick={handleAddOverlay}
                        disabled={readOnly}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>

                    {mediaContent.settings.overlays && mediaContent.settings.overlays.length > 0 ? (
                      <div className="space-y-2">
                        {mediaContent.settings.overlays.map((overlay) => (
                          <div key={overlay.id} className="p-3 bg-secondary rounded border border-border">
                            <div className="flex items-start justify-between mb-2">
                              <input
                                type="text"
                                value={overlay.text}
                                onChange={(e) => handleUpdateOverlay(overlay.id, { text: e.target.value })}
                                disabled={readOnly}
                                className="flex-1 px-2 py-1 bg-background border border-border rounded text-xs"
                                placeholder="Overlay text"
                              />
                              <button
                                onClick={() => handleRemoveOverlay(overlay.id)}
                                disabled={readOnly}
                                className="ml-2 p-1 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <label className="text-xs text-muted-foreground">Font Size: {overlay.style.fontSize}px</label>
                                <input
                                  type="range"
                                  min="12"
                                  max="120"
                                  value={overlay.style.fontSize}
                                  onChange={(e) => handleUpdateOverlay(overlay.id, {
                                    style: { ...overlay.style, fontSize: parseInt(e.target.value) }
                                  })}
                                  disabled={readOnly}
                                  className="w-full"
                                />
                              </div>

                              <div>
                                <label className="text-xs text-muted-foreground">Color</label>
                                <input
                                  type="color"
                                  value={overlay.style.color}
                                  onChange={(e) => handleUpdateOverlay(overlay.id, {
                                    style: { ...overlay.style, color: e.target.value }
                                  })}
                                  disabled={readOnly}
                                  className="w-full h-8 rounded"
                                />
                              </div>

                              <label className="flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={overlay.style.shadow || false}
                                  onChange={(e) => handleUpdateOverlay(overlay.id, {
                                    style: { ...overlay.style, shadow: e.target.checked }
                                  })}
                                  disabled={readOnly}
                                />
                                Text Shadow
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        No overlays yet. Click Add to create one.
                      </div>
                    )}
                  </div>
                </div>
              </EditorPanelContainer>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
};
