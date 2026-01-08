
/**
 * @file PersistentRadioService - Handles the Core Radio Cycle: Pool -> Box -> Play
 */

import { supabase } from "./supabaseClient";
import type { Song, ChatMessage } from "../types";
import { LocalAiService } from "./LocalAiService";

export class PersistentRadioService {
    /**
     * Watchdog: Ensures the radio is healthy.
     * Called periodically by the Leader.
     */
    static async checkRadioHealth(nowPlaying: Song | null): Promise<Song | null> {
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
            const margin = 10; // 10 second safety margin

            if (elapsed > nowPlaying.durationSec + margin) {
                console.log(`🧟 Watchdog: Zombie detected! (${elapsed.toFixed(1)}s elapsed for ${nowPlaying.durationSec}s song). Force transitioning...`);
                await this.handleSongEnded(nowPlaying);
                return await this.cycleNextToNow();
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
    static async handleSongEnded(currentSong: Song | null) {
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
                console.log(`💀 Loser: ${loser.title} (-1 star)`);
                const newStars = (loser.stars || 5) - 1;
                await supabase
                    .from("songs")
                    .update({
                        stars: Math.max(0, newStars),
                        status: newStars <= 0 ? "graveyard" : "pool",
                        upvotes: 0
                    })
                    .eq("id", loser.id);
            }
        } else {
            console.log("⚠️ No songs in the box to pick from.");
        }

        // 4. Populate a new box immediately
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

        console.log(`🛠️ Populating The Box: Picking ${needed} songs from pool...`);

        // Pick random songs from pool (weighted by stars maybe later, for now just random)
        const { data: poolSongs } = await supabase
            .from("songs")
            .select("*")
            .eq("status", "pool")
            .limit(needed);

        if (poolSongs) {
            for (const song of poolSongs) {
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

    /**
     * Logic to transition NextPlay -> NowPlaying
     * @returns The newly playing song if one was transitioned.
     */
    static async cycleNextToNow(): Promise<Song | null> {
        // 1. Check if something is 'now_playing'
        const { data: currentNow } = await supabase
            .from("songs")
            .select("*")
            .eq("status", "now_playing")
            .limit(1);

        if (currentNow && currentNow.length > 0) {
            // Something is already playing. We return it to sync state just in case.
            return this.mapDbToApp(currentNow[0]);
        }

        // 2. Check if something is 'next_play'
        const { data: nextUp } = await supabase
            .from("songs")
            .select("*")
            .eq("status", "next_play")
            .limit(1)
            .single();

        if (nextUp) {
            console.log(`🚀 Transitioning ${nextUp.title} from next_play to now_playing`);
            await supabase
                .from("songs")
                .update({
                    status: "now_playing",
                    last_played_at: new Date().toISOString()
                })
                .eq("id", nextUp.id);

            return this.mapDbToApp({ ...nextUp, status: 'now_playing' });
        } else {
            // If no next_play, pick from pool directly (failsafe)
            const { data: poolSongs } = await supabase
                .from("songs")
                .select("*")
                .eq("status", "pool")
                .limit(1);

            if (poolSongs && poolSongs.length > 0) {
                await supabase
                    .from("songs")
                    .update({
                        status: "now_playing",
                        last_played_at: new Date().toISOString()
                    })
                    .eq("id", poolSongs[0].id);

                return this.mapDbToApp({ ...poolSongs[0], status: 'now_playing' });
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
