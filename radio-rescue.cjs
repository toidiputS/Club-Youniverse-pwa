const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";
const supabase = createClient(supabaseUrl, supabaseKey);

async function radioRescue() {
    console.log('🚀 STARTING RADIO RESCUE...');

    const folderPath = 'user_uploads/248f79f22-5743-4123-88cd-50045d34b4e6';
    console.log(`📡 Scanning: ${folderPath}`);

    const { data: files, error: storageErr } = await supabase.storage.from('songs').list(folderPath, { limit: 100 });

    if (storageErr) return console.error('Storage Error:', storageErr);
    if (!files) return console.log('No files found.');

    const mp3s = files.filter(f => f.name.endsWith('.mp3'));
    console.log(`✅ Found ${mp3s.length} MP3 files in storage.`);

    const { data: dbSongs } = await supabase.from('songs').select('audio_url');
    const existingUrls = new Set(dbSongs?.map(s => s.audio_url) || []);

    let added = 0;
    for (const file of mp3s) {
        // Note: getPublicUrl usually needs the full path from the bucket root
        const fullPath = `${folderPath}/${file.name}`;
        const { data: { publicUrl } } = supabase.storage.from('songs').getPublicUrl(fullPath);

        if (!existingUrls.has(publicUrl)) {
            console.log(`➕ Syncing: ${file.name}`);
            const { error: insErr } = await supabase.from('songs').insert({
                title: `Song ${file.name}`,
                artist_name: "The Creator",
                audio_url: publicUrl,
                status: 'pool',
                uploader_id: "55a54dc5-a67f-488f-a951-60a560f701c9",
                source: 'upload',
                duration_sec: 240,
                stars: 5
            });
            if (insErr) console.error(`Failed to insert ${file.name}:`, insErr);
            else added++;
        }
    }
    console.log(`✅ Added ${added} songs to the database.`);
    process.exit(0);
}

radioRescue();
