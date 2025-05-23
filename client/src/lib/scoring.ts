// Golf scoring calculation utilities

export interface HoleScore {
  playerId: number;
  hole: number;
  strokes: number;
  par: number;
}

export interface MatchScore {
  team1Score: number;
  team2Score: number;
  team1Status: string;
  team2Status: string;
}

// Calculate 2-man Best Ball (Four-Ball) scoring
export function calculateBestBall(
  team1Scores: HoleScore[],
  team2Scores: HoleScore[],
  hole: number
): { team1Score: number; team2Score: number } {
  const team1HoleScores = team1Scores.filter(s => s.hole === hole);
  const team2HoleScores = team2Scores.filter(s => s.hole === hole);

  // Best ball takes the lowest score from each 2-man team on each hole
  const team1Best = team1HoleScores.length > 0 ? Math.min(...team1HoleScores.map(s => s.strokes)) : 0;
  const team2Best = team2HoleScores.length > 0 ? Math.min(...team2HoleScores.map(s => s.strokes)) : 0;

  return {
    team1Score: team1Best,
    team2Score: team2Best
  };
}

// Calculate 2v2 Scramble scoring (team selects best shot each time)
export function calculateScramble(
  teamScores: HoleScore[],
  hole: number
): number {
  const holeScores = teamScores.filter(s => s.hole === hole);
  // In scramble, the team score is the final team score after selecting best shots
  // This would typically be a single score entered for the team
  return holeScores.length > 0 ? holeScores[0].strokes : 0;
}

// Calculate 4v4 Scramble scoring (larger team format)
export function calculate4v4Scramble(
  teamScores: HoleScore[],
  hole: number
): number {
  const holeScores = teamScores.filter(s => s.hole === hole);
  // Same as regular scramble but with 4 players per team
  return holeScores.length > 0 ? holeScores[0].strokes : 0;
}

// Calculate 2v2 Shamble scoring (best drive, then individual play from there)
export function calculateShamble(
  team1Scores: HoleScore[],
  team2Scores: HoleScore[],
  hole: number
): { team1Score: number; team2Score: number } {
  // In shamble, after selecting best drive, players play individual ball
  // Final scoring is best ball of the two individual scores
  return calculateBestBall(team1Scores, team2Scores, hole);
}

// Calculate Singles Match scoring (individual head-to-head)
export function calculateSinglesMatch(
  player1Score: HoleScore,
  player2Score: HoleScore
): { player1Result: string; player2Result: string } {
  if (player1Score.strokes < player2Score.strokes) {
    return { player1Result: "Won", player2Result: "Lost" };
  } else if (player1Score.strokes > player2Score.strokes) {
    return { player1Result: "Lost", player2Result: "Won" };
  } else {
    return { player1Result: "Halved", player2Result: "Halved" };
  }
}

// Calculate match play status
export function calculateMatchPlayStatus(
  team1TotalScore: number,
  team2TotalScore: number,
  holesRemaining: number
): { team1Status: string; team2Status: string } {
  const scoreDifference = team1TotalScore - team2TotalScore;
  
  if (scoreDifference === 0) {
    return { team1Status: 'AS', team2Status: 'AS' };
  }
  
  const holesUp = Math.abs(scoreDifference);
  
  // Check if match is already decided
  if (holesUp > holesRemaining) {
    if (scoreDifference < 0) {
      return { 
        team1Status: `Won ${holesUp}&${holesRemaining}`, 
        team2Status: `Lost ${holesUp}&${holesRemaining}` 
      };
    } else {
      return { 
        team1Status: `Lost ${holesUp}&${holesRemaining}`, 
        team2Status: `Won ${holesUp}&${holesRemaining}` 
      };
    }
  }
  
  // Match still in progress
  if (scoreDifference < 0) {
    return { 
      team1Status: `${holesUp} UP`, 
      team2Status: `${holesUp} DN` 
    };
  } else {
    return { 
      team1Status: `${holesUp} DN`, 
      team2Status: `${holesUp} UP` 
    };
  }
}

// Calculate stroke play vs par
export function calculateStrokePlayScore(scores: HoleScore[]): number {
  return scores.reduce((total, score) => {
    return total + (score.strokes - score.par);
  }, 0);
}

// Get score relative to par (for display)
export function getScoreRelativeToPar(score: number): string {
  if (score === 0) return 'E';
  if (score < 0) return score.toString();
  return `+${score}`;
}

// Calculate hole score class for styling
export function getHoleScoreClass(strokes: number, par: number): string {
  const diff = strokes - par;
  
  if (diff <= -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  return 'double-bogey';
}

// Calculate team points for tournament standings
export function calculateTeamPoints(matches: any[]): number {
  return matches.reduce((total, match) => {
    if (match.status === 'completed' && match.winnerId) {
      return total + parseFloat(match.points || 1);
    }
    return total;
  }, 0);
}
