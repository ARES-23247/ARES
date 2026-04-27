export interface IRVRound {
  roundNumber: number;
  voteCounts: Record<number, number>; // Candidate index -> vote count
  eliminatedCandidates: number[]; // Candidate indices eliminated in this round
  winner?: number;
  tied?: number[];
}

export interface IRVResult {
  rounds: IRVRound[];
  winner?: number;
  tied?: number[];
}

/**
 * Calculates the winner of a Ranked Choice Vote using the Instant-Runoff Voting (IRV) algorithm.
 * @param candidatesCount The total number of candidates
 * @param ballots An array of ballots, where each ballot is an array of candidate indices ordered by preference
 * @returns The round-by-round results and the final winner or ties.
 */
export function calculateIRV(candidatesCount: number, ballots: number[][]): IRVResult {
  // MATH-F02 FIX: Immediate exit for zero ballots
  if (ballots.length === 0 || candidatesCount === 0) {
    return { rounds: [] };
  }

  const activeCandidates = new Set<number>();
  for (let i = 0; i < candidatesCount; i++) {
    activeCandidates.add(i);
  }

  const rounds: IRVRound[] = [];
  let roundNumber = 1;

  while (activeCandidates.size > 0) {
    const voteCounts: Record<number, number> = {};
    for (const c of activeCandidates) {
      voteCounts[c] = 0;
    }

    let validBallotsCount = 0;

    // Distribute votes
    for (const ballot of ballots) {
      // Find the highest ranked candidate that is still active
      for (const preference of ballot) {
        if (activeCandidates.has(preference)) {
          voteCounts[preference]++;
          validBallotsCount++;
          break; // Stop at the first valid choice
        }
      }
    }

    // Check for a winner (>50% of valid ballots)
    const winThreshold = Math.floor(validBallotsCount / 2) + 1;
    let winner: number | undefined;

    for (const [candidateStr, count] of Object.entries(voteCounts)) {
      if (count >= winThreshold && validBallotsCount > 0) {
        winner = parseInt(candidateStr);
        break;
      }
    }

    if (winner !== undefined) {
      rounds.push({
        roundNumber,
        voteCounts,
        eliminatedCandidates: [],
        winner,
      });
      return { rounds, winner };
    }

    // If no winner, find the candidate(s) with the least votes
    let minVotes = Infinity;
    for (const count of Object.values(voteCounts)) {
      if (count < minVotes) minVotes = count;
    }

    const tiedForLast = [];
    for (const [candidateStr, count] of Object.entries(voteCounts)) {
      if (count === minVotes) {
        tiedForLast.push(parseInt(candidateStr));
      }
    }

    // Unresolvable tie condition (all remaining candidates tied for last)
    if (tiedForLast.length === activeCandidates.size) {
      rounds.push({
        roundNumber,
        voteCounts,
        eliminatedCandidates: [],
        tied: tiedForLast,
      });
      return { rounds, tied: tiedForLast };
    }

    // IRV-F01 FIX: Sequential Elimination
    // If multiple candidates are tied for last, we eliminate the one with the FEWEST 
    // total higher-preference mentions across all ballots to break the tie fairly.
    let candidateToEliminate = tiedForLast[0];
    
    if (tiedForLast.length > 1) {
      const tieBreakerScores: Record<number, number> = {};
      for (const c of tiedForLast) tieBreakerScores[c] = 0;

      for (const ballot of ballots) {
        for (let rank = 0; rank < ballot.length; rank++) {
          const c = ballot[rank];
          if (tiedForLast.includes(c)) {
            // Higher ranks (lower index) get more "weight" to stay
            tieBreakerScores[c] += (ballot.length - rank);
          }
        }
      }

      let lowestScore = Infinity;
      for (const c of tiedForLast) {
        if (tieBreakerScores[c] < lowestScore) {
          lowestScore = tieBreakerScores[c];
          candidateToEliminate = c;
        }
      }
    }

    activeCandidates.delete(candidateToEliminate);

    rounds.push({
      roundNumber,
      voteCounts,
      eliminatedCandidates: [candidateToEliminate],
    });

    roundNumber++;
  }

  // Fallback (e.g. no valid ballots)
  return { rounds };
}
