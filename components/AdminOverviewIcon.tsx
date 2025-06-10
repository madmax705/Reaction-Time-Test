import React from 'react';
import { ClipboardListIcon } from './icons';

interface AdminOverviewIconProps {
  onClick: () => void;
  sessionCount: number;
}

export const AdminOverviewIcon: React.FC<AdminOverviewIconProps> = ({ onClick, sessionCount }) => {
  if (sessionCount === 0) {
    return null; // Don't show if there are no sessions
  }

  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 left-4 bg-slate-700/90 backdrop-blur-sm text-white p-3 rounded-lg shadow-xl flex items-center space-x-2 z-20 hover:bg-slate-600/90 transition-colors"
      aria-label={`View all ${sessionCount} recorded session(s)`}
      title="View All Sessions"
    >
      <ClipboardListIcon className="w-7 h-7 text-sky-400" />
      <span className="text-xs font-medium bg-sky-500 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{sessionCount}</span>
    </button>
  );
};
