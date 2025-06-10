import React from 'react';

interface IconProps {
  className?: string;
}

export const RefreshCcwIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M21 21v-5h-5" />
  </svg>
);

export const UserIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="0.5" // Adjusted for better visual with fill
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A1.5 1.5 0 0118 21.75H6a1.5 1.5 0 01-1.499-1.632z" />
  </svg>
);

export const ClipboardListIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path fillRule="evenodd" d="M10.5 3.75a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25h3a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25h-3Zm-2.625 2.25c0-.994.806-1.875 1.875-1.875h.375a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-.375a1.875 1.875 0 01-1.875-1.875V6ZM12 3.75a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75A.75.75 0 0112 3.75Zm3.75.75a.75.75 0 00-.75-.75h-.375a1.875 1.875 0 00-1.875 1.875V16.5a1.875 1.875 0 001.875 1.875h.375a.75.75 0 00.75-.75V4.5Z" clipRule="evenodd" />
    <path d="M8.25 3.75A2.25 2.25 0 006 6v10.5a2.25 2.25 0 002.25 2.25H7.5a.75.75 0 010 1.5H6A3.75 3.75 0 012.25 16.5V6A3.75 3.75 0 016 2.25h1.75a.75.75 0 010 1.5H6Z" />
    <path d="M15.75 3.75A2.25 2.25 0 0118 6v10.5a2.25 2.25 0 01-2.25 2.25H16.5a.75.75 0 000 1.5H18A3.75 3.75 0 0021.75 16.5V6A3.75 3.75 0 0018 2.25h-1.75a.75.75 0 000 1.5H18Z" />
  </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M17 10a.75.75 0 01-.75.75H5.56l3.22 3.22a.75.75 0 11-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06l4.5-4.5a.75.75 0 011.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z"
      clipRule="evenodd"
    />
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
  </svg>
);