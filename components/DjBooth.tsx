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

  // Library & Upload State
  const [songs, setSongs] = useState<any[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch Library
  const fetchLibrary = async () => {
    setIsLoadingSongs(true);
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setSongs(data);
    setIsLoadingSongs(false);
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

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${profile.user_id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('songs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('songs')
        .getPublicUrl(filePath);

      // Add to DB
      await supabase.from('songs').insert({
        uploader_id: profile.user_id,
        title: file.name.replace(`.${fileExt}`, ""),
        artist_name: profile.name || "Anonymous DJ",
        source: "upload",
        audio_url: publicUrl,
        status: "pool"
      });

      await fetchLibrary();
      alert("Song uploaded successfully!");
    } catch (error: any) {
      alert("Error uploading song: " + error.message);
    } finally {
      setIsUploading(false);
    }
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

          <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl flex flex-col gap-6 flex-grow overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Song Library</h3>
              <label className="cursor-pointer group">
                <input type="file" accept="audio/*" onChange={handleUpload} className="hidden" disabled={isUploading} />
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isUploading ? 'bg-zinc-800 text-zinc-500' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'}`}>
                  {isUploading ? "Uploading..." : "Upload MP3"}
                </div>
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {isLoadingSongs ? (
                <div className="text-center py-8 text-zinc-600 text-[10px] font-bold uppercase tracking-widest animate-pulse">Scanning Archive...</div>
              ) : filteredSongs.map((song) => (
                <div key={song.id} className="group flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="min-w-0 flex-grow">
                    <h4 className="text-[11px] font-black text-white truncate">{song.title}</h4>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter truncate">{song.artist_name}</p>
                  </div>
                  <button
                    onClick={() => downloadSong(song.audio_url, song.title)}
                    className="ml-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    title="Download MP3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="避M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              ))}
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
