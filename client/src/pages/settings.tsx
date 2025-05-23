import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Wifi, 
  WifiOff, 
  Download, 
  Bell, 
  Shield,
  Smartphone,
  Info
} from "lucide-react";

export default function Settings() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifications, setNotifications] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  return (
    <div className="bg-golf-gradient min-h-screen text-white">
      <AppHeader />
      
      <main className="max-w-md mx-auto pb-20">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-6">
            <SettingsIcon className="w-8 h-8 text-green-400" />
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>

          {/* Connection Status */}
          <Card className="glass-effect border-white/20 bg-transparent mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
                <span>Connection Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {isOnline ? 'Connected' : 'Offline'}
                  </p>
                  <p className="text-sm text-gray-300">
                    {isOnline 
                      ? 'Real-time updates enabled' 
                      : 'Using cached data'
                    }
                  </p>
                </div>
                <Badge 
                  className={isOnline ? 'bg-green-500' : 'bg-red-500'}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* PWA Settings */}
          <Card className="glass-effect border-white/20 bg-transparent mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-green-400" />
                <span>App Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-300">Get score updates and match alerts</p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Offline Mode</p>
                  <p className="text-sm text-gray-300">Cache data for offline viewing</p>
                </div>
                <Switch
                  checked={offlineMode}
                  onCheckedChange={setOfflineMode}
                />
              </div>

              <Button 
                variant="outline" 
                className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Download for Offline Use
              </Button>
            </CardContent>
          </Card>

          {/* Tournament Info */}
          <Card className="glass-effect border-white/20 bg-transparent mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-green-400" />
                <span>Tournament Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Tournament:</span>
                <span className="font-medium">Rowdy Cup 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Dates:</span>
                <span className="font-medium">August 7-10, 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Teams:</span>
                <span className="font-medium">Aviators vs Producers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Format:</span>
                <span className="font-medium">Ryder Cup Style</span>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="glass-effect border-white/20 bg-transparent mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Data & Privacy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                Clear Cache
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                Export Tournament Data
              </Button>
              
              <div className="text-xs text-gray-400 text-center pt-2">
                App Version: 1.0.0 | Last Updated: Now
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card className="glass-effect border-white/20 bg-transparent">
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 bg-green-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-gray-900 font-bold text-xl">RC</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Rowdy Cup Live</h3>
              <p className="text-sm text-gray-300 mb-4">
                Official live scoreboard for the Rowdy Cup golf tournament. 
                Track matches, scores, and standings in real-time.
              </p>
              <div className="flex justify-center space-x-4 text-xs text-gray-400">
                <span>Made with ❤️ for golf</span>
                <span>•</span>
                <span>PWA Enabled</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
