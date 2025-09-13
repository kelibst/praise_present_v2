import { ipcMain, BrowserWindow } from "electron";

export function initializeWindowMain() {
  // Minimize window
  ipcMain.handle("window:minimize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.minimize();
    }
  });

  // Maximize window
  ipcMain.handle("window:maximize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.maximize();
    }
  });

  // Unmaximize/restore window
  ipcMain.handle("window:unmaximize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.unmaximize();
    }
  });

  // Close window
  ipcMain.handle("window:close", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.close();
    }
  });

  // Check if window is maximized
  ipcMain.handle("window:isMaximized", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win ? win.isMaximized() : false;
  });

  // Check if window is fullscreen
  ipcMain.handle("window:isFullScreen", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win ? win.isFullScreen() : false;
  });

  // Set fullscreen mode
  ipcMain.handle("window:setFullScreen", (event, flag: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setFullScreen(flag);
      
      // Fix spacing issues when entering/exiting fullscreen
      win.webContents.executeJavaScript(`
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        
        // Force a repaint to fix any layout issues
        document.body.offsetHeight;
      `);
      
      return win.isFullScreen();
    }
    return false;
  });

  // Toggle fullscreen mode
  ipcMain.handle("window:toggleFullScreen", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      const currentState = win.isFullScreen();
      win.setFullScreen(!currentState);
      
      // Fix spacing issues when toggling fullscreen
      win.webContents.executeJavaScript(`
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        
        // Force a repaint
        document.body.offsetHeight;
      `);
      
      return win.isFullScreen();
    }
    return false;
  });

  // Check if window is always on top
  ipcMain.handle("window:isAlwaysOnTop", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win ? win.isAlwaysOnTop() : false;
  });

  // Set always on top
  ipcMain.handle("window:setAlwaysOnTop", (event, flag: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setAlwaysOnTop(flag);
      return win.isAlwaysOnTop();
    }
    return false;
  });

  // Listen to window events
  ipcMain.handle("window:on", (event, eventName: string, callback) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.on(eventName as any, () => {
        event.sender.send(`window:${eventName}`);
      });
    }
  });

  // Remove window event listeners
  ipcMain.handle("window:removeListener", (event, eventName: string, callback) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.removeAllListeners(eventName as any);
    }
  });

  // Get window bounds
  ipcMain.handle("window:getBounds", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win ? win.getBounds() : null;
  });

  // Set window bounds
  ipcMain.handle("window:setBounds", (event, bounds: { x?: number; y?: number; width?: number; height?: number }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setBounds(bounds);
      return win.getBounds();
    }
    return null;
  });

  // Toggle window visibility
  ipcMain.handle("window:toggleVisibility", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
      return win.isVisible();
    }
    return false;
  });

  // Center window on screen
  ipcMain.handle("window:center", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.center();
      return win.getBounds();
    }
    return null;
  });

  // Reset window size and position
  ipcMain.handle("window:reset", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setSize(1280, 720);
      win.center();
      win.setFullScreen(false);
      
      // Fix any spacing issues after reset
      win.webContents.executeJavaScript(`
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        document.body.offsetHeight;
      `);
      
      return win.getBounds();
    }
    return null;
  });

  console.log("Window control IPC handlers initialized");
} 