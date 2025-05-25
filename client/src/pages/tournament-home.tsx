import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Calendar, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { TeamWithStandings, Round } from "@shared/schema";

export default function TournamentHome() {
  const { isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: teams = [] } = useQuery<TeamWithStandings[]>({
    queryKey: ["/api/teams"],
  });

  const { data: rounds = [] } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
  });
  
  // Redirect admin users to admin page
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

  // Calculate total points for each team
  const sortedTeams = [...teams].sort((a, b) => {
    const aTotal = parseFloat(a.standings?.totalPoints || "0");
    const bTotal = parseFloat(b.standings?.totalPoints || "0");
    return bTotal - aTotal;
  });

  // Calculate days to tournament start
  const tournamentStart = new Date("2025-08-07");
  const today = new Date();
  const daysToGo = Math.max(
    0,
    Math.ceil(
      (tournamentStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <div className="bg-golf-gradient min-h-screen text-white">
      <AppHeader />

      <main className="max-w-md mx-auto pb-6">
        {/* Tournament Header */}
        <section className="px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="font-bold text-3xl mb-2">Rowdy Cup 2025</h1>
            <div className="flex items-center justify-center space-x-2 text-gray-300 text-sm mb-4">
              <Calendar className="w-4 h-4" />
              <span>August 7-10, 2025</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-gray-300 text-sm mb-4">
              <MapPin className="w-4 h-4" />
              <span>Circling Raven • The Idaho Club • CDA Resort</span>
            </div>
            <div className="glass-effect rounded-xl p-4">
              <div className="text-3xl font-mono font-bold text-green-400">
                {daysToGo}
              </div>
              <div className="text-sm text-gray-300">Days to Draft</div>
            </div>
          </div>
        </section>

        {/* Tournament Total Team Scores */}
        <section className="px-4 mb-6">
          <h2 className="font-semibold text-xl mb-4">Tournament Standings</h2>

          <div className="space-y-3">
            {sortedTeams.map((team, index) => {
              const totalPoints = parseFloat(
                team.standings?.totalPoints || "0",
              );
              const isLeading = index === 0;

              return (
                <Card
                  key={team.id}
                  className="glass-effect border-white/20 bg-transparent"
                >
                  <CardContent className="p-4">
                    <div
                      className={`flex items-center justify-between ${
                        isLeading ? "ring-2 ring-yellow-400 rounded-lg p-2" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl font-bold text-gray-400">
                          #{index + 1}
                        </div>
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            team.name === "Aviators"
                              ? "bg-blue-600"
                              : "bg-red-600"
                          }`}
                        >
                          <span className="text-white font-bold text-lg">
                            {team.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{team.name}</h3>
                          <p className="text-sm text-gray-300">
                            {team.captain}, Captain
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-mono font-bold text-green-400">
                          {totalPoints.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-300">Points</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Tournament Rounds */}
        <section className="px-4 mb-6">
          <h2 className="font-semibold text-xl mb-4">Tournament Rounds</h2>

          <div className="space-y-3">
            {rounds.length === 0 ? (
              <Card className="glass-effect border-white/20 bg-transparent">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-300">
                    Tournament rounds will be posted soon.
                  </p>
                </CardContent>
              </Card>
            ) : (
              rounds.map((round) => (
                <Link key={round.id} href={`/rounds/${round.id}`}>
                  <Card className="glass-effect border-white/20 bg-transparent hover:bg-white/5 transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-lg">
                              Round {round.number}
                            </h3>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                round.status === "live"
                                  ? "bg-green-400 text-gray-900"
                                  : round.status === "completed"
                                    ? "bg-gray-500 text-white"
                                    : "bg-yellow-400 text-gray-900"
                              }`}
                            >
                              {round.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-300 space-y-1">
                            <p>
                              <span className="font-medium">Format:</span>{" "}
                              {round.format}
                            </p>
                            {round.teeTime && (
                              <p>
                                <span className="font-medium">Tee Times:</span>{" "}
                                {round.teeTime}
                              </p>
                            )}
                            {round.date && (
                              <p>
                                <span className="font-medium">Date:</span>{" "}
                                {new Date(round.date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
