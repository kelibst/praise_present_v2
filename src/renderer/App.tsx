import React from "react";
import AppRoutes from "../routes";
import { usePresentationInit } from "../hooks/usePresentationInit";
import LiveDisplayRenderer from "../components/LiveDisplayRenderer";


const App: React.FC = () => {
  // Check if we're in live display mode via query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isLiveDisplayMode = urlParams.get("mode") === "live-display";

  console.log("App.tsx: Current URL:", window.location.href);
  console.log("App.tsx: Query params:", window.location.search);
  console.log("App.tsx: Live display mode:", isLiveDisplayMode);

  // If this is the live display window, render only the LiveDisplayRenderer
  if (isLiveDisplayMode) {
    console.log("App.tsx: Rendering LiveDisplayRenderer for live display mode");
    return <LiveDisplayRenderer width={1920} height={1080} />;
  }

  // Main application component with initialization
  const MainApp: React.FC = () => {
    // Initialize presentation system with placeholders
    usePresentationInit();

    return (
      <div className="app-window">
        <div className="app-content">
          {/* Custom Title Bar */}

          {/* Main Application Content */}
          <div className="flex-1 overflow-y-auto">
            <AppRoutes />
          </div>
        </div>
      </div>
    );
  };

  // Regular main application mode
  return <MainApp />;
};

export default App;
