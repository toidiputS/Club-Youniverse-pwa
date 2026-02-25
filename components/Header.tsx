import React, { useContext, useEffect, useState } from "react";
import type { View, Profile } from "../types";
import { RadioContext } from "../contexts/AudioPlayerContext";
import { getBroadcastManager } from "../services/globalBroadcastManager";

interface HeaderProps {
  onNavigate: (view: View) => void;
  onSignOut: () => void;
  profile: Profile;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onSignOut, profile }) => {
  const context = useContext(RadioContext);
  const broadcastManager = getBroadcastManager();
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let handle: number;
    const update = () => {
      const intensity = broadcastManager.getBassIntensity();
      setPulse(intensity);
      document.documentElement.style.setProperty('--audio-pulse', intensity.toString());
      handle = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(handle);
  }, []);

  if (!context) return null;
  const { nowPlaying, isPlaying } = context;

  return (
    <header className="relative flex items-center justify-between w-full pointer-events-none p-4">
      {/* EXTREME LEFT: Branding */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div
          className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center border border-white/5 cursor-pointer hover:border-purple-500/50 transition-all relative overflow-hidden group shadow-2xl"
          onClick={() => onNavigate("club")}
          style={{ boxShadow: `0 0 ${pulse * 30}px rgba(168, 85, 247, 0.2)` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 opacity-40 group-hover:opacity-100 transition-opacity" />
          <span className="relative text-white/40 text-lg font-black group-hover:text-white transition-colors">Y</span>
        </div>
        <div className="flex flex-col group cursor-default">
          <h1 className="text-[11px] font-black text-white/40 tracking-[0.4em] leading-none uppercase group-hover:text-white transition-colors">Club Youniverse</h1>
          <div className="flex gap-4 items-center mt-2">
            <div className="flex items-center gap-1.5 min-w-[100px]">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_purple]" />
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em]">Live Active</span>
            </div>

            {/* VOLUME CONTROLS */}
            <div className="flex items-center gap-3 px-3 py-1 bg-white/5 rounded-full border border-white/5 hover:border-white/10 transition-all pointer-events-auto">
              <button
                onClick={() => context.setMuted(!context.isMuted)}
                className="text-zinc-500 hover:text-white transition-colors"
                title={context.isMuted ? "Unmute" : "Mute"}
              >
                {context.isMuted || context.volume === 0 ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              <div className="w-16 h-1 bg-zinc-800 rounded-full relative group/vol overflow-hidden">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={context.volume}
                  onChange={(e) => context.setVolume(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="absolute inset-y-0 left-0 bg-purple-500 shadow-[0_0_8px_purple] transition-all"
                  style={{ width: `${context.volume * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => onNavigate("dj-booth")}
              className="px-5 py-2 bg-white text-black rounded-full text-[9px] font-black uppercase tracking-[0.2em] hover:bg-purple-500 hover:text-white transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              Song Pool ⚡
            </button>
          </div>
        </div>
      </div>

      {/* EXTREME RIGHT: Now Playing + Profile Minimal Group */}
      <div className="flex items-center gap-6 pointer-events-auto">
        {nowPlaying && (
          <div className="hidden lg:flex items-center gap-3 border-r border-white/5 pr-6 opacity-60 hover:opacity-100 transition-opacity cursor-default">
            <div className="flex flex-col items-end min-w-[100px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                {isPlaying && <div className="w-1 h-1 rounded-full bg-green-500/50 animate-pulse" />}
                <span className="text-[8px] font-black uppercase tracking-widest text-purple-400/80">On Air</span>
              </div>
              <h2 className="text-[10px] font-black text-white/80 leading-none uppercase tracking-tighter truncate max-w-[150px]">{nowPlaying.title}</h2>
            </div>

            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/5 shadow-2xl">
              <img
                src={nowPlaying.coverArtUrl || `https://picsum.photos/seed/${nowPlaying.id}/100`}
                className="w-full h-full object-cover grayscale opacity-50 transition-all duration-700 hover:grayscale-0 hover:opacity-100"
                style={{ transform: `scale(${1 + pulse * 0.1})` }}
                alt="Art"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 group">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-white/40 tracking-wider uppercase group-hover:text-white transition-colors">{profile.name}</span>
            <button
              onClick={onSignOut}
              className="text-[7px] font-black text-red-500/30 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Terminate
            </button>
          </div>
          <div
            className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/5 overflow-hidden transition-all shadow-2xl"
            style={{ borderColor: `rgba(168, 85, 247, ${pulse * 0.5})` }}
          >
            <img src={profile.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.user_id}`} alt="Avatar" className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
          </div>
        </div>
      </div>
    </header>
  );
};
