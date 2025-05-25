// client/src/lib/scoring.ts

export interface HoleScoreEntry {
  playerId: number;
  hole: number;
  strokes: number;
}

export interface MatchScore {
  team1Score: number;
  team2Score: number;
  team1Status: string;
  team2Status: string;
}

export interface CourseHoleData {
  holeNumber: number;
  par: number;
  handicapRank: number;
  yardage?: number;
}

export interface PlayerHandicapInfo {
  playerId: number;
  handicapIndex: number; 
  courseHandicap: number; 
  playingHandicap: number; 
  strokesReceived: number; 
}

/**
 * Calculates a player's Course Handicap.
 * Formula: Handicap Index * (Slope Rating / 113) + (Course Rating - Course Par)
 * This is a common simplified version. Official calculations might vary slightly by region/rules.
 * @param handicapIndex Player's current handicap index.
 * @param slopeRating Slope rating of the course tees being played.
 * @param courseRating Course rating of the course tees being played.
 * @param coursePar Par of the course being played (sum of par for all 18 holes).
 * @returns Calculated Course Handicap (rounded to nearest whole number).
 */
export function calculateCourseHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  coursePar: number
): number {
  if (slopeRating === 0) return Math.round(handicapIndex);
  
  // Standard USGA formula component for slope/rating
  const slopeAdjustedHandicap = handicapIndex * (slopeRating / 113);
  
  // Optional: Adjustment for Course Rating vs Par. Some systems use this.
  // If your tournament rules don't include CR-Par adjustment for course handicap directly,
  // you might omit `+ (courseRating - coursePar)` or handle it in Playing Handicap.
  // For simplicity, including it here as it's often part of the base Course Handicap.
  const courseHandicap = slopeAdjustedHandicap + (courseRating - coursePar);
  
  return Math.round(courseHandicap);
}

/**
 * Calculates the Playing Handicap based on a percentage allowance.
 * @param courseHandicap The player's calculated course handicap.
 * @param allowancePercentage The percentage allowance (e.g., 90 for 90%).
 * @returns Playing Handicap (rounded to nearest whole number).
 */
export function calculatePlayingHandicap(
  courseHandicap: number,
  allowancePercentage: number = 100
): number {
  return Math.round(courseHandicap * (allowancePercentage / 100));
}

/**
 * Determines the number of strokes a player receives against the lowest net handicap in their group/match.
 * @param playerPlayingHandicap The player's playing handicap.
 * @param lowestPlayingHandicapInGroup The lowest playing handicap in the match/group.
 * @returns Number of strokes the player receives. Should be a whole number.
 */
export function calculateStrokesReceived(
  playerPlayingHandicap: number,
  lowestPlayingHandicapInGroup: number
): number {
  const strokes = playerPlayingHandicap - lowestPlayingHandicapInGroup;
  // Player receives the difference in playing handicaps.
  // If their handicap is lower or equal, they receive 0 strokes.
  return Math.max(0, Math.round(strokes)); 
}

/**
 * Determines if a player gets a stroke on a specific hole.
 * Strokes are given on the N lowest handicap-ranked holes, where N is strokesReceived.
 * If strokesReceived > 18, it wraps around (e.g., 19 strokes = 1 stroke on all holes, plus another on #1 handicap hole).
 * @param strokesReceived Total strokes the player receives for the round (integer).
 * @param holeHandicapRank The handicap rank of the current hole (1-18, where 1 is hardest).
 * @returns True if the player gets a stroke on this hole, false otherwise.
 */
export function doesPlayerGetStrokeOnHole(
  strokesReceived: number,
  holeHandicapRank: number
): boolean {
  if (strokesReceived <= 0) return false;
  if (holeHandicapRank <= 0 || holeHandicapRank > 18) return false; // Invalid hole handicap rank

  // If strokesReceived is 18 or more, player gets at least one stroke on every hole.
  if (strokesReceived >= 18) {
    // Check if they get an additional stroke due to very high handicap difference
    return holeHandicapRank <= (strokesReceived % 18 === 0 ? 18 : strokesReceived % 18) || strokesReceived >= 18;
  }
  // Standard allocation for less than 18 strokes
  return holeHandicapRank <= strokesReceived;
}


/**
 * Calculates the net score for a player on a given hole.
 * @param grossScore The player's gross score on the hole.
 * @param getsStroke True if the player receives a stroke on this hole.
 * @returns The player's net score for the hole.
 */
export function calculateNetScore(
  grossScore: number,
  getsStroke: boolean
): number {
  if (grossScore === null || grossScore === undefined) return 0; // Or handle as error/null
  return grossScore - (getsStroke ? 1 : 0);
}

/**
 * Calculates the best net score for a team on a hole (e.g., for Best Ball).
 * @param playerNetScores Array of net scores for the team's players on that hole.
 * @returns The lowest net score, or null if no valid scores.
 */
export function calculateBestBallNet(
  playerNetScores: (number | null)[]
): number | null {
  const validScores = playerNetScores.filter(s => s !== null && s !== undefined) as number[];
  if (validScores.length === 0) return null;
  return Math.min(...validScores);
}

// Calculate 2v2 Scramble scoring 
// This typically uses gross scores.
export function calculateScramble(
  teamScoreOnHole: number | null // This would be the single score the team achieved on the hole
): number | null {
  return teamScoreOnHole;
}

/**
 * Calculates match play status based on holes won by each team and holes played.
 * @param team1HolesWon Number of holes won by team 1.
 * @param team2HolesWon Number of holes won by team 2.
 * @param holesPlayed Total number of holes for which a result (win/loss/tie) has been determined.
 * @returns An object with team1Status, team2Status, matchOver flag, and optional winner.
 */
export function calculateMatchPlayStatus(
  team1HolesWon: number,
  team2HolesWon: number,
  holesPlayed: number
): { team1Status: string; team2Status: string; matchOver: boolean; winner?: 'team1' | 'team2' | 'tie' } {
  const holesRemaining = 18 - holesPlayed;
  const diff = team1HolesWon - team2HolesWon;

  // Match is over if one team's lead is greater than holes remaining
  if (Math.abs(diff) > holesRemaining) {
    if (diff > 0) { // Team 1 won
      return { team1Status: `${diff} & ${holesRemaining}`, team2Status: `${diff} & ${holesRemaining}`, matchOver: true, winner: 'team1' };
    } else { // Team 2 won
      return { team1Status: `${Math.abs(diff)} & ${holesRemaining}`, team2Status: `${Math.abs(diff)} & ${holesRemaining}`, matchOver: true, winner: 'team2' };
    }
  }

  // Match is over if all holes played
  if (holesRemaining === 0) {
    if (diff > 0) return { team1Status: "1 UP", team2Status: "1 DN", matchOver: true, winner: 'team1' }; // Final result if 1 up after 18
    if (diff < 0) return { team1Status: "1 DN", team2Status: "1 UP", matchOver: true, winner: 'team2' }; // Final result if 1 down after 18
    return { team1Status: 'AS', team2Status: 'AS', matchOver: true, winner: 'tie' }; // All Square after 18
  }
  
  // Match is ongoing
  if (diff === 0) {
    return { team1Status: 'AS', team2Status: 'AS', matchOver: false };
  } else if (diff > 0) {
    return { team1Status: `${diff} UP`, team2Status: `${diff} DN`, matchOver: false };
  } else { // diff < 0
    return { team1Status: `${Math.abs(diff)} DN`, team2Status: `${Math.abs(diff)} UP`, matchOver: false };
  }
}


// Get score relative to par (for display) - this uses individual hole par
export function getScoreRelativeToPar(strokes: number, par: number): string {
  if (strokes === null || strokes === undefined || par === null || par === undefined) return "-";
  const diff = strokes - par;
  if (diff === 0) return 'E';
  if (diff < 0) return diff.toString();
  return `+${diff}`;
}

// Calculate hole score class for styling
export function getHoleScoreClass(strokes: number | null, par: number): string {
  if (strokes === null || strokes === undefined || par === null || par === undefined) return 'bg-gray-700 text-gray-400'; // Not played or no score
  const diff = strokes - par;

  if (par === 3 && strokes === 1) return 'bg-purple-500 text-white'; // Ace on Par 3 (often styled uniquely)
  if (diff <= -2) return 'bg-yellow-400 text-gray-900'; // Eagle or better
  if (diff === -1) return 'bg-red-500 text-white';   // Birdie (often red in pro golf)
  if (diff === 0) return 'bg-gray-200 text-gray-800'; // Par (often white/light gray)
  if (diff === 1) return 'bg-blue-500 text-white';  // Bogey (often blue)
  return 'bg-blue-700 text-white'; // Double bogey or worse
}