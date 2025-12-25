import React, { useState } from 'react';
import { SectionCard } from './SectionCard';
import { FileUpload } from './FileUpload';
import { Loader } from './Loader';
import { PremiumUpgrade } from './PremiumUpgrade';
import type { Profile } from '../types';
import { updateProfile } from '../services/supabaseSongService';
import { getAudioDuration } from '../services/audioUtils';

interface SongSubmissionProps {
    onBackToStudio: () => void;
    onSongSubmitted: (details: { title: string, artist: string, audioFile: File, durationSec: number }) => Promise<void>;
    profile: Profile;
    setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}

export const SongSubmission: React.FC<SongSubmissionProps> = ({ onBackToStudio, onSongSubmitted, profile, setProfile }) => {
    // State for the form inputs and submission status.
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState(profile.name || '');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioDuration, setAudioDuration] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showUpgradeFlow, setShowUpgradeFlow] = useState(false);

    const isFirstTimeArtist = !profile.is_artist;

    /**
    * Handles file selection and calculates audio duration using the utility.
    */
    const handleFileSelect = async (file: File | null) => {
        setAudioFile(file);
        setError(null);
        if (file) {
            try {
                const duration = await getAudioDuration(file);
                setAudioDuration(duration);
            } catch (err: any) {
                setError("Could not read audio file duration. Please try a different file.");
                setAudioDuration(null);
            }
        } else {
            setAudioDuration(null);
        }
    };


    /**
     * Handles the form submission.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!profile.is_premium) {
            setShowUpgradeFlow(true);
            return;
        }

        if (!title || !artist || !audioFile || !audioDuration) {
            setError('Please provide a Song Title, Artist Name, and a valid audio file.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // 1. If this is their first upload, transition them to ARTIST status.
            if (isFirstTimeArtist) {
                const updates = {
                    is_artist: true,
                    name: artist,
                };
                await updateProfile(profile.user_id, updates);
                setProfile({ ...profile, ...updates });
            }

            // 2. Submit the song
            await onSongSubmitted({ title, artist, audioFile, durationSec: audioDuration });

            setSuccess(`"${title}" has been successfully submitted! You are now an Official Artist.`);
            // Reset the form on success.
            setTitle('');
            setAudioFile(null);
            setAudioDuration(null);
        } catch (e: any) {
            setError(e.message || "Submission failed. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (showUpgradeFlow || !profile.is_premium) {
        return (
            <div className="max-w-2xl mx-auto w-full">
                <header className="flex justify-between items-start mb-8">
                    <div className="text-left">
                        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display">
                            VIP Access Only
                        </h1>
                        <p className="mt-2 text-[var(--text-secondary)]">Only Club Youniverse VIPs can upload music to the station.</p>
                    </div>
                    <button
                        onClick={onBackToStudio}
                        className="text-sm bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        &larr; Back to Studio
                    </button>
                </header>

                <PremiumUpgrade
                    profile={profile}
                    onUpgradeComplete={(updated) => {
                        setProfile(updated);
                        setShowUpgradeFlow(false);
                    }}
                    onCancel={onBackToStudio}
                />
            </div>
        );
    }

    const inputStyles = "w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none";

    return (
        <div className="max-w-2xl mx-auto w-full">
            <header className="flex justify-between items-start mb-8">
                <div className="text-left">
                    <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display">
                        Submit a Song
                    </h1>
                    <p className="mt-2 text-[var(--text-secondary)]">VIP Station Access: Your music, our rotation.</p>
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
