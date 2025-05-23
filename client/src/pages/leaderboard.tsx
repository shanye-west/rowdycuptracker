import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import type { TeamWithStandings, TournamentStanding } from "@shared/schema";

export default function Leaderboard() {
  const { data: teams = [] } = useQuery<TeamWithStandings[]>({
    queryKey: ['/api/teams'],
  });

  const { data: standings = [] } = useQuery<(TournamentStanding & { team: any })[]>({
    queryKey: ['/api/standings'],
  });

  // Sort teams by total points
  const sortedTeams = [...teams].sort((a, b) => {
    const aTotal = parseFloat(a.standings?.totalPoints || "0");
    const bTotal = parseFloat(b.standings?.totalPoints || "0");
    return bTotal - aTotal;
  });

  return (
    <div className="bg-golf-gradient min-h-screen text-white">
      <AppHeader />
      
      <main className="max-w-md mx-auto pb-20">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-6">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-2xl font-bold">Leaderboard</h1>
          </div>

          {/* Overall Standings */}
          <Card className="glass-effect border-white/20 bg-transparent mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Tournament Standings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedTeams.map((team, index) => {
                  const totalPoints = parseFloat(team.standings?.totalPoints || "0");
                  const isLeading = index === 0;
                  
                  return (
                    <div 
                      key={team.id}
                      className={`p-4 rounded-lg ${
                        team.name === 'Aviators' ? 'bg-blue-600/20' : 'bg-red-600/20'
                      } ${isLeading ? 'ring-2 ring-yellow-400' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl font-bold text-gray-400">
                            #{index + 1}
                          </div>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            team.name === 'Aviators' ? 'bg-blue-600' : 'bg-red-600'
                          }`}>
                            <span className="text-white font-bold">
                              {team.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{team.name}</h3>
                            <p className="text-sm text-gray-300">{team.captain}, Captain</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-mono font-bold">
                            {totalPoints.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-300">Points</div>
                          {isLeading && (
                            <div className="flex items-center text-yellow-400 text-xs mt-1">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Leading
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Round-by-Round Breakdown */}
          <Card className="glass-effect border-white/20 bg-transparent mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Round Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-2">Team</th>
                      <th className="text-center py-2">R1</th>
                      <th className="text-center py-2">R2</th>
                      <th className="text-center py-2">R3</th>
                      <th className="text-center py-2">R4</th>
                      <th className="text-center py-2 font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTeams.map((team) => (
                      <tr key={team.id} className="border-b border-white/10">
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full ${
                              team.name === 'Aviators' ? 'bg-blue-600' : 'bg-red-600'
                            }`}></div>
                            <span className="font-medium">{team.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 font-mono">
                          {team.standings?.round1Points || '-'}
                        </td>
                        <td className="text-center py-3 font-mono">
                          {team.standings?.round2Points || '-'}
                        </td>
                        <td className="text-center py-3 font-mono">
                          {team.standings?.round3Points || '-'}
                        </td>
                        <td className="text-center py-3 font-mono">
                          {team.standings?.round4Points || '-'}
                        </td>
                        <td className="text-center py-3 font-mono font-bold">
                          {parseFloat(team.standings?.totalPoints || "0").toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Progress */}
          <Card className="glass-effect border-white/20 bg-transparent">
            <CardHeader>
              <CardTitle className="text-xl">Tournament Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-green-400">50%</div>
                  <div className="text-sm text-gray-300">Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-green-400">24</div>
                  <div className="text-sm text-gray-300">Total Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-green-400">12</div>
                  <div className="text-sm text-gray-300">Matches Left</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-green-400">2</div>
                  <div className="text-sm text-gray-300">Days Left</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
