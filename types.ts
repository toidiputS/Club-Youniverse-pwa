/**
 * @file This file contains all the TypeScript type definitions and interfaces used throughout the application.
 * It serves as a single source of truth for the data structures, ensuring type safety and consistency.
 */

// Fix: Manually define types for `import.meta.env` to resolve TypeScript errors
// across the application, as the standard `vite/client` types are not being resolved.
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_KEY: string;
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

import type { Session } from '@supabase/supabase-js';

// --- Auth ---
export type { Session };

export interface Profile {
  user_id: string;
  name: string;
  email?: string;
  is_premium: boolean;
  is_artist: boolean; // True if they have uploaded at least one song
  is_admin?: boolean;
  phone_number?: string;
  roast_consent: boolean; // True if the user agrees to be roasted live on air
  created_at: string;
  updated_at: string;
  lastDebutAt?: string | null; // Tracks the timestamp of a failed debut for the 24-hour rule
  stats?: {
    plays: number;
    uploads: number;
    votes_cast: number;
    graveyard_count: number;
  };
}


// --- Core Data Models ---
// These interfaces represent the main data entities of the application, like songs, users, and chat messages.

export interface Song {
  id: string;
  uploaderId: string;
  title: string;
  artistName: string;
  source: 'suno' | 'producer.ai' | 'mubert' | 'upload';
  audioUrl: string;
  durationSec: number;
  stars: number;
  boxRoundsSeen: number;
  boxRoundsLost: number;
  boxAppearanceCount: number; // New: Tracks how many times a song has appeared in The Box without being chosen
  status: 'pool' | 'in_box' | 'now_playing' | 'graveyard' | 'debut'; // Added 'debut' status
  coverArtUrl?: string;
  lyrics?: string;
  moods?: string[];
  tags?: string[];
  playCount: number;
  upvotes: number;
  downvotes: number;
  lastPlayedAt: string; // ISO date string
  createdAt: string; // ISO date string
  votes?: number; // for frontend radio state
}

export interface User {
  id: string;
  name: string;
  isPremium: boolean;
  phoneNumber?: string; // For zero-star event
}

export interface BoxRound {
  id: string;
  candidates: Song[];
  startedAt: string; // ISO date string
}

export interface ChatMessage {
  id: string;
  user: {
    name: string;
    isDj?: boolean;
  };
  text: string;
  timestamp: number;
  source?: {
    title: string;
    uri: string;
  };
}

// New type to define the profile of an AI DJ
export interface DjProfile {
  name: string;
  personality: string;
  voiceName: 'Fenrir' | 'Kore' | 'Charon' | 'Puck'; // Add other valid voice names here
}


export interface DJEvent {
  id: string;
  type: 'ad_read' | 'promo' | 'station_id' | 'zero_star_roast';
  script: string;
  scheduledAt: string; // ISO date string
  playedAt?: string; // ISO date string
}

// --- App State & Navigation ---
// Types related to the application's UI state, navigation, and status.

export type View = 'studio' | 'radio' | 'song-submission' | 'song-library' | 'leaderboard' | 'graveyard' | 'album-cover' | 'music-video' | 'gallery' | 'profile';

// A constant object for tracking the status of the music video generator.
export const AppStatus = {
  API_KEY_CHECKING: 'API_KEY_CHECKING',
  API_KEY_NEEDED: 'API_KEY_NEEDED',
  UPLOAD: 'UPLOAD',
  GENERATING_STORYBOARD: 'GENERATING_STORYBOARD',
  GENERATING_MEDIA: 'GENERATING_MEDIA',
  COMPLETE: 'COMPLETE',
} as const;

export type AppState = typeof AppStatus[keyof typeof AppStatus];

// Represents the different states of the live radio simulation.
export type RadioState = 'DJ_BANTER_INTRO' | 'BOX_VOTING' | 'DJ_BANTER_OUTRO' | 'NOW_PLAYING' | 'DJ_TALKING';

// --- UI & Settings ---
// Interfaces for user-configurable settings and UI elements.

export type ThemeName = 'dark' | 'light' | 'gradient1' | 'gradient2';

export interface Settings {
  theme: ThemeName;
  customCardBackground: string | null;
  defaultAspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  defaultStyleKeywords: string;
}

export interface GalleryItem {
  id: string;
  type: 'music-video' | 'album-cover';
  title: string;
  artist?: string;
  url: string;
  prompt?: string;
  user_id?: string;
  created_at?: string;
}

// --- Music Video Generation ---
// Types specific to the music video generation feature.

export interface SongDetails {
  title: string;
  artist: string;
  lyrics: string;
  audioFile: File;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  pacing: 'default' | 'slow' | 'fast';
  styleKeywords: string;
  duration?: number; // Optional duration in seconds, calculated on the frontend.
  source?: 'suno' | 'producer.ai' | 'mubert' | 'upload'; // Optional source tracking
}

export interface StoryboardScene {
  scene: number;
  type: 'video' | 'image';
  description: string;
  prompt: string;
}

export interface GeneratedMedia {
  scene: number;
  type: 'video' | 'image';
  status: 'pending' | 'generating' | 'complete' | 'failed';
  url: string | null;
  error?: string;
}

export type GenerationStage = 'INITIAL' | 'VIDEO_BLOCK_1' | 'IMAGE_BLOCK' | 'VIDEO_BLOCK_2' | 'DONE';


// --- Server-side Logic & API Contracts ---
// These interfaces define the shape of data for backend logic, even if the backend is mocked.

export interface PremiumRule {
  maxUploadsPerMonthFree: number;
  maxUploadsPerMonthPremium: number;
}

// --- Gemini Studio Service Types ---
// These interfaces define the input and output structures for the specialized Gemini Studio functions.

export interface SelectBoxCandidatesInput {
  pool: Song[];
  avoidIds: string[];
  count: number;
}
export interface SelectBoxCandidatesOutput {
  candidateIds: string[];
  reason: string;
}

export interface DjBanterScriptInput {
  event: 'intro' | 'outro' | 'new_box_round' | 'winner_announcement' | 'graveyard_roast' | 'filler' | 'weird_news_segment' | 'user_mention' | 'premium_cta' | 'new_artist_shoutout' | 'dj_shift_change' | 'debut_song_outro' | 'empty_queue_banter' | 'system_explainer';
  song?: { title: string; artistName: string, finalRating?: number };
  djProfile?: DjProfile; // The profile of the DJ who is speaking
  context?: any; // e.g., "It's a close race!" or a news story
}
export interface DjBanterScriptOutput {
  script: string;
  cta?: string;
  safety: {
    profanity: boolean;
    defamation: boolean;
  };
}

// The unified DJ audio queue now includes the DJ's name for TTS items.
export type DjQueueItem = {
  id: string;
  type: 'tts';
  content: string; // The text to be synthesized
  djName: string; // The name of the DJ who is speaking
} | {
  id: string;
  type: 'url';
  content: string; // The URL of the pre-recorded audio file
};


export interface WeirdNewsOutput {
  headline: string;
  summary: string;
  sources: Array<{
    title: string;
    uri: string;
  }>;
}

export interface ZeroStarCallCopyInput {
  artistName: string;
  songTitle: string;
  tone: 'funny_roast' | 'gentle_condolences';
}
export interface ZeroStarCallCopyOutput {
  callScript: string;
  smsCopy: string;
}

export interface LyricsDetectAndCleanInput {
  rawLyrics: string;
}
export interface LyricsDetectAndCleanOutput {
  cleanLyrics: string;
  detectedLanguage: string; // e.g., "en-US"
}

export interface CoverLayoutPlanInput {
  title: string;
  artist: string;
  lyrics: string;
  styleKeywords: string;
}
export interface CoverLayoutPlanOutput {
  front: { prompt: string; safe: boolean };
  back: { prompt: string; safe: boolean };
  spine: { text: string };
  inside: {
    panel: "left" | "center" | "right";
    prompt?: string;
    lyricsLayout?: "two_column";
    title?: string;
    credits?: string;
  }[];
  export: {
    sizes: string[]; // e.g., ["3000x3000"]
    pdfBooklet: boolean;
  };
}

export interface VideoStylePlanInput {
  title: string;
  artist: string;
  lyrics: string;
  styleKeywords: string;
  durationSec: number;
}

export interface VideoStylePlanOutput {
  scenes: {
    tStart: number;
    tEnd: number;
    prompt: string;
  }[];
  captions?: {
    t: number;
    text: string;
  }[];
}

// --- Lyric Visualization ---
// Types for the lyric display system.

export enum AnimationType {
  BOUNCE = 'bounce',
  SHAKE = 'shake',
  GLITCH = 'glitch',
  SLIDE = 'slide',
  EXPLODE = 'explode'
}

export interface ChoreographedLine {
  id: string;
  text: string;
  time?: number;
  meta?: {
    animation?: AnimationType;
    fontFamily?: string;
    color?: string;
    rotation?: number;
    scale?: number;
    secondaryText?: string;
  };
}