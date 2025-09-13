// IPC client for database operations in renderer process
declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;

      // Live display event listeners
      onLiveContentUpdate?: (callback: (content: any) => void) => () => void;
      onLiveContentClear?: (callback: () => void) => () => void;
      onLiveShowBlack?: (callback: () => void) => () => void;
      onLiveShowLogo?: (callback: () => void) => () => void;
      onLiveThemeUpdate?: (callback: (theme: any) => void) => () => void;

      // Window control methods (for custom title bar)
      window?: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        unmaximize: () => Promise<void>;
        close: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
        isFullScreen: () => Promise<boolean>;
        setFullScreen: (flag: boolean) => Promise<boolean>;
        toggleFullScreen: () => Promise<boolean>;
        isAlwaysOnTop: () => Promise<boolean>;
        setAlwaysOnTop: (flag: boolean) => Promise<boolean>;
        on: (event: string, callback: () => void) => Promise<void>;
        removeListener: (event: string, callback: () => void) => Promise<void>;
        getBounds: () => Promise<{ x: number; y: number; width: number; height: number } | null>;
        setBounds: (bounds: { x?: number; y?: number; width?: number; height?: number }) => Promise<{ x: number; y: number; width: number; height: number } | null>;
        toggleVisibility: () => Promise<boolean>;
        center: () => Promise<{ x: number; y: number; width: number; height: number } | null>;
        reset: () => Promise<{ x: number; y: number; width: number; height: number } | null>;
      };
    };
  }
}

export class DatabaseIPC {
  // Translation operations
  async loadTranslations() {
    return await window.electronAPI.invoke("db:loadTranslations");
  }

  // Version operations
  async loadVersions(translationId?: string) {
    return await window.electronAPI.invoke("db:loadVersions", translationId);
  }

  // Book operations
  async loadBooks() {
    return await window.electronAPI.invoke("db:loadBooks");
  }

  // Verse operations
  async loadVerses({
    versionId,
    bookId,
    chapter,
  }: {
    versionId: string;
    bookId: number;
    chapter: number;
  }) {
    return await window.electronAPI.invoke("db:loadVerses", {
      versionId,
      bookId,
      chapter,
    });
  }

  // Search operations
  async searchVerses({
    query,
    versionId,
  }: {
    query: string;
    versionId?: string;
  }) {
    return await window.electronAPI.invoke("db:searchVerses", {
      query,
      versionId,
    });
  }

  // Database setup operations
  async seedDatabase() {
    return await window.electronAPI.invoke("db:seed");
  }

  async importBibles() {
    return await window.electronAPI.invoke("db:importBibles");
  }

  async importBiblesSQLite() {
    return await window.electronAPI.invoke("db:importBiblesSQLite");
  }

  async importSingleBibleSQLite(versionName: string) {
    return await window.electronAPI.invoke(
      "db:importSingleBibleSQLite",
      versionName
    );
  }

  async getImportStats() {
    return await window.electronAPI.invoke("db:getImportStats");
  }

  // ===== SONG OPERATIONS =====
  
  // Load songs with search and filtering
  async loadSongs(params: {
    query?: string;
    filters?: {
      category?: string;
      key?: string;
      tempo?: string;
      artist?: string;
      ccliNumber?: string;
      tags?: string[];
      usage?: 'recent' | 'frequent' | 'favorites';
    };
    limit?: number;
    offset?: number;
  } = {}) {
    return await window.electronAPI.invoke("db:loadSongs", params);
  }
  
  // Search songs
  async searchSongs(searchParams: {
    query: string;
    filters?: any;
    limit?: number;
    offset?: number;
  }) {
    return await window.electronAPI.invoke("db:searchSongs", searchParams);
  }
  
  // Get single song with full details
  async getSong(songId: string) {
    return await window.electronAPI.invoke("db:getSong", songId);
  }
  
  // Create new song
  async createSong(songData: any) {
    return await window.electronAPI.invoke("db:createSong", songData);
  }
  
  // Update existing song
  async updateSong(song: any) {
    return await window.electronAPI.invoke("db:updateSong", song);
  }
  
  // Delete song
  async deleteSong(songId: string) {
    return await window.electronAPI.invoke("db:deleteSong", songId);
  }
  
  // Update song usage (track when song is used)
  async updateSongUsage(songId: string) {
    return await window.electronAPI.invoke("db:updateSongUsage", songId);
  }
  
  // Get recent songs
  async getRecentSongs({ limit = 10 } = {}) {
    return await window.electronAPI.invoke("db:getRecentSongs", { limit });
  }
  
  // Get favorite songs
  async getFavoriteSongs({ limit = 20 } = {}) {
    return await window.electronAPI.invoke("db:getFavoriteSongs", { limit });
  }
  
  // Get song categories
  async getSongCategories() {
    return await window.electronAPI.invoke("db:getSongCategories");
  }
  
  // Import songs in batch
  async importSongs(importData: {
    songs: any[];
    format: string;
  }) {
    return await window.electronAPI.invoke("db:importSongs", importData);
  }

  // Service operations (for future use)
  async loadServices(limit = 20) {
    return await window.electronAPI.invoke("db:loadServices", limit);
  }

  // Settings operations
  async getSetting(key: string) {
    return await window.electronAPI.invoke("db:getSetting", key);
  }

  async setSetting({
    key,
    value,
    type = "string",
    category,
  }: {
    key: string;
    value: string;
    type?: string;
    category?: string;
  }) {
    return await window.electronAPI.invoke("db:setSetting", {
      key,
      value,
      type,
      category,
    });
  }
}

// Export singleton instance
export const databaseIPC = new DatabaseIPC();
