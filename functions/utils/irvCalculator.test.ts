import { describe, it, expect } from "vitest";
import { calculateIRV } from "./irvCalculator";

describe("IRV Calculator", () => {
  it("should declare winner on first round if >50%", () => {
    // 3 candidates. 3 ballots. Candidate 0 has 2 top choices.
    const ballots = [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2]
    ];
    const result = calculateIRV(3, ballots);
    expect(result.winner).toBe(0);
    expect(result.rounds).toHaveLength(1);
    expect(result.rounds[0].voteCounts[0]).toBe(2);
  });

  it("should eliminate candidate and transfer vote", () => {
    // 3 candidates. 5 ballots.
    // 0: 2 votes [0,1,2], [0,1,2]
    // 1: 2 votes [1,0,2], [1,0,2]
    // 2: 1 vote [2,0,1]
    // Round 1: No one has > 2 votes (win threshold is 3). Candidate 2 is eliminated.
    // Round 2: Candidate 2's ballot transfers to 0. 0 gets 3 votes, 1 gets 2. Candidate 0 wins.
    const ballots = [
      [0, 1, 2],
      [0, 1, 2],
      [1, 0, 2],
      [1, 0, 2],
      [2, 0, 1]
    ];
    const result = calculateIRV(3, ballots);
    expect(result.winner).toBe(0);
    expect(result.rounds).toHaveLength(2);
    expect(result.rounds[0].eliminatedCandidates).toEqual([2]);
    expect(result.rounds[1].voteCounts[0]).toBe(3);
    expect(result.rounds[1].voteCounts[1]).toBe(2);
  });

  it("should handle ties", () => {
    // 2 candidates. 2 ballots.
    const ballots = [
      [0, 1],
      [1, 0]
    ];
    const result = calculateIRV(2, ballots);
    expect(result.winner).toBeUndefined();
    expect(result.tied).toEqual([0, 1]);
  });
});
