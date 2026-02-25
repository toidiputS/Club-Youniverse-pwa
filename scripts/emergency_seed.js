
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseAnonKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const songsToSeed = [
    {
        title: "Neon Horizon",
        artist_name: "Cyberwave",
        audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        cover_art_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400",
        duration_sec: 372,
        source: "upload",
        status: "pool",
        stars: 5
    },
    {
        title: "Midnight City",
        artist_name: "The Nightcallers",
        audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        cover_art_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
        duration_sec: 425,
        source: "upload",
        status: "pool",
        stars: 5
    },
    {
        title: "Digital Dreams",
        artist_name: "Synth Masters",
        audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        cover_art_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400",
        duration_sec: 340,
        source: "upload",
        status: "pool",
        stars: 5
    }
];

async function seed() {
    console.log("Checking for admin profile...");
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('is_admin', true)
        .limit(1);

    if (pError || !profiles?.length) {
        console.error("No admin profile found to attribute songs to.", pError);
        return;
    }

    const adminId = profiles[0].user_id;
    console.log(`Using Admin ID: ${adminId}`);

    for (const song of songsToSeed) {
        const { error } = await supabase
            .from('songs')
            .insert({ ...song, uploader_id: adminId });

        if (error) console.error(`Failed to insert ${song.title}:`, error);
        else console.log(`Inserted ${song.title}`);
    }
    console.log("✨ Seeding complete.");
}

seed();
