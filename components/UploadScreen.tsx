/**
 * @file This component renders the initial form for the Music Video Generator.
 * It allows users to input song details (title, artist, lyrics), upload an audio file,
 * and configure advanced options like aspect ratio and pacing.
 */

import React, { useState, useContext, useEffect } from 'react';
import type { SongDetails, Profile } from '../types';
import { SectionCard } from './SectionCard';
import { FileUpload } from './FileUpload';
import { ThemeContext } from '../contexts/ThemeContext';
import { estimateMusicVideoCost } from '../services/costEstimator';
import { getAudioDuration } from '../services/audioUtils';
import { PremiumUpgrade } from './PremiumUpgrade';

interface UploadScreenProps {
  onSubmit: (details: SongDetails) => void;
  error?: string | null;
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  onBack: () => void;
}

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const UploadScreen: React.FC<UploadScreenProps> = ({ onSubmit, error, profile, setProfile, onBack }) => {
  // State for showing the upgrade flow if not premium.
  const [showUpgradeFlow, setShowUpgradeFlow] = useState(false);

  // Access theme settings from context to set default values for advanced options.
  const { settings } = useContext(ThemeContext);

  // Form state for song details.
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState(profile.name || '');
  const [lyrics, setLyrics] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<{ total: number, breakdown: any } | null>(null);

  // State for source platform
  const [source, setSource] = useState<'suno' | 'producer.ai' | 'mubert' | 'upload'>('upload');

  // State for advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<SongDetails['aspectRatio']>(settings.defaultAspectRatio);
  const [pacing, setPacing] = useState<'default' | 'slow' | 'fast'>('default');
  const [styleKeywords, setStyleKeywords] = useState(settings.defaultStyleKeywords);

  // Effect to update local state if global settings change
  useEffect(() => {
    setAspectRatio(settings.defaultAspectRatio);
    setStyleKeywords(settings.defaultStyleKeywords);
  }, [settings.defaultAspectRatio, settings.defaultStyleKeywords]);

  // Effect to calculate cost when duration or pacing changes.
  useEffect(() => {
    if (audioDuration) {
      const cost = estimateMusicVideoCost(audioDuration, pacing);
      setEstimatedCost(cost);
    } else {
      setEstimatedCost(null);
    }
  }, [audioDuration, pacing]);

  /**
   * Handles form submission.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !audioFile) {
      setFormError('Please provide a Song Title and upload an audio file.');
      return;
    }
    setFormError(null);
    onSubmit({
      title,
      artist,
      lyrics,
      audioFile,
      aspectRatio,
      pacing,
      styleKeywords,
      duration: audioDuration || 0,
      source
    });
  };

  /**
   * Handles file selection and calculates audio duration using the utility.
   */
  const handleFileSelect = async (file: File | null) => {
    setAudioFile(file);
    if (file) {
      try {
        const duration = await getAudioDuration(file);
        setAudioDuration(duration);
      } catch (err: any) {
        setFormError("Could not read audio file duration. Please try a different file.");
        setAudioDuration(null);
      }
    } else {
      setAudioDuration(null);
    }
  };

  if (showUpgradeFlow || !profile.is_premium) {
    return (
      <div className="max-w-4xl mx-auto w-full">
        <header className="flex justify-between items-start mb-12">
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display">
              VIP Access Only
            </h1>
            <p className="mt-2 text-[var(--text-secondary)]">Only VIPs can access AI production tools.</p>
          </div>
          <button
            onClick={onBack}
            className="text-sm bg-gray-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
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
          onCancel={onBack}
        />
      </div>
    );
  }

  const inputStyles = "w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none";

  return (
    <SectionCard>
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-[var(--accent-primary)] font-display">Start Your Production</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              placeholder="Song Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputStyles}
            />
            <input
              type="text"
              placeholder="Artist Name (Optional)"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className={inputStyles}
            />
          </div>
          <textarea
            placeholder="Paste song lyrics here... (Optional, but helps create a better video!)"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={10}
            className={`${inputStyles} resize-none`}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Upload Audio</label>
            <FileUpload onFileSelect={handleFileSelect} />
            {audioDuration && <p className="text-xs text-green-400 mt-1">Duration detected: {audioDuration.toFixed(1)}s</p>}
          </div>

          <div className="text-center">
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] text-sm">
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 p-4 border border-[var(--input-border)] rounded-lg animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Video Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className={inputStyles}
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait/Shorts)</option>
                    <option value="1:1">1:1 (Square)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Creation Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className={inputStyles}
                  >
                    <option value="upload">Personal Upload</option>
                    <option value="suno">Suno AI</option>
                    <option value="producer.ai">Producer AI</option>
                    <option value="mubert">Mubert</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Pacing</label>
                  <select value={pacing} onChange={e => setPacing(e.target.value as any)} className={inputStyles}>
                    <option value="default">Default</option>
                    <option value="slow">Slow (Fewer scenes)</option>
                    <option value="fast">Fast (More scenes)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Style Keywords</label>
                  <input
                    type="text"
                    placeholder="e.g., cinematic, dramatic lighting, 80s synthwave"
                    value={styleKeywords}
                    onChange={(e) => setStyleKeywords(e.target.value)}
                    className={inputStyles}
                  />
                </div>
              </div>
            </div>
          )}

          {estimatedCost && (
            <div className="p-4 border border-yellow-400/30 rounded-lg bg-yellow-900/10 text-sm">
              <h4 className="font-bold text-yellow-300 mb-2 text-center">Estimated Generation Cost</h4>
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-gray-400">Storyboard</p>
                  <p className="font-mono text-white">{formatCurrency(estimatedCost.breakdown.storyboardCost)}</p>
                </div>
                <div>
                  <p className="text-gray-400">{estimatedCost.breakdown.numVideos} Video Clips</p>
                  <p className="font-mono text-white">{formatCurrency(estimatedCost.breakdown.videoCost)}</p>
                </div>
                <div>
                  <p className="text-gray-400">{estimatedCost.breakdown.numImages} Images</p>
                  <p className="font-mono text-white">{formatCurrency(estimatedCost.breakdown.imageCost)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">This is an estimate. Actual cost may vary based on model usage and final scene count.</p>
            </div>
          )}

          {(formError || error) && <p className="text-red-400 text-sm text-center">{formError || error}</p>}

          <button
            type="submit"
            className="w-full bg-[var(--accent-secondary)] text-white font-bold py-4 px-8 rounded-lg hover:bg-[var(--accent-primary)] transition-colors duration-300 flex items-center justify-center gap-2 group"
          >
            Create AI Music Video
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </div>
    </SectionCard>
  );
};
