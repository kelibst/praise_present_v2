import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AnimatedSidebar from './AnimatedSidebar';
// import { useBibleInit } from '../../hooks/useBibleInit';

const AppLayout: React.FC = () => {
	const [sidebarOpen, setSidebarOpen] = useState(true);

	// Initialize Bible data when the app starts
	// useBibleInit(); // Temporarily disabled

	return (
		<div className="min-h-screen flex flex-col overflow-y-auto min-w-screen">
			{/* Animated Sidebar */}
			<AnimatedSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
			{/* Main content shifts right when aside is open */}
			<main className={`flex-1 p-0 md:p-8 transition-all overflow-y-auto duration-500 ${sidebarOpen ? 'md:ml-64' : ''}`}>
				<Outlet />
			</main>
		</div>
	);
};

export default AppLayout; 