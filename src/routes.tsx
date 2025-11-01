import React from "react";
import { Routes, Route } from "react-router-dom";

// Layout components
import AppLayout from "./components/layout/AppLayout";

// Page components
import Homepage from "./pages/Homepage";
import LivePresentationPage from "./pages/LivePresentationPage";
import SongsPage from "./pages/SongsPage";
import SongDetailsPage from "./pages/SongDetailsPage";
import ScripturePage from "./pages/ScripturePage";
import SettingsPage from "./pages/SettingsPage";
import MediaPage from "./pages/MediaPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import AnnouncementDetailsPage from "./pages/AnnouncementDetailsPage";
import SermonsPage from "./pages/SermonsPage";
import SermonDetailsPage from "./pages/SermonDetailsPage";




const AppRoutes = () => {
  return (
    <Routes>
      {/* Main application routes */}
      <Route path="/" element={<Homepage />} />
      <Route element={<AppLayout />}>
        <Route path="/scripture" element={<ScripturePage />} />
        <Route path="/songs" element={<SongsPage />} />
        <Route path="/songs/:songId" element={<SongDetailsPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/announcements/:announcementId" element={<AnnouncementDetailsPage />} />
        <Route path="/sermons" element={<SermonsPage />} />
        <Route path="/sermons/:sermonId" element={<SermonDetailsPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/live" element={<LivePresentationPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
