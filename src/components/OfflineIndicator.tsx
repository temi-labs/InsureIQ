import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user } = useAuth(); // Ensure we only show it when logged in, or we can check user state

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You're Offline</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please check your internet connection. This dialog will close automatically when you are back online.
          </p>
          <div className="py-2.5 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium animate-pulse">
            Waiting for connection...
          </div>
        </div>
      </div>
    </div>
  );
}
