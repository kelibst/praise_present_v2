# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PraisePresent is an Electron-based presentation application for church services, built with React, TypeScript, and Prisma. It manages songs, scripture, media, and live presentations with support for multiple displays.

**Current Status: Complete Rebuild in Progress**
The project is being rebuilt from the ground up with a PowerPoint-style rendering architecture to address performance and reliability issues in the previous implementation.

## New Rendering Architecture

The new system is based on Microsoft PowerPoint's proven rendering approach:

### Core Principles
- **Shape-Based Content Model**: Everything is a shape (text, images, backgrounds)
- **Template System**: Slide masters define consistent layouts for different content types
- **Multi-Display Pipeline**: Separate rendering contexts for operator and live displays
- **Hardware-Accelerated Rendering**: Canvas/WebGL for smooth performance
- **Pre-rendering & Caching**: Background preparation for seamless live presentation

### Implementation Phases
1. **Foundation** - Core rendering engine and shape system
2. **Templates** - Slide masters for songs, scripture, announcements
3. **Live Display** - Multi-window presentation system
4. **Content Management** - Database integration with Prisma models
5. **Performance** - Optimization, caching, and effects

## Development Commands

**Start the application:**
```bash
npm start  # or "electron-forge start"
```

**Database operations:**
```bash
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema changes to database
npm run db:studio     # Open Prisma Studio
npm run db:setup      # Setup database with initial data
npm run db:seed-songs # Seed songs data
npm run db:seed-hymnals # Seed hymnal data
```

**Testing and Quality:**
```bash
npm test              # Run Jest tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint          # Run ESLint
```

**Building and Packaging:**
```bash
npm run package       # Package the application
npm run make          # Create distributables
```

## Architecture Overview

### Core Technologies
- **Frontend:** React 18, TypeScript, Redux Toolkit, React Router
- **Backend:** Electron main process, Prisma ORM
- **Database:** SQLite with comprehensive schema for songs, scripture, media, presentations
- **Styling:** Tailwind CSS with custom components
- **UI Components:** Radix UI, custom UI library in `src/components/ui/`

### Key Architectural Components

**Main Process (`src/main.ts`):**
- Electron main process handling window management, database connections, and IPC
- Multi-window support for main app and live display

**Database Layer (`src/database/`):**
- Prisma schema with models for Songs, Scripture (Books, Verses, Translations), Media, Presentations, Services
- SQLite database with comprehensive relationships
- Mock and JSON data adapters for development

**State Management:**
- Redux Toolkit store in `src/lib/store`
- Centralized state for songs, presentations, live display, settings


**Component Structure:**
- `src/components/`: Organized by feature (bible, songs, slides, settings, LiveDisplay)
- `src/components/ui/`: Reusable UI components
- `src/pages/`: Route-based page components
- `src/services/`: Business logic and API services

### Database Schema Highlights

The Prisma schema includes comprehensive models for:
- **Scripture Management:** Translations, Versions, Books, Verses with full hierarchical relationships
- **Song Management:** Songs with lyrics, chords, metadata, and usage tracking
- **Media Management:** Images, videos, audio with categorization and metadata
- **Presentation System:** Templates, slides, backgrounds with flexible content structure
- **Service Planning:** Services, service items with scheduling and organization

### Development Patterns

**Component Organization:**
- Feature-based folder structure in components/
- Separation of presentation logic and business logic
- Use of custom hooks in `src/hooks/`

**State Management:**
- Redux slices for different feature areas
- Async thunks for database operations
- Type-safe state with TypeScript

**Electron Integration:**
- IPC communication between main and renderer processes
- Preload script for secure API exposure (`src/preload.ts`)
- Multi-window architecture for main app and live displays

### Key Files to Understand

- `src/routes.tsx`: Application routing structure
- `src/lib/store.ts`: Redux store configuration
- `prisma/schema.prisma`: Complete database schema
- `src/rendering/`: New PowerPoint-style rendering engine
- `src/rendering/core/`: Shape system and canvas rendering
- `src/rendering/templates/`: Slide master templates
- `src/services/DisplayManager.tsx`: Multi-display management service
- `plan/`: Implementation roadmap and architecture documentation
- `.cursor/rules/pprules.mdc`: Development guidelines and preferences

### New Architecture Components

**Rendering Engine (`src/rendering/`)**:
- `core/RenderingEngine.tsx`: Main rendering pipeline
- `core/Shape.tsx`: Base shape class and implementations
- `core/Canvas.tsx`: Hardware-accelerated canvas renderer
- `templates/SlideTemplate.tsx`: Template system foundation
- `templates/SongTemplate.tsx`: Song slide layouts
- `templates/ScriptureTemplate.tsx`: Bible verse layouts
- `cache/SlideCache.tsx`: Pre-rendering and caching system

### Testing Setup

- Jest with React Testing Library
- TypeScript support with ts-jest
- Setup file: `src/setupTests.ts`
- Test environment: jsdom for React components

### Live Display Integration Pattern

**Working Implementation Reference**: `src/components/RenderingTestSuite.tsx` has a fully functional live display system that should be used as the standard pattern for all test components and content management interfaces.

**State Management Pattern:**
```typescript
const [liveDisplayActive, setLiveDisplayActive] = useState(false);
const [liveDisplayStatus, setLiveDisplayStatus] = useState('Disconnected');
```

**Core Functions for Live Display Control:**
```typescript
// Create live display window
const createLiveDisplay = async () => {
  const result = await window.electronAPI?.invoke('live-display:create', {});
  if (result?.success) {
    setLiveDisplayActive(true);
    setLiveDisplayStatus('Active');
  }
};

// Close live display window
const closeLiveDisplay = async () => {
  await window.electronAPI?.invoke('live-display:close');
  setLiveDisplayActive(false);
  setLiveDisplayStatus('Disconnected');
};

// Send content to live display
const sendContentToLive = async (content) => {
  if (!liveDisplayActive) return;
  await window.electronAPI?.invoke('live-display:sendContent', content);
};

// Clear live display content
const clearLiveDisplay = async () => {
  if (!liveDisplayActive) return;
  await window.electronAPI?.invoke('live-display:clearContent');
};

// Show black screen
const showBlackScreen = async () => {
  if (!liveDisplayActive) return;
  await window.electronAPI?.invoke('live-display:showBlack');
};

// Check status on mount
useEffect(() => {
  const checkStatus = async () => {
    const status = await window.electronAPI?.invoke('live-display:getStatus');
    if (status?.hasWindow && status?.isVisible) {
      setLiveDisplayActive(true);
      setLiveDisplayStatus('Active');
    }
  };
  if (window.electronAPI) checkStatus();
}, []);
```

**Standard UI Pattern:**
```tsx
{window.electronAPI && (
  <div className="mb-4 p-3 bg-gray-800 rounded-lg">
    <div className="flex flex-wrap gap-2 items-center justify-center">
      <div className="text-sm text-gray-400 mr-4">
        Live Display: <span className={
          liveDisplayStatus === 'Active' ? 'text-green-400' :
          liveDisplayStatus === 'Error' ? 'text-red-400' : 'text-yellow-400'
        }>{liveDisplayStatus}</span>
      </div>
      <div className="flex gap-2">
        {!liveDisplayActive ? (
          <button onClick={createLiveDisplay} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            Create Live Display
          </button>
        ) : (
          <>
            <button onClick={sendContentToLive} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Send to Live</button>
            <button onClick={clearLiveDisplay} className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">Clear Live</button>
            <button onClick={showBlackScreen} className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600">Black Screen</button>
            <button onClick={closeLiveDisplay} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Close Live</button>
          </>
        )}
      </div>
    </div>
  </div>
)}
```

**Content Structure for Live Display:**
The content sent to live display should follow this pattern:
```typescript
const content = {
  type: 'content-type', // e.g., 'rendering-test', 'song', 'scripture', 'announcement'
  title: 'Display Title',
  content: {
    // Specific content based on type
  }
};
```

**Implementation Requirements:**
1. Always check for `window.electronAPI` availability before showing live display controls
2. Implement status checking on component mount to detect existing live displays
3. Handle all async operations with proper error handling
4. Use consistent UI styling and state management patterns
5. Provide clear status feedback to users (Active/Disconnected/Error)

**IPC Commands Available:**
- `live-display:create` - Create new live display window
- `live-display:close` - Close live display window
- `live-display:sendContent` - Send content to display
- `live-display:clearContent` - Clear current content
- `live-display:showBlack` - Show black screen
- `live-display:getStatus` - Get current display status

### Memory
Add ACTIVITIES.md file if does not exist already. if it is not already there but if it is then add the changes you have made after every major change. add time and date as well. also before you make major implementation take a look at @ACTIVITIES.md to see what has been recently done on it. 