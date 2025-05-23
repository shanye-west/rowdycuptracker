import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import TeamOverview from "@/components/TeamOverview";
import LiveMatches from "@/components/LiveMatches";
import TournamentStandings from "@/components/TournamentStandings";
import BottomNavigation from "@/components/BottomNavigation";
import ScoreEntryModal from "@/components/ScoreEntryModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { TeamWithStandings, MatchWithDetails, Round } from "@shared/schema";

export default function Scoreboard() {
  const [selectedRound, setSelectedRound] = useState(1);
  const [isScoreEntryOpen, setIsScoreEntryOpen] = useState(false);

  const { data: teams = [] } = useQuery<TeamWithStandings[]>({
    queryKey: ['/api/teams'],
  });

  const { data: rounds = [] } = useQuery<Round[]>({
    queryKey: ['/api/rounds'],
  });

  const { data: matches = [] } = useQuery<MatchWithDetails[]>({
    queryKey: ['/api/rounds', selectedRound, 'matches'],
  });

  const currentRound = rounds.find(r => r.number === selectedRound);
  const liveMatches = matches.filter(m => m.status === 'live');
  const completedMatches = matches.filter(m => m.status === 'completed');

  const daysToGo = 12; // This could be calculated based on tournament start date

  return (
    <div className="bg-golf-gradient min-h-screen text-white">
      <AppHeader />
      
      <main className="max-w-md mx-auto pb-20">
        {/* Tournament Info */}
        <section className="px-4 py-6">
          <div className="text-center mb-6">
            <h2 className="font-bold text-2xl mb-2">August 7-10, 2025</h2>
            <p className="text-gray-300 text-sm">Circling Raven • The Idaho Club • CDA Resort</p>
            <div className="mt-4 glass-effect rounded-xl p-4">
              <div className="text-3xl font-mono font-bold text-green-400">{daysToGo}</div>
              <div className="text-sm text-gray-300">Days to Draft</div>
            </div>
          </div>
        </section>

        {/* Team Overview */}
        <TeamOverview teams={teams} />

        {/* Round Selection Tabs */}
        <section className="px-4 mb-4">
          <div className="glass-effect rounded-xl p-1">
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
        </section>

        {/* Current Round Info */}
        {currentRound && (
          <section className="px-4 mb-4">
            <div className="glass-effect rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">
                  Round {currentRound.number} - {currentRound.courseId ? 'Course' : 'TBD'}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  currentRound.status === 'live' 
                    ? 'bg-green-400 text-gray-900'
                    : currentRound.status === 'completed'
                    ? 'bg-gray-500 text-white'
                    : 'bg-yellow-400 text-gray-900'
                }`}>
                  {currentRound.status}
                </span>
              </div>
              <div className="text-sm text-gray-300 mb-3">
                <p>Format: {currentRound.format}</p>
                {currentRound.teeTime && <p>Tee Times: {currentRound.teeTime}</p>}
              </div>
              <div className="flex justify-between text-sm">
                <span>Matches Completed: <span className="font-mono font-bold">{completedMatches.length}/{matches.length}</span></span>
                <span>Points Available: <span className="font-mono font-bold">{matches.length}</span></span>
              </div>
            </div>
          </section>
        )}

        {/* Live Matches */}
        <LiveMatches matches={liveMatches} onUpdateScore={(matchId) => setIsScoreEntryOpen(true)} />

        {/* Tournament Standings */}
        <TournamentStandings teams={teams} />

        {/* Quick Stats */}
        <section className="px-4 mb-6">
          <h3 className="font-semibold text-lg mb-4">Quick Stats</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-effect rounded-xl p-4 text-center">
              <div className="text-2xl font-mono font-bold text-green-400">{matches.length}</div>
              <div className="text-sm text-gray-300">Total Matches</div>
            </div>
            <div className="glass-effect rounded-xl p-4 text-center">
              <div className="text-2xl font-mono font-bold text-green-400">{liveMatches.length}</div>
              <div className="text-sm text-gray-300">In Progress</div>
            </div>
            <div className="glass-effect rounded-xl p-4 text-center">
              <div className="text-2xl font-mono font-bold text-green-400">68</div>
              <div className="text-sm text-gray-300">Avg Score</div>
            </div>
            <div className="glass-effect rounded-xl p-4 text-center">
              <div className="text-2xl font-mono font-bold text-green-400">-2</div>
              <div className="text-sm text-gray-300">Best Round</div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => setIsScoreEntryOpen(true)}
          size="lg"
          className="w-14 h-14 bg-green-400 hover:bg-green-500 text-gray-900 rounded-full shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <BottomNavigation />
      
      <ScoreEntryModal 
        isOpen={isScoreEntryOpen} 
        onClose={() => setIsScoreEntryOpen(false)}
      />
    </div>
  );
}
