import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dot, Edit2, Save, X } from "lucide-react"; // Added icons
import type { MatchWithDetails, HoleScore as DbHoleScore, Player, CourseHole } from "@shared/schema";
import {
  calculateCourseHandicap,
  calculatePlayingHandicap,
  calculateStrokesReceived,
  doesPlayerGetStrokeOnHole,
  calculateNetScore,
  calculateBestBallNet,
  calculateMatchPlayStatus,
  getHoleScoreClass, // For styling gross scores
  PlayerHandicapInfo, // Import this type
} from "@/lib/scoring"; // Assuming scoring functions are in this path
import { useToast } from "@/hooks/use-toast";

// These should ideally come from course data or tournament settings
const STANDARD_PARS = [4, 4, 3, 4, 5, 4, 3, 4, 4, 4, 4, 3, 5, 4, 3, 4, 4, 5];
const HOLE_HANDICAPS = [1, 11, 17, 5, 3, 15, 13, 7, 9, 2, 12, 18, 4, 6, 16, 14, 8, 10];
const HANDICAP_ALLOWANCE_PERCENTAGE = 90; // Example: 90% for Best Ball

interface BestBallScorecardProps {
  match: MatchWithDetails;
  holeScores: DbHoleScore[]; // Scores from DB
  onUpdateScore: (hole: number, playerId: number, grossScore: number) => void;
  isAdmin: boolean; // To enable/disable editing
}

interface PlayerProcessedInfo extends Player {
  handicapInfo: PlayerHandicapInfo;
}

interface DisplayHoleData {
  holeNumber: number;
  par: number;
  strokeIndex: number; // Handicap rank of the hole
  team1Player1: { gross: number | null; net: number | null; getsStroke: boolean; isContributing: boolean };
  team1Player2: { gross: number | null; net: number | null; getsStroke: boolean; isContributing: boolean };
  team2Player1: { gross: number | null; net: number | null; getsStroke: boolean; isContributing: boolean };
  team2Player2: { gross: number | null; net: number | null; getsStroke: boolean; isContributing: boolean };
  team1BestNet: number | null;
  team2BestNet: number | null;
  holeWinner: 'team1' | 'team2' | 'tie' | null;
}

export default function BestBallScorecard({ match, holeScores, onUpdateScore, isAdmin }: BestBallScorecardProps) {
  const [editingCell, setEditingCell] = useState<{ hole: number; playerId: number } | null>(null);
  const [tempScore, setTempScore] = useState<string>('');
  const { toast } = useToast();

  const courseData = match.round.course;
  // Remove courseHolesData from here; move it into the useMemo below

  const { team1Players, team2Players, allPlayersInfo } = useMemo(() => {
    const t1Players: Player[] = [];
    const t2Players: Player[] = [];

    match.matchPlayers.forEach(mp => {
      if (mp.teamId === match.team1Id) t1Players.push(mp.player);
      else if (mp.teamId === match.team2Id) t2Players.push(mp.player);
    });
    
    // Pad with placeholder if not enough players (should ideally not happen with good data)
    while (t1Players.length < 2) t1Players.push({ id: Date.now() + Math.random(), name: `T1 P${t1Players.length + 1}`, handicap: "0" } as Player);
    while (t2Players.length < 2) t2Players.push({ id: Date.now() + Math.random(), name: `T2 P${t2Players.length + 1}`, handicap: "0" } as Player);


    const allPlayers = [...t1Players.slice(0,2), ...t2Players.slice(0,2)];
    let lowestPlayingHandicap = Infinity;
    const playerInfos: PlayerProcessedInfo[] = [];

    if (courseData?.slope && courseData?.rating && courseData?.par) {
        allPlayers.forEach(p => {
            const handicapIndex = parseFloat(p.handicap || "0");
            const courseHandicap = calculateCourseHandicap(handicapIndex, courseData.slope!, parseFloat(courseData.rating!), courseData.par!);
            const playingHandicap = calculatePlayingHandicap(courseHandicap, HANDICAP_ALLOWANCE_PERCENTAGE);
            if (playingHandicap < lowestPlayingHandicap) {
                lowestPlayingHandicap = playingHandicap;
            }
            playerInfos.push({ ...p, handicapInfo: { playerId: p.id, handicapIndex, courseHandicap, playingHandicap, strokesReceived: 0 } });
        });

        playerInfos.forEach(pInfo => {
            pInfo.handicapInfo.strokesReceived = calculateStrokesReceived(pInfo.handicapInfo.playingHandicap, lowestPlayingHandicap);
        });
    } else {
         allPlayers.forEach(p => {
            const handicapIndex = parseFloat(p.handicap || "0");
            // Fallback if course data for handicap calc is missing
            playerInfos.push({ ...p, handicapInfo: { playerId: p.id, handicapIndex, courseHandicap: Math.round(handicapIndex), playingHandicap: Math.round(handicapIndex), strokesReceived: 0 } });
        });
    }


    return {
      team1Players: playerInfos.filter(p => p.teamId === match.team1Id || t1Players.find(tp => tp.id === p.id)),
      team2Players: playerInfos.filter(p => p.teamId === match.team2Id || t2Players.find(tp => tp.id === p.id)),
      allPlayersInfo: playerInfos,
    };
  }, [match, courseData]);


  const displayHoles: DisplayHoleData[] = useMemo(() => {
    const courseHolesData = courseData?.holes || [];
    return Array.from({ length: 18 }, (_, i) => {
      const holeNumber = i + 1;
      const courseHole = courseHolesData.find(ch => ch.holeNumber === holeNumber) || 
                         { holeNumber, par: STANDARD_PARS[i], handicapRank: HOLE_HANDICAPS[i] }; // Fallback

      const getPlayerDataForHole = (playerInfo?: PlayerProcessedInfo): DisplayHoleData['team1Player1'] => {
        if (!playerInfo) return { gross: null, net: null, getsStroke: false, isContributing: false };
        const gross = holeScores.find(hs => hs.playerId === playerInfo.id && hs.hole === holeNumber)?.strokes || null;
        const getsStroke = doesPlayerGetStrokeOnHole(playerInfo.handicapInfo.strokesReceived, courseHole.handicapRank);
        const net = gross !== null ? calculateNetScore(gross, getsStroke) : null;
        return { gross, net, getsStroke, isContributing: false }; // isContributing determined later
      };

      const data: Partial<DisplayHoleData> & {holeNumber: number, par: number, strokeIndex: number} = {
        holeNumber,
        par: courseHole.par,
        strokeIndex: courseHole.handicapRank,
        team1Player1: getPlayerDataForHole(team1Players[0]),
        team1Player2: getPlayerDataForHole(team1Players[1]),
        team2Player1: getPlayerDataForHole(team2Players[0]),
        team2Player2: getPlayerDataForHole(team2Players[1]),
      };

      data.team1BestNet = calculateBestBallNet([data.team1Player1!.net, data.team1Player2!.net]);
      data.team2BestNet = calculateBestBallNet([data.team2Player1!.net, data.team2Player2!.net]);
      
      if (data.team1BestNet !== null && data.team1Player1!.net === data.team1BestNet) data.team1Player1!.isContributing = true;
      else if (data.team1BestNet !== null && data.team1Player2!.net === data.team1BestNet) data.team1Player2!.isContributing = true;

      if (data.team2BestNet !== null && data.team2Player1!.net === data.team2BestNet) data.team2Player1!.isContributing = true;
      else if (data.team2BestNet !== null && data.team2Player2!.net === data.team2BestNet) data.team2Player2!.isContributing = true;


      if (data.team1BestNet !== null && data.team2BestNet !== null) {
        if (data.team1BestNet < data.team2BestNet) data.holeWinner = 'team1';
        else if (data.team2BestNet < data.team1BestNet) data.holeWinner = 'team2';
        else data.holeWinner = 'tie';
      } else {
        data.holeWinner = null;
      }
      return data as DisplayHoleData;
    });
  }, [holeScores, team1Players, team2Players, courseData?.holes]);

  const { team1MatchStatus, team2MatchStatus, isMatchOver } = useMemo(() => {
    let t1HolesWon = 0;
    let t2HolesWon = 0;
    let playedHolesCount = 0;
    displayHoles.forEach(h => {
      if (h.holeWinner) {
        playedHolesCount++;
        if (h.holeWinner === 'team1') t1HolesWon++;
        else if (h.holeWinner === 'team2') t2HolesWon++;
      }
    });
    const status = calculateMatchPlayStatus(t1HolesWon, t2HolesWon, playedHolesCount);
    return { team1MatchStatus: status.team1Status, team2MatchStatus: status.team2Status, isMatchOver: status.matchOver };
  }, [displayHoles]);


  const handleEditScore = (hole: number, playerId: number) => {
    if (!isAdmin || match.isLocked) {
        toast({ title: "Editing Disabled", description: "Scores cannot be edited for locked matches or by non-admins.", variant: "destructive" });
        return;
    }
    const existingScore = holeScores.find(s => s.hole === hole && s.playerId === playerId)?.strokes;
    setEditingCell({ hole, playerId });
    setTempScore(existingScore?.toString() || '');
  };

  const handleSaveScore = () => {
    if (editingCell && tempScore.trim() !== '') {
      const grossScore = parseInt(tempScore);
      if (!isNaN(grossScore) && grossScore >= 1 && grossScore <= 15) { // Basic validation
        onUpdateScore(editingCell.hole, editingCell.playerId, grossScore);
        setEditingCell(null);
        setTempScore('');
      } else {
        toast({ title: "Invalid Score", description: "Please enter a valid score (1-15).", variant: "destructive" });
      }
    } else if (editingCell && tempScore.trim() === '') { // Allow clearing score
        onUpdateScore(editingCell.hole, editingCell.playerId, 0); // Or a special value for null
        setEditingCell(null);
        setTempScore('');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingCell(null);
    setTempScore('');
  }

  const renderPlayerScoreCell = (holeData: DisplayHoleData, playerInfo: PlayerProcessedInfo | undefined, playerData: DisplayHoleData['team1Player1']) => {
    if (!playerInfo) return <td className="p-1 text-center">-</td>;
    const isEditingThisCell = editingCell?.hole === holeData.holeNumber && editingCell?.playerId === playerInfo.id;

    return (
      <td className="p-1 text-center">
        {isEditingThisCell ? (
          <div className="flex items-center justify-center gap-1">
            <Input
              type="number"
              value={tempScore}
              onChange={(e) => setTempScore(e.target.value)}
              className="w-10 h-7 p-0 text-center text-xs bg-gray-700 border-gray-600"
              min="1" max="15" autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveScore(); if (e.key === 'Escape') handleCancelEdit(); }}
            />
            <Button size="icon" variant="ghost" className="h-6 w-6 p-0 text-green-400 hover:text-green-300" onClick={handleSaveScore}><Save className="h-3 w-3"/></Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit}><X className="h-3 w-3"/></Button>
          </div>
        ) : (
          <div
            onClick={() => handleEditScore(holeData.holeNumber, playerInfo.id)}
            className={`w-full h-8 flex items-center justify-center text-xs rounded cursor-pointer relative 
                        ${playerData.isContributing ? 'bg-green-600 text-white font-semibold ring-1 ring-green-300' : 'bg-gray-700/50 hover:bg-gray-600/50'}
                        ${getHoleScoreClass(playerData.gross, holeData.par)}`} // Style based on gross score vs par
          >
            {playerData.gross !== null ? playerData.gross : '-'}
            {playerData.getsStroke && playerData.gross !== null && (
              <Dot className="w-3 h-3 absolute -top-0.5 -right-0.5 text-yellow-300" />
            )}
          </div>
        )}
      </td>
    );
  };

  const calculateTotal = (player: PlayerProcessedInfo | undefined, type: 'gross' | 'net' | 'holesWon', part: 'front' | 'back' | 'total') => {
    if (!player && type !== 'holesWon') return '-';

    let sum = 0;
    let count = 0;
    const startIdx = part === 'back' ? 9 : 0;
    const endIdx = part === 'front' ? 9 : 18;

    for (let i = startIdx; i < endIdx; i++) {
        const hole = displayHoles[i];
        let scoreToUse: number | null = null;
        let pData: DisplayHoleData['team1Player1'] | undefined;

        if (player?.id === team1Players[0]?.id) pData = hole.team1Player1;
        else if (player?.id === team1Players[1]?.id) pData = hole.team1Player2;
        else if (player?.id === team2Players[0]?.id) pData = hole.team2Player1;
        else if (player?.id === team2Players[1]?.id) pData = hole.team2Player2;

        if (pData) {
            if (type === 'gross' && pData.gross !== null) scoreToUse = pData.gross;
            else if (type === 'net' && pData.net !== null) scoreToUse = pData.net;
        }
        
        if (scoreToUse !== null) {
            sum += scoreToUse;
            count++;
        }
    }
    return count > 0 ? sum.toString() : '-';
  };
  
  const calculateTeamBestBallTotal = (teamId: number, part: 'front' | 'back' | 'total') => {
    let sum = 0;
    let count = 0;
    const startIdx = part === 'back' ? 9 : 0;
    const endIdx = part === 'front' ? 9 : 18;

    for (let i = startIdx; i < endIdx; i++) {
        const hole = displayHoles[i];
        const scoreToUse = teamId === match.team1Id ? hole.team1BestNet : hole.team2BestNet;
        if (scoreToUse !== null) {
            sum += scoreToUse;
            count++;
        }
    }
    return count > 0 ? sum.toString() : '-';
  };


  return (
    <div className="space-y-4">
      <Card className="glass-effect border-green-500/30 bg-green-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-green-100">{match.round.format}</h3>
              <p className="text-sm text-green-300">Match Play - Net Best Ball ({HANDICAP_ALLOWANCE_PERCENTAGE}%)</p>
            </div>
            <div className="text-right">
              <div className={`text-xl font-bold ${isMatchOver && (team1MatchStatus.includes('&') || team2MatchStatus.includes('&')) ? 'text-yellow-300' : 'text-green-400'}`}>
                {team1MatchStatus.includes("wins") ? team1MatchStatus : team2MatchStatus.includes("wins") ? team2MatchStatus : team1MatchStatus || "Match Even"}
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-400/30">
                {isMatchOver ? "FINAL" : "LIVE"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-white/20 bg-transparent">
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-blue-900/30 p-2 rounded">
              <h4 className="font-semibold text-blue-200 mb-1">{match.team1.name}</h4>
              {team1Players.map(p => p && (
                <div key={p.id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span>HCP: {p.handicapInfo?.playingHandicap} ({p.handicapInfo?.strokesReceived} strk)</span>
                </div>
              ))}
            </div>
            <div className="bg-red-900/30 p-2 rounded">
              <h4 className="font-semibold text-red-200 mb-1">{match.team2.name}</h4>
              {team2Players.map(p => p && (
                <div key={p.id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span>HCP: {p.handicapInfo?.playingHandicap} ({p.handicapInfo?.strokesReceived} strk)</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-white/20 bg-transparent">
        <CardHeader><CardTitle className="text-center text-base">Net Best Ball Scorecard</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-xs">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="p-1 text-left sticky left-0 bg-gray-800/50 z-10 w-[100px]">HOLE</th>
                  {Array.from({ length: 9 }, (_, i) => <th key={i + 1} className="p-1 text-center w-14">{i + 1}</th>)}
                  <th className="p-1 text-center font-bold bg-gray-700/50 w-12">OUT</th>
                  {Array.from({ length: 9 }, (_, i) => <th key={i + 10} className="p-1 text-center w-14">{i + 10}</th>)}
                  <th className="p-1 text-center font-bold bg-gray-700/50 w-12">IN</th>
                  <th className="p-1 text-center font-bold bg-gray-700/50 w-12">TOT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/20 bg-gray-800/30">
                  <td className="p-1 font-semibold sticky left-0 bg-gray-800/30 z-10">PAR</td>
                  {displayHoles.slice(0, 9).map(h => <td key={h.holeNumber} className="p-1 text-center font-medium">{h.par}</td>)}
                  <td className="p-1 text-center font-bold bg-gray-700/50">{displayHoles.slice(0,9).reduce((s,h) => s + h.par, 0)}</td>
                  {displayHoles.slice(9).map(h => <td key={h.holeNumber} className="p-1 text-center font-medium">{h.par}</td>)}
                  <td className="p-1 text-center font-bold bg-gray-700/50">{displayHoles.slice(9).reduce((s,h) => s + h.par, 0)}</td>
                  <td className="p-1 text-center font-bold bg-gray-700/50">{displayHoles.reduce((s,h) => s + h.par, 0)}</td>
                </tr>
                <tr className="border-b border-white/20 bg-gray-700/30">
                  <td className="p-1 font-semibold sticky left-0 bg-gray-700/30 z-10">S.I.</td>
                  {displayHoles.slice(0, 9).map(h => <td key={h.holeNumber} className="p-1 text-center text-xs">{h.strokeIndex}</td>)}
                  <td className="p-1 text-center font-bold bg-gray-700/50">-</td>
                  {displayHoles.slice(9).map(h => <td key={h.holeNumber} className="p-1 text-center text-xs">{h.strokeIndex}</td>)}
                  <td className="p-1 text-center font-bold bg-gray-700/50">-</td>
                  <td className="p-1 text-center font-bold bg-gray-700/50">-</td>
                </tr>

                {/* Team 1 Players */}
                {team1Players.map((player, playerIdx) => player && (
                    <tr key={player.id} className={`border-b border-white/10 ${playerIdx === 0 ? 'bg-blue-900/20' : 'bg-blue-900/10'}`}>
                        <td className="p-1 font-semibold text-blue-200 text-left sticky left-0 bg-blue-900/30 z-10 truncate max-w-[100px]">{player.name}</td>
                        {displayHoles.slice(0,9).map(h => renderPlayerScoreCell(h, player, playerIdx === 0 ? h.team1Player1 : h.team1Player2))}
                        <td className="p-1 text-center font-bold bg-blue-800/40">{calculateTotal(player, 'gross', 'front')}</td>
                        {displayHoles.slice(9).map(h => renderPlayerScoreCell(h, player, playerIdx === 0 ? h.team1Player1 : h.team1Player2))}
                        <td className="p-1 text-center font-bold bg-blue-800/40">{calculateTotal(player, 'gross', 'back')}</td>
                        <td className="p-1 text-center font-bold bg-blue-800/40">{calculateTotal(player, 'gross', 'total')}</td>
                    </tr>
                ))}
                <tr className="border-b-2 border-blue-400 bg-blue-700/40">
                  <td className="p-1 font-bold text-blue-100 sticky left-0 bg-blue-700/40 z-10">{match.team1.name} Best Net</td>
                  {displayHoles.slice(0,9).map(h => <td key={h.holeNumber} className={`p-1 text-center font-bold ${h.holeWinner === 'team1' ? 'text-green-300' : h.holeWinner === 'tie' ? 'text-yellow-300': ''}`}>{h.team1BestNet ?? '-'}</td>)}
                  <td className="p-1 text-center font-extrabold bg-blue-600/50">{match.team1Id != null ? calculateTeamBestBallTotal(match.team1Id, 'front') : '-'}</td>
                  {displayHoles.slice(9).map(h => <td key={h.holeNumber} className={`p-1 text-center font-bold ${h.holeWinner === 'team1' ? 'text-green-300' : h.holeWinner === 'tie' ? 'text-yellow-300': ''}`}>{h.team1BestNet ?? '-'}</td>)}
                  <td className="p-1 text-center font-extrabold bg-blue-600/50">{match.team1Id != null ? calculateTeamBestBallTotal(match.team1Id, 'back') : '-'}</td>
                  <td className="p-1 text-center font-extrabold bg-blue-600/50">{match.team1Id != null ? calculateTeamBestBallTotal(match.team1Id, 'total') : '-'}</td>
                </tr>

                {/* Match Status Central Row */}
                 <tr className="border-y-2 border-green-400 bg-green-900/40 h-10">
                  <td className="p-1 font-extrabold text-green-200 sticky left-0 bg-green-900/40 z-10">MATCH STATUS</td>
                  {displayHoles.slice(0,9).map(h => <td key={h.holeNumber} className={`p-1 text-center font-bold text-lg ${h.holeWinner === 'team1' ? 'text-blue-300' : h.holeWinner === 'team2' ? 'text-red-300' : h.holeWinner === 'tie' ? 'text-yellow-300': 'text-gray-500'}`}>{h.holeWinner === 'team1' ? '↑' : h.holeWinner === 'team2' ? '↓' : h.holeWinner === 'tie' ? '=' : ''}</td>)}
                  <td colSpan={1} className="p-1 text-center font-extrabold text-green-200 bg-green-800/50">{team1MatchStatus}</td>
                  {displayHoles.slice(9).map(h => <td key={h.holeNumber} className={`p-1 text-center font-bold text-lg ${h.holeWinner === 'team1' ? 'text-blue-300' : h.holeWinner === 'team2' ? 'text-red-300' : h.holeWinner === 'tie' ? 'text-yellow-300': 'text-gray-500'}`}>{h.holeWinner === 'team1' ? '↑' : h.holeWinner === 'team2' ? '↓' : h.holeWinner === 'tie' ? '=' : ''}</td>)}
                  <td colSpan={2} className="p-1 text-center font-extrabold text-green-200 bg-green-800/50">{team1MatchStatus}</td>
                </tr>

                {/* Team 2 Players */}
                 <tr className="border-b-2 border-red-400 bg-red-700/40">
                  <td className="p-1 font-bold text-red-100 sticky left-0 bg-red-700/40 z-10">{match.team2.name} Best Net</td>
                  {displayHoles.slice(0,9).map(h => <td key={h.holeNumber} className={`p-1 text-center font-bold ${h.holeWinner === 'team2' ? 'text-green-300' : h.holeWinner === 'tie' ? 'text-yellow-300': ''}`}>{h.team2BestNet ?? '-'}</td>)}
                  <td className="p-1 text-center font-extrabold bg-red-600/50">{match.team2Id != null ? calculateTeamBestBallTotal(match.team2Id, 'front') : '-'}</td>
                  {displayHoles.slice(9).map(h => <td key={h.holeNumber} className={`p-1 text-center font-bold ${h.holeWinner === 'team2' ? 'text-green-300' : h.holeWinner === 'tie' ? 'text-yellow-300': ''}`}>{h.team2BestNet ?? '-'}</td>)}
                  <td className="p-1 text-center font-extrabold bg-red-600/50">{match.team2Id != null ? calculateTeamBestBallTotal(match.team2Id, 'back') : '-'}</td>
                  <td className="p-1 text-center font-extrabold bg-red-600/50">{match.team2Id != null ? calculateTeamBestBallTotal(match.team2Id, 'total') : '-'}</td>
                </tr>
                {team2Players.map((player, playerIdx) => player && (
                    <tr key={player.id} className={`border-b border-white/10 ${playerIdx === 0 ? 'bg-red-900/20' : 'bg-red-900/10'}`}>
                        <td className="p-1 font-semibold text-red-200 text-left sticky left-0 bg-red-900/30 z-10 truncate max-w-[100px]">{player.name}</td>
                        {displayHoles.slice(0,9).map(h => renderPlayerScoreCell(h, player, playerIdx === 0 ? h.team2Player1 : h.team2Player2))}
                        <td className="p-1 text-center font-bold bg-red-800/40">{calculateTotal(player, 'gross', 'front')}</td>
                        {displayHoles.slice(9).map(h => renderPlayerScoreCell(h, player, playerIdx === 0 ? h.team2Player1 : h.team2Player2))}
                        <td className="p-1 text-center font-bold bg-red-800/40">{calculateTotal(player, 'gross', 'back')}</td>
                        <td className="p-1 text-center font-bold bg-red-800/40">{calculateTotal(player, 'gross', 'total')}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {editingCell && (isAdmin && !match.isLocked) && (
        <Card className="glass-effect border-green-500/30 bg-green-900/20 mt-4">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-green-100">Editing Hole {editingCell.hole} for Player ID {editingCell.playerId}</h4>
                <p className="text-xs text-green-300">Enter gross score. Net score & match status will update.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-effect border-white/20 bg-transparent text-xs">
        <CardContent className="p-3 space-y-1">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-green-600 ring-1 ring-green-300"/>Contributing team score (Net)</div>
            <div className="flex items-center gap-2"><Dot className="w-3 h-3 text-yellow-300"/>Stroke received on hole</div>
            <div className="flex items-center gap-2"><span className="text-blue-300 font-bold">↑</span> Team 1 won hole (Net)</div>
            <div className="flex items-center gap-2"><span className="text-red-300 font-bold">↓</span> Team 2 won hole (Net)</div>
            <div className="flex items-center gap-2"><span className="text-yellow-300 font-bold">=</span> Hole tied (Net)</div>
        </CardContent>
      </Card>
    </div>
  );
}