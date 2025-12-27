/**
 * Quick script to check if songs exist in the database
 * Run with: npx tsx verify_songs.ts
 */

import { supabase } from "./services/supabaseClient";

async function verifySongs() {
  console.log("🔍 Checking songs table...\n");

  const { data: songs, error } = await supabase
    .from("songs")
    .select("id, title, artist_name, status, stars, audio_url")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching songs:", error.message);
    return;
  }

  if (!songs || songs.length === 0) {
    console.log("⚠️  No songs found in database");
    return;
  }

  console.log(`✅ Found ${songs.length} songs:\n`);
  songs.forEach((song, index) => {
    console.log(`${index + 1}. "${song.title}" by ${song.artist_name}`);
    console.log(`   Status: ${song.status}, Stars: ${song.stars}`);
    console.log(`   Audio: ${song.audio_url.substring(0, 50)}...`);
    console.log("");
  });

  const poolSongs = songs.filter((s) => s.status === "pool");
  console.log(`📊 Songs by status:`);
  console.log(`   Pool: ${poolSongs.length}`);
  console.log(
    `   In Box: ${songs.filter((s) => s.status === "in_box").length}`,
  );
  console.log(
    `   Playing: ${songs.filter((s) => s.status === "now_playing").length}`,
  );
  console.log(
    `   Graveyard: ${songs.filter((s) => s.status === "graveyard").length}`,
  );
}

verifySongs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
