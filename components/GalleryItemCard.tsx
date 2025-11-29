/**
 * @file This component displays a single item (a music video or album cover) in the gallery.
 * It shows a preview of the media and provides a download button.
 */

import React from 'react';
import type { GalleryItem } from '../types';
import { SectionCard } from './SectionCard';

interface GalleryItemCardProps {
    item: GalleryItem;
}

export const GalleryItemCard: React.FC<GalleryItemCardProps> = ({ item }) => {
    // Generate a downloadable file name based on the item's title and type.
    const downloadName = `${(item.title || 'creation').replace(/\s/g, '_')}.${item.type === 'music-video' ? 'webm' : 'jpeg'}`;

    return (
        <SectionCard className="transition-all duration-500 group-hover:shadow-[0_0_20px_var(--accent-primary)] group-hover:border-[var(--accent-primary)] group-hover:scale-105">
            <div className="p-4 h-full flex flex-col">
                {/* Media preview area */}
                <div className="aspect-square bg-black/30 rounded-lg overflow-hidden">
                    {item.type === 'music-video' ? (
                        <video src={item.url} controls muted loop className="w-full h-full object-cover" />
                    ) : (
                        <img src={item.url} alt={`Cover for ${item.title}`} className="w-full h-full object-cover" />
                    )}
                </div>
                {/* Item details and download button */}
                <div className="pt-4 flex-grow flex flex-col">
                    <h3 className="text-lg font-bold font-display text-[var(--accent-primary)] truncate" title={item.title}>
                        {item.title}
                    </h3>
                    {item.artist && <p className="text-sm text-[var(--text-secondary)]">{item.artist}</p>}
                    <div className="mt-auto pt-4">
                        <a
                            href={item.url}
                            download={downloadName}
                            className="w-full block text-center bg-[var(--accent-secondary)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-primary)] transition-colors duration-300"
                        >
                            Download
                        </a>
                    </div>
                </div>
            </div>
        </SectionCard>
    );
};