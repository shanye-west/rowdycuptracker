import { useLocation } from "wouter";
import { BarChart3, Profiles, Trophy, Settings } from "lucide-react";
import { Link } from "wouter";

export default function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/scoreboard", icon: BarChart3, label: "Scoreboard" },
    { path: "/matches", icon: Profiles, label: "Matches" },
    { path: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-effect border-t border-white/10">
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-4 py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location === path || (path === "/scoreboard" && location === "/");
            
            return (
              <Link key={path} href={path}>
                <button className={`flex flex-col items-center py-3 px-2 transition-colors ${
                  isActive ? 'text-green-400' : 'text-gray-400 hover:text-white'
                }`}>
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
