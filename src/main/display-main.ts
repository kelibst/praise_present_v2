import { ipcMain, screen, desktopCapturer, BrowserWindow } from "electron";
import { displayManager, DisplayInfo } from "../services/DisplayManager";
import { liveDisplayWindow } from "./LiveDisplayWindow";

// Store app settings (in a real app, this would be in a persistent store)
let displaySettings = {
  selectedLiveDisplayId: null as number | null,
  isLiveDisplayActive: false,
  liveDisplayFullscreen: true,
  liveDisplayAlwaysOnTop: true,
  testMode: false,
  savedTheme: null as any,
};

export function initializeDisplayMain(): void {
  console.log("Initializing display IPC handlers...");

  // Initialize the DisplayManager now that the app is ready
  displayManager.initialize();
  // Initialize the LiveDisplayWindow manager
  liveDisplayWindow.initialize();

  // Handler for getting all displays
  ipcMain.handle("display:getDisplays", async () => {
    try {
      console.log("IPC: Getting displays...");
      const displays = displayManager.getDisplays();
      const primaryDisplay = displayManager.getPrimaryDisplay();
      const secondaryDisplay = displayManager.getSecondaryDisplay();

      console.log("IPC: Returning display data:", {
        displays: displays.length,
        primaryDisplay: primaryDisplay?.id,
        secondaryDisplay: secondaryDisplay?.id,
      });

      return {
        displays,
        primaryDisplay,
        secondaryDisplay,
      };
    } catch (error) {
      console.error("Error getting displays:", error);
      throw error;
    }
  });

  // Handler for capturing display screenshot
  ipcMain.handle("display:captureDisplay", async (event, displayId: number) => {
    try {
      console.log("IPC: Capturing display:", displayId);

      // Get the display bounds
      const displays = screen.getAllDisplays();
      const targetDisplay = displays.find((d) => d.id === displayId);

      if (!targetDisplay) {
        throw new Error(`Display with ID ${displayId} not found`);
      }

      console.log("Target display bounds:", targetDisplay.bounds);

      // Capture the screen with display-specific bounds
      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: {
          width: Math.floor(targetDisplay.bounds.width / 4),
          height: Math.floor(targetDisplay.bounds.height / 4),
        },
      });

      console.log(
        "Available sources:",
        sources.map((s) => ({
          id: s.id,
          name: s.name,
          display_id: s.display_id,
        }))
      );

      // Try multiple strategies to find the correct source for this display
      let source = null;

      // Strategy 1: Match by display_id as string
      source = sources.find((s) => s.display_id === displayId.toString());
      if (source) {
        console.log("Found source by display_id string match:", source.id);
      }

      // Strategy 2: Match by display_id as number
      if (!source) {
        source = sources.find((s) => parseInt(s.display_id) === displayId);
        if (source) {
          console.log("Found source by display_id number match:", source.id);
        }
      }

      // Strategy 3: Match by position - find source that includes target display bounds
      if (!source && sources.length > 1) {
        // For multi-monitor setups, try to find source by screen position
        // This is a fallback approach when display_id matching fails
        const primaryDisplay = screen.getPrimaryDisplay();

        if (displayId !== primaryDisplay.id) {
          // For non-primary displays, try to get the second source
          source = sources[1] || sources[0];
          console.log(
            "Using secondary source for non-primary display:",
            source?.id
          );
        } else {
          source = sources[0];
          console.log("Using primary source for primary display:", source?.id);
        }
      }

      // Strategy 4: Last resort - use first source but log warning
      if (!source && sources.length > 0) {
        source = sources[0];
        console.warn(
          `No specific match for display ${displayId}, using first source:`,
          source.id
        );
      }

      if (!source || !source.thumbnail) {
        throw new Error("Failed to capture display - no valid source found");
      }

      // Convert to base64
      const screenshot = source.thumbnail.toDataURL();
      console.log(
        `IPC: Display ${displayId} captured successfully using source:`,
        source.id
      );

      return screenshot;
    } catch (error) {
      console.error("Error capturing display:", error);
      throw error;
    }
  });

  // Handler for testing display (show a test pattern)
  ipcMain.handle("display:testDisplay", async (event, displayId: number) => {
    try {
      console.log("IPC: Testing display:", displayId);

      // Get the display bounds
      const displays = screen.getAllDisplays();
      const targetDisplay = displays.find((d) => d.id === displayId);

      if (!targetDisplay) {
        throw new Error(`Display with ID ${displayId} not found`);
      }

      // Create a test window on the target display
      const testWindow = new BrowserWindow({
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        width: targetDisplay.bounds.width,
        height: targetDisplay.bounds.height,
        fullscreen: true,
        frame: false,
        alwaysOnTop: true,
        backgroundColor: "#FF0000",
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Load a simple test HTML
      const testHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 0;
                background: linear-gradient(45deg, #FF0000, #00FF00, #0000FF, #FFFF00);
                background-size: 400% 400%;
                animation: gradientShift 3s ease infinite;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
                color: white;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
              }
              @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .test-content {
                text-align: center;
                font-size: 4rem;
                font-weight: bold;
              }
              .display-info {
                font-size: 2rem;
                margin-top: 2rem;
              }
            </style>
          </head>
          <body>
            <div class="test-content">
              <div>Display Test</div>
              <div class="display-info">Display ID: ${displayId}</div>
              <div class="display-info">${targetDisplay.bounds.width} × ${targetDisplay.bounds.height}</div>
            </div>
          </body>
        </html>
      `;

      await testWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(testHTML)}`
      );
      testWindow.show();

      // Close the test window after 3 seconds
      setTimeout(() => {
        if (!testWindow.isDestroyed()) {
          testWindow.close();
        }
      }, 3000);

      console.log("IPC: Display test completed");
      return { success: true, message: "Test pattern shown for 3 seconds" };
    } catch (error) {
      console.error("Error testing display:", error);
      throw error;
    }
  });

  // Handler for saving display settings
  ipcMain.handle("display:saveSettings", async (event, settings: any) => {
    try {
      console.log("IPC: Saving display settings:", settings);

      // Save the selected live display ID
      if (settings.selectedLiveDisplayId !== undefined) {
        displaySettings.selectedLiveDisplayId = settings.selectedLiveDisplayId;
      }

      // For now, we'll just return the settings back
      // In a real implementation, you might save these to a config file or database
      console.log("IPC: Display settings saved successfully");

      return settings;
    } catch (error) {
      console.error("Error saving display settings:", error);
      throw error;
    }
  });

  // Live Display IPC Handlers
  ipcMain.handle(
    "live-display:create",
    async (event, { displayId }: { displayId?: number }) => {
      try {
        console.log("IPC: Creating live display on display:", displayId);

        // If no display specified, use selected live display or secondary display
        let targetDisplayId: number | undefined = displayId;
        if (!targetDisplayId) {
          if (displaySettings.selectedLiveDisplayId) {
            targetDisplayId = displaySettings.selectedLiveDisplayId;
          } else {
            const secondaryDisplay = displayManager.getSecondaryDisplay();
            if (secondaryDisplay) {
              targetDisplayId = secondaryDisplay.id;
            } else {
              const primaryDisplay = displayManager.getPrimaryDisplay();
              if (primaryDisplay) {
                targetDisplayId = primaryDisplay.id;
              }
            }
          }
        }

        if (!targetDisplayId) {
          throw new Error("No suitable display found for live output");
        }

        const success = await liveDisplayWindow.createLiveWindow({
          displayId: targetDisplayId,
          fullscreen: displaySettings.liveDisplayFullscreen,
          alwaysOnTop: displaySettings.liveDisplayAlwaysOnTop,
          frame: false,
        });

        if (success) {
          displaySettings.isLiveDisplayActive = true;
          displaySettings.selectedLiveDisplayId = targetDisplayId;
        }

        console.log("IPC: Live display creation result:", {
          success,
          displayId: targetDisplayId,
        });

        return { success, displayId: targetDisplayId };
      } catch (error) {
        console.error("Error creating live display:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("live-display:show", async () => {
    try {
      console.log("IPC: Showing live display");
      liveDisplayWindow.showLiveWindow();
      return { success: true };
    } catch (error) {
      console.error("Error showing live display:", error);
      throw error;
    }
  });

  ipcMain.handle("live-display:hide", async () => {
    try {
      console.log("IPC: Hiding live display");
      liveDisplayWindow.hideLiveWindow();
      return { success: true };
    } catch (error) {
      console.error("Error hiding live display:", error);
      throw error;
    }
  });

  ipcMain.handle("live-display:close", async () => {
    try {
      console.log("IPC: Closing live display");
      liveDisplayWindow.closeLiveWindow();
      displaySettings.isLiveDisplayActive = false;
      return { success: true };
    } catch (error) {
      console.error("Error closing live display:", error);
      throw error;
    }
  });

  ipcMain.handle("live-display:getStatus", async () => {
    try {
      const status = liveDisplayWindow.getStatus();
      console.log("IPC: Live display status:", status);
      return status;
    } catch (error) {
      console.error("Error getting live display status:", error);
      throw error;
    }
  });

  // Handler to send content to live display
  ipcMain.handle("live-display:sendContent", async (event, content: any) => {
    try {
      console.log("IPC: Sending content to live display:", content);
      liveDisplayWindow.sendContentToLive(content);
      return { success: true };
    } catch (error) {
      console.error("Error sending content to live display:", error);
      throw error;
    }
  });

  // Handler to clear live display content
  ipcMain.handle("live-display:clearContent", async () => {
    try {
      console.log("IPC: Clearing live display content");
      liveDisplayWindow.clearLiveContent();
      return { success: true };
    } catch (error) {
      console.error("Error clearing live display content:", error);
      throw error;
    }
  });

  // Handler to show black screen
  ipcMain.handle("live-display:showBlack", async () => {
    try {
      console.log("IPC: Showing black screen");
      liveDisplayWindow.showBlackScreen();
      return { success: true };
    } catch (error) {
      console.error("Error showing black screen:", error);
      throw error;
    }
  });

  // Handler to show logo screen
  ipcMain.handle("live-display:showLogo", async () => {
    try {
      console.log("IPC: Showing logo screen");
      liveDisplayWindow.showLogoScreen();
      return { success: true };
    } catch (error) {
      console.error("Error showing logo screen:", error);
      throw error;
    }
  });

  // Theme management handlers
  ipcMain.handle("live-display:updateTheme", async (event, theme: any) => {
    try {
      console.log("IPC: Updating live display theme:", theme);
      const liveWindow = liveDisplayWindow.getLiveWindow();
      if (liveWindow && !liveWindow.isDestroyed()) {
        liveWindow.webContents.send("live-theme-update", theme);
      }
      return { success: true };
    } catch (error) {
      console.error("Error updating live display theme:", error);
      throw error;
    }
  });

  ipcMain.handle("live-display:saveTheme", async (event, theme: any) => {
    try {
      console.log("IPC: Saving live display theme:", theme);
      // Here you would typically save to a config file or database
      // For now, we'll just store in memory
      displaySettings.savedTheme = theme;
      return { success: true };
    } catch (error) {
      console.error("Error saving live display theme:", error);
      throw error;
    }
  });

  ipcMain.handle("live-display:getTheme", async () => {
    try {
      console.log("IPC: Getting saved live display theme");
      return displaySettings.savedTheme || null;
    } catch (error) {
      console.error("Error getting live display theme:", error);
      throw error;
    }
  });

  ipcMain.handle("live-display:startPreview", async (event, theme: any) => {
    try {
      console.log("IPC: Starting live display preview with theme:", theme);

      // Create live display if it doesn't exist
      const status = liveDisplayWindow.getStatus() as any;
      if (!status.hasWindow) {
        let targetDisplayId = displaySettings.selectedLiveDisplayId;
        if (!targetDisplayId) {
          const secondaryDisplay = displayManager.getSecondaryDisplay();
          if (secondaryDisplay) {
            targetDisplayId = secondaryDisplay.id;
          } else {
            const primaryDisplay = displayManager.getPrimaryDisplay();
            if (primaryDisplay) {
              targetDisplayId = primaryDisplay.id;
            }
          }
        }

        if (targetDisplayId) {
          const created = await liveDisplayWindow.createLiveWindow({
            displayId: targetDisplayId,
            fullscreen: displaySettings.liveDisplayFullscreen,
            alwaysOnTop: displaySettings.liveDisplayAlwaysOnTop,
            frame: false,
          });

          if (!created) {
            throw new Error("Failed to create live display for preview");
          }
        }
      }

      // Show the window and apply theme
      liveDisplayWindow.showLiveWindow();

      // Send preview content with theme
      const previewContent = {
        type: "placeholder",
        title: "Theme Preview",
        content: {
          mainText: "Theme Preview Mode",
          subText: "Customizing live display appearance",
          timestamp: new Date().toLocaleTimeString(),
        },
      };

      liveDisplayWindow.sendContentToLive(previewContent);

      // Apply theme
      const liveWindow = liveDisplayWindow.getLiveWindow();
      if (liveWindow && !liveWindow.isDestroyed()) {
        liveWindow.webContents.send("live-theme-update", theme);
      }

      return { success: true };
    } catch (error) {
      console.error("Error starting live display preview:", error);
      throw error;
    }
  });

  ipcMain.handle("live-display:endPreview", async () => {
    try {
      console.log("IPC: Ending live display preview");
      // Optionally hide or close the preview window
      // For now, we'll just leave it open but reset to default content
      return { success: true };
    } catch (error) {
      console.error("Error ending live display preview:", error);
      throw error;
    }
  });

  console.log("Display IPC handlers initialized successfully");
}

/**
 * Clean up display-related resources
 */
export function cleanupDisplayMain(): void {
  console.log("Cleaning up display resources...");

  // Remove display IPC handlers
  ipcMain.removeHandler("display:getDisplays");
  ipcMain.removeHandler("display:captureDisplay");
  ipcMain.removeHandler("display:testDisplay");
  ipcMain.removeHandler("display:saveSettings");

  // Remove live display IPC handlers
  ipcMain.removeHandler("live-display:create");
  ipcMain.removeHandler("live-display:show");
  ipcMain.removeHandler("live-display:hide");
  ipcMain.removeHandler("live-display:close");
  ipcMain.removeHandler("live-display:getStatus");
  ipcMain.removeHandler("live-display:sendContent");
  ipcMain.removeHandler("live-display:clearContent");
  ipcMain.removeHandler("live-display:showBlack");
  ipcMain.removeHandler("live-display:showLogo");
  ipcMain.removeHandler("live-display:updateTheme");
  ipcMain.removeHandler("live-display:saveTheme");
  ipcMain.removeHandler("live-display:getTheme");
  ipcMain.removeHandler("live-display:startPreview");
  ipcMain.removeHandler("live-display:endPreview");

  console.log("Display cleanup completed");
}
