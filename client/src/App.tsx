import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initializePWA } from "./lib/pwa";
import { WebSocketProvider } from "./lib/websocket";

import Scoreboard from "@/pages/scoreboard";
import Matches from "@/pages/matches";
import Leaderboard from "@/pages/leaderboard";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Scoreboard} />
      <Route path="/scoreboard" component={Scoreboard} />
      <Route path="/matches" component={Matches} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/settings" component={Settings} />
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
