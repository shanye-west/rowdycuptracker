import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Users, Crown, Filter } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import type { TeamWithStandings } from "@shared/schema";

export default function TeamRosters() {
  const { isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  
  const { data: teams = [] } = useQuery<TeamWithStandings[]>({
    queryKey: ['/api/teams'],
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

  const filteredTeams = selectedTeam ? teams.filter(team => team.id === selectedTeam) : teams;

  // Helper function to get Tailwind classes based on team color
  const getTeamButtonClasses = (team: TeamWithStandings, isSelected: boolean) => {
    const isAviators = team.color === '#1E40AF';
    
    if (isSelected) {
      return isAviators 
        ? "bg-blue-600 hover:bg-blue-700 text-white" 
        : "bg-red-600 hover:bg-red-700 text-white";
    } else {
      return "border-white/20 text-white hover:bg-white/10";
    }
  };

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
              <h2 className="font-semibold text-xl">Team Rosters</h2>
            </div>
          </div>

          {/* Team Filter Toggle */}
          <Card className="glass-effect border-white/20 bg-transparent mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Filter className="w-5 h-5 text-green-400" />
                <span className="font-semibold">Filter Teams</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedTeam === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTeam(null)}
                  className={selectedTeam === null ? "bg-green-600 hover:bg-green-700" : "border-white/20 text-white hover:bg-white/10"}
                >
                  All Teams
                </Button>
                {teams.map(team => (
                  <Button
                    key={team.id}
                    variant={selectedTeam === team.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTeam(team.id)}
                    className={getTeamButtonClasses(team, selectedTeam === team.id)}
                  >
                    {team.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Teams */}
        <section className="px-4 mb-6">
          <div className="space-y-6">
            {filteredTeams.map((team) => (
              <Card key={team.id} className="glass-effect border-white/20 bg-transparent">
                <CardHeader className={`${
                  team.color === '#1E40AF' ? 'bg-blue-600/20' : 'bg-red-600/20'
                } rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        team.color === '#1E40AF' ? 'bg-blue-600' : 'bg-red-600'
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
                    <div className="text-center text-gray-400 py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No players found for this team.</p>
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


      </main>
    </div>
  );
}