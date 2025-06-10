import React from 'react';
import { UserSession } from '../types';
import { SCORE_PRECISION, TOTAL_ROUNDS, TRIALS_PER_ROUND } from '../constants';
import { DownloadIcon } from './icons'; // Import DownloadIcon

interface AllSessionsSummaryProps {
  sessions: UserSession[];
  onBack: () => void;
  onContinueSession: (sessionId: string) => void;
  currentActiveSessionId?: string; 
  getLiveProgress: (sessionData: UserSession | null) => { round: number, trial: number, isComplete: boolean };
  onNavigateToDetailedView: (sessionId: string) => void;
}

const calculateSessionSummaryStats = (session: UserSession) => {
  const validTimes: number[] = [];
  session.roundsData.forEach(round => {
    round.trials.forEach(trial => {
      if (trial.time !== null) {
        validTimes.push(trial.time);
      }
    });
  });

  if (validTimes.length === 0) {
    return { average: null, best: null, stdDev: null, validTrialsCount: 0 };
  }

  const sum = validTimes.reduce((acc, t) => acc + t, 0);
  const average = sum / validTimes.length;
  const best = Math.min(...validTimes);
  
  let stdDev = null;
  if (validTimes.length >= 2) {
    const variance = validTimes.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / (validTimes.length - 1);
    stdDev = Math.sqrt(variance);
  }

  return { average, best, stdDev, validTrialsCount: validTimes.length };
};

const formatDateForFilename = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

const escapeCsvCell = (cellData: any): string => {
  if (cellData === null || cellData === undefined) return '';
  const stringData = String(cellData);
  if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
    return `"${stringData.replace(/"/g, '""')}"`;
  }
  return stringData;
};

const exportAllSessionsToCsv = (sessions: UserSession[]) => {
  if (sessions.length === 0) return;

  const headers = [
    'SessionID', 'UserName', 'UserSex', 
    'StartTimeISO', 'EndTimeISO', 
    'OverallAverageTimeMs', 'OverallBestTimeMs', 'OverallStdDevMs', 
    'TotalValidTrials'
  ];

  const rows = sessions.map(session => {
    const stats = calculateSessionSummaryStats(session);
    return [
      escapeCsvCell(session.sessionId),
      escapeCsvCell(session.user.name),
      escapeCsvCell(session.user.sex),
      escapeCsvCell(new Date(session.startTime).toISOString()),
      escapeCsvCell(session.endTime ? new Date(session.endTime).toISOString() : ''),
      escapeCsvCell(stats.average !== null ? stats.average.toFixed(SCORE_PRECISION) : ''),
      escapeCsvCell(stats.best !== null ? stats.best.toFixed(SCORE_PRECISION) : ''),
      escapeCsvCell(stats.stdDev !== null ? stats.stdDev.toFixed(SCORE_PRECISION) : ''),
      escapeCsvCell(stats.validTrialsCount)
    ].join(',');
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const timestamp = formatDateForFilename(new Date());
  link.setAttribute("download", `all_sessions_export_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


export const AllSessionsSummary: React.FC<AllSessionsSummaryProps> = ({ 
  sessions, 
  onBack, 
  onContinueSession,
  currentActiveSessionId,
  getLiveProgress,
  onNavigateToDetailedView
}) => {
  if (sessions.length === 0) {
    return (
      <div className="p-6 md:p-8 bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-sky-600 mb-6">All Sessions Overview</h2>
        <p className="text-slate-600 mb-6">No sessions have been recorded yet.</p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-75"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-xl w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-slate-300 gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-sky-600">All Sessions Overview</h2>
        <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => exportAllSessionsToCsv(sessions)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 flex items-center justify-center text-sm"
              title="Export all sessions summary to CSV"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export All to CSV
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-75 text-sm"
            >
              Back
            </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-300 border border-slate-300">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sex</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Start Time</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status / End Time</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Valid Trials</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Avg. Time (ms)</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Best Time (ms)</th>
              <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {sessions.map((session) => {
              const stats = calculateSessionSummaryStats(session);
              const isActive = !session.endTime;
              let statusDisplay: string | JSX.Element = '-';
              if (isActive) {
                const progress = getLiveProgress(session);
                if (progress.isComplete) { 
                    statusDisplay = <span className="text-orange-600 font-semibold">Processing...</span>;
                } else {
                    statusDisplay = (
                        <span className="text-green-600 font-semibold">
                          Active (R{progress.round}/{TOTAL_ROUNDS}, T{progress.trial}/{TRIALS_PER_ROUND})
                        </span>
                    );
                }
              } else if (session.endTime) {
                statusDisplay = new Date(session.endTime).toLocaleTimeString();
              }

              return (
                <tr key={session.sessionId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-slate-800">{session.user.name}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-600">{session.user.sex}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-600 text-center">{new Date(session.startTime).toLocaleTimeString()}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-600 text-center">
                    {statusDisplay}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-600 text-center">{stats.validTrialsCount}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-600 text-right">
                    {stats.average !== null ? stats.average.toFixed(SCORE_PRECISION) : '-'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-slate-600 text-right">
                    {stats.best !== null ? stats.best.toFixed(SCORE_PRECISION) : '-'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                    {isActive && session.sessionId !== currentActiveSessionId && (
                      <button
                        onClick={() => onContinueSession(session.sessionId)}
                        className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
                        title="Continue this active session"
                      >
                        Continue
                      </button>
                    )}
                    {!isActive && (
                       <button
                        onClick={() => onNavigateToDetailedView(session.sessionId)}
                        className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        title="View details of this completed session"
                      >
                        View Details
                      </button>
                    )}
                     {isActive && session.sessionId === currentActiveSessionId && <span className="text-xs text-slate-400">(Current)</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};