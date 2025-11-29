/**
 * @file This file defines the RadioContext for the application.
 * It provides a global state for all aspects of the live radio experience,
 * including the currently playing song, the DJ script queue, the current radio state (e.g., voting),
 * vote counts, and chat messages. It also manages the audio element for playing song snippets.
 */

import React, { createContext, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { generateDjBanter } from '../services/geminiStudioService';
import { getCurrentDj } from '../logic/djRoster';
import type { Song, RadioState, BoxRound, ChatMessage, DjQueueItem, DjBanterScriptInput, DjProfile } from '../types';

// Defines the shape of the context data.
interface RadioContextType {
    nowPlaying: Song | null;
    setNowPlaying: (song: Song | null, startOffset?: number) => void;
    prioritySong: Song | null;
    setPrioritySong: (song: Song | null) => void;
    djQueue: DjQueueItem[];
    setDjQueue: React.Dispatch<React.SetStateAction<DjQueueItem[]>>;
    addDjQueueItem: (type: DjBanterScriptInput['event'], context?: any) => Promise<void>;
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
    seekTo: (time: number) => void;
    playSnippet: (url: string) => void;
    stopSnippet: () => void;
    isPlaying: boolean;
    togglePlay: () => void;
    songEndedTrigger: number;
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
    radioState: 'DJ_BANTER_INTRO',
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
    seekTo: () => { },
    playSnippet: () => { },
    stopSnippet: () => { },
    isPlaying: false,
    togglePlay: () => { },
    songEndedTrigger: 0,
});

export const RadioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // State managed by the context provider.
    // Refs to hidden audio elements for playing snippets and the main track.
    const snippetAudioRef = useRef<HTMLAudioElement | null>(null);
    const mainAudioRef = useRef<HTMLAudioElement | null>(null);

    const [nowPlaying, setNowPlayingState] = useState<Song | null>(null);
    const [startOffset, setStartOffset] = useState<number>(0);

    const setNowPlaying = useCallback((song: Song | null, offset: number = 0) => {
        setNowPlayingState(song);
        setStartOffset(offset);
    }, []);

    const [prioritySong, setPrioritySong] = useState<Song | null>(null);
    const [djQueue, setDjQueue] = useState<DjQueueItem[]>([]);
    const [radioState, setRadioState] = useState<RadioState>('DJ_BANTER_INTRO');
    const [boxRound, setBoxRound] = useState<BoxRound | null>(null);
    const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
    const [snippetPlayingUrl, setSnippetPlayingUrl] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isTtsErrorMuted, setIsTtsErrorMuted] = useState<boolean>(false);

    // State for the new multi-DJ system.
    const [currentDj, setCurrentDj] = useState<DjProfile>(getCurrentDj());

    // State for live voting
    const [liveRatings, setLiveRatings] = useState<number[]>([]);
    const [userLiveRating, setUserLiveRating] = useState<number | null>(null);

    // Trigger for forcing box updates without stopping music
    const [boxUpdateTrigger, setBoxUpdateTrigger] = useState<number>(0);

    // State to track if the main audio is actually playing (for UI toggle)
    const [isPlaying, setIsPlaying] = useState(false);



    /**
     * Toggles the main audio playback.
     */
    const togglePlay = useCallback(() => {
        const audioEl = mainAudioRef.current;
        if (audioEl) {
            if (audioEl.paused) {
                audioEl.play().catch(e => console.error("Play failed", e));
                setIsPlaying(true);
            } else {
                audioEl.pause();
                setIsPlaying(false);
            }
        }
    }, []);

    // WAIT. I cannot insert `togglePlay` here because `mainAudioRef` is not defined yet.
    // I will only insert `isPlaying` here.
    // I will insert `togglePlay` later.

    // Initialize user's TTS mute preference from localStorage.
    const [isTtsUserMuted, setIsTtsUserMuted] = useState<boolean>(() => {
        try {
            const storedMutePref = localStorage.getItem('cys-tts-user-muted');
            return storedMutePref ? JSON.parse(storedMutePref) : false;
        } catch (error) {
            console.error("Could not load user TTS mute preference from localStorage", error);
            return false;
        }
    });

    // Initialize volume and global mute from localStorage.
    const [volume, setVolume] = useState<number>(() => {
        const stored = localStorage.getItem('cys-volume');
        return stored ? parseFloat(stored) : 1;
    });
    const [isGloballyMuted, setIsGloballyMuted] = useState<boolean>(() => {
        const stored = localStorage.getItem('cys-global-mute');
        return stored ? JSON.parse(stored) : false;
    });





    // Effect to persist the user's TTS mute preference to localStorage.
    useEffect(() => {
        try {
            localStorage.setItem('cys-tts-user-muted', JSON.stringify(isTtsUserMuted));
        } catch (error) {
            console.error("Could not save user TTS mute preference to localStorage", error);
        }
    }, [isTtsUserMuted]);

    // Effects to persist volume controls to localStorage.
    useEffect(() => {
        localStorage.setItem('cys-volume', volume.toString());
    }, [volume]);

    useEffect(() => {
        localStorage.setItem('cys-global-mute', JSON.stringify(isGloballyMuted));
    }, [isGloballyMuted]);


    /**
     * Adds a new message to the chat history, keeping only the last 50 messages.
     */
    const addChatMessage = (message: ChatMessage) => {
        setChatMessages(prev => [...prev, message].slice(-50));
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
    const addLiveRating = useCallback((rating: number) => {
        if (userLiveRating === null) { // Only allow one vote per user
            setUserLiveRating(rating);
            setLiveRatings(prev => [...prev, rating]);
        }
    }, [userLiveRating]);

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
                user: { name: 'DJ Booth', isDj: true },
                text: `🎛️ Admin skipped "${nowPlaying.title}"`,
                timestamp: Date.now()
            });
        }
    }, [nowPlaying]);

    /**
     * Admin Control: Force a new box round immediately.
     * This clears the current state and triggers the radio to start fresh.
     */
    const forceNewBoxRound = useCallback(() => {
        // Increment trigger to signal Radio.tsx to refresh the box
        setBoxUpdateTrigger(prev => prev + 1);

        addChatMessage({
            id: Date.now().toString(),
            user: { name: 'DJ Booth', isDj: true },
            text: '🎛️ Admin forced a new box round',
            timestamp: Date.now()
        });
    }, []);

    /**
     * Seeks the main audio player to the specified time.
     */
    const seekTo = useCallback((time: number) => {
        if (mainAudioRef.current) {
            mainAudioRef.current.currentTime = time;
        }
    }, []);

    /**
     * Generates a DJ script or fetches a pre-recorded line and adds it to the queue.
     * This is the single source of truth for adding items to the DJ audio queue.
     * It now includes the current DJ's profile in the request.
     */
    const addDjQueueItem = useCallback(async (type: DjBanterScriptInput['event'], context?: any) => {
        try {
            // Pass the current DJ's profile to the generation service.
            const queueItem = await generateDjBanter({ event: type, djProfile: currentDj, ...context });
            if (queueItem) {
                setDjQueue(prev => [...prev, queueItem]);
            }
        } catch (error) {
            console.error(`Failed to generate queue item for event "${type}":`, error);
        }
    }, [currentDj]);

    /**
     * Effect to control the playback of the main song.
     * When `nowPlaying` changes, it plays the new song or pauses playback.
     * Mutes main audio when a snippet preview is playing.
     */
    /**
     * Effect to control the playback of the main song.
     * When `nowPlaying` changes, it plays the new song.
     */
    /**
     * Effect to control the playback of the main song.
     * When `nowPlaying` changes, it plays the new song.
     */
    useEffect(() => {
        const audioEl = mainAudioRef.current;
        if (!audioEl) return;

        if (nowPlaying) {
            // Check if we are just updating metadata (same ID)
            // We store the current src to compare, or just check the ID if we had a ref to previous ID.
            // Since we don't have a ref to previous ID easily here without adding one, 
            // we can check if the audioEl.src matches the new url.
            const currentSrc = audioEl.src;
            const newSrc = new URL(nowPlaying.audioUrl, window.location.href).href;

            // If the source is the same, and we are NOT explicitly seeking (offset >= 0), do nothing to audio.
            // If offset is -1, it's an explicit "metadata update only" signal.
            if (currentSrc === newSrc && startOffset === -1) {
                console.log("ℹ️ AudioContext: Metadata update only. Ignoring audio reset.");
                return;
            }

            // If source is same but we have a valid offset, we might be seeking (e.g. restoration).
            // If source is different, we must change it.

            if (currentSrc !== newSrc) {
                console.log("▶️ AudioContext: Changing track to:", nowPlaying.title);
                clearLiveRatings();
                audioEl.src = nowPlaying.audioUrl;
                audioEl.currentTime = Math.max(0, startOffset); // Use offset if provided
            } else if (startOffset >= 0 && Math.abs(audioEl.currentTime - startOffset) > 2) {
                // Same track, but significant time difference requested (e.g. restoration sync)
                console.log("⏩ AudioContext: Syncing time to:", startOffset);
                audioEl.currentTime = startOffset;
            }

            // Fix: Consistent ducking logic
            const startVolume = snippetPlayingUrl ? (volume * 0.2) : volume;
            audioEl.volume = startVolume;
            audioEl.muted = isGloballyMuted;

            if (audioEl.paused) {
                const playPromise = audioEl.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log("✅ AudioContext: Playback started successfully.");
                    }).catch(error => {
                        console.error("❌ AudioContext: Main audio playback failed:", error);
                    });
                }
            }
        } else {
            audioEl.pause();
            audioEl.src = ''; // Clear source
        }
    }, [nowPlaying, startOffset]); // Re-run if song or offset changes

    /**
     * Effect to handle volume and mute changes without restarting the song.
     */
    useEffect(() => {
        const audioEl = mainAudioRef.current;
        if (!audioEl) return;

        // "Muffle" the main audio (duck to 20%) when a snippet is playing,
        // otherwise use the user's set volume.
        const effectiveVolume = snippetPlayingUrl ? (volume * 0.2) : volume;

        console.log(`🔊 AudioContext: Volume update. User: ${volume}, Effective: ${effectiveVolume}, Muted: ${isGloballyMuted}`);

        audioEl.volume = effectiveVolume;
        audioEl.muted = isGloballyMuted;
    }, [volume, isGloballyMuted, snippetPlayingUrl]);

    /**
     * GLOBAL AUTO-RESUME LISTENER
     * Browsers block autoplay. This listener waits for ANY user interaction (click/key)
     * and tries to resume playback if it's supposed to be playing but is paused.
     * This creates the "Always Playing" experience without a manual Play button.
     */
    useEffect(() => {
        const attemptResume = () => {
            const audioEl = mainAudioRef.current;
            if (nowPlaying && audioEl && audioEl.paused && !isPlaying) {
                console.log("👆 User interaction detected. Attempting to auto-resume playback...");
                audioEl.play().then(() => {
                    console.log("✅ Auto-resume successful.");
                }).catch(e => {
                    console.warn("⚠️ Auto-resume failed (browser might still be blocking):", e);
                });
            }
        };

        // Listen for any interaction
        document.addEventListener('click', attemptResume);
        document.addEventListener('keydown', attemptResume);
        document.addEventListener('touchstart', attemptResume);

        return () => {
            document.removeEventListener('click', attemptResume);
            document.removeEventListener('keydown', attemptResume);
            document.removeEventListener('touchstart', attemptResume);
        };
    }, [nowPlaying, isPlaying]);

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
                playPromise.catch(error => {
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
            audioEl.play().catch(e => console.error("Snippet play failed", e));
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

    const value = useMemo(() => ({
        nowPlaying, setNowPlaying,
        prioritySong, setPrioritySong,
        djQueue, setDjQueue, addDjQueueItem,
        radioState, setRadioState,
        boxRound, setBoxRound,
        voteCounts, setVoteCounts,
        snippetPlayingUrl, setSnippetPlayingUrl,
        chatMessages, addChatMessage, clearChatMessages,
        isTtsErrorMuted, setIsTtsErrorMuted,
        isTtsUserMuted, setIsTtsUserMuted,
        volume, setVolume,
        isGloballyMuted, setIsGloballyMuted,
        currentDj, setCurrentDj,
        liveRatings, addLiveRating, clearLiveRatings, userLiveRating,
        skipCurrentSong, forceNewBoxRound, boxUpdateTrigger,
        seekTo,
        playSnippet, stopSnippet,
        isPlaying, togglePlay,
        songEndedTrigger // Export the trigger
    }), [
        nowPlaying, prioritySong, djQueue, radioState, boxRound, voteCounts, snippetPlayingUrl,
        chatMessages, isTtsErrorMuted, isTtsUserMuted, volume, isGloballyMuted, currentDj,
        liveRatings, userLiveRating, skipCurrentSong, forceNewBoxRound, boxUpdateTrigger, seekTo,
        playSnippet, stopSnippet, isPlaying, togglePlay, songEndedTrigger
    ]);

    return (
        <RadioContext.Provider value={value}>
            {/* Hidden audio elements managed by the context. */}
            <audio ref={snippetAudioRef} style={{ display: 'none' }} onEnded={() => setSnippetPlayingUrl(null)} />
            <audio
                ref={mainAudioRef}
                style={{ display: 'none' }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                    setIsPlaying(false);
                    setSongEndedTrigger(prev => prev + 1);
                }}
                onError={(e) => console.error("Audio Element Error:", e)}
            />
            {children}
        </RadioContext.Provider>
    );
};