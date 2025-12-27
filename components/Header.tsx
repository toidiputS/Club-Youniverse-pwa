/**
 * @file This component renders the header for the main radio view.
 * It includes the application title and buttons to navigate back to the studio and toggle the chat panel.
 */

import React from "react";
import type { View } from "../types";
import { VolumeControl } from "./VolumeControl";

interface HeaderProps {
  onNavigate: (view: View) => void;
  onToggleChat: () => void;
  isChatVisible: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onToggleChat,
  isChatVisible,
}) => {
  return (
    <header className="flex justify-between items-center px-4 sm:px-8 py-4 flex-shrink-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display animate-glow">
          Club Youniverse Live
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          24/7 AI-Powered Radio
        </p>
        <p className="mt-1 text-xs text-yellow-400/60 italic hidden sm:block">
          "The Youniverse observing itself listening to its own song"
        </p>
      </div>
      <div className="flex items-center gap-4">
        <VolumeControl />
        {/* Button to show/hide the chat panel on larger screens */}
        <button
          onClick={onToggleChat}
          className="p-2 rounded-full hover:bg-white/10 transition-colors hidden lg:block"
          title={isChatVisible ? "Hide Chat" : "Show Chat"}
        >
          {isChatVisible ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 12h16M4 12l4-4m-4 4l4 4"
              />
            </svg>
          )}
        </button>
        {/* Button to navigate back to the main studio/dashboard */}
        <button
          onClick={() => {
            console.log("Navigating to studio...");
            onNavigate("studio");
          }}
          className="text-sm bg-[var(--accent-secondary)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-primary)] transition-colors relative z-50 pointer-events-auto"
        >
          &larr; Back to Studio
        </button>
      </div>
      {/* CSS for the glowing text effect on the title */}
      <style>{`
                @keyframes glow {
                    0%, 100% { text-shadow: 0 0 5px var(--accent-primary), 0 0 10px var(--accent-secondary); }
                    50% { text-shadow: 0 0 10px var(--accent-primary), 0 0 20px var(--accent-secondary); }
                }
                .animate-glow {
                    animation: glow 4s ease-in-out infinite;
                }
            `}</style>
    </header>
  );
};
