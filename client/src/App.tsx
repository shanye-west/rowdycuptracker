import React from "react";
import { Switch, Route } from "wouter";
import { useLocation } from "wouter"; // For active navigation
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initializePWA } from "./lib/pwa";
import { AuthProvider, useAuth } from "./lib/auth"; // Import useAuth

import TournamentHome from "@/pages/tournament-home";
import AdminTournamentHome from "@/pages/admin-tournament-home";
import RoundPage from "@/pages/round-page";
import MatchScorecard from "@/pages/match-scorecard";
import TeamRosters from "@/pages/team-rosters";
import NotFound from "@/pages/not-found";
import BottomNavigation from "@/components/BottomNavigation"; // Assuming you might use this

// Custom hook for Wouter to integrate with React Router like active link concept (optional)
// const useNav = () => useLocation()[0];

// Admin Guard Component
const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        setLocation("/"); // Or to a login page
        return;
      }
      if (!isAdmin) {
        setLocation("/");
      }
    }
  }, [isAdmin, loading, isAuthenticated, setLocation]);

  if (loading || (isAuthenticated && !isAdmin)) {
    return (
      <div className="bg-golf-gradient min-h-screen text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  if (isAuthenticated && isAdmin) {
    return <>{children}</>;
  }
  return null;
};


function AppRoutes() {
  const { isAuthenticated } = useAuth(); // Get auth state

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={TournamentHome} />
          <Route path="/admin">
            <AdminGuard><AdminTournamentHome /></AdminGuard>
          </Route>
          <Route path="/rounds/:roundId" component={RoundPage} />
          <Route path="/match/:matchId" component={MatchScorecard} />
          <Route path="/teams" component={TeamRosters} />
          {/* Add other public/player routes here */}
          <Route component={NotFound} />
        </Switch>
      </main>
      {isAuthenticated && <BottomNavigation />} {/* Optionally show nav if authenticated */}
    </div>
  );
}

function App() {
  useEffect(() => {
    initializePWA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;