import { useState, useEffect, useCallback } from "react";

// Live Display Window IPC calls
const createLiveDisplay = async (displayId: number) => {
  return window.electronAPI?.invoke("live-display:create", { displayId });
};

const showLiveDisplay = async () => {
  return window.electronAPI?.invoke("live-display:show");
};

const hideLiveDisplay = async () => {
  return window.electronAPI?.invoke("live-display:hide");
};

const closeLiveDisplay = async () => {
  return window.electronAPI?.invoke("live-display:close");
};

const getLiveDisplayStatus = async () => {
  return window.electronAPI?.invoke("live-display:getStatus");
};

interface LiveDisplayStatus {
  hasWindow: boolean;
  isVisible: boolean;
  currentDisplayId: number | null;
  bounds: { x: number; y: number; width: number; height: number } | null;
  isInitialized: boolean;
  isFullscreen: boolean;
}

export const useLiveDisplay = () => {
  const [liveDisplayStatus, setLiveDisplayStatus] =
    useState<LiveDisplayStatus | null>(null);
  const [isCreatingLive, setIsCreatingLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkLiveDisplayStatus = useCallback(async () => {
    try {
      const status = await getLiveDisplayStatus();
      setLiveDisplayStatus(status);
      setError(null);
    } catch (error) {
      console.error("Failed to get live display status:", error);
      setError("Failed to get live display status");
    }
  }, []);

  const createLive = useCallback(
    async (displayId: number) => {
      if (!displayId) {
        setError("Please select a display for live output first");
        return false;
      }

      setIsCreatingLive(true);
      setError(null);

      try {
        const result = await createLiveDisplay(displayId);
        if (result?.success) {
          await checkLiveDisplayStatus();
          console.log(
            "Live display created successfully on display:",
            displayId
          );
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to create live display:", error);
        setError("Failed to create live display");
        return false;
      } finally {
        setIsCreatingLive(false);
      }
    },
    [checkLiveDisplayStatus]
  );

  const showLive = useCallback(async () => {
    try {
      await showLiveDisplay();
      await checkLiveDisplayStatus();
      setError(null);
    } catch (error) {
      console.error("Failed to show live display:", error);
      setError("Failed to show live display");
    }
  }, [checkLiveDisplayStatus]);

  const hideLive = useCallback(async () => {
    try {
      await hideLiveDisplay();
      await checkLiveDisplayStatus();
      setError(null);
    } catch (error) {
      console.error("Failed to hide live display:", error);
      setError("Failed to hide live display");
    }
  }, [checkLiveDisplayStatus]);

  const closeLive = useCallback(async () => {
    try {
      await closeLiveDisplay();
      await checkLiveDisplayStatus();
      setError(null);
    } catch (error) {
      console.error("Failed to close live display:", error);
      setError("Failed to close live display");
    }
  }, [checkLiveDisplayStatus]);

  // Initialize status check on mount
  useEffect(() => {
    checkLiveDisplayStatus();
  }, [checkLiveDisplayStatus]);

  return {
    liveDisplayStatus,
    isCreatingLive,
    error,
    createLive,
    showLive,
    hideLive,
    closeLive,
    refreshStatus: checkLiveDisplayStatus,
  };
};
