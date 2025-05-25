import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronRight, Calendar, MapPin, Plus, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { TeamWithStandings, Round } from "@shared/schema";

export default function AdminTournamentHome() {
  const { isAdmin, logout } = useAuth();
  const [isAddRoundDialogOpen, setIsAddRoundDialogOpen] = useState(false);
  const [newRound, setNewRound] = useState({
    number: 1,
    format: "",
    date: "",
    teeTime: "",
    status: "upcoming" as "upcoming" | "live" | "completed"
  });

  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery<TeamWithStandings[]>({
    queryKey: ["/api/teams"],
  });

  const { data: rounds = [] } = useQuery<Round[]>({
    queryKey: ["/api/rounds"],
  });

  const addRoundMutation = useMutation({
    mutationFn: async (roundData: typeof newRound) => {
      const response = await fetch("/api/rounds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roundData),
      });
      if (!response.ok) {
        throw new Error("Failed to create round");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
      setIsAddRoundDialogOpen(false);
      setNewRound({
        number: Math.max(...rounds.map(r => r.number), 0) + 1,
        format: "",
        date: "",
        teeTime: "",
        status: "upcoming"
      });
    },
  });

  // Delete round mutation
  const deleteRoundMutation = useMutation({
    mutationFn: async (roundId: number) => {
      const response = await fetch(`/api/rounds/${roundId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to delete round");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rounds"] });
    },
  });

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

  const handleAddRound = () => {
    addRoundMutation.mutate(newRound);
  };

  const handleDeleteRound = (roundId: number) => {
    if (window.confirm("Are you sure you want to delete this round?")) {
      deleteRoundMutation.mutate(roundId);
    }
  };

  // If not admin, redirect to regular tournament home
  if (!isAdmin) {
    window.location.href = "/";
    return null;
  }

  return (
    <div className="bg-golf-gradient min-h-screen text-white">
      <AppHeader />

      <main className="max-w-md mx-auto pb-6">
        {/* Admin Controls Header */}
        <div className="px-4 py-2 bg-red-600/20 border-b border-red-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Admin Mode</span>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
            >
              Logout
            </Button>
          </div>
        </div>

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-xl">Tournament Rounds</h2>
            <Dialog open={isAddRoundDialogOpen} onOpenChange={setIsAddRoundDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Round
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Add New Round</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="roundNumber">Round Number</Label>
                    <Input
                      id="roundNumber"
                      type="number"
                      value={newRound.number}
                      onChange={(e) => setNewRound({ ...newRound, number: parseInt(e.target.value) })}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Input
                      id="format"
                      value={newRound.format}
                      onChange={(e) => setNewRound({ ...newRound, format: e.target.value })}
                      placeholder="e.g., Scramble, Best Ball, etc."
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newRound.date}
                      onChange={(e) => setNewRound({ ...newRound, date: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teeTime">Tee Time</Label>
                    <Input
                      id="teeTime"
                      value={newRound.teeTime}
                      onChange={(e) => setNewRound({ ...newRound, teeTime: e.target.value })}
                      placeholder="e.g., 9:00 AM"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={newRound.status} onValueChange={(value) => setNewRound({ ...newRound, status: value as "upcoming" | "live" | "completed" })}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddRoundDialogOpen(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddRound}
                      disabled={addRoundMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {addRoundMutation.isPending ? "Adding..." : "Add Round"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

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
                <div key={round.id} className="relative group">
                  <Link href={`/rounds/${round.id}`}>
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
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-80 group-hover:opacity-100 z-10"
                    onClick={() => handleDeleteRound(round.id)}
                    disabled={deleteRoundMutation.isPending}
                  >
                    {deleteRoundMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
