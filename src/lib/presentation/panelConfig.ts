/**
 * Panel configuration constants and utilities for LivePresentationPage
 */

export interface PanelVisibility {
  leftPanel: boolean;
  middlePanel: boolean;
  rightPanel: boolean;
}

export const DEFAULT_PANEL_VISIBILITY: PanelVisibility = {
  leftPanel: true,
  middlePanel: true,
  rightPanel: true
};

export const DEFAULT_PANEL_SIZES = [30, 45, 25]; // Percentages for left, middle, right

export const STORAGE_KEYS = {
  PANEL_VISIBILITY: 'live-presentation-panel-visibility',
  PANEL_SIZES: 'live-presentation-panel-sizes'
} as const;

/**
 * Load panel visibility from localStorage
 */
export const loadPanelVisibility = (): PanelVisibility => {
  const saved = localStorage.getItem(STORAGE_KEYS.PANEL_VISIBILITY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_PANEL_VISIBILITY,
          ...parsed
        };
      }
    } catch (error) {
      console.warn('Failed to parse saved panel visibility:', error);
    }
  }
  return DEFAULT_PANEL_VISIBILITY;
};

/**
 * Save panel visibility to localStorage
 */
export const savePanelVisibility = (visibility: PanelVisibility): void => {
  localStorage.setItem(STORAGE_KEYS.PANEL_VISIBILITY, JSON.stringify(visibility));
};

/**
 * Load panel sizes from localStorage
 */
export const loadPanelSizes = (): number[] => {
  const saved = localStorage.getItem(STORAGE_KEYS.PANEL_SIZES);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 3) {
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse saved panel sizes:', error);
    }
  }
  return DEFAULT_PANEL_SIZES;
};

/**
 * Save panel sizes to localStorage
 */
export const savePanelSizes = (sizes: number[]): void => {
  localStorage.setItem(STORAGE_KEYS.PANEL_SIZES, JSON.stringify(sizes));
};
