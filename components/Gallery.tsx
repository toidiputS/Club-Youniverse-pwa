/**
 * @file This component displays a gallery of all the user's generated creations (music videos and album covers).
 * It receives the list of items as a prop from the main App component.
 */

import React from "react";
import type { GalleryItem } from "../types";
import { GalleryItemCard } from "./GalleryItemCard";
import { SectionCard } from "./SectionCard";

interface GalleryProps {
  items: GalleryItem[];
  onBackToStudio: () => void;
}

export const Gallery: React.FC<GalleryProps> = ({ items, onBackToStudio }) => {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-start mb-4">
        <div className="text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display">
            Creations Gallery
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            A showcase of your generated work.
          </p>
        </div>
        <button
          onClick={onBackToStudio}
          className="text-sm bg-[var(--accent-secondary)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-primary)] transition-colors"
        >
          &larr; Back to Studio
        </button>
      </header>

      {/* Display a message if the gallery is empty, otherwise render the grid of items. */}
      {items.length === 0 ? (
        <SectionCard>
          <div className="p-16 text-center">
            <h2 className="text-2xl font-bold font-display text-[var(--text-secondary)]">
              Your gallery is empty.
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Go back to the studio to start creating album covers and music
              videos!
            </p>
          </div>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item.id} className="group">
              <GalleryItemCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
