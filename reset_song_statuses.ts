/**
 * Reset all song statuses to 'pool' to fix database corruption
 * Run with: npx tsx reset_song_statuses.ts
 */

import { supabase } from "./services/supabaseClient";

async function resetSongStatuses() {
  console.log("🔧 Resetting all song statuses to pool...\n");

  const { error } = await supabase
    .from("songs")
    .update({
      status: "pool",
      box_appearance_count: 0,
      box_rounds_seen: 0,
      box_rounds_lost: 0,
    })
    .neq("status", "graveyard"); // Don't touch graveyard songs

  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }

  console.log("✅ All songs reset to pool status");
  console.log("✅ Box counters reset to 0");
  console.log("\n🎵 Refresh your browser - radio should start fresh!");
}

resetSongStatuses()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Failed:", err);
    process.exit(1);
  });
