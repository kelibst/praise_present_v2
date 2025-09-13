import React from "react";
import { Routes, Route } from "react-router-dom";

// Layout components
import Homepage from "./pages/Homepage";
import RenderingDemo from "./components/RenderingDemo";
import RenderingTestSuite from "./components/RenderingTestSuite";

// Page components from pages folder


const AppRoutes = () => {
  return (
    <Routes>
      {/* Main application routes with layout */}
      <Route path="/" element={<Homepage />} />
      <Route path="/rendering-demo" element={<RenderingDemo />} />
      <Route path="/test-suite" element={<RenderingTestSuite />} />
    </Routes>
  );
};

export default AppRoutes;
