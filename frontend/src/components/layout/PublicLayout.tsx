import React from 'react';
import { motion } from 'framer-motion';

export interface PublicLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  title,
  subtitle,
  className = ""
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar */}
      <header className="w-full px-6 md:px-12 py-6 flex items-center justify-between border-b border-white/10 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 font-black text-lg">
            N
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">
              NestMatch <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">Portal</span>
            </h1>
          </div>
        </div>
        <div className="text-xs text-white/60 font-medium">
          Secure Community Platform
        </div>
      </header>

      {/* Main Container */}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-5xl mx-auto w-full relative z-10 ${className}`}
      >
        {title && (
          <div className="text-center mb-10 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm md:text-base text-white/70 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="w-full">
          {children}
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="w-full px-6 md:px-12 py-6 border-t border-white/10 text-center text-xs text-white/50 relative z-10">
        <p>&copy; {new Date().getFullYear()} NestMatch Pro. All rights reserved. Secure community infrastructure.</p>
      </footer>
    </div>
  );
};