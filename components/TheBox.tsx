/**
 * @file This component renders the UI for "The Box," the core voting game of the radio.
 * It displays three candidate songs and allows users to vote, play snippets, and download tracks.
 */

import React, { useContext } from "react";
import { RadioContext } from "../contexts/AudioPlayerContext";
import type { Song } from "../types";

interface TheBoxProps {
  candidates: Song[];
  onVote: (songId: string) => void;
  isVotingActive: boolean;
  userHasVoted: boolean;
  voteCounts: Record<string, number>;
}

export const TheBox: React.FC<TheBoxProps> = ({
  candidates,
  onVote,
  isVotingActive,
  userHasVoted,
  voteCounts,
}) => {
  const { playSnippet, stopSnippet, snippetPlayingUrl } =
    useContext(RadioContext);

  return (
    <div className="w-full max-w-3xl mx-auto h-[120px] flex gap-1.5 items-center justify-center">
      {candidates.map((song) => (
        <div
          key={song.id}
          className="
                        relative flex-1 hover:flex-[3] 
                        transition-[flex] duration-500 ease-out 
                        h-full rounded-xl overflow-hidden 
                        cursor-pointer group 
                        border border-white/5 hover:border-[#00ffeb]/50 
                        bg-gradient-to-br from-[#1a1a1a] to-black
                        hover:shadow-[0_4px_30px_rgba(0,255,235,0.15)]
                    "
          onClick={() => !userHasVoted && onVote(song.id)}
        >
          {/* Background Glow / Image */}
          <div className="absolute inset-0">
            <img
              src={song.coverArtUrl}
              alt={song.title}
              className="w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500 grayscale group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
          </div>

          {/* Content Container */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
            {/* COLLAPSED STATE: Vertical Text */}
            <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0 delay-0 group-hover:delay-0 opacity-100">
              <div className="text-center px-1">
                <h4 className="text-xs font-bold text-white/90 leading-tight truncate">
                  {song.title}
                </h4>
                <p className="text-[10px] text-[#00ffeb]/80 uppercase tracking-wide truncate">
                  {song.artistName}
                </p>
              </div>
            </div>

            {/* EXPANDED STATE: Full Details */}
            <div
              className="
                            opacity-0 group-hover:opacity-100 
                            transition-all duration-500 delay-100 
                            transform translate-y-4 group-hover:translate-y-0
                            flex flex-col items-center text-center gap-1 w-full
                        "
            >
              {/* Snippet Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (snippetPlayingUrl === song.audioUrl) {
                    stopSnippet();
                  } else {
                    playSnippet(song.audioUrl);
                  }
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#00ffeb]/20 flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
              >
                {snippetPlayingUrl === song.audioUrl ? (
                  <div className="w-1.5 h-1.5 bg-[#00ffeb] rounded-sm animate-pulse" />
                ) : (
                  <svg
                    className="w-4 h-4 text-[#00ffeb]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                  </svg>
                )}
              </button>

              <div>
                <h3 className="text-sm md:text-base font-black text-white leading-tight tracking-tight drop-shadow-md">
                  {song.title}
                </h3>
                <p className="text-[10px] font-bold text-[#00ffeb] tracking-widest uppercase">
                  {song.artistName}
                </p>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-yellow-500/80">
                {"⭐".repeat(Math.min(5, song.stars || 0))}
              </div>

              {/* Vote Button */}
              <button
                disabled={!isVotingActive || userHasVoted}
                className={`
                    px-4 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest
                    transition-all duration-300
                    ${userHasVoted
                    ? "bg-white/10 text-white/30 cursor-not-allowed"
                    : "bg-[#00ffeb] text-black hover:bg-white hover:shadow-[0_0_20px_#00ffeb]"
                  }
                `}
              >
                {userHasVoted
                  ? (voteCounts[song.id] ? `${voteCounts[song.id]} Votes` : "Voted")
                  : "VOTE"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
