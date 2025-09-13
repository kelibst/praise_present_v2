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

### Memory
Add ACTIVITIES.md file if does not exist already. if it is not already there but if it is then add the changes you have made after every major change. add time and date as well.