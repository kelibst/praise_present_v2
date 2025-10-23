# Quick Integration Checklist - LivePresentationPage

**Fast-track guide for integrating enhanced plan features**

---

## ✅ Pre-Integration Checklist

- [ ] Database migration completed (`npm run db:generate && npm run db:push`)
- [ ] All 27 components are in place
- [ ] Redux store includes `planExecution` reducer
- [ ] Review [LIVE_PRESENTATION_INTEGRATION_PLAN.md](./LIVE_PRESENTATION_INTEGRATION_PLAN.md)

---

## 🚀 Phase 1: Core Execution (START HERE)

### Step 1: Add Imports (5 min)

```typescript
// Add to imports section of LivePresentationPage.tsx
import { TimeTracker } from '../components/plans/TimeTracker';
import { PlanTimeline } from '../components/plans/PlanTimeline';
import { LivePlanControls } from '../components/plans/LivePlanControls';
import {
  startPlanExecution,
  pausePlanExecution,
  resumePlanExecution,
  stopPlanExecution,
  nextPlanItem,
  previousPlanItem
} from '../lib/planExecutionSlice';
```

**Testing:** ✅ No import errors

---

### Step 2: Add Redux State Selector (2 min)

```typescript
// Add after existing Redux hooks (around line 124)
const executionState = useSelector((state: RootState) => state.planExecution);
```

**Testing:** ✅ executionState is defined

---

### Step 3: Add TimeTracker Component (10 min)

**Location:** Before main content area, around line 1450

```typescript
{/* Time Tracker - Shows when plan is executing */}
{executionState.isExecuting && selectedPlan && (
  <div className="h-20 border-b border-border bg-background">
    <TimeTracker
      planId={selectedPlan.id}
      className="h-full"
    />
  </div>
)}
```

**Testing:**
- [ ] TimeTracker appears when plan starts
- [ ] Shows elapsed/remaining time
- [ ] Updates every second

---

### Step 4: Add PlanTimeline Component (15 min)

**Location:** Bottom of main layout, before closing divs

```typescript
{/* Plan Timeline - Fixed bottom bar */}
{executionState.isExecuting && selectedPlan && (
  <div className="fixed bottom-0 left-0 right-0 h-32 border-t border-border bg-background z-40">
    <PlanTimeline
      planId={selectedPlan.id}
      onItemClick={(itemId) => {
        const item = serviceItems.find(i => i.id === itemId);
        if (item) {
          generateSlidesForItem(item);
          dispatch(jumpToPlanItem(itemId));
        }
      }}
      className="h-full"
    />
  </div>
)}

{/* Add padding to main content when timeline shows */}
<div className={`flex-1 flex flex-col overflow-hidden ${
  executionState.isExecuting ? 'pb-32' : ''
}`}>
  {/* Existing main content */}
</div>
```

**Testing:**
- [ ] Timeline appears at bottom when executing
- [ ] Shows all items with correct colors
- [ ] Click-to-jump works
- [ ] Auto-scrolls to current item
- [ ] Main content has bottom padding

---

### Step 5: Add LivePlanControls (20 min)

**Location:** In Current Service tab, near service items list

```typescript
{/* Live Plan Controls */}
{selectedPlan && (
  <div className="mb-4 sticky top-0 z-10 bg-background">
    <LivePlanControls
      planId={selectedPlan.id}
      planTitle={selectedPlan.name}
      onGoLive={(itemId) => {
        const item = serviceItems.find(i => i.id === itemId);
        if (item && item.slides && item.slides.length > 0) {
          sendSlideToLive(item.slides[currentSlideIndex]);
        }
      }}
      onClearLive={() => {
        clearLiveDisplay();
      }}
      className="bg-background"
    />
  </div>
)}
```

**Testing:**
- [ ] Start button begins execution
- [ ] Pause/Resume work correctly
- [ ] Stop ends execution
- [ ] Next/Previous navigate items
- [ ] Go Live sends current slide
- [ ] Clear removes live display

---

### Step 6: Test Complete Integration (30 min)

**Full Workflow Test:**
1. [ ] Select a plan from Saved Plans
2. [ ] Items load into Current Service
3. [ ] Click Start Plan
4. [ ] TimeTracker appears and starts
5. [ ] Timeline appears at bottom
6. [ ] Click Pause - timer stops
7. [ ] Click Resume - timer continues
8. [ ] Click Next - moves to next item
9. [ ] Timeline updates current item
10. [ ] Click item in timeline - jumps to that item
11. [ ] Click Go Live - sends to display
12. [ ] Click Stop - execution ends
13. [ ] Timeline and TimeTracker disappear

**Phase 1 Complete!** ✅ Core execution working

---

## 🚀 Phase 2: Next Item Preview (RECOMMENDED)

### Step 1: Install Resizable Panels (if not already)

```bash
npm install react-resizable-panels
```

---

### Step 2: Add Imports (2 min)

```typescript
import { NextItemPreview } from '../components/plans/NextItemPreview';
import { PreServiceChecklist, ChecklistItem } from '../components/plans/PreServiceChecklist';
```

---

### Step 3: Add Checklist State (5 min)

```typescript
// Add to state declarations (around line 163)
const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

// Add effect to load checklist when plan selected
useEffect(() => {
  if (selectedPlan) {
    loadChecklistForPlan(selectedPlan.id);
  }
}, [selectedPlan]);

const loadChecklistForPlan = async (planId: string) => {
  try {
    const items = await window.electronAPI?.invoke('db:getChecklist', planId);
    setChecklistItems(items || []);
  } catch (error) {
    console.error('Error loading checklist:', error);
  }
};
```

---

### Step 4: Modify Layout to Add Right Sidebar (30 min)

**Find the main content PanelGroup** (around line 1400) and modify:

```typescript
<PanelGroup direction="horizontal">
  {/* LEFT SIDEBAR - Existing tabs */}
  <Panel defaultSize={20} minSize={15} maxSize={30}>
    {/* All existing tab content (Scripture, Current Service, Saved Plans) */}
  </Panel>

  <PanelResizeHandle className="w-2 bg-border hover:bg-primary transition-colors" />

  {/* MAIN CONTENT - Existing preview and slides */}
  <Panel defaultSize={55} minSize={40}>
    {/* All existing main content (preview, thumbnails, etc.) */}
  </Panel>

  <PanelResizeHandle className="w-2 bg-border hover:bg-primary transition-colors" />

  {/* RIGHT SIDEBAR - NEW */}
  <Panel defaultSize={25} minSize={20} maxSize={35}>
    <div className="h-full overflow-y-auto bg-background border-l border-border">
      {/* When executing - show next items */}
      {executionState.isExecuting && (
        <>
          <div className="p-4 border-b border-border bg-card">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-blue-400" />
              Coming Up
            </h3>
          </div>
          <div className="p-4">
            <NextItemPreview
              previewCount={5}
              showCountdown={true}
              onJumpToItem={(itemId) => {
                const itemIndex = serviceItems.findIndex(i => i.id === itemId);
                if (itemIndex !== -1) {
                  dispatch(jumpToPlanItem(itemIndex));
                  generateSlidesForItem(serviceItems[itemIndex]);
                }
              }}
            />
          </div>
        </>
      )}

      {/* When planning - show checklist */}
      {!executionState.isExecuting && selectedPlan && (
        <>
          <div className="p-4 border-b border-border bg-card">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-400" />
              Pre-Service Checklist
            </h3>
          </div>
          <div className="p-4">
            <PreServiceChecklist
              planItems={selectedPlan.planItems || []}
              checklist={checklistItems}
              onChange={async (newChecklist) => {
                setChecklistItems(newChecklist);
                // Save to database
                await window.electronAPI?.invoke('db:saveChecklist', {
                  planId: selectedPlan.id,
                  items: newChecklist
                });
              }}
            />
          </div>
        </>
      )}

      {/* When no plan - show helpful message */}
      {!selectedPlan && (
        <div className="p-8 text-center text-muted-foreground">
          <p className="mb-2">Select a plan to see details</p>
          <ChevronLeft className="w-12 h-12 mx-auto opacity-50" />
        </div>
      )}
    </div>
  </Panel>
</PanelGroup>
```

---

### Step 5: Test Right Sidebar (20 min)

**Testing:**
- [ ] Right sidebar appears
- [ ] Resizable handles work
- [ ] When executing: NextItemPreview shows
- [ ] Countdown is accurate
- [ ] When not executing: Checklist shows
- [ ] Checklist auto-generates from plan
- [ ] Manual items can be added
- [ ] Checklist saves to database
- [ ] Jump to item from preview works

**Phase 2 Complete!** ✅ Next item preview and checklist working

---

## 🎨 Phase 3: Enhanced Statistics (OPTIONAL)

### Quick Stats Upgrade (15 min)

Replace existing `<PlanStats>` component with:

```typescript
{selectedPlan && (
  <div className="bg-card rounded-lg border border-border p-4 space-y-4">
    {/* Basic stats */}
    <div className="grid grid-cols-3 gap-4">
      <div>
        <div className="text-sm text-muted-foreground">Total Items</div>
        <div className="text-2xl font-bold text-foreground">{serviceItems.length}</div>
      </div>
      <div>
        <div className="text-sm text-muted-foreground">Duration</div>
        <div className="text-2xl font-bold text-foreground">
          {executionState.totalDuration || selectedPlan.estimatedDuration || 0} min
        </div>
      </div>
      <div>
        <div className="text-sm text-muted-foreground">Status</div>
        <div className="text-2xl font-bold text-foreground">
          {executionState.isExecuting ? '▶️ Live' : '📋 Ready'}
        </div>
      </div>
    </div>

    {/* Progress bar when executing */}
    {executionState.isExecuting && (
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-foreground font-medium">
            {executionState.currentItemIndex + 1}/{serviceItems.length}
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: `${((executionState.currentItemIndex + 1) / serviceItems.length) * 100}%`
            }}
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
            {Math.round(executionState.scheduleDeviation)} min
          </span>
        </div>
      </div>
    )}
  </div>
)}
```

---

## 🔍 Phase 4: Search (OPTIONAL)

### Add Search Toggle (10 min)

In Saved Plans tab header:

```typescript
const [showSearch, setShowSearch] = useState(false);

// In Saved Plans tab header
<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-semibold">Saved Plans</h3>
  <button
    onClick={() => setShowSearch(!showSearch)}
    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
  >
    {showSearch ? 'Hide' : 'Search'}
  </button>
</div>

{showSearch && (
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

---

## 🧪 Final Testing Checklist

### Core Functionality
- [ ] Plan selection loads items
- [ ] Start begins execution
- [ ] Pause/Resume work correctly
- [ ] Timeline shows all items
- [ ] Time tracker updates in real-time
- [ ] Next item preview accurate
- [ ] Checklist generates from plan
- [ ] Live display integration works

### Edge Cases
- [ ] No plan selected - no errors
- [ ] Empty plan - handles gracefully
- [ ] Long service (2+ hours) - no performance issues
- [ ] Rapid next/previous - smooth navigation
- [ ] Browser refresh during execution - state persists

### Performance
- [ ] < 100ms control response time
- [ ] Timeline renders smoothly
- [ ] No memory leaks after long use
- [ ] Responsive UI throughout

---

## 📊 Success Indicators

You'll know integration is successful when:

✅ **Service operators can:**
- Start a plan and see real-time progress
- Know exactly what's next with countdown
- Navigate quickly using visual timeline
- Stay on schedule with deviation alerts
- Complete pre-service checklist

✅ **Technical metrics show:**
- All components render without errors
- Redux state updates correctly
- Live display syncs with plan
- No console errors or warnings
- Smooth 60fps animations

---

## 🆘 Troubleshooting

### TimeTracker not showing
- Check `executionState.isExecuting` is true
- Verify `selectedPlan` is not null
- Ensure Redux selector is correct

### Timeline not updating
- Check `planExecution` reducer in store
- Verify plan items have IDs
- Check console for errors

### Checklist not generating
- Verify `planItems` array passed correctly
- Check IPC handler exists
- Look for database errors

### Right sidebar not appearing
- Check Panel imports from react-resizable-panels
- Verify PanelGroup wraps correctly
- Check for CSS conflicts

---

## 📚 Additional Resources

- [Full Integration Plan](./LIVE_PRESENTATION_INTEGRATION_PLAN.md) - Detailed guide
- [Integration Guide](./INTEGRATION_GUIDE.md) - General integration
- [Component Docs](./COMPLETION_SUMMARY.md) - All components
- [IPC Handlers](./INTEGRATION_GUIDE.md#required-ipc-handler-implementations) - Backend setup

---

**Start with Phase 1, test thoroughly, then add Phase 2. You'll have a professional execution system in a few hours!** 🚀
