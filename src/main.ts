import { app, BrowserWindow } from "electron";
import path from "node:path";
import squirrelStartup from "electron-squirrel-startup";
import { initializeDatabaseMain } from "./main/database-main";
import { initializeDisplayMain } from "./main/display-main";
import { initializeWindowMain } from "./main/window-main";
import { initializeMediaHandlers } from "./main/media-main";

// These constants are injected by Electron Forge and Vite
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (squirrelStartup) {
  app.quit();
}

// Global reference to the main window
let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    frame: true,
    // titleBarStyle: 'hidden',
    trafficLightPosition: { x: -100, y: -100 }, // Hide macOS traffic lights
    transparent: false,
    hasShadow: true,
    roundedCorners: true,
    vibrancy: 'window', // macOS only
    backgroundColor: '#ffffff',
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // // Set rounded corners for Windows/Linux
    // if (process.platform === 'win32' || process.platform === 'linux') {
    //   mainWindow.setWindowButtonVisibility(false);
    // }
    
    // Inject CSS to fix any spacing issues immediately
    mainWindow.webContents.executeJavaScript(`
      // Remove any default margins and padding
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
      
      // Ensure the root element fills the entire window
      const root = document.getElementById('root');
      if (root) {
        root.style.margin = '0';
        root.style.padding = '0';
        root.style.width = '100vw';
        root.style.height = '100vh';
        root.style.overflow = 'hidden';
      }
      
      // Add rounded corners to the main application container
      const appWindow = document.querySelector('.app-window');
      if (appWindow) {
        appWindow.style.borderRadius = '8px';
        appWindow.style.overflow = 'hidden';
      }
    `).catch(console.error);
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    console.log('[MAIN] Loading from dev server:', MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const htmlPath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
    console.log('[MAIN] __dirname:', __dirname);
    console.log('[MAIN] MAIN_WINDOW_VITE_NAME:', MAIN_WINDOW_VITE_NAME);
    console.log('[MAIN] Loading from file:', htmlPath);
    mainWindow.loadFile(htmlPath);
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Add error handlers
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('[MAIN] Failed to load:', {
      errorCode,
      errorDescription,
      validatedURL
    });
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[MAIN] Window finished loading successfully');
  });

  // Handle main window close event
  mainWindow.on('close', () => {
    console.log('[MAIN] Main window is closing, cleaning up...');

    // Close live display window when main window closes
    const { liveDisplayWindow } = require("./main/LiveDisplayWindow");
    if (liveDisplayWindow) {
      liveDisplayWindow.closeLiveWindow();
      console.log('[MAIN] Live display window closed');
    }
  });

  mainWindow.on('closed', () => {
    console.log('[MAIN] Main window closed');
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  // Create window first - don't block on database initialization
  createWindow();

  // Initialize database in main process (async, non-blocking)
  initializeDatabaseMain()
    .then(() => {
      console.log("Database initialized successfully");
    })
    .catch((error) => {
      console.error("Failed to initialize database:", error);
      console.error("The application will continue, but database features may not work");
    });

  // Initialize display management
  try {
    initializeDisplayMain();
    console.log("Display management initialized successfully");
  } catch (error) {
    console.error("Failed to initialize display management:", error);
  }

  // Initialize window controls
  try {
    initializeWindowMain();
    console.log("Window controls initialized successfully");
  } catch (error) {
    console.error("Failed to initialize window controls:", error);
  }

  // Initialize media handlers
  try {
    initializeMediaHandlers();
    console.log("Media handlers initialized successfully");
  } catch (error) {
    console.error("Failed to initialize media handlers:", error);
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Clean up all windows before quitting
app.on("before-quit", () => {
  console.log("[APP] Application is quitting, closing all windows...");

  // Close live display window if it exists
  const { liveDisplayWindow } = require("./main/LiveDisplayWindow");
  if (liveDisplayWindow) {
    liveDisplayWindow.closeLiveWindow();
  }

  // Close main window if it exists
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
