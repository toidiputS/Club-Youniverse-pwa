/**
 * @file A simple, reusable loading spinner component.
 * It displays an animated spinner and an optional message.
 */

import React from 'react';

interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* The spinner element, styled with Tailwind CSS and animated with `animate-spin` */}
      <div className="w-16 h-16 border-4 border-yellow-400 border-solid border-t-transparent rounded-full animate-spin"></div>
      {/* Optional message displayed below the spinner */}
      {message && <p className="mt-4 text-yellow-300 text-lg animate-pulse">{message}</p>}
    </div>
  );
};