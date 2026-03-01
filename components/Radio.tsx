import React, { useContext } from "react";
import { RadioContext } from "../contexts/AudioPlayerContext";
import type { View, Profile } from "../types";
import { Header } from "./Header";
import { TheBox } from "./TheBox";
import { TheChat } from "./TheChat";

interface RadioProps {
  onNavigate: (view: View) => void;
  onSignOut: () => void;
  profile: Profile;
}

export const Radio: React.FC<RadioProps> = ({ onNavigate, onSignOut, profile }) => {
  const context = useContext(RadioContext);
  if (!context) return null;

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col pointer-events-none select-none">

      {/* 1. TOP HUB: Integrated Header */}
      <div className="relative z-50 pointer-events-auto w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-top-4 duration-1000 shrink-0">
        <Header onNavigate={onNavigate} onSignOut={onSignOut} profile={profile} />
      </div>

      {/* 2. CENTER: THE FLOOR (Open Space for Visuals) */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
      </div>

      {/* 3. SIDE COLUMN: Chat & Voting Stack (Mobile First layout) */}
      <div className="relative z-40 flex flex-col w-full flex-grow xl:flex-none xl:fixed xl:right-4 xl:bottom-6 xl:top-24 xl:w-80 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-1000 overflow-hidden xl:overflow-visible min-h-0">
        <div className="flex-grow min-h-0 px-2 sm:px-4 flex flex-col">
          <TheChat profile={profile} />
        </div>
        <div className="flex-shrink-0 px-2 xl:px-0 pb-2 xl:pb-0 pt-2 shrink-0">
          <TheBox />
        </div>
      </div>
    </div>
  );
};
