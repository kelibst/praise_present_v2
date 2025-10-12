# CLAUDE.md

PraisePresent is an Electron-based presentation application for church services, built with React, TypeScript, and Prisma.

## Development Commands
```bash
npm start               # Start application
npm run lint           # Run ESLint
npm test               # Run tests
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
```

## Architecture
- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Electron, Prisma ORM, SQLite
- **Rendering:** PowerPoint-style shape-based system
- **Live Display:** Multi-window IPC communication

## Key Directories
- `src/rendering/`: PowerPoint-style rendering engine
- `src/components/`: Feature-based UI components
- `src/pages/`: Route-based page components
- `prisma/`: Database schema and migrations

## Live Display Pattern
Use this standardized pattern for live display integration:

```typescript
const [liveDisplayActive, setLiveDisplayActive] = useState(false);
const [liveDisplayStatus, setLiveDisplayStatus] = useState('Disconnected');

const createLiveDisplay = async () => {
  const result = await window.electronAPI?.invoke('live-display:create', {});
  if (result?.success) {
    setLiveDisplayActive(true);
    setLiveDisplayStatus('Active');
  }
};

const sendContentToLive = async (content) => {
  if (!liveDisplayActive) return;
  await window.electronAPI?.invoke('live-display:sendContent', content);
};
```

**IPC Commands:**
- `live-display:create/close/sendContent/clearContent/showBlack/getStatus`

## Development Rules
- Always check ACTIVITIES.md before major implementations
- Update ACTIVITIES.md after significant changes with date/time
- ACTIVITIES.md file must not get too huge so add only these as in the example below.
### 🔧 Added Comprehensive Logging for Window Resize Black Screen Issue
**Time:** Late Afternoon
**Description:** Added detailed logging throughout the resize and render pipeline to diagnose the black screen issue that occurs during window resize.
**Technical Notes:**
- Canvas switching properly reinitializes rendering context and settings
- Error handling prevents cascade failures across viewports
- Maintains compatibility with existing rendering pipeline
- Supports the shared rendering architecture design patterns