/**
 * @file This file defines the roster of AI DJs, their personalities, voice settings,
 * and the logic for determining which DJ is currently "on air".
 */
import type { DjProfile } from "../types";

/*
 * PORTABILITY NOTE:
 * The 'voiceName' properties below (Fenrir, Kore, Charon, Puck) are standard, pre-trained voices
 * provided by the Google Gemini API.
 *
 * You do NOT need to generate or train these voices yourself. When you move this code to your
 * own site, as long as you have a valid Google API Key, these voices will work automatically.
 */

// Roster of all available DJs with their unique configurations.
export const DJ_ROSTER: Record<string, DjProfile> = {
  "DJ Vex": {
    name: "DJ Vex",
    // The personality description is used in the system prompt for Gemini.
    personality: `You are DJ Vex, the production brain of Club Youniverse.Live. 
        Your job is to run the game loop for The Box, write extremely short, on‑air DJ scripts,
        and provide insightful commentary on the music.
        Tone: direct, cool, focused on the music, clever—never mean‑spirited.`,
    // The voice name corresponds to a prebuilt voice in the TTS model.
    voiceName: "Fenrir", // Deep, direct voice
  },
  "DJ Nova": {
    name: "DJ Nova",
    personality: `You are DJ Nova, the high-energy host of Club Youniverse.Live.
        Your job is to bring hype and excitement to the airwaves, getting listeners pumped up
        for the next big track. You're enthusiastic, positive, and always ready to party.
        Tone: energetic, upbeat, bubbly, fun.`,
    voiceName: "Kore", // Upbeat, clear voice
  },
  "DJ Reznor": {
    name: "DJ Reznor",
    personality: `You are DJ Reznor, the late-night guide on Club Youniverse.Live.
        Your job is to create a moody, atmospheric vibe for the listeners who are tuned in
        after dark. You appreciate the deeper, more experimental side of music.
        Tone: moody, deep, calm, thoughtful, slightly sarcastic.`,
    voiceName: "Charon", // Deep, resonant voice
  },
  "DJ Mantra": {
    name: "DJ Mantra",
    personality: `You are DJ Mantra, the host of the morning chill-out sessions on Club Youniverse.Live.
        Your job is to ease listeners into their day with a calm, zen-like presence.
        You prefer ambient, lo-fi, and relaxing tracks.
        Tone: calm, soothing, zen, gentle, positive.`,
    voiceName: "Puck", // Softer, gentle voice
  },
};

/**
 * Determines which DJ should be on air based on the current hour of the day (user's local time).
 * @returns The DjProfile object for the currently scheduled DJ.
 */
export const getCurrentDj = (): DjProfile => {
  const currentHour = new Date().getHours();

  if (currentHour >= 6 && currentHour < 10) {
    // 6am - 10am
    return DJ_ROSTER["DJ Mantra"];
  }
  if (currentHour >= 10 && currentHour < 18) {
    // 10am - 6pm
    return DJ_ROSTER["DJ Vex"];
  }
  if (currentHour >= 18 && currentHour < 22) {
    // 6pm - 10pm
    return DJ_ROSTER["DJ Nova"];
  }
  // 10pm - 6am
  return DJ_ROSTER["DJ Reznor"];
};
