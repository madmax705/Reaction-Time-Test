import React, { useState, useCallback } from 'react';
import { UserSex } from '../types';

interface UserIdentificationFormProps {
  onSubmit: (name: string, sex: UserSex) => void;
  onNavigateToConsent: () => void; // New prop to handle navigation to consent page
}

export const UserIdentificationForm: React.FC<UserIdentificationFormProps> = ({ onSubmit, onNavigateToConsent }) => {
  const [name, setName] = useState<string>('');
  const [sex, setSex] = useState<UserSex>('Male'); // Default to Male
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!consentChecked) {
      setError('You must agree to the terms to continue.');
      return;
    }
    setError('');
    onSubmit(name.trim(), sex);
  }, [name, sex, consentChecked, onSubmit]);

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-sky-600 mb-8">Brief info</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="userName" className="block text-sm font-medium text-slate-700 mb-1">
            Your Name:
          </label>
          <input
            type="text"
            id="userName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400"
            placeholder="Enter your name"
            aria-required="true"
          />
        </div>
        
        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">Sex:</span>
          <div className="flex items-center space-x-4">
            {(['Male', 'Female'] as UserSex[]).map((option) => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="sex"
                  value={option}
                  checked={sex === option}
                  onChange={() => setSex(option)}
                  className="form-radio h-4 w-4 text-sky-600 bg-slate-100 border-slate-300 focus:ring-sky-500"
                />
                <span className="text-slate-700">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <div className="mt-6 pt-2">
          <label htmlFor="consentCheck" className="flex items-start space-x-2 text-sm text-slate-700">
            <input
              type="checkbox"
              id="consentCheck"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="form-checkbox h-4 w-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500 mt-0.5 flex-shrink-0"
              aria-required="true"
            />
            <span>
              I agree to all the{' '}
              <button
                type="button"
                onClick={onNavigateToConsent}
                className="text-sky-600 hover:text-sky-700 underline font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 rounded"
              >
                following terms
              </button>
              .
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={!consentChecked}
          className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          Start Experiment
        </button>
      </form>
    </div>
  );
};