/**
 * @file Radio Component - The main "Club" experience.
 */

import React, { useContext } from "react";
import { RadioContext } from "../contexts/AudioPlayerContext";
import { NowPlay } from "./NowPlay";
import type { View, Profile } from "../types";
import { Header } from "./Header";
import { TheBox } from "./TheBox";
import { TheChat } from "./TheChat";

interface RadioProps {
  onNavigate: (view: View) => void;
  onSignOut: () => void;
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}

export const Radio: React.FC<RadioProps> = ({ onNavigate, onSignOut, profile }) => {
  const context = useContext(RadioContext);
  if (!context) return null;

  // --- PERSISTENT RADIO FOUNDATION is now managed by GlobalBroadcastManager ---

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col pointer-events-none">
      {/* Top Header Layer */}
      <div className="relative z-50 pointer-events-auto p-4 sm:p-6 w-full max-w-7xl mx-auto">
        <Header onNavigate={onNavigate} onSignOut={onSignOut} profile={profile} />
      </div>

      {/* Main Experience Layer (Open Center) */}
      <div className="flex-grow relative z-30 min-h-0 flex flex-col justify-end p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row pointer-events-none gap-6 justify-between items-end w-full">

          {/* Bottom Left: Minimized NowPlay */}
          <div className="w-full lg:w-[320px] pointer-events-auto animate-in slide-in-from-left-10 duration-700 order-2 lg:order-1">
            <NowPlay />
          </div>

          {/* Bottom Right: Minimized The Box */}
          <div className="w-full lg:w-[450px] pointer-events-auto animate-in slide-in-from-right-10 duration-700 order-1 lg:order-2">
            <TheBox />
          </div>
        </div>
      </div>

      {/* Floating Side Layer: Chat */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden xl:flex pointer-events-auto w-80 pr-6">
        <TheChat profile={profile} />
      </div>

      {/* Mobile Chat Toggle/Overlay could go here later */}
    </div>
  );
};
