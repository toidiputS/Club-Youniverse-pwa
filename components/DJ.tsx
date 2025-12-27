/**
 * @file A simple UI component that displays the current DJ's name and "On Air" status.
 * It's a small, fixed-position element in the radio view.
 */

import React, { useContext } from "react";
import { RadioContext } from "../contexts/AudioPlayerContext";

export const DJ: React.FC = () => {
  const { isTtsErrorMuted, isTtsUserMuted, currentDj } =
    useContext(RadioContext);
  const isMuted = isTtsErrorMuted || isTtsUserMuted;

  return (
    <div
      className={`flex items-center gap-2 p-3 bg-black/40 backdrop-blur-md rounded-lg border ${isMuted ? "border-gray-500/30" : "border-yellow-400/20"}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 flex-shrink-0 ${isMuted ? "text-gray-400" : "text-yellow-400"}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        {isMuted ? (
          <path d="M13.44 13.25a.75.75 0 001.06-1.06l-6.97-6.97a.75.75 0 00-1.06 1.06l6.97 6.97zM2 8a3.5 3.5 0 013.5-3.5h.358a3.5 3.5 0 016.284 0h.358A3.5 3.5 0 0116 8v.203a3.502 3.502 0 01-3.5 3.297h-.08a3.5 3.5 0 01-5.84 0H6.5A3.5 3.5 0 013 11.5v-1A3.5 3.5 0 012 8zM5.5 12a2 2 0 002 2h5a2 2 0 002-2V8a2 2 0 00-2-2H7.5a2 2 0 00-2 2v4z" />
        ) : (
          <path
            fillRule="evenodd"
            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm5 10.13V16a1 1 0 11-2 0v-1.87a5.002 5.002 0 01-4-4.93V8a1 1 0 112 0v2.2a3 3 0 006 0V8a1 1 0 112 0v2.2a5.002 5.002 0 01-4 4.93z"
            clipRule="evenodd"
          />
        )}
      </svg>
      <div>
        <h3
          className={`font-bold text-md font-display leading-tight ${isMuted ? "text-gray-300" : "text-yellow-400"}`}
        >
          {currentDj.name}
        </h3>
        <p className="text-xs text-gray-300 leading-tight">
          {isMuted ? "Text Only" : "On Air"}
        </p>
      </div>
    </div>
  );
};
