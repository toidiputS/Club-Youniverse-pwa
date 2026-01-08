/**
 * @file Header Component - Simplified for Club Youniverse Launch.
 */

import React from "react";
import type { View, Profile } from "../types";

interface HeaderProps {
  onNavigate: (view: View) => void;
  onSignOut: () => void;
  profile: Profile;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onSignOut, profile }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-zinc-900/40 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-xl">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 cursor-pointer hover:rotate-6 transition-transform"
          onClick={() => onNavigate("club")}
        >
          <span className="text-white text-2xl font-black">Y</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-white tracking-tighter leading-none">CLUB YOUNIVERSE</h1>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live from the Void</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {profile.is_admin && (
          <button
            onClick={() => onNavigate("dj-booth")}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-white/10"
          >
            DJ Booth
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-black text-white">{profile.name}</span>
            <button
              onClick={onSignOut}
              className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-400 transition-colors"
            >
              Sign Out
            </button>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
            <img src={profile.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.user_id}`} alt="Avatar" />
          </div>
        </div>
      </div>
    </header>
  );
};
