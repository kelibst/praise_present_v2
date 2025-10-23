# Plan Tab - Comprehensive Redesign & Integration Plan

**Complete UX Overhaul + 12-Phase Component Integration**

---

## 🎯 Goals & Objectives

### User Experience Goals
1. ✅ **Clear tab active states** - Users should always know which tab they're on
2. ✅ **Intuitive plan item management** - Add, edit, reorder, delete items inline
3. ✅ **Inline media addition** - Add songs, scriptures, presentations directly from plan tab
4. ✅ **Visual feedback** - Loading states, success/error messages, smooth transitions
5. ✅ **Professional execution** - Real-time tracking, timeline, controls during service

### Technical Goals
1. Integrate all 12-phase plan components
2. Maintain current drag-and-drop functionality
3. Add inline content addition (no navigation required)
4. Real-time execution tracking
5. Pre-service checklist automation

---

## 📊 Current State Analysis

### What Works Well ✅
- Tab navigation structure (Scripture, Current Service, Plan Manager)
- Drag-and-drop reordering of service items
- Basic plan loading from PlanManager
- Integration with live display
- Service item rendering with type icons

### What Needs Improvement ❌
- **Tab active states not visually clear** - Hard to see which tab is active
- **No inline media addition** - Must navigate to /songs or /scripture
- **No real-time execution** - No way to track service progress
- **No visual timeline** - Hard to see service overview
- **No pre-service checklist** - Manual preparation
- **Limited plan item management** - Can't edit inline
- **No search/filter** - Hard to find specific plans
- **Basic statistics only** - No execution metrics

---

## 🎨 Phase 1: Enhanced Tab Navigation (IMMEDIATE)

### 1.1 Improve Tab Active States

**Current Issue:** Tabs use subtle color changes that aren't obvious

**Solution:** Enhanced visual indicators

```typescript
// UPDATE: Tab Navigation (around line 1403)
<div className="flex border-b-2 border-border">
  {[
    { key: 'scripture', label: 'Scripture', icon: BookOpen, color: 'purple' },
    { key: 'plan', label: 'Current Service', icon: Play, color: 'green' },
    { key: 'plans', label: 'Plan Manager', icon: Calendar, color: 'blue' }
  ].map(({ key, label, icon: Icon, color }) => {
    const isActive = activeTab === key;
    const colorClasses = {
      purple: {
        active: 'bg-purple-600 text-white border-b-4 border-purple-400',
        inactive: 'bg-secondary text-muted-foreground hover:bg-purple-900/20 hover:text-purple-300'
      },
      green: {
        active: 'bg-green-600 text-white border-b-4 border-green-400',
        inactive: 'bg-secondary text-muted-foreground hover:bg-green-900/20 hover:text-green-300'
      },
      blue: {
        active: 'bg-blue-600 text-white border-b-4 border-blue-400',
        inactive: 'bg-secondary text-muted-foreground hover:bg-blue-900/20 hover:text-blue-300'
      }
    };

    return (
      <button
        key={key}
        onClick={() => setActiveTab(key as any)}
        className={`
          flex-1 px-6 py-4 text-sm font-semibold
          border-r border-border last:border-r-0
          flex items-center justify-center gap-2
          transition-all duration-200 relative
          ${isActive ? colorClasses[color].active : colorClasses[color].inactive}
        `}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
        <span>{label}</span>
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent" />
        )}
        {/* Badge for item counts */}
        {key === 'plan' && serviceItems.length > 0 && (
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
            isActive ? 'bg-white text-green-600' : 'bg-green-900/30 text-green-300'
          }`}>
            {serviceItems.length}
          </span>
        )}
      </button>
    );
  })}
</div>
```

**Testing:**
- [ ] Active tab clearly stands out
- [ ] Hover states work on inactive tabs
- [ ] Badge shows item count
- [ ] Animation on active tab
- [ ] Bottom gradient indicator visible

---

## 📦 Phase 2: Inline Media Addition (HIGH PRIORITY)

### 2.1 Add Quick Media Buttons to Current Service Tab

**Location:** Inside Current Service tab, above service items list

```typescript
// ADD: Inline Media Addition Panel (after line 1571)
const [showInlineAdd, setShowInlineAdd] = useState<{
  type: 'song' | 'scripture' | 'presentation' | 'announcement' | null;
  position: number;
}>({ type: null, position: -1 });

const handleInlineAdd = (type: 'song' | 'scripture' | 'presentation' | 'announcement', afterIndex: number) => {
  setShowInlineAdd({ type, position: afterIndex });
};

// Inline Add Panel Component
const InlineAddPanel = () => {
  if (!showInlineAdd.type) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <div className="flex items-center gap-3">
            {showInlineAdd.type === 'song' && <Music className="w-6 h-6 text-blue-400" />}
            {showInlineAdd.type === 'scripture' && <BookOpen className="w-6 h-6 text-green-400" />}
            {showInlineAdd.type === 'presentation' && <Film className="w-6 h-6 text-purple-400" />}
            {showInlineAdd.type === 'announcement' && <MessageSquare className="w-6 h-6 text-orange-400" />}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Add {showInlineAdd.type === 'song' ? 'Song' :
                     showInlineAdd.type === 'scripture' ? 'Scripture' :
                     showInlineAdd.type === 'presentation' ? 'Presentation' : 'Announcement'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Select content to add to your service
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInlineAdd({ type: null, position: -1 })}
            className="p-2 hover:bg-secondary rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {showInlineAdd.type === 'song' && (
            <InlineSongSelector
              onSelect={(song) => {
                addSongToService(song, showInlineAdd.position);
                setShowInlineAdd({ type: null, position: -1 });
              }}
            />
          )}
          {showInlineAdd.type === 'scripture' && (
            <InlineScriptureSelector
              onSelect={(scripture) => {
                addScriptureToService(scripture, showInlineAdd.position);
                setShowInlineAdd({ type: null, position: -1 });
              }}
            />
          )}
          {showInlineAdd.type === 'presentation' && (
            <InlinePresentationSelector
              onSelect={(presentation) => {
                addPresentationToService(presentation, showInlineAdd.position);
                setShowInlineAdd({ type: null, position: -1 });
              }}
            />
          )}
          {showInlineAdd.type === 'announcement' && (
            <InlineAnnouncementEditor
              onSave={(announcement) => {
                addAnnouncementToService(announcement, showInlineAdd.position);
                setShowInlineAdd({ type: null, position: -1 });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Quick Add Buttons (floating toolbar)
const QuickAddToolbar = ({ position }: { position: number }) => (
  <div className="flex items-center justify-center gap-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      onClick={() => handleInlineAdd('song', position)}
      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
    >
      <Music className="w-3 h-3" />
      Song
    </button>
    <button
      onClick={() => handleInlineAdd('scripture', position)}
      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
    >
      <BookOpen className="w-3 h-3" />
      Scripture
    </button>
    <button
      onClick={() => handleInlineAdd('presentation', position)}
      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
    >
      <Film className="w-3 h-3" />
      Slides
    </button>
    <button
      onClick={() => handleInlineAdd('announcement', position)}
      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
    >
      <MessageSquare className="w-3 h-3" />
      Announcement
    </button>
  </div>
);
```

### 2.2 Create Inline Selector Components

**Create new file:** `src/components/plans/InlineMediaSelectors.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Search, Music, BookOpen, Film, MessageSquare, Star, Clock } from 'lucide-react';

// Song Selector
export const InlineSongSelector: React.FC<{ onSelect: (song: any) => void }> = ({ onSelect }) => {
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSongs();
  }, [search]);

  const loadSongs = async () => {
    setLoading(true);
    const result = await window.electronAPI?.invoke('db:getSongs', { search });
    setSongs(result || []);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search songs..."
          className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>

      {/* Song List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading songs...</div>
        ) : songs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No songs found</p>
          </div>
        ) : (
          songs.map((song: any) => (
            <button
              key={song.id}
              onClick={() => onSelect(song)}
              className="w-full p-3 bg-secondary hover:bg-secondary/80 border border-border rounded text-left transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {song.title}
                  </div>
                  {song.artist && (
                    <div className="text-sm text-muted-foreground mt-1">{song.artist}</div>
                  )}
                </div>
                <Music className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// Scripture Selector
export const InlineScriptureSelector: React.FC<{ onSelect: (scripture: any) => void }> = ({ onSelect }) => {
  const [showThemes, setShowThemes] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setShowThemes(false)}
          className={`flex-1 px-4 py-2 rounded transition-colors ${
            !showThemes
              ? 'bg-green-600 text-white'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          Browse Books
        </button>
        <button
          onClick={() => setShowThemes(true)}
          className={`flex-1 px-4 py-2 rounded transition-colors ${
            showThemes
              ? 'bg-green-600 text-white'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          By Theme
        </button>
      </div>

      {showThemes ? (
        <ScriptureThemeSelector onSelect={onSelect} onClose={() => {}} />
      ) : (
        <BibleBrowseSelector onVerseSelect={(verses) => onSelect({ verses })} />
      )}
    </div>
  );
};

// Presentation Selector
export const InlinePresentationSelector: React.FC<{ onSelect: (presentation: any) => void }> = ({ onSelect }) => {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    const result = await window.electronAPI?.invoke('db:getPresentations');
    setPresentations(result || []);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Select a presentation to add to your service
      </div>

      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          <div className="col-span-2 text-center py-8 text-muted-foreground">Loading...</div>
        ) : presentations.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-muted-foreground">
            <Film className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No presentations found</p>
          </div>
        ) : (
          presentations.map((pres: any) => (
            <button
              key={pres.id}
              onClick={() => onSelect(pres)}
              className="p-4 bg-secondary hover:bg-secondary/80 border border-border rounded text-left transition-colors group"
            >
              <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded mb-2 flex items-center justify-center">
                <Film className="w-8 h-8 text-purple-400" />
              </div>
              <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                {pres.title}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {pres.slideCount || 0} slides
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// Announcement Editor
export const InlineAnnouncementEditor: React.FC<{ onSave: (announcement: any) => void }> = ({ onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      type: 'announcement',
      title: title.trim(),
      content: content.trim()
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Announcement Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Welcome & Greetings"
          className="w-full px-3 py-2 bg-secondary border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Content (optional)
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add announcement details..."
          rows={4}
          className="w-full px-3 py-2 bg-secondary border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!title.trim()}
        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
      >
        Add Announcement
      </button>
    </div>
  );
};
```

**Testing:**
- [ ] Quick add buttons appear between items
- [ ] Modal opens with correct content selector
- [ ] Song search works
- [ ] Scripture browse works
- [ ] Presentation grid displays
- [ ] Announcement form saves
- [ ] Items added at correct position

---

## 📦 Phase 3: Inline Plan Item Management (HIGH PRIORITY)

### 3.1 Add Edit Mode to Service Items

```typescript
// ADD: Edit mode state
const [editingItemId, setEditingItemId] = useState<string | null>(null);
const [editingItemData, setEditingItemData] = useState<any>(null);

// Modify ServiceItem component to support inline editing
const InlineEditableServiceItem = ({ item, onUpdate, onDelete }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(item);

  const handleSave = () => {
    onUpdate(item.id, editData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-card border-2 border-primary rounded-lg">
        {/* Title */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-foreground mb-1">Title</label>
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="w-full px-3 py-2 bg-secondary border border-border rounded text-foreground"
          />
        </div>

        {/* Duration (if applicable) */}
        {item.type !== 'announcement' && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-foreground mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={editData.duration || 5}
              onChange={(e) => setEditData({ ...editData, duration: parseInt(e.target.value) })}
              className="w-24 px-3 py-2 bg-secondary border border-border rounded text-foreground"
            />
          </div>
        )}

        {/* Notes */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
          <textarea
            value={editData.notes || ''}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 bg-secondary border border-border rounded text-foreground resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      {/* Normal service item view */}
      <ServiceItem item={item} ... />

      {/* Inline action buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-lg"
          title="Edit"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded shadow-lg"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
```

**Testing:**
- [ ] Edit button appears on hover
- [ ] Inline edit mode activates
- [ ] Changes save correctly
- [ ] Cancel restores original data
- [ ] Delete removes item

---

## 📦 Phase 4: Service Items with Add-Between Buttons

### 4.1 Add Insert Buttons Between Items

```typescript
// Modify service items rendering
<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
  <SortableContext items={serviceItems.map(item => item.id)}>
    {serviceItems.map((item, index) => (
      <React.Fragment key={item.id}>
        {/* Add button before first item */}
        {index === 0 && (
          <div className="group mb-2">
            <div className="border-2 border-dashed border-border rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <QuickAddToolbar position={-1} />
            </div>
          </div>
        )}

        {/* Service Item */}
        <InlineEditableServiceItem
          item={item}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
        />

        {/* Add button after each item */}
        <div className="group my-2">
          <div className="border-2 border-dashed border-border rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <QuickAddToolbar position={index} />
          </div>
        </div>
      </React.Fragment>
    ))}
  </SortableContext>
</DndContext>
```

---

## 📦 Phase 5: Integrate Execution Components (MEDIUM PRIORITY)

### 5.1 Add Time Tracker

```typescript
import { TimeTracker } from '../components/plans/TimeTracker';

// At top of Current Service tab content
{executionState.isExecuting && selectedPlan && (
  <div className="mb-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg border border-border">
    <TimeTracker planId={selectedPlan.id} />
  </div>
)}
```

### 5.2 Add Plan Timeline (Bottom Bar)

```typescript
import { PlanTimeline } from '../components/plans/PlanTimeline';

// At bottom of page layout
{executionState.isExecuting && selectedPlan && (
  <div className="fixed bottom-0 left-0 right-0 h-32 border-t border-border bg-background z-50">
    <PlanTimeline
      planId={selectedPlan.id}
      onItemClick={(itemId) => {
        const item = serviceItems.find(i => i.id === itemId);
        if (item) generateSlidesForItem(item);
      }}
    />
  </div>
)}
```

### 5.3 Add Live Plan Controls

```typescript
import { LivePlanControls } from '../components/plans/LivePlanControls';

// In Current Service tab, above items
{selectedPlan && (
  <div className="mb-4">
    <LivePlanControls
      planId={selectedPlan.id}
      planTitle={selectedPlan.name}
      onGoLive={(itemId) => {
        const item = serviceItems.find(i => i.id === itemId);
        if (item && item.slides?.[0]) {
          sendSlideToLive(item.slides[currentSlideIndex]);
        }
      }}
      onClearLive={clearLiveDisplay}
    />
  </div>
)}
```

---

## 📦 Phase 6: Enhanced Plan Manager Tab (MEDIUM PRIORITY)

### 6.1 Add Search to Plan Manager

```typescript
import { PlanSearch } from '../components/plans/PlanSearch';

const [showPlanSearch, setShowPlanSearch] = useState(false);

// In Plan Manager tab
<div className="mb-4 flex items-center justify-between">
  <h3 className="text-lg font-semibold">Saved Plans</h3>
  <button
    onClick={() => setShowPlanSearch(!showPlanSearch)}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
  >
    {showPlanSearch ? 'Hide Search' : 'Search Plans'}
  </button>
</div>

{showPlanSearch && (
  <div className="mb-4">
    <PlanSearch
      onSearch={async (query) => {
        return await window.electronAPI?.invoke('db:searchPlans', query) || [];
      }}
      onSelectResult={async (result) => {
        const plan = await window.electronAPI?.invoke('db:getPlan', result.planId);
        if (plan) await handlePlanSelectWithLoading(plan);
      }}
    />
  </div>
)}
```

### 6.2 Add Template Quick Access

```typescript
import { TemplateLibrary } from '../components/plans/TemplateLibrary';

const [showTemplates, setShowTemplates] = useState(false);

// Quick action button
<button
  onClick={() => setShowTemplates(true)}
  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center gap-2"
>
  <Calendar className="w-4 h-4" />
  Use Template
</button>

{showTemplates && (
  <TemplateLibrary
    onSelect={async (template) => {
      const newPlan = await window.electronAPI?.invoke('db:createPlanFromTemplate', {
        templateId: template.id,
        serviceId: currentServiceId
      });
      if (newPlan) {
        await handlePlanSelectWithLoading(newPlan);
        setShowTemplates(false);
      }
    }}
    onClose={() => setShowTemplates(false)}
  />
)}
```

---

## 📦 Phase 7: Right Sidebar (Next Items + Checklist)

### 7.1 Add Resizable Panels

```typescript
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { NextItemPreview } from '../components/plans/NextItemPreview';
import { PreServiceChecklist } from '../components/plans/PreServiceChecklist';

// Wrap entire layout
<PanelGroup direction="horizontal">
  {/* Left sidebar - existing tabs */}
  <Panel defaultSize={25} minSize={20} maxSize={35}>
    {/* All tab content */}
  </Panel>

  <PanelResizeHandle className="w-2 bg-border hover:bg-primary transition-colors" />

  {/* Main content */}
  <Panel defaultSize={50} minSize={40}>
    {/* Preview, thumbnails, etc */}
  </Panel>

  <PanelResizeHandle className="w-2 bg-border hover:bg-primary transition-colors" />

  {/* Right sidebar - NEW */}
  <Panel defaultSize={25} minSize={20} maxSize={35}>
    <div className="h-full overflow-y-auto bg-background border-l border-border">
      {executionState.isExecuting ? (
        <>
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-blue-400" />
              Coming Up
            </h3>
          </div>
          <div className="p-4">
            <NextItemPreview
              previewCount={5}
              showCountdown={true}
              onJumpToItem={(itemId) => {
                const item = serviceItems.find(i => i.id === itemId);
                if (item) generateSlidesForItem(item);
              }}
            />
          </div>
        </>
      ) : selectedPlan ? (
        <>
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-400" />
              Pre-Service Checklist
            </h3>
          </div>
          <div className="p-4">
            <PreServiceChecklist
              planItems={selectedPlan.planItems || []}
              checklist={checklistItems}
              onChange={setChecklistItems}
            />
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          Select a plan to see details
        </div>
      )}
    </div>
  </Panel>
</PanelGroup>
```

---

## 🎯 Implementation Priority & Timeline

| Phase | Priority | Impact | Effort | Timeline |
|-------|----------|--------|--------|----------|
| **Phase 1: Tab States** | ⭐⭐⭐ HIGH | ⭐⭐ MEDIUM | Low (2-3h) | Day 1 AM |
| **Phase 2: Inline Media** | ⭐⭐⭐ HIGH | ⭐⭐⭐ HIGH | High (6-8h) | Day 1-2 |
| **Phase 3: Inline Edit** | ⭐⭐⭐ HIGH | ⭐⭐⭐ HIGH | Medium (4-5h) | Day 2-3 |
| **Phase 4: Add-Between** | ⭐⭐ MEDIUM | ⭐⭐ MEDIUM | Low (2-3h) | Day 3 |
| **Phase 5: Execution** | ⭐⭐ MEDIUM | ⭐⭐⭐ HIGH | Medium (4-5h) | Day 4-5 |
| **Phase 6: Enhanced Manager** | ⭐ LOW | ⭐⭐ MEDIUM | Medium (4-5h) | Day 6 |
| **Phase 7: Right Sidebar** | ⭐⭐ MEDIUM | ⭐⭐ MEDIUM | Medium (3-4h) | Day 5-6 |

**Total Estimated Time:** 25-33 hours (5-7 days)

---

## ✅ Testing Checklist

### Phase 1: Tab States
- [ ] Active tab clearly visible
- [ ] Hover states work
- [ ] Item count badge shows
- [ ] Animation smooth

### Phase 2: Inline Media
- [ ] Quick add buttons appear
- [ ] Modal opens correctly
- [ ] Song search works
- [ ] Scripture selector loads
- [ ] Items add at right position

### Phase 3: Inline Edit
- [ ] Edit button on hover
- [ ] Edit mode activates
- [ ] Changes save
- [ ] Cancel works
- [ ] Delete confirms

### Phase 4: Add-Between
- [ ] Buttons show between items
- [ ] Correct position tracked
- [ ] Items insert properly

### Phase 5: Execution
- [ ] Start begins tracking
- [ ] Timeline shows progress
- [ ] Controls work
- [ ] Time accurate

### Phase 6: Enhanced Manager
- [ ] Search finds plans
- [ ] Templates load
- [ ] Quick actions work

### Phase 7: Right Sidebar
- [ ] Preview shows next items
- [ ] Checklist generates
- [ ] Resizing works

---

## 📝 Success Criteria

**User Experience:**
- ✅ Users never leave plan tab to add content
- ✅ Active tab always obvious
- ✅ Inline editing is intuitive
- ✅ Service preparation 50% faster
- ✅ Zero navigation required for common tasks

**Technical:**
- ✅ All 12-phase components integrated
- ✅ No performance degradation
- ✅ Smooth animations (60fps)
- ✅ < 100ms interaction response
- ✅ State persists correctly

---

## 🚀 Quick Start Guide

### Step 1: Enhanced Tab States (2 hours)
- Update tab navigation styling
- Add active indicators
- Add item count badges

### Step 2: Inline Media Addition (8 hours)
- Create InlineMediaSelectors component
- Add quick add buttons
- Integrate with existing add functions

### Step 3: Inline Editing (5 hours)
- Add edit mode to service items
- Implement save/cancel
- Add delete confirmation

**After these 3 phases (15 hours), you'll have:**
- Clear navigation
- All media addition inline
- Full item management
- 80% of UX improvements complete

---

**This plan provides a complete roadmap for transforming the plan tab into an intuitive, professional service planning interface with all 12-phase components integrated!** 🎉
