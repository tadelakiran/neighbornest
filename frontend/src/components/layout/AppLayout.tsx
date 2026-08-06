import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export interface AppLayoutProps {
  children: React.ReactNode;
  user?: {
    fullName?: string;
    role?: string;
    city?: string;
  };
  onLogout?: () => void;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  user,
  onLogout,
  className = ""
}) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <Navbar 
        user={user} 
        onMenuClick={() => setSidebarOpen(true)} 
        onLogout={onLogout} 
      />

      <div className="flex-1 flex relative">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        {/* Main Content Area */}
        <motion.main 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full ${className}`}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};