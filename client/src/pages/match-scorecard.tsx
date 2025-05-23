import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChevronLeft, Plus, Minus, Edit3 } from "lucide-react";
import type { MatchWithDetails, HoleScore } from "@shared/schema";

export default function MatchScorecard() {
  const { matchId } = useParams();
  const [editingHole, setEditingHole] = useState<number | null>(null);
  const [tempScores, setTempScores] = useState<Record<number, number>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: match } = useQuery<MatchWithDetails>({
    queryKey: ['/api/matches', matchId],
  });

  const { data: holeScores = [] } = useQuery<HoleScore[]>({
    queryKey: ['/api/matches', matchId, 'scores'],
  });

  const updateScoreMutation = useMutation({
    mutationFn: async (scoreData: any) => {
      return await apiRequest('POST', '/api/hole-scores', scoreData);
    },
    onSuccess: () => {
      toast({
        title: "Score Updated",
        description: "Hole score has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/matches', matchId, 'scores'] });
      setEditingHole(null);
      setTempScores({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update score. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!match) {
    return (
      <div className="bg-golf-gradient min-h-screen text-white">
        <AppHeader />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-gray-300">Loading match...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'Live';
      case 'completed': return 'Final';
      default: return 'Upcoming';
    }
  };

  const getScoreClass = (score: number, par: number = 4) => {
    if (score === par - 2) return 'eagle';
    if (score === par - 1) return 'birdie';
    if (score === par) return 'par';
    if (score === par + 1) return 'bogey';
    return 'double-bogey';
  };

  const getPlayerScore = (playerId: number, hole: number) => {
    const score = holeScores.find(s => s.playerId === playerId && s.hole === hole);
    return score?.strokes || null;
  };

  const handleScoreEdit = (hole: number) => {
    setEditingHole(hole);
    // Initialize temp scores with current values
    const holePlayerScores: Record<number, number> = {};
    match.matchPlayers.forEach(mp => {
      const currentScore = getPlayerScore(mp.playerId, hole);
      if (currentScore) {
        holePlayerScores[mp.playerId] = currentScore;
      }
    });
    setTempScores(holePlayerScores);
  };

  const handleScoreChange = (playerId: number, change: number) => {
    setTempScores(prev => ({
      ...prev,
      [playerId]: Math.max(1, (prev[playerId] || 4) + change)
    }));
  };

  const handleSaveScores = (hole: number) => {
    Object.entries(tempScores).forEach(([playerId, strokes]) => {
      updateScoreMutation.mutate({
        matchId: parseInt(matchId!),
        playerId: parseInt(playerId),
        hole,
        strokes,
        par: 4, // Default par, could be dynamic based on course data
      });
    });
  };

  return (
    <div className="bg-golf-gradient min-h-screen text-white">
      <AppHeader />
      
      <main className="max-w-md mx-auto pb-20">
        {/* Match Header */}
        <section className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-4">
            <Link href={`/round/${match.roundId}`}>
              <Button variant="ghost" size="sm" className="p-2">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-xl">Match {match.id} Scorecard</h1>
              <p className="text-sm text-gray-300">{match.round.format}</p>
            </div>
            <Badge className={`ml-auto ${getStatusColor(match.status)} text-white`}>
              {getStatusText(match.status)}
            </Badge>
          </div>

          {/* Match Summary */}
          <Card className="glass-effect border-white/20 bg-transparent mb-6">
            <CardContent className="p-4">
              {/* Team 1 */}
              <div className="flex items-center justify-between mb-3 p-3 bg-blue-600/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">A</span>
                  </div>
                  <div>
                    <p className="font-medium">{match.team1.name}</p>
                    <p className="text-xs text-gray-300">
                      {match.matchPlayers
                        .filter(mp => mp.teamId === match.team1Id)
                        .map(mp => mp.player.name)
                        .join(' / ') || 'Players TBD'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-lg">{match.team1Score}</div>
                  {match.team1Status && (
                    <div className={`text-xs ${
                      match.team1Status.includes('UP') ? 'text-green-400' :
                      match.team1Status.includes('DN') ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {match.team1Status}
                    </div>
                  )}
                </div>
              </div>

              {/* Team 2 */}
              <div className="flex items-center justify-between p-3 bg-red-600/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">P</span>
                  </div>
                  <div>
                    <p className="font-medium">{match.team2.name}</p>
                    <p className="text-xs text-gray-300">
                      {match.matchPlayers
                        .filter(mp => mp.teamId === match.team2Id)
                        .map(mp => mp.player.name)
                        .join(' / ') || 'Players TBD'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-lg">{match.team2Score}</div>
                  {match.team2Status && (
                    <div className={`text-xs ${
                      match.team2Status.includes('UP') ? 'text-green-400' :
                      match.team2Status.includes('DN') ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {match.team2Status}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Hole-by-Hole Scorecard */}
        <section className="px-4 mb-6">
          <h2 className="font-semibold text-xl mb-4">Hole-by-Hole Scores</h2>
          
          <div className="space-y-3">
            {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => (
              <Card key={hole} className="glass-effect border-white/20 bg-transparent">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Hole {hole}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">Par 4</Badge>
                      {match.status === 'live' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleScoreEdit(hole)}
                          className="p-1"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {editingHole === hole ? (
                    // Editing Mode
                    <div className="space-y-3">
                      {match.matchPlayers.map(mp => {
                        const score = tempScores[mp.playerId] || getPlayerScore(mp.playerId, hole) || 4;
                        return (
                          <div key={mp.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{mp.player.name}</p>
                              <p className="text-xs text-gray-400">{mp.teamId === match.team1Id ? match.team1.name : match.team2.name}</p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleScoreChange(mp.playerId, -1)}
                                className="w-8 h-8 p-0"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              
                              <div className={`hole-score ${getScoreClass(score)}`}>
                                {score}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleScoreChange(mp.playerId, 1)}
                                className="w-8 h-8 p-0"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingHole(null)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => handleSaveScores(hole)}
                          disabled={updateScoreMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {updateScoreMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="grid grid-cols-1 gap-2">
                      {match.matchPlayers.map(mp => {
                        const score = getPlayerScore(mp.playerId, hole);
                        return (
                          <div key={mp.id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{mp.player.name}</p>
                              <p className="text-xs text-gray-400">{mp.teamId === match.team1Id ? match.team1.name : match.team2.name}</p>
                            </div>
                            
                            <div className="text-right">
                              {score ? (
                                <div className={`hole-score ${getScoreClass(score)}`}>
                                  {score}
                                </div>
                              ) : (
                                <div className="text-gray-500 text-sm">-</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}