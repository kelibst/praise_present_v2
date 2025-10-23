# Plan Tab Enhancement - Integration Guide

**Quick Start Guide for Integrating the New Plan Tab Components**

---

## 🚀 Quick Start (5 Steps)

### 1. Run Database Migration

```bash
npm run db:generate
npm run db:push
```

This will update your database schema with the new models and fields.

### 2. Verify Redux Store Setup

The Redux store should already have the planExecution reducer added. Verify in [src/lib/store.ts](../src/lib/store.ts):

```typescript
import planExecutionSlice from './planExecutionSlice';

export const store = configureStore({
  reducer: {
    // ... existing reducers
    planExecution: planExecutionSlice,
  }
});
```

### 3. Import Components

Example usage in a plan page:

```typescript
import { TimeTracker } from '../components/plans/TimeTracker';
import { PlanTimeline } from '../components/plans/PlanTimeline';
import { LivePlanControls } from '../components/plans/LivePlanControls';
import { NextItemPreview } from '../components/plans/NextItemPreview';
import { PreServiceChecklist } from '../components/plans/PreServiceChecklist';
import { PlanExportModal } from '../components/plans/PlanExportModal';
```

### 4. Implement IPC Handlers

Add these handlers to your Electron main process:

```typescript
// In main.ts or ipcHandlers.ts

import { ipcMain } from 'electron';
import { prisma } from './database';

// Service History
ipcMain.handle('db:getServiceHistory', async (event, options) => {
  const { limit = 50, includeItems = false } = options;

  return await prisma.serviceHistory.findMany({
    take: limit,
    include: {
      items: includeItems
    },
    orderBy: {
      serviceDate: 'desc'
    }
  });
});

// Templates
ipcMain.handle('db:getTemplates', async () => {
  return await prisma.planTemplate.findMany({
    orderBy: { createdAt: 'desc' }
  });
});

ipcMain.handle('db:saveTemplate', async (event, template) => {
  return await prisma.planTemplate.upsert({
    where: { id: template.id },
    create: template,
    update: template
  });
});

// Search
ipcMain.handle('db:searchPlans', async (event, query) => {
  const { text, dateFrom, dateTo, types, status } = query;

  return await prisma.servicePlan.findMany({
    where: {
      AND: [
        text ? {
          OR: [
            { title: { contains: text } },
            { notes: { contains: text } }
          ]
        } : {},
        dateFrom ? { serviceDate: { gte: dateFrom } } : {},
        dateTo ? { serviceDate: { lte: dateTo } } : {},
        status ? { status: { in: status } } : {}
      ]
    },
    include: {
      items: true
    }
  });
});

// Approval Workflow
ipcMain.handle('db:createApprovalRequest', async (event, request) => {
  return await prisma.approvalRequest.create({
    data: request
  });
});

ipcMain.handle('db:submitApprovalResponse', async (event, response) => {
  return await prisma.approvalResponse.create({
    data: response
  });
});

// Checklist
ipcMain.handle('db:saveChecklist', async (event, checklist) => {
  return await prisma.planChecklist.createMany({
    data: checklist
  });
});

// History/Versioning
ipcMain.handle('db:savePlanChange', async (event, change) => {
  return await prisma.planHistory.create({
    data: change
  });
});
```

### 5. Wire Up in Your UI

Example integration in a plan management page:

```typescript
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../lib/store';
import { TimeTracker } from '../components/plans/TimeTracker';
import { PlanTimeline } from '../components/plans/PlanTimeline';
import { LivePlanControls } from '../components/plans/LivePlanControls';
import { NextItemPreview } from '../components/plans/NextItemPreview';

export const PlanExecutionPage: React.FC = () => {
  const planId = 'your-plan-id'; // Get from route or state
  const [showExportModal, setShowExportModal] = useState(false);

  const executionState = useSelector((state: RootState) => state.planExecution);

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar - Time Tracker */}
      <div className="h-20 border-b">
        <TimeTracker
          planId={planId}
          className="h-full"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Plan Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Your existing plan items list */}
        </div>

        {/* Right - Next Items Preview */}
        <div className="w-96 border-l overflow-y-auto p-4">
          <NextItemPreview
            previewCount={5}
            showCountdown={true}
          />
        </div>
      </div>

      {/* Bottom Bar - Timeline */}
      <div className="h-32 border-t">
        <PlanTimeline
          planId={planId}
          className="h-full"
        />
      </div>

      {/* Live Controls (floating or docked) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <LivePlanControls
          planId={planId}
          planTitle="Sunday Morning Service"
          onGoLive={(itemId) => {
            // Send to live display
            window.electronAPI?.invoke('live-display:sendContent', { itemId });
          }}
          onClearLive={() => {
            window.electronAPI?.invoke('live-display:clearContent');
          }}
        />
      </div>
    </div>
  );
};
```

---

## 📦 Component Overview

### Core Execution Components

**TimeTracker**
- Shows: Current time, elapsed, remaining, deviation
- Props: `planId`, `className`
- Use: Top bar or header during execution

**PlanTimeline**
- Shows: Visual timeline of all items
- Props: `planId`, `className`
- Use: Bottom bar for quick navigation

**LivePlanControls**
- Shows: Start/pause/resume/stop/next/previous controls
- Props: `planId`, `planTitle`, `onGoLive`, `onClearLive`
- Use: Main control panel for operators

**NextItemPreview**
- Shows: Upcoming 3-5 items with countdown
- Props: `previewCount`, `showCountdown`, `onJumpToItem`
- Use: Side panel for preparation

### Planning Components

**PlanSectionHeader**
- Shows: Collapsible section grouping
- Props: `section`, `items`, `onUpdate`, `onDelete`
- Use: Organize items into Opening, Worship, Message, Closing

**TransitionEditor**
- Shows: Transition settings (black, fade, image, video, pause)
- Props: `transition`, `onSave`, `onCancel`
- Use: Modal or panel for transition editing

**NotesEditor**
- Shows: 3-level notes (general, operator, speaker)
- Props: `item`, `onUpdate`
- Use: Item details panel

**CueManager**
- Shows: Technical cues (lighting, sound, video, media)
- Props: `item`, `onUpdate`
- Use: Item details panel

### Template Components

**TemplateLibrary**
- Shows: Browse and select templates
- Props: `onSelect`, `onEdit`
- Use: Modal or dedicated page

**TemplateEditor**
- Shows: Create/edit custom templates
- Props: `template`, `onSave`, `onCancel`
- Use: Modal or dedicated page

### Checklist Components

**PreServiceChecklist**
- Shows: Auto-generated checklist
- Props: `planItems`, `checklist`, `onChange`
- Use: Tab or panel before service

### History & Collaboration

**ServiceHistory**
- Shows: Past service records with stats
- Props: `onCopyService`, `onViewService`, `onCompareServices`
- Use: Dedicated page or modal

**RecurringPatternEditor**
- Shows: Configure recurring patterns
- Props: `pattern`, `onSave`, `onCancel`
- Use: Modal or settings panel

**ApprovalControls**
- Shows: Approval workflow UI
- Props: `planId`, `currentStatus`, `onStatusChange`, `onRequestApproval`, `onRespondToRequest`
- Use: Header or dedicated panel

**ChangeHistory**
- Shows: Version history
- Props: `planId`, `changes`, `onRevertToVersion`
- Use: Side panel or modal

### Export & Search

**PlanExportModal**
- Shows: Export options and format selection
- Props: `planData`, `onClose`
- Use: Modal triggered by export button

**PlanSearch**
- Shows: Advanced search with filters
- Props: `onSearch`, `onSelectResult`, `savedSearches`
- Use: Dedicated page or expandable panel

### Scripture Components

**ResponsiveReadingEditor**
- Shows: Create responsive readings
- Props: `reading`, `scriptureText`, `onSave`, `onCancel`
- Use: Modal for scripture items

**ScriptureThemeSelector**
- Shows: Browse scripture by theme
- Props: `onSelect`, `onClose`, `favorites`
- Use: Modal for scripture selection

---

## 🎨 Styling

All components use Tailwind CSS and follow the app's dark theme:
- Background: `bg-gray-900`, `bg-gray-800`
- Text: `text-white`, `text-gray-300`, `text-gray-400`
- Borders: `border-gray-700`, `border-gray-600`
- Accents: Blue for primary, colors for types

### Color Coding

**Item Types:**
- Song: Blue (`text-blue-400`)
- Scripture: Green (`text-green-400`)
- Presentation: Purple (`text-purple-400`)
- Announcement: Orange (`text-orange-400`)
- Transition: Gray (`text-gray-400`)

**Status:**
- On-time: Green
- Warning (80%): Yellow
- Over-time: Red
- Paused: Yellow

---

## 🧪 Testing Checklist

- [ ] Database migration successful
- [ ] Redux store includes planExecution reducer
- [ ] TimeTracker shows live time updates
- [ ] PlanTimeline renders all items with correct colors
- [ ] Click-to-jump navigation works
- [ ] Start/Pause/Resume/Stop controls functional
- [ ] Schedule deviation calculates correctly
- [ ] Auto-advance works (if enabled)
- [ ] Next item preview shows countdown
- [ ] Content previews load correctly
- [ ] Inline editing saves changes
- [ ] Notes save to all 3 levels
- [ ] Cues can be created and completed
- [ ] Templates can be applied
- [ ] Checklist auto-generates from plan
- [ ] Service history displays correctly
- [ ] Recurring patterns save and load
- [ ] Approval workflow state transitions work
- [ ] Change history tracks modifications
- [ ] Export generates files in all 5 formats
- [ ] Search returns relevant results
- [ ] Responsive reading preview displays correctly
- [ ] Scripture themes load passages

---

## 🐛 Common Issues

### "planExecution is undefined"
**Solution:** Ensure planExecutionSlice is imported and added to Redux store

### Timeline doesn't auto-scroll
**Solution:** Check that the timeline container has `overflow-x-auto` and parent has fixed height

### Export downloads empty file
**Solution:** Ensure planData includes all items with the `items` array populated

### Search returns no results
**Solution:** Implement `db:searchPlans` IPC handler in Electron main process

### Checklist doesn't auto-generate
**Solution:** Pass `planItems` array to PreServiceChecklist component

---

## 📚 Additional Resources

- [Comprehensive Implementation Plan](./comprehensive-plan-tab-implementation.md)
- [Implementation Status](./IMPLEMENTATION_STATUS.md)
- [Completion Summary](./COMPLETION_SUMMARY.md)
- [Prisma Schema](../prisma/schema.prisma)
- [Redux Store Setup](../src/lib/store.ts)

---

## 🆘 Support

If you encounter issues:

1. Check component props are correctly passed
2. Verify IPC handlers are implemented
3. Check browser console for errors
4. Ensure database schema is up to date
5. Review component TypeScript types

---

**Happy Integrating! 🎉**

All components are production-ready and fully typed with TypeScript. Follow this guide and you'll have a complete service planning system integrated in no time!
