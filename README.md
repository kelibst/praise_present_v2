# PraisePresent

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A modern, PowerPoint-style presentation application built specifically for church services. PraisePresent features a sophisticated rendering engine with selective rendering, responsive layouts, and live display capabilities.

## Features

- **PowerPoint-Style Rendering Engine** - Shape-based rendering with selective dirty region updates
- **Live Display** - Multi-window IPC communication for projector output
- **Responsive Design** - Fluid typography and adaptive layouts
- **Media Support** - Images and video backgrounds with advanced layout modes
- **Database-Driven** - SQLite database for songs, hymnals, and presentations
- **High Performance** - Selective rendering with FPS tracking and optimization

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Electron 38, Prisma ORM, SQLite
- **Build System:** Vite, Electron Forge
- **UI Components:** Radix UI, Framer Motion, Lucide Icons

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)

### Platform-Specific Requirements

**Windows:**
- Windows 10 or later
- Visual Studio Build Tools (for native modules)

**macOS:**
- macOS 10.13 or later
- Xcode Command Line Tools: `xcode-select --install`

**Linux:**
- Ubuntu 18.04+ / Debian 10+ / Fedora 32+
- Build essentials: `sudo apt install build-essential` (Debian/Ubuntu)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/praise_present_v2.git
cd praise_present_v2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

Generate Prisma client and initialize database:

```bash
npm run db:generate
npm run db:push
```

Optional: Seed database with sample data:

```bash
npm run db:setup         # Full setup with all data
npm run db:seed-songs    # Seed songs only
npm run db:seed-hymnals  # Seed hymnals only
```

### 4. Start Development Server

```bash
npm start
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start application in development mode |
| `npm run lint` | Run ESLint for code quality |
| `npm test` | Run test suite |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run package` | Package application (no installer) |
| `npm run make` | Build distributable installers |

## Building Distribution Files

### Windows

Build a Windows installer (.exe):

```bash
npm run make
```

**Output Location:**
```
out/make/squirrel.windows/x64/PraisePresent-1.0.0 Setup.exe
```

**Installer Details:**
- Creates a Squirrel installer
- Installs to: `C:\Users\{Username}\AppData\Local\praise_present_v2\`
- Adds Start Menu shortcut
- Supports auto-updates

**Portable Version:**
```
out/PraisePresent-win32-x64/PraisePresent.exe
```
This version runs without installation.

### macOS

Build a macOS application (.app and .dmg):

```bash
npm run make
```

**Output Location:**
```
out/make/zip/darwin/x64/PraisePresent-darwin-x64-1.0.0.zip
```

**Distribution:**
- Extract the .zip to get `PraisePresent.app`
- Move to `/Applications` folder
- For distribution, you may need to sign the app:
  ```bash
  # Code signing (requires Apple Developer account)
  codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name" PraisePresent.app
  ```

### Linux

Build Linux packages (.deb and .rpm):

```bash
npm run make
```

**Output Locations:**

**Debian/Ubuntu (.deb):**
```
out/make/deb/x64/praise-present-v2_1.0.0_amd64.deb
```

Install with:
```bash
sudo dpkg -i out/make/deb/x64/praise-present-v2_1.0.0_amd64.deb
```

**Fedora/RHEL (.rpm):**
```
out/make/rpm/x64/praise-present-v2-1.0.0-1.x86_64.rpm
```

Install with:
```bash
sudo rpm -i out/make/rpm/x64/praise-present-v2-1.0.0-1.x86_64.rpm
```

## Testing Your Build

### Pre-Build Checklist

Before building, ensure:

- [ ] All dependencies are installed: `npm install`
- [ ] Prisma client is generated: `npm run db:generate`
- [ ] Application runs in dev mode: `npm start`
- [ ] No linting errors: `npm run lint`

### Testing the Built Application

**Windows:**
1. Run the installer: `out/make/squirrel.windows/x64/PraisePresent-1.0.0 Setup.exe`
2. Launch from Start Menu
3. Test all features:
   - Create/edit presentations
   - Open live display window
   - Add media (images/videos)
   - Test slide rendering

**macOS:**
1. Extract and copy `PraisePresent.app` to Applications
2. Launch and test features
3. Check for any permission dialogs (screen recording, etc.)

**Linux:**
1. Install the .deb or .rpm package
2. Launch from application menu or terminal: `praise-present-v2`
3. Test all features

### Common Build Issues

**Issue: Build fails with "native modules" error**
```bash
# Rebuild native modules
npm rebuild
npm run make
```

**Issue: Database not found in built app**
- Ensure `prisma/dev.db` is included in build
- Check database path in `src/main.ts`

**Issue: "Out of memory" during build**
```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run make
```

**Issue: macOS "damaged" error**
```bash
# Remove quarantine attribute
xattr -cr PraisePresent.app
```

## Project Structure

```
praise_present_v2/
├── src/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Preload script for IPC
│   ├── rendering/           # PowerPoint-style rendering engine
│   │   ├── core/            # RenderingEngine, SelectiveRenderingEngine
│   │   ├── shapes/          # Shape classes (Text, Image, Video, etc.)
│   │   └── layout/          # Layout managers and modes
│   ├── components/          # React UI components
│   ├── pages/               # Route-based page components
│   └── main/                # Main process modules
│       ├── LiveDisplayWindow.ts  # Live display window manager
│       └── display-main.ts       # IPC handlers
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── dev.db              # SQLite database
├── public/                  # Static assets
├── out/                     # Build output (generated)
└── forge.config.ts          # Electron Forge configuration
```

## Key Directories

- **`src/rendering/`** - PowerPoint-style rendering engine with selective rendering
- **`src/components/`** - Feature-based UI components
- **`src/pages/`** - Route-based page components
- **`src/main/`** - Electron main process modules
- **`prisma/`** - Database schema and migrations

## Architecture Overview

PraisePresent uses a sophisticated three-layer rendering architecture:

1. **RenderingEngine** - Base canvas rendering with fixed resolution (1920x1080)
2. **SelectiveRenderingEngine** - Dirty region tracking and partial updates
3. **ResponsiveRenderingEngine** - Responsive layouts and fluid typography

### Live Display Pattern

Standard pattern for live display integration:

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
- `live-display:create` - Create live display window
- `live-display:close` - Close live display window
- `live-display:sendContent` - Send content to live display
- `live-display:clearContent` - Clear live display
- `live-display:showBlack` - Show black screen
- `live-display:getStatus` - Get live display status

## Configuration

### Database Configuration

Database path is configured in [src/main.ts](src/main.ts). For production builds, ensure the database path is correctly set:

```typescript
// Development
const dbPath = path.join(app.getPath('userData'), 'dev.db');

// Production
const dbPath = path.join(app.getPath('userData'), 'production.db');
```

### Build Configuration

Customize build settings in [forge.config.ts](forge.config.ts):

```typescript
packagerConfig: {
  asar: true,
  icon: './public/icon',  // Add your icon
  name: 'PraisePresent',
  executableName: 'praise-present'
}
```

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Rules

- Always check `ACTIVITIES.md` before major implementations
- Update `ACTIVITIES.md` after significant changes with date/time
- Follow the existing code style
- Write meaningful commit messages
- Test thoroughly before submitting PRs

## Troubleshooting

### App won't start

```bash
# Clear cache and rebuild
rm -rf node_modules
rm -rf out
npm install
npm run db:generate
npm start
```

### Database errors

```bash
# Reset database
rm prisma/dev.db
npm run db:push
npm run db:setup
```

### Live display not working

- Check that firewall isn't blocking IPC communication
- Verify display settings in application
- Check console for IPC errors

### Performance issues

- Enable selective rendering in settings
- Reduce media quality for large images/videos
- Check performance metrics in dev tools

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Keli Booster**

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI powered by [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- Database managed by [Prisma](https://www.prisma.io/)

## Support

For issues, questions, or contributions, please visit the [GitHub Issues](https://github.com/yourusername/praise_present_v2/issues) page.

---

**Made with ❤️ for church communities**
