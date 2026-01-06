/**
 * Seeded Random Number Generator for Deterministic Pokemon TCG Simulation
 *
 * Uses a Linear Congruential Generator (LCG) for reproducible randomness.
 * All game randomness (coin flips, shuffles, etc.) should use this class
 * to ensure games can be replayed exactly.
 */

export class SeededRNG {
  private state: number;
  private readonly initialSeed: number;

  // LCG parameters (same as glibc)
  private static readonly A = 1103515245;
  private static readonly C = 12345;
  private static readonly M = 2 ** 31;

  constructor(seed?: number) {
    this.initialSeed = seed ?? Date.now();
    this.state = this.initialSeed;
  }

  /**
   * Get the next random number in [0, 1)
   */
  private next(): number {
    this.state = (SeededRNG.A * this.state + SeededRNG.C) % SeededRNG.M;
    return this.state / SeededRNG.M;
  }

  /**
   * Get a random integer in [min, max] (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Flip a coin - returns 0 (tails) or 1 (heads)
   */
  flipCoin(): 0 | 1 {
    return this.next() < 0.5 ? 0 : 1;
  }

  /**
   * Flip multiple coins
   * @returns Array of results (0 = tails, 1 = heads)
   */
  flipCoins(count: number): (0 | 1)[] {
    const results: (0 | 1)[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.flipCoin());
    }
    return results;
  }

  /**
   * Flip coins until tails (for "flip until tails" effects)
   * @returns Number of heads before first tails
   */
  flipUntilTails(): number {
    let heads = 0;
    while (this.flipCoin() === 1) {
      heads++;
    }
    return heads;
  }

  /**
   * Shuffle an array in place using Fisher-Yates algorithm
   * @returns The same array, shuffled
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Create a shuffled copy of an array
   */
  shuffled<T>(array: T[]): T[] {
    return this.shuffle([...array]);
  }

  /**
   * Pick a random element from an array
   */
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Pick n random elements from an array (without replacement)
   */
  pickN<T>(array: T[], n: number): T[] {
    if (n >= array.length) {
      return this.shuffled(array);
    }

    const copy = [...array];
    const result: T[] = [];

    for (let i = 0; i < n; i++) {
      const index = this.nextInt(0, copy.length - 1);
      result.push(copy[index]);
      copy.splice(index, 1);
    }

    return result;
  }

  /**
   * Get the current RNG state (for saving/replaying)
   */
  getState(): number {
    return this.state;
  }

  /**
   * Set the RNG state (for restoring a saved state)
   */
  setState(state: number): void {
    this.state = state;
  }

  /**
   * Get the initial seed used to create this RNG
   */
  getSeed(): number {
    return this.initialSeed;
  }

  /**
   * Reset to the initial seed
   */
  reset(): void {
    this.state = this.initialSeed;
  }

  /**
   * Create a snapshot of the current state that can be used to replay
   */
  snapshot(): RNGSnapshot {
    return {
      seed: this.initialSeed,
      state: this.state,
    };
  }

  /**
   * Restore from a snapshot
   */
  static fromSnapshot(snapshot: RNGSnapshot): SeededRNG {
    const rng = new SeededRNG(snapshot.seed);
    rng.setState(snapshot.state);
    return rng;
  }
}

export interface RNGSnapshot {
  seed: number;
  state: number;
}

/**
 * Coin flip result type
 */
export type CoinResult = 0 | 1;
export const HEADS: CoinResult = 1;
export const TAILS: CoinResult = 0;

/**
 * Create a new seeded RNG with an optional seed
 */
export function createRNG(seed?: number): SeededRNG {
  return new SeededRNG(seed);
}

/**
 * Generate a random seed
 */
export function generateSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
