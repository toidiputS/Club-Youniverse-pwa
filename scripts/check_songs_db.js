
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseAnonKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSongs() {
    console.log("Checking songs table...");
    try {
        const { data, error, count } = await supabase
            .from('songs')
            .select('*', { count: 'exact' });

        if (error) {
            console.error("Error fetching songs:", error);
        } else {
            console.log(`Song Count: ${count}`);
            if (data) {
                console.log("Statuses present:", [...new Set(data.map(s => s.status))]);
                console.log("First 5 songs:", data.slice(0, 5).map(s => ({ id: s.id, title: s.title, status: s.status })));
            }
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

checkSongs();
