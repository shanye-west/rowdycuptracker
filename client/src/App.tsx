import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initializePWA } from "./lib/pwa";
import { WebSocketProvider } from "./lib/websocket";

import TournamentHome from "@/pages/tournament-home";
import RoundPage from "@/pages/round-page";
import MatchScorecard from "@/pages/match-scorecard";
import TeamRosters from "@/pages/team-rosters";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TournamentHome} />
      <Route path="/round/:roundId" component={RoundPage} />
      <Route path="/match/:matchId" component={MatchScorecard} />
      <Route path="/teams" component={TeamRosters} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    initializePWA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
