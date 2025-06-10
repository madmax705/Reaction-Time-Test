export const MIN_DELAY_MS = 1000; // Minimum delay before green light in milliseconds
export const MAX_DELAY_MS = 3000; // Maximum delay before green light in milliseconds

export const TOTAL_ROUNDS = 5;
export const TRIALS_PER_ROUND = 6;
export const SCORE_PRECISION = 3; // For ms display, e.g., 123.456 ms

export const ROUND_SOUND_LEVELS: string[] = [
  "No music (Control, 35dB)", // Round 1
  "40 dB",                    // Round 2
  "70 dB",                    // Round 3
  "50 dB",                    // Round 4
  "60 dB"                     // Round 5
];
