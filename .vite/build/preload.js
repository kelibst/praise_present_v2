"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel, ...args) => electron.ipcRenderer.invoke(channel, ...args),
  // Live display management
  createLiveDisplay: () => electron.ipcRenderer.invoke("create-live-display"),
  presentContent: (content) => electron.ipcRenderer.invoke("present-content", content),
  // Live display event listeners
  onLiveContentUpdate: (callback) => {
    const listener = (event, content) => callback(content);
    electron.ipcRenderer.on("live-content-update", listener);
    return () => electron.ipcRenderer.removeListener("live-content-update", listener);
  },
  onLiveContentClear: (callback) => {
    const listener = () => callback();
    electron.ipcRenderer.on("live-content-clear", listener);
    return () => electron.ipcRenderer.removeListener("live-content-clear", listener);
  },
  onLiveShowBlack: (callback) => {
    const listener = () => callback();
    electron.ipcRenderer.on("live-show-black", listener);
    return () => electron.ipcRenderer.removeListener("live-show-black", listener);
  },
  onLiveShowLogo: (callback) => {
    const listener = () => callback();
    electron.ipcRenderer.on("live-show-logo", listener);
    return () => electron.ipcRenderer.removeListener("live-show-logo", listener);
  },
  onLiveThemeUpdate: (callback) => {
    const listener = (event, theme) => callback(theme);
    electron.ipcRenderer.on("live-theme-update", listener);
    return () => electron.ipcRenderer.removeListener("live-theme-update", listener);
  }
});
