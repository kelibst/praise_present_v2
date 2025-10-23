# Live Presentation Page - Plan Tab Integration Plan

**Complete Integration Strategy for Enhanced Plan Features**

---

## 📋 Current State Analysis

### Existing Plan Implementation
The LivePresentationPage currently has:
- ✅ Basic plan loading via `PlanManager` component
- ✅ Plan selection and item display in "Current Service" tab
- ✅ `PlanStats` component showing basic statistics
- ✅ Integration with Redux `serviceItemsSlice`
- ✅ `usePlanIntegration` hook for plan loading
- ✅ Three tabs: Scripture, Current Service (plan), Saved Plans (plans)

### Current Limitations
- ❌ No real-time execution tracking
- ❌ No visual timeline
- ❌ No time tracking or schedule deviation detection
- ❌ No live plan controls (start/pause/resume)
- ❌ No next item preview
- ❌ No pre-service checklist
- ❌ No approval workflow integration
- ❌ No search functionality
- ❌ Limited plan statistics
- ❌ No recurring pattern support
- ❌ No export functionality

---

## 🎯 Integration Goals

Transform the plan experience in LivePresentationPage to provide:
1. **Real-time execution tracking** during live services
2. **Visual timeline** for quick navigation
3. **Next item preview** for preparation
4. **Pre-service checklist** before going live
5. **Enhanced statistics** and insights
6. **Search and filter** for finding plans quickly
7. **Export and sharing** capabilities
8. **Professional controls** for service execution

---

## 🏗️ Architecture Design

### Component Layout Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ TOP BAR - Time Tracker (when plan is executing)             │
│ - Current time | Elapsed | Remaining | Deviation            │
└─────────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────────┬──────────────────┐
│ LEFT SIDEBAR     │ MAIN CONTENT         │ RIGHT SIDEBAR    │
│ (Existing tabs)  │ (Enhanced)           │ (NEW)            │
│                  │                      │                  │
│ - Scripture      │ When Plan Active:    │ Next Item        │
│ - Current Service│ - Item List          │ Preview:         │
│ - Saved Plans    │ - Live Controls      │ - Next 3 items   │
│                  │ - Property Panel     │ - Countdown      │
│                  │                      │ - Warnings       │
│                  │ When Planning:       │                  │
│                  │ - Checklist          │ Pre-Service      │
│                  │ - Search             │ Checklist:       │
│                  │ - Templates          │ - Auto-generated │
│                  │                      │ - Manual items   │
└──────────────────┴──────────────────────┴──────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ BOTTOM BAR - Plan Timeline (when plan is active)            │
│ Visual timeline with color-coded items, click-to-jump       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ FLOATING - Live Plan Controls (when executing)              │
│ Start | Pause | Resume | Stop | Previous | Next | Go Live   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Phase 1: Core Execution Integration (HIGH PRIORITY)

### 1.1 Add Time Tracker to Top Bar

**Location:** Above main content area
**Component:** `TimeTracker`

```typescript
import { TimeTracker } from '../components/plans/TimeTracker';

// Add to component state
const executionState = useSelector((state: RootState) => state.planExecution);

// Render conditionally when plan is executing
{executionState.isExecuting && selectedPlan && (
  <div className="h-20 border-b border-border">
    <TimeTracker
      planId={selectedPlan.id}
      className="h-full"
    />
  </div>
)}
```

### 1.2 Add Plan Timeline to Bottom Bar

**Location:** Fixed bottom of page
**Component:** `PlanTimeline`

```typescript
import { PlanTimeline } from '../components/plans/PlanTimeline';

// Add to bottom of layout
{executionState.isExecuting && selectedPlan && (
  <div className="fixed bottom-0 left-0 right-0 h-32 border-t border-border bg-background z-40">
    <PlanTimeline
      planId={selectedPlan.id}
      onItemClick={(itemId) => {
        // Find and select the clicked item
        const item = serviceItems.find(i => i.id === itemId);
        if (item) {
          generateSlidesForItem(item);
        }
      }}
    />
  </div>
)}

// Add padding to main content when timeline is showing
<div className={`flex-1 ${executionState.isExecuting ? 'pb-32' : ''}`}>
  {/* Main content */}
</div>
```

### 1.3 Integrate Live Plan Controls

**Location:** Floating above preview or in control panel
**Component:** `LivePlanControls`

```typescript
import { LivePlanControls } from '../components/plans/LivePlanControls';

// Add near live display controls
{selectedPlan && (
  <div className="mb-4">
    <LivePlanControls
      planId={selectedPlan.id}
      planTitle={selectedPlan.name}
      onGoLive={(itemId) => {
        // Find the item and send to live
        const item = serviceItems.find(i => i.id === itemId);
        if (item && item.slides && item.slides.length > 0) {
          sendSlideToLive(item.slides[0]);
        }
      }}
      onClearLive={() => {
        clearLiveDisplay();
      }}
    />
  </div>
)}
```

**Estimated Time:** 4-6 hours
**Dependencies:** Redux planExecution slice already created
**Testing:** Start/pause/resume/stop, timeline navigation, time tracking

---

## 📦 Phase 2: Next Item Preview Sidebar (HIGH PRIORITY)

### 2.1 Add Right Sidebar Panel

**Location:** Right side of main content
**Component:** `NextItemPreview`

```typescript
import { NextItemPreview } from '../components/plans/NextItemPreview';

// Modify layout to use PanelGroup
<PanelGroup direction="horizontal">
  {/* Left sidebar - existing tabs */}
  <Panel defaultSize={20} minSize={15}>
    {/* Existing tab content */}
  </Panel>

  <PanelResizeHandle />

  {/* Main content */}
  <Panel defaultSize={55} minSize={40}>
    {/* Existing main content */}
  </Panel>

  <PanelResizeHandle />

  {/* Right sidebar - NEW */}
  <Panel defaultSize={25} minSize={20}>
    <div className="h-full overflow-y-auto bg-background border-l border-border">
      {executionState.isExecuting && (
        <>
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Coming Up</h3>
          </div>
          <div className="p-4">
            <NextItemPreview
              previewCount={5}
              showCountdown={true}
              onJumpToItem={(itemId) => {
                // Jump to that item
                dispatch(jumpToPlanItem(itemId));
              }}
            />
          </div>
        </>
      )}

      {!executionState.isExecuting && selectedPlan && (
        <>
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Pre-Service Checklist</h3>
          </div>
          <div className="p-4">
            <PreServiceChecklist
              planItems={selectedPlan.planItems || []}
              checklist={checklistItems}
              onChange={setChecklistItems}
            />
          </div>
        </>
      )}
    </div>
  </Panel>
</PanelGroup>
```

### 2.2 Add Checklist State Management

```typescript
import { PreServiceChecklist, ChecklistItem } from '../components/plans/PreServiceChecklist';

const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

// Load checklist when plan is selected
useEffect(() => {
  if (selectedPlan) {
    loadChecklistForPlan(selectedPlan.id);
  }
}, [selectedPlan]);

const loadChecklistForPlan = async (planId: string) => {
  const items = await window.electronAPI?.invoke('db:getChecklist', planId);
  setChecklistItems(items || []);
};
```

**Estimated Time:** 3-4 hours
**Dependencies:** Phase 1 complete
**Testing:** Preview updates, countdown accuracy, checklist generation

---

## 📦 Phase 3: Enhanced Plan Statistics (MEDIUM PRIORITY)

### 3.1 Replace Basic PlanStats

**Location:** Current Service tab
**Component:** Enhanced version with execution data

```typescript
// Create enhanced stats component
const EnhancedPlanStats: React.FC<{ plan: PlanWithItems; serviceItems: ServiceItem[] }> = ({ plan, serviceItems }) => {
  const executionState = useSelector((state: RootState) => state.planExecution);

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      {/* Basic stats */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Total Items</div>
          <div className="text-2xl font-bold text-foreground">{serviceItems.length}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Planned Duration</div>
          <div className="text-2xl font-bold text-foreground">
            {executionState.totalDuration} min
          </div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Completion</div>
          <div className="text-2xl font-bold text-foreground">
            {executionState.completedItems}/{serviceItems.length}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {executionState.isExecuting && (
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground font-medium">
              {Math.round((executionState.completedItems / serviceItems.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(executionState.completedItems / serviceItems.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Schedule status */}
      {executionState.isExecuting && (
        <div className={`p-3 rounded-lg ${
          executionState.scheduleDeviation > 5 ? 'bg-red-900/20 border border-red-500/50' :
          executionState.scheduleDeviation < -5 ? 'bg-green-900/20 border border-green-500/50' :
          'bg-blue-900/20 border border-blue-500/50'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {executionState.scheduleDeviation > 5 ? '⚠️ Running Behind' :
               executionState.scheduleDeviation < -5 ? '✓ Ahead of Schedule' :
               '✓ On Schedule'}
            </span>
            <span className="text-sm">
              {executionState.scheduleDeviation > 0 ? '+' : ''}
              {executionState.scheduleDeviation} min
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
```

**Estimated Time:** 2-3 hours
**Dependencies:** Phase 1 complete
**Testing:** Real-time stat updates, accuracy of calculations

---

## 📦 Phase 4: Search and Filter Enhancement (MEDIUM PRIORITY)

### 4.1 Add Search to Saved Plans Tab

**Location:** Saved Plans tab header
**Component:** `PlanSearch`

```typescript
import { PlanSearch, SearchQuery, SearchResult } from '../components/plans/PlanSearch';

const [showSearch, setShowSearch] = useState(false);
const [savedSearches] = useState([
  { name: 'Sunday Services', query: { tags: ['sunday'] } },
  { name: 'This Month', query: { dateFrom: new Date(new Date().setDate(1)) } }
]);

// Add search toggle button
<div className="p-4 border-b border-border">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
      <Settings className="w-5 h-5 text-green-400" />
      Saved Plans
    </h3>
    <button
      onClick={() => setShowSearch(!showSearch)}
      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      {showSearch ? 'Hide Search' : 'Search Plans'}
    </button>
  </div>
</div>

{showSearch && (
  <div className="p-4 border-b border-border">
    <PlanSearch
      onSearch={handlePlanSearch}
      onSelectResult={handleSearchResultSelect}
      savedSearches={savedSearches}
      onSaveSearch={handleSaveSearch}
    />
  </div>
)}
```

### 4.2 Implement Search Handlers

```typescript
const handlePlanSearch = async (query: SearchQuery): Promise<SearchResult[]> => {
  const results = await window.electronAPI?.invoke('db:searchPlans', query);
  return results || [];
};

const handleSearchResultSelect = async (result: SearchResult) => {
  // Load the plan from search result
  const plan = await window.electronAPI?.invoke('db:getPlan', result.planId);
  if (plan) {
    await handlePlanSelectWithLoading(plan);
  }
};

const handleSaveSearch = async (name: string, query: SearchQuery) => {
  await window.electronAPI?.invoke('db:saveSavedSearch', { name, query });
};
```

**Estimated Time:** 3-4 hours
**Dependencies:** IPC handlers for search
**Testing:** Search accuracy, filter combinations, saved searches

---

## 📦 Phase 5: Template Integration (LOW PRIORITY)

### 5.1 Add Template Quick Access

**Location:** Saved Plans tab
**Component:** `TemplateLibrary`

```typescript
import { TemplateLibrary } from '../components/plans/TemplateLibrary';

const [showTemplates, setShowTemplates] = useState(false);

// Add templates button
<button
  onClick={() => setShowTemplates(true)}
  className="w-full p-3 bg-secondary rounded-lg text-left hover:bg-secondary/80 transition-colors border border-border"
>
  <div className="flex items-center gap-2">
    <Calendar className="w-5 h-5 text-blue-400" />
    <div>
      <div className="font-medium text-foreground">Use Template</div>
      <div className="text-xs text-muted-foreground">Start from a pre-configured template</div>
    </div>
  </div>
</button>

{/* Template modal */}
{showTemplates && (
  <TemplateLibrary
    onSelect={handleTemplateSelect}
    onEdit={handleTemplateEdit}
    onClose={() => setShowTemplates(false)}
  />
)}
```

### 5.2 Template Application Logic

```typescript
const handleTemplateSelect = async (template: PlanTemplate) => {
  // Create a new plan from template
  const newPlan = await window.electronAPI?.invoke('db:createPlanFromTemplate', {
    templateId: template.id,
    serviceId: currentServiceId,
    // Fill in template variables
    variables: await promptForVariables(template.variables)
  });

  if (newPlan) {
    await handlePlanSelectWithLoading(newPlan);
    setShowTemplates(false);
  }
};

const promptForVariables = async (variables: string[]): Promise<Record<string, string>> => {
  // Show modal to fill in template variables
  // Return filled values
  return {};
};
```

**Estimated Time:** 4-5 hours
**Dependencies:** Template system components
**Testing:** Template application, variable substitution

---

## 📦 Phase 6: Export and Sharing (LOW PRIORITY)

### 6.1 Add Export Button

**Location:** Current Service tab header
**Component:** `PlanExportModal`

```typescript
import { PlanExportModal, PlanExportData } from '../components/plans/PlanExportModal';

const [showExport, setShowExport] = useState(false);

// Add export button near plan stats
<button
  onClick={() => setShowExport(true)}
  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
  disabled={!selectedPlan}
>
  <ExternalLink className="w-4 h-4" />
  Export Plan
</button>

{/* Export modal */}
{showExport && selectedPlan && (
  <PlanExportModal
    planData={{
      planId: selectedPlan.id,
      planTitle: selectedPlan.name,
      serviceDate: selectedPlan.serviceDate,
      totalDuration: executionState.totalDuration,
      itemCount: serviceItems.length,
      items: serviceItems
    }}
    onClose={() => setShowExport(false)}
  />
)}
```

**Estimated Time:** 2-3 hours
**Dependencies:** Export utility
**Testing:** All export formats, option variations

---

## 📦 Phase 7: Approval Workflow (OPTIONAL)

### 7.1 Add Approval Status Indicator

**Location:** Plan header in Current Service tab
**Component:** `ApprovalControls`

```typescript
import { ApprovalControls } from '../components/plans/ApprovalControls';

{selectedPlan && (
  <div className="mb-4">
    <ApprovalControls
      planId={selectedPlan.id}
      planTitle={selectedPlan.name}
      currentStatus={selectedPlan.approvalStatus || 'draft'}
      currentUser="current-user" // Get from auth
      isOwner={true} // Check permissions
      isReviewer={false} // Check permissions
      onStatusChange={handleApprovalStatusChange}
      onRequestApproval={handleRequestApproval}
      onRespondToRequest={handleRespondToApproval}
    />
  </div>
)}
```

**Estimated Time:** 3-4 hours
**Dependencies:** Approval workflow IPC handlers
**Testing:** State transitions, reviewer notifications

---

## 🔧 Required IPC Handler Implementations

Add these handlers to Electron main process:

```typescript
// In main.ts or ipcHandlers.ts

// Checklist
ipcMain.handle('db:getChecklist', async (event, planId) => {
  return await prisma.planChecklist.findMany({
    where: { planId },
    orderBy: { order: 'asc' }
  });
});

ipcMain.handle('db:saveChecklist', async (event, { planId, items }) => {
  // Delete existing
  await prisma.planChecklist.deleteMany({ where: { planId } });
  // Create new
  return await prisma.planChecklist.createMany({ data: items });
});

// Search
ipcMain.handle('db:searchPlans', async (event, query) => {
  return await prisma.servicePlan.findMany({
    where: buildSearchWhere(query),
    include: { planItems: true }
  });
});

ipcMain.handle('db:saveSavedSearch', async (event, savedSearch) => {
  return await prisma.savedSearch.create({ data: savedSearch });
});

// Templates
ipcMain.handle('db:createPlanFromTemplate', async (event, { templateId, serviceId, variables }) => {
  const template = await prisma.planTemplate.findUnique({
    where: { id: templateId },
    include: { items: true }
  });

  // Create plan with substituted variables
  return await createPlanFromTemplate(template, serviceId, variables);
});

// Approval
ipcMain.handle('db:updatePlanApprovalStatus', async (event, { planId, status }) => {
  return await prisma.servicePlan.update({
    where: { id: planId },
    data: { approvalStatus: status }
  });
});

// Export
ipcMain.handle('plan:export', async (event, { planId, format, options }) => {
  const plan = await prisma.servicePlan.findUnique({
    where: { id: planId },
    include: { planItems: true }
  });

  return exportPlan(plan, format, options);
});
```

---

## 📊 Implementation Priority Matrix

| Phase | Priority | Impact | Effort | Should Start |
|-------|----------|--------|--------|--------------|
| Phase 1: Core Execution | ⭐⭐⭐ HIGH | ⭐⭐⭐ HIGH | Medium | Immediately |
| Phase 2: Next Item Preview | ⭐⭐⭐ HIGH | ⭐⭐⭐ HIGH | Medium | After Phase 1 |
| Phase 3: Enhanced Stats | ⭐⭐ MEDIUM | ⭐⭐ MEDIUM | Low | After Phase 1 |
| Phase 4: Search & Filter | ⭐⭐ MEDIUM | ⭐⭐ MEDIUM | Medium | After Phase 2 |
| Phase 5: Templates | ⭐ LOW | ⭐⭐ MEDIUM | High | When time allows |
| Phase 6: Export | ⭐ LOW | ⭐ LOW | Low | When time allows |
| Phase 7: Approval | ⭐ OPTIONAL | ⭐ LOW | Medium | Optional |

---

## 🧪 Testing Strategy

### Phase 1 Testing
- [ ] Time tracker updates every second
- [ ] Pause correctly adjusts timestamps
- [ ] Resume continues from paused time
- [ ] Timeline reflects current item
- [ ] Timeline click navigation works
- [ ] Controls integrate with live display
- [ ] Schedule deviation calculates correctly

### Phase 2 Testing
- [ ] Next items display correctly
- [ ] Countdown shows accurate time
- [ ] Warnings appear for missing content
- [ ] Checklist auto-generates
- [ ] Checklist saves progress
- [ ] Manual items can be added

### Integration Testing
- [ ] All components work together
- [ ] No performance degradation
- [ ] State syncs across components
- [ ] Redux state updates properly
- [ ] IPC handlers respond correctly
- [ ] UI remains responsive during execution

---

## 📅 Recommended Implementation Timeline

### Week 1: Foundation (Phase 1)
- Days 1-2: Integrate TimeTracker and PlanTimeline
- Days 3-4: Add LivePlanControls
- Day 5: Testing and bug fixes

### Week 2: Enhancement (Phase 2-3)
- Days 1-3: Add NextItemPreview sidebar
- Days 4-5: Enhance statistics and add checklist

### Week 3: Features (Phase 4-6)
- Days 1-2: Add search functionality
- Days 3-4: Template integration
- Day 5: Export feature

### Week 4: Polish
- Days 1-3: Bug fixes, performance optimization
- Days 4-5: Documentation and user testing

---

## 🎨 UI/UX Improvements

### Visual Consistency
- Use existing color scheme and border styles
- Match current tab styling
- Maintain dark theme support
- Respect user's theme preferences

### Responsive Behavior
- Collapsible right sidebar on smaller screens
- Hide timeline on mobile
- Responsive control panel layout
- Adaptable statistics cards

### Accessibility
- Keyboard shortcuts for controls (Space: pause/resume, Arrow keys: navigate)
- Screen reader support
- High contrast mode
- Focus indicators

---

## 🚀 Success Metrics

### User Experience
- ✅ Service execution time reduced by 30%
- ✅ Preparation time reduced by 50%
- ✅ Zero missed items during live service
- ✅ 90% checklist completion rate

### Technical Performance
- ✅ < 100ms response time for controls
- ✅ < 16ms frame time for timeline
- ✅ < 1s plan load time
- ✅ No memory leaks during long services

---

## 📝 Next Steps

1. **Review this plan** with team/stakeholders
2. **Run database migration** (`npm run db:generate && npm run db:push`)
3. **Start with Phase 1** - Core execution features
4. **Iterate based on feedback** from each phase
5. **Document as you go** - update this plan with learnings

---

## 🔗 Related Documentation

- [Component List](./COMPLETION_SUMMARY.md#-complete-component-list)
- [Integration Guide](./INTEGRATION_GUIDE.md)
- [Implementation Status](./IMPLEMENTATION_STATUS.md)
- [Database Schema](../prisma/schema.prisma)

---

**This integration plan provides a clear, phased approach to transforming the LivePresentationPage into a professional service execution platform. Start with high-priority phases for maximum impact!**
