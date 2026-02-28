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
      <div className="relative z-50 pointer-events-auto p-4 sm:p-6 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-top-4 duration-1000">
        <Header onNavigate={onNavigate} onSignOut={onSignOut} profile={profile} />
      </div>

      {/* 2. CENTER: THE FLOOR (Open Space for Visuals) */}
      <div className="flex-grow relative z-10 min-h-0 container mx-auto px-4 flex flex-col items-center justify-center">
        {/* The user can add graphical effects here - space is 100% open */}
        <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* 3. SIDE COLUMN: Chat & Voting Stack (Mobile First layout) */}
      <div className="fixed inset-x-0 bottom-16 top-20 xl:inset-auto xl:right-4 xl:bottom-10 xl:top-20 z-40 flex flex-col gap-2 xl:gap-6 w-full xl:w-80 pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-1000 overflow-hidden xl:overflow-visible">
        <div className="flex-grow min-h-0">
          <TheChat profile={profile} />
        </div>
        <div className="flex-shrink-0 px-2 xl:px-0">
          <TheBox />
        </div>
      </div>
    </div>
  );
};
