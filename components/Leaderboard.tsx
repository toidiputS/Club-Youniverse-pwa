/**
 * @file This component displays the song leaderboard.
 * It fetches a list of top-rated songs from the (mock) API and allows users to sort them
 * by either star rating or total play count.
 */

import React, { useState, useEffect } from 'react';
import type { Song } from '../types';
import { SectionCard } from './SectionCard';
import { Loader } from './Loader';
import { StarRating } from './StarRating';

interface LeaderboardProps {
    onBackToStudio: () => void;
    songs: Song[];
}

type SortByType = 'stars' | 'playCount';

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBackToStudio, songs: allSongs }) => {
    // State to store the list of songs for the leaderboard.
    const [songs, setSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // State to manage the current sorting option.
    const [sortBy, setSortBy] = useState<SortByType>('stars');

    // Effect to sort the songs from props whenever the `sortBy` state or the source `allSongs` change.
    useEffect(() => {
        setIsLoading(true);
        setError(null);
        try {
            const sorted = [...allSongs].sort((a, b) => {
                if (sortBy === 'stars') {
                    // Also sort by playcount as a tie-breaker
                    if (b.stars === a.stars) {
                        return b.playCount - a.playCount;
                    }
                    return b.stars - a.stars;
                }
                // Also sort by stars as a tie-breaker
                if (b.playCount === a.playCount) {
                    return b.stars - a.stars;
                }
                return b.playCount - a.playCount;
            });
            setSongs(sorted);
        } catch (e) {
            setError("Failed to sort songs.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [sortBy, allSongs]);


    /**
     * Renders the main content of the leaderboard, handling loading, error, and success states.
     */
    const renderContent = () => {
        if (isLoading) {
            return <Loader message="Ranking the tracks..." />;
        }
        if (error) {
            return (
                <SectionCard>
                    <div className="p-8 text-center text-red-400">{error}</div>
                </SectionCard>
            );
        }
        if (songs.length === 0) {
            return (
                <SectionCard>
                    <div className="p-8 text-center text-gray-400">The leaderboard is empty. Submit some songs and see how they rank!</div>
                </SectionCard>
            )
        }
        return (
            <div className="space-y-4">
                {songs.map((song, index) => (
                    <div key={song.id} className="group">
                        <SectionCard className="p-4 transition-all duration-500 group-hover:shadow-[0_0_20px_var(--accent-primary)] group-hover:border-[var(--accent-primary)] group-hover:scale-[1.02]">
                            <div className="flex items-center gap-4">
                                {/* Rank number */}
                                <div className="text-2xl font-bold font-display text-[var(--text-secondary)] w-8 text-center">
                                    {index + 1}
                                </div>
                                <img 
                                    src={song.coverArtUrl || 'https://picsum.photos/seed/placeholder/100/100'} 
                                    alt={`${song.title} cover art`}
                                    className="w-16 h-16 rounded-md object-cover bg-black/30"
                                />
                                {/* Song title and artist */}
                                <div className="flex-grow">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">{song.title}</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">{song.artistName}</p>
                                </div>
                                {/* Star rating (visible on medium screens and up) */}
                                <div className="hidden md:block">
                                    <StarRating rating={song.stars} />
                                </div>
                                 {/* Sort value (stars or play count) */}
                                 <div className="text-right w-24">
                                    <div className="font-bold text-lg text-[var(--text-primary)]">
                                        {sortBy === 'playCount' ? song.playCount.toLocaleString() : song.stars}
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)]">
                                        {sortBy === 'playCount' ? 'Plays' : 'Stars'}
                                    </div>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-start mb-4">
                <div className="text-left">
                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display">
                        Song Leaderboard
                    </h1>
                    <p className="mt-2 text-[var(--text-secondary)]">The hottest tracks on Club Youniverse Live.</p>
                </div>
                <button 
                    onClick={onBackToStudio} 
                    className="text-sm bg-[var(--accent-secondary)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-primary)] transition-colors"
                >
                    &larr; Back to Studio
                </button>
            </header>
            
            {/* Sorting controls */}
            <SectionCard>
                <div className="p-4 flex justify-center items-center gap-4">
                    <span className="text-[var(--text-secondary)] font-semibold">Sort by:</span>
                    <button 
                        onClick={() => setSortBy('stars')}
                        className={`py-2 px-4 rounded-lg font-bold transition-colors ${sortBy === 'stars' ? 'bg-[var(--accent-primary)] text-black' : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'}`}
                    >
                        Stars
                    </button>
                    <button 
                        onClick={() => setSortBy('playCount')}
                        className={`py-2 px-4 rounded-lg font-bold transition-colors ${sortBy === 'playCount' ? 'bg-[var(--accent-primary)] text-black' : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'}`}
                    >
                        Play Count
                    </button>
                </div>
            </SectionCard>

            {renderContent()}
        </div>
    );
};