import { BrowserWindow, screen } from "electron";
import { displayManager } from "../services/DisplayManager";

// These constants are injected by Electron Forge and Vite
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

export interface LiveWindowConfig {
  displayId: number;
  fullscreen?: boolean;
  alwaysOnTop?: boolean;
  frame?: boolean;
}

export class LiveDisplayWindow {
  private static instance: LiveDisplayWindow;
  private liveWindow: BrowserWindow | null = null;
  private currentDisplayId: number | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): LiveDisplayWindow {
    if (!LiveDisplayWindow.instance) {
      LiveDisplayWindow.instance = new LiveDisplayWindow();
    }
    return LiveDisplayWindow.instance;
  }

  /**
   * Initialize the live display window manager
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    console.log("Initializing LiveDisplayWindow manager...");
    this.isInitialized = true;
    console.log("LiveDisplayWindow manager initialized successfully");
  }

  /**
   * Create live window on specified display
   */
  public async createLiveWindow(config: LiveWindowConfig): Promise<boolean> {
    try {
      // Close existing window if any
      if (this.liveWindow && !this.liveWindow.isDestroyed()) {
        this.liveWindow.close();
      }

      const display = displayManager.getDisplayById(config.displayId);
      if (!display) {
        throw new Error(`Display with ID ${config.displayId} not found`);
      }

      console.log(
        `Creating live window on display ${config.displayId}: ${
          display.friendlyName || display.label
        }`
      );
      console.log("Display bounds:", display.bounds);

      // Ensure we have the latest screen information
      const electronDisplays = screen.getAllDisplays();
      const electronDisplay = electronDisplays.find(
        (d) => d.id === config.displayId
      );

      if (!electronDisplay) {
        throw new Error(
          `Electron display with ID ${config.displayId} not found`
        );
      }

      console.log("Electron display bounds:", electronDisplay.bounds);

      // Use Electron's native display bounds for more accurate positioning
      const windowConfig = {
        x: electronDisplay.bounds.x,
        y: electronDisplay.bounds.y,
        width: electronDisplay.bounds.width,
        height: electronDisplay.bounds.height,
        fullscreen: config.fullscreen ?? true,
        frame: config.frame ?? false,
        alwaysOnTop: config.alwaysOnTop ?? true,
        show: false, // Don't show immediately
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false,
          preload: require("path").join(__dirname, "preload.js"),
        },
        // Additional configuration for better positioning
        skipTaskbar: true,
        minimizable: false,
        maximizable: false,
        resizable: false,
      };

      console.log("Creating BrowserWindow with config:", windowConfig);

      // Create the live presentation window
      this.liveWindow = new BrowserWindow(windowConfig);

      // Force the window to the correct display after creation
      this.liveWindow.setBounds({
        x: electronDisplay.bounds.x,
        y: electronDisplay.bounds.y,
        width: electronDisplay.bounds.width,
        height: electronDisplay.bounds.height,
      });

      // Set fullscreen on the correct display
      if (config.fullscreen ?? true) {
        this.liveWindow.setFullScreen(true);
      }

      // Load the live display renderer
      if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        await this.liveWindow.loadURL(
          `${MAIN_WINDOW_VITE_DEV_SERVER_URL}?mode=live-display`
        );
      } else {
        // Production mode - use the same pattern as main window
        const path = require("path");
        const indexPath = path.join(
          __dirname,
          `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
        );
        await this.liveWindow.loadFile(indexPath, {
          search: "mode=live-display",
        });
      }

      // Open developer tools for debugging (remove in production)
      if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        this.liveWindow.webContents.openDevTools();
      }

      // Set up window event handlers
      this.setupWindowEvents();

      this.currentDisplayId = config.displayId;

      console.log("Live window created successfully");
      console.log("Window bounds after creation:", this.liveWindow.getBounds());

      return true;
    } catch (error) {
      console.error("Failed to create live window:", error);
      return false;
    }
  }

  /**
   * Show the live window
   */
  public showLiveWindow(): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      // Ensure window is on correct display before showing
      if (this.currentDisplayId) {
        const electronDisplays = screen.getAllDisplays();
        const targetDisplay = electronDisplays.find(
          (d) => d.id === this.currentDisplayId
        );

        if (targetDisplay) {
          this.liveWindow.setBounds({
            x: targetDisplay.bounds.x,
            y: targetDisplay.bounds.y,
            width: targetDisplay.bounds.width,
            height: targetDisplay.bounds.height,
          });
        }
      }

      this.liveWindow.show();
      this.liveWindow.focus();
      console.log("Live window shown on display:", this.currentDisplayId);
    }
  }

  /**
   * Hide the live window
   */
  public hideLiveWindow(): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.hide();
      console.log("Live window hidden");
    }
  }

  /**
   * Close the live window
   */
  public closeLiveWindow(): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.close();
      this.liveWindow = null;
      this.currentDisplayId = null;
      console.log("Live window closed");
    }
  }

  /**
   * Check if live window exists and is visible
   */
  public isLiveWindowActive(): boolean {
    return !!(
      this.liveWindow &&
      !this.liveWindow.isDestroyed() &&
      this.liveWindow.isVisible()
    );
  }

  /**
   * Get current live window
   */
  public getLiveWindow(): BrowserWindow | null {
    return this.liveWindow && !this.liveWindow.isDestroyed()
      ? this.liveWindow
      : null;
  }

  /**
   * Get current display ID
   */
  public getCurrentDisplayId(): number | null {
    return this.currentDisplayId;
  }

  /**
   * Move live window to different display
   */
  public async moveToDisplay(displayId: number): Promise<boolean> {
    if (!this.liveWindow || this.liveWindow.isDestroyed()) {
      // Create new window if none exists
      return this.createLiveWindow({ displayId });
    }

    const electronDisplays = screen.getAllDisplays();
    const targetDisplay = electronDisplays.find((d) => d.id === displayId);

    if (!targetDisplay) {
      console.error(`Display with ID ${displayId} not found`);
      return false;
    }

    try {
      console.log(
        `Moving live window to display ${displayId}:`,
        targetDisplay.bounds
      );

      // Exit fullscreen first to allow moving
      if (this.liveWindow.isFullScreen()) {
        this.liveWindow.setFullScreen(false);
      }

      // Move and resize window to new display
      this.liveWindow.setBounds({
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        width: targetDisplay.bounds.width,
        height: targetDisplay.bounds.height,
      });

      // Re-enter fullscreen on new display
      this.liveWindow.setFullScreen(true);

      this.currentDisplayId = displayId;
      console.log(`Live window moved to display ${displayId}`);
      return true;
    } catch (error) {
      console.error("Failed to move live window:", error);
      return false;
    }
  }

  /**
   * Send content to live window
   */
  public sendContentToLive(content: any): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.webContents.send("live-content-update", content);
      console.log("Content sent to live window:", content);
    } else {
      console.warn("No active live window to send content to");
    }
  }

  /**
   * Clear content from live window
   */
  public clearLiveContent(): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.webContents.send("live-content-clear");
      console.log("Live content cleared");
    }
  }

  /**
   * Show black screen
   */
  public showBlackScreen(): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.webContents.send("live-show-black");
      console.log("Black screen displayed");
    }
  }

  /**
   * Show logo screen
   */
  public showLogoScreen(): void {
    if (this.liveWindow && !this.liveWindow.isDestroyed()) {
      this.liveWindow.webContents.send("live-show-logo");
      console.log("Logo screen displayed");
    }
  }

  /**
   * Set up window event handlers
   */
  private setupWindowEvents(): void {
    if (!this.liveWindow) return;

    this.liveWindow.on("closed", () => {
      console.log("Live window was closed");
      this.liveWindow = null;
      this.currentDisplayId = null;
    });

    this.liveWindow.on("ready-to-show", () => {
      console.log("Live window ready to show");
      // Ensure window is positioned correctly when ready
      if (this.currentDisplayId) {
        const electronDisplays = screen.getAllDisplays();
        const targetDisplay = electronDisplays.find(
          (d) => d.id === this.currentDisplayId
        );

        if (targetDisplay && this.liveWindow) {
          this.liveWindow.setBounds({
            x: targetDisplay.bounds.x,
            y: targetDisplay.bounds.y,
            width: targetDisplay.bounds.width,
            height: targetDisplay.bounds.height,
          });
        }
      }
    });

    this.liveWindow.on("focus", () => {
      console.log("Live window focused");
    });

    this.liveWindow.on("blur", () => {
      console.log("Live window lost focus");
    });

    // Handle display changes
    screen.on("display-removed", () => {
      if (this.currentDisplayId) {
        const electronDisplays = screen.getAllDisplays();
        const stillExists = electronDisplays.find(
          (d) => d.id === this.currentDisplayId
        );
        if (!stillExists) {
          console.warn("Current display was removed, closing live window");
          this.closeLiveWindow();
        }
      }
    });
  }

  /**
   * Get live window status
   */
  public getStatus(): object {
    return {
      hasWindow: !!this.liveWindow && !this.liveWindow.isDestroyed(),
      isVisible:
        this.liveWindow && !this.liveWindow.isDestroyed()
          ? this.liveWindow.isVisible()
          : false,
      currentDisplayId: this.currentDisplayId,
      bounds:
        this.liveWindow && !this.liveWindow.isDestroyed()
          ? this.liveWindow.getBounds()
          : null,
      isInitialized: this.isInitialized,
      isFullscreen:
        this.liveWindow && !this.liveWindow.isDestroyed()
          ? this.liveWindow.isFullScreen()
          : false,
    };
  }
}

// Export singleton instance
export const liveDisplayWindow = LiveDisplayWindow.getInstance();
