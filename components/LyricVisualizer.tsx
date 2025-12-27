import React, { useRef, useEffect, useMemo } from "react";
import { ParticleBackground } from "./ParticleBackground";
import { LyricStage } from "./LyricStage";
import { ChoreographedLine } from "../types";

interface LyricVisualizerProps {
  currentTime: number; // The current playback time in seconds
  isPlaying: boolean; // Whether the track is playing
  lyrics: ChoreographedLine[]; // The lyrics with AI metadata
  className?: string; // Optional styling class
}

export const LyricVisualizer: React.FC<LyricVisualizerProps> = ({
  currentTime,
  isPlaying,
  lyrics,
  className = "",
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const audioMetaRef = useRef({
    scale: 1,
    animation: "fade",
    isHighEnergy: false,
  });

  // 1. Determine active lines based on timestamp
  const currentIndex = useMemo(() => {
    return lyrics.findIndex((line, i) => {
      const nextLine = lyrics[i + 1];
      return (
        currentTime >= line.time && (!nextLine || currentTime < nextLine.time)
      );
    });
  }, [currentTime, lyrics]);

  const currentLine = currentIndex !== -1 ? lyrics[currentIndex] : null;
  const nextLine =
    currentIndex !== -1 && currentIndex + 1 < lyrics.length
      ? lyrics[currentIndex + 1]
      : null;
  const previousLine = currentIndex > 0 ? lyrics[currentIndex - 1] : null;

  // 2. Sync current lyric meta to ref for the animation loop
  useEffect(() => {
    if (currentLine?.meta) {
      audioMetaRef.current = {
        scale: currentLine.meta.scale || 1,
        animation: currentLine.meta.animation || "fade",
        isHighEnergy:
          currentLine.meta.scale > 1.2 ||
          currentLine.meta.animation === "explode",
      };
    } else {
      audioMetaRef.current = {
        scale: 0,
        animation: "fade",
        isHighEnergy: false,
      };
    }
  }, [currentLine]);

  // 3. Calculate "Intensity" for ParticleBackground
  const bgIntensity =
    isPlaying && currentLine?.meta?.scale
      ? Math.max(0, (currentLine.meta.scale - 0.8) / 1.5)
      : 0;

  // 4. Audio Simulation Loop
  // This runs independently of the parent's render cycle to ensure smooth 60fps animations
  const animate = (time: number) => {
    if (stageRef.current && isPlaying) {
      const t = time / 1000;
      const meta = audioMetaRef.current;

      // Bass: Kick drum pattern (approx 120bpm = 2Hz)
      const kickOsc = Math.pow((Math.sin(t * Math.PI * 4) + 1) / 2, 4);
      let bass = kickOsc * Math.min(meta.scale, 1.5);

      // Mid: Synth/Melody (Slower, flowing)
      const padOsc = (Math.sin(t * Math.PI * 1.5) + 1) / 2;
      let mid = padOsc * 0.6;

      // Treble: Hi-hats/Noise (Fast, sharp 16th notes)
      const hatOsc = Math.pow((Math.sin(t * Math.PI * 8) + 1) / 2, 8);
      let treble = hatOsc * 0.4;

      // -- Meta Modulation --
      if (meta.animation === "bounce" || meta.animation === "explode") {
        bass *= 1.4;
        mid *= 0.8;
      }
      if (meta.animation === "glitch" || meta.animation === "shake") {
        const noise = Math.random() * 0.5;
        treble = Math.max(treble, noise);
        mid += noise * 0.3;
      }
      if (meta.animation === "slide" || meta.animation === "fade") {
        bass *= 0.7;
        mid *= 1.2;
      }

      // Update CSS Variables directly on the container
      stageRef.current.style.setProperty("--audio-bass", bass.toFixed(3));
      stageRef.current.style.setProperty("--audio-mid", mid.toFixed(3));
      stageRef.current.style.setProperty("--audio-treble", treble.toFixed(3));
    } else if (stageRef.current && !isPlaying) {
      // Reset when paused
      stageRef.current.style.setProperty("--audio-bass", "0");
      stageRef.current.style.setProperty("--audio-mid", "0");
      stageRef.current.style.setProperty("--audio-treble", "0");
    }

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  return (
    <div
      ref={stageRef}
      className={`relative w-full h-full bg-black overflow-hidden select-none ${className}`}
    >
      {/* Background Layer */}
      <ParticleBackground intensity={bgIntensity} />

      {/* Lyrics Layer - pointer-events-none ensures touches reach background */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <LyricStage
          currentLine={currentLine}
          nextLine={nextLine}
          previousLine={previousLine}
          intensity={bgIntensity}
        />
      </div>
    </div>
  );
};
