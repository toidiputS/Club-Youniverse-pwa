/**
 * @file This component renders the initial form for the Music Video Generator.
 * It allows users to input song details (title, artist, lyrics), upload an audio file,
 * and configure advanced options like aspect ratio and pacing.
 */

import React, { useState, useContext, useEffect } from 'react';
import type { SongDetails } from '../types';
import { SectionCard } from './SectionCard';
import { FileUpload } from './FileUpload';
import { ThemeContext } from '../contexts/ThemeContext';
import { estimateMusicVideoCost } from '../services/costEstimator';

interface UploadScreenProps {
  onSubmit: (details: SongDetails) => void;
  error: string | null;
}

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const UploadScreen: React.FC<UploadScreenProps> = ({ onSubmit, error }) => {
  // Access theme settings from context to set default values for advanced options.
  const { settings } = useContext(ThemeContext);
  
  // Form state for song details.
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<{ total: number, breakdown: any } | null>(null);
  // State for source platform
  const [source, setSource] = useState<'suno' | 'producer.ai' | 'mubert' | 'upload'>('upload');


  // State for advanced options, initialized from the global settings context.
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<SongDetails['aspectRatio']>(settings.defaultAspectRatio);
  const [pacing, setPacing] = useState<'default' | 'slow' | 'fast'>('default');
  const [styleKeywords, setStyleKeywords] = useState(settings.defaultStyleKeywords);
  
  // Effect to update local state if global settings change (e.g., in another browser tab).
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
   * Validates the required fields and calls the `onSubmit` prop with the collected song details.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !audioFile) {
      setFormError('Please provide a Song Title and upload an audio file.');
      return;
    }
    setFormError('');
    onSubmit({ title, artist, lyrics, audioFile, aspectRatio, pacing, styleKeywords, duration: audioDuration || 0, source });
  };

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
            setFormError("Could not read audio file duration.");
            setAudioDuration(null);
            URL.revokeObjectURL(audioUrl);
        };
    } else {
        setAudioDuration(null);
    }
  };
  
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
          </div>
          
          <div className="text-center">
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] text-sm">
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>

          {/* Collapsible section for advanced settings */}
          {showAdvanced && (
            <div className="space-y-4 p-4 border border-[var(--input-border)] rounded-lg">
                 <div>
                    <label htmlFor="source" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Source Platform</label>
                    <select id="source" value={source} onChange={e => setSource(e.target.value as any)} className={inputStyles}>
                        <option value="upload">File Upload (Default)</option>
                        <option value="suno">Suno</option>
                        <option value="producer.ai">Producer.ai</option>
                        <option value="mubert">Mubert</option>
                    </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="aspectRatio" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Aspect Ratio</label>
                        <select id="aspectRatio" value={aspectRatio} onChange={e => setAspectRatio(e.target.value as any)} className={inputStyles}>
                            <option value="16:9">16:9 (Widescreen)</option>
                            <option value="9:16">9:16 (Vertical)</option>
                            <option value="1:1">1:1 (Square)</option>
                            <option value="4:3">4:3 (Classic)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="pacing" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Pacing</label>
                        <select id="pacing" value={pacing} onChange={e => setPacing(e.target.value as any)} className={inputStyles}>
                            <option value="default">Default</option>
                            <option value="slow">Slow (Fewer scenes)</option>
                            <option value="fast">Fast (More scenes)</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="styleKeywords" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Style Keywords</label>
                    <input
                        id="styleKeywords"
                        type="text"
                        placeholder="e.g., cinematic, dramatic lighting, 80s synthwave"
                        value={styleKeywords}
                        onChange={(e) => setStyleKeywords(e.target.value)}
                        className={inputStyles}
                    />
                </div>
            </div>
          )}

          {/* Cost Estimation */}
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
          
          {/* Display any form validation errors or submission errors */}
          {(formError || error) && <p className="text-red-400 text-sm text-center">{formError || error}</p>}

          <button
            type="submit"
            className="w-full bg-[var(--accent-secondary)] text-white font-bold py-3 px-6 rounded-lg hover:bg-[var(--accent-primary)] transition-colors duration-300"
          >
            Generate Storyboard {estimatedCost && `(~${formatCurrency(estimatedCost.total)})`}
          </button>
        </form>
      </div>
    </SectionCard>
  );
};