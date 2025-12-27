/**
 * @file This component renders a simulated "Live Roast Call" UI.
 * It appears when a VIP artist's song hits 0 stars and triggers the graveyard roast.
 */

import React, { useEffect, useState } from "react";

interface RoastCallOverlayProps {
  artistName: string;
  phoneNumber?: string;
  status: "dialing" | "active" | "ended";
}

export const RoastCallOverlay: React.FC<RoastCallOverlayProps> = ({
  artistName,
  phoneNumber,
  status,
}) => {
  const [timer, setTimer] = useState(0);

  // Timer for active call
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "active") {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm mx-auto px-6 flex flex-col items-center text-center">
        {/* Caller ID Section */}
        <div className="mb-12">
          <div className="w-24 h-24 bg-gradient-to-tr from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.209.688l-1.154 3.461a11.031 11.031 0 01-4.811-4.811l3.461-1.154a1 1 0 00.688-1.209L10.052 4.684a1 1 0 00-.948-.684H5z"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2 font-display">
            CLUB YOUNIVERSE DJ
          </h2>
          <p className="text-gray-400 text-lg">
            {status === "dialing"
              ? "Dialing..."
              : status === "active"
                ? formatTime(timer)
                : "Call Ended"}
          </p>
        </div>

        {/* Artist Info Section */}
        <div className="mb-12 p-6 bg-white/5 border border-white/10 rounded-2xl w-full">
          <p className="text-sm text-[var(--accent-primary)] uppercase tracking-widest font-bold mb-1">
            Targeting Artist
          </p>
          <h3 className="text-2xl font-bold text-white mb-2">{artistName}</h3>
          {phoneNumber && (
            <p className="text-gray-500 font-mono tracking-tighter">
              {phoneNumber.replace(/.(?=.{4})/g, "*")}
            </p>
          )}
        </div>

        {/* Call Status Animations */}
        {status === "active" && (
          <div className="w-full h-8 flex items-center justify-center gap-1 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="w-1 bg-[var(--accent-primary)] rounded-full animate-bounce"
                style={{
                  height: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.1}s`,
                  opacity: 0.6 + Math.random() * 0.4,
                }}
              />
            ))}
          </div>
        )}

        {/* Catchphrase Overlay */}
        {status === "active" && (
          <div className="mb-12 animate-slide-up">
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
              <p className="text-yellow-400 italic text-lg line-clamp-2">
                "{artistName}, come get your song, it might be drunk."
              </p>
            </div>
          </div>
        )}

        {/* Mock Control Buttons */}
        <div className="flex gap-12 mt-auto">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mb-2 shadow-lg opacity-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white rotate-[135deg]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              End Call
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-2 shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Mute
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
