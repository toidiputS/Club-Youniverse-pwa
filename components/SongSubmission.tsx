/**
 * @file This component provides a form for users to submit their own songs to the radio's song pool.
 * It uses a mocked API call to simulate the submission process.
 */

import React, { useState } from 'react';
import { SectionCard } from './SectionCard';
import { FileUpload } from './FileUpload';
import { Loader } from './Loader';
import type { Profile } from '../types';
import { updateProfile } from '../services/supabaseSongService';

interface SongSubmissionProps {
    onBackToStudio: () => void;
    onSongSubmitted: (details: { title: string, artist: string, audioFile: File, durationSec: number }) => Promise<void>;
    profile: Profile;
}

export const SongSubmission: React.FC<SongSubmissionProps> = ({ onBackToStudio, onSongSubmitted, profile }) => {
    // State for the form inputs and submission status.
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState(profile.name || '');
    const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || '');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioDuration, setAudioDuration] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const isFirstTimeArtist = !profile.is_artist;

    /**
    * Handles file selection and calculates audio duration.
    */
    const handleFileSelect = (file: File | null) => {
        setAudioFile(file);
        if (file) {
            const audioUrl = URL.createObjectURL(file);
            const audio = new Audio(audioUrl);
            audio.onloadedmetadata = () => {
                setAudioDuration(audio.duration);
                URL.revokeObjectURL(audioUrl);
            };
            audio.onerror = () => {
                setError("Could not read audio file duration.");
                setAudioDuration(null);
                URL.revokeObjectURL(audioUrl);
            };
        } else {
            setAudioDuration(null);
        }
    };


    /**
     * Handles the form submission.
     * It validates inputs, creates FormData, calls the mock API, and handles success/error states.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !artist || !audioFile || !audioDuration) {
            setError('Please provide a Song Title, Artist Name, and a valid audio file.');
            return;
        }

        if (isFirstTimeArtist && !phoneNumber) {
            setError('A valid phone number is required for your Artist Debut.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // 1. If this is their first upload, transition them to ARTIST status.
            if (isFirstTimeArtist) {
                await updateProfile(profile.user_id, {
                    is_artist: true,
                    name: artist,
                    phone_number: phoneNumber,
                    // Initialize stats if needed, though DB default handles it
                });
            }

            // 2. Submit the song
            await onSongSubmitted({ title, artist, audioFile, durationSec: audioDuration });

            setSuccess(`"${title}" has been successfully submitted! You are now an Official Artist.`);
            // Reset the form on success.
            setTitle('');
            setArtist(profile.name || artist); // Keep artist name
            setAudioFile(null);
            setAudioDuration(null);
        } catch (e: any) {
            setError(e.message || "Submission failed. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyles = "w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none";

    return (
        <div className="max-w-2xl mx-auto w-full">
            <header className="flex justify-between items-start mb-8">
                <div className="text-left">
                    <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display">
                        Submit a Song
                    </h1>
                    <p className="mt-2 text-[var(--text-secondary)]">Get your music played on the station.</p>
                </div>
                <button
                    onClick={onBackToStudio}
                    className="text-sm bg-[var(--accent-secondary)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-primary)] transition-colors"
                >
                    &larr; Back to Studio
                </button>
            </header>

            <SectionCard>
                <div className="p-8">
                    {isLoading ? (
                        <Loader message={isFirstTimeArtist ? "Registering you as an Artist..." : "Uploading your track..."} />
                    ) : success ? (
                        <div className="text-center space-y-4">
                            <div className="text-green-400 text-xl font-bold mb-4">Success!</div>
                            <p className="text-gray-300">{success}</p>
                            <button
                                onClick={() => setSuccess(null)}
                                className="bg-[var(--accent-secondary)] text-white font-bold py-2 px-6 rounded-lg hover:bg-[var(--accent-primary)] transition-colors mt-4"
                            >
                                Submit Another
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {isFirstTimeArtist && (
                                <div className="bg-yellow-900/30 border border-yellow-500/50 p-4 rounded-lg mb-6">
                                    <h3 className="text-yellow-400 font-bold mb-2">🌟 Artist Debut Required</h3>
                                    <p className="text-sm text-gray-300 mb-4">
                                        To upload your first song and become a verified Artist, we need a few more details.
                                        This allows us to track your stats on the leaderboard and contact you for live events (like the Zero Star Roast).
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Song Title</label>
                                    <input
                                        id="title"
                                        type="text"
                                        placeholder="Enter song title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        className={inputStyles}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="artist" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Artist Name (Known As)</label>
                                    <input
                                        id="artist"
                                        type="text"
                                        placeholder="Enter artist name"
                                        value={artist}
                                        onChange={(e) => setArtist(e.target.value)}
                                        required
                                        className={inputStyles}
                                    />
                                </div>
                            </div>

                            {isFirstTimeArtist && (
                                <div className="animate-fade-in">
                                    <label htmlFor="phone" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Phone Number (Required for Artists)</label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required
                                        className={inputStyles}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Used for account verification and live DJ calls.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Audio File</label>
                                <FileUpload onFileSelect={handleFileSelect} />
                                {audioDuration && <p className="text-xs text-green-400 mt-1">Duration detected: {audioDuration.toFixed(1)}s</p>}
                            </div>

                            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[var(--accent-secondary)] text-white font-bold py-3 px-6 rounded-lg hover:bg-[var(--accent-primary)] transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                {isFirstTimeArtist ? 'Become an Artist & Submit' : 'Submit Song'}
                            </button>
                        </form>
                    )}
                </div>
            </SectionCard>
        </div>
    );
};