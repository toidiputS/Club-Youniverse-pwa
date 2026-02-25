const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    console.log('--- STORAGE CHECK ---');
    const { data, error } = await supabase.storage.from('songs').list('', { limit: 100 });

    if (error) {
        console.log('STORAGE ERROR:', error);
    } else {
        console.log('STORAGE FILES:', data.length);
        data.forEach(f => console.log(`- ${f.name}`));
    }

    console.log('\n--- DB CHECK ---');
    const { data: dbData, error: dbError } = await supabase.from('songs').select('*');
    if (dbError) {
        console.log('DB ERROR:', dbError);
    } else {
        console.log('DB ROWS:', dbData.length);
        dbData.forEach(r => console.log(`- [${r.status}] ${r.title}`));
    }
}

checkStorage();
