import { app, BrowserWindow } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { initializeDatabaseMain } from "./main/database-main";
import { initializeDisplayMain } from "./main/display-main";
import { initializeWindowMain } from "./main/window-main";

// These constants are injected by Electron Forge and Vite
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
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
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  // Initialize database in main process
  try {
    await initializeDatabaseMain();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }

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

  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
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
