import { supabase } from './services/supabaseClient';

async function verify() {
    console.log("🔍 Checking for broadcasts table...");
    const { data, error } = await supabase.from('broadcasts').select('*').limit(1);

    if (error) {
        console.error("❌ Table NOT found or accessible:", error.message);
    } else {
        console.log("✅ 'broadcasts' table exists and is accessible.");
        console.log("Data:", data);
    }
}

verify();
