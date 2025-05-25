import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Profiles, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type {
  MatchWithDetails,
  Round,
  TeamWithStandings,
} from "@shared/schema";

export default function RoundPage() {
  const { isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { roundId } = useParams();

  const {
    data: round,
    isLoading: roundLoading,
    isError: roundError,
  } = useQuery<Round | undefined>({
    queryKey: ["/api/rounds", roundId],
    queryFn: async () => {
      const res = await fetch("/api/rounds");
      if (!res.ok) throw new Error("Failed to fetch rounds");
      const rounds: Round[] = await res.json();
      return rounds.find((r) => r.id.toString() === roundId);
    },
  });

  const { data: matches = [] } = useQuery<MatchWithDetails[]>({
    queryKey: ["/api/rounds", roundId, "matches"],
    queryFn: async () => {
      const res = await fetch(`/api/rounds/${roundId}/matches`);
      if (!res.ok) throw new Error("Failed to load matches");
      return res.json();
    },
  });

  const { data: teams = [] } = useQuery<TeamWithStandings[]>({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const res = await fetch(`/api/teams`);
      if (!res.ok) throw new Error("Failed to load teams");
      return res.json();
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

  if (roundLoading) {
    return (
      <div className="bg-golf-gradient min-h-screen text-white">
        <AppHeader />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-gray-300">Loading round...</p>
        </div>
      </div>
    );
  }

  if (roundError || !round) {
    return (
      <div className="bg-golf-gradient min-h-screen text-white">
        <AppHeader />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-red-400">Error loading round data.</p>
        </div>
      </div>
    );
  }

  const roundPoints = teams
    .map((team) => {
      const teamMatches = matches.filter(
        (m) => m.team1Id === team.id || m.team2Id === team.id,
      );

      const points = teamMatches.reduce((total, match) => {
        if (match.status === "completed" && match.winnerId === team.id) {
          return total + parseFloat(match.points || "1");
        }
        return total;
      }, 0);

      return { ...team, roundPoints: points };
    })
    .sort((a, b) => b.roundPoints - a.roundPoints);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "live":
        return "bg-green-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case "live":
        return "Live";
      case "completed":
        return "Final";
      default:
        return "Upcoming";
    }
  };

  return (
    <div className="bg-golf-gradient min-h-screen text-white">
      <AppHeader />

      <main className="max-w-md mx-auto pb-20">
        {/* Round Header */}
        <section className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="p-2">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-2xl">Round {round.number}</h1>
              <p className="text-sm text-gray-300">{round.format}</p>
            </div>
            <Badge
              className={`ml-auto ${getStatusColor(round.status)} text-white`}
            >
              {getStatusText(round.status)}
            </Badge>
          </div>

          <Card className="glass-effect border-white/20 bg-transparent mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-300">Format:</span>
                  <p className="font-medium">{round.format}</p>
                </div>
                {round.teeTime && (
                  <div>
                    <span className="text-gray-300">Tee Times:</span>
                    <p className="font-medium">{round.teeTime}</p>
                  </div>
                )}
                {round.date && (
                  <div>
                    <span className="text-gray-300">Date:</span>
                    <p className="font-medium">
                      {new Date(round.date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-300">Matches:</span>
                  <p className="font-medium">{matches.length} total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Round Team Scores */}
        <section className="px-4 mb-6">
          <h2 className="font-semibold text-xl mb-4">
            Round {round.number} Standings
          </h2>

          <div className="space-y-3">
            {roundPoints.map((team, index) => {
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
                        <div className="text-xl font-bold text-gray-400">
                          #{index + 1}
                        </div>
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            team.name === "Aviators"
                              ? "bg-blue-600"
                              : "bg-red-600"
                          }`}
                        >
                          <span className="text-white font-bold">
                            {team.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold">{team.name}</h3>
                          <p className="text-xs text-gray-300">
                            {team.captain}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-mono font-bold text-green-400">
                          {team.roundPoints.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-300">
                          Round Points
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Round Matches */}
        <section className="px-4 mb-6">
          <h2 className="font-semibold text-xl mb-4">
            Round {round.number} Matches
          </h2>

          <div className="space-y-4">
            {matches.length === 0 ? (
              <Card className="glass-effect border-white/20 bg-transparent">
                <CardContent className="p-8 text-center">
                  <Profiles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-300">
                    No matches scheduled for this round yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              matches.map((match) => (
                <Link key={match.id} href={`/match/${match.id}`}>
                  <Card className="glass-effect border-white/20 bg-transparent hover:bg-white/5 transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">Match {match.id}</h3>
                          <Badge
                            className={`ml-auto ${getStatusColor(round.status)} text-white`}
                          >
                            {getStatusText(round.status)}
                          </Badge>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-300 mb-3">
                        <Clock className="w-4 h-4" />
                        <span>{match.round.format}</span>
                        {match.status === "live" && (
                          <>
                            <span>•</span>
                            <span>Hole {match.currentHole}</span>
                          </>
                        )}
                      </div>

                      {/* Team 1 */}
                      <div className="flex items-center justify-between mb-2 p-2 bg-blue-600/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              A
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {match.team1.name}
                            </p>
                            <p className="text-xs text-gray-300">
                              {match.matchPlayers
                                .filter((mp) => mp.teamId === match.team1Id)
                                .map((mp) => mp.player.name)
                                .join(" / ") || "Players TBD"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold">
                            {match.team1Score}
                          </div>
                          {match.team1Status && (
                            <div
                              className={`text-xs ${
                                match.team1Status.includes("UP")
                                  ? "text-green-400"
                                  : match.team1Status.includes("DN")
                                    ? "text-red-400"
                                    : "text-yellow-400"
                              }`}
                            >
                              {match.team1Status}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center justify-between p-2 bg-red-600/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              P
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {match.team2.name}
                            </p>
                            <p className="text-xs text-gray-300">
                              {match.matchPlayers
                                .filter((mp) => mp.teamId === match.team2Id)
                                .map((mp) => mp.player.name)
                                .join(" / ") || "Players TBD"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold">
                            {match.team2Score}
                          </div>
                          {match.team2Status && (
                            <div
                              className={`text-xs ${
                                match.team2Status.includes("UP")
                                  ? "text-green-400"
                                  : match.team2Status.includes("DN")
                                    ? "text-red-400"
                                    : "text-yellow-400"
                              }`}
                            >
                              {match.team2Status}
                            </div>
                          )}
                        </div>
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
