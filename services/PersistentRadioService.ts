
/**
 * @file PersistentRadioService - Handles the Core Radio Cycle: Pool -> Box -> Play
 */

import { supabase } from "./supabaseClient";
import type { Song, ChatMessage } from "../types";
import { LocalAiService } from "./LocalAiService";

export class PersistentRadioService {
    private static lastCheck: number = 0;

    /**
     * Watchdog: Ensures the radio is healthy.
     */
    static async checkRadioHealth(nowPlaying: Song | null): Promise<Song | null> {
        const now = Date.now();
        if (now - this.lastCheck < 10000) return null; // Throttle to 10s
        this.lastCheck = now;
        // 1. Ensure Box is populated
        await this.populateTheBox();

        // 2. Fetch the broadcast source of truth
        const { data: broadcast } = await supabase
            .from("broadcasts")
            .select("song_started_at")
            .eq("id", "00000000-0000-0000-0000-000000000000")
            .single();

        // 3. If nothing is playing in memory or DB, kickstart
        if (!nowPlaying || !broadcast?.song_started_at) {
            console.log("🛠️ Watchdog: No song playing. Attempting kickstart...");
            return await this.cycleNextToNow();
        }

        // 4. "ZOMBIE PREVENTION": If current song should be finished by now, force transition
        if (nowPlaying.durationSec) {
            const startedAt = new Date(broadcast.song_started_at).getTime();
            const now = Date.now();
            const elapsed = (now - startedAt) / 1000;
            const margin = 30; // 30 second safety margin (accounts for clock drift or buffering pauses)

            if (elapsed > nowPlaying.durationSec + margin) {
                console.log(`🧟 Watchdog: Zombie detected! (${elapsed.toFixed(1)}s elapsed for ${nowPlaying.durationSec}s song). Force transitioning...`);
                return await this.handleSongEnded(nowPlaying);
            }
        }

        return null;
    }

    /**
     * Called by the Leader when a song ends.
     * 1. Returns current song to pool.
     * 2. Picks the winner from the box.
     * 3. Moves winner to 'now_playing'.
     * 4. Penalizes losers.
     * 5. Populates a new box.
     */
    static async handleSongEnded(currentSong: Song | null): Promise<Song | null> {
        console.log("🎬 PersistentRadioService: Handling end of song...");

        // 1. Return current song to pool (if it exists)
        if (currentSong) {
            console.log(`📡 Returning ${currentSong.title} to pool.`);
            await supabase
                .from("songs")
                .update({
                    status: "pool",
                    last_played_at: new Date().toISOString(),
                    play_count: (currentSong.playCount || 0) + 1
                })
                .eq("id", currentSong.id);
        }

        // 2. Identify the winner from 'in_box'
        const { data: boxSongs } = await supabase
            .from("songs")
            .select("*")
            .eq("status", "in_box")
            .order("upvotes", { ascending: false });

        if (boxSongs && boxSongs.length > 0) {
            const winner = boxSongs[0];
            const losers = boxSongs.slice(1);

            console.log(`🏆 Winner: ${winner.title} (${winner.upvotes} votes)`);

            // AI BANTER: Generate speech for the winner
            try {
                const banter = await LocalAiService.generateDJSpeech(winner, losers);
                console.log("🎙️ DJ Banter:", banter);

                // Broadcast banter to all clients via Supabase Realtime
                await supabase.channel('club-chat').send({
                    type: 'broadcast',
                    event: 'new_message',
                    payload: {
                        id: `dj-${Date.now()}`,
                        user: { name: "THE ARCHITECT", isAdmin: true },
                        text: banter,
                        timestamp: Date.now()
                    } as ChatMessage
                });
            } catch (e) {
                console.warn("AI Banter generation failed", e);
            }

            // Process Winner
            await supabase
                .from("songs")
                .update({
                    stars: Math.min(10, (winner.stars || 5) + 1),
                    status: "next_play", // Move to next_play so the broadcast manager can pick it up
                    upvotes: 0 // Reset votes for next time
                })
                .eq("id", winner.id);

            // Process Losers
            for (const loser of losers) {
                console.log(`💀 Loser: ${loser.title} returning to pool.`);
                await supabase
                    .from("songs")
                    .update({
                        status: "pool",
                        upvotes: 0
                    })
                    .eq("id", loser.id);
            }
        } else {
            console.log("⚠️ No songs in the box to pick from.");
        }

        // 4. Populate a new box immediately
        await this.populateTheBox();

        // 5. Return the winner so it can be played immediately
        return await this.cycleNextToNow();
    }

    /**
     * Clears current in_box songs and populates fresh ones.
     */
    static async forceRefreshBox() {
        console.log("♻️ PersistentRadioService: Force refreshing box...");
        // 1. Return current box songs to pool
        await supabase
            .from("songs")
            .update({ status: "pool", upvotes: 0 })
            .eq("status", "in_box");

        // 2. Populate fresh
        await this.populateTheBox();
    }

    /**
     * Resets the entire station to a clean pool state.
     */
    static async hardReset() {
        console.log("☢️ PersistentRadioService: HARD RESET triggered.");
        // 1. Move everything to pool
        await supabase
            .from("songs")
            .update({ status: "pool", upvotes: 0 })
            .in("status", ["now_playing", "next_play", "in_box", "review"]);

        // 2. Clear broadcast metadata
        await supabase
            .from("broadcasts")
            .update({
                current_song_id: null,
                next_song_id: null,
                radio_state: "POOL",
                song_started_at: null
            })
            .eq("id", "00000000-0000-0000-0000-000000000000");

        // 3. Populate fresh box to start cycle
        await this.populateTheBox();
    }

    /**
     * Ensures the 'in_box' status has exactly 2 songs.
     */
    static async populateTheBox() {
        const { count } = await supabase
            .from("songs")
            .select("*", { count: 'exact', head: true })
            .eq("status", "in_box");

        const needed = 2 - (count || 0);
        if (needed <= 0) return;

        console.log(`🛠️ Populating The Box: Picking ${needed} songs...`);

        // 1. Try to pick from 'pool' or 'review' first (Priority)
        let { data: candidates } = await supabase
            .from("songs")
            .select("*")
            .in("status", ["pool", "review"])
            .order('last_played_at', { ascending: true })
            .limit(needed);

        // 2. AGGRESSIVE FALLBACK: If we still need more, grab ANY song that isn't currently active
        const currentCount = candidates?.length || 0;
        if (currentCount < needed) {
            const stillNeeded = needed - currentCount;
            const { data: fallbackSongs } = await supabase
                .from("songs")
                .select("*")
                .not("status", "in", `("now_playing","next_play","in_box")`)
                .order('last_played_at', { ascending: true })
                .limit(stillNeeded);

            if (fallbackSongs) {
                candidates = [...(candidates || []), ...fallbackSongs];
            }
        }

        if (candidates && candidates.length > 0) {
            for (const song of candidates) {
                console.log(`📦 Adding ${song.title} to The Box.`);
                await supabase
                    .from("songs")
                    .update({
                        status: "in_box",
                        upvotes: 0,
                        box_appearance_count: (song.box_appearance_count || 0) + 1
                    })
                    .eq("id", song.id);
            }
        }
    }

    static async cycleNextToNow(): Promise<Song | null> {
        const { data: nextUp } = await supabase
            .from("songs")
            .select("*")
            .eq("status", "next_play")
            .limit(1);

        const nextUpSong = nextUp && nextUp.length > 0 ? nextUp[0] : null;

        if (nextUpSong) {
            console.log(`🚀 Transitioning ${nextUpSong.title} from next_play to now_playing`);
            await supabase
                .from("songs")
                .update({
                    status: "now_playing",
                    last_played_at: new Date().toISOString()
                })
                .eq("id", nextUpSong.id);

            return this.mapDbToApp({ ...nextUpSong, status: 'now_playing' });
        } else {
            console.log("🎲 No next_play. Picking random from pool...");
            // If no next_play, pick RANDOM from pool directly (failsafe)
            // We fetch a larger batch and pick one randomly locally to avoid complex PG random SQL
            const { data: poolSongs } = await supabase
                .from("songs")
                .select("*")
                .eq("status", "pool")
                .limit(20);

            if (poolSongs && poolSongs.length > 0) {
                const randomSong = poolSongs[Math.floor(Math.random() * poolSongs.length)];
                await supabase
                    .from("songs")
                    .update({
                        status: "now_playing",
                        last_played_at: new Date().toISOString()
                    })
                    .eq("id", randomSong.id);

                return this.mapDbToApp({ ...randomSong, status: 'now_playing' });
            }
        }
        return null;
    }

    /**
     * Helper to map DB song to App song structure
     */
    public static mapDbToApp(dbSong: any): Song {
        return {
            id: dbSong.id,
            uploaderId: dbSong.uploader_id,
            title: dbSong.title,
            artistName: dbSong.artist_name,
            source: dbSong.source,
            audioUrl: dbSong.audio_url,
            coverArtUrl: dbSong.cover_art_url,
            durationSec: dbSong.duration_sec,
            stars: dbSong.stars,
            boxRoundsSeen: dbSong.box_rounds_seen,
            boxRoundsLost: dbSong.box_rounds_lost,
            boxAppearanceCount: dbSong.box_appearance_count,
            status: dbSong.status,
            playCount: dbSong.play_count,
            upvotes: dbSong.upvotes,
            downvotes: dbSong.downvotes,
            lastPlayedAt: dbSong.last_played_at,
            createdAt: dbSong.created_at
        };
    }

    /**
     * Simulated Votes: Robot listeners cast votes.
     * Called periodically by the leader.
     */
    static async runSimulationStep() {
        // 1. Get songs in the box
        const { data: boxSongs } = await supabase
            .from("songs")
            .select("id, upvotes")
            .eq("status", "in_box");

        if (!boxSongs || boxSongs.length === 0) return;

        // 2. Pick a random song to vote for
        const winnerIdx = Math.floor(Math.random() * boxSongs.length);
        const targetSong = boxSongs[winnerIdx];

        // 3. Add 1-5 votes (robot weight)
        const extraVotes = Math.floor(Math.random() * 5) + 1;

        await supabase
            .from("songs")
            .update({ upvotes: (targetSong.upvotes || 0) + extraVotes })
            .eq("id", targetSong.id);
    }
}
