import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { MatchWithDetails, HoleScore } from "@shared/schema";
import MatchPlayScorecard from "@/components/MatchPlayScorecard";
import BestBallScorecard from "@/components/BestBallScorecard";

export default function MatchScorecard() {
  const { isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { matchId } = useParams();
  const numericMatchId = parseInt(matchId || "", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: match,
    isLoading: matchLoading,
    error: matchError,
  } = useQuery<MatchWithDetails | undefined>({
    queryKey: ["/api/matches", matchId],
    queryFn: async () => {
      const res = await fetch("/api/matches");
      if (!res.ok) throw new Error("Failed to fetch matches");
      const matches: MatchWithDetails[] = await res.json();
      return matches.find((m) => m.id === numericMatchId);
    },
    enabled: !!numericMatchId,
  });

  const { data: holeScores = [] } = useQuery<HoleScore[]>({
    queryKey: ["/api/matches", matchId, "scores"],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}/scores`);
      if (!res.ok) throw new Error("Failed to fetch hole scores");
      return res.json();
    },
    enabled: !!matchId,
  });

  const updateScoreMutation = useMutation({
    mutationFn: async ({ hole, team1Score, team2Score }: { hole: number; team1Score: number; team2Score: number }) => {
      await apiRequest("POST", "/api/hole-scores", {
        matchId: numericMatchId,
        hole,
        playerId: 1,
        strokes: team1Score,
        par: 4
      });
      
      await apiRequest("POST", "/api/hole-scores", {
        matchId: numericMatchId,
        hole,
        playerId: 13,
        strokes: team2Score,
        par: 4
      });
    },
    onSuccess: () => {
      toast({
        title: "Score Updated",
        description: "Hole scores have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches", matchId, "scores"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update scores. Please try again.",
        variant: "destructive",
      });
    },
  });

  const playerScoreMutation = useMutation({
    mutationFn: async ({ hole, playerId, grossScore }: { hole: number; playerId: number; grossScore: number }) => {
      await apiRequest("POST", "/api/hole-scores", {
        matchId: numericMatchId,
        hole,
        playerId,
        strokes: grossScore,
        par: 4
      });
    },
    onSuccess: () => {
      toast({
        title: "Score Updated",
        description: "Player score has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches", matchId, "scores"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update score. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redirect admin profiles to admin page
  useEffect(() => {
    if (!loading && isAdmin) {
      setLocation("/admin");
    }
  }, [isAdmin, loading, setLocation]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="bg-golf-gradient min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  // If admin, don't render content (redirect is happening)
  if (isAdmin) {
    return null;
  }

  if (matchLoading) {
    return (
      <div className="bg-golf-gradient min-h-screen text-white">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-300">Loading match...</p>
        </div>
      </div>
    );
  }

  if (matchError || !match) {
    return (
      <div className="bg-golf-gradient min-h-screen text-white">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-300">Match not found.</p>
          <Link href="/matches">
            <Button variant="outline" className="mt-4 border-white/20 text-white hover:bg-white/10">
              Back to Matches
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isMatchPlayFormat = match.round.format.includes('Scramble') || 
                           match.round.format.includes('Shamble');
  const isBestBallFormat = match.round.format.includes('Best Ball');

  const handleUpdateScore = (hole: number, team1Score: number, team2Score: number) => {
    updateScoreMutation.mutate({ hole, team1Score, team2Score });
  };

  const handleUpdatePlayerScore = (hole: number, playerId: number, grossScore: number) => {
    playerScoreMutation.mutate({ hole, playerId, grossScore });
  };

  return (
    <div className="bg-golf-gradient min-h-screen text-white">
      <AppHeader />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center space-x-3 mb-6">
          <Link href={`/rounds/${match.roundId}`}>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-white/10">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-2xl">Match Scorecard</h1>
            <p className="text-green-200">
              {match.team1.name} vs {match.team2.name}
            </p>
          </div>
        </div>

        <Card className="glass-effect border-white/20 bg-transparent mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-300">Format:</span>
                <span className="ml-2 font-medium">{match.round.format}</span>
              </div>
              <div>
                <span className="text-gray-300">Course:</span>
                <span className="ml-2 font-medium">{match.round.course?.name ?? "Unknown Course"}</span>
              </div>
              <div>
                <span className="text-gray-300">Round:</span>
                <span className="ml-2 font-medium">Round {match.round.number}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isMatchPlayFormat ? (
          <MatchPlayScorecard 
            match={match} 
            holeScores={holeScores}
            onUpdateScore={handleUpdateScore}
          />
        ) : isBestBallFormat ? (
          <BestBallScorecard 
            match={match} 
            holeScores={holeScores}
            onUpdateScore={handleUpdatePlayerScore}
          />
        ) : (
          <Card className="glass-effect border-white/20 bg-transparent">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-4">Scorecard Format</h3>
              <p className="text-gray-300 mb-4">
                {match.round.format} scoring will be implemented separately.
              </p>
              <p className="text-sm text-gray-400">
                Currently supporting: 2-man Scramble, 2-man Shamble, 4-man Scramble, and 2-man Best Ball formats.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}