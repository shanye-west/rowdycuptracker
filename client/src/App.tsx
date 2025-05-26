// client/src/App.tsx
import React from "react";
import { Switch, Route } from "wouter";
import { useLocation } from "wouter"; // For active navigation
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initializePWA } from "./lib/pwa";
import { AuthProvider } from "./lib/auth";
import { WebSocketProvider } from "./lib/websocket";

import TournamentHome from "@/pages/tournament-home";
import AdminTournamentHome from "@/pages/admin-tournament-home";
import RoundPage from "@/pages/round-page";
import MatchScorecard from "@/pages/match-scorecard";
import TeamRosters from "@/pages/team-rosters";
import NotFound from "@/pages/not-found";
import BottomNavigation from "@/components/BottomNavigation";

const App = () => {
  useEffect(() => {
    initializePWA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WebSocketProvider>
            <Switch>
              <Route path="/" component={TournamentHome} />
              <Route path="/admin" component={AdminTournamentHome} />
              <Route path="/rounds/:id" component={RoundPage} />
              <Route path="/matches/:id" component={MatchScorecard} />
              <Route path="/teams" component={TeamRosters} />
              <Route component={NotFound} />
            </Switch>
            <BottomNavigation />
            <Toaster />
          </WebSocketProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;