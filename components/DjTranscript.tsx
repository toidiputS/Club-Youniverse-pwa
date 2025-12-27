/**
 * @file This is a non-visual component responsible for handling the Text-to-Speech (TTS)
 * functionality for the DJ's script. It listens for new scripts in the RadioContext,
 * generates audio using the Gemini TTS service, and plays it back through the browser's AudioContext.
 */

import React, { useContext, useEffect, useRef, useState } from "react";
import { RadioContext } from "../contexts/AudioPlayerContext";
import { generateSpeech } from "../services/geminiService";
import { DJ_ROSTER } from "../logic/djRoster";
import type { DjQueueItem } from "../types";

// --- Audio Helper Functions ---
// The Gemini TTS API returns raw PCM audio data, which needs to be decoded manually
// before it can be played using the Web Audio API.

/**
 * Decodes a base64 string into a Uint8Array.
 */
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer that the Web Audio API can play.
 * @param data - The raw audio data as a Uint8Array.
 * @param ctx - The AudioContext instance.
 * @param sampleRate - The sample rate of the audio (24000 for the TTS model).
 * @param numChannels - The number of audio channels (1 for mono).
 * @returns A promise that resolves to an AudioBuffer.
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const DjTranscript: React.FC = () => {
  const {
    djQueue,
    isTtsErrorMuted,
    setIsTtsErrorMuted,
    isTtsUserMuted,
    nowPlaying,
  } = useContext(RadioContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const urlAudioElementRef = useRef<HTMLAudioElement | null>(null); // For playing URLs
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null); // Track current TTS source
  // Ref to track the index of the last script played to avoid replaying scripts.
  const lastPlayedIndexRef = useRef<number>(-1);
  // Track the previous nowPlaying song ID to detect when a new song starts
  const prevNowPlayingIdRef = useRef<string | null>(null);
  const cutoffTimerRef = useRef<number | null>(null);

  // Initialize the URL audio element once.
  useEffect(() => {
    if (!urlAudioElementRef.current) {
      urlAudioElementRef.current = new Audio();
      urlAudioElementRef.current.onended = () => setIsPlaying(false);
      urlAudioElementRef.current.onerror = () => {
        console.error("Error playing audio URL.");
        setIsPlaying(false);
      };
    }
  }, []);

  // Effect to mute/unmute the URL audio element based on global mute state.
  useEffect(() => {
    if (urlAudioElementRef.current) {
      urlAudioElementRef.current.muted = isTtsUserMuted || isTtsErrorMuted;
    }
  }, [isTtsUserMuted, isTtsErrorMuted]);

  // Effect to detect when a new song starts and set cutoff timer
  useEffect(() => {
    const currentSongId = nowPlaying?.id || null;
    const previousSongId = prevNowPlayingIdRef.current;

    // Check if a new song started (different ID) while DJ is talking
    if (currentSongId && currentSongId !== previousSongId && isPlaying) {
      // Clear any existing timer
      if (cutoffTimerRef.current) {
        clearTimeout(cutoffTimerRef.current);
      }

      // Set new cutoff timer for 10 seconds
      cutoffTimerRef.current = window.setTimeout(() => {
        // Stop TTS audio source if playing
        if (currentSourceRef.current) {
          try {
            currentSourceRef.current.stop();
            currentSourceRef.current = null;
          } catch (e) {
            // Source may have already stopped naturally
          }
        }

        // Stop URL audio if playing
        if (urlAudioElementRef.current && !urlAudioElementRef.current.paused) {
          urlAudioElementRef.current.pause();
          urlAudioElementRef.current.currentTime = 0;
        }

        setIsPlaying(false);
      }, 10000); // 10 seconds
    }

    // Update the ref for next comparison
    prevNowPlayingIdRef.current = currentSongId;

    // Cleanup timer on unmount
    return () => {
      if (cutoffTimerRef.current) {
        clearTimeout(cutoffTimerRef.current);
      }
    };
  }, [nowPlaying?.id, isPlaying]);

  // Watchdog: Force reset if stuck playing for >30s (prevents queue stagnation)
  useEffect(() => {
    let watchdog: NodeJS.Timeout;
    if (isPlaying) {
      watchdog = setTimeout(() => {
        console.warn("🚨 DJ Watchdog: Playback stuck >30s. Force resetting.");
        if (currentSourceRef.current) {
          try {
            currentSourceRef.current.stop();
          } catch (e) {}
          currentSourceRef.current = null;
        }
        setIsPlaying(false);
      }, 30000);
    }
    return () => clearTimeout(watchdog);
  }, [isPlaying]);

  // Effect to handle the playback of new DJ scripts.
  useEffect(() => {
    // Initialize the AudioContext on the first run.
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )({ sampleRate: 24000 });
    }

    const playLatestQueueItem = async () => {
      // Prevent new calls if audio is muted by user or an error.
      if (isTtsUserMuted || isTtsErrorMuted) return;

      // Check if there are new, unplayed items and if audio is not already playing.
      if (
        djQueue.length > 0 &&
        lastPlayedIndexRef.current < djQueue.length - 1 &&
        !isPlaying
      ) {
        setIsPlaying(true);
        const newQueueIndex = lastPlayedIndexRef.current + 1;
        const itemToPlay = djQueue[newQueueIndex] as DjQueueItem;
        lastPlayedIndexRef.current = newQueueIndex;

        if (itemToPlay.type === "tts") {
          try {
            // Look up the correct voice for the DJ who is speaking.
            const voiceName =
              DJ_ROSTER[itemToPlay.djName]?.voiceName || "Fenrir"; // Default to Vex's voice

            // 1. Generate speech from the script text with the correct voice.
            const base64Audio = await generateSpeech(
              itemToPlay.content,
              voiceName,
            );
            const audioCtx = audioContextRef.current!;
            // 2. Decode the raw audio data.
            const audioBuffer = await decodeAudioData(
              decode(base64Audio),
              audioCtx,
              24000,
              1,
            );

            // 3. Create an audio source and play it.
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);

            // Store the source so we can stop it if needed
            currentSourceRef.current = source;

            source.start();
            source.onended = () => {
              currentSourceRef.current = null;
              setIsPlaying(false); // Allow the next item to be played.

              // Clear cutoff timer if DJ finished naturally before 10 seconds
              if (cutoffTimerRef.current) {
                clearTimeout(cutoffTimerRef.current);
                cutoffTimerRef.current = null;
              }
            };
          } catch (error: any) {
            console.error("Failed to play DJ TTS script:", error);
            // Check for quota error and mute TTS to prevent spamming the API.
            if (
              error.message &&
              (error.message.includes("429") ||
                error.message.includes("RESOURCE_EXHAUSTED"))
            ) {
              setIsTtsErrorMuted(true);
            }
            currentSourceRef.current = null;
            setIsPlaying(false); // Reset on error
          }
        } else if (itemToPlay.type === "url") {
          const audioEl = urlAudioElementRef.current;
          if (audioEl) {
            audioEl.src = itemToPlay.content;
            audioEl.play().catch((e) => {
              console.error("Audio URL playback failed:", e);
              setIsPlaying(false);
            });
          }
        }
      }
    };

    playLatestQueueItem();
  }, [djQueue, isPlaying, isTtsErrorMuted, isTtsUserMuted, setIsTtsErrorMuted]);

  // This component renders nothing to the DOM; its sole purpose is to manage audio playback.
  return null;
};
