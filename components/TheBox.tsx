/**
 * @file This component renders the UI for "The Box," the core voting game of the radio.
 * It displays three candidate songs and allows users to vote, play snippets, and download tracks.
 */

import React, { useContext } from 'react';
import { RadioContext } from '../contexts/AudioPlayerContext';
import { SectionCard } from './SectionCard';
import type { Song } from '../types';



interface TheBoxProps {
    candidates: Song[];
    onVote: (songId: string) => void;
    isVotingActive: boolean;
    userHasVoted: boolean;
    voteCounts: Record<string, number>;
}

export const TheBox: React.FC<TheBoxProps> = ({ candidates, onVote, isVotingActive, userHasVoted }) => {
    const {
        playSnippet,
        stopSnippet,
        snippetPlayingUrl
    } = useContext(RadioContext);

    return (
        <div className="flex gap-4 justify-center pb-4">
            {candidates.map(song => (
                <div key={song.id} className="w-32 flex-shrink-0 group">
                    <SectionCard className="h-full animate-fade-in transition-all duration-300 hover:scale-105 hover:z-10 hover:shadow-[0_0_20px_var(--accent-primary)] group-hover:border-[var(--accent-primary)]">
                        <div className="flex flex-col p-2 gap-1 h-full">
                            {/* Cover Art */}
                            <div className="relative aspect-square w-full overflow-hidden rounded mb-1">
                                <img src={song.coverArtUrl} alt={song.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (snippetPlayingUrl === song.audioUrl) {
                                                stopSnippet();
                                            } else {
                                                playSnippet(song.audioUrl);
                                            }
                                        }}
                                        className="p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-all"
                                    >
                                        {snippetPlayingUrl === song.audioUrl ? (
                                            <div className="w-4 h-4 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 bg-white rounded-sm animate-pulse" />
                                            </div>
                                        ) : (
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-grow min-w-0">
                                <h4 className="font-bold text-xs font-display text-white truncate leading-tight" title={song.title}>{song.title}</h4>
                                <p className="text-[10px] text-gray-400 truncate" title={song.artistName}>{song.artistName}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-yellow-400 text-[10px]">{'⭐'.repeat(Math.min(5, song.stars))}</span>
                                </div>
                            </div>

                            {/* Vote Button */}
                            <button
                                onClick={() => !userHasVoted && onVote(song.id)}
                                disabled={!isVotingActive || userHasVoted}
                                className={`w-full py-1 px-2 rounded font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1
                                    ${userHasVoted
                                        ? 'bg-white/10 text-white/30 cursor-not-allowed'
                                        : 'bg-yellow-500 text-gray-900 hover:bg-yellow-400 shadow-lg shadow-yellow-500/20'
                                    }`}
                            >
                                {userHasVoted ? 'Voted' : 'Vote'}
                            </button>
                        </div>
                    </SectionCard>
                </div>
            ))}
            <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};