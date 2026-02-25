const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const song = {
        title: "TEST SONG",
        artist_name: "TESTER",
        audio_url: "https://example.com/test.mp3",
        status: 'pool',
        uploader_id: "55a54dc5-a67f-488f-a951-60a560f701c9",
        source: 'upload'
    };

    console.log('Inserting song...');
    const { data, error } = await supabase.from('songs').insert(song).select();

    if (error) {
        console.log('INSERT ERROR:', JSON.stringify(error, null, 2));
    } else {
        console.log('INSERT SUCCESS:', data);
    }
}

testInsert();
