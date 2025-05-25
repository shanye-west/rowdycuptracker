import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

// Define the Round type if not imported from elsewhere
type Round = {
  id: number;
  number: number;
  format?: string;
};

// Define supporting types for MatchWithDetails
type Player = {
  id: number;
  name: string;
};

type MatchPlayer = {
  id: number;
  player: Player;
  teamId: number;
};

type Team = {
  id: number;
  name: string;
};

type MatchWithDetails = {
  id: number;
  round: Round;
  team1: Team;
  team2: Team;
  team1Id: number;
  team2Id: number;
  team1Score: number;
  team2Score: number;
  team1Status?: string | null;
  team2Status?: string | null;
  matchPlayers: MatchPlayer[];
  status: string | null;
  currentHole: number;
};

export default function Matches() {
  const [selectedRound, setSelectedRound] = useState(1);

  const { data: rounds = [] } = useQuery<Round[]>({
    queryKey: ['/api/rounds'],
  });

  // Fetch matches dynamically from the API
  const { data: matches = [], isLoading } = useQuery<MatchWithDetails[]>({
    queryKey: [`/api/rounds/${selectedRound}/matches`],
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'live': return 'Live';
      case 'completed': return 'Final';
      default: return 'Upcoming';
    }
  };

  return (
    <div className="bg-golf-gradient min-h-screen text-white">
      <AppHeader />
      
      <main className="max-w-md mx-auto pb-20">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Matches</h1>

          {/* Round Selection */}
          <div className="glass-effect rounded-xl p-1 mb-6">
            <div className="grid grid-cols-4 gap-1">
              {rounds.map((round) => (
                <button
                  key={round.id}
                  onClick={() => setSelectedRound(round.number)}
                  className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                    selectedRound === round.number
                      ? 'bg-green-400 text-gray-900'
                      : 'hover:bg-white/10'
                  }`}
                >
                  Round {round.number}
                </button>
              ))}
            </div>
          </div>

          {/* Matches List */}
          <div className="space-y-4">
            {matches.length === 0 && !isLoading && (
              <Card className="glass-effect border-white/20 bg-transparent">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-300">No matches scheduled for this round yet.</p>
                </CardContent>
              </Card>
            )}
            {matches.map((match) => (
              <Card key={match.id} className="glass-effect border-white/20 bg-transparent">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(match.status)}`} />
                    <div>
                      <p className="text-sm font-medium">{`Match ${match.id}`}</p>
                      <p className="text-xs text-gray-300">
                        {match.round.format} • Hole {match.currentHole}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Button variant="outline" size="sm" className="text-white border-white/30">
                      {getStatusText(match.status)}
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  {/* Team 1 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                      <div>
                        <p className="font-medium">{match.team1.name}</p>
                        <p className="text-xs text-gray-300">
                          {match.matchPlayers
                            .filter(mp => mp.teamId === match.team1Id)
                            .map(mp => mp.player.name)
                            .join(' / ')}
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                      <div>
                        <p className="font-medium">{match.team2.name}</p>
                        <p className="text-xs text-gray-300">
                          {match.matchPlayers
                            .filter(mp => mp.teamId === match.team2Id)
                            .map(mp => mp.player.name)
                            .join(' / ')}
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

                  {/* Match Actions */}
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <Button variant="ghost" size="sm" className="text-green-400 hover:text-white">
                      View Scorecard
                    </Button>
                    {match.status === 'live' && (
                      <Button variant="ghost" size="sm" className="text-green-400 hover:text-white">
                        Update Score
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
