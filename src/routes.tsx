import React from "react";
import { Routes, Route } from "react-router-dom";

// Layout components
import AppLayout from "./components/layout/AppLayout";

// Page components
import Homepage from "./pages/Homepage";
import LivePresentationPage from "./pages/LivePresentationPage";
import SongsPage from "./pages/SongsPage";
import ScripturePage from "./pages/ScripturePage";


const SettingsPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Settings</h1>
    <p>Settings page coming soon...</p>
  </div>
);


const AppRoutes = () => {
  return (
    <Routes>
      {/* Main application routes */}
      <Route path="/" element={<Homepage />} />
      <Route element={<AppLayout />}>
        <Route path="/scripture" element={<ScripturePage />} />
        <Route path="/songs" element={<SongsPage />} />
        <Route path="/live" element={<LivePresentationPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
