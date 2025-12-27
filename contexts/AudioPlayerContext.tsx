/**
 * @file This file defines the RadioContext for the application.
 * It provides a global state for all aspects of the live radio experience,
 * including the currently playing song, the DJ script queue, the current radio state (e.g., voting),
 * vote counts, and chat messages. It also manages the audio element for playing song snippets.
 */

import React, {
  createContext,
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { generateDjBanter } from "../services/geminiStudioService";
import { getCurrentDj } from "../logic/djRoster";
import { getBroadcastManager } from "../services/globalBroadcastManager";
import type {
  Song,
  RadioState,
  BoxRound,
  ChatMessage,
  DjQueueItem,
  DjBanterScriptInput,
  DjProfile,
  Profile,
} from "../types";

// Defines the shape of the context data.
interface RadioContextType {
  nowPlaying: Song | null;
  setNowPlaying: (song: Song | null, startOffset?: number) => void;
  prioritySong: Song | null;
  setPrioritySong: (song: Song | null) => void;
  djQueue: DjQueueItem[];
  setDjQueue: React.Dispatch<React.SetStateAction<DjQueueItem[]>>;
  addDjQueueItem: (
    type: DjBanterScriptInput["event"],
    context?: any,
  ) => Promise<void>;
  radioState: RadioState;
  setRadioState: React.Dispatch<React.SetStateAction<RadioState>>;
  boxRound: BoxRound | null;
  setBoxRound: React.Dispatch<React.SetStateAction<BoxRound | null>>;
  voteCounts: Record<string, number>;
  setVoteCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  snippetPlayingUrl: string | null;
  setSnippetPlayingUrl: (url: string | null) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  isTtsErrorMuted: boolean;
  setIsTtsErrorMuted: React.Dispatch<React.SetStateAction<boolean>>;
  isTtsUserMuted: boolean;
  setIsTtsUserMuted: React.Dispatch<React.SetStateAction<boolean>>;
  volume: number;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  isGloballyMuted: boolean;
  setIsGloballyMuted: React.Dispatch<React.SetStateAction<boolean>>;
  currentDj: DjProfile;
  setCurrentDj: React.Dispatch<React.SetStateAction<DjProfile>>;
  // New state for live voting on the Now Playing song
  liveRatings: number[];
  addLiveRating: (rating: number) => void;
  clearLiveRatings: () => void;
  userLiveRating: number | null;
  // Admin controls for DJ Booth
  skipCurrentSong: () => void;
  forceNewBoxRound: () => void;
  boxUpdateTrigger: number;
  forceRestartRadio: () => void; // New function
  restartRadioTrigger: number; // New trigger
  seekTo: (time: number) => void;
  playSnippet: (url: string) => void;
  stopSnippet: () => void;
  isPlaying: boolean;
  togglePlay: () => void;
  songEndedTrigger: number;
  isLeader: boolean;
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  currentTime: number;
  duration: number;
}

// Create the context with default values.
export const RadioContext = createContext<RadioContextType>({
  nowPlaying: null,
  setNowPlaying: () => { },
  prioritySong: null,
  setPrioritySong: () => { },
  djQueue: [],
  setDjQueue: () => { },
  addDjQueueItem: async () => { },
  radioState: "DJ_BANTER_INTRO",
  setRadioState: () => { },
  boxRound: null,
  setBoxRound: () => { },
  voteCounts: {},
  setVoteCounts: () => { },
  snippetPlayingUrl: null,
  setSnippetPlayingUrl: () => { },
  chatMessages: [],
  addChatMessage: () => { },
  clearChatMessages: () => { },
  isTtsErrorMuted: false,
  setIsTtsErrorMuted: () => { },
  isTtsUserMuted: false,
  setIsTtsUserMuted: () => { },
  volume: 1,
  setVolume: () => { },
  isGloballyMuted: false,
  setIsGloballyMuted: () => { },
  currentDj: getCurrentDj(),
  setCurrentDj: () => { },
  liveRatings: [],
  addLiveRating: () => { },
  clearLiveRatings: () => { },
  userLiveRating: null,
  skipCurrentSong: () => { },
  forceNewBoxRound: () => { },
  boxUpdateTrigger: 0,
  forceRestartRadio: () => { },
  restartRadioTrigger: 0,
  seekTo: () => { },
  playSnippet: () => { },
  stopSnippet: () => { },
  isPlaying: false,
  togglePlay: () => { },
  songEndedTrigger: 0,
  isLeader: false,
  profile: null,
  setProfile: () => { },
  currentTime: 0,
  duration: 0,
});

export const RadioProvider: React.FC<{
  children: React.ReactNode;
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}> = ({ children, profile, setProfile }) => {
  // Get the global broadcast manager singleton
  const broadcastManager = useRef(getBroadcastManager()).current;

  // State managed by the context provider.
  // Ref to hidden audio element for playing snippets (preview playback).
  const snippetAudioRef = useRef<HTMLAudioElement | null>(null);

  const [nowPlaying, setNowPlayingState] = useState<Song | null>(null);

  const setNowPlaying = useCallback(
    (song: Song | null, offset: number = 0) => {
      setNowPlayingState(song);
      // Delegate to broadcast manager
      broadcastManager.setNowPlaying(song, offset);
    },
    [broadcastManager],
  );

  const [prioritySong, setPrioritySong] = useState<Song | null>(null);
  const [djQueue, setDjQueue] = useState<DjQueueItem[]>([]);
  const [radioState, setRadioStateLocal] =
    useState<RadioState>("DJ_BANTER_INTRO");

  const setRadioState = useCallback(
    (newState: RadioState | ((prevState: RadioState) => RadioState)) => {
      // If functional update, resolve it against current local state (optimistic)
      const resolvedState =
        typeof newState === "function" ? newState(radioState) : newState;

      setRadioStateLocal(resolvedState);
      broadcastManager.setRadioState(resolvedState);
    },
    [broadcastManager, radioState],
  );

  const [boxRound, setBoxRound] = useState<BoxRound | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [snippetPlayingUrl, setSnippetPlayingUrl] = useState<string | null>(
    null,
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTtsErrorMuted, setIsTtsErrorMuted] = useState<boolean>(false);

  // State for the new multi-DJ system.
  const [currentDj, setCurrentDj] = useState<DjProfile>(getCurrentDj());

  // State for live voting
  const [liveRatings, setLiveRatings] = useState<number[]>([]);
  const [userLiveRating, setUserLiveRating] = useState<number | null>(null);

  // Trigger for forcing box updates without stopping music
  const [boxUpdateTrigger, setBoxUpdateTrigger] = useState<number>(0);

  // Trigger for HARD restarting the radio system
  const [restartRadioTrigger, setRestartRadioTrigger] = useState<number>(0);

  // State to track if the main audio is actually playing (for UI toggle)
  const [isPlaying, setIsPlaying] = useState(false);

  // Leader state
  const [isLeader, setIsLeader] = useState(broadcastManager.isLeader);

  // Current playback time
  const [currentTime, setCurrentTime] = useState(0);

  // Derived duration
  const duration = nowPlaying?.durationSec || 0;

  /**
   * Toggles the main audio playback.
   */
  const togglePlay = useCallback(() => {
    broadcastManager.togglePlay().catch((e) => console.error("Play failed", e));
  }, [broadcastManager]);

  // WAIT. I cannot insert `togglePlay` here because `mainAudioRef` is not defined yet.
  // I will only insert `isPlaying` here.
  // I will insert `togglePlay` later.

  // Initialize user's TTS mute preference from localStorage.
  const [isTtsUserMuted, setIsTtsUserMuted] = useState<boolean>(() => {
    try {
      const storedMutePref = localStorage.getItem("cys-tts-user-muted");
      return storedMutePref ? JSON.parse(storedMutePref) : false;
    } catch (error) {
      console.error(
        "Could not load user TTS mute preference from localStorage",
        error,
      );
      return false;
    }
  });

  // Initialize volume and global mute from localStorage.
  const [volume, setVolume] = useState<number>(() => {
    const stored = localStorage.getItem("cys-volume");
    return stored ? parseFloat(stored) : 1;
  });
  const [isGloballyMuted, setIsGloballyMuted] = useState<boolean>(() => {
    const stored = localStorage.getItem("cys-global-mute");
    return stored ? JSON.parse(stored) : false;
  });

  // Effect to persist the user's TTS mute preference to localStorage.
  useEffect(() => {
    try {
      localStorage.setItem(
        "cys-tts-user-muted",
        JSON.stringify(isTtsUserMuted),
      );
    } catch (error) {
      console.error(
        "Could not save user TTS mute preference to localStorage",
        error,
      );
    }
  }, [isTtsUserMuted]);

  // Effects to persist volume controls to localStorage.
  useEffect(() => {
    localStorage.setItem("cys-volume", volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem("cys-global-mute", JSON.stringify(isGloballyMuted));
  }, [isGloballyMuted]);

  /**
   * Adds a new message to the chat history, keeping only the last 50 messages.
   */
  const addChatMessage = (message: ChatMessage) => {
    setChatMessages((prev) => [...prev, message].slice(-50));
  };

  /**
   * Clears all messages from the chat history.
   */
  const clearChatMessages = () => {
    setChatMessages([]);
  };

  /**
   * Adds a new rating to the live vote pool.
   * The user's vote is handled separately.
   */
  const addLiveRating = useCallback(
    (rating: number) => {
      if (userLiveRating === null) {
        // Only allow one vote per user
        setUserLiveRating(rating);
        setLiveRatings((prev) => [...prev, rating]);
      }
    },
    [userLiveRating],
  );

  /**
   * Clears all live ratings, ready for the next song.
   */
  const clearLiveRatings = useCallback(() => {
    setLiveRatings([]);
    setUserLiveRating(null);
  }, []);

  /**
   * Admin Control: Skip the currently playing song immediately.
   * This will trigger the song end logic early.
   */
  const skipCurrentSong = useCallback(() => {
    if (nowPlaying) {
      setNowPlaying(null);
      addChatMessage({
        id: Date.now().toString(),
        user: { name: "DJ Booth", isDj: true },
        text: `🎛️ Admin skipped "${nowPlaying.title}"`,
        timestamp: Date.now(),
      });
    }
  }, [nowPlaying]);

  /**
   * Admin Control: Force a new box round immediately.
   * This clears the current state and triggers the radio to start fresh.
   */
  const forceNewBoxRound = useCallback(() => {
    // Increment trigger to signal Radio.tsx to refresh the box
    setBoxUpdateTrigger((prev) => prev + 1);

    addChatMessage({
      id: Date.now().toString(),
      user: { name: "DJ Booth", isDj: true },
      text: "🎛️ Admin forced a new box round",
      timestamp: Date.now(),
    });
  }, []);

  /**
   * Admin Control: Hard Restart the Radio System.
   * Use when the state is completely stuck.
   */
  const forceRestartRadio = useCallback(() => {
    setRestartRadioTrigger((prev) => prev + 1);
    addChatMessage({
      id: Date.now().toString(),
      user: { name: "DJ Booth", isDj: true },
      text: "⚠️ ADMIN HARD RESTART INITIATED ⚠️",
      timestamp: Date.now(),
    });
  }, []);

  /**
   * Seeks the main audio player to the specified time.
   */
  const seekTo = useCallback(
    (time: number) => {
      broadcastManager.seekTo(time);
    },
    [broadcastManager],
  );

  /**
   * Generates a DJ script or fetches a pre-recorded line and adds it to the queue.
   * This is the single source of truth for adding items to the DJ audio queue.
   * It now includes the current DJ's profile in the request.
   */
  const addDjQueueItem = useCallback(
    async (type: DjBanterScriptInput["event"], context?: any) => {
      try {
        // Pass the current DJ's profile to the generation service.
        const queueItem = await generateDjBanter({
          event: type,
          djProfile: currentDj,
          ...context,
        });
        if (queueItem) {
          setDjQueue((prev) => [...prev, queueItem]);
        }
      } catch (error) {
        console.error(
          `Failed to generate queue item for event "${type}":`,
          error,
        );
      }
    },
    [currentDj],
  );

  /**
   * Effect to sync React state with broadcast manager state.
   * This subscribes to manager events and updates local state accordingly.
   */
  useEffect(() => {
    const handleNowPlayingChanged = (song: Song | null) => {
      setNowPlayingState(song);
      if (song) {
        clearLiveRatings();
      }
    };

    const handlePlaybackStateChanged = (playing: boolean) => {
      setIsPlaying(playing);
    };

    const handleRadioStateChanged = (newState: RadioState) => {
      setRadioStateLocal(newState);
    };

    const handleSongEnded = () => {
      setSongEndedTrigger((prev) => prev + 1);
    };

    const handleLeaderChanged = (leader: boolean) => {
      setIsLeader(leader);
    };

    // Subscribe to broadcast manager events
    broadcastManager.on("nowPlayingChanged", handleNowPlayingChanged);
    broadcastManager.on("playbackStateChanged", handlePlaybackStateChanged);
    broadcastManager.on("radioStateChanged", handleRadioStateChanged);
    broadcastManager.on("songEnded", handleSongEnded);
    broadcastManager.on("leaderChanged", handleLeaderChanged);
    broadcastManager.on("timeUpdate", setCurrentTime);

    // Sync initial state
    const initialSong = broadcastManager.getNowPlaying();
    if (initialSong) {
      setNowPlayingState(initialSong);
    }
    setRadioStateLocal(broadcastManager.getRadioState());
    setIsPlaying(broadcastManager.isPlaying());
    setIsLeader(broadcastManager.isLeader);

    return () => {
      broadcastManager.off("nowPlayingChanged", handleNowPlayingChanged);
      broadcastManager.off("playbackStateChanged", handlePlaybackStateChanged);
      broadcastManager.off("radioStateChanged", handleRadioStateChanged);
      broadcastManager.off("songEnded", handleSongEnded);
      broadcastManager.off("songEnded", handleSongEnded);
      broadcastManager.off("leaderChanged", handleLeaderChanged);
      broadcastManager.off("timeUpdate", setCurrentTime);
    };
  }, [broadcastManager, clearLiveRatings]);

  /**
   * Effect to handle volume and mute changes.
   */
  useEffect(() => {
    // Duck volume when snippet is playing
    const effectiveVolume = snippetPlayingUrl ? volume * 0.2 : volume;
    broadcastManager.setVolume(effectiveVolume);
    broadcastManager.setMuted(isGloballyMuted);
  }, [volume, isGloballyMuted, snippetPlayingUrl, broadcastManager]);

  /**
   * GLOBAL AUTO-RESUME LISTENER
   * Browsers block autoplay. This listener waits for ANY user interaction (click/key)
   * and tries to resume playback if it's supposed to be playing but is paused.
   * This creates the "Always Playing" experience without a manual Play button.
   */
  useEffect(() => {
    const attemptResume = () => {
      if (nowPlaying && !isPlaying) {
        // console.debug("👆 Auto-resume check...");
        broadcastManager
          .play()
          .then(() => {
            console.log("✅ Auto-resume successful.");
          })
          .catch((e) => {
            // Suppress common "NotSupportedError" which just means no source is loaded yet
            if (e.name !== "NotSupportedError") {
              console.debug("⚠️ Auto-resume failed:", e);
            }
          });
      }
    };

    // Listen for any interaction
    document.addEventListener("click", attemptResume);
    document.addEventListener("keydown", attemptResume);
    document.addEventListener("touchstart", attemptResume);

    return () => {
      document.removeEventListener("click", attemptResume);
      document.removeEventListener("keydown", attemptResume);
      document.removeEventListener("touchstart", attemptResume);
    };
  }, [nowPlaying, isPlaying, broadcastManager]);

  /**
   * Effect to control the playback of audio snippets.
   * When `snippetPlayingUrl` changes, it plays the new URL for up to 10 seconds.
   */
  useEffect(() => {
    const audioEl = snippetAudioRef.current;
    if (!audioEl) return;

    audioEl.volume = volume;
    audioEl.muted = isGloballyMuted;

    let timer: number;

    if (snippetPlayingUrl) {
      audioEl.src = snippetPlayingUrl;
      audioEl.currentTime = 0;
      const playPromise = audioEl.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Snippet playback failed:", error);
          setSnippetPlayingUrl(null); // Reset on failure
        });
      }

      // Snippets are hard-coded to 10 seconds max.
      timer = window.setTimeout(() => {
        audioEl.pause();
        setSnippetPlayingUrl(null);
      }, 10000);
    } else {
      audioEl.pause();
    }

    return () => {
      clearTimeout(timer);
    };
  }, [snippetPlayingUrl, volume, isGloballyMuted]);

  // Memoize the context value to prevent unnecessary re-renders of consuming components.
  /**
   * Plays a 15-second snippet of a song.
   */

  const playSnippet = useCallback((url: string) => {
    setSnippetPlayingUrl(url);
    const audioEl = snippetAudioRef.current;
    if (audioEl) {
      audioEl.src = url;
      audioEl.volume = 0.5;
      audioEl.play().catch((e) => console.error("Snippet play failed", e));
    }
  }, []);

  const stopSnippet = useCallback(() => {
    if (snippetAudioRef.current) {
      snippetAudioRef.current.pause();
      snippetAudioRef.current.currentTime = 0;
    }
    setSnippetPlayingUrl(null);
  }, []);

  // Ref for the snippet audio object
  // This declaration is already present at the top of the component.
  // const snippetAudioRef = useRef<HTMLAudioElement | null>(null);

  // Trigger to signal when the main song has finished playing
  const [songEndedTrigger, setSongEndedTrigger] = useState<number>(0);

  const value = useMemo(
    () => ({
      nowPlaying,
      setNowPlaying,
      prioritySong,
      setPrioritySong,
      djQueue,
      setDjQueue,
      addDjQueueItem,
      radioState,
      setRadioState,
      boxRound,
      setBoxRound,
      voteCounts,
      setVoteCounts,
      snippetPlayingUrl,
      setSnippetPlayingUrl,
      chatMessages,
      addChatMessage,
      clearChatMessages,
      isTtsErrorMuted,
      setIsTtsErrorMuted,
      isTtsUserMuted,
      setIsTtsUserMuted,
      volume,
      setVolume,
      isGloballyMuted,
      setIsGloballyMuted,
      currentDj,
      setCurrentDj,
      liveRatings,
      addLiveRating,
      clearLiveRatings,
      userLiveRating,
      skipCurrentSong,
      forceNewBoxRound,
      boxUpdateTrigger,
      forceRestartRadio,
      restartRadioTrigger, // Export new controls
      seekTo,
      playSnippet,
      stopSnippet,
      isPlaying,
      togglePlay,
      songEndedTrigger, // Export the trigger
      isLeader,
      profile,
      setProfile,
      currentTime,
      duration,
    }),
    [
      nowPlaying,
      prioritySong,
      djQueue,
      radioState,
      boxRound,
      voteCounts,
      snippetPlayingUrl,
      chatMessages,
      isTtsErrorMuted,
      isTtsUserMuted,
      volume,
      isGloballyMuted,
      currentDj,
      liveRatings,
      userLiveRating,
      skipCurrentSong,
      forceNewBoxRound,
      boxUpdateTrigger,
      forceRestartRadio,
      restartRadioTrigger, // Include in dependency array
      seekTo,
      playSnippet,
      stopSnippet,
      isPlaying,
      togglePlay,
      songEndedTrigger,
      isLeader,
      profile,
      setProfile,
      currentTime,
      duration,
    ],
  );

  return (
    <RadioContext.Provider value={value}>
      {/* Hidden audio element for snippet playback (broadcast manager handles main audio) */}
      <audio
        ref={snippetAudioRef}
        style={{ display: "none" }}
        onEnded={() => setSnippetPlayingUrl(null)}
      />
      {children}
    </RadioContext.Provider>
  );
};
