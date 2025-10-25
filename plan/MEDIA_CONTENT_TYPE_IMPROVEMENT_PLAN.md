# Media Content Type Improvement Plan

**Created:** 2025-01-25
**Priority:** MEDIUM - Enhancement of existing MediaContentType and MediaEditor
**Goal:** Enhance media editing with advanced features (video trimming, effects, playlists)

---

## Current State Analysis

### What Already Exists ✅

**MediaContentType** (`src/rendering/content/MediaContent.ts`)
- Type-safe media data model (images and videos)
- Transform system (crop, position, scale, rotate)
- Filter support (brightness, contrast, saturation, blur)
- Text overlay management (add, edit, delete overlays)
- Video settings (start time, end time, loop, playback rate)
- Object-fit options (cover, contain, fill, scale-down, none)

**MediaEditor** (`src/components/editors/MediaEditor.tsx`)
- 3-panel layout (media selection, preview, settings)
- Media type switching (image/video)
- Filter controls with live preview
- Overlay text management
- Transform controls (position, size, rotation)
- Background/video rendering

**Registered and Working:**
- ✅ MediaContentType registered in ContentTypeRegistry
- ✅ MediaEditor registered in EditorFactory
- ✅ Exports configured in index files

---

## Improvement Areas

### 1. Advanced Video Editing

**Problem:** Basic video settings insufficient for professional use

**Solution:** Enhanced video editor with timeline and trimming

**New File:** `src/components/editors/media/VideoTimeline.tsx`

```tsx
<VideoTimeline>
  {/* Timeline Ruler */}
  <div className="relative h-16 bg-gray-800 rounded">
    {/* Time markers */}
    <div className="absolute inset-x-0 top-0 flex justify-between text-xs text-gray-400 px-2">
      {timeMarkers.map(time => (
        <span key={time}>{formatTime(time)}</span>
      ))}
    </div>

    {/* Playhead */}
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-blue-500"
      style={{ left: `${(currentTime / duration) * 100}%` }}
    >
      <div className="absolute -top-1 -left-2 w-4 h-4 bg-blue-500 rounded-full" />
    </div>

    {/* Trim handles */}
    <div
      className="absolute top-0 bottom-0 bg-blue-500 bg-opacity-30"
      style={{
        left: `${(startTime / duration) * 100}%`,
        width: `${((endTime - startTime) / duration) * 100}%`
      }}
    >
      {/* Start handle */}
      <div
        className="absolute top-0 left-0 bottom-0 w-2 bg-blue-600 cursor-ew-resize"
        onMouseDown={(e) => handleDragStart(e, 'start')}
      />

      {/* End handle */}
      <div
        className="absolute top-0 right-0 bottom-0 w-2 bg-blue-600 cursor-ew-resize"
        onMouseDown={(e) => handleDragStart(e, 'end')}
      />
    </div>
  </div>

  {/* Playback Controls */}
  <div className="flex items-center justify-center gap-4 mt-4">
    <Button onClick={handlePlayPause} icon={isPlaying ? <PauseIcon /> : <PlayIcon />}>
      {isPlaying ? 'Pause' : 'Play'}
    </Button>
    <Button onClick={handleStop} icon={<StopIcon />}>
      Stop
    </Button>
    <Button onClick={() => seekTo(startTime)} icon={<SkipBackIcon />}>
      Go to Start
    </Button>

    <div className="flex items-center gap-2 ml-4">
      <span className="text-sm text-muted-foreground">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  </div>

  {/* Trim Settings */}
  <div className="grid grid-cols-2 gap-4 mt-4">
    <div>
      <label className="text-sm font-medium">Start Time</label>
      <Input
        type="number"
        value={startTime}
        onChange={(v) => setStartTime(Number(v))}
        step={0.1}
        min={0}
        max={duration}
      />
    </div>
    <div>
      <label className="text-sm font-medium">End Time</label>
      <Input
        type="number"
        value={endTime}
        onChange={(v) => setEndTime(Number(v))}
        step={0.1}
        min={startTime}
        max={duration}
      />
    </div>
  </div>

  {/* Quick Trim Buttons */}
  <div className="flex gap-2 mt-2">
    <Button size="sm" onClick={() => setRange(0, 30)}>
      First 30s
    </Button>
    <Button size="sm" onClick={() => setRange(duration - 30, duration)}>
      Last 30s
    </Button>
    <Button size="sm" onClick={() => setRange(0, duration)}>
      Full Video
    </Button>
  </div>
</VideoTimeline>
```

---

### 2. Image Cropping Tool

**Problem:** Basic transform controls not intuitive for cropping

**Solution:** Visual crop tool with aspect ratio presets

**New File:** `src/components/editors/media/ImageCropper.tsx`

```tsx
<ImageCropper>
  {/* Crop Preview */}
  <div className="relative aspect-video bg-black rounded overflow-hidden">
    <img
      src={mediaUrl}
      alt="Preview"
      className="absolute inset-0 w-full h-full object-contain"
      style={{
        transform: `translate(${-cropX}px, ${-cropY}px) scale(${cropZoom})`
      }}
    />

    {/* Crop Overlay */}
    <div
      className="absolute border-2 border-blue-500"
      style={{
        left: `${cropX}px`,
        top: `${cropY}px`,
        width: `${cropWidth}px`,
        height: `${cropHeight}px`
      }}
    >
      {/* Resize handles */}
      {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(handle => (
        <div
          key={handle}
          className={`absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-${getHandleCursor(handle)}`}
          style={getHandleStyle(handle)}
          onMouseDown={(e) => startResize(e, handle)}
        />
      ))}
    </div>
  </div>

  {/* Aspect Ratio Presets */}
  <div className="mt-4">
    <label className="text-sm font-medium">Aspect Ratio</label>
    <div className="flex gap-2 flex-wrap mt-2">
      <Button size="sm" onClick={() => setAspectRatio(16/9)}>16:9</Button>
      <Button size="sm" onClick={() => setAspectRatio(4/3)}>4:3</Button>
      <Button size="sm" onClick={() => setAspectRatio(1)}>1:1</Button>
      <Button size="sm" onClick={() => setAspectRatio(9/16)}>9:16</Button>
      <Button size="sm" onClick={() => setAspectRatio(null)}>Free</Button>
    </div>
  </div>

  {/* Zoom Control */}
  <div className="mt-4">
    <label className="text-sm font-medium">Zoom</label>
    <Slider
      value={cropZoom}
      onChange={setCropZoom}
      min={0.5}
      max={3}
      step={0.1}
    />
  </div>

  {/* Reset Button */}
  <Button onClick={resetCrop} variant="secondary" className="mt-4 w-full">
    Reset Crop
  </Button>
</ImageCropper>
```

---

### 3. Text Overlay Enhancements

**Problem:** Limited text overlay customization

**Solution:** Advanced text overlay editor with animations

**New File:** `src/components/editors/media/AdvancedOverlayEditor.tsx`

```tsx
<AdvancedOverlayEditor overlay={overlay} onChange={setOverlay}>
  {/* Text Content */}
  <TextArea
    label="Overlay Text"
    value={overlay.text}
    onChange={(v) => updateOverlay({ text: v })}
    rows={3}
  />

  {/* Position & Size */}
  <div className="grid grid-cols-2 gap-4 mt-4">
    <NumberInput label="X Position" value={overlay.position.x} onChange={(v) => updateOverlay({ position: { ...position, x: v } })} />
    <NumberInput label="Y Position" value={overlay.position.y} onChange={(v) => updateOverlay({ position: { ...position, y: v } })} />
    <NumberInput label="Width" value={overlay.size?.width} onChange={(v) => updateOverlay({ size: { ...size, width: v } })} />
    <NumberInput label="Height" value={overlay.size?.height} onChange={(v) => updateOverlay({ size: { ...size, height: v } })} />
  </div>

  {/* Typography */}
  <div className="mt-4 space-y-3">
    <Slider
      label="Font Size"
      value={overlay.style.fontSize}
      onChange={(v) => updateOverlay({ style: { ...style, fontSize: v } })}
      min={12}
      max={120}
    />

    <Select
      label="Font Family"
      value={overlay.style.fontFamily}
      onChange={(v) => updateOverlay({ style: { ...style, fontFamily: v } })}
      options={fontFamilyOptions}
    />

    <ColorPicker
      label="Text Color"
      value={overlay.style.color}
      onChange={(v) => updateOverlay({ style: { ...style, color: v } })}
    />

    <div className="grid grid-cols-3 gap-2">
      <Checkbox label="Bold" checked={overlay.style.bold} onChange={(v) => updateOverlay({ style: { ...style, bold: v } })} />
      <Checkbox label="Italic" checked={overlay.style.italic} onChange={(v) => updateOverlay({ style: { ...style, italic: v } })} />
      <Checkbox label="Underline" checked={overlay.style.underline} onChange={(v) => updateOverlay({ style: { ...style, underline: v } })} />
    </div>
  </div>

  {/* Effects */}
  <div className="mt-4">
    <label className="text-sm font-medium">Text Effects</label>
    <div className="space-y-3 mt-2">
      <Checkbox
        label="Shadow"
        checked={overlay.style.shadow}
        onChange={(v) => updateOverlay({ style: { ...style, shadow: v } })}
      />
      {overlay.style.shadow && (
        <>
          <Slider label="Shadow Blur" value={overlay.style.shadowBlur} onChange={(v) => updateOverlay({ style: { ...style, shadowBlur: v } })} min={0} max={50} />
          <ColorPicker label="Shadow Color" value={overlay.style.shadowColor} onChange={(v) => updateOverlay({ style: { ...style, shadowColor: v } })} />
        </>
      )}

      <Checkbox
        label="Outline"
        checked={overlay.style.outline}
        onChange={(v) => updateOverlay({ style: { ...style, outline: v } })}
      />
      {overlay.style.outline && (
        <>
          <Slider label="Outline Width" value={overlay.style.outlineWidth} onChange={(v) => updateOverlay({ style: { ...style, outlineWidth: v } })} min={1} max={10} />
          <ColorPicker label="Outline Color" value={overlay.style.outlineColor} onChange={(v) => updateOverlay({ style: { ...style, outlineColor: v } })} />
        </>
      )}
    </div>
  </div>

  {/* Animation */}
  <div className="mt-4">
    <label className="text-sm font-medium">Animation</label>
    <Select
      value={overlay.animation?.type}
      onChange={(v) => updateOverlay({ animation: { type: v, duration: 1000 } })}
      options={[
        { value: 'none', label: 'None' },
        { value: 'fade-in', label: 'Fade In' },
        { value: 'slide-in-left', label: 'Slide In (Left)' },
        { value: 'slide-in-right', label: 'Slide In (Right)' },
        { value: 'slide-in-top', label: 'Slide In (Top)' },
        { value: 'slide-in-bottom', label: 'Slide In (Bottom)' },
        { value: 'zoom-in', label: 'Zoom In' },
        { value: 'bounce', label: 'Bounce' }
      ]}
    />
    {overlay.animation?.type !== 'none' && (
      <Slider
        label="Animation Duration (ms)"
        value={overlay.animation.duration}
        onChange={(v) => updateOverlay({ animation: { ...animation, duration: v } })}
        min={200}
        max={3000}
        step={100}
      />
    )}
  </div>

  {/* Background for Text */}
  <div className="mt-4">
    <Checkbox
      label="Add text background"
      checked={overlay.style.background}
      onChange={(v) => updateOverlay({ style: { ...style, background: v } })}
    />
    {overlay.style.background && (
      <>
        <ColorPicker
          label="Background Color"
          value={overlay.style.backgroundColor}
          onChange={(v) => updateOverlay({ style: { ...style, backgroundColor: v } })}
        />
        <Slider
          label="Background Opacity"
          value={overlay.style.backgroundOpacity}
          onChange={(v) => updateOverlay({ style: { ...style, backgroundOpacity: v } })}
          min={0}
          max={1}
          step={0.1}
        />
        <Slider
          label="Background Padding"
          value={overlay.style.backgroundPadding}
          onChange={(v) => updateOverlay({ style: { ...style, backgroundPadding: v } })}
          min={0}
          max={50}
        />
      </>
    )}
  </div>
</AdvancedOverlayEditor>
```

---

### 4. Media Library Integration

**Problem:** Media files scattered, no organization

**Solution:** Integrated media library with categorization

**New File:** `src/components/editors/media/MediaLibrary.tsx`

```tsx
<MediaLibrary>
  {/* Search & Filters */}
  <div className="flex items-center gap-4 mb-4">
    <Input
      placeholder="Search media..."
      value={searchQuery}
      onChange={setSearchQuery}
      icon={<SearchIcon />}
    />

    <Select
      value={filterType}
      onChange={setFilterType}
      options={[
        { value: 'all', label: 'All Media' },
        { value: 'images', label: 'Images Only' },
        { value: 'videos', label: 'Videos Only' }
      ]}
    />

    <Select
      value={filterCategory}
      onChange={setFilterCategory}
      options={[
        { value: 'all', label: 'All Categories' },
        { value: 'worship', label: 'Worship' },
        { value: 'announcements', label: 'Announcements' },
        { value: 'backgrounds', label: 'Backgrounds' },
        { value: 'events', label: 'Events' }
      ]}
    />
  </div>

  {/* Media Grid */}
  <div className="grid grid-cols-4 gap-4">
    {mediaItems.map(item => (
      <MediaThumbnail
        key={item.id}
        item={item}
        selected={selectedId === item.id}
        onClick={() => selectMedia(item)}
        onDelete={() => deleteMedia(item.id)}
      />
    ))}
  </div>

  {/* Upload Button */}
  <Button
    onClick={handleUpload}
    icon={<UploadIcon />}
    variant="primary"
    className="mt-4 w-full"
  >
    Upload New Media
  </Button>
</MediaLibrary>
```

---

### 5. Filter Presets

**Problem:** Users have to manually adjust filters each time

**Solution:** Predefined filter presets like Instagram

**New File:** `src/components/editors/media/FilterPresets.tsx`

```typescript
export const FILTER_PRESETS = {
  none: {
    name: 'None',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0
  },
  vivid: {
    name: 'Vivid',
    brightness: 105,
    contrast: 115,
    saturation: 130,
    blur: 0
  },
  warm: {
    name: 'Warm',
    brightness: 110,
    contrast: 105,
    saturation: 110,
    blur: 0,
    tint: '#ff9933' // Orange tint
  },
  cool: {
    name: 'Cool',
    brightness: 100,
    contrast: 105,
    saturation: 105,
    blur: 0,
    tint: '#3399ff' // Blue tint
  },
  blackAndWhite: {
    name: 'Black & White',
    brightness: 100,
    contrast: 110,
    saturation: 0,
    blur: 0
  },
  vintage: {
    name: 'Vintage',
    brightness: 95,
    contrast: 120,
    saturation: 80,
    blur: 0,
    tint: '#f4e4c1' // Sepia tint
  },
  dramatic: {
    name: 'Dramatic',
    brightness: 90,
    contrast: 140,
    saturation: 110,
    blur: 0
  },
  soft: {
    name: 'Soft',
    brightness: 105,
    contrast: 90,
    saturation: 95,
    blur: 2
  }
};
```

```tsx
<FilterPresets>
  <div className="grid grid-cols-4 gap-2">
    {Object.entries(FILTER_PRESETS).map(([key, preset]) => (
      <button
        key={key}
        onClick={() => applyPreset(preset)}
        className={`
          border-2 rounded p-2 text-sm
          ${currentPreset === key ? 'border-blue-500' : 'border-gray-700'}
        `}
      >
        {/* Thumbnail with filter applied */}
        <div className="aspect-video bg-gray-800 rounded mb-1 overflow-hidden">
          <img
            src={mediaThumbnail}
            alt={preset.name}
            style={{
              filter: `brightness(${preset.brightness}%) contrast(${preset.contrast}%) saturate(${preset.saturation}%) blur(${preset.blur}px)`
            }}
          />
        </div>
        <span>{preset.name}</span>
      </button>
    ))}
  </div>
</FilterPresets>
```

---

### 6. Media Playlists

**Problem:** Cannot group related media for sequences

**Solution:** Create media playlists/slideshows

**New File:** `src/rendering/content/MediaPlaylistContent.ts`

```typescript
export interface MediaPlaylistData {
  metadata: {
    title: string;
    description?: string;
    duration?: number;
  };
  items: Array<{
    id: string;
    mediaContent: MediaContentType;
    duration: number; // How long to show this item
    transition?: 'fade' | 'slide' | 'zoom' | 'none';
    transitionDuration: number; // ms
  }>;
  settings: {
    loop: boolean;
    autoAdvance: boolean;
    showProgress: boolean; // Show progress indicator
  };
}

export class MediaPlaylistContentType extends BaseContentType<MediaPlaylistData, MediaPlaylistSettings> {
  readonly typeId: ContentTypeId = 'media-playlist';
  readonly typeName: string = 'Media Playlist';

  generateSlides(): GeneratedSlide[] {
    const slides: GeneratedSlide[] = [];

    for (const item of this.content.items) {
      // Generate slides from each media item
      const itemSlides = item.mediaContent.generateSlides();
      slides.push(...itemSlides);
    }

    return slides;
  }
}
```

**Playlist Editor UI:**

```tsx
<PlaylistEditor>
  {/* Playlist Items */}
  <DragDropList
    items={playlistItems}
    renderItem={(item) => (
      <PlaylistItem
        media={item.mediaContent}
        duration={item.duration}
        transition={item.transition}
        onEdit={() => editItem(item)}
        onDelete={() => deleteItem(item.id)}
      />
    )}
    onReorder={setPlaylistItems}
  />

  {/* Add Media Button */}
  <Button onClick={handleAddMedia} icon={<PlusIcon />}>
    Add Media to Playlist
  </Button>

  {/* Playlist Settings */}
  <div className="mt-4 space-y-3">
    <Checkbox label="Loop playlist" checked={settings.loop} onChange={(v) => updateSettings({ loop: v })} />
    <Checkbox label="Auto-advance" checked={settings.autoAdvance} onChange={(v) => updateSettings({ autoAdvance: v })} />
    <Checkbox label="Show progress" checked={settings.showProgress} onChange={(v) => updateSettings({ showProgress: v })} />
  </div>
</PlaylistEditor>
```

---

### 7. Media Effects & Transitions

**Problem:** Static media presentation lacks visual interest

**Solution:** Add transition effects and Ken Burns effect

**New File:** `src/components/editors/media/EffectsPanel.tsx`

```tsx
<EffectsPanel>
  {/* Ken Burns Effect (Pan & Zoom) */}
  <EffectCard title="Ken Burns Effect">
    <Checkbox
      label="Enable Ken Burns effect"
      checked={effects.kenBurns.enabled}
      onChange={(v) => updateEffect('kenBurns', { enabled: v })}
    />
    {effects.kenBurns.enabled && (
      <>
        <Select
          label="Direction"
          value={effects.kenBurns.direction}
          onChange={(v) => updateEffect('kenBurns', { direction: v })}
          options={[
            { value: 'zoom-in', label: 'Zoom In' },
            { value: 'zoom-out', label: 'Zoom Out' },
            { value: 'pan-left', label: 'Pan Left' },
            { value: 'pan-right', label: 'Pan Right' },
            { value: 'pan-up', label: 'Pan Up' },
            { value: 'pan-down', label: 'Pan Down' }
          ]}
        />
        <Slider
          label="Speed"
          value={effects.kenBurns.speed}
          onChange={(v) => updateEffect('kenBurns', { speed: v })}
          min={1}
          max={10}
        />
      </>
    )}
  </EffectCard>

  {/* Vignette */}
  <EffectCard title="Vignette">
    <Checkbox
      label="Add vignette"
      checked={effects.vignette.enabled}
      onChange={(v) => updateEffect('vignette', { enabled: v })}
    />
    {effects.vignette.enabled && (
      <Slider
        label="Intensity"
        value={effects.vignette.intensity}
        onChange={(v) => updateEffect('vignette', { intensity: v })}
        min={0}
        max={1}
        step={0.1}
      />
    )}
  </EffectCard>

  {/* Color Grading */}
  <EffectCard title="Color Grading">
    <Slider label="Temperature" value={effects.temperature} onChange={(v) => updateEffect('temperature', v)} min={-50} max={50} />
    <Slider label="Tint" value={effects.tint} onChange={(v) => updateEffect('tint', v)} min={-50} max={50} />
    <Slider label="Highlights" value={effects.highlights} onChange={(v) => updateEffect('highlights', v)} min={-100} max={100} />
    <Slider label="Shadows" value={effects.shadows} onChange={(v) => updateEffect('shadows', v)} min={-100} max={100} />
  </EffectCard>
</EffectsPanel>
```

---

## Implementation Checklist

- [ ] Enhancement 1: Advanced Video Editing
  - [ ] Create VideoTimeline component with scrubbing
  - [ ] Implement trim handles (drag to adjust)
  - [ ] Add playback controls
  - [ ] Integrate with MediaEditor

- [ ] Enhancement 2: Image Cropping Tool
  - [ ] Create ImageCropper component
  - [ ] Implement visual crop overlay
  - [ ] Add aspect ratio presets
  - [ ] Add zoom/pan controls

- [ ] Enhancement 3: Advanced Overlay Editor
  - [ ] Extend overlay styling options
  - [ ] Add text effects (shadow, outline)
  - [ ] Implement overlay animations
  - [ ] Add text background option

- [ ] Enhancement 4: Media Library
  - [ ] Build MediaLibrary component
  - [ ] Add search and filtering
  - [ ] Implement categories/tags
  - [ ] Create upload/management UI

- [ ] Enhancement 5: Filter Presets
  - [ ] Define 8-10 filter presets
  - [ ] Create FilterPresets UI
  - [ ] Generate preset thumbnails
  - [ ] Add custom preset save

- [ ] Enhancement 6: Media Playlists
  - [ ] Create MediaPlaylistContentType
  - [ ] Build PlaylistEditor component
  - [ ] Implement drag-and-drop reordering
  - [ ] Add transition settings

- [ ] Enhancement 7: Effects & Transitions
  - [ ] Build EffectsPanel component
  - [ ] Implement Ken Burns effect
  - [ ] Add vignette effect
  - [ ] Add color grading controls

---

## Benefits

### For Users

1. **Professional Editing**: Video trimming, cropping, and effects
2. **Creative Control**: Advanced overlays with animations
3. **Organization**: Media library with categories
4. **Efficiency**: Filter presets and playlists
5. **Visual Appeal**: Ken Burns and transition effects
6. **Time Savings**: Reusable media configurations

### For Worship Teams

1. **Consistency**: Branded filter presets
2. **Preparation**: Playlists for recurring media sequences
3. **Quality**: Professional-looking media presentations
4. **Flexibility**: Advanced editing without external tools
5. **Simplicity**: Intuitive UI for non-technical users

---

## Timeline Estimate

- Enhancement 1: 8-10 hours
- Enhancement 2: 6-7 hours
- Enhancement 3: 6-7 hours
- Enhancement 4: 8-10 hours
- Enhancement 5: 4-5 hours
- Enhancement 6: 10-12 hours
- Enhancement 7: 8-10 hours

**Total:** ~50-61 hours of development time

---

## Success Criteria

1. ✅ Video timeline with trim handles works
2. ✅ Image cropper with aspect ratios functional
3. ✅ Advanced overlay editor with animations works
4. ✅ Media library organizes and searches media
5. ✅ Filter presets apply correctly
6. ✅ Media playlists play in sequence
7. ✅ Ken Burns effect animates smoothly
8. ✅ All enhancements integrate with MediaEditor
9. ✅ Performance remains smooth with effects enabled
10. ✅ Live display renders media with effects correctly
