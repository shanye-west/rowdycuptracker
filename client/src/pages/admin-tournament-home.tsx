import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ChevronRight, Calendar, MapPin, Plus, Settings, Lock, Unlock, CheckCircle, XCircle, Edit3, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Tournament, RoundWithCourseDetails, InsertTournament, InsertRound } from "@shared/schema"; // Adjusted imports
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Helper function for date formatting
const formatDateForInput = (date?: Date | string): string => {
  if (!date) return "";
  try {
    const d = new Date(date);
    // Adjust for timezone offset to get local date in YYYY-MM-DD
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return "";
  }
};


export default function AdminTournamentHome() {
  const { isAdmin, logout, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isAddTournamentDialogOpen, setIsAddTournamentDialogOpen] = useState(false);
  const [newTournament, setNewTournament] = useState<Partial<InsertTournament>>({
    name: "",
    year: new Date().getFullYear(),
    startDate: undefined,
    endDate: undefined,
    location: "",
    status: "upcoming",
    isActive: false,
  });

  const [isAddRoundDialogOpen, setIsAddRoundDialogOpen] = useState(false);
  const [currentTournamentIdForNewRound, setCurrentTournamentIdForNewRound] = useState<number | null>(null);
  const [newRound, setNewRound] = useState<Partial<InsertRound>>({
    number: 1,
    format: "",
    date: undefined,
    teeTime: "",
    status: "upcoming",
    isLocked: false,
  });

  const queryClient = useQueryClient();

  // Fetch all tournaments
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery<Tournament[]>({
    queryKey: ["/api/tournaments"],
  });

  // Fetch rounds - this will be filtered by a selected tournament later
  // For now, let's assume we select a tournament to view its rounds
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const { data: roundsForSelectedTournament = [] } = useQuery<RoundWithCourseDetails[]>({
    queryKey: ["/api/rounds", { tournamentId: selectedTournament?.id }],
    queryFn: async ({ queryKey }) => {
      const [, params] = queryKey as [string, { tournamentId?: number }];
      if (!params.tournamentId) return [];
      const res = await fetch(`/api/rounds?tournamentId=${params.tournamentId}`);
      if (!res.ok) throw new Error("Failed to fetch rounds for tournament");
      return res.json();
    },
    enabled: !!selectedTournament, // Only fetch if a tournament is selected
  });


  useEffect(() => {
    if (!authLoading && !isAdmin) {
      setLocation("/");
    }
  }, [isAdmin, authLoading, setLocation]);

  // Mutation for creating a tournament
  const createTournamentMutation = useMutation({
    mutationFn: (tournamentData: InsertTournament) => apiRequest("POST", "/api/tournaments", tournamentData),
    onSuccess: () => {
      toast({ title: "Success", description: "Tournament created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      setIsAddTournamentDialogOpen(false);
      setNewTournament({ name: "", year: new Date().getFullYear(), startDate: undefined, endDate: undefined, location: "", status: "upcoming", isActive: false });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create tournament.", variant: "destructive" });
    },
  });

  // Mutation for setting active tournament
  const setActiveTournamentMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/tournaments/${id}/active`, { isActive }),
    onSuccess: (data, variables) => {
      toast({ title: "Success", description: `Tournament ${variables.isActive ? 'activated' : 'deactivated'}.` });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments/active"] }); // Invalidate active tournament query
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update tournament status.", variant: "destructive" });
    },
  });

  // Mutation for adding a round
  const addRoundMutation = useMutation({
    mutationFn: async (roundData: InsertRound) => apiRequest("POST", "/api/rounds", roundData),
    onSuccess: () => {
      toast({ title: "Success", description: "Round added successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/rounds", { tournamentId: selectedTournament?.id }] });
      setIsAddRoundDialogOpen(false);
      setNewRound({ number: 1, format: "", date: undefined, teeTime: "", status: "upcoming", isLocked: false });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to add round.", variant: "destructive" });
    },
  });

    // Mutation for deleting a round
  const deleteRoundMutation = useMutation({
    mutationFn: (roundId: number) => apiRequest("DELETE", `/api/rounds/${roundId}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Round deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/rounds", { tournamentId: selectedTournament?.id }] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete round.", variant: "destructive" });
    },
  });

  // Mutation for locking/unlocking a round
  const toggleRoundLockMutation = useMutation({
    mutationFn: ({ id, isLocked }: { id: number; isLocked: boolean }) =>
      apiRequest("PATCH", `/api/rounds/${id}/lock`, { isLocked }),
    onSuccess: (data, variables) => {
      toast({ title: "Success", description: `Round ${variables.isLocked ? 'locked' : 'unlocked'}.` });
      queryClient.invalidateQueries({ queryKey: ["/api/rounds", { tournamentId: selectedTournament?.id }] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update round lock status.", variant: "destructive" });
    },
  });


  const handleCreateTournamentSubmit = () => {
    if (!newTournament.name || !newTournament.year || !newTournament.startDate || !newTournament.endDate) {
      toast({ title: "Validation Error", description: "Please fill in all required tournament fields.", variant: "destructive" });
      return;
    }
    createTournamentMutation.mutate(newTournament as InsertTournament);
  };

  const handleAddRoundSubmit = () => {
    if (!selectedTournament || !newRound.format || !newRound.number) {
      toast({ title: "Validation Error", description: "Please fill in all required round fields.", variant: "destructive" });
      return;
    }
    addRoundMutation.mutate({ ...newRound, tournamentId: selectedTournament.id } as InsertRound);
  };
  
  const openAddRoundDialog = (tournament: Tournament) => {
    setSelectedTournament(tournament); // Ensure selectedTournament is set for context
    setCurrentTournamentIdForNewRound(tournament.id);
    const nextRoundNumber = roundsForSelectedTournament.length > 0 
        ? Math.max(...roundsForSelectedTournament.map(r => r.number), 0) + 1 
        : 1;
    setNewRound({ 
        number: nextRoundNumber, 
        format: "", 
        date: undefined, 
        teeTime: "", 
        status: "upcoming",
        isLocked: false
    });
    setIsAddRoundDialogOpen(true);
  };


  if (authLoading || tournamentsLoading) {
    return (
      <div className="bg-golf-gradient min-h-screen text-white flex items-center justify-center">
        <div className="text-center"><div className="text-lg">Loading Admin Dashboard...</div></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-golf-gradient min-h-screen text-white flex items-center justify-center">
        <div className="text-center"><div className="text-lg">Access Denied. Redirecting...</div></div>
      </div>
    );
  }

  return (
    <div className="bg-golf-gradient min-h-screen text-white">
      <AppHeader />
      <main className="max-w-xl mx-auto pb-6">
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

        {/* Tournaments Section */}
        <section className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-2xl">Tournaments</h2>
            <Dialog open={isAddTournamentDialogOpen} onOpenChange={setIsAddTournamentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Create Tournament
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700 text-white">
                <DialogHeader><DialogTitle>Create New Tournament</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  <div><Label htmlFor="tourName">Name</Label><Input id="tourName" value={newTournament.name} onChange={(e) => setNewTournament(p => ({ ...p, name: e.target.value }))} className="bg-gray-800"/></div>
                  <div><Label htmlFor="tourYear">Year</Label><Input id="tourYear" type="number" value={newTournament.year} onChange={(e) => setNewTournament(p => ({ ...p, year: parseInt(e.target.value) }))} className="bg-gray-800"/></div>
                  <div><Label htmlFor="tourStart">Start Date</Label><Input id="tourStart" type="date" value={formatDateForInput(newTournament.startDate)} onChange={(e) => setNewTournament(p => ({ ...p, startDate: e.target.value ? new Date(e.target.value) : undefined }))} className="bg-gray-800"/></div>
                  <div><Label htmlFor="tourEnd">End Date</Label><Input id="tourEnd" type="date" value={formatDateForInput(newTournament.endDate)} onChange={(e) => setNewTournament(p => ({ ...p, endDate: e.target.value ? new Date(e.target.value) : undefined }))} className="bg-gray-800"/></div>
                  <div><Label htmlFor="tourLocation">Location</Label><Input id="tourLocation" value={newTournament.location ?? ""} onChange={(e) => setNewTournament(p => ({ ...p, location: e.target.value }))} className="bg-gray-800"/></div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancel</Button></DialogClose>
                  <Button onClick={handleCreateTournamentSubmit} disabled={createTournamentMutation.isPending} className="bg-green-600 hover:bg-green-700">
                    {createTournamentMutation.isPending ? "Creating..." : "Create Tournament"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {tournaments.map(tour => (
              <Card key={tour.id} className={`glass-effect border-white/20 ${selectedTournament?.id === tour.id ? 'ring-2 ring-green-400' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg hover:underline cursor-pointer" onClick={() => setSelectedTournament(tour)}>{tour.name} ({tour.year})</h3>
                      <p className="text-xs text-gray-400">{formatDateForInput(tour.startDate)} - {formatDateForInput(tour.endDate)}</p>
                      <p className="text-xs text-gray-400">{tour.location}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                       <Button
                        size="sm"
                        variant={tour.isActive ? "destructive" : "outline"}
                        onClick={() => setActiveTournamentMutation.mutate({ id: tour.id, isActive: !tour.isActive })}
                        disabled={setActiveTournamentMutation.isPending && setActiveTournamentMutation.variables?.id === tour.id}
                        className={tour.isActive ? "bg-red-500 hover:bg-red-600" : "border-green-500 text-green-400 hover:bg-green-500 hover:text-white"}
                       >
                        {tour.isActive ? <XCircle className="mr-1 h-4 w-4"/> : <CheckCircle className="mr-1 h-4 w-4"/>}
                        {tour.isActive ? "Set Inactive" : "Set Active"}
                       </Button>
                        <Button size="sm" variant="outline" className="border-gray-500 text-gray-300 hover:bg-gray-700" onClick={() => openAddRoundDialog(tour)}>
                            <Plus className="mr-1 h-4 w-4"/> Add Round
                        </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Rounds Section - Shown if a tournament is selected */}
        {selectedTournament && (
          <section className="px-4 py-6 mt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-2xl">Rounds for {selectedTournament.name}</h2>
              {/* The "Add Round" button is now per-tournament */}
            </div>
            <div className="space-y-3">
              {roundsForSelectedTournament.length === 0 ? (
                <Card className="glass-effect border-white/20 bg-transparent">
                  <CardContent className="p-6 text-center text-gray-400">No rounds created for this tournament yet.</CardContent>
                </Card>
              ) : (
                roundsForSelectedTournament.map((round) => (
                  <Card key={round.id} className="glass-effect border-white/20 bg-transparent relative group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link href={`/rounds/${round.id}`} className="hover:underline">
                            <h3 className="font-bold text-lg">Round {round.number} - {round.format}</h3>
                          </Link>
                          <p className="text-xs text-gray-400">
                            {round.date ? formatDateForInput(round.date) : "Date TBD"} | {round.teeTime || "Tee Time TBD"} | Status: {round.status}
                          </p>
                          <p className="text-xs text-gray-400">
                            Course: {round.course?.name || "Course TBD"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Button
                            size="sm"
                            variant={round.isLocked ? "secondary" : "outline"}
                            onClick={() => toggleRoundLockMutation.mutate({ id: round.id, isLocked: !round.isLocked })}
                            className={round.isLocked ? "bg-yellow-600 hover:bg-yellow-700" : "border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-white"}
                          >
                            {round.isLocked ? <Lock className="mr-1 h-3 w-3"/> : <Unlock className="mr-1 h-3 w-3"/>}
                            {round.isLocked ? "Locked" : "Unlocked"}
                          </Button>
                           <Link href={`/admin/round/${round.id}/matches`}> {/* Placeholder for future match admin page */}
                             <Button size="sm" variant="outline" className="text-sm border-gray-500 text-gray-300 hover:bg-gray-700">
                                <Edit3 className="mr-1 h-3 w-3" /> Manage Matches
                             </Button>
                           </Link>
                        </div>
                      </div>
                    </CardContent>
                     <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-900/50 p-1"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent link navigation
                            if (window.confirm(`Are you sure you want to delete Round ${round.number}? This will also delete its matches.`)) {
                                deleteRoundMutation.mutate(round.id);
                            }
                        }}
                        disabled={deleteRoundMutation.isPending && deleteRoundMutation.variables === round.id}
                        title="Delete Round"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                  </Card>
                ))
              )}
            </div>
          </section>
        )}
         {/* Dialog for Adding a Round (now tied to selectedTournament) */}
         <Dialog open={isAddRoundDialogOpen} onOpenChange={setIsAddRoundDialogOpen}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white">
                <DialogHeader><DialogTitle>Add New Round to {selectedTournament?.name}</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                    <div><Label htmlFor="roundNumber">Round Number</Label><Input id="roundNumber" type="number" value={newRound.number} onChange={(e) => setNewRound(p => ({ ...p, number: parseInt(e.target.value) || 1 }))} className="bg-gray-800"/></div>
                    <div><Label htmlFor="roundFormat">Format</Label>
                        <Select value={newRound.format} onValueChange={(value) => setNewRound(p => ({...p, format: value}))}>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white"><SelectValue placeholder="Select format..."/></SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600 text-gray-50">
                                <SelectItem value="2-man-scramble">2-Man Scramble</SelectItem>
                                <SelectItem value="best-ball">Best Ball</SelectItem>
                                <SelectItem value="shamble">Shamble</SelectItem>
                                <SelectItem value="4-man-scramble">4-Man Scramble</SelectItem>
                                <SelectItem value="singles">Singles</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                      <Label htmlFor="roundDate">Date</Label>
                      <Input
                        id="roundDate"
                        type="date"
                        value={formatDateForInput(newRound.date ?? undefined)}
                        onChange={(e) =>
                          setNewRound((p) => ({
                            ...p,
                            date: e.target.value ? new Date(e.target.value) : undefined,
                          }))
                        }
                        className="bg-gray-800"
                      />
                    </div>
                    <div><Label htmlFor="roundTeeTime">Tee Time</Label><Input id="roundTeeTime" value={newRound.teeTime ?? ""} onChange={(e) => setNewRound(p => ({ ...p, teeTime: e.target.value }))} placeholder="e.g., 9:00 AM" className="bg-gray-800"/></div>
                    {/* Add Course Selection Here if needed */}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancel</Button></DialogClose>
                    <Button onClick={handleAddRoundSubmit} disabled={addRoundMutation.isPending} className="bg-green-600 hover:bg-green-700">
                        {addRoundMutation.isPending ? "Adding..." : "Add Round"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}