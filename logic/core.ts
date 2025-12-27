/**
 * @file This file documents the core server-side game logic for "The Box".
 * It contains placeholder functions and detailed comments explaining the rules
 * that govern how songs are selected, voted on, and how their ratings change.
 * THIS IS A SPECIFICATION, NOT A CLIENT-SIDE IMPLEMENTATION.
 */

import type { Song, BoxRound, User, PremiumRule, Profile } from "../types";

// --- Constants ---

const MAX_STARS = 10;
const MIN_STARS = 0;
const MAX_BOX_APPEARANCES_BEFORE_PENALTY = 3; // New rule
const DEBUT_RATING_SURVIVAL_THRESHOLD = 5; // New rule

// --- Core Game Logic Functions (Server-Side Implementation) ---

/**
 * Selects three candidate songs for a new round of "The Box".
 *
 * @param allSongs - A list of all songs currently in the "pool".
 * @returns An array of three Song objects to be placed in the box.
 *
 * @server_rule Selection is weighted by stars (higher stars = higher chance).
 * @server_rule Avoids selecting songs that have recently won to ensure variety.
 * @server_rule Premium users' songs with `priorityBox=true` get a weight bonus.
 */
function selectBoxCandidates(allSongs: Song[]): [Song, Song, Song] {
  // This is a placeholder for server-side logic.
  // The actual implementation would involve:
  // 1. Filtering for songs with status 'pool'.
  // 2. Calculating selection weights based on song.stars and any premium features.
  // 3. Avoiding recent winners to maintain variety.
  // 4. Performing a weighted random selection of 3 songs.
  throw new Error("Server-side logic not implemented.");
}

/**
 * Processes the results of a user vote for a round of "The Box".
 *
 * @param winner - The song that won the vote.
 * @param losers - The two songs that lost the vote.
 * @returns An object containing the updated winner and loser song objects.
 *
 * @server_rule Winner: stars += 1 (capped at 10), status set to "now_playing", boxAppearanceCount reset.
 * @server_rule Losers: boxAppearanceCount incremented.
 */
function processVote(
  winner: Song,
  losers: [Song, Song],
): { updatedWinner: Song; updatedLosers: [Song, Song] } {
  // This is a placeholder for server-side logic.
  const updatedWinner: Song = {
    ...winner,
    stars: Math.min(MAX_STARS, winner.stars + 1),
    status: "now_playing",
    boxAppearanceCount: 0, // Reset on win
  };

  const updatedLosers: [Song, Song] = [
    { ...losers[0], boxAppearanceCount: losers[0].boxAppearanceCount + 1 },
    { ...losers[1], boxAppearanceCount: losers[1].boxAppearanceCount + 1 },
  ];

  return { updatedWinner, updatedLosers };
}

/**
 * Handles the state changes for loser songs after a round.
 * If a song fails to be chosen after 3 rounds, it gets a star penalty.
 *
 * @param song - A song that was in "The Box" but was not chosen.
 * @returns The updated song object.
 *
 * @server_rule If a song's boxAppearanceCount >= 3, then stars -= 1 (floored at 0).
 * @server_rule After the penalty, boxAppearanceCount is reset to 0 and the song returns to the "pool".
 */
function handleUnchosenPenalty(song: Song): Song {
  // This is a placeholder for server-side logic.
  if (song.boxAppearanceCount >= MAX_BOX_APPEARANCES_BEFORE_PENALTY) {
    return {
      ...song,
      stars: Math.max(MIN_STARS, song.stars - 1),
      boxAppearanceCount: 0, // Reset after penalty
      status: "pool",
    };
  }
  // If no penalty, just return the song to the pool.
  return { ...song, status: "pool" };
}

/**
 * Processes the result of a new artist's debut "Trial by Fire".
 * The initial star rating is determined by live audience votes during its first play.
 *
 * @param debutSong - The song that just had its debut play.
 * @param artistProfile - The profile of the artist who uploaded the song.
 * @param liveVoteRatings - An array of all star ratings (1-10) collected during the song's play.
 * @returns The updated song and profile objects.
 *
 * @server_rule Calculate the average of all `liveVoteRatings`. This becomes the song's initial `stars`.
 * @server_rule If average rating < 5, song status becomes "graveyard".
 * @server_rule If song goes to graveyard, the artist's profile `lastDebutAt` is set to the current timestamp.
 * @server_rule If average rating >= 5, song status becomes "pool".
 */
function processDebutResult(
  debutSong: Song,
  artistProfile: Profile,
  liveVoteRatings: number[],
): { updatedSong: Song; updatedProfile: Profile } {
  const totalRating = liveVoteRatings.reduce((sum, rating) => sum + rating, 0);
  const averageRating =
    liveVoteRatings.length > 0 ? totalRating / liveVoteRatings.length : 0;

  let updatedSong = { ...debutSong, stars: averageRating };
  let updatedProfile = { ...artistProfile };

  if (averageRating < DEBUT_RATING_SURVIVAL_THRESHOLD) {
    updatedSong.status = "graveyard";
    updatedProfile.lastDebutAt = new Date().toISOString(); // Start the 24-hour clock
  } else {
    updatedSong.status = "pool";
  }

  return { updatedSong, updatedProfile };
}

/**
 * Triggers the zero-star event for a song that has hit 0 stars through normal play.
 * This should be checked after a star penalty is applied.
 *
 * @param song - The song that has hit zero stars.
 * @param user - The user who uploaded the song.
 *
 * @server_rule Song status is set to "graveyard".
 * @server_rule A DJ call or text event is initiated to the user's phone number (if provided).
 */
function triggerZeroStarEvent(
  song: Song,
  user: User,
): { updatedSong: Song; djEventNeeded: boolean } {
  // This is a placeholder for server-side logic.
  if (song.stars <= MIN_STARS && song.status !== "graveyard") {
    // Avoid re-triggering
    return {
      updatedSong: { ...song, status: "graveyard" },
      djEventNeeded: true,
    };
  }
  return { updatedSong: song, djEventNeeded: false };
}

// --- Premium Hooks (Server-Side Logic) ---

/**
 * Checks if a user's new upload qualifies for a priority "Trial by Fire" debut.
 *
 * @param userProfile - The user's profile.
 * @param userSongCount - The total number of songs the user has uploaded.
 * @returns True if the song should get a priority debut.
 *
 * @server_rule True if it's the user's very first song.
 * @server_rule True if the user's last debut failed (`lastDebutAt` is set) and it is within the last 24 hours.
 */
function isDebutAPriority(
  userProfile: Profile,
  userSongCount: number,
): boolean {
  if (userSongCount === 1) {
    return true;
  }
  if (userProfile.lastDebutAt) {
    const lastDebutTime = new Date(userProfile.lastDebutAt).getTime();
    const currentTime = new Date().getTime();
    const hoursSince = (currentTime - lastDebutTime) / (1000 * 60 * 60);
    if (hoursSince <= 24) {
      return true; // It's their second chance
    }
  }
  return false;
}
