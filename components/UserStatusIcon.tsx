import React from 'react';
import { User } from '../types';
import { UserIcon } from './icons';

interface UserStatusIconProps {
  user: User;
}

export const UserStatusIcon: React.FC<UserStatusIconProps> = ({ user }) => {
  return (
    <div 
      className="fixed bottom-4 right-4 bg-slate-700/90 backdrop-blur-sm text-white p-3 rounded-lg shadow-xl flex items-center space-x-3 z-20"
      aria-label={`Current user: ${user.name}, Sex: ${user.sex}`}
      role="status"
    >
      <UserIcon className="w-7 h-7 text-sky-400 flex-shrink-0" />
      <div className="text-left">
        <p className="text-sm font-semibold leading-tight">{user.name}</p>
        <p className="text-xs text-slate-300 leading-tight">{user.sex}</p>
      </div>
    </div>
  );
};