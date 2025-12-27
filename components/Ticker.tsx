/**
 * @file This component renders the scrolling ticker at the bottom of the screen.
 * It displays two rows of information: one for the DJ's script and one for the current
 * radio status (e.g., now playing, voting results).
 */
import React, { useContext, useMemo } from "react";
import { RadioContext } from "../contexts/AudioPlayerContext";

export const Ticker: React.FC = () => {
  const { nowPlaying, djQueue, radioState, boxRound, voteCounts } =
    useContext(RadioContext);

  // Memoize the DJ script text to prevent recalculation on every render.
  const djText = useMemo(() => {
    const latestScripts = djQueue
      .filter((item) => item.type === "tts") // Only show text-to-speech items
      .map((item) => item.content) // Extract the text content
      .slice(-3); // Get the last 3 scripts for brevity.
    return latestScripts.join(" • ");
  }, [djQueue]);

  // Memoize the status text, which changes based on the current radio state.
  const statusText = useMemo(() => {
    if (radioState === "NOW_PLAYING" && nowPlaying) {
      return `NOW PLAYING: "${nowPlaying.title}" by ${nowPlaying.artistName}`;
    }
    if (radioState === "BOX_VOTING" && boxRound) {
      const voteStrings = boxRound.candidates.map(
        (c) => `${c.title}: ${(voteCounts[c.id] || 0).toLocaleString()}`,
      );
      return `VOTE NOW! • ${voteStrings.join(" • ")}`;
    }
    if (radioState === "DJ_BANTER_OUTRO") {
      return "VOTING CLOSED! WINNER ANNOUNCED SOON...";
    }
    return "Club Youniverse Live - 24/7 AI Radio";
  }, [radioState, nowPlaying, boxRound, voteCounts]);

  // Repeat the text multiple times to ensure a seamless looping effect for the CSS animation.
  const longDjText = new Array(5).fill(djText).join(" • ");
  const longStatusText = new Array(5).fill(statusText).join(" • ");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
      {/* Top row for DJ script */}
      <div className="ticker-wrap bg-black/80 backdrop-blur-sm border-t border-b border-yellow-400/30 overflow-hidden">
        <div className="ticker-move-slow text-yellow-300">
          <p className="font-bold uppercase tracking-wider">{longDjText}</p>
        </div>
      </div>
      {/* Bottom row for status updates */}
      <div className="ticker-wrap bg-yellow-500 text-black overflow-hidden ticker-status-bar">
        <div className="ticker-move-fast">
          <p className="font-bold uppercase tracking-wider">{longStatusText}</p>
        </div>
      </div>
      {/* CSS for the scrolling animation */}
      <style>{`
                .ticker-wrap {
                    width: 100%;
                    padding: 0.5rem 0;
                }
                .ticker-move-slow, .ticker-move-fast {
                    display: inline-block;
                    white-space: nowrap;
                    padding-left: 100%;
                }
                .ticker-move-slow p, .ticker-move-fast p {
                     display: inline-block;
                }
                .ticker-move-slow {
                    animation: ticker 150s linear infinite;
                }
                .ticker-move-fast {
                     animation: ticker 40s linear infinite;
                }
                @keyframes ticker {
                    0% {
                        transform: translate3d(0, 0, 0);
                    }
                    100% {
                        transform: translate3d(-100%, 0, 0);
                    }
                }
            `}</style>
    </div>
  );
};
