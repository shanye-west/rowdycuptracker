// client/src/components/AppHeader.tsx
import { useState, useEffect } from "react";
import { Menu, Wifi, WifiOff, Home, Users, TrendingUp, Clock, LogOut, Settings, UserCircle } from "lucide-react"; // Added UserCircle
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel, // Added DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import UserLogin from "@/components/UserLogin"; // Corrected import name
import { useAuth } from "@/lib/auth";

export default function AppHeader() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user, isAuthenticated, isAdmin, logout, loading: authLoading } = useAuth(); // Added authLoading
  const [currentLocation, setLocation] = useLocation(); // For programmatic navigation

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
    setLocation("/"); // Redirect to home after logout
  };

  const handleAdminNav = () => {
    setLocation("/admin");
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
                  disabled={authLoading} // Disable while auth state is loading
                >
                  {authLoading ? <UserCircle className="w-5 h-5 text-gray-400 animate-pulse" /> : <Menu className="w-5 h-5 text-white" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-gray-900 border-gray-700 force-white-dropdown" 
                align="end"
              >
                {isAuthenticated && user && (
                  <>
                    <DropdownMenuLabel className="text-gray-400 px-2 py-1.5 text-xs">
                      Signed in as <span className="font-medium text-green-300">{user.username}</span>
                      {isAdmin && <span className="text-yellow-400"> (Admin)</span>}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                  </>
                )}
                
                <Link href="/">
                  <DropdownMenuItem className="cursor-pointer data-[highlighted]:bg-gray-700">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Tournament Home</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/teams">
                  <DropdownMenuItem className="cursor-pointer data-[highlighted]:bg-gray-700">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Team Rosters</span>
                  </DropdownMenuItem>
                </Link>
                {/* Placeholder links - to be implemented later */}
                <DropdownMenuItem className="cursor-pointer data-[highlighted]:bg-gray-700 opacity-50">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Sportsbook</span>
                  <span className="ml-auto text-xs text-gray-400">Soon</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer data-[highlighted]:bg-gray-800 opacity-50">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>History</span>
                  <span className="ml-auto text-xs text-gray-400">Soon</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-gray-700" />
                
                {isAuthenticated ? (
                  <>
                    {isAdmin && currentLocation !== "/admin" && (
                       <DropdownMenuItem 
                          className="cursor-pointer data-[highlighted]:bg-gray-700"
                          onSelect={handleAdminNav}
                        >
                         <Settings className="mr-2 h-4 w-4" />
                         <span>Admin Panel</span>
                       </DropdownMenuItem>
                    )}
                     <DropdownMenuItem 
                      className="cursor-pointer data-[highlighted]:bg-gray-700 logout-item" // logout-item for specific red text
                      onSelect={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  // UserLogin component is rendered as a DropdownMenuItem via its trigger prop
                  <UserLogin />
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}