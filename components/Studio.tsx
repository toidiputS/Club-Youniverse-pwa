/**
 * @file This component serves as the main dashboard or "studio" of the application.
 * It provides navigation to all the different features like the live radio, generators, gallery, etc.
 */

import React from "react";
import { SectionCard } from "./SectionCard";
import type { View, Profile } from "../types";

interface StudioProps {
  onNavigate: (view: View) => void;
  profile: Profile | null;
}

/**
 * A reusable card component for each navigation item in the studio.
 */
const StudioCard: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  isPrimary?: boolean;
}> = ({ onClick, icon, title, description, isPrimary }) => (
  <div onClick={onClick} className="cursor-pointer group">
    <SectionCard
      className={`h-full p-8 flex flex-col items-center justify-center text-center transition-all duration-500 group-hover:border-[var(--accent-primary)] group-hover:scale-105 group-hover:shadow-[0_0_20px_var(--accent-primary)] ${isPrimary ? "bg-gradient-to-br from-[var(--accent-primary)]/10 to-transparent" : ""}`}
    >
      {icon}
      <h2 className="text-2xl font-bold font-display text-[var(--accent-secondary)]">
        {title}
      </h2>
      <p className="mt-2 text-[var(--text-secondary)]">{description}</p>
    </SectionCard>
  </div>
);

export const Studio: React.FC<StudioProps> = ({ onNavigate, profile }) => {
  const iconStyles = "h-16 w-16 mb-4 text-[var(--accent-primary)]";

  return (
    <div className="flex-grow flex flex-col pb-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] font-display">
          Club Youniverse
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Welcome to the Studio, {profile?.name || "Creator"}.
        </p>
      </header>

      {/* Grid of navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Card for Live Radio */}
        <StudioCard
          onClick={() => onNavigate("radio")}
          isPrimary
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={iconStyles}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M18 3a1 1 0 00-1.447-.894L8.763 6.19A5.002 5.002 0 005 10c0 .984.286 1.89.763 2.691l-2.47 1.544A3.002 3.002 0 012 13.13V12a1 1 0 00-2 0v1.132a5.002 5.002 0 004.288 4.908l2.47-1.544A5.002 5.002 0 0010 15a5 5 0 004.237-2.19l7.794-4.87a1 1 0 00-.03-1.742zM10 13a3 3 0 110-6 3 3 0 010 6z" />
            </svg>
          }
          title="Go Live: Tune In!"
          description="Experience the 24/7 AI-hosted radio and play 'The Box'."
        />

        {/* Card for Song Submission */}
        <StudioCard
          onClick={() => onNavigate("song-submission")}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={iconStyles}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          }
          title="Submit a Song"
          description="Upload your track to the song pool for a chance to be featured."
        />

        {/* Card for Song Library */}
        <StudioCard
          onClick={() => onNavigate("song-library")}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={iconStyles}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
              />
            </svg>
          }
          title="Song Library"
          description="View and manage all the tracks you have submitted to the station."
        />

        {/* Card for Profile & Settings */}
        <StudioCard
          onClick={() => onNavigate("profile")}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={iconStyles}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
          title="Profile & Settings"
          description="Manage your artist name, app theme, and generation defaults."
        />

        {/* Card for Music Video Generator */}
        <StudioCard
          onClick={() => onNavigate("music-video")}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={iconStyles}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          }
          title="AI Music Video Generator"
          description="Create stunning music videos from your audio using AI."
        />

        {/* Card for Album Cover Generator */}
        <StudioCard
          onClick={() => onNavigate("album-cover")}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={iconStyles}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          title="AI Album Cover Generator"
          description="Design beautiful, square album art for your releases."
        />

        {/* Card for Gallery */}
        <StudioCard
          onClick={() => onNavigate("gallery")}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={iconStyles}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          }
          title="Creations Gallery"
          description="View all the music videos and cover art you've generated."
        />

        {/* Card for Graveyard */}
        <StudioCard
          onClick={() => onNavigate("graveyard")}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={iconStyles}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
          }
          title="The Graveyard"
          description="Pay respects to the songs that have fallen to zero stars."
        />
      </div>
    </div>
  );
};
