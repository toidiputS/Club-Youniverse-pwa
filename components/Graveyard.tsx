/**
 * @file This component displays the "Graveyard," a list of songs that have reached zero stars
 * according to the game logic. It fetches data from a mocked API endpoint.
 */

import React, { useState, useEffect } from 'react';
import type { Song } from '../types';
import { SectionCard } from './SectionCard';
import { Loader } from './Loader';
import { supabase } from '../services/supabaseClient';

interface GraveyardProps {
    onBackToStudio: () => void;
}

export const Graveyard: React.FC<GraveyardProps> = ({ onBackToStudio }) => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Effect to fetch graveyard songs.
    useEffect(() => {
        const fetchGraveyard = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('songs')
                    .select('*')
                    .eq('status', 'graveyard')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setSongs((data || []).map(s => (s as any)));
            } catch (e: any) {
                setError("Could not fetch graveyard songs.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGraveyard();
    }, []);

    /**
     * Renders the list of songs, or loading/error states.
     */
    const renderContent = () => {
        if (isLoading) {
            return <Loader message="Visiting the graveyard..." />;
        }
        if (error) {
            return <div className="p-8 text-center text-red-400">{error}</div>;
        }
        if (songs.length === 0) {
            return <div className="p-8 text-center text-gray-400">The graveyard is empty. All songs are still in the fight!</div>
        }
        return (
            <div className="space-y-4">
                {songs.map((song) => (
                    <div key={song.id} className="group">
                        <SectionCard className="p-4 bg-black/10 transition-all duration-500 group-hover:shadow-[0_0_20px_var(--accent-primary)] group-hover:border-[var(--accent-primary)]">
                            <div className="flex items-center gap-4 opacity-70">
                                <div className="text-3xl font-bold font-display text-gray-600 w-8 text-center">
                                    R.I.P.
                                </div>
                                <img
                                    src={song.coverArtUrl}
                                    alt={`${song.title} cover art`}
                                    className="w-16 h-16 rounded-md object-cover filter grayscale"
                                />
                                <div className="flex-grow">
                                    <h3 className="text-lg font-bold text-gray-400 line-through truncate">{song.title}</h3>
                                    <p className="text-sm text-gray-500">{song.artistName}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg text-gray-500">
                                        0 Stars
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Final Play Count: {song.playCount}
                                    </div>
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
                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500 font-display">
                        The Graveyard
                    </h1>
                    <p className="mt-2 text-gray-500">Pay respects to the songs that fell to zero stars.</p>
                </div>
                <button
                    onClick={onBackToStudio}
                    className="text-sm bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                    &larr; Back to Studio
                </button>
            </header>

            <SectionCard>
                {renderContent()}
            </SectionCard>
        </div>
    )
};
