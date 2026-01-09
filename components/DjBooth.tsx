/**
 * @file DjBooth - The extensive site control center for Club Youniverse.
 */

import React, { useContext, useState } from "react";
import { RadioContext } from "../contexts/AudioPlayerContext";
import type { View } from "../types";
import { supabase } from "../services/supabaseClient";
import { NowPlay } from "./NowPlay";
import { TheBox } from "./TheBox";
import { TheChat } from "./TheChat";

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

  // Library & Upload State
  const [songs, setSongs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch Library
  const fetchLibrary = async () => {
    const { data } = await supabase
      .from("songs")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setSongs(data);
  };

  React.useEffect(() => {
    fetchLibrary();
  }, []);

  const filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const downloadSong = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${filename}.mp3`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      console.error("Download failed:", e);
      window.open(url, '_blank');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile.user_id) return;

    // Check file type
    if (!file.type.startsWith('audio/')) {
      alert("Please upload an audio file (MP3, WAV, etc.)");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10); // Start progress

    try {
      // 1. Get Duration before uploading
      const duration = await new Promise<number>((resolve) => {
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.onloadedmetadata = () => {
          resolve(Math.round(audio.duration));
          URL.revokeObjectURL(audio.src);
        };
        audio.onerror = () => resolve(180); // Fallback to 3 mins
      });

      setUploadProgress(30);

      // 2. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const cleanName = file.name.replace(`.${fileExt}`, "").replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
      const filePath = `${profile.user_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('songs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("Storage Error:", uploadError);
        throw new Error(`Storage Upload Failed: ${uploadError.message}`);
      }

      setUploadProgress(70);

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('songs')
        .getPublicUrl(filePath);

      setUploadProgress(85);

      // 4. Add to Database
      const { error: dbError } = await supabase.from('songs').insert({
        uploader_id: profile.user_id,
        title: file.name.replace(`.${fileExt}`, ""),
        artist_name: profile.name || "Anonymous DJ",
        source: "upload",
        audio_url: publicUrl,
        duration_sec: duration,
        status: "pool"
      });

      if (dbError) {
        console.error("Database Error:", dbError);
        throw new Error(`Library Registration Failed: ${dbError.message}`);
      }

      setUploadProgress(100);
      await fetchLibrary();
      alert("Track successfully deployed to the pool!");
    } catch (error: any) {
      console.error("Upload Master Error:", error);
      alert("UPLOAD ABORTED: " + error.message);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen lg:fixed lg:inset-0 bg-[#020205] text-white flex flex-col overflow-y-auto lg:overflow-hidden select-none">
      {/* --- TOP HUD --- */}
      <div className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
              TITAN COMMAND DECK
            </h1>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Station: Club Youniverse // Live Feed</span>
          </div>
          <div className="h-8 w-px bg-white/10 hidden md:block" />
          <div className="hidden md:flex gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-zinc-600 uppercase">System Status</span>
              <span className="text-xs font-black text-purple-400 uppercase tracking-widest">{radioState}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-zinc-600 uppercase">DJ Mode</span>
              <span className="text-xs font-black text-blue-400 uppercase tracking-widest">GOD_MODE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate("club")}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          >
            Exit to Floor
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-black text-white">{profile.name}</div>
              <button onClick={onSignOut} className="text-[9px] font-bold text-red-500/80 hover:text-red-500 uppercase tracking-tighter">Sign Out</button>
            </div>
            <img src={profile.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} className="w-10 h-10 rounded-xl border border-white/10" alt="DJ" />
          </div>
        </div>
      </div>

      {/* --- MAIN DECK --- */}
      <div className="flex-grow flex flex-col lg:flex-row min-h-0 relative">

        {/* LEFT BAR: SYSTEM WEAPONS */}
        <div className="w-full lg:w-20 border-b lg:border-r lg:border-b-0 border-white/5 bg-black/20 flex flex-row lg:flex-col items-center justify-center lg:py-8 gap-4 lg:gap-6 z-40 p-4">
          {[
            { id: 'THE_BOX', icon: '📦', label: 'Box' },
            { id: 'BOX_WIN', icon: '🏆', label: 'Win' },
            { id: 'POOL', icon: '🔄', label: 'Pool' },
            { id: 'DJ_TALKING', icon: '🎙️', label: 'Mic' },
            { id: 'REBOOT', icon: '☢️', label: 'Nuke', color: 'text-red-500' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => forceNextState(btn.id)}
              className={`group relative flex flex-col lg:flex-col items-center justify-center p-3 rounded-2xl border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all ${btn.color || 'text-white'} flex-shrink-0 min-w-[60px]`}
            >
              <div className="text-xl group-hover:scale-110 transition-transform">{btn.icon}</div>
              <span className="text-[8px] font-black uppercase mt-1 opacity-40 group-hover:opacity-100">{btn.label}</span>
              {radioState === btn.id && (
                <div className="absolute -bottom-1 lg:-right-1 lg:top-1/2 lg:-translate-y-1/2 w-8 lg:w-1 h-1 lg:h-8 bg-purple-500 rounded-full shadow-[0_0_10px_purple]" />
              )}
            </button>
          ))}
        </div>

        {/* CENTER: THE MONITOR (LIVE FLOOR) */}
        <div className="flex-grow flex flex-col p-6 gap-6 overflow-hidden">
          {/* THE FLOOR PREVIEW */}
          <div className="flex-grow relative bg-zinc-950 rounded-[3rem] border border-white/5 overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] flex flex-col">
            <div className="absolute top-8 left-10 z-20">
              <span className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_green]" />
                Live Floor Feed
              </span>
            </div>

            <div className="flex-grow flex flex-col xl:flex-row items-center justify-around px-4 lg:px-12 pointer-events-none scale-90 lg:scale-100 gap-8">
              {/* Transformed components to look like monitors */}
              <div className="w-full lg:w-[320px] pointer-events-auto">
                <NowPlay />
              </div>
              <div className="w-full lg:w-[450px] pointer-events-auto">
                <TheBox />
              </div>
            </div>

            {/* QUICK FX BAR */}
            <div className="min-h-20 bg-black/60 border-t border-white/5 backdrop-blur-md flex flex-wrap items-center px-4 lg:px-10 gap-2 lg:gap-4 py-4 lg:py-0">
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mr-4 w-full lg:w-auto mb-2 lg:mb-0">Trigger FX:</span>
              {["Confetti", "Glitch", "Shake", "Neon Pulse", "Static"].map((fx) => (
                <button
                  key={fx}
                  onClick={() => sendSiteCommand("trigger_fx", { fx })}
                  className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-full transition-all hover:-translate-y-0.5"
                >
                  {fx}
                </button>
              ))}
            </div>
          </div>

          {/* THE TRANSMITTER (TTS) */}
          <div className="h-48 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI Narrator Transmitter</h4>
              <div className="flex gap-4">
                <form onSubmit={handleTickerUpdate} className="flex gap-2">
                  <input
                    type="text"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-[10px] text-white w-48 focus:outline-none focus:border-purple-500/50"
                  />
                  <button type="submit" disabled={isUpdatingTicker} className="text-[9px] font-black text-purple-400 uppercase hover:text-purple-300">Update News</button>
                </form>
              </div>
            </div>

            <form onSubmit={handleTtsSend} className="flex gap-4 flex-grow">
              <textarea
                value={ttsInput}
                onChange={(e) => setTtsInput(e.target.value)}
                placeholder="Type the next broadcast command..."
                className="flex-grow bg-black/60 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none font-mono"
              />
              <div className="flex flex-col gap-2 w-48">
                <select className="bg-zinc-800 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border border-white/5 focus:outline-none appearance-none cursor-pointer">
                  <option>Fenrir (Deep)</option>
                  <option>Kore (Sleek)</option>
                  <option>Charon (Dark)</option>
                </select>
                <button
                  type="submit"
                  disabled={isSending || !ttsInput.trim()}
                  className="flex-grow bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_4px_20px_rgba(147,51,234,0.3)] disabled:opacity-50"
                >
                  {isSending ? "ENCRYPTING..." : "TRANSMIT"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT SIDE: THE PULSE & ARCHIVE */}
        <div className="w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l border-white/5 bg-black/40 flex flex-col p-6 gap-6">
          {/* LIVE CHAT INTEGRATION */}
          <div className="flex-grow min-h-0 flex flex-col">
            <TheChat profile={profile} />
          </div>

          {/* MINI ARCHIVE (SONG LIBRARY) */}
          <div className="h-[35%] bg-black/60 rounded-[2rem] border border-white/5 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Song Archive</span>
              <label className="cursor-pointer">
                <input type="file" accept="audio/*" onChange={handleUpload} className="hidden" disabled={isUploading} />
                <div className="flex flex-col items-end">
                  <span className={`text-[9px] font-bold uppercase transition-all ${isUploading ? 'text-zinc-500' : 'text-purple-500 hover:text-purple-400'}`}>
                    {isUploading ? `Uploading ${uploadProgress}%` : 'Upload'}
                  </span>
                  {isUploading && (
                    <div className="w-20 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
            <div className="p-3">
              <input
                type="text"
                placeholder="Filter Archive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div className="flex-grow overflow-y-auto px-1 scrollbar-hide">
              {filteredSongs.map((song) => (
                <div key={song.id} className="group flex items-center justify-between p-3 hover:bg-white/5 border-b border-white/5 transition-all">
                  <div className="min-w-0 flex-grow">
                    <h4 className="text-[10px] font-bold text-white truncate">{song.title}</h4>
                    <p className="text-[8px] font-medium text-zinc-600 uppercase truncate">{song.artist_name}</p>
                  </div>
                  <button
                    onClick={() => downloadSong(song.audio_url, song.title)}
                    className="ml-2 p-1.5 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-all"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
