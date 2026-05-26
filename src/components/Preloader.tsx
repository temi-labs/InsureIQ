import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { appConfig } from '../config';

export default function Preloader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(8px)', scale: 1.05 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] bg-[#fafafa] flex flex-col items-center justify-center h-[100dvh] w-screen"
        >
          <div className="relative flex flex-col justify-center items-center">
            
            <motion.div 
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               className="relative w-28 h-28 flex items-center justify-center mb-6"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-24 h-24 drop-shadow-xl">
                <motion.path 
                  d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                  stroke="var(--color-primary)" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0, fill: "rgba(236, 94, 36, 0)" }}
                  animate={{ pathLength: 1, opacity: 1, fill: "rgba(236, 94, 36, 0.05)" }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
                <motion.path 
                  d="M12 22V12"
                  stroke="var(--color-primary)" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut", delay: 0.4 }}
                />
                <motion.path 
                  d="M12 12 3.5 7"
                  stroke="var(--color-primary)" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut", delay: 0.7 }}
                />
                <motion.path 
                  d="M12 12l8.5-5"
                  stroke="var(--color-primary)" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut", delay: 1 }}
                />
              </svg>
            </motion.div>

            {/* Text */}
            <motion.div 
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
               className="text-center"
            >
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{appConfig.name}</h2>
              <div className="mt-5 flex items-center justify-center gap-2 opacity-70">
                <motion.div 
                  className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div 
                  className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div 
                  className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
