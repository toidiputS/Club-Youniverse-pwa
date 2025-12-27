/**
 * SimpleAudioManager - Minimal audio playback system
 * No sync, no broadcasts, no leader election
 * Just plays audio. That's it.
 */

import { Song } from "../types";

type AudioEventCallback = (song: Song | null) => void;

class SimpleAudioManager {
  private audio: HTMLAudioElement;
  private currentSong: Song | null = null;
  private onSongEndCallback: AudioEventCallback | null = null;
  private onSongStartCallback: AudioEventCallback | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = "auto";

    // Handle song end
    this.audio.addEventListener("ended", () => {
      console.log("🎵 Song ended:", this.currentSong?.title);
      if (this.onSongEndCallback) {
        this.onSongEndCallback(this.currentSong);
      }
    });

    // Handle errors
    this.audio.addEventListener("error", (e) => {
      console.error("❌ Audio error:", e);
      console.error("Failed to load:", this.currentSong?.audioUrl);
    });

    // Handle successful load
    this.audio.addEventListener("loadeddata", () => {
      console.log("✅ Audio loaded:", this.currentSong?.title);
    });

    // Handle play start
    this.audio.addEventListener("play", () => {
      console.log("▶️ Playing:", this.currentSong?.title);
      if (this.onSongStartCallback) {
        this.onSongStartCallback(this.currentSong);
      }
    });
  }

  /**
   * Play a song
   */
  async play(song: Song): Promise<void> {
    console.log("🎵 Loading song:", song.title, song.audioUrl);

    this.currentSong = song;
    this.audio.src = song.audioUrl;
    this.audio.load();

    try {
      await this.audio.play();
      console.log("✅ Playback started");
    } catch (error) {
      console.error("❌ Play failed:", error);
      throw error;
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.audio.pause();
  }

  /**
   * Resume playback
   */
  resume(): void {
    this.audio.play().catch((err) => {
      console.error("❌ Resume failed:", err);
    });
  }

  /**
   * Set volume (0-100)
   */
  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(100, volume)) / 100;
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  /**
   * Get total duration
   */
  getDuration(): number {
    return this.audio.duration || 0;
  }

  /**
   * Seek to time (seconds)
   */
  seekTo(seconds: number): void {
    this.audio.currentTime = seconds;
  }

  /**
   * Check if playing
   */
  isPlaying(): boolean {
    return !this.audio.paused;
  }

  /**
   * Get current song
   */
  getCurrentSong(): Song | null {
    return this.currentSong;
  }

  /**
   * Register callback for song end
   */
  onSongEnd(callback: AudioEventCallback): void {
    this.onSongEndCallback = callback;
  }

  /**
   * Register callback for song start
   */
  onSongStart(callback: AudioEventCallback): void {
    this.onSongStartCallback = callback;
  }

  /**
   * Stop playback and clear
   */
  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.currentSong = null;
  }
}

// Singleton instance
let instance: SimpleAudioManager | null = null;

export function getAudioManager(): SimpleAudioManager {
  if (!instance) {
    instance = new SimpleAudioManager();
    console.log("🎵 SimpleAudioManager initialized");
  }
  return instance;
}

export default SimpleAudioManager;
