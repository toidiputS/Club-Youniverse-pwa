/**
 * @file Ticker Component - The breaking news marquee for Club Youniverse.
 */

import React, { useContext } from "react";
import { RadioContext } from "../contexts/AudioPlayerContext";

export const Ticker: React.FC = () => {
  const context = useContext(RadioContext);
  if (!context) return null;

  const { tickerText } = context;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/40 backdrop-blur-sm border-t border-white/5 h-8 flex items-center overflow-hidden z-[50]">
      <div className="flex-shrink-0 bg-white/5 px-3 h-full flex items-center justify-center border-r border-white/5">
        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em] whitespace-nowrap">Feed</span>
      </div>

      <div className="flex-grow items-center">
        <div className="whitespace-nowrap flex gap-16 sm:gap-48 animate-marquee">
          <span className="text-[10px] font-bold text-zinc-500 tracking-tight uppercase">{tickerText}</span>
          <span className="text-[10px] font-bold text-zinc-500 tracking-tight uppercase">{tickerText}</span>
        </div>
      </div>

      <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 60s linear infinite;
                    display: inline-flex;
                }
            `}</style>
    </div>
  );
};
