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

    const toEliminate = [];
    for (const [candidateStr, count] of Object.entries(voteCounts)) {
      if (count === minVotes) {
        toEliminate.push(parseInt(candidateStr));
      }
    }

    // Unresolvable tie condition (all remaining candidates tied for last)
    if (toEliminate.length === activeCandidates.size) {
      rounds.push({
        roundNumber,
        voteCounts,
        eliminatedCandidates: [],
        tied: toEliminate,
      });
      return { rounds, tied: toEliminate };
    }

    // Eliminate candidates
    for (const c of toEliminate) {
      activeCandidates.delete(c);
    }

    rounds.push({
      roundNumber,
      voteCounts,
      eliminatedCandidates: toEliminate,
    });

    roundNumber++;
  }

  // Fallback (e.g. no valid ballots)
  return { rounds };
}
