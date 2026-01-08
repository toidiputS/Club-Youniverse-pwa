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

    // Subscribe to changes
    const channel = supabase.channel('box-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'songs', filter: 'status=eq.in_box' }, () => {
        fetchBox();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [radioState]);

  const handleVote = async (songId: string) => {
    if (votedId) return;
    setVotedId(songId);

    // Optimistic / Real update
    const { data: song } = await supabase.from("songs").select("upvotes").eq("id", songId).single();
    if (song) {
      await supabase.from("songs").update({ upvotes: (song.upvotes || 0) + 10 }).eq("id", songId);
    }
  };

  if (candidates.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/30 rounded-3xl border border-white/5 h-64">
        <div className="text-zinc-600 italic">Curating The Box...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">The Box</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">Live Vote</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {candidates.map((song) => (
          <button
            key={song.id}
            onClick={() => handleVote(song.id)}
            disabled={!!votedId}
            className={`group relative overflow-hidden flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 ${votedId === song.id
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-white/5 bg-white/5 hover:border-white/20 hover:scale-[1.02]'
              }`}
          >
            {/* Minimal Thumbnail */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={song.coverArtUrl || `https://picsum.photos/seed/${song.id}/100`}
                className={`w-full h-full object-cover transition-opacity duration-500 ${votedId && votedId !== song.id ? 'opacity-20 grayscale' : ''}`}
                alt={song.title}
              />
            </div>

            <div className="flex flex-col min-w-0 flex-grow text-left">
              <h4 className="text-sm font-black text-white leading-tight truncate">{song.title}</h4>
              <p className="text-zinc-500 text-[10px] font-bold truncate uppercase">{song.artistName}</p>

              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] font-black text-white/40">{song.upvotes || 0} <span className="text-[8px] opacity-50 uppercase tracking-tighter">Votes</span></span>
                {votedId === song.id && (
                  <span className="text-[8px] font-black text-purple-400 uppercase">Voted</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
