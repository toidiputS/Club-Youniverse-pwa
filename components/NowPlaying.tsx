/**
 * @file This component displays the currently playing song after it has won a round in "The Box".
 * It shows the song's cover art, title, artist, a progress bar, and an option to view lyrics.
 */

import React, { useContext, useEffect } from "react";
import { downloadSong } from "../services/downloadService";
import { RadioContext } from "../contexts/AudioPlayerContext";
import { SectionCard } from "./SectionCard";
import { LyricsFoldout } from "./LyricsFoldout";
import { InteractiveStarRating } from "./InteractiveStarRating";

export const NowPlaying: React.FC = () => {
  const {
    nowPlaying,
    liveRatings,
    addLiveRating,
    userLiveRating,
    isPlaying,
    togglePlay,
    profile,
    currentTime,
    duration,
  } = useContext(RadioContext);

  // Calculate progress directly from context
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Effect to simulate listener votes for debut songs
  useEffect(() => {
    if (nowPlaying?.status !== "debut") return;

    const voteInterval = setInterval(() => {
      const randomRating = Math.floor(Math.random() * 6) + 5; // Simulate positive bias, 5-10
      addLiveRating(randomRating);
    }, 2000);

    return () => clearInterval(voteInterval);
  }, [nowPlaying, addLiveRating]);

  /**
   * Triggers a download of the current song's audio file.
   */
  const handleDownload = () => {
    if (nowPlaying) {
      downloadSong(nowPlaying);
    }
  };

  const averageRating =
    liveRatings.length > 0
      ? liveRatings.reduce((a, b) => a + b, 0) / liveRatings.length
      : nowPlaying?.stars || 0;

  // If no song is playing, show a "stand by" message.
  if (!nowPlaying) {
    return (
      <SectionCard className="h-full">
        <div className="p-8 h-full flex flex-col items-center justify-center text-center">
          <p className="text-gray-400">
            Stand by... waiting for the next track.
          </p>
        </div>
      </SectionCard>
    );
  }

  const isDebut = nowPlaying.status === "debut";

  return (
    <div className="group h-full">
      <SectionCard className="h-full transition-all duration-500 group-hover:shadow-[0_0_20px_var(--accent-primary)] group-hover:border-[var(--accent-primary)]">
        <div className="p-8 h-full flex flex-col">
          <div className="text-center">
            <p
              className={`text-sm uppercase tracking-widest font-bold ${isDebut ? "text-red-400 animate-pulse" : "text-yellow-400"}`}
            >
              {isDebut ? "Trial by Fire: Live Debut" : "Now Playing"}
            </p>
            <h2 className="text-4xl font-bold font-display text-white mt-2">
              {nowPlaying.title}
            </h2>
            <p className="text-xl text-gray-300">{nowPlaying.artistName}</p>
          </div>

          <div className="my-8 flex-grow flex items-center justify-center flex-col">
            <img
              src={nowPlaying.coverArtUrl}
              alt={`Cover for ${nowPlaying.title}`}
              className="w-full max-w-sm aspect-square rounded-2xl shadow-2xl shadow-black/50 object-cover"
            />
            {isDebut ? (
              <div className="mt-6 w-full max-w-md">
                <InteractiveStarRating
                  onRate={(rating) => addLiveRating(rating)}
                  currentRating={userLiveRating}
                  averageRating={averageRating}
                />
              </div>
            ) : (
              <div className="flex gap-4 mt-6">
                <button
                  onClick={togglePlay}
                  className="bg-white/10 text-white font-bold py-3 px-6 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Pause
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Play
                    </>
                  )}
                </button>
                {profile?.is_premium ? (
                  <button
                    onClick={handleDownload}
                    className="bg-[var(--accent-secondary)] text-white font-bold py-3 px-8 rounded-lg hover:bg-[var(--accent-primary)] transition-colors"
                  >
                    Download Track
                  </button>
                ) : (
                  <div className="group/lock relative">
                    <button
                      disabled
                      className="bg-gray-800 text-gray-400 font-bold py-3 px-8 rounded-lg cursor-not-allowed flex items-center gap-2 opacity-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Download (VIP)
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/lock:block bg-black text-white text-xs px-3 py-1 rounded whitespace-nowrap z-30 shadow-2xl border border-gray-700">
                      Upgrade to VIP in the Studio to Download
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Playback progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-yellow-400 h-2.5 rounded-full"
              style={{ width: `${progress}%`, transition: "width 1s linear" }}
            ></div>
          </div>

          {/* Optional lyrics display */}
          {nowPlaying.lyrics && (
            <div className="mt-6">
              <LyricsFoldout lyrics={nowPlaying.lyrics} />
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};
