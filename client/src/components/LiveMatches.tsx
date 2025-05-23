import { Button } from "@/components/ui/button";
import type { MatchWithDetails } from "@shared/schema";

interface LiveMatchesProps {
  matches: MatchWithDetails[];
  onUpdateScore: (matchId: number) => void;
}

export default function LiveMatches({ matches, onUpdateScore }: LiveMatchesProps) {
  const getStatusColor = (status: string) => {
    if (status?.includes('UP')) return 'text-green-400';
    if (status?.includes('DN')) return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <section className="px-4 mb-6">
      <h3 className="font-semibold text-lg mb-4">Live Matches</h3>
      
      {matches.length === 0 ? (
        <div className="glass-effect rounded-xl p-8 text-center">
          <p className="text-gray-300">No live matches at the moment.</p>
        </div>
      ) : (
        matches.map((match) => (
          <div key={match.id} className="glass-effect rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-green-400">
                Match {match.id} - Group {String.fromCharCode(64 + match.id)}
              </span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                Hole {match.currentHole}
              </span>
            </div>
            
            {/* Team 1 */}
            <div className="flex items-center justify-between mb-2 p-2 bg-blue-600/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {match.matchPlayers
                      .filter(mp => mp.teamId === match.team1Id)
                      .map(mp => mp.player.name)
                      .join(' / ') || 'Team Players'}
                  </p>
                  <p className="text-xs text-gray-300">{match.team1.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-lg">{match.team1Score}</div>
                {match.team1Status && (
                  <div className={`text-xs ${getStatusColor(match.team1Status)}`}>
                    {match.team1Status}
                  </div>
                )}
              </div>
            </div>

            {/* Team 2 */}
            <div className="flex items-center justify-between p-2 bg-red-600/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {match.matchPlayers
                      .filter(mp => mp.teamId === match.team2Id)
                      .map(mp => mp.player.name)
                      .join(' / ') || 'Team Players'}
                  </p>
                  <p className="text-xs text-gray-300">{match.team2.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-lg">{match.team2Score}</div>
                {match.team2Status && (
                  <div className={`text-xs ${getStatusColor(match.team2Status)}`}>
                    {match.team2Status}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-between mt-3 pt-3 border-t border-white/10">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-green-400 hover:text-white transition-colors"
              >
                View Scorecard
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-green-400 hover:text-white transition-colors"
                onClick={() => onUpdateScore(match.id)}
              >
                Update Score
              </Button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
