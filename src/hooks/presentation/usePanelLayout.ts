import { useState, useEffect, useCallback } from 'react';
import {
  PanelVisibility,
  loadPanelVisibility,
  savePanelVisibility,
  loadPanelSizes,
  savePanelSizes
} from '../../lib/presentation/panelConfig';

/**
 * Custom hook for managing panel layout (visibility and sizes)
 * Handles localStorage persistence and panel toggling
 */
export const usePanelLayout = () => {
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>(loadPanelVisibility);
  const [panelSizes, setPanelSizes] = useState<number[]>(loadPanelSizes);

  // Load saved settings on mount
  useEffect(() => {
    setPanelVisibility(loadPanelVisibility());
    setPanelSizes(loadPanelSizes());
  }, []);

  // Toggle a specific panel
  const togglePanel = useCallback((panel: keyof PanelVisibility) => {
    setPanelVisibility(prev => {
      const newVisibility = {
        ...prev,
        [panel]: !prev[panel]
      };
      savePanelVisibility(newVisibility);
      return newVisibility;
    });
  }, []);

  // Update panel sizes and save to localStorage
  const handlePanelResize = useCallback((sizes: number[]) => {
    setPanelSizes(sizes);
    savePanelSizes(sizes);
  }, []);

  // Keyboard shortcuts for panel toggles
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl is pressed and prevent default browser shortcuts
      if (event.ctrlKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            togglePanel('leftPanel');
            break;
          case '2':
            event.preventDefault();
            togglePanel('middlePanel');
            break;
          case '3':
            event.preventDefault();
            togglePanel('rightPanel');
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePanel]);

  return {
    panelVisibility,
    panelSizes,
    togglePanel,
    handlePanelResize
  };
};
