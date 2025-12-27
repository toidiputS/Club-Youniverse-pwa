/**
 * @file Global Broadcast Manager - Singleton service for managing radio state
 * This service ensures continuous 24/7 playback by managing audio state outside
 * the React component lifecycle. It connects to the 'broadcasts' table in Supabase
 * to ensure all clients stay synchronized (Global Pulse).
 */

import { supabase } from "./supabaseClient";
import type { Song, RadioState } from "../types";

type EventCallback = (...args: any[]) => void;

interface BroadcastState {
  nowPlaying: Song | null;
  radioState: RadioState;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
}

/**
 * GlobalBroadcastManager - Singleton class for managing the radio stream
 */
export class GlobalBroadcastManager {
  private static instance: GlobalBroadcastManager | null = null;

  private audioElement: HTMLAudioElement;
  private eventListeners: Map<string, Set<EventCallback>>;
  private state: BroadcastState;
  private timeUpdateInterval: number | null = null;

  // Leader Election
  private userId: string | null = null;
  private isLeaderLocal: boolean = false;
  private heartbeatInterval: number | null = null;

  private constructor() {
    // Create the audio element
    this.audioElement = new Audio();
    this.audioElement.preload = "auto";

    // Initialize event listeners map
    this.eventListeners = new Map();

    // Load INITIAL local state (volume/mute only)
    this.state = this.loadLocalState();

    // Set up audio element event handlers
    this.setupAudioHandlers();

    // Start time update interval
    this.startTimeUpdates();

    // Initialize connection to Global State (DB)
    this.initializeGlobalState();

    // Start Leader Election Process
    this.initLeaderElection();

    console.log("🎙️ GlobalBroadcastManager initialized");
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): GlobalBroadcastManager {
    if (!GlobalBroadcastManager.instance) {
      GlobalBroadcastManager.instance = new GlobalBroadcastManager();
    }
    return GlobalBroadcastManager.instance;
  }

  private async initLeaderElection() {
    // 1. Get current user ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      this.userId = user.id;
      console.log("👤 Authorized as:", this.userId);
      this.startElectionLoop();
    } else {
      // Wait for auth? simple retry for now or listen to auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user && !this.userId) {
          this.userId = session.user.id;
          console.log("👤 Auth recovered:", this.userId);
          this.startElectionLoop();
        }
      });
    }
  }

  private startElectionLoop() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    // Check for leadership more frequently (2s) to ensure fast recovery
    this.heartbeatInterval = window.setInterval(async () => {
      if (!this.userId) return;
      await this.tryClaimLeadership();
    }, 2000);

    // Run immediately
    this.tryClaimLeadership();
  }

  private async tryClaimLeadership() {
    try {
      // 1. Fetch current leader status
      const { data, error } = await supabase
        .from("broadcasts")
        .select("leader_id, last_heartbeat")
        .limit(1)
        .single();

      if (error || !data) return;

      const now = new Date();
      const heartbeat = data.last_heartbeat
        ? new Date(data.last_heartbeat)
        : new Date(0);
      const secondsSinceHeartbeat =
        (now.getTime() - heartbeat.getTime()) / 1000;
      const isCurrentLeaderDead = secondsSinceHeartbeat > 8; // 8s timeout (aggressive recovery)
      const amILeader = data.leader_id === this.userId;

      if (amILeader) {
        // I am the leader. Refresh heartbeat.
        this.isLeaderLocal = true;
        // console.log("👑 I am the LEADER. Sending heartbeat...");
        await supabase
          .from("broadcasts")
          .update({ last_heartbeat: now.toISOString() })
          .eq("leader_id", this.userId); // Safety check
      } else if (isCurrentLeaderDead || !data.leader_id) {
        // Leader is dead or missing. Claim it!
        console.log(
          `👑 Leader missing (${secondsSinceHeartbeat.toFixed(1)}s ago). Claiming throne...`,
        );

        // Atomic claim attempted via RLS/Update
        // We update WHERE leader_id is what we saw (Optimistic Lock) or if it's null
        const claimFilter = data.leader_id
          ? `leader_id.is.null,leader_id.eq.${data.leader_id}`
          : `leader_id.is.null`;

        const { error: claimError } = await supabase
          .from("broadcasts")
          .update({
            leader_id: this.userId,
            last_heartbeat: now.toISOString(),
          })
          .or(claimFilter);

        if (!claimError) {
          this.isLeaderLocal = true;
          console.log("👑 Leadership CLAIMED!");
          this.emit("leaderChanged", true);
        } else {
          console.error("❌ Leadership claim FAILED:", claimError);
        }
      } else {
        // Someone else is leader and healthy.
        if (this.isLeaderLocal) {
          console.log("👑 Leadership LOST.");
          this.isLeaderLocal = false;
          this.emit("leaderChanged", false);
        }
      }
    } catch (e) {
      console.error("Election error:", e);
    }
  }

  /**
   * Load volume/mute prefs from localStorage
   */
  private loadLocalState(): BroadcastState {
    let volume = 1;
    let isMuted = false;
    try {
      const stored = localStorage.getItem("club-youniverse-broadcast-state");
      if (stored) {
        const parsed = JSON.parse(stored);
        volume = parsed.volume ?? 1;
        isMuted = parsed.isMuted ?? false;
      }
    } catch (e) {
      console.error(e);
    }

    return {
      nowPlaying: null,
      radioState: "DJ_BANTER_INTRO",
      currentTime: 0,
      volume,
      isMuted,
      isPlaying: false,
    };
  }

  /**
   * Connect to Supabase for the Source of Truth
   */
  private async initializeGlobalState() {
    console.log("🌍 Initializing Global Broadcast Connection...");

    // 1. Fetch initial state (no foreign key join needed)
    const { data, error } = await supabase
      .from("broadcasts")
      .select("*")
      .limit(1)
      .single();

    if (data) {
      this.syncStateFromRemote(data);
    } else if (error) {
      console.error("❌ Failed to fetch broadcast state:", error);
    }

    // 2. Subscribe to Realtime changes
    supabase
      .channel("public:broadcasts")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "broadcasts" },
        (_payload) => {
          // console.log('📡 Global Trigger:', payload.new);
          this.fetchAndSync();
        },
      )
      .subscribe((status) => {
        console.log("📡 Broadcast Subscription Status:", status);
      });
  }

  private async fetchAndSync() {
    const { data } = await supabase
      .from("broadcasts")
      .select("*, current_song:songs(*)")
      .limit(1)
      .single();

    if (data) this.syncStateFromRemote(data);
  }

  private syncStateFromRemote(data: any) {
    const remoteSong = data.current_song as Song | null;
    const remoteState = data.radio_state as RadioState;

    // Sync Radio State
    if (this.state.radioState !== remoteState) {
      console.log(
        `📻 Global State Update: ${this.state.radioState} -> ${remoteState}`,
      );
      this.state.radioState = remoteState;
      this.emit("radioStateChanged", remoteState);
    }

    // Sync Now Playing
    if (remoteSong?.id !== this.state.nowPlaying?.id) {
      console.log(`🎵 Global Song Update: ${remoteSong?.title}`);
      const offset = this.calculateOffset(data.song_started_at);
      this.setNowPlaying(remoteSong, offset);
    } else {
      // Check for drift > 2 seconds
      const expectedTime = this.calculateOffset(data.song_started_at);
      const drift = Math.abs(this.audioElement.currentTime - expectedTime);

      if (drift > 2 && this.state.isPlaying) {
        // console.log(`🕰️ Drift Correction: ${this.audioElement.currentTime.toFixed(1)}s -> ${expectedTime.toFixed(1)}s`);
        this.audioElement.currentTime = expectedTime;
      }
    }
  }

  private calculateOffset(startedAt: string): number {
    if (!startedAt) return 0;
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    // Return seconds elapsed
    return Math.max(0, (now - start) / 1000);
  }

  /**
   * Save local preferences
   */
  private saveState(): void {
    try {
      const toSave = {
        volume: this.state.volume,
        isMuted: this.state.isMuted,
      };
      localStorage.setItem(
        "club-youniverse-broadcast-state",
        JSON.stringify(toSave),
      );
    } catch (error) {
      console.error("Failed to save broadcast state", error);
    }
  }

  /**
   * Setup audio listeners
   */
  private setupAudioHandlers(): void {
    this.audioElement.addEventListener("play", () => {
      this.state.isPlaying = true;
      this.emit("playbackStateChanged", true);
    });
    this.audioElement.addEventListener("pause", () => {
      this.state.isPlaying = false;
      this.emit("playbackStateChanged", false);
    });
    this.audioElement.addEventListener("ended", () => {
      this.state.isPlaying = false;
      this.emit("songEnded", this.state.nowPlaying);
    });
    this.audioElement.addEventListener("error", (e) => {
      const errorDetails = this.audioElement.error;
      console.error("❌ Audio Error Event:", errorDetails ? `Code: ${errorDetails.code}, Message: ${errorDetails.message}` : "Unknown error");
      // If we have a MediaError, it usually means the source is bad or network failed.
      // We could try to recover here, but for now just logging detail is enough.
      this.emit("audioError", e);
    });

    this.audioElement.volume = this.state.volume;
    this.audioElement.muted = this.state.isMuted;
  }

  /**
   * Time updates for progress bar
   */
  private startTimeUpdates(): void {
    if (this.timeUpdateInterval) clearInterval(this.timeUpdateInterval);
    this.timeUpdateInterval = window.setInterval(() => {
      if (this.state.isPlaying && this.state.nowPlaying) {
        this.state.currentTime = this.audioElement.currentTime;
        this.emit("timeUpdate", this.audioElement.currentTime);
      }
    }, 1000);
  }

  // --- PUBLIC API ---

  public get isLeader() {
    return this.isLeaderLocal;
  }

  public async setNowPlaying(
    song: Song | null,
    startOffset: number = 0,
  ): Promise<void> {
    // Optimistic update
    this.state.nowPlaying = song;
    if (!song) {
      this.audioElement.pause();
      this.audioElement.removeAttribute("src");
      this.audioElement.load(); // Required to reset the element and stop it from complaining
      this.emit("nowPlayingChanged", null);
      await this.persistBroadcastState(); // Persist empty state
      return;
    }

    if (!song.audioUrl) {
      console.error("❌ CRITICAL: Attempting to play song with NO AUDIO URL:", song.title);
      return;
    } else {
      console.log(`🎵 Ready to play: ${song.title} -> ${song.audioUrl}`);
    }

    // CHECK: Is this the same song?
    // If IDs match, we might be updating metadata (stars, plays).
    // In that case, DO NOT reset audio src or time.
    const isSameSong =
      this.audioElement.src === song.audioUrl ||
      this.state.nowPlaying?.id === song.id;

    if (!isSameSong) {
      console.log(`🎵 Playing new song: ${song.title}`);
      this.audioElement.src = song.audioUrl;
      this.audioElement.currentTime = startOffset;
      // Try to autoplay
      this.play().catch((e) => console.warn("Autoplay blocked:", e));
    } else {
      console.log(`🔄 Updating metadata for current song: ${song.title}`);
      // Optional: If startOffset is explicitly provided and different, maybe seek?
      // For now, assume metadata updates don't want to seek unless explicit.
      if (
        startOffset > 0 &&
        Math.abs(this.audioElement.currentTime - startOffset) > 2
      ) {
        this.audioElement.currentTime = startOffset;
      }
    }

    this.emit("nowPlayingChanged", song);

    // PERSIST TO GLOBAL STATE (Only if Leader, or if specifically forced?)
    // In the new architecture, Client -> Radio.tsx -> (Checks Leader) -> calls setNowPlaying
    // But setNowPlaying is also called by syncFromRemote (follower).
    // WE MUST DISTINGUISH between "I am setting this because I am the source" vs "I am setting this because I was told to".

    // Actually, internal sync calls should NOT call persistBroadcastState.
    // Public calls (from Radio.tsx) imply an INTENT to change state.
    // So we keep persist logic here, but guard it with isLeader checks inside persist.
    if (this.isLeaderLocal) {
      await this.persistBroadcastState(!isSameSong);
    }
  }

  private async persistBroadcastState(newSongStartedAt: boolean = false) {
    // GATEKEEPER: Only Leader can write to DB State!
    if (!this.isLeaderLocal) {
      // console.log("🔒 Not leader. Skipping DB persist.");
      return;
    }

    try {
      const payload: any = {
        current_song_id: this.state.nowPlaying?.id || null,
        radio_state: this.state.radioState,
        updated_at: new Date().toISOString(),
      };

      if (newSongStartedAt) {
        payload.song_started_at = new Date().toISOString();
      }

      // Using the '000...000' ID from the SQL setup or generic update
      await supabase
        .from("broadcasts")
        .update(payload)
        .eq("id", "00000000-0000-0000-0000-000000000000");
    } catch (e) {
      console.error("Failed to persist broadcast state:", e);
    }
  }

  public async setRadioState(state: RadioState) {
    if (this.state.radioState !== state) {
      this.state.radioState = state;
      this.emit("radioStateChanged", state);
      await this.persistBroadcastState();
    }
  }

  public getNowPlaying() {
    return this.state.nowPlaying;
  }
  public getRadioState() {
    return this.state.radioState;
  }
  public getCurrentTime() {
    return this.audioElement.currentTime;
  }
  public isPlaying() {
    return this.state.isPlaying;
  }
  public getVolume() {
    return this.state.volume;
  }
  public isMuted() {
    return this.state.isMuted;
  }

  public async play() {
    if (this.audioElement.paused && this.state.nowPlaying) {
      await this.audioElement.play();
    }
  }

  public pause() {
    if (!this.audioElement.paused) this.audioElement.pause();
  }

  public async togglePlay() {
    if (this.audioElement.paused) await this.play();
    else this.pause();
  }

  public seekTo(time: number) {
    this.audioElement.currentTime = time;
  }

  public setVolume(vol: number) {
    this.state.volume = Math.max(0, Math.min(1, vol));
    this.audioElement.volume = this.state.volume;
    this.saveState();
    this.emit("volumeChanged", this.state.volume);
  }

  public setMuted(muted: boolean) {
    this.state.isMuted = muted;
    this.audioElement.muted = muted;
    this.saveState();
    this.emit("mutedChanged", muted);
  }

  public on(event: string, callback: EventCallback) {
    if (!this.eventListeners.has(event))
      this.eventListeners.set(event, new Set());
    this.eventListeners.get(event)!.add(callback);
  }

  public off(event: string, callback: EventCallback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) listeners.delete(callback);
  }

  private emit(event: string, ...args: any[]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(...args);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  public destroy() {
    if (this.timeUpdateInterval) clearInterval(this.timeUpdateInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.audioElement.pause();
    this.eventListeners.clear();
    GlobalBroadcastManager.instance = null;
  }
}

export const getBroadcastManager = () => GlobalBroadcastManager.getInstance();
