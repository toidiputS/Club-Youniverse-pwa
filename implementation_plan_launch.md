# implementation_plan_launch.md - Club Youniverse Launch Rebuild

This plan outlines the "gutting and rebuilding" of Club Youniverse into a persistent radio powerhouse with a focus on an interactive DJ Booth.

## 0. The Philosophy
- **Persistent Radio Foundation**: The database is the source of truth for the radio state.
- **The DJ Booth is the Product**: Extensive interactive features and site control for the host.
- **Clean Tree**: Remove all legacy views (Studio, Gallery, etc.) and consolidate into a single "Club" experience.

## 1. Core Radio Logic (The Box & The Pool)
We are implementing a strict cycle for song management:
- **ThePool**: All non-new songs live here until selected for the box.
- **TheBox**: 2 songs selected from ThePool for voting.
- **BoxVote**: Logic handled in `TheChat`.
- **BoxWin**: The winner moves to `NextPlay`.
- **NextPlay**: Queue for the upcoming song. (New uploads/Debuts skip the pool and go here).
- **NowPlay**: The currently playing song (sourced from `NextPlay`).
- **Return to Pool**: After playing, a `NowPlay` song returns to `ThePool`.

### Database Schema Updates
- Update `songs` table statuses to: `pool`, `in_box`, `next_play`, `now_playing`, `graveyard`.
- Update `broadcasts` table to include `next_song_id`.

## 2. Component Rebuilds

### TheChat (Consolidated Chat & Voting)
- Live chat box using Supabase Realtime.
- Integrated BoxVoting UI (simple and sleek).
- DJ interactions (Text-to-Speech triggers).

### NowPlay & TheBox
- Simplified visual displays for the current song.
- 2-song layout for TheBox with clear voting triggers.

### The DJ Booth (The Feature)
- **Extensive Site Control**:
    - Force song changes.
    - Trigger site-wide visual effects.
    - Change DJ voices on the fly (using TTS AI).
    - "Live Mic" simulation (real-time TTS or audio streaming).
    - Guest/Co-host simulation.
- **Interactive UI**:
    - Listener metrics.
    - Direct responses to chat.

## 3. The "Live Development" Flow
- Leverage **21st Dev** for Rapid Component Prototyping.
- VSCode + Git + Vercel for instant live updates.
- "Quiet Reboots" masked between songs.

## 4. Execution Steps

### Step 1: Gutting
1. Simplify `App.tsx` to only manage Auth and the main `Club` view.
2. Prune `components/` - move legacy ones to a `legacy/` folder or delete.
3. Update `types.ts` to reflect the new state machine.

### Step 2: Foundation
1. Run updated SQL schema script.
2. Implement `PersistentRadioService` to handle the Pool -> Box -> Play cycle.

### Step 3: DJ Booth & Chat
1. Build the new `DJBooth.tsx` with extensive control panels.
2. Build `TheChat.tsx` with integrated voting.

### Step 4: Polish
1. Rich aesthetics (vibrant colors, glassmorphism).
2. Smooth transitions.
