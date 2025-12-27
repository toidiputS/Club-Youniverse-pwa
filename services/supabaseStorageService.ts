/**
 * @file This service handles interactions with Supabase Storage, specifically for
 * fetching pre-recorded DJ audio assets.
 */
import { supabase } from "./supabaseClient";

// Cache for the list of callout files to avoid repeated API calls.
let premiumCalloutsCache: { name: string }[] | null = null;
const BUCKET_NAME = "dj-assets";
const FOLDER_PATH = "premium-callouts";

/**
 * Fetches and caches the list of premium callout audio files from Supabase Storage.
 * @returns {Promise<void>}
 */
async function cachePremiumCallouts(): Promise<void> {
  if (!supabase) {
    console.warn("Supabase not initialized, skipping callout cache.");
    premiumCalloutsCache = [];
    return;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(FOLDER_PATH, {
      limit: 100, // As specified by user
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) {
    console.error(
      "Error fetching premium callouts from Supabase Storage:",
      error,
    );
    premiumCalloutsCache = []; // Set to empty array on error to prevent retries
    return;
  }

  // Filter out any potential placeholder files like .emptyFolderPlaceholder
  premiumCalloutsCache = data.filter(
    (file) => file.name !== ".emptyFolderPlaceholder",
  );
}

/**
 * Retrieves the public URL for a random premium callout audio file.
 * It uses a cache to minimize requests to Supabase Storage.
 * @returns {Promise<string | null>} The public URL of a random audio file, or null if none are found.
 */
export async function getRandomPremiumCalloutUrl(): Promise<string | null> {
  if (!supabase) {
    console.warn("Supabase not initialized, cannot fetch premium callout URL.");
    return null;
  }

  // If cache is not populated, fetch the list first.
  if (premiumCalloutsCache === null) {
    await cachePremiumCallouts();
  }

  if (!premiumCalloutsCache || premiumCalloutsCache.length === 0) {
    console.warn(
      "No premium callouts found in Supabase Storage or cache is empty.",
    );
    return null;
  }

  // Select a random file from the cache.
  const randomIndex = Math.floor(Math.random() * premiumCalloutsCache.length);
  const randomFile = premiumCalloutsCache[randomIndex];

  // Get the public URL for the selected file.
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(`${FOLDER_PATH}/${randomFile.name}`);

  return data.publicUrl;
}
