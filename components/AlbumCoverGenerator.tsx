/**
 * @file This component provides the UI and logic for the AI Album Cover Generator.
 * Users can input a song title, artist, and a descriptive prompt to generate a square album cover image.
 */
import React, { useState } from 'react';
import { SectionCard } from './SectionCard';
import { Loader } from './Loader';
import { generateAlbumCover } from '../services/geminiService';
import { estimateAlbumCoverCost } from '../services/costEstimator';
import type { GalleryItem } from '../types';

interface AlbumCoverGeneratorProps {
    onBackToStudio: () => void;
    onCreationComplete: (item: Omit<GalleryItem, 'id'>) => void;
}

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};


export const AlbumCoverGenerator: React.FC<AlbumCoverGeneratorProps> = ({ onBackToStudio, onCreationComplete }) => {
    // State for the form inputs and generation process.
    const [prompt, setPrompt] = useState('');
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

    // Get the fixed cost for generating one album cover.
    const estimatedCost = estimateAlbumCoverCost();

    /**
     * Handles the form submission to generate an album cover.
     * It calls the `generateAlbumCover` service and updates the state with the result.
     */
    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt || !title) {
            setError('Please provide a song title and a descriptive prompt.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImageUrl(null);

        try {
            // Combine user inputs into a more detailed prompt for the AI.
            const fullPrompt = `Album cover for "${title}" by ${artist || 'an artist'}. Style: ${prompt}`;
            const result = await generateAlbumCover(fullPrompt);
            setGeneratedImageUrl(result.url);
            
            // Add the new creation to the gallery.
            onCreationComplete({
                type: 'album-cover',
                title: title,
                artist: artist || undefined,
                url: result.url,
                prompt: fullPrompt,
            });
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred during image generation.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputStyles = "w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none";

    return (
        <>
            <header className="flex justify-between items-start mb-12">
                <div className="text-left">
                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display">
                        AI Album Cover Generator
                    </h1>
                    <p className="mt-2 text-[var(--text-secondary)]">Design beautiful, square album art for your music.</p>
                </div>
                <button 
                    onClick={onBackToStudio} 
                    className="text-sm bg-[var(--accent-secondary)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-primary)] transition-colors"
                >
                    &larr; Back to Studio
                </button>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input form */}
                <SectionCard>
                    <div className="p-8">
                        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--accent-primary)] font-display">Describe Your Vision</h2>
                        <form onSubmit={handleGenerate} className="space-y-6">
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
                                placeholder="Describe the album cover art... e.g., 'A lone astronaut looking at a surreal, neon-lit cityscape on a distant planet, digital painting, vibrant colors.'"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={6}
                                required
                                className={`${inputStyles} resize-none`}
                            />

                            <div className="p-3 border border-yellow-400/30 rounded-lg bg-yellow-900/10 text-sm text-center">
                                <span className="text-yellow-300 font-bold">Estimated Cost:</span>
                                <span className="font-mono text-white ml-2">{formatCurrency(estimatedCost.total)}</span>
                                <p className="text-xs text-gray-500 mt-1">Based on one Imagen 4.0 image generation.</p>
                            </div>
                            
                            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[var(--accent-secondary)] text-white font-bold py-3 px-6 rounded-lg hover:bg-[var(--accent-primary)] transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Generating...' : `Generate Album Cover (~${formatCurrency(estimatedCost.total)})`}
                            </button>
                        </form>
                    </div>
                </SectionCard>
                
                {/* Output display area */}
                <div className="group">
                    <SectionCard className="transition-all duration-500 group-hover:shadow-[0_0_20px_var(--accent-primary)] group-hover:border-[var(--accent-primary)]">
                        <div className="p-8 h-full flex flex-col items-center justify-center">
                            {isLoading ? (
                                <Loader message="Creating your masterpiece..." />
                            ) : generatedImageUrl ? (
                                <div className="w-full aspect-square">
                                    <img src={generatedImageUrl} alt="Generated album cover" className="w-full h-full object-cover rounded-lg shadow-lg" />
                                    <a
                                        href={generatedImageUrl}
                                        download={`${title.replace(/\s/g, '_')}_cover.jpeg`}
                                        className="block w-full mt-4 text-center bg-[var(--accent-primary)] text-black font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-secondary)] transition-colors"
                                    >
                                        Download
                                    </a>
                                </div>
                            ) : (
                                <div className="w-full aspect-square flex flex-col items-center justify-center bg-black/30 rounded-lg border-2 border-dashed border-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="mt-4 text-gray-400">Your generated album cover will appear here.</p>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </>
    );
};