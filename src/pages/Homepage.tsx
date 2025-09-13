import React from "react";
import { Link } from "react-router-dom";

const Homepage = () => {
  return (
    <div className="flex min-h-screen">
      {/* Centered Content */}
      <div className="flex flex-col justify-center items-center w-full bg-gradient-to-b from-blue-500 to-purple-500 text-white">
        {/* Logo/Icon */}
        <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-8">
          <div className="text-6xl">⛪</div>
        </div>

        {/* Text Elements */}
        <h1 className="text-4xl font-bold mb-4 text-center">
          PraisePresent
        </h1>

        <p className="text-xl mb-8 opacity-90 text-center max-w-md">
          Church presentation software with database and multi-display support
        </p>

        {/* Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">✅ Phase 1 Complete</h3>
          <ul className="text-sm space-y-2 opacity-90">
            <li>• PowerPoint-style rendering engine</li>
            <li>• Hardware-accelerated canvas renderer</li>
            <li>• Shape-based content model</li>
            <li>• 60fps performance target</li>
            <li>• Text, image, and background shapes</li>
          </ul>
        </div>

        {/* Demo Links */}
        <div className="flex gap-4">
          <Link
            to="/rendering-demo"
            className="bg-white/20 hover:bg-white/30 transition-colors duration-200 backdrop-blur-sm rounded-lg px-6 py-3 text-lg font-semibold"
          >
            🚀 View Demo
          </Link>
          <Link
            to="/test-suite"
            className="bg-white/20 hover:bg-white/30 transition-colors duration-200 backdrop-blur-sm rounded-lg px-6 py-3 text-lg font-semibold"
          >
            🧪 Test Suite
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
