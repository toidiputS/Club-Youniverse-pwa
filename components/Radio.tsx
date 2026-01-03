/**
 * @file This is the main component for the live radio experience.
 * It orchestrates the entire radio simulation, including managing the state machine
 * (DJ banter, voting, now playing), handling timers for events, fetching AI-generated content
 * (DJ scripts, news), and updating the global radio context.
 */

import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "../services/supabaseClient";
import { updateSong, getProfile } from "../services/supabaseSongService";
import type { View, Song, Profile } from "../types";
import { RadioContext } from "../contexts/AudioPlayerContext";
import { getBroadcastManager } from "../services/globalBroadcastManager";
import { getCurrentDj } from "../logic/djRoster";
import { LiveChat } from "./LiveChat";
import { Loader } from "./Loader";
import { Header } from "./Header";
import { RoastCallOverlay } from "./RoastCallOverlay";
import { DjBooth } from "./DjBooth";
import { TheBox } from "./TheBox";
import { StarRating } from "./StarRating";

interface RadioProps {
  onNavigate: (view: View) => void;
  songs?: Song[]; // Optional now, will fetch on demand
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}

// Constants for the radio simulation timing.
const POST_SONG_DELAY_MS = 5 * 1000;
const DJ_SHIFT_CHECK_INTERVAL_MS = 60 * 1000; // Check for a shift change every minute
const DEBUT_RATING_SURVIVAL_THRESHOLD = 5;

export const Radio: React.FC<RadioProps> = ({
  onNavigate,
  songs,
  profile,
  setProfile,
}) => {
  // State for the "Live Roast Call" UI
  const [roastCall, setRoastCall] = useState<{
    artistName: string;
    phoneNumber?: string;
    status: "dialing" | "active" | "ended";
  } | null>(null);

  // Access global radio state from the context.
  const {
    radioState,
    setRadioState,
    boxRound,
    setBoxRound,
    setNowPlaying,
    nowPlaying,
    prioritySong,
    setPrioritySong,
    addDjQueueItem,
    voteCounts,
    setVoteCounts,
    isTtsErrorMuted,
    currentDj,
    setCurrentDj,
    liveRatings,
    clearLiveRatings,
    songEndedTrigger,
    isLeader,
    setIsAutoplayBlocked, // Get setter from context
    isAutoplayBlocked,    // Get state from context
  } = useContext(RadioContext);

  // Local state for managing the radio simulation.
  const [isLoading, setIsLoading] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [showTtsErrorBanner, setShowTtsErrorBanner] = useState(true);
  const [isPoolEmpty, setIsPoolEmpty] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const prevSongsRef = useRef<Song[]>([]);
  const lastDjRef = useRef<string>(currentDj.name);

  const lastRoundStartRef = useRef(0);
  const startNextRoundRef = useRef<() => void>(() => { });



  /**
   * Maps a raw Supabase song row (snake_case) to our Song type (camelCase)
   */
  const mapSongFromDB = (raw: any): Song => ({
    id: raw.id,
    uploaderId: raw.uploader_id || raw.uploaderId,
    title: raw.title,
    artistName: raw.artist_name || raw.artistName,
    source: raw.source,
    audioUrl: raw.audio_url || raw.audioUrl,
    durationSec: raw.duration_sec || raw.durationSec || 0,
    stars: raw.stars || 0,
    boxRoundsSeen: raw.box_rounds_seen || raw.boxRoundsSeen || 0,
    boxRoundsLost: raw.box_rounds_lost || raw.boxRoundsLost || 0,
    boxAppearanceCount: raw.box_appearance_count || raw.boxAppearanceCount || 0,
    status: raw.status || 'pool',
    coverArtUrl: raw.cover_art_url || raw.coverArtUrl,
    lyrics: raw.lyrics,
    moods: raw.moods,
    tags: raw.tags,
    playCount: raw.play_count || raw.playCount || 0,
    upvotes: raw.upvotes || 0,
    downvotes: raw.downvotes || 0,
    lastPlayedAt: raw.last_played_at || raw.lastPlayedAt || '',
    createdAt: raw.created_at || raw.createdAt || '',
  });

  // Safety timeout for initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn(
          "⚠️ Radio init timed out. Forcing load to enable backup protocol.",
        );
        setIsLoading(false);
      }
    }, 10000); // 10 seconds max wait
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Autoplay blocked state (managed by GlobalManager? For now keeping local UI state if needed, or remove)
  // The GlobalBroadcastManager handles the actual play(), but we might want to know if it failed.
  // Ideally we subscribe to 'playbackStateChanged' or similar.
  // For now, let's trust the Context/Manager to handle this.
  // Removing the redundant effect that fights with the manager.

  // Listen for Autoplay Block events from the Audio Engine
  useEffect(() => {
    const broadcastManager = getBroadcastManager();

    const handleAutoplayBlocked = () => {
      console.log("🚫 Autoplay blocked event received! Showing overlay.");
      setIsAutoplayBlocked(true);
    };

    broadcastManager.on("autoplayBlocked", handleAutoplayBlocked);

    return () => {
      broadcastManager.off("autoplayBlocked", handleAutoplayBlocked);
    };
  }, [setIsAutoplayBlocked]);

  // Effect to check for DJ shift changes periodically.
  useEffect(() => {
    const shiftCheckInterval = setInterval(() => {
      const newDj = getCurrentDj();
      // If the DJ has changed since the last check, update the state.
      if (newDj.name !== lastDjRef.current) {
        // console.log(`DJ Shift Change: ${lastDjRef.current} -> ${newDj.name}`);
        // Announce the shift change on air.
        addDjQueueItem("dj_shift_change", {
          context: { oldDj: lastDjRef.current, newDj: newDj.name },
        });
        setCurrentDj(newDj);
        lastDjRef.current = newDj.name;
      }
    }, DJ_SHIFT_CHECK_INTERVAL_MS);

    return () => clearInterval(shiftCheckInterval);
  }, [setCurrentDj, addDjQueueItem]);

  // Effect to check if the station should be considered "offline" (no songs in pool).
  useEffect(() => {
    const checkPool = async () => {
      const { count, error } = await supabase
        .from("songs")
        .select("*", { count: "exact", head: true })
        .eq("status", "pool");

      if (!error && count !== null) {
        setIsPoolEmpty(count === 0);
      }
      setIsLoading(false);
    };
    checkPool();
  }, []);

  useEffect(() => {
    // Auto-start conditions:
    // 1. We are the leader (Only leader orchestrates)
    // 2. We have songs in the pool
    // 3. Nothing is currently playing
    // 4. We're not loading
    // 5. EITHER:
    //    a) We're in the initial DJ_BANTER_INTRO state, OR
    //    b) We're in BOX_VOTING but have no candidates (stale DB state)

    const conditionBanter = radioState === "DJ_BANTER_INTRO";
    const conditionBox = radioState === "BOX_VOTING" && (!boxRound || boxRound.candidates.length === 0 || !nowPlaying);
    const conditionZombie = radioState === "NOW_PLAYING" && !nowPlaying;

    // Debug logging for Auto-Start Logic (Cleaned up) 

    const shouldAutoStart =
      !isPoolEmpty &&
      !nowPlaying &&
      !isLoading &&
      (
        // Normal operation: Only Leader drives
        (isLeader && (conditionBanter || conditionBox)) ||

        // Emergency Recovery: ANYONE can fix a Zombie State (Playing but no song)
        // This fixes the "Stuck as Follower" bug where the radio dies if the leader tab closes.
        conditionZombie
      );

    if (shouldAutoStart) {
      console.log(`🚀 AUTO-START (Leader): Starting radio... (state: ${radioState})`);
      setTimeout(() => {
        startNextRoundRef.current();
      }, 2000); // 2 second delay to let everything settle
    }
  }, [isPoolEmpty, nowPlaying, isLoading, radioState, isLeader, boxRound]);

  // Effect to detect a new song submission and check if it qualifies for a priority debut.
  useEffect(() => {
    if (songs && songs.length > prevSongsRef.current.length) {
      const newSong = songs[songs.length - 1];
      if (newSong && profile) {
        const userSongCount = songs.filter(
          (s) => s.uploaderId === profile.user_id,
        ).length;
        let isPriority = userSongCount === 1;

        if (!isPriority && profile.lastDebutAt) {
          const lastDebutTime = new Date(profile.lastDebutAt).getTime();
          const hoursSince = (Date.now() - lastDebutTime) / (1000 * 60 * 60);
          if (hoursSince <= 24) {
            isPriority = true; // It's their second chance
          }
        }

        if (isPriority) {
          setPrioritySong({ ...newSong, status: "debut" });
        }
      }
      prevSongsRef.current = songs;
    }
  }, [songs, profile, setPrioritySong]);

  // RECOVERY EFFECT: If we are in BOX_VOTING but have no candidates, fetch them.
  useEffect(() => {
    if (radioState === "BOX_VOTING" && !boxRound && !isLoading) {
      console.log(
        "♻️ BOX_VOTING detected without candidates. Recovering from DB...",
      );
      const recoverBox = async () => {
        const { data } = await supabase
          .from("songs")
          .select("*")
          .eq("status", "in_box")
          .limit(3);

        if (data && data.length > 0) {
          setBoxRound({
            id: `recovered-${Date.now()}`,
            candidates: data.map(mapSongFromDB),
            startedAt: new Date().toISOString(),
          });
        } else {
          console.warn("⚠️ No 'in_box' songs found to recover.");
        }
      };
      recoverBox();
    }
  }, [radioState, boxRound, isLoading, setBoxRound]);

  // --- HARD RESTART LISTENER ---
  const { restartRadioTrigger } = useContext(RadioContext);

  // Guard against double-firing
  const isRestarting = useRef(false);

  useEffect(() => {
    if (restartRadioTrigger === 0) return; // Bypass leader check for Admin override
    if (isRestarting.current) return;

    isRestarting.current = true;

    const hardRestartRadio = async () => {
      console.log("🔥 HARD RESTART TRIGGERED (Once)");

      // 1. Reset all local state
      setVoteCounts({});
      setBoxRound(null);
      // If we joined mid-stream, sync immediately
      const manager = getBroadcastManager();
      const currentState = manager.getRadioState();
      if (currentState !== "DJ_BANTER_INTRO") {
        setRadioState(currentState);
        const currentSong = manager.getNowPlaying();
        if (currentSong) setNowPlaying(currentSong);
      } else {
        // Otherwise, start from the beginning
        setRadioState("DJ_BANTER_INTRO");
      }

      // 2. Reset Database (Nuclear)
      await supabase
        .from("songs")
        .update({ status: "pool" })
        .neq("status", "graveyard");

      // 3. Force start new round after short delay
      setTimeout(async () => {
        console.log("🔥 Picking a random song to kickstart...");

        // Fetch pool of potential songs, ensuring they have audio
        const { data, error } = await supabase
          .from("songs")
          .select("*")
          .limit(50);

        if (error) console.error("Error fetching pool:", error);

        if (data && data.length > 0) {
          // Double check for valid URL on client side (checking both casing variations)
          const validSongs = data.filter((s: any) =>
            (s.audioUrl && s.audioUrl.length > 10) ||
            (s.audio_url && s.audio_url.length > 10)
          );
          console.log(`🔎 Found ${validSongs.length} valid playback candidates.`);

          if (validSongs.length === 0) {
            console.error("❌ No valid songs found for restart!");
            isRestarting.current = false;
            return;
          }

          // Pick one random song
          const rawSong = validSongs[
            Math.floor(Math.random() * validSongs.length)
          ] as any;

          // Normalize the song object to match our internal Song type (camelCase)
          // This handles the case where Supabase returns snake_case (audio_url)
          const randomSong: Song = {
            ...rawSong,
            audioUrl: rawSong.audioUrl || rawSong.audio_url,
            coverArtUrl: rawSong.coverArtUrl || rawSong.cover_art_url,
            artistName: rawSong.artistName || rawSong.artist_name,
            durationSec: rawSong.durationSec || rawSong.duration_seq,
            uploadedBy: rawSong.uploadedBy || rawSong.uploaded_by,
          };

          console.log(`✅ Selected Restart Song: ${randomSong.title} (URL: ${randomSong.audioUrl})`);

          await updateSong(randomSong.id, {
            status: "now_playing",
            lastPlayedAt: new Date().toISOString(),
          });

          setNowPlaying(randomSong);
          setRadioState("NOW_PLAYING");

          // Announce it
          await addDjQueueItem("filler", {
            context: "System reboot complete. Let's get the music back on.",
          });
        }

        // Release lock after a delay to allow state to settle
        setTimeout(() => { isRestarting.current = false; }, 2000);
      }, 1000);
    };

    hardRestartRadio();
  }, [restartRadioTrigger]);

  // LIVE VOTE SYNC: Subscribe to song updates to show real-time votes from other users
  useEffect(() => {
    if (radioState !== "BOX_VOTING" || !boxRound) return;

    const channel = supabase
      .channel("public:songs:votes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "songs" },
        (payload) => {
          const updatedSong = payload.new as Song;
          // If the updated song is in our box, update the count
          if (boxRound.candidates.some(c => c.id === updatedSong.id)) {
            setVoteCounts((prev) => ({
              ...prev,
              [updatedSong.id]: updatedSong.upvotes || 0
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [radioState, boxRound, setVoteCounts]);

  // When TTS gets muted by an error, make sure the banner is available to be shown.
  useEffect(() => {
    if (isTtsErrorMuted) {
      setShowTtsErrorBanner(true);
    }
  }, [isTtsErrorMuted]);

  /**
   * Handles a direct message to the DJ from the chat.
   */
  const handleDjMention = useCallback(
    async (messageText: string) => {
      const strippedMessage = messageText.replace(/^@clubdj\s*/i, "").trim();
      if (strippedMessage) {
        await addDjQueueItem("user_mention", {
          context: {
            userName: profile?.name || "A Listener",
            message: strippedMessage,
          },
        });
      }
    },
    [addDjQueueItem, profile?.name],
  );

  /**
   * Selects candidate songs for the next round.
   * Fetches from Supabase directly to stay efficient.
   */
  const selectNextCandidates = useCallback(
    async (count: number = 3, excludeIds: string[] = []): Promise<Song[]> => {
      console.log(
        `🔍 Selecting ${count} candidates from DB (excluding ${excludeIds.length})...`,
      );

      let query = supabase.from("songs").select("*").eq("status", "pool");

      if (excludeIds.length > 0) {
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }

      const { data, error } = await query.limit(20);

      if (error || !data || data.length === 0) {
        console.warn("⚠️ Pool empty or error, falling back to all songs");
        const { data: fallbackData } = await supabase
          .from("songs")
          .select("*")
          .limit(20);
        return (fallbackData || [])
          .sort(() => 0.5 - Math.random())
          .slice(0, count)
          .map(mapSongFromDB);
      }

      // Shuffle and take requested count
      return data
        .sort(() => 0.5 - Math.random())
        .slice(0, count)
        .map(mapSongFromDB);
    },
    [nowPlaying?.id],
  );

  /**
   * Ends the current voting round, selects a winner, and transitions to playing it.
   */
  const endVotingRound = useCallback(async () => {
    if (!isLeader) return;
    if (!boxRound) return;

    // Determine the winner based on vote counts.
    const winner = [...boxRound.candidates].sort(
      (a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0),
    )[0];

    await addDjQueueItem("winner_announcement", {
      song: { title: winner.title, artistName: winner.artistName },
    });

    setNowPlaying(winner);
    setRadioState("NOW_PLAYING");

    // --- SAFETY SWEEP: Ensure Single Source of Truth ---
    // Before marking the new winner, reset ANY existing 'now_playing' songs to 'pool'.
    // This cleans up any ghosts from previous errors.
    await supabase
      .from("songs")
      .update({ status: "pool" })
      .eq("status", "now_playing");

    setVoteCounts({});

    // Update the winner to be the ONLY playing song
    await updateSong(winner.id, {
      stars: Math.min(10, (winner.stars || 0) + 1),
      status: "now_playing",
      playCount: (winner.playCount || 0) + 1,
      lastPlayedAt: new Date().toISOString(),
    });
  }, [boxRound, voteCounts, addDjQueueItem, setNowPlaying, setRadioState]);

  /**
   * Starts the next round of voting by selecting candidates and setting up the state.
   * Called when a song ends or when manually triggered.
   */
  const startNextRound = useCallback(async () => {
    if (!isLeader) return;
    // Debounce: Prevent starting a new round too quickly (e.g. < 2 seconds)
    if (Date.now() - lastRoundStartRef.current < 2000) {
      return;
    }
    lastRoundStartRef.current = Date.now();

    // Priority song handling (e.g., debut song gets immediate play)
    if (prioritySong) {
      setNowPlaying(prioritySong);
      setRadioState("NOW_PLAYING");
      updateSong(prioritySong.id, { status: "debut" });
      await addDjQueueItem("new_artist_shoutout", {
        song: {
          title: prioritySong.title,
          artistName: prioritySong.artistName,
        },
      });
      setPrioritySong(null); // Clear the queue after use.
      return;
    }

    // Before selecting new candidates, penalize the losers from the last round.
    if (boxRound) {
      const unchosen = boxRound.candidates.filter(
        (c) => c.id !== nowPlaying?.id,
      );
      for (const song of unchosen) {
        // Immediate -1 star penalty for losers
        const newStars = Math.max(0, (song.stars || 0) - 1);
        // Increment box loss count
        const newLosses = (song.boxRoundsLost || 0) + 1;

        // PERSIST: Update DB
        await updateSong(song.id, {
          stars: newStars,
          status: "pool",
          boxRoundsLost: newLosses,
        });
      }
    }

    // Sticky Box Logic:
    // We preserve the survivors from the previous round and only fetch a replacement for the winner.
    let boxCandidates: Song[] = [];

    if (!nowPlaying) {
      // Cold start: fetch 4 songs (1 for play, 3 for box)
      const initialSongs = await selectNextCandidates(4);
      if (initialSongs.length > 0) {
        const nextNowPlaying = initialSongs[0];
        boxCandidates = initialSongs.slice(1, 4);

        setNowPlaying(nextNowPlaying);
        setRadioState("NOW_PLAYING");
        await updateSong(nextNowPlaying.id, {
          status: "now_playing",
          lastPlayedAt: new Date().toISOString(),
        });
      }
    } else {
      // Round transition: current nowPlaying is the winner of the PREVIOUS box.
      // Other candidates from that box SURVIVE and stay in the box.
      const survivors = boxRound
        ? boxRound.candidates.filter((c) => c.id !== nowPlaying.id)
        : [];

      // We need to fetch enough to make the box have 3 candidates
      const neededForBox = 3 - survivors.length;
      const excludeIds = [nowPlaying.id, ...survivors.map((s) => s.id)];

      console.log(
        `♻️ Sticky Box: ${survivors.length} survivors, fetching ${neededForBox} fresh...`,
      );
      const freshSongs = await selectNextCandidates(neededForBox, excludeIds);
      boxCandidates = [...survivors, ...freshSongs];
    }

    if (boxCandidates.length > 0) {
      setBoxRound({
        id: `round-${Date.now()}`,
        candidates: boxCandidates,
        startedAt: new Date().toISOString(),
      });

      // --- SAFETY SWEEP: Clean up The Box ---
      // Reset any songs marked 'in_box' that are NOT in our new candidate list.
      const newCandidateIds = boxCandidates.map((c) => c.id);
      if (newCandidateIds.length > 0) {
        await supabase
          .from("songs")
          .update({ status: "pool" })
          .eq("status", "in_box")
          .not("id", "in", `(${newCandidateIds.join(",")})`);
      }

      // PERSIST: Update status AND Box Appearance Count (now safe to set)
      for (const cand of boxCandidates) {
        const newAppearanceCount = (cand.boxAppearanceCount || 0) + 1;
        await updateSong(cand.id, {
          status: "in_box",
          boxAppearanceCount: newAppearanceCount,
        });
      }

      setVoteCounts({});
      setUserHasVoted(false);
      setRadioState("BOX_VOTING");

      const context = `The Gauntlet is set. ${boxCandidates.length} tracks enter... one gets played.`;
      addDjQueueItem("new_box_round", { context });
    } else {
      await addDjQueueItem("empty_queue_banter");
      setRadioState("DJ_TALKING");
      setTimeout(() => startNextRoundRef.current(), 5000);
    }
  }, [
    isLeader,
    boxRound,
    nowPlaying,
    selectNextCandidates,
    setNowPlaying,
    setRadioState,
    addDjQueueItem,
    setBoxRound,
    setVoteCounts,
    setUserHasVoted,
    prioritySong,
    setPrioritySong,
    updateSong,
  ]);

  // Update ref whenever the function changes so we can call it from timeouts/effects
  useEffect(() => {
    startNextRoundRef.current = startNextRound;
  }, [startNextRound]);

  /* SIMULATION REMOVED - REAL VOTING ONLY
  useEffect(() => {
    // ...
  }, [radioState, boxRound, setVoteCounts]);
  */

  // AUTO-END VOTING ROUND (Fix for Stalled Radio)
  useEffect(() => {
    if (radioState === "BOX_VOTING" && isLeader) {
      // console.log("⏳ Voting round started. Auto-closing in 45s...");
      const timer = setTimeout(() => {
        console.log("⏰ Voting time's up! Selecting winner...");
        endVotingRound();
      }, 45000); // 45 seconds voting duration
      return () => clearTimeout(timer);
    }
  }, [radioState, isLeader, endVotingRound]);

  useEffect(() => {
    if (songEndedTrigger === 0 || !nowPlaying) return;
    if (!isLeader) return;

    console.log(
      "🎵 Song ended event received (Leader logic):",
      songEndedTrigger,
    );

    const handleSongEnd = async () => {
      const endedSong = nowPlaying;

      // --- DEBUT SONG LOGIC ---
      if (endedSong.status === "debut") {
        const totalRating = liveRatings.reduce(
          (sum, rating) => sum + rating,
          0,
        );
        const finalRating =
          liveRatings.length > 0 ? totalRating / liveRatings.length : 0;

        await addDjQueueItem("debut_song_outro", {
          song: {
            title: endedSong.title,
            artistName: endedSong.artistName,
            finalRating,
          },
        });

        if (finalRating < DEBUT_RATING_SURVIVAL_THRESHOLD) {
          // Instant Graveyard
          // PERSIST: Graveyard
          updateSong(endedSong.id, { status: "graveyard", stars: finalRating });

          // Update user profile to start 24h timer
          if (profile) {
            const newProfile = {
              ...profile,
              lastDebutAt: new Date().toISOString(),
            };
            setProfile(newProfile); // Update local state
            await supabase
              .from("profiles")
              .update({ last_debut_at: newProfile.lastDebutAt })
              .eq("user_id", profile.user_id);
          }
        } else {
          // Survived! Enter the pool.
          // PERSIST: Survival
          updateSong(endedSong.id, { status: "pool", stars: finalRating });

          if (profile?.lastDebutAt) {
            // Clear the second chance timer on success
            const newProfile = { ...profile, lastDebutAt: null };
            setProfile(newProfile);
            await supabase
              .from("profiles")
              .update({ last_debut_at: null })
              .eq("user_id", profile.user_id);
          }
        }
        clearLiveRatings();
      } else {
        // --- REGULAR SONG LOGIC ---
        // Return song to pool
        // PERSIST: Return to Pool
        updateSong(endedSong.id, { status: "pool" });

        await addDjQueueItem("outro", {
          song: { title: endedSong.title, artistName: endedSong.artistName },
        });
        const rand = Math.random();
        if (rand < 0.2) {
          await addDjQueueItem("premium_cta");
        } else if (rand < 0.4) {
          await addDjQueueItem("system_explainer");
        }
      }

      // If Box was active during this song, end voting and select winner
      if (radioState === "BOX_VOTING" && boxRound) {
        console.log("📦 Song ended during Box voting - selecting winner");
        await endVotingRound();
      } else {
        // No Box was active, just start next round normally
        setTimeout(() => {
          startNextRoundRef.current();
        }, POST_SONG_DELAY_MS);
      }
    };

    handleSongEnd();
  }, [songEndedTrigger]); // Only run when the trigger increments!

  /**
   * Handles a user's vote for a specific song in The Box.
   */
  const handleUserVote = useCallback(
    async (songId: string) => {
      if (!boxRound || userHasVoted) return;

      // console.log(`🗳️ User voted for song: ${songId}`);

      // Optimistic update local state
      setVoteCounts((prev) => ({
        ...prev,
        [songId]: (prev[songId] || 0) + 1,
      }));

      setUserHasVoted(true);

      // PERSIST: Update the song's upvote count in the database
      // We find the song in the candidates to get current upvotes, then increment
      const song = boxRound.candidates.find((c) => c.id === songId);
      if (song) {
        const newUpvotes = (song.upvotes || 0) + 1;
        await updateSong(songId, { upvotes: newUpvotes });
        console.log(
          `✅ Persisted vote for "${song.title}": ${newUpvotes} upvotes`,
        );
      }
    },
    [boxRound, userHasVoted, setVoteCounts, setUserHasVoted],
  );

  /**
   * Handles the structured sequence for a "Live Roast Call".
   * Dialing -> Active -> Ended -> Cleanup.
   */
  const initiateRoastCall = useCallback(
    async (artistId: string, artistName: string) => {
      try {
        const artistProfile = await getProfile(artistId);

        // Logic: If artist is VIP and consented, trigger the call.
        if (
          artistProfile &&
          artistProfile.is_premium &&
          artistProfile.roast_consent
        ) {
          console.log("📞 Initiating Live Roast Call for", artistName);

          // 1. Dialing
          setRoastCall({
            artistName,
            phoneNumber: artistProfile.phone_number,
            status: "dialing",
          });

          // 2. Wait 2.5s for "dialing" effect
          await new Promise((r) => setTimeout(r, 2500));

          // 3. Active Call
          setRoastCall((prev) => (prev ? { ...prev, status: "active" } : null));

          // 4. Stay active for 8s (time for the DJ line to play)
          await new Promise((r) => setTimeout(r, 8000));

          // 5. End Call
          setRoastCall((prev) => (prev ? { ...prev, status: "ended" } : null));

          // 6. Brief pause then cleanup
          await new Promise((r) => setTimeout(r, 2000));
          setRoastCall(null);
        }
      } catch (err) {
        console.error("Failed to initiate roast call:", err);
        setRoastCall(null);
      }
    },
    [],
  );

  /**
   * Handles star rating updates for the currently playing song.
   * If stars drop to 0, the song is sent to the graveyard.
   */
  const handleStarVote = useCallback(
    async (newRating: number) => {
      if (!nowPlaying) return;

      console.log(`⭐ Rating updated for ${nowPlaying.title}: ${newRating}`);

      // Update local state immediately.
      setNowPlaying({ ...nowPlaying, stars: newRating }, -1);

      // Check for Graveyard condition
      if (newRating <= 0) {
        console.log("🪦 Song died! Sending to Graveyard...");

        // Trigger the "Live Roast Call" UI sequence if applicable
        initiateRoastCall(nowPlaying.uploaderId, nowPlaying.artistName);

        await addDjQueueItem("graveyard_roast", {
          song: { title: nowPlaying.title, artistName: nowPlaying.artistName },
        });

        // Update DB
        updateSong(nowPlaying.id, { stars: 0, status: "graveyard" });
      } else {
        // Just update stars
        updateSong(nowPlaying.id, { stars: newRating });
      }
    },
    [nowPlaying, setNowPlaying, addDjQueueItem, initiateRoastCall],
  );

  const isStandby = !nowPlaying && radioState !== "BOX_VOTING" && !isLoading;

  return (
    <div className="h-full flex flex-col pb-24 relative">
      <Header
        onNavigate={onNavigate}
        onToggleChat={() => setIsChatVisible(!isChatVisible)}
        isChatVisible={isChatVisible}
      />

      {isTtsErrorMuted && showTtsErrorBanner && (
        <div className="bg-red-900/50 border-y border-red-500/50 text-red-200 text-sm p-3 mx-4 sm:mx-8 mb-4 flex justify-between items-center animate-fade-in">
          <p className="pr-4">
            <strong>DJ Voice Unavailable:</strong> API quota may be reached. The
            DJ script will continue to appear in the ticker below.
          </p>
          <button
            onClick={() => setShowTtsErrorBanner(false)}
            className="p-1 rounded-full hover:bg-red-800/50 flex-shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Click to Start Overlay for Blocked Autoplay */}
      {isAutoplayBlocked && !isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <button
            onClick={() => {
              const {
                getBroadcastManager,
              } = require("../services/globalBroadcastManager");
              getBroadcastManager().play();
              setIsAutoplayBlocked(false);
            }}
            className="bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-8 rounded-full shadow-[0_0_30px_rgba(34,197,94,0.5)] transform hover:scale-105 transition-all flex items-center gap-3"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>TUNE IN NOW</span>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <Loader message="Tuning in..." />
        </div>
      ) : (
        <div className="flex-grow flex flex-col min-h-0 px-4 sm:px-8">
          {/* EMPTY MAIN SCREEN AREA - for future visualizations */}
          <div className="flex-grow relative">
            {/* Future: Add visualizations, events, etc here */}

            {/* Station Offline State */}
            {isPoolEmpty && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center animate-fade-in pointer-events-auto z-50">
                <div className="bg-black/80 p-8 rounded-xl border border-red-500/30 backdrop-blur-md">
                  <h3 className="text-3xl font-display text-red-500 mb-2">
                    STATION OFFLINE
                  </h3>
                  <p className="text-lg text-gray-400">
                    No signals detected in the Youniverse.
                  </p>
                  <p className="text-sm text-gray-500 mt-4">
                    Upload a song to jumpstart the broadcast.
                  </p>
                </div>
              </div>
            )}

            {isStandby && !isPoolEmpty && (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center animate-fade-in pointer-events-none">
                <div>
                  <h3 className="text-2xl font-display text-yellow-400">
                    Stand By
                  </h3>
                  <p className="text-lg text-gray-400">
                    {currentDj.name} is cueing up the next round...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 5 SMALL CARDS AT BOTTOM */}
          <div className="flex gap-3 mt-4 pb-3 justify-between px-4 items-end">
            {/* 1. DJ Booth - far left */}
            <div className="w-56 flex-shrink-0">
              <DjBooth profile={profile} />
            </div>

            {/* 2-4. The Box - 3 cards in the middle */}
            {boxRound && boxRound.candidates.length > 0 && (
              <TheBox
                candidates={boxRound.candidates}
                onVote={handleUserVote}
                voteCounts={voteCounts}
                userHasVoted={userHasVoted}
                isVotingActive={radioState === "BOX_VOTING"}
              />
            )}

            {/* 5. Now Playing - far right */}
            {nowPlaying && (
              <div className="w-44 flex-shrink-0 ml-auto group relative">
                <div className="bg-gray-900/80 border border-green-500/30 rounded-lg p-2 h-full flex flex-col transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                  <div className="text-[10px] text-green-400 mb-1 font-bold tracking-wider">
                    ON AIR
                  </div>
                  <div className="relative w-full aspect-square rounded overflow-hidden mb-2">
                    <img
                      src={nowPlaying.coverArtUrl}
                      alt={nowPlaying.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                      <span className="text-[8px] text-white">
                        Click for Lyrics
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-white truncate leading-tight">
                    {nowPlaying.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 truncate mb-1">
                    {nowPlaying.artistName}
                  </p>

                  <div className="mt-auto pt-1 border-t border-gray-700/50">
                    <div className="flex justify-center scale-75 origin-center">
                      <StarRating
                        rating={nowPlaying.stars}
                        onVote={handleStarVote}
                        className="gap-0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Chat - Side Panel if visible */}
          {isChatVisible && (
            <div className="fixed right-4 top-28 bottom-[400px] w-80 z-20 pointer-events-auto">
              <LiveChat onDjMention={handleDjMention} profile={profile} />
            </div>
          )}
        </div>
      )}

      {/* Live Roast Call Ceremony */}
      {roastCall && (
        <RoastCallOverlay
          artistName={roastCall.artistName}
          phoneNumber={roastCall.phoneNumber}
          status={roastCall.status}
        />
      )}
    </div>
  );
};
