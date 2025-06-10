export enum GameState { // Internal state for ReactionTest component
  INITIAL = 'INITIAL', // Ready to start a trial, "Click to start..."
  WAITING = 'WAITING', // Red box, "Wait for green..." (timer running)
  CLICK_NOW = 'CLICK_NOW', // Green box, "Click!"
  TOO_SOON = 'TOO_SOON', // Blue box, "Too soon! Click to retry." -> Will retry current trial
  RESULT = 'RESULT' // Neutral/Blue box, "Your time: XXX ms. Click to continue."
}

export enum AppPhase {
  USER_IDENTIFICATION = 'USER_IDENTIFICATION',
  CONSENT_PAGE = 'CONSENT_PAGE', // New phase for displaying consent terms
  PRE_ROUND_BRIEFING = 'PRE_ROUND_BRIEFING', // e.g. "Round X of Y. Click to start."
  ACTIVE_TRIAL = 'ACTIVE_TRIAL', // ReactionTest component is active
  POST_ROUND_BRIEFING = 'POST_ROUND_BRIEFING', // After a round is complete
  SESSION_SUMMARY = 'SESSION_SUMMARY', // All rounds complete, show full stats
  ADMIN_SESSION_OVERVIEW = 'ADMIN_SESSION_OVERVIEW', // New phase for admin view
  DETAILED_SESSION_VIEW = 'DETAILED_SESSION_VIEW' // Phase for viewing a specific past session's details
}

export type UserSex = 'Male' | 'Female';

export interface User {
  name: string;
  sex: UserSex;
}

export interface TrialScore {
  trialNumber: number; // 1-indexed
  time: number | null; // Time in ms, null if not recorded (or if trial is pending)
}

export interface RoundData {
  roundNumber: number; // 1-indexed
  trials: TrialScore[];
}

export interface UserSession {
  user: User;
  sessionId: string; // Unique identifier for the session
  roundsData: RoundData[];
  startTime: number; // Timestamp of session start
  endTime?: number; // Timestamp of session end
}

// This ScoreEntry is kept for now as StatisticsDisplay might still use a flat list for some calcs,
// but primary data will be in UserSession.
export interface ScoreEntry {
  id: number;
  time: number;
  round?: number; // Optional: can be derived if needed separately
  trialInRound?: number; // Optional: can be derived
}