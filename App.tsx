import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ReactionTest } from '@/components/ReactionTest';
import { StatisticsDisplay } from '@/components/StatisticsDisplay';
import { UserIdentificationForm } from '@/components/UserIdentificationForm';
import { UserStatusIcon } from '@/components/UserStatusIcon';
import { AdminOverviewIcon } from '@/components/AdminOverviewIcon';
import { AllSessionsSummary } from '@/components/AllSessionsSummary';
import { ConsentPage } from '@/components/ConsentPage'; // Import ConsentPage
import { AppPhase, User, UserSession, RoundData, TrialScore } from './types';
import { TOTAL_ROUNDS, TRIALS_PER_ROUND, ROUND_SOUND_LEVELS } from './constants';
import { UserSex } from './types';

const initializeNewSessionData = (user: User): UserSession => {
  const roundsData: RoundData[] = [];
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const trials: TrialScore[] = [];
    for (let j = 0; j < TRIALS_PER_ROUND; j++) {
      trials.push({
        trialNumber: j + 1,
        time: null,
      });
    }
    roundsData.push({ roundNumber: i + 1, trials });
  }
  return {
    user,
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    roundsData,
    startTime: Date.now(),
  };
};

const getCurrentProgress = (sessionData: UserSession | null): { round: number, trial: number, isComplete: boolean } => {
  if (!sessionData) return { round: 1, trial: 1, isComplete: false };

  for (const round of sessionData.roundsData) {
    for (const trial of round.trials) {
      if (trial.time === null) {
        return { round: round.roundNumber, trial: trial.trialNumber, isComplete: false };
      }
    }
  }
  return {
    round: TOTAL_ROUNDS,
    trial: TRIALS_PER_ROUND,
    isComplete: true
  };
};

const createExampleSession = (): UserSession => {
  const roundsData: RoundData[] = [];
  const baseReactionTimes = [180, 220, 250, 280, 320]; // Base times for each round
  const variation = 50; // Random variation to add to base times

  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const trials: TrialScore[] = [];
    for (let j = 0; j < TRIALS_PER_ROUND; j++) {
      // Generate realistic reaction times with some random variation
      const baseTime = baseReactionTimes[i];
      const randomVariation = Math.random() * variation - (variation / 2);
      const time = Math.max(100, Math.round(baseTime + randomVariation)); // Ensure minimum time of 100ms
      trials.push({
        trialNumber: j + 1,
        time: time,
      });
    }
    roundsData.push({ roundNumber: i + 1, trials });
  }

  const startTime = Date.now() - (1000 * 60 * 30); // 30 minutes ago
  const endTime = startTime + (1000 * 60 * 15); // 15 minutes duration

  return {
    user: {
      name: "Max",
      sex: "Male" as UserSex
    },
    sessionId: "example_session_max",
    roundsData,
    startTime,
    endTime
  };
};

const App: React.FC = () => {
  const [appPhase, setAppPhase] = useState<AppPhase>(AppPhase.USER_IDENTIFICATION);
  const [previousAppPhase, setPreviousAppPhase] = useState<AppPhase | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSessionData, setCurrentSessionData] = useState<UserSession | null>(null);
  const [allSessions, setAllSessions] = useState<UserSession[]>([]);
  const [selectedSessionForDetailViewId, setSelectedSessionForDetailViewId] = useState<string | null>(null);

  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(1);
  const [currentTrialInRoundNumber, setCurrentTrialInRoundNumber] = useState<number>(1);

  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem('reactionTestAllSessions');
      let sessions: UserSession[] = [];
      if (storedSessions) {
        sessions = JSON.parse(storedSessions);
      }

      // Add example session if it doesn't exist
      if (!sessions.some(s => s.sessionId === "example_session_max")) {
        sessions.push(createExampleSession());
      }

      setAllSessions(sessions);
    } catch (error) {
      console.error("Failed to load sessions from localStorage:", error);
      // Initialize with example session if loading fails
      setAllSessions([createExampleSession()]);
    }
  }, []);

  useEffect(() => {
    try {
      // Don't save the example session to localStorage
      const sessionsToSave = allSessions.filter(s => s.sessionId !== "example_session_max");
      localStorage.setItem('reactionTestAllSessions', JSON.stringify(sessionsToSave));
    } catch (error) {
      console.error("Failed to save sessions to localStorage:", error);
    }
  }, [allSessions]);

  useEffect(() => {
    if (currentSessionData) {
      setAllSessions(prevSessions => {
        const existingSessionIndex = prevSessions.findIndex(s => s.sessionId === currentSessionData.sessionId);
        if (existingSessionIndex > -1) {
          const updatedSessions = [...prevSessions];
          updatedSessions[existingSessionIndex] = currentSessionData;
          return updatedSessions;
        } else {
          // This case should ideally not be hit if session is initialized properly into allSessions
          // but as a fallback, add it if it's new and not from continuation
          if (!prevSessions.find(s => s.sessionId === currentSessionData.sessionId)) {
            return [...prevSessions, currentSessionData];
          }
          return prevSessions;
        }
      });
    }
  }, [currentSessionData]);


  const handleUserSubmit = useCallback((name: string, sex: UserSex) => {
    const user: User = { name, sex };
    setCurrentUser(user);
    const newSession = initializeNewSessionData(user);
    setCurrentSessionData(newSession);
    setAllSessions(prevAllSessions => {
      const existingSessionIndex = prevAllSessions.findIndex(s => s.sessionId === newSession.sessionId);
      if (existingSessionIndex > -1) {
        const updatedSessions = [...prevAllSessions];
        updatedSessions[existingSessionIndex] = newSession;
        return updatedSessions;
      }
      return [...prevAllSessions, newSession];
    });
    setCurrentRoundNumber(1);
    setCurrentTrialInRoundNumber(1);
    setAppPhase(AppPhase.PRE_ROUND_BRIEFING);
  }, []);

  const startRound = useCallback(() => {
    setAppPhase(AppPhase.ACTIVE_TRIAL);
  }, []);

  const handleTrialComplete = useCallback((time: number) => {
    if (!currentSessionData) return;

    const updatedRoundsData = currentSessionData.roundsData.map(r => {
      if (r.roundNumber === currentRoundNumber) {
        return {
          ...r,
          trials: r.trials.map(t =>
            t.trialNumber === currentTrialInRoundNumber
              ? { ...t, time }
              : t
          ),
        };
      }
      return r;
    });
    setCurrentSessionData(prev => prev ? { ...prev, roundsData: updatedRoundsData } : null);
  }, [currentSessionData, currentRoundNumber, currentTrialInRoundNumber]);

  const handleResultAcknowledged = useCallback(() => {
    if (currentTrialInRoundNumber < TRIALS_PER_ROUND) {
      setCurrentTrialInRoundNumber(prev => prev + 1);
      setAppPhase(AppPhase.ACTIVE_TRIAL);
    } else {
      if (currentRoundNumber < TOTAL_ROUNDS) {
        setAppPhase(AppPhase.POST_ROUND_BRIEFING);
      } else {
        const completedSessionWithEndTime = { ...currentSessionData, endTime: Date.now() } as UserSession;
        setCurrentSessionData(completedSessionWithEndTime);
        setAllSessions(prevSessions =>
          prevSessions.map(s => s.sessionId === completedSessionWithEndTime.sessionId ? completedSessionWithEndTime : s)
        );
        setAppPhase(AppPhase.SESSION_SUMMARY);
      }
    }
  }, [currentTrialInRoundNumber, currentRoundNumber, currentSessionData]);


  const startNextRound = useCallback(() => {
    setCurrentRoundNumber(prev => prev + 1);
    setCurrentTrialInRoundNumber(1);
    setAppPhase(AppPhase.PRE_ROUND_BRIEFING);
  }, []);

  const startNewUserSession = useCallback(() => {
    setCurrentUser(null);
    setCurrentSessionData(null);
    setSelectedSessionForDetailViewId(null);
    setCurrentRoundNumber(1);
    setCurrentTrialInRoundNumber(1);
    setAppPhase(AppPhase.USER_IDENTIFICATION);
  }, []);

  const navigateToAdminOverview = useCallback(() => {
    setPreviousAppPhase(appPhase);
    setSelectedSessionForDetailViewId(null);
    setAppPhase(AppPhase.ADMIN_SESSION_OVERVIEW);
  }, [appPhase]);

  const exitAdminOverview = useCallback(() => {
    setAppPhase(previousAppPhase || AppPhase.USER_IDENTIFICATION);
    setPreviousAppPhase(null);
  }, [previousAppPhase]);

  const navigateToConsentPage = useCallback(() => {
    setPreviousAppPhase(appPhase);
    setAppPhase(AppPhase.CONSENT_PAGE);
  }, [appPhase]);

  const exitConsentPage = useCallback(() => {
    setAppPhase(AppPhase.USER_IDENTIFICATION);
    setPreviousAppPhase(null);
  }, []);

  const handleNavigateToDetailedView = useCallback((sessionId: string) => {
    setSelectedSessionForDetailViewId(sessionId);
    setPreviousAppPhase(AppPhase.ADMIN_SESSION_OVERVIEW); // Remember where we came from
    setAppPhase(AppPhase.DETAILED_SESSION_VIEW);
  }, []);

  const handleExitDetailedView = useCallback(() => {
    setSelectedSessionForDetailViewId(null);
    setAppPhase(AppPhase.ADMIN_SESSION_OVERVIEW);
    setPreviousAppPhase(null);
  }, []);


  const handleContinueSession = useCallback((sessionId: string) => {
    const sessionToContinue = allSessions.find(s => s.sessionId === sessionId && !s.endTime);
    if (sessionToContinue) {
      setCurrentUser(sessionToContinue.user);
      setCurrentSessionData(sessionToContinue);

      const progress = getCurrentProgress(sessionToContinue);

      if (progress.isComplete && !sessionToContinue.endTime) {
        // This case should ideally be handled by session ending logic
        // Forcing session summary if somehow it's complete but no endTime
        const completedSession = { ...sessionToContinue, endTime: Date.now() };
        setCurrentSessionData(completedSession);
        setAllSessions(prev => prev.map(s => s.sessionId === completedSession.sessionId ? completedSession : s));
        setAppPhase(AppPhase.SESSION_SUMMARY);
        return;
      }

      setCurrentRoundNumber(progress.round);
      setCurrentTrialInRoundNumber(progress.trial);

      setPreviousAppPhase(AppPhase.ADMIN_SESSION_OVERVIEW);
      setAppPhase(AppPhase.PRE_ROUND_BRIEFING);
    } else {
      console.warn("Could not find active session to continue with ID:", sessionId);
      setAppPhase(AppPhase.USER_IDENTIFICATION);
    }
  }, [allSessions]);

  const currentReactionTestKey = useMemo(() => {
    if (!currentSessionData) return 'no-session';
    return `rt-${currentSessionData.sessionId}-r${currentRoundNumber}-t${currentTrialInRoundNumber}`;
  }, [currentSessionData, currentRoundNumber, currentTrialInRoundNumber]);

  const renderContent = () => {
    switch (appPhase) {
      case AppPhase.USER_IDENTIFICATION:
        return <UserIdentificationForm onSubmit={handleUserSubmit} onNavigateToConsent={navigateToConsentPage} />;
      case AppPhase.CONSENT_PAGE:
        return <ConsentPage onGoBack={exitConsentPage} />;
      case AppPhase.PRE_ROUND_BRIEFING:
        const soundLevel = ROUND_SOUND_LEVELS[currentRoundNumber - 1] || "N/A";
        return (
          <div className="w-full max-w-2xl flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-xl text-center mx-auto">
            <h2 className="text-3xl font-bold mb-2 text-sky-600">Round {currentRoundNumber} of {TOTAL_ROUNDS}</h2>
            <p className="text-xl mb-6 text-slate-700">Sound level: {soundLevel}</p>
            <button
              onClick={startRound}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            >
              Click to Start Round
            </button>
          </div>
        );
      case AppPhase.POST_ROUND_BRIEFING:
        return (
          <div className="w-full max-w-2xl flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-xl text-center mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-sky-600">Round {currentRoundNumber} Complete!</h2>
            <button
              onClick={startNextRound}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
            >
              Start Next Round ({currentRoundNumber + 1} of {TOTAL_ROUNDS})
            </button>
          </div>
        );
      case AppPhase.SESSION_SUMMARY:
        if (!currentSessionData || !currentSessionData.endTime) {
          const activeSessionCheck = allSessions.find(s => s.sessionId === currentSessionData?.sessionId && !s.endTime);
          if (activeSessionCheck) {
            // If currentSessionData is active but we are in summary, force end it.
            const endedSession = { ...activeSessionCheck, endTime: Date.now() };
            setCurrentSessionData(endedSession);
            setAllSessions(prev => prev.map(s => s.sessionId === endedSession.sessionId ? endedSession : s));
          } else if (currentSessionData && !currentSessionData.endTime) {
            // If it's the current one being processed and somehow didn't get endTime
            const endedSession = { ...currentSessionData, endTime: Date.now() };
            setCurrentSessionData(endedSession);
            setAllSessions(prev => prev.map(s => s.sessionId === endedSession.sessionId ? endedSession : s));
          } else {
            console.warn("SESSION_SUMMARY reached with invalid session state. Redirecting.");
            setAppPhase(AppPhase.USER_IDENTIFICATION);
            return <p className="text-slate-700">Loading session summary...</p>;
          }
        }
        // Re-check after potential updates
        if (!currentSessionData || !currentSessionData.endTime) {
          return <p className="text-slate-700">Finalizing session summary...</p>;
        }
        return (
          <StatisticsDisplay
            sessionData={currentSessionData}
            onResetSession={startNewUserSession}
            isDetailedView={false}
          />
        );
      case AppPhase.ADMIN_SESSION_OVERVIEW:
        return (
          <AllSessionsSummary
            sessions={allSessions}
            onBack={exitAdminOverview}
            onContinueSession={handleContinueSession}
            currentActiveSessionId={currentSessionData && !currentSessionData.endTime ? currentSessionData.sessionId : undefined}
            getLiveProgress={getCurrentProgress}
            onNavigateToDetailedView={handleNavigateToDetailedView}
          />
        );
      case AppPhase.DETAILED_SESSION_VIEW:
        const sessionToView = allSessions.find(s => s.sessionId === selectedSessionForDetailViewId);
        if (!sessionToView) {
          console.warn("Detailed view: Session not found", selectedSessionForDetailViewId);
          setAppPhase(AppPhase.ADMIN_SESSION_OVERVIEW); // Go back if session not found
          return <p className="text-slate-700">Session not found. Redirecting...</p>;
        }
        return (
          <StatisticsDisplay
            sessionData={sessionToView}
            onResetSession={startNewUserSession} // Not used in this mode
            isDetailedView={true}
            onBackToOverview={handleExitDetailedView}
          />
        );
      default:
        return <p className="text-slate-700">Unknown application phase.</p>;
    }
  };

  const contentMaxWidthClass = useMemo(() => {
    switch (appPhase) {
      case AppPhase.ADMIN_SESSION_OVERVIEW:
        return 'max-w-5xl';
      case AppPhase.SESSION_SUMMARY:
      case AppPhase.DETAILED_SESSION_VIEW:
        return 'max-w-4xl';
      case AppPhase.CONSENT_PAGE:
        return 'max-w-3xl';
      case AppPhase.USER_IDENTIFICATION:
        return 'max-w-md';
      case AppPhase.PRE_ROUND_BRIEFING:
      case AppPhase.POST_ROUND_BRIEFING:
        return 'max-w-2xl';
      default:
        return 'max-w-2xl';
    }
  }, [appPhase]);

  const isBrightTheme = appPhase !== AppPhase.ACTIVE_TRIAL;

  return (
    <div className={`min-h-screen select-none ${isBrightTheme
      ? 'bg-slate-100 text-slate-800 flex flex-col items-center justify-center p-4'
      : 'bg-gray-900 text-white w-screen h-screen overflow-hidden'
      }`}>
      {appPhase === AppPhase.ACTIVE_TRIAL ? (
        <ReactionTest
          key={currentReactionTestKey}
          roundNumber={currentRoundNumber}
          trialNumberInRound={currentTrialInRoundNumber}
          onTrialComplete={handleTrialComplete}
          onResultAcknowledged={handleResultAcknowledged}
        />
      ) : (
        <div className="w-full flex flex-col items-center py-4">
          <div className={`w-full ${contentMaxWidthClass} flex flex-col gap-4 px-2 sm:px-0`}>
            {renderContent()}

            {(appPhase === AppPhase.PRE_ROUND_BRIEFING || appPhase === AppPhase.POST_ROUND_BRIEFING) && (
              <div className="text-center text-xs text-slate-500 mt-2">
                <p>Round: {currentRoundNumber}/{TOTAL_ROUNDS}, Trial: {currentTrialInRoundNumber}/{TRIALS_PER_ROUND}</p>
              </div>
            )}

            {appPhase !== AppPhase.USER_IDENTIFICATION &&
              appPhase !== AppPhase.CONSENT_PAGE &&
              appPhase !== AppPhase.ADMIN_SESSION_OVERVIEW &&
              appPhase !== AppPhase.SESSION_SUMMARY &&
              appPhase !== AppPhase.DETAILED_SESSION_VIEW && (
                <div className="text-center text-xs text-slate-500 mt-6">
                  <p>Note: Your actual reaction time may be affected by device and monitor latency (typically 10-50 ms).</p>
                </div>
              )}
          </div>
        </div>
      )}

      {currentUser && isBrightTheme && (
        <UserStatusIcon user={currentUser} />
      )}
      {isBrightTheme && (
        <AdminOverviewIcon onClick={navigateToAdminOverview} sessionCount={allSessions.length} />
      )}
    </div>
  );
};

export default App;