## Project Overview

PraisePresent is a desktop application for church presentations, built using modern web technologies. It's designed to be an AI-powered platform for creating and displaying worship content, including scriptures, songs, and announcements.

**REBUILD STATUS**: The project is undergoing a complete architectural rebuild with a PowerPoint-inspired rendering engine to address performance and reliability issues. The new system uses a shape-based content model with hardware-accelerated rendering for smooth, professional presentations.

The application is built with:

*   **Electron:** For creating a cross-platform desktop application.
*   **React & TypeScript:** For the user interface and application logic.
*   **Redux:** For state management.
*   **SQLite:** As the local database for storing application data.
*   **Prisma:** As the ORM for interacting with the database.
*   **Tailwind CSS:** For styling the user interface.
*   **Vite:** As the build tool for the frontend.
*   **Electron Forge:** For packaging and distributing the application.
*   **Jest & React Testing Library:** For testing.

The project is structured with Electron main process code, React renderer process, and a new PowerPoint-style rendering engine in `src/rendering/`. The rebuild follows a phased approach documented in the `plan/` directory.

## Building and Running

### Prerequisites

*   Node.js and npm are installed.

### Installation

1.  Clone the repository.
2.  Install the dependencies:
    ```bash
    npm install
    ```

### Development

To run the application in development mode:

```bash
npm start
```

This will start the Vite development server and launch the Electron application.

### Building for Production

To package the application for the current platform:

```bash
npm run package
```

To create a distributable installer for the current platform:

```bash
npm run make
```

### Testing

To run the test suite:

```bash
npm test
```

To run the tests in watch mode:

```bash
npm run test:watch
```

To generate a test coverage report:

```bash
npm run test:coverage
```

### Linting

To lint the codebase:

```bash
npm run lint
```

### Database

The project uses Prisma for database management. The following scripts are available:

*   `npm run db:setup`: Sets up the database.
*   `npm run db:setup-sqlite`: Seeds the database with data from SQLite files.
*   `npm run db:generate`: Generates the Prisma client.
*   `npm run db:push`: Pushes the Prisma schema to the database.
*   `npm run db:studio`: Opens the Prisma Studio to view and edit the database.

## Development Conventions

*   **Code Style:** The project uses ESLint to enforce a consistent code style.
*   **Testing:** The project has a comprehensive test suite using Jest and React Testing Library. Tests are located in `__tests__` directories and use mock data factories for consistency. The project aims for at least 80% code coverage.
*   **Commits:** Commit messages should follow the Conventional Commits specification.
*   **Branching:** The project uses the Gitflow workflow. New features should be developed in feature branches and merged into the `develop` branch.

## Key Files

*   `forge.config.ts`: Configuration for Electron Forge.
*   `vite.main.config.ts`: Vite configuration for the main process.
*   `vite.renderer.config.ts`: Vite configuration for the renderer process.
*   `src/main.ts`: Entry point for the Electron main process.
*   `src/renderer.tsx`: Entry point for the React application.
*   `src/lib/store.ts`: Redux store configuration.
*   `src/rendering/`: New PowerPoint-style rendering engine (core architecture).
*   `plan/`: Complete implementation roadmap and architecture documentation.
*   `plan/architecture.mermaid`: Visual architecture diagram.
*   `prisma/schema.prisma`: Prisma schema for the database.
*   `CLAUDE.md`: Detailed project guidance for Claude Code.
*   `GEMINI.md`: This file, which provides an overview of the project for the Gemini AI assistant.

## New Rendering Architecture

The rebuild introduces a Microsoft PowerPoint-inspired rendering system:

### Core Components
*   **Shape-Based Content**: Text, images, and media as composable shapes
*   **Template System**: Slide masters for different content types (songs, scripture, announcements)
*   **Multi-Display Pipeline**: Separate operator and live display rendering
*   **Hardware Acceleration**: Canvas/WebGL for smooth performance
*   **Caching System**: Pre-rendered slides for instant switching

### Implementation Phases
1. **Foundation**: Core rendering engine and shape system
2. **Templates**: Slide master templates for church content
3. **Live Display**: Multi-window presentation system
4. **Content Management**: Database integration with existing Prisma models
5. **Performance**: Optimization, caching, and effects