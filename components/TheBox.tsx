/**
 * @file TheBox Component - The 2-song voting mechanism.
 */

import React, { useContext, useState, useEffect } from "react";
import { RadioContext } from "../contexts/AudioPlayerContext";
import { supabase } from "../services/supabaseClient";
import type { Song } from "../types";

export const TheBox: React.FC = () => {
  const context = useContext(RadioContext);
  if (!context) return null;

  const { radioState } = context;
  const [candidates, setCandidates] = useState<Song[]>([]);
  const [votedId, setVotedId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch 'in_box' songs from DB
    const fetchBox = async () => {
      const { data } = await supabase
        .from("songs")
        .select("*")
        .eq("status", "in_box")
        .limit(2);

      if (data) {
        // Map snake_case to camelCase
        setCandidates(data.map((raw: any) => ({
          id: raw.id,
          title: raw.title,
          artistName: raw.artist_name,
          audioUrl: raw.audio_url,
          coverArtUrl: raw.cover_art_url,
          upvotes: raw.upvotes || 0,
          status: raw.status,
          uploaderId: raw.uploader_id,
          source: raw.source,
          durationSec: raw.duration_sec,
          stars: raw.stars,
          boxRoundsSeen: raw.box_rounds_seen,
          boxRoundsLost: raw.box_rounds_lost,
          boxAppearanceCount: raw.box_appearance_count,
          playCount: raw.play_count,
          downvotes: raw.downvotes,
          lastPlayedAt: raw.last_played_at,
          createdAt: raw.created_at
        })));
      }
    };

    fetchBox();

    // Resilient fallback: Check every 5s if we are missing slots
    const interval = setInterval(() => {
      fetchBox();
    }, 5000);

    // Subscribe to changes in the box
    const channel = supabase.channel('box-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, (payload) => {
        const newSong = payload.new as any;
        const oldSong = payload.old as any;
        if (newSong?.status === 'in_box' || oldSong?.status === 'in_box') {
          fetchBox();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [radioState]);

  // 1. Generate a unique key for this pair of songs to prevent re-voting in the same round
  const roundKey = candidates.length === 2
    ? `voted_round_${[...candidates].map(c => c.id).sort().join('_')}`
    : null;

  // 2. Restore votedId from localStorage on mount or when candidates change
  useEffect(() => {
    if (roundKey) {
      const persistedVote = localStorage.getItem(roundKey);
      setVotedId(persistedVote);
    } else {
      setVotedId(null);
    }
  }, [roundKey]);

  const handleVote = async (songId: string) => {
    if (votedId || !roundKey) return;

    // 3. Persist the vote locally
    setVotedId(songId);
    localStorage.setItem(roundKey, songId);

    // Optimistic / Real update
    const { data: song } = await supabase.from("songs").select("upvotes").eq("id", songId).single();
    if (song) {
      // Add 10 votes for punchy weight
      await supabase.from("songs").update({ upvotes: (song.upvotes || 0) + 10 }).eq("id", songId);
    }
  };

  return (
    <div className="flex flex-col gap-4 transition-all select-none">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-white/30 font-serif">The Box</h3>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse" />
          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Live Vote</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map((idx) => {
          const song = candidates[idx];
          if (!song) return (
            <div key={`empty-${idx}`} className="aspect-square bg-zinc-900/40 border-2 border-white/[0.03] rounded-[2.5rem] flex items-center justify-center">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-800 animate-pulse">Syncing...</span>
            </div>
          );

          return (
            <button
              key={song.id}
              onClick={() => handleVote(song.id)}
              disabled={!!votedId}
              className={`group relative flex flex-col p-3 rounded-[2.5rem] border-2 transition-all duration-700 overflow-hidden ${votedId === song.id
                ? 'border-purple-600 bg-purple-600/10 shadow-[0_0_20px_rgba(147,51,234,0.1)]'
                : 'border-white/[0.06] bg-zinc-950/60 hover:bg-zinc-900 hover:border-white/20 shadow-2xl'
                }`}
            >
              {/* Massive Rounded Thumbnail */}
              <div className="relative aspect-square rounded-[1.8rem] overflow-hidden mb-3 border border-white/10 shadow-inner">
                <img
                  src={song.coverArtUrl || `https://picsum.photos/seed/${song.id}/100`}
                  className={`w-full h-full object-cover transition-all duration-1000 ${votedId && votedId !== song.id ? 'opacity-10 grayscale' : 'group-hover:scale-110'}`}
                  alt={song.title}
                />

                {/* Minimal Vote Badge */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md w-6 h-6 rounded-full flex items-center justify-center border border-white/10 shadow-lg">
                  <span className="text-[10px] font-black text-white/70">{song.upvotes || 0}</span>
                </div>

                {votedId === song.id && (
                  <div className="absolute inset-0 bg-purple-500/10 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-purple-500 animate-ping" />
                  </div>
                )}
              </div>

              <div className="w-full text-left px-1">
                <h4 className="text-[11px] font-black text-white leading-none truncate uppercase tracking-tight">
                  {song.title}
                </h4>
                <p className="text-zinc-600 text-[8px] font-bold truncate uppercase tracking-tighter mt-1 group-hover:text-zinc-400 transition-colors">
                  {song.artistName}
                </p>
              </div>

              {votedId === song.id && (
                <div className="absolute inset-0 bg-purple-500/5 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
