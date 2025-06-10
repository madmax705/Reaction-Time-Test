import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types'; 
import { MIN_DELAY_MS, MAX_DELAY_MS, SCORE_PRECISION } from '../constants';

interface ReactionTestProps {
  roundNumber: number;
  trialNumberInRound: number;
  onTrialComplete: (time: number) => void;
  // onTrialTooSoon prop removed
  onResultAcknowledged: () => void;
}

export const ReactionTest: React.FC<ReactionTestProps> = ({ 
  roundNumber, trialNumberInRound, onTrialComplete, onResultAcknowledged
}) => {
  const [gameState, setGameState] = useState<GameState>(GameState.INITIAL);
  const [message, setMessage] = useState<string>(""); 
  const [displayedTime, setDisplayedTime] = useState<string | null>(null);
  
  const timerIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearPendingTimer = useCallback(() => {
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  const startRandomDelay = useCallback(() => {
    clearPendingTimer();
    setGameState(GameState.WAITING);
    setMessage("Wait for green...");
    setDisplayedTime(null); 
    const delay = Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS) + MIN_DELAY_MS;
    timerIdRef.current = window.setTimeout(() => {
      setGameState(GameState.CLICK_NOW);
      setMessage("Click!");
      startTimeRef.current = performance.now();
      timerIdRef.current = null;
    }, delay);
  }, [clearPendingTimer]);

  useEffect(() => {
    clearPendingTimer(); 
    startRandomDelay();   
    
    return () => {
      clearPendingTimer(); 
    };
  }, [roundNumber, trialNumberInRound, startRandomDelay, clearPendingTimer]);


  const handleClick = useCallback(() => {
    switch (gameState) {
      case GameState.WAITING:
        clearPendingTimer();
        // No longer call onTrialTooSoon prop
        setGameState(GameState.TOO_SOON);
        setMessage("Too soon! Click to retry trial.");
        setDisplayedTime(null);
        break;
      case GameState.CLICK_NOW:
        const endTime = performance.now();
        const calculatedTime = endTime - startTimeRef.current;
        onTrialComplete(calculatedTime); 
        setGameState(GameState.RESULT);
        const formattedTime = calculatedTime.toFixed(SCORE_PRECISION);
        setDisplayedTime(`${formattedTime} ms`);
        setMessage(`Your time: ${formattedTime} ms. Click to continue.`);
        break;
      case GameState.RESULT:
        onResultAcknowledged(); 
        break;
      case GameState.TOO_SOON: // Click after "Too Soon!" message
        startRandomDelay(); // Restart the current trial
        break;
    }
  }, [gameState, clearPendingTimer, onTrialComplete, onResultAcknowledged, startRandomDelay]);

  let bgColor = "bg-[rgb(43,135,209)]"; // Default to blue
  const textColor = "text-white"; // Always white for these backgrounds

  if (gameState === GameState.WAITING) bgColor = "bg-[rgb(206,38,54)]"; // Red
  if (gameState === GameState.CLICK_NOW) bgColor = "bg-[rgb(75,219,106)]"; // Green
  // INITIAL, RESULT, TOO_SOON will use the default blue

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center cursor-pointer transition-colors duration-150 ease-in-out ${bgColor} ${textColor} p-6 focus:outline-none focus:ring-4 focus:ring-white/70 z-10`}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-live="polite"
      aria-atomic="true"
      aria-label={message.split('.')[0]} 
    >
      <div className="text-center">
        <p className="text-3xl md:text-4xl font-bold mb-2">
          {message.split('.')[0]}
          {gameState === GameState.CLICK_NOW && "!"}
          {gameState === GameState.TOO_SOON && message.includes("!") && "!"}
        </p>
        {(gameState === GameState.RESULT && displayedTime) && (
          <p className="text-5xl md:text-6xl font-bold text-yellow-300">{displayedTime}</p>
        )}
        {(gameState === GameState.RESULT || gameState === GameState.TOO_SOON) && message.includes('.') && (
           <p className="text-xl md:text-2xl mt-4 opacity-80">
            {message.substring(message.indexOf('.') + 1).trim()} 
           </p>
         )}
         {gameState === GameState.INITIAL && ( 
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mt-4 opacity-70"><path d="M15 6v12a3 3 0 0 0 3-3H6a3 3 0 0 0 3 3V6a3 3 0 0 0-3 3h12a3 3 0 0 0-3-3z"></path></svg>
         )}
         {gameState === GameState.WAITING && (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mt-4 opacity-70 animate-pulse"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="6" x2="12" y2="12"></line><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
         )}
      </div>
    </div>
  );
};