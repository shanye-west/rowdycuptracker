import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dot } from "lucide-react";
import type { MatchWithDetails, HoleScore, Player } from "@shared/schema";

interface BestBallScorecardProps {
  match: MatchWithDetails;
  holeScores: HoleScore[];
  onUpdateScore: (hole: number, playerId: number, grossScore: number) => void;
}

interface HoleData {
  hole: number;
  par: number;
  handicap: number;
  team1Player1: { score: number | null; net: number | null; hasStroke: boolean };
  team1Player2: { score: number | null; net: number | null; hasStroke: boolean };
  team2Player1: { score: number | null; net: number | null; hasStroke: boolean };
  team2Player2: { score: number | null; net: number | null; hasStroke: boolean };
  team1BestScore: number | null;
  team2BestScore: number | null;
  team1BestPlayer: number | null;
  team2BestPlayer: number | null;
  winner: 'team1' | 'team2' | 'tie' | null;
}

export default function BestBallScorecard({ match, holeScores, onUpdateScore }: BestBallScorecardProps) {
  const [editingCell, setEditingCell] = useState<{ hole: number; playerId: number } | null>(null);
  const [tempScore, setTempScore] = useState<string>('');

  // Standard golf course pars and handicap rankings (1 = hardest hole, 18 = easiest)
  const standardPars = [4, 4, 3, 4, 5, 4, 3, 4, 4, 4, 4, 3, 5, 4, 3, 4, 4, 5];
  const holeHandicaps = [1, 11, 17, 5, 3, 15, 13, 7, 9, 2, 12, 18, 4, 6, 16, 14, 8, 10];

  // Get team players (fallback to creating player objects from available data)
  const team1Players = [
    { id: 1, name: match.team1.captain, handicap: "8", teamId: match.team1.id },
    { id: 2, name: "Player 2", handicap: "12", teamId: match.team1.id }
  ];
  const team2Players = [
    { id: 13, name: match.team2.captain, handicap: "10", teamId: match.team2.id },
    { id: 14, name: "Player 2", handicap: "6", teamId: match.team2.id }
  ];

  // Calculate which holes each player gets strokes on
  const getStrokesForPlayer = (courseHandicap: number, holeHandicap: number): boolean => {
    return holeHandicap <= courseHandicap;
  };

  // Create hole data with net scoring calculations
  const holes: HoleData[] = Array.from({ length: 18 }, (_, i) => {
    const hole = i + 1;
    const par = standardPars[i];
    const handicap = holeHandicaps[i];
    
    // Get player scores for this hole
    const team1Player1Score = holeScores.find(s => s.hole === hole && s.playerId === team1Players[0]?.id)?.strokes || null;
    const team1Player2Score = holeScores.find(s => s.hole === hole && s.playerId === team1Players[1]?.id)?.strokes || null;
    const team2Player1Score = holeScores.find(s => s.hole === hole && s.playerId === team2Players[0]?.id)?.strokes || null;
    const team2Player2Score = holeScores.find(s => s.hole === hole && s.playerId === team2Players[1]?.id)?.strokes || null;
    
    // Calculate strokes for each player (using handicap from database or default)
    const team1Player1Handicap = parseInt(team1Players[0]?.handicap || "0");
    const team1Player2Handicap = parseInt(team1Players[1]?.handicap || "0");
    const team2Player1Handicap = parseInt(team2Players[0]?.handicap || "0");
    const team2Player2Handicap = parseInt(team2Players[1]?.handicap || "0");
    
    const team1Player1HasStroke = getStrokesForPlayer(team1Player1Handicap, handicap);
    const team1Player2HasStroke = getStrokesForPlayer(team1Player2Handicap, handicap);
    const team2Player1HasStroke = getStrokesForPlayer(team2Player1Handicap, handicap);
    const team2Player2HasStroke = getStrokesForPlayer(team2Player2Handicap, handicap);
    
    // Calculate net scores
    const team1Player1Net = team1Player1Score !== null ? team1Player1Score - (team1Player1HasStroke ? 1 : 0) : null;
    const team1Player2Net = team1Player2Score !== null ? team1Player2Score - (team1Player2HasStroke ? 1 : 0) : null;
    const team2Player1Net = team2Player1Score !== null ? team2Player1Score - (team2Player1HasStroke ? 1 : 0) : null;
    const team2Player2Net = team2Player2Score !== null ? team2Player2Score - (team2Player2HasStroke ? 1 : 0) : null;
    
    // Find best score for each team
    const team1Scores = [team1Player1Net, team1Player2Net].filter(s => s !== null) as number[];
    const team2Scores = [team2Player1Net, team2Player2Net].filter(s => s !== null) as number[];
    
    const team1BestScore = team1Scores.length > 0 ? Math.min(...team1Scores) : null;
    const team2BestScore = team2Scores.length > 0 ? Math.min(...team2Scores) : null;
    
    // Determine which player had the best score
    let team1BestPlayer = null;
    let team2BestPlayer = null;
    
    if (team1BestScore !== null) {
      if (team1Player1Net === team1BestScore) team1BestPlayer = 1;
      else if (team1Player2Net === team1BestScore) team1BestPlayer = 2;
    }
    
    if (team2BestScore !== null) {
      if (team2Player1Net === team2BestScore) team2BestPlayer = 1;
      else if (team2Player2Net === team2BestScore) team2BestPlayer = 2;
    }
    
    // Determine hole winner
    let winner: 'team1' | 'team2' | 'tie' | null = null;
    if (team1BestScore !== null && team2BestScore !== null) {
      if (team1BestScore < team2BestScore) winner = 'team1';
      else if (team2BestScore < team1BestScore) winner = 'team2';
      else winner = 'tie';
    }
    
    return {
      hole,
      par,
      handicap,
      team1Player1: { score: team1Player1Score, net: team1Player1Net, hasStroke: team1Player1HasStroke },
      team1Player2: { score: team1Player2Score, net: team1Player2Net, hasStroke: team1Player2HasStroke },
      team2Player1: { score: team2Player1Score, net: team2Player1Net, hasStroke: team2Player1HasStroke },
      team2Player2: { score: team2Player2Score, net: team2Player2Net, hasStroke: team2Player2HasStroke },
      team1BestScore,
      team2BestScore,
      team1BestPlayer,
      team2BestPlayer,
      winner
    };
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

  const handleEditScore = (hole: number, playerId: number) => {
    const holeData = holes[hole - 1];
    let currentScore = '';
    
    if (playerId === team1Players[0]?.id) currentScore = holeData.team1Player1.score?.toString() || '';
    else if (playerId === team1Players[1]?.id) currentScore = holeData.team1Player2.score?.toString() || '';
    else if (playerId === team2Players[0]?.id) currentScore = holeData.team2Player1.score?.toString() || '';
    else if (playerId === team2Players[1]?.id) currentScore = holeData.team2Player2.score?.toString() || '';
    
    setEditingCell({ hole, playerId });
    setTempScore(currentScore);
  };

  const handleSaveScore = () => {
    if (editingCell && tempScore) {
      const grossScore = parseInt(tempScore);
      onUpdateScore(editingCell.hole, editingCell.playerId, grossScore);
      setEditingCell(null);
      setTempScore('');
    }
  };

  const matchStatus = calculateMatchStatus();

  const renderPlayerScore = (hole: HoleData, playerId: number, playerData: any, isTeamBest: boolean) => {
    const isEditing = editingCell?.hole === hole.hole && editingCell?.playerId === playerId;
    
    return (
      <div className="relative">
        {isEditing ? (
          <Input
            type="number"
            value={tempScore}
            onChange={(e) => setTempScore(e.target.value)}
            className="w-12 h-8 p-0 text-center text-xs"
            min="1"
            max="10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveScore();
              if (e.key === 'Escape') setEditingCell(null);
            }}
            autoFocus
          />
        ) : (
          <button
            onClick={() => handleEditScore(hole.hole, playerId)}
            className={`w-12 h-8 text-xs rounded relative ${
              isTeamBest ? 'bg-green-500 text-white font-bold ring-2 ring-green-300' :
              hole.winner === 'team1' || hole.winner === 'team2' ? 'bg-gray-600/30' :
              'hover:bg-white/10'
            }`}
          >
            {playerData.score || '-'}
            {playerData.hasStroke && (
              <Dot className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400" />
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Match Status Header */}
      <Card className="glass-effect border-green-500/30 bg-green-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-green-100">2-man Best Ball</h3>
              <p className="text-sm text-green-300">Match Play Format - Net Scoring</p>
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

      {/* Player Names */}
      <Card className="glass-effect border-white/20 bg-transparent">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-900/20 p-3 rounded">
              <h4 className="font-bold text-blue-200 mb-2">{match.team1.name}</h4>
              <div className="space-y-1 text-sm">
                <div>{team1Players[0]?.name} (HCP: {team1Players[0]?.handicap || '0'})</div>
                <div>{team1Players[1]?.name} (HCP: {team1Players[1]?.handicap || '0'})</div>
              </div>
            </div>
            <div className="bg-red-900/20 p-3 rounded">
              <h4 className="font-bold text-red-200 mb-2">{match.team2.name}</h4>
              <div className="space-y-1 text-sm">
                <div>{team2Players[0]?.name} (HCP: {team2Players[0]?.handicap || '0'})</div>
                <div>{team2Players[1]?.name} (HCP: {team2Players[1]?.handicap || '0'})</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scorecard */}
      <Card className="glass-effect border-white/20 bg-transparent">
        <CardHeader>
          <CardTitle className="text-center text-lg">Best Ball Scorecard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              {/* Header Row */}
              <thead>
                <tr className="border-b border-white/20">
                  <th className="p-2 text-left">HOLE</th>
                  {Array.from({ length: 9 }, (_, i) => (
                    <th key={i + 1} className="p-1 text-center w-16">{i + 1}</th>
                  ))}
                  <th className="p-2 text-center font-bold bg-green-900/30">OUT</th>
                  {Array.from({ length: 9 }, (_, i) => (
                    <th key={i + 10} className="p-1 text-center w-16">{i + 10}</th>
                  ))}
                  <th className="p-2 text-center font-bold bg-green-900/30">IN</th>
                  <th className="p-2 text-center font-bold bg-green-900/30">TOTAL</th>
                </tr>
              </thead>
              
              <tbody>
                {/* Par Row */}
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
                  <td className="p-2 text-center font-bold bg-green-900/30">72</td>
                </tr>

                {/* Handicap Row */}
                <tr className="border-b border-white/20 bg-gray-700/30">
                  <td className="p-2 font-semibold">HCP</td>
                  {holeHandicaps.slice(0, 9).map((hcp, i) => (
                    <td key={i} className="p-1 text-center text-xs">{hcp}</td>
                  ))}
                  <td className="p-2 text-center font-bold bg-green-900/30">-</td>
                  {holeHandicaps.slice(9).map((hcp, i) => (
                    <td key={i + 9} className="p-1 text-center text-xs">{hcp}</td>
                  ))}
                  <td className="p-2 text-center font-bold bg-green-900/30">-</td>
                  <td className="p-2 text-center font-bold bg-green-900/30">-</td>
                </tr>

                {/* Team 1 Player 1 */}
                <tr className="border-b border-white/10 bg-blue-900/10">
                  <td className="p-2 font-semibold text-blue-200 text-xs">{team1Players[0]?.name || 'Player 1'}</td>
                  {holes.slice(0, 9).map((hole, i) => (
                    <td key={i} className="p-1 text-center">
                      {renderPlayerScore(hole, team1Players[0]?.id, hole.team1Player1, hole.team1BestPlayer === 1)}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-blue-900/30">-</td>
                  {holes.slice(9).map((hole, i) => (
                    <td key={i + 9} className="p-1 text-center">
                      {renderPlayerScore(hole, team1Players[0]?.id, hole.team1Player1, hole.team1BestPlayer === 1)}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-blue-900/30">-</td>
                  <td className="p-2 text-center font-bold bg-blue-900/30">-</td>
                </tr>

                {/* Team 1 Player 2 */}
                <tr className="border-b border-white/20 bg-blue-900/10">
                  <td className="p-2 font-semibold text-blue-200 text-xs">{team1Players[1]?.name || 'Player 2'}</td>
                  {holes.slice(0, 9).map((hole, i) => (
                    <td key={i} className="p-1 text-center">
                      {renderPlayerScore(hole, team1Players[1]?.id, hole.team1Player2, hole.team1BestPlayer === 2)}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-blue-900/30">-</td>
                  {holes.slice(9).map((hole, i) => (
                    <td key={i + 9} className="p-1 text-center">
                      {renderPlayerScore(hole, team1Players[1]?.id, hole.team1Player2, hole.team1BestPlayer === 2)}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-blue-900/30">-</td>
                  <td className="p-2 text-center font-bold bg-blue-900/30">-</td>
                </tr>

                {/* Team 2 Player 1 */}
                <tr className="border-b border-white/10 bg-red-900/10">
                  <td className="p-2 font-semibold text-red-200 text-xs">{team2Players[0]?.name || 'Player 1'}</td>
                  {holes.slice(0, 9).map((hole, i) => (
                    <td key={i} className="p-1 text-center">
                      {renderPlayerScore(hole, team2Players[0]?.id, hole.team2Player1, hole.team2BestPlayer === 1)}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-red-900/30">-</td>
                  {holes.slice(9).map((hole, i) => (
                    <td key={i + 9} className="p-1 text-center">
                      {renderPlayerScore(hole, team2Players[0]?.id, hole.team2Player1, hole.team2BestPlayer === 1)}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-red-900/30">-</td>
                  <td className="p-2 text-center font-bold bg-red-900/30">-</td>
                </tr>

                {/* Team 2 Player 2 */}
                <tr className="border-b border-white/20 bg-red-900/10">
                  <td className="p-2 font-semibold text-red-200 text-xs">{team2Players[1]?.name || 'Player 2'}</td>
                  {holes.slice(0, 9).map((hole, i) => (
                    <td key={i} className="p-1 text-center">
                      {renderPlayerScore(hole, team2Players[1]?.id, hole.team2Player2, hole.team2BestPlayer === 2)}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-red-900/30">-</td>
                  {holes.slice(9).map((hole, i) => (
                    <td key={i + 9} className="p-1 text-center">
                      {renderPlayerScore(hole, team2Players[1]?.id, hole.team2Player2, hole.team2BestPlayer === 2)}
                    </td>
                  ))}
                  <td className="p-2 text-center font-bold bg-red-900/30">-</td>
                  <td className="p-2 text-center font-bold bg-red-900/30">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Controls */}
      {editingCell && (
        <Card className="glass-effect border-green-500/30 bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-green-100">Editing Hole {editingCell.hole}</h4>
                <p className="text-sm text-green-300">Enter gross score (net score calculated automatically)</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveScore}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!tempScore}
                >
                  Save
                </Button>
                <Button 
                  onClick={() => setEditingCell(null)}
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

      {/* Best Ball Legend */}
      <Card className="glass-effect border-white/20 bg-transparent">
        <CardContent className="p-4">
          <h4 className="font-bold mb-3 text-green-100">Best Ball Scoring</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded ring-2 ring-green-300"></div>
                <span>Team's best score used</span>
              </div>
              <div className="flex items-center gap-2">
                <Dot className="w-4 h-4 text-yellow-400" />
                <span>Player gets stroke (handicap)</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-gray-300">
                • Each player plays their own ball
              </div>
              <div className="text-xs text-gray-300">
                • Lowest net score per team counts
              </div>
              <div className="text-xs text-gray-300">
                • Net score = Gross score - Handicap strokes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}