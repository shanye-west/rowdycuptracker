import { useState, useEffect } from "react";
import { Menu, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  return (
    <header className="sticky top-0 z-50 glass-effect">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
              <span className="text-gray-900 font-bold text-sm">RC</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">Rowdy Cup</h1>
              <p className="text-xs text-gray-300">Live Scoreboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />
              )}
              <span className="text-xs text-gray-300">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
