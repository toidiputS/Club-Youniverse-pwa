/**
 * @file This file defines a reusable component for showing and hiding song lyrics in a collapsible "foldout" panel.
 */
import React, { useState } from 'react';

interface LyricsFoldoutProps {
    lyrics: string;
}

export const LyricsFoldout: React.FC<LyricsFoldoutProps> = ({ lyrics }) => {
    // State to manage whether the lyrics are visible or hidden.
    const [isOpen, setIsOpen] = useState(false);

    // If no lyrics are provided, the component renders nothing.
    if (!lyrics) {
        return null;
    }

    return (
        <div className="border border-[var(--input-border)] rounded-lg">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left text-[var(--text-secondary)] hover:bg-white/5"
                aria-expanded={isOpen}
            >
                <span>{isOpen ? 'Hide' : 'Show'} Lyrics</span>
                {/* Arrow icon that rotates based on the open state */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
            {/* The lyrics content, conditionally rendered based on the open state */}
            {isOpen && (
                <div className="p-4 border-t border-[var(--input-border)]">
                    <pre className="whitespace-pre-wrap text-sm text-[var(--text-primary)] font-sans">
                        {lyrics}
                    </pre>
                </div>
            )}
        </div>
    );
};