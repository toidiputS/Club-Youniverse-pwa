/**
 * @file This component displays the "Song Library," a list of all songs the user has submitted.
 * It provides a central place for users to see the status and stats of their tracks.
 */

import React from 'react';
import type { Song, View } from '../types';
import { SectionCard } from './SectionCard';
import { StarRating } from './StarRating';

interface SongLibraryProps {
    songs: Song[];
    onBackToStudio: () => void;
    onNavigate: (view: View) => void;
}

/**
 * A map to provide more user-friendly labels for song statuses.
 */
const statusLabels: Record<Song['status'], string> = {
    pool: 'In the Pool',
    in_box: 'In The Box',
    now_playing: 'Now Playing',
    graveyard: 'In the Graveyard',
    // FIX: Add missing 'debut' property to satisfy the Record type.
    debut: 'On Debut',
};

/**
 * A map to associate a color with each song status for visual indication.
 */
const statusColors: Record<Song['status'], string> = {
    pool: 'bg-blue-500/20 text-blue-300',
    in_box: 'bg-yellow-500/20 text-yellow-300',
    now_playing: 'bg-green-500/20 text-green-300 animate-pulse',
    graveyard: 'bg-gray-500/20 text-gray-400',
    // FIX: Add missing 'debut' property to satisfy the Record type.
    debut: 'bg-red-500/20 text-red-300 animate-pulse',
};

export const SongLibrary: React.FC<SongLibraryProps> = ({ songs, onBackToStudio, onNavigate }) => {

    /**
     * Renders the main content: either the list of songs or an empty state message.
     */
    const renderContent = () => {
        if (songs.length === 0) {
            return (
                <SectionCard>
                    <div className="p-16 text-center">
                        <h2 className="text-2xl font-bold font-display text-[var(--text-secondary)]">Your Song Library is Empty.</h2>
                        <p className="mt-2 text-[var(--text-secondary)] mb-6">Upload your first track to see it here and get it in rotation!</p>
                        <button
                            onClick={() => onNavigate('song-submission')}
                            className="bg-[var(--accent-secondary)] text-white font-bold py-3 px-8 rounded-lg hover:bg-[var(--accent-primary)] transition-colors"
                        >
                            Submit Your First Song
                        </button>
                    </div>
                </SectionCard>
            )
        }
        return (
            <div className="space-y-4">
                {songs.map((song) => (
                    <div key={song.id} className="group">
                        <SectionCard className="p-4 transition-all duration-500 group-hover:shadow-[0_0_20px_var(--accent-primary)] group-hover:border-[var(--accent-primary)] group-hover:scale-[1.01]">
                            <div className="flex items-center gap-4 flex-wrap">
                                <img
                                    src={song.coverArtUrl}
                                    alt={`${song.title} cover art`}
                                    className="w-20 h-20 rounded-md object-cover bg-black/30"
                                />
                                {/* Song title and artist */}
                                <div className="flex-grow min-w-[200px]">
                                    <h3 className="text-xl font-bold text-[var(--text-primary)] truncate">{song.title}</h3>
                                    <p className="text-md text-[var(--text-secondary)]">{song.artistName}</p>
                                </div>
                                {/* Star rating */}
                                <div className="flex-shrink-0">
                                    <StarRating rating={song.stars} />
                                </div>
                                {/* Play count */}
                                <div className="text-right w-24 flex-shrink-0">
                                    <div className="font-bold text-lg text-[var(--text-primary)]">
                                        {song.playCount.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)]">
                                        Plays
                                    </div>
                                </div>
                                {/* Status badge */}
                                <div className="flex-shrink-0">
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[song.status]}`}>
                                        {statusLabels[song.status]}
                                    </span>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-start mb-4">
                <div className="text-left">
                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display">
                        Song Library
                    </h1>
                    <p className="mt-2 text-[var(--text-secondary)]">All of your submitted tracks, in one place.</p>
                </div>
                <button
                    onClick={onBackToStudio}
                    className="text-sm bg-[var(--accent-secondary)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-primary)] transition-colors"
                >
                    &larr; Back to Studio
                </button>
            </header>

            <div className="flex justify-end mb-4 gap-2">
                <button
                    onClick={async () => {
                        const { supabase } = await import('../services/supabaseClient');
                        const { getAllSongs, getUserSongs } = await import('../services/supabaseSongService');

                        try {
                            const user = (await supabase.auth.getUser()).data.user;
                            if (!user) {
                                alert("❌ You are not logged in.");
                                return;
                            }

                            // 1. Check Global Pool
                            const { data: globalData, error: globalError } = await supabase.from('songs').select('count', { count: 'exact', head: true });

                            // 2. Check User Songs
                            const userSongs = await getUserSongs(user.id);

                            let msg = `📊 DIAGNOSTICS:\n\n`;
                            msg += `User ID: ${user.id.slice(0, 8)}...\n`;
                            msg += `Global DB Row Count: ${globalData?.length ?? 'N/A'}\n`; // This might be wrong if using head:true, checking count instead

                            // Re-do count query correctly
                            const countQuery = await supabase.from('songs').select('*', { count: 'exact', head: true });
                            msg += `Total Rows in DB: ${countQuery.count}\n`;

                            if (countQuery.error) {
                                msg += `❌ DB Error: ${countQuery.error.message}\n`;
                                msg += `(This usually means RLS policies are blocking access)\n`;
                            }

                            msg += `Your Visible Songs: ${userSongs.length}\n`;

                            alert(msg);
                            window.location.reload();

                        } catch (e: any) {
                            alert(`❌ CRITICAL ERROR: ${e.message}`);
                        }
                    }}
                    className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-500"
                >
                    🕵️ Run Diagnostics
                </button>
            </div>

            {renderContent()}
        </div>
    );
};
