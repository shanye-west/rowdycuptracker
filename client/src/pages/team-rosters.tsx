import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Users, Crown } from "lucide-react";
import type { TeamWithStandings } from "@shared/schema";

export default function TeamRosters() {
  const { data: teams = [] } = useQuery<TeamWithStandings[]>({
    queryKey: ['/api/teams'],
  });

  return (
    <div className="bg-golf-gradient min-h-screen text-white">
      <AppHeader />
      
      <main className="max-w-md mx-auto pb-20">
        {/* Header */}
        <section className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="p-2">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-green-400" />
              <h1 className="font-bold text-2xl">Team Rosters</h1>
            </div>
          </div>
        </section>

        {/* Teams */}
        <section className="px-4 mb-6">
          <div className="space-y-6">
            {teams.map((team) => (
              <Card key={team.id} className="glass-effect border-white/20 bg-transparent">
                <CardHeader className={`${
                  team.name === 'Aviators' ? 'bg-blue-600/20' : 'bg-red-600/20'
                } rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        team.name === 'Aviators' ? 'bg-blue-600' : 'bg-red-600'
                      }`}>
                        <span className="text-white font-bold text-lg">
                          {team.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{team.name}</h2>
                        <div className="flex items-center space-x-1 text-sm text-gray-300">
                          <Crown className="w-4 h-4 text-yellow-400" />
                          <span>{team.captain}, Captain</span>
                        </div>
                      </div>
                    </CardTitle>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-green-400">
                        {parseFloat(team.standings?.totalPoints || "0").toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-300">Total Points</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4">
                  {team.players && team.players.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {team.players.map((player, index) => (
                        <div 
                          key={player.id}
                          className={`p-3 rounded-lg ${
                            player.name === team.captain 
                              ? 'bg-yellow-400/20 border border-yellow-400/30' 
                              : 'bg-gray-800/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium flex items-center space-x-2">
                                  <span>{player.name}</span>
                                  {player.name === team.captain && (
                                    <Crown className="w-4 h-4 text-yellow-400" />
                                  )}
                                </p>
                                {player.handicap && (
                                  <p className="text-xs text-gray-400">
                                    Handicap: {player.handicap}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Roster to be announced</p>
                      <p className="text-sm">Players will be selected after the draft</p>
                    </div>
                  )}
                  
                  {/* Team Stats */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <div className="font-mono font-bold text-green-400">
                          {team.players?.length || 0}
                        </div>
                        <div className="text-gray-300">Players</div>
                      </div>
                      <div>
                        <div className="font-mono font-bold text-green-400">
                          {team.players?.reduce((avg, p) => avg + parseFloat(p.handicap || "0"), 0) / (team.players?.length || 1) || 0}
                        </div>
                        <div className="text-gray-300">Avg Handicap</div>
                      </div>
                      <div>
                        <div className="font-mono font-bold text-green-400">
                          {parseFloat(team.standings?.totalPoints || "0").toFixed(1)}
                        </div>
                        <div className="text-gray-300">Points</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Draft Information */}
        <section className="px-4 mb-6">
          <Card className="glass-effect border-white/20 bg-transparent">
            <CardHeader>
              <CardTitle className="text-lg">2025 Draft Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Draft Date:</span>
                  <span className="font-medium">TBD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Players:</span>
                  <span className="font-medium">24 (12 per team)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Selection Format:</span>
                  <span className="font-medium">Captain's Pick</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Current Status:</span>
                  <span className="font-medium text-yellow-400">Pending Draft</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}