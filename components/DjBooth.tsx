/**
 * @file DjBooth - The extensive site control center for Club Youniverse.
 */

import React, { useContext, useState } from "react";
import { RadioContext } from "../contexts/AudioPlayerContext";
import type { View } from "../types";
import { Header } from "./Header";
import { supabase } from "../services/supabaseClient";

interface DjBoothProps {
  onNavigate: (view: View) => void;
  onSignOut: () => void;
}

export const DjBooth: React.FC<DjBoothProps> = ({ onNavigate, onSignOut }) => {
  const context = useContext(RadioContext);
  if (!context || !context.profile) return null;

  const { profile, radioState, tickerText } = context;
  const [ttsInput, setTtsInput] = useState("");
  const [tickerInput, setTickerInput] = useState(tickerText);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingTicker, setIsUpdatingTicker] = useState(false);

  if (!profile.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <h2 className="text-2xl font-black text-white">ACCESS DENIED</h2>
        <p>You do not have DJ Booth privileges.</p>
        <button onClick={() => onNavigate("club")} className="mt-4 text-purple-500 underline">Return to Club</button>
      </div>
    );
  }

  const sendSiteCommand = async (type: string, payload: any) => {
    try {
      await supabase.from("broadcasts").update({
        site_command: { type, payload, timestamp: Date.now() }
      }).eq("id", "00000000-0000-0000-0000-000000000000");
    } catch (e) {
      console.error("Site Command Failed:", e);
    }
  };

  const handleTtsSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttsInput.trim() || isSending) return;
    setIsSending(true);
    await sendSiteCommand("tts", { text: ttsInput, voice: "Fenrir" });
    setTtsInput("");
    setIsSending(false);
  };

  const handleTickerUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdatingTicker || !tickerInput.trim()) return;
    setIsUpdatingTicker(true);
    try {
      await sendSiteCommand("ticker", { text: tickerInput });
    } finally {
      setIsUpdatingTicker(false);
    }
  };

  const forceNextState = async (state: string) => {
    await supabase.from("broadcasts").update({
      radio_state: state
    }).eq("id", "00000000-0000-0000-0000-000000000000");
  };

  return (
    <div className="flex flex-col h-full w-full gap-8 p-4 sm:p-8 max-w-7xl mx-auto animate-in slide-in-from-right-10 duration-700">
      <Header onNavigate={onNavigate} onSignOut={onSignOut} profile={profile} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow min-h-0">
        {/* Left Column: Radio State Control */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
          <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              Live Control Deck
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => forceNextState("THE_BOX")}
                className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:scale-105 active:scale-95"
              >
                <div className="text-2xl">📦</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Force Box</span>
              </button>
              <button
                onClick={() => forceNextState("BOX_WIN")}
                className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:scale-105 active:scale-95"
              >
                <div className="text-2xl">🏆</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Force Winner</span>
              </button>
              <button
                onClick={() => forceNextState("POOL")}
                className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:scale-105 active:scale-95"
              >
                <div className="text-2xl">🔄</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Back to Pool</span>
              </button>
              <button
                onClick={() => forceNextState("DJ_TALKING")}
                className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:scale-105 active:scale-95"
              >
                <div className="text-2xl">🎙️</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">DJ Talking</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Site-Wide Visual FX</h4>
                <div className="flex flex-wrap gap-3">
                  {["Confetti", "Glitch", "Shake", "Neon Pulse", "Static"].map((fx) => (
                    <button
                      key={fx}
                      onClick={() => sendSiteCommand("trigger_fx", { fx })}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-full transition-colors border border-white/5"
                    >
                      {fx}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Breaking News Ticker</h4>
                <form onSubmit={handleTickerUpdate} className="flex gap-4">
                  <input
                    type="text"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value)}
                    className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingTicker}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase rounded-xl transition-all disabled:opacity-50"
                  >
                    {isUpdatingTicker ? "Updating..." : "Update"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6">TTS AI Voice (Station Output)</h3>
            <form onSubmit={handleTtsSend} className="space-y-4">
              <textarea
                value={ttsInput}
                onChange={(e) => setTtsInput(e.target.value)}
                placeholder="Type something for the DJ to say..."
                className="w-full h-32 bg-black/40 border border-white/10 rounded-3xl p-6 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none"
              />
              <div className="flex items-center justify-between">
                <select className="bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-white/5 focus:outline-none">
                  <option>Fenrir (Deep/Rough)</option>
                  <option>Kore (Sleek/Modern)</option>
                  <option>Charon (Dark/Monotone)</option>
                </select>
                <button
                  type="submit"
                  disabled={isSending || !ttsInput.trim()}
                  className="px-12 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-purple-900/20 disabled:opacity-50"
                >
                  {isSending ? "Synthesizing..." : "Transmit Audio"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Site Status & Info */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 flex flex-col gap-4 shadow-2xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">Station Status</h3>
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active State</span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase rounded-full border border-purple-500/20">{radioState}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/40 to-black rounded-[2.5rem] border border-white/10 p-8 shadow-2xl flex flex-col gap-4 overflow-hidden relative">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">System Reboot</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">Use for critical site shapeshifting. VSCode + Git + Vercel deployment flow should be ready before triggering.</p>
            <button
              onClick={() => forceNextState("REBOOT")}
              className="mt-4 w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest rounded-2xl border border-red-500/20 transition-all"
            >
              Trigger Emergency Reboot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
