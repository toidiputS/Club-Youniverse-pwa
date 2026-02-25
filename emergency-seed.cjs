const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";

const supabase = createClient(supabaseUrl, supabaseKey);

const songs = [
    {
        title: "Neon Horizon",
        artist_name: "Cyberwave",
        audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        cover_art_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400",
        duration_sec: 372,
        uploader_id: "00000000-0000-0000-0000-000000000000", // Using a dummy UUID
        status: "pool",
        stars: 5,
        play_count: 0,
        source: "upload",
    },
    {
        title: "Midnight City",
        artist_name: "The Nightcallers",
        audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        cover_art_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
        duration_sec: 425,
        uploader_id: "00000000-0000-0000-0000-000000000000",
        status: "pool",
        stars: 5,
        play_count: 0,
        source: "upload",
    },
    {
        title: "Digital Dreams",
        artist_name: "Synth Masters",
        audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        cover_art_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400",
        duration_sec: 340,
        uploader_id: "00000000-0000-0000-0000-000000000000",
        status: "pool",
        stars: 5,
        play_count: 0,
        source: "upload",
    }
];

async function seed() {
    console.log('🌱 Seeding EMERGENCY tracks...');

    // First, ensure the dummy uploader exists in profiles
    const { error: profErr } = await supabase.from('profiles').upsert([{
        user_id: "00000000-0000-0000-0000-000000000000",
        name: "SYSTEM_EMERGENCY",
        is_admin: true
    }]);
    if (profErr) console.log('Profile Upsert Error:', profErr);

    for (const s of songs) {
        const { data, error } = await supabase.from('songs').insert(s).select();
        if (error) console.log(`Error inserting ${s.title}:`, error);
        else console.log(`Inserted ${s.title}`);
    }
}

seed();
