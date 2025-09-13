export {};

declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      // Live display management
      createLiveDisplay: () => Promise<void>;
      presentContent: (content: any) => Promise<void>;
      // Event listeners
      onLiveContentUpdate: (callback: (content: any) => void) => () => void;
      onLiveContentClear: (callback: () => void) => () => void;
      onLiveShowBlack: (callback: () => void) => () => void;
      onLiveShowLogo: (callback: () => void) => () => void;
      onLiveThemeUpdate: (callback: (theme: any) => void) => () => void;
    };
  }
}