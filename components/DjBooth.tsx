/**
 * @file FULLY FUNCTIONAL DJ BOOTH - Complete Admin Control Center
 * Password-protected interface with full radio control capabilities.
 */
import React, { useState, useContext, useEffect } from 'react';
import { SectionCard } from './SectionCard';
import { RadioContext } from '../contexts/AudioPlayerContext';
import type { Profile } from '../types';

// The password to unlock the DJ booth.
const DJ_BOOTH_PASSWORD = 'iHaveThePower';

interface DjBoothProps {
    profile: Profile | null;
}

export const DjBooth: React.FC<DjBoothProps> = ({ profile }) => {
    const {
        isTtsUserMuted,
        setIsTtsUserMuted,
        skipCurrentSong,
        forceNewBoxRound,
        addDjQueueItem,
        nowPlaying,
        boxRound,
        radioState,
        volume,
        setVolume,
    } = useContext(RadioContext);

    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isInputVisible, setIsInputVisible] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    // Auto-unlock for Admins (God Mode)
    useEffect(() => {
        if (profile?.is_admin) {
            setIsUnlocked(true);
        }
    }, [profile]);

    /**
     * Handles the submission of the password.
     */
    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === DJ_BOOTH_PASSWORD) {
            setIsUnlocked(true);
            setIsInputVisible(false);
            setError('');
            setPassword('');
        } else {
            setError('Incorrect password.');
            setPassword('');
        }
    };

    /**
     * Toggles the visibility of the password input field.
     */
    const toggleInput = () => {
        setIsInputVisible(!isInputVisible);
        setError('');
    };

    const handleLock = () => {
        setIsUnlocked(false);
        setShowCustomInput(false);
    };

    const handleToggleMute = () => {
        setIsTtsUserMuted(!isTtsUserMuted);
    };

    const handleSkipSong = () => {
        if (nowPlaying) {
            skipCurrentSong();
        }
    };

    const handleForceBoxRound = () => {
        forceNewBoxRound();
    };

    const handleCustomMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (customMessage.trim()) {
            await addDjQueueItem('filler', { context: customMessage.trim() });
            setCustomMessage('');
            setShowCustomInput(false);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(parseFloat(e.target.value));
    };

    const inputStyles = "w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none";

    return (
        <div className="group flex-1">
            <SectionCard className="transition-all duration-500 group-hover:shadow-[0_0_15px_var(--accent-primary)] group-hover:border-[var(--accent-primary)] h-full">
                <div className="p-3 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-md font-display text-yellow-400">🎛️ VIP DJ Booth</h3>
                        {isUnlocked && (
                            <button onClick={handleLock} className="text-gray-400 hover:text-white transition-colors" title="Lock Booth">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {isUnlocked ? (
                        <div className="animate-fade-in flex-grow flex flex-col">
                            <p className="text-xs text-center text-green-400 mb-3 font-semibold">✅ BOOTH UNLOCKED - FULL CONTROL</p>

                            {/* Status Display */}
                            <div className="bg-black/30 rounded-lg p-2 mb-3 border border-white/10">
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Radio State:</span>
                                        <span className="text-yellow-400 font-mono">{radioState}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Now Playing:</span>
                                        <span className="text-white truncate max-w-[150px]" title={nowPlaying?.title || 'None'}>
                                            {nowPlaying ? nowPlaying.title : '---'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Box Songs:</span>
                                        <span className="text-white">{boxRound?.candidates.length || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Primary Controls */}
                            <div className="space-y-2 mb-3">
                                <button
                                    onClick={handleToggleMute}
                                    className={`w-full text-sm font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${isTtsUserMuted
                                        ? 'bg-red-600 text-white hover:bg-red-500'
                                        : 'bg-green-600 text-white hover:bg-green-500'
                                        }`}
                                >
                                    {isTtsUserMuted ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                            <span>DJ VOICE OFF</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm5 10.13V16a1 1 0 11-2 0v-1.87a5.002 5.002 0 01-4-4.93V8a1 1 0 112 0v2.2a3 3 0 006 0V8a1 1 0 112 0v2.2a5.002 5.002 0 01-4 4.93z" clipRule="evenodd" />
                                            </svg>
                                            <span>DJ VOICE ON</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleSkipSong}
                                    disabled={!nowPlaying}
                                    className="w-full text-sm bg-orange-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-orange-500 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                                    </svg>
                                    Skip Current Song
                                </button>

                                <button
                                    onClick={handleForceBoxRound}
                                    className="w-full text-sm bg-purple-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                    </svg>
                                    Force New Box Round
                                </button>

                                <button
                                    onClick={() => setShowCustomInput(!showCustomInput)}
                                    className="w-full text-sm bg-blue-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    Custom DJ Message
                                </button>
                            </div>

                            {/* Custom Message Input */}
                            {showCustomInput && (
                                <form onSubmit={handleCustomMessage} className="mb-3 space-y-2 animate-fade-in">
                                    <textarea
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        placeholder="Type message for DJ to say..."
                                        className={`${inputStyles} min-h-[60px] text-sm resize-none`}
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={!customMessage.trim()}
                                            className="flex-1 text-xs bg-[var(--accent-secondary)] text-white font-bold py-2 px-3 rounded-lg hover:bg-[var(--accent-primary)] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                        >
                                            Send to DJ
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowCustomInput(false); setCustomMessage(''); }}
                                            className="flex-1 text-xs bg-gray-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-gray-500 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Volume Control */}
                            <div className="mt-auto pt-3 border-t border-white/10">
                                <label className="text-xs text-gray-400 mb-1 block">Master Volume</label>
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                    </svg>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                    />
                                    <span className="text-xs text-white font-mono w-10 text-right">
                                        {Math.round(volume * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 justify-center flex-grow">
                            <button onClick={toggleInput} className="p-3 bg-black/30 rounded-full hover:bg-white/10 transition-colors" title="Enter DJ Booth">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                                </svg>
                            </button>
                            {isInputVisible && (
                                <form onSubmit={handlePasswordSubmit} className="w-full space-y-2 animate-fade-in">
                                    <input
                                        type="password"
                                        placeholder="Enter Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={inputStyles}
                                        autoFocus
                                    />
                                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                                    <button type="submit" className="w-full text-center bg-[var(--accent-secondary)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-primary)] transition-colors duration-300 text-sm">Enter</button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
                <style>{`
                    .animate-fade-in {
                        animation: fadeIn 0.3s ease-in-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-5px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </SectionCard>
        </div>
    );
};
