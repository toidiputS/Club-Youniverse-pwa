/**
 * @file This is the main component for the live radio experience.
 * It orchestrates the entire radio simulation, including managing the state machine
 * (DJ banter, voting, now playing), handling timers for events, fetching AI-generated content
 * (DJ scripts, news), and updating the global radio context.
 */

import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { updateSong } from '../services/supabaseSongService';
import type { View, Song, Profile } from '../types';
import { RadioContext } from '../contexts/AudioPlayerContext';
import { getCurrentDj } from '../logic/djRoster';
import { LiveChat } from './LiveChat';
import { Loader } from './Loader';
import { Header } from './Header';
import { DjBooth } from './DjBooth';
import { TheBox } from './TheBox';
import { StarRating } from './StarRating';


interface RadioProps {
    onNavigate: (view: View) => void;
    songs: Song[];
    profile: Profile | null;
    setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}

// Constants for the radio simulation timing.
const POST_SONG_DELAY_MS = 5 * 1000;
const DJ_SHIFT_CHECK_INTERVAL_MS = 60 * 1000; // Check for a shift change every minute
const DEBUT_RATING_SURVIVAL_THRESHOLD = 5;


export const Radio: React.FC<RadioProps> = ({ onNavigate, songs, profile, setProfile }) => {
    // Access global radio state from the context.
    const {
        radioState, setRadioState,
        boxRound, setBoxRound,
        setNowPlaying, nowPlaying,
        prioritySong, setPrioritySong,
        addDjQueueItem,
        voteCounts, setVoteCounts,
        isTtsErrorMuted,
        currentDj, setCurrentDj,
        liveRatings, clearLiveRatings,
        boxUpdateTrigger, seekTo,
        songEndedTrigger
    } = useContext(RadioContext);

    // Local state for managing the radio simulation.
    const [isLoading, setIsLoading] = useState(true);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [showTtsErrorBanner, setShowTtsErrorBanner] = useState(true);
    // The pool of available songs, synced with props from App.tsx.
    const [songPool, setSongPool] = useState<Song[]>(songs);
    const [userHasVoted, setUserHasVoted] = useState(false);
    const prevSongsRef = useRef<Song[]>([]);
    const lastDjRef = useRef<string>(currentDj.name);
    // Ref to track song pool length to start the radio from an empty state.


    // Effect to check for DJ shift changes periodically.
    useEffect(() => {
        const shiftCheckInterval = setInterval(() => {
            const newDj = getCurrentDj();
            // If the DJ has changed since the last check, update the state.
            if (newDj.name !== lastDjRef.current) {
                console.log(`DJ Shift Change: ${lastDjRef.current} -> ${newDj.name}`);
                // Announce the shift change on air.
                addDjQueueItem('dj_shift_change', { context: { oldDj: lastDjRef.current, newDj: newDj.name } });
                setCurrentDj(newDj);
                lastDjRef.current = newDj.name;
            }
        }, DJ_SHIFT_CHECK_INTERVAL_MS);

        return () => clearInterval(shiftCheckInterval);
    }, [setCurrentDj, addDjQueueItem]);


    // Effect to sync the internal song pool with the main song library from props.
    useEffect(() => {
        setSongPool(songs);
    }, [songs]);

    // Effect to restore the broadcast state from the database on initial load.
    // This ensures all users tune in to the same song at the same time.


    // Effect to detect a new song submission and check if it qualifies for a priority debut.
    useEffect(() => {
        if (songs.length > prevSongsRef.current.length) {
            const newSong = songs[songs.length - 1];
            if (newSong && profile) {
                const userSongCount = songs.filter(s => s.uploaderId === profile.user_id).length;
                let isPriority = userSongCount === 1;

                if (!isPriority && profile.lastDebutAt) {
                    const lastDebutTime = new Date(profile.lastDebutAt).getTime();
                    const hoursSince = (Date.now() - lastDebutTime) / (1000 * 60 * 60);
                    if (hoursSince <= 24) {
                        isPriority = true; // It's their second chance
                    }
                }

                if (isPriority) {
                    console.log(`New Artist Debut: "${newSong.title}" by ${profile.name} is being prioritized.`);
                    setPrioritySong({ ...newSong, status: 'debut' });
                }
            }
        }
        prevSongsRef.current = songs;
    }, [songs, profile, setPrioritySong]);


    // When TTS gets muted by an error, make sure the banner is available to be shown.
    useEffect(() => {
        if (isTtsErrorMuted) {
            setShowTtsErrorBanner(true);
        }
    }, [isTtsErrorMuted]);

    /**
     * Handles a direct message to the DJ from the chat.
     */
    const handleDjMention = useCallback(async (messageText: string) => {
        const strippedMessage = messageText.replace(/^@clubdj\s*/i, '').trim();
        if (strippedMessage) {
            await addDjQueueItem('user_mention', {
                context: {
                    userName: profile?.name || 'A Listener',
                    message: strippedMessage
                }
            });
        }
    }, [addDjQueueItem, profile?.name]);

    /**
     * Selects up to three candidate songs for the next round from the song pool.
     */
    /**
     * Selects candidate songs for the next round from the song pool.
     */
    /**
     * Selects candidate songs for the next round from the song pool.
     * Ensures we always return the requested count, even if we have to recycle songs (for small pools).
     */
    const selectNextCandidates = useCallback((currentPool: Song[], count: number = 3): Song[] => {
        let availableSongs = currentPool.filter(s => s.status === 'pool' && s.id !== nowPlaying?.id);

        // If we don't have enough unique songs, include 'graveyard' or even 'in_box' songs to fill the spots.
        // This is critical for small pools (like the backup pool).
        if (availableSongs.length < count) {
            const otherSongs = currentPool.filter(s => s.id !== nowPlaying?.id && !availableSongs.includes(s));
            availableSongs = [...availableSongs, ...otherSongs];
        }

        // If we STILL don't have enough, duplicate them.
        while (availableSongs.length < count && availableSongs.length > 0) {
            availableSongs = [...availableSongs, ...availableSongs];
        }

        availableSongs.sort(() => 0.5 - Math.random()); // Simple random shuffle.
        return availableSongs.slice(0, count);
    }, [nowPlaying?.id]);

    const lastRoundStartRef = useRef(0);

    /**
     * Starts the next round of voting by selecting candidates and setting up the state.
     * Called when a song ends or when manually triggered.
     */
    const startNextRound = useCallback(async () => {
        // Debounce: Prevent starting a new round too quickly (e.g. < 2 seconds)
        if (Date.now() - lastRoundStartRef.current < 2000) {
            console.warn("⏳ startNextRound debounced.");
            return;
        }
        lastRoundStartRef.current = Date.now();

        console.log('🔄 startNextRound called', {
            nowPlaying: nowPlaying?.title,
            songPoolLength: songPool.length,
            prioritySong: prioritySong?.title,
            radioState
        });

        // Priority song handling (e.g., debut song gets immediate play)
        if (prioritySong) {
            console.log('🎯 Priority song detected:', prioritySong.title);
            setNowPlaying(prioritySong);
            setRadioState('NOW_PLAYING');
            setSongPool(pool => pool.map(s => s.id === prioritySong.id ? { ...s, status: 'debut' } : s));
            updateSong(prioritySong.id, { status: 'debut' });
            await addDjQueueItem('new_artist_shoutout', { song: { title: prioritySong.title, artistName: prioritySong.artistName } });
            setPrioritySong(null); // Clear the queue after use.
            return;
        }

        // Before selecting new candidates, penalize the losers from the last round.
        if (boxRound) {
            const unchosen = boxRound.candidates.filter(c => c.id !== nowPlaying?.id);
            setSongPool(currentPool => currentPool.map(song => {
                const unchosenSong = unchosen.find(u => u.id === song.id);
                if (unchosenSong) {
                    // Immediate -1 star penalty for losers
                    const newStars = Math.max(0, song.stars - 1);
                    // PERSIST: Update DB
                    updateSong(song.id, { stars: newStars, status: 'pool' });
                    return { ...song, status: 'pool', stars: newStars };
                }
                return song;
            }));
        }

        // Determine how many songs we need.
        // If nothing is playing, we need 1 for Now Playing + 3 for The Box = 4.
        // If something is playing, we just need 3 for The Box.
        const songsNeeded = nowPlaying ? 3 : 4;
        const candidates = selectNextCandidates(songPool, songsNeeded);

        console.log(`🎵 Selecting candidates. Needed: ${songsNeeded}, Found: ${candidates.length}`);

        // Case 0: No songs available at all
        if (candidates.length === 0) {
            console.warn("⚠️ No candidates found! Pool size:", songPool.length);

            // If the pool is not empty but we found no candidates, it means all songs are 'graveyard' or stuck.
            // We should try to find ANY song to play to avoid silence.
            const graveyardSongs = songPool.filter(s => s.status === 'graveyard');
            if (graveyardSongs.length > 0) {
                console.log("👻 Only graveyard songs found. Resurrecting one for the show...");
                const zombie = graveyardSongs[Math.floor(Math.random() * graveyardSongs.length)];
                setNowPlaying(zombie);
                setRadioState('NOW_PLAYING');
                updateSong(zombie.id, { status: 'now_playing', stars: 5 }); // Give it a second chance?
                return;
            }

            await addDjQueueItem('empty_queue_banter');
            setRadioState('DJ_TALKING');
            // Try again in 5 seconds
            setTimeout(startNextRound, 5000);
            return;
        }


        let nextNowPlaying = nowPlaying;
        let boxCandidates: Song[] = [];

        if (!nowPlaying) {
            // We need to pick a song to play immediately.
            nextNowPlaying = candidates[0];
            // Force max 3 candidates for The Box
            boxCandidates = candidates.slice(1, 4);

            console.log('🎵 No song playing - starting first candidate:', nextNowPlaying.title);
            setNowPlaying(nextNowPlaying);
            setRadioState('NOW_PLAYING');

            // Update the playing song in pool
            setSongPool(pool => pool.map(s => s.id === nextNowPlaying!.id ? { ...s, status: 'now_playing' } : s));
            updateSong(nextNowPlaying.id, { status: 'now_playing', lastPlayedAt: new Date().toISOString() });
        } else {
            // Force max 3 candidates for The Box
            boxCandidates = candidates.slice(0, 3);
        }

        // Ensure we have exactly 3 candidates for The Box if possible, or at least some.
        if (boxCandidates.length > 0) {
            setBoxRound({ id: `round-${Date.now()}`, candidates: boxCandidates, startedAt: new Date().toISOString() });
            setSongPool(pool => pool.map(s => boxCandidates.some(c => c.id === s.id) ? { ...s, status: 'in_box' } : s));
            setVoteCounts({});
            setUserHasVoted(false);
            setRadioState('BOX_VOTING');

            // Only announce if we actually have a full box or it's a new round
            const context = `The Gauntlet is set. ${boxCandidates.length} tracks enter... one gets played.`;
            addDjQueueItem('new_box_round', { context }); // Don't await
        } else {
            // Not enough songs for a box round?
            setBoxRound(null);
            // Maybe just play music if we have a nowPlaying, otherwise silence.
        }

    }, [songPool, prioritySong, selectNextCandidates, addDjQueueItem, setNowPlaying, setRadioState, setBoxRound, setVoteCounts, setPrioritySong, boxRound, nowPlaying]);

    // Effect to restore the broadcast state from the database on initial load.
    // This ensures all users tune in to the same song at the same time.
    useEffect(() => {
        console.log("📻 Radio: Init Effect running", { isLoading, poolSize: songPool.length });

        // EMERGENCY FALLBACK: If DB is empty/blocked AND we're not currently loading, use hardcoded songs.
        // Important: Only use backup if !isLoading to avoid race condition with Supabase fetch.
        if (songPool.length === 0 && !isLoading) {
            console.warn("⚠️ Radio: Song pool is empty after load complete. Engaging EMERGENCY BACKUP PROTOCOL.");

            const backupSongs: Song[] = [
                {
                    id: 'backup-1',
                    title: 'System Offline (Backup)',
                    artistName: 'Emergency Broadcast',
                    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                    coverArtUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
                    durationSec: 372,
                    uploaderId: 'system',
                    status: 'pool',
                    stars: 5,
                    createdAt: new Date().toISOString(),
                    playCount: 0,
                    upvotes: 0,
                    downvotes: 0,
                    boxAppearanceCount: 0,
                    boxRoundsLost: 0,
                    boxRoundsSeen: 0,
                    source: 'upload',
                    lastPlayedAt: new Date().toISOString()
                },
                {
                    id: 'backup-2',
                    title: 'Connection Lost (Backup)',
                    artistName: 'The Glitch',
                    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                    coverArtUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
                    durationSec: 425,
                    uploaderId: 'system',
                    status: 'pool',
                    stars: 5,
                    createdAt: new Date().toISOString(),
                    playCount: 0,
                    upvotes: 0,
                    downvotes: 0,
                    boxAppearanceCount: 0,
                    boxRoundsLost: 0,
                    boxRoundsSeen: 0,
                    source: 'upload',
                    lastPlayedAt: new Date().toISOString()
                },
                {
                    id: 'backup-3',
                    title: 'Rebooting... (Backup)',
                    artistName: 'System Admin',
                    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
                    coverArtUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
                    durationSec: 340,
                    uploaderId: 'system',
                    status: 'pool',
                    stars: 5,
                    createdAt: new Date().toISOString(),
                    playCount: 0,
                    upvotes: 0,
                    downvotes: 0,
                    boxAppearanceCount: 0,
                    boxRoundsLost: 0,
                    boxRoundsSeen: 0,
                    source: 'upload',
                    lastPlayedAt: new Date().toISOString()
                }
            ];

            setSongPool(backupSongs);
            setIsLoading(false);
            // We'll let the next render cycle pick these up and startNextRound
            return;
        }

        // Once we have songs, we proceed to check broadcast state.
        if (isLoading) {
            console.log("📻 Radio: Tuning in to broadcast... Pool size:", songPool.length);

            // 1. Find the currently playing song in the DB (which is now in songPool)
            const currentBroadcast = songPool.find(s => s.status === 'now_playing');

            if (currentBroadcast && currentBroadcast.lastPlayedAt) {
                const lastPlayed = new Date(currentBroadcast.lastPlayedAt).getTime();
                const now = Date.now();
                const elapsedSec = (now - lastPlayed) / 1000;

                console.log(`Found broadcast: "${currentBroadcast.title}" (Elapsed: ${elapsedSec.toFixed(1)}s / Duration: ${currentBroadcast.durationSec}s)`);

                if (elapsedSec < currentBroadcast.durationSec) {
                    // Song is still valid! Join the broadcast.
                    // Pass the elapsed time directly to start immediately at the right spot
                    setNowPlaying(currentBroadcast, elapsedSec);
                    setRadioState('NOW_PLAYING');

                    // Restore The Box state
                    const boxCandidates = songPool.filter(s => s.status === 'in_box');
                    if (boxCandidates.length > 0) {
                        setBoxRound({
                            id: `round-${lastPlayed}`,
                            candidates: boxCandidates,
                            startedAt: currentBroadcast.lastPlayedAt
                        });
                        setRadioState('BOX_VOTING');
                        setUserHasVoted(false);
                    }

                    setIsLoading(false);
                    return;
                } else {
                    console.log(`⚠️ Broadcast expired. Elapsed: ${elapsedSec.toFixed(1)}s > Duration: ${currentBroadcast.durationSec}s`);
                }
            } else {
                console.log("ℹ️ No active broadcast found in DB.");
            }

            // If we reach here, there is no valid broadcast (either none found or expired).
            // We must CLEAN UP any "zombie" states (songs stuck in 'now_playing' or 'in_box')
            // so they become available for the new round.

            console.log("🧹 Cleaning up zombie states and starting fresh...");

            const zombies = songPool.filter(s => s.status === 'now_playing' || s.status === 'in_box');

            if (zombies.length > 0) {
                console.log(`Found ${zombies.length} zombies. Resetting to pool.`);

                // 1. Update local state immediately so startNextRound sees them
                const cleanPool = songPool.map(s =>
                    (s.status === 'now_playing' || s.status === 'in_box')
                        ? { ...s, status: 'pool' } as Song
                        : s
                );
                setSongPool(cleanPool);

                // 2. Persist cleanup to DB
                zombies.forEach(z => {
                    updateSong(z.id, { status: 'pool' });
                });

                // 3. Start next round with the CLEAN pool
                // We need to pass the clean pool explicitly or wait for state update?
                // startNextRound uses 'songPool' from closure. 
                // We can't rely on the state update being visible immediately in this closure.
                // So we'll call a helper or pass the pool to startNextRound?
                // startNextRound doesn't take args.
                // But we can trigger it via a timeout or just rely on the effect that watches songPool?
                // No, the effect watches songPool length or other things.

                // Let's just update the state and let the "kick-start" effect handle it?
                // The kick-start effect watches: [songPool, nowPlaying, radioState, isLoading, startNextRound]
                // If we set isLoading(false) here, and update songPool...

                setIsLoading(false);
                // The new "Auto-Start" effect will detect the updated songPool and trigger startNextRound automatically.

            } else {
                // No zombies, just start.
                setIsLoading(false);
                // For the empty case, we still call it manually to trigger the "Empty Pool" banter.
                startNextRound();
            }
        }
    }, [isLoading, songPool, startNextRound, seekTo, setNowPlaying, setRadioState, setBoxRound]);

    // Effect to handle external triggers for new box rounds (e.g. from DJ Booth)
    useEffect(() => {
        if (boxUpdateTrigger > 0) {
            console.log("⚡ Box update triggered externally");
            startNextRound();
        }
    }, [boxUpdateTrigger, startNextRound]);



    // Effect to kick-start the radio when valid songs are available and the radio is idle.
    useEffect(() => {
        const availableSongs = songPool.filter(s => s.status === 'pool');
        const hasAvailableSongs = availableSongs.length > 0;
        // We are "idle" if nothing is playing, we aren't voting, and we aren't loading.
        // We also check if we have a "now_playing" song in the pool that just isn't set in state yet (which shouldn't happen due to restoreBroadcastState, but good for safety).
        const isIdle = !nowPlaying && radioState !== 'BOX_VOTING' && !isLoading;

        // If we are idle and have songs to play, START THE ENGINE.
        if (isIdle && hasAvailableSongs) {
            console.log("🚀 Radio is idle with available songs. Auto-starting next round.");
            startNextRound();
        }
    }, [songPool, nowPlaying, radioState, isLoading, startNextRound]);


    /**
     * Ends the current voting round, determines the winner, updates song stats,
     * and sets up the next round.
     */
    const endVotingRound = useCallback(async () => {
        console.log('🏁 endVotingRound called!', { boxRound, radioState, voteCounts });
        if (!boxRound || radioState !== 'BOX_VOTING') {
            console.log('⚠️ Early return - no box round or wrong state');
            return;
        }

        // Determine the winner based on vote counts.
        const winner = [...boxRound.candidates].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0))[0];
        console.log('🏆 Winner selected:', winner.title, 'with', voteCounts[winner.id] || 0, 'votes');

        await addDjQueueItem('winner_announcement', { song: { title: winner.title, artistName: winner.artistName } });

        console.log('▶️ Setting now playing:', winner.title);
        setNowPlaying(winner);
        setRadioState('NOW_PLAYING');

        // Update the song pool with new stats for the winner.
        setSongPool(currentPool => currentPool.map((song): Song => {
            if (song.id === winner.id) {
                const newStars = Math.min(10, song.stars + 1);
                const newPlayCount = song.playCount + 1;
                // PERSIST: Update DB
                updateSong(song.id, {
                    stars: newStars,
                    status: 'now_playing',
                    playCount: newPlayCount,
                    lastPlayedAt: new Date().toISOString()
                });
                return { ...song, stars: newStars, status: 'now_playing', playCount: newPlayCount };
            }
            return song;
        }));

        setVoteCounts({});

    }, [boxRound, voteCounts, addDjQueueItem, setNowPlaying, setRadioState, setVoteCounts, radioState]);



    // Effect for simulating listener votes during song playback
    useEffect(() => {
        if (radioState !== 'BOX_VOTING' || !boxRound) return;

        // Simulated votes happen continuously while Box is active
        const voteInterval = setInterval(() => {
            const candidateIds = boxRound.candidates.map(c => c.id);
            if (candidateIds.length > 0) {
                const randomCandidateId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
                setVoteCounts(counts => ({
                    ...counts,
                    [randomCandidateId]: (counts[randomCandidateId] || 0) + Math.floor(Math.random() * 5) + 1,
                }));
            }
        }, 800);

        return () => {
            clearInterval(voteInterval);
        };
    }, [radioState, boxRound, setVoteCounts]);

    // Effect for handling the end of a song and transitioning to the next round.
    // Replaces the unreliable setTimeout with a robust event trigger from the AudioContext.
    useEffect(() => {
        if (songEndedTrigger === 0 || !nowPlaying) return;

        console.log("🎵 Song ended event received via trigger:", songEndedTrigger);

        const handleSongEnd = async () => {
            const endedSong = nowPlaying;

            // --- DEBUT SONG LOGIC ---
            if (endedSong.status === 'debut') {
                const totalRating = liveRatings.reduce((sum, rating) => sum + rating, 0);
                const finalRating = liveRatings.length > 0 ? totalRating / liveRatings.length : 0;

                await addDjQueueItem('debut_song_outro', { song: { title: endedSong.title, artistName: endedSong.artistName, finalRating } });

                if (finalRating < DEBUT_RATING_SURVIVAL_THRESHOLD) {
                    // Instant Graveyard
                    setSongPool(pool => pool.map(s => s.id === endedSong.id ? { ...s, status: 'graveyard', stars: finalRating } : s));
                    // PERSIST: Graveyard
                    updateSong(endedSong.id, { status: 'graveyard', stars: finalRating });

                    // Update user profile to start 24h timer
                    if (profile) {
                        const newProfile = { ...profile, lastDebutAt: new Date().toISOString() };
                        setProfile(newProfile); // Update local state
                        await supabase.from('profiles').update({ last_debut_at: newProfile.lastDebutAt }).eq('user_id', profile.user_id);
                    }
                } else {
                    // Survived! Enter the pool.
                    setSongPool(pool => pool.map(s => s.id === endedSong.id ? { ...s, status: 'pool', stars: finalRating } : s));
                    // PERSIST: Survival
                    updateSong(endedSong.id, { status: 'pool', stars: finalRating });

                    if (profile?.lastDebutAt) { // Clear the second chance timer on success
                        const newProfile = { ...profile, lastDebutAt: null };
                        setProfile(newProfile);
                        await supabase.from('profiles').update({ last_debut_at: null }).eq('user_id', profile.user_id);
                    }
                }
                clearLiveRatings();

            } else {
                // --- REGULAR SONG LOGIC ---
                // Return song to pool
                setSongPool(pool => pool.map((s): Song => s.id === endedSong.id ? { ...s, status: 'pool' } : s));
                // PERSIST: Return to Pool
                updateSong(endedSong.id, { status: 'pool' });

                await addDjQueueItem('outro', { song: { title: endedSong.title, artistName: endedSong.artistName } });
                if (Math.random() < 0.3) {
                    await addDjQueueItem('premium_cta');
                }
            }

            // If Box was active during this song, end voting and select winner
            if (radioState === 'BOX_VOTING' && boxRound) {
                console.log('📦 Song ended during Box voting - selecting winner');
                await endVotingRound();
            } else {
                // No Box was active, just start next round normally
                setTimeout(() => {
                    startNextRound();
                }, POST_SONG_DELAY_MS);
            }
        };

        handleSongEnd();

    }, [songEndedTrigger]); // Only run when the trigger increments!

    /**
     * Handles a user's vote for a specific song in The Box.
     */
    const handleUserVote = useCallback((songId: string) => {
        if (!boxRound || userHasVoted) return;

        // Optimistic update
        setVoteCounts(prev => ({
            ...prev,
            [songId]: (prev[songId] || 0) + 1
        }));

        setUserHasVoted(true);

        // In a real app, we would send this to the backend.
        // For now, we just track it locally for the session.
        console.log(`🗳️ Voted for song: ${songId}`);
    }, [boxRound, userHasVoted, setVoteCounts, setUserHasVoted]);

    /**
     * Handles star rating updates for the currently playing song.
     * If stars drop to 0, the song is sent to the graveyard.
     */
    const handleStarVote = useCallback(async (newRating: number) => {
        if (!nowPlaying) return;

        console.log(`⭐ Rating updated for ${nowPlaying.title}: ${newRating}`);

        // Update local state immediately
        // CRITICAL FIX: Pass the current audio time to prevent restarting the song!
        // We can't easily get the exact time from here without context ref, 
        // BUT we can update the song object in the pool without calling setNowPlaying if it's just a metadata update.
        // Actually, setNowPlaying triggers the audio effect which resets src.
        // We should probably separate "Playback State" from "Song Metadata State" in the context,
        // OR make the audio effect smart enough not to reset if ID hasn't changed.

        // For now, let's just update the pool. The NowPlaying component reads from 'nowPlaying' context.
        // If we don't update 'nowPlaying' context, the UI won't update.
        // Let's try to update the context but tell it NOT to reset audio.
        // We can do this by checking ID in the AudioContext effect.

        // TEMPORARY FIX: Just update the pool and let the UI lag slightly? 
        // No, UI needs to show the new stars.

        // Better Fix: Update AudioPlayerContext to check if song ID changed before resetting audio.
        setNowPlaying({ ...nowPlaying, stars: newRating }, -1); // -1 signal to NOT reset audio?
        setSongPool(pool => pool.map(s => s.id === nowPlaying.id ? { ...s, stars: newRating } : s));

        // Check for Graveyard condition
        if (newRating <= 0) {
            console.log("🪦 Song died! Sending to Graveyard...");
            await addDjQueueItem('filler', { context: `RIP ${nowPlaying.title}. The people have spoken.` });

            // Update DB
            updateSong(nowPlaying.id, { stars: 0, status: 'graveyard' });
        } else {
            // Just update stars
            updateSong(nowPlaying.id, { stars: newRating });
        }
    }, [nowPlaying, setNowPlaying, setSongPool, addDjQueueItem]);

    const isStandby = !nowPlaying && radioState !== 'BOX_VOTING' && !isLoading;

    return (
        <div className="h-full flex flex-col pb-24 relative">
            <Header onNavigate={onNavigate} onToggleChat={() => setIsChatVisible(!isChatVisible)} isChatVisible={isChatVisible} />

            {isTtsErrorMuted && showTtsErrorBanner && (
                <div className="bg-red-900/50 border-y border-red-500/50 text-red-200 text-sm p-3 mx-4 sm:mx-8 mb-4 flex justify-between items-center animate-fade-in">
                    <p className="pr-4">
                        <strong>DJ Voice Unavailable:</strong> API quota may be reached. The DJ script will continue to appear in the ticker below.
                    </p>
                    <button onClick={() => setShowTtsErrorBanner(false)} className="p-1 rounded-full hover:bg-red-800/50 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
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
                        {isStandby && (
                            <div className="absolute inset-0 flex items-center justify-center p-4 text-center animate-fade-in pointer-events-none">
                                <div>
                                    <h3 className="text-2xl font-display text-yellow-400">Stand By</h3>
                                    <p className="text-lg text-gray-400">{currentDj.name} is cueing up the next round...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 5 SMALL CARDS AT BOTTOM */}
                    <div className="flex gap-4 mt-8 pb-4 justify-between px-12">
                        {/* 1. DJ Booth - far left */}
                        <div className="w-32 flex-shrink-0">
                            <DjBooth profile={profile} />
                        </div>

                        {/* 2-4. The Box - 3 cards in the middle */}
                        {boxRound && boxRound.candidates.length > 0 && (
                            <>
                                {/* 4. The Box - center */}
                                {boxRound && (
                                    <TheBox
                                        candidates={boxRound.candidates}
                                        onVote={handleUserVote}
                                        voteCounts={voteCounts}
                                        userHasVoted={userHasVoted}
                                        isVotingActive={radioState === 'BOX_VOTING'}
                                    />
                                )}

                                {/* 5. Now Playing - far right */}
                                {nowPlaying && (
                                    <div className="w-32 flex-shrink-0 ml-auto group relative">
                                        <div className="bg-gray-900/80 border border-green-500/30 rounded-lg p-2 h-full flex flex-col transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                            <div className="text-[10px] text-green-400 mb-1 font-bold tracking-wider">ON AIR</div>
                                            <div className="relative w-full aspect-square rounded overflow-hidden mb-2">
                                                <img src={nowPlaying.coverArtUrl} alt={nowPlaying.title} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                                                    <span className="text-[8px] text-white">Click for Lyrics</span>
                                                </div>
                                            </div>

                                            <h4 className="text-xs font-bold text-white truncate leading-tight">{nowPlaying.title}</h4>
                                            <p className="text-[10px] text-gray-400 truncate mb-1">{nowPlaying.artistName}</p>

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
                            </>
                        )}

                    </div> {/* Closes "5 SMALL CARDS AT BOTTOM" */}

                    {/* Live Chat - Side Panel if visible */}
                    {isChatVisible && (
                        <div className="fixed right-4 top-28 bottom-[400px] w-80 z-20 pointer-events-auto">
                            <LiveChat onDjMention={handleDjMention} profile={profile} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};