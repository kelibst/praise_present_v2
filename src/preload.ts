// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel: string, ...args: any[]) =>
    ipcRenderer.invoke(channel, ...args),

  // Live display event listeners
  onLiveContentUpdate: (callback: (content: any) => void) => {
    const listener = (event: any, content: any) => callback(content);
    ipcRenderer.on("live-content-update", listener);
    return () => ipcRenderer.removeListener("live-content-update", listener);
  },

  onLiveContentClear: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("live-content-clear", listener);
    return () => ipcRenderer.removeListener("live-content-clear", listener);
  },

  onLiveShowBlack: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("live-show-black", listener);
    return () => ipcRenderer.removeListener("live-show-black", listener);
  },

  onLiveShowLogo: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("live-show-logo", listener);
    return () => ipcRenderer.removeListener("live-show-logo", listener);
  },

  onLiveThemeUpdate: (callback: (theme: any) => void) => {
    const listener = (event: any, theme: any) => callback(theme);
    ipcRenderer.on("live-theme-update", listener);
    return () => ipcRenderer.removeListener("live-theme-update", listener);
  },
});
