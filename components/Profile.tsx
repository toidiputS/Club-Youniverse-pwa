/**
 * @file This component serves as the user's profile and settings page.
 * It allows users to manage their artist name, app theme, and view their creations.
 */

import React, { useContext, useState, useEffect } from 'react';
import { SectionCard } from './SectionCard';
import { ThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../services/supabaseClient';
import { Loader } from './Loader';
import { GalleryItemCard } from './GalleryItemCard';
import type { Settings, ThemeName, View, Profile as ProfileType, GalleryItem, Session, Song } from '../types';

interface ProfileProps {
    onNavigate: (view: View) => void;
    profile: ProfileType;
    session: Session;
    galleryItems: GalleryItem[];
    songs: Song[];
    onShowPrivacy: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate, profile, session, galleryItems, onShowPrivacy }) => {
    const { settings, setSettings } = useContext(ThemeContext);
    const [name, setName] = useState(profile?.name || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setName(profile?.name || '');
    }, [profile]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        
        if (!supabase) {
            setError("Database connection is not available.");
            setLoading(false);
            return;
        }
        
        const { error } = await supabase.from('profiles').update({ name }).eq('user_id', session.user.id);

        if (error) {
            setError(error.message);
        } else {
            setMessage('Profile updated successfully!');
            // Note: A full implementation would trigger a profile refresh in App.tsx
        }
        setLoading(false);
    };

    const handleSignOut = async () => {
        setLoading(true);
        if (supabase) {
            await supabase.auth.signOut();
        }
        // Auth state change in App.tsx will handle navigation
    };
    
    const handleSettingsChange = (newSettings: Partial<Settings>) => {
        setSettings({ ...settings, ...newSettings });
    };

    const inputStyles = "w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none";

    // Filter for user-specific gallery items
    const userCreations = galleryItems.filter(item => item.user_id === session.user.id);

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex justify-between items-start mb-4">
                <div className="text-left">
                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display">
                        Profile & Settings
                    </h1>
                    <p className="mt-2 text-[var(--text-secondary)]">Manage your creator identity and app preferences.</p>
                </div>
                <button 
                    onClick={() => onNavigate('studio')}
                    className="text-sm bg-[var(--accent-secondary)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-primary)] transition-colors"
                >
                    &larr; Back to Studio
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile & Account Settings */}
                <SectionCard>
                    <div className="p-8">
                        <h2 className="text-2xl font-bold font-display text-[var(--accent-primary)] mb-6">Creator Profile</h2>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
                                <p className="text-gray-400">{session.user.email}</p>
                            </div>
                            <div>
                                <label htmlFor="artistName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Artist Name</label>
                                <input id="artistName" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputStyles} />
                                 {!profile.name && <p className="text-xs text-yellow-400 mt-1">Please set your artist name to continue.</p>}
                            </div>
                            {message && <p className="text-green-400 text-sm">{message}</p>}
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                            <button type="submit" disabled={loading} className="w-full bg-[var(--accent-secondary)] text-white font-bold py-3 px-6 rounded-lg hover:bg-[var(--accent-primary)] transition-colors disabled:bg-gray-500">
                                {loading ? 'Saving...' : 'Update Profile'}
                            </button>
                        </form>
                        <div className="border-t border-[var(--input-border)] my-6"></div>
                        <button onClick={handleSignOut} disabled={loading} className="w-full bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors">
                            Sign Out
                        </button>
                    </div>
                </SectionCard>

                {/* App Settings */}
                <SectionCard>
                    <div className="p-8">
                        <h2 className="text-2xl font-bold font-display text-[var(--accent-primary)] mb-6">App Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="theme" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Color Theme</label>
                                <select id="theme" value={settings.theme} onChange={e => handleSettingsChange({ theme: e.target.value as ThemeName })} className={inputStyles}>
                                    <option value="dark">Dark</option>
                                    <option value="light">Light</option>
                                    <option value="gradient1">Blue Gradient</option>
                                    <option value="gradient2">Purple Gradient</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="aspectRatio" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Default Video Aspect Ratio</label>
                                <select id="aspectRatio" value={settings.defaultAspectRatio} onChange={e => handleSettingsChange({ defaultAspectRatio: e.target.value as any })} className={inputStyles}>
                                    <option value="16:9">16:9 (Widescreen)</option>
                                    <option value="9:16">9:16 (Vertical)</option>
                                    <option value="1:1">1:1 (Square)</option>
                                    <option value="4:3">4:3 (Classic)</option>
                                </select>
                            </div>
                             <div>
                                <label htmlFor="styleKeywords" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Default Video Style Keywords</label>
                                <input id="styleKeywords" type="text" value={settings.defaultStyleKeywords} onChange={(e) => handleSettingsChange({ defaultStyleKeywords: e.target.value })} className={inputStyles}/>
                            </div>
                            <p className="mt-4 text-center text-xs text-gray-500">
                                View our{' '}
                                <button onClick={onShowPrivacy} className="underline hover:text-yellow-400">
                                Privacy Policy
                                </button>.
                            </p>
                        </div>
                    </div>
                </SectionCard>
            </div>
            {/* My Creations Section */}
            <div>
                <h2 className="text-3xl font-bold font-display text-[var(--accent-primary)] mb-4">My Creations</h2>
                {userCreations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {userCreations.map(item => (
                            <div key={item.id} className="group">
                                <GalleryItemCard item={item} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <SectionCard><div className="p-8 text-center text-gray-400">You haven't generated any media yet.</div></SectionCard>
                )}
            </div>
        </div>
    );
};

// Fix: Removed redundant export statement that caused a redeclaration error.
// export { Profile };