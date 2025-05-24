import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Trophy } from "lucide-react";
import type { MatchWithDetails, HoleScore } from "@shared/schema";

interface MatchPlayScorecardProps {
  match: MatchWithDetails;
  holeScores: HoleScore[];
  onUpdateScore: (hole: number, team1Score: number, team2Score: number) => void;
}

interface HoleData {
  hole: number;
  par: number;
  team1Score: number | null;
  team2Score: number | null;
  winner: 'team1' | 'team2' | 'tie' | null;
}

export default function MatchPlayScorecard({ match, holeScores, onUpdateScore }: MatchPlayScorecardProps) {
  const [editingHole, setEditingHole] = useState<number | null>(null);
  const [tempScores, setTempScores] = useState<{ team1: string; team2: string }>({ team1: '', team2: '' });

  // Standard golf course pars (typical layout)
  const standardPars = [4, 4, 3, 4, 5, 4, 3, 4, 4, 4, 4, 3, 5, 4, 3, 4, 4, 5];

  // Create hole data with scores and match play status
  const holes: HoleData[] = Array.from({ length: 18 }, (_, i) => {
    const hole = i + 1;
    const par = standardPars[i];
    
    // Find scores for this hole
    const team1HoleScore = holeScores.find(s => s.hole === hole && s.playerId === 1); // Assuming team captain IDs
    const team2HoleScore = holeScores.find(s => s.hole === hole && s.playerId === 13); // Assuming team captain IDs
    
    const team1Score = team1HoleScore?.strokes || null;
    const team2Score = team2HoleScore?.strokes || null;
    
    let winner: 'team1' | 'team2' | 'tie' | null = null;
    if (team1Score !== null && team2Score !== null) {
      if (team1Score < team2Score) winner = 'team1';
      else if (team2Score < team1Score) winner = 'team2';
      else winner = 'tie';
    }
    
    return { hole, par, team1Score, team2Score, winner };
  });

  // Calculate match play status
  const calculateMatchStatus = () => {
    let team1Up = 0;
    let team2Up = 0;
    let holesPlayed = 0;
    
    holes.forEach(hole => {
      if (hole.winner) {
        holesPlayed++;
        if (hole.winner === 'team1') team1Up++;
        else if (hole.winner === 'team2') team2Up++;
      }
    });
    
    const difference = team1Up - team2Up;
    const holesRemaining = 18 - holesPlayed;
    
    if (difference === 0) return holesPlayed > 0 ? "AS" : "";
    if (Math.abs(difference) > holesRemaining) {
      const winner = difference > 0 ? match.team1.name : match.team2.name;
      return `${winner} wins ${Math.abs(difference)} & ${holesRemaining}`;
    }
    
    const leader = difference > 0 ? match.team1.name : match.team2.name;
    return `${leader} ${Math.abs(difference)} UP`;
  };

  // Calculate front 9, back 9, and total scores
  const calculateScores = (teamScores: (number | null)[]) => {
    const front9 = teamScores.slice(0, 9).filter(s => s !== null).reduce((sum, s) => sum + (s || 0), 0);
    const back9 = teamScores.slice(9).filter(s => s !== null).reduce((sum, s) => sum + (s || 0), 0);
    const total = front9 + back9;
    const front9Holes = teamScores.slice(0, 9).filter(s => s !== null).length;
    const back9Holes = teamScores.slice(9).filter(s => s !== null).length;
    
    return { 
      front9: front9Holes > 0 ? front9 : null, 
      back9: back9Holes > 0 ? back9 : null, 
      total: (front9Holes + back9Holes) > 0 ? total : null 
    };
  };

  const team1Scores = holes.map(h => h.team1Score);
  const team2Scores = holes.map(h => h.team2Score);
  const team1Totals = calculateScores(team1Scores);
  const team2Totals = calculateScores(team2Scores);

  const handleEditScore = (hole: number) => {
    const holeData = holes[hole - 1];
    setEditingHole(hole);
    setTempScores({
      team1: holeData.team1Score?.toString() || '',
      team2: holeData.team2Score?.toString() || ''
    });
  };

  const handleSaveScore = () => {
    if (editingHole && tempScores.team1 && tempScores.team2) {
      const team1Score = parseInt(tempScores.team1);
      const team2Score = parseInt(tempScores.team2);
      onUpdateScore(editingHole, team1Score, team2Score);
      setEditingHole(null);
      setTempScores({ team1: '', team2: '' });
    }
  };

  const matchStatus = calculateMatchStatus();

  return (
    <div className="space-y-4">
      {/* Match Status Header */}
      <Card className="glass-effect border-green-500/30 bg-green-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-green-100">{match.round.format}</h3>
              <p className="text-sm text-green-300">Match Play Format</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-400">
                {matchStatus || "Match Even"}
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-400/30">
                LIVE
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scorecard */}
      <Card className="glass-effect border-white/20 bg-transparent">
        <CardHeader>
          <CardTitle className="text-center text-lg">Official Scorecard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              {/* Header Row */}
              <thead>
                <tr className="border-b border-white/20">
                  <th className="p-2 text-left">HOLE</th>
                  {Array.from({ length: 9 }, (_, i) => (
                    <th key={i + 1} className="p-1 text-center w-8">{i + 1}</th>
                  ))}
                  <th className="p-2 text-center font-bold bg-green-900/30">OUT</th>
                  {Array.from({ length: 9 }, (_, i) => (
                    <th key={i + 10} className="p-1 text-center w-8">{i + 10}</th>
                  ))}
                  <th className="p-2 text-center font-bold bg-green-900/30">IN</th>
                  <th className="p-2 text-center font-bold bg-green-900/30">TOTAL</th>
                </tr>
              </thead>
              
              {/* Par Row */}
              <tbody>
                <tr className="border-b border-white/20 bg-gray-800/30">
                  <td className="p-2 font-semibold">PAR</td>
                  {standardPars.slice(0, 9).map((par, i) => (
                    <td key={i} className="p-1 text-center font-medium">{par}</td>
                  ))}
                  <td className="p-2 text-center font-bold bg-green-900/30">
                    {standardPars.slice(0, 9).reduce((sum, par) => sum + par, 0)}
                  </td>
                  {standardPars.slice(9).map((par, i) => (
                    <td key={i + 9} className="p-1 text-center font-medium">{par}</td>
                  ))}
                  <td className="p-2 text-center font-bold bg-green-900/30">
                    {standardPars.slice(9).reduce((sum, par) => sum + par, 0)}
                  </td>
                  <td className="p-2 text-center font-bold bg-green-900/30">
                    {standardPars.reduce((sum, par) => sum + par, 0)}
                  </td>
                </tr>

                {/* Team 1 Row */}
                <tr className="border-b border-white/20 bg-blue-900/20">
                  <td className="p-2 font-semibold text-blue-200">{match.team1.name}</td>
                  {holes.slice(0, 9).map((hole, i) => (
                    <td key={i} className="p-1 text-center">
                      {editingHole === hole.hole ? (
                        <Input
                          type="number"
                          value={tempScores.team1}
                          onChange={(e) => setTempScores(prev => ({ ...prev, team1: e.target.value }))}
                          className="w-8 h-6 p-0 text-center text-xs"
                          min="1"
                          max="10"
                        />
                      ) : (
                        <button
                          onClick={() => handleEditScore(hole.hole)}
                          className={`w-8 h-6 text-xs rounded ${
                            hole.winner === 'team1' ? 'bg-green-500 text-white font-bold' :
                            hole.winner === 'team2' ? 'bg-red-500/30 text-red-200' :
                            hole.winner === 'tie' ? 'bg-yellow-500/30 text-yellow-200' :
                            'hover:bg-white/10'
                          }`}
                        >
                          {hole.team1Score || '-'}
                        </button>
                      )}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-blue-900/30">
                    {team1Totals.front9 || '-'}
                  </td>
                  {holes.slice(9).map((hole, i) => (
                    <td key={i + 9} className="p-1 text-center">
                      {editingHole === hole.hole ? (
                        <Input
                          type="number"
                          value={tempScores.team1}
                          onChange={(e) => setTempScores(prev => ({ ...prev, team1: e.target.value }))}
                          className="w-8 h-6 p-0 text-center text-xs"
                          min="1"
                          max="10"
                        />
                      ) : (
                        <button
                          onClick={() => handleEditScore(hole.hole)}
                          className={`w-8 h-6 text-xs rounded ${
                            hole.winner === 'team1' ? 'bg-green-500 text-white font-bold' :
                            hole.winner === 'team2' ? 'bg-red-500/30 text-red-200' :
                            hole.winner === 'tie' ? 'bg-yellow-500/30 text-yellow-200' :
                            'hover:bg-white/10'
                          }`}
                        >
                          {hole.team1Score || '-'}
                        </button>
                      )}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-blue-900/30">
                    {team1Totals.back9 || '-'}
                  </td>
                  <td className="p-2 text-center font-bold bg-blue-900/30">
                    {team1Totals.total || '-'}
                  </td>
                </tr>

                {/* Match Status Row */}
                <tr className="border-b border-white/20 bg-green-900/20">
                  <td className="p-2 font-bold text-green-300 text-xs">MATCH</td>
                  {holes.slice(0, 9).map((hole, i) => (
                    <td key={i} className="p-1 text-center text-xs">
                      {hole.winner === 'team1' ? '↑' : hole.winner === 'team2' ? '↓' : hole.winner === 'tie' ? '=' : '-'}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-green-900/30 text-xs">{matchStatus}</td>
                  {holes.slice(9).map((hole, i) => (
                    <td key={i + 9} className="p-1 text-center text-xs">
                      {hole.winner === 'team1' ? '↑' : hole.winner === 'team2' ? '↓' : hole.winner === 'tie' ? '=' : '-'}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-green-900/30 text-xs">STATUS</td>
                  <td className="p-2 text-center font-bold bg-green-900/30 text-xs">{matchStatus}</td>
                </tr>

                {/* Team 2 Row */}
                <tr className="border-b border-white/20 bg-red-900/20">
                  <td className="p-2 font-semibold text-red-200">{match.team2.name}</td>
                  {holes.slice(0, 9).map((hole, i) => (
                    <td key={i} className="p-1 text-center">
                      {editingHole === hole.hole ? (
                        <Input
                          type="number"
                          value={tempScores.team2}
                          onChange={(e) => setTempScores(prev => ({ ...prev, team2: e.target.value }))}
                          className="w-8 h-6 p-0 text-center text-xs"
                          min="1"
                          max="10"
                        />
                      ) : (
                        <button
                          onClick={() => handleEditScore(hole.hole)}
                          className={`w-8 h-6 text-xs rounded ${
                            hole.winner === 'team2' ? 'bg-green-500 text-white font-bold' :
                            hole.winner === 'team1' ? 'bg-red-500/30 text-red-200' :
                            hole.winner === 'tie' ? 'bg-yellow-500/30 text-yellow-200' :
                            'hover:bg-white/10'
                          }`}
                        >
                          {hole.team2Score || '-'}
                        </button>
                      )}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-red-900/30">
                    {team2Totals.front9 || '-'}
                  </td>
                  {holes.slice(9).map((hole, i) => (
                    <td key={i + 9} className="p-1 text-center">
                      {editingHole === hole.hole ? (
                        <Input
                          type="number"
                          value={tempScores.team2}
                          onChange={(e) => setTempScores(prev => ({ ...prev, team2: e.target.value }))}
                          className="w-8 h-6 p-0 text-center text-xs"
                          min="1"
                          max="10"
                        />
                      ) : (
                        <button
                          onClick={() => handleEditScore(hole.hole)}
                          className={`w-8 h-6 text-xs rounded ${
                            hole.winner === 'team2' ? 'bg-green-500 text-white font-bold' :
                            hole.winner === 'team1' ? 'bg-red-500/30 text-red-200' :
                            hole.winner === 'tie' ? 'bg-yellow-500/30 text-yellow-200' :
                            'hover:bg-white/10'
                          }`}
                        >
                          {hole.team2Score || '-'}
                        </button>
                      )}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-red-900/30">
                    {team2Totals.back9 || '-'}
                  </td>
                  <td className="p-2 text-center font-bold bg-red-900/30">
                    {team2Totals.total || '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Controls */}
      {editingHole && (
        <Card className="glass-effect border-green-500/30 bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-green-100">Editing Hole {editingHole}</h4>
                <p className="text-sm text-green-300">Enter gross scores for each team</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveScore}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!tempScores.team1 || !tempScores.team2}
                >
                  Save
                </Button>
                <Button 
                  onClick={() => setEditingHole(null)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Play Legend */}
      <Card className="glass-effect border-white/20 bg-transparent">
        <CardContent className="p-4">
          <h4 className="font-bold mb-3 text-green-100">Match Play Scoring</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Hole won</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500/30 rounded border border-red-400"></div>
                <span>Hole lost</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500/30 rounded border border-yellow-400"></div>
                <span>Hole tied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-600 rounded"></div>
                <span>Not played</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}