import { useState, useEffect } from "react";
import { Menu, Wifi, WifiOff, Home, Profiles, TrendingUp, Clock, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProfileLogin from "@/components/ProfileLogin";
import { useAuth } from "@/lib/auth";

export default function AppHeader() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { profile, isAuthenticated, isAdmin, logout } = useAuth();

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

  const handleLogout = async () => {
    await logout();
    window.location.href = "/"; // Redirect to home after logout
  };

  return (
    <header className="sticky top-0 z-50 glass-effect">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                <span className="text-gray-900 font-bold text-sm">RC</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">Rowdy Cup</h1>
                <p className="text-xs text-gray-300">Live Scoreboard</p>
              </div>
            </div>
          </Link>
          
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Menu className="w-5 h-5 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-gray-900 border-gray-700 force-white-dropdown" 
                align="end"
              >
                <Link href="/">
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Tournament Home</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/teams">
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                    <Profiles className="mr-2 h-4 w-4" />
                    <span>Team Rosters</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800 opacity-50">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Sportsbook</span>
                  <span className="ml-auto text-xs text-gray-400">Coming Soon</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800 opacity-50">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>History</span>
                  <span className="ml-auto text-xs text-gray-400">Coming Soon</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                
                {/* Authentication Section */}
                {isAuthenticated ? (
                  <>
                    <div className="px-2 py-1 text-sm text-gray-400">
                      Signed in as <span className="text-green-400">{profile?.username}</span>
                      {isAdmin && <span className="ml-1 text-yellow-400">(Admin)</span>}
                    </div>
                    {/* Only show Admin Panel link if NOT admin, since admin view is default */}
                    {!isAdmin && (
                      <Link href="/admin">
                        <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-gray-800 logout-item"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <ProfileLogin />
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}