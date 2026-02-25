const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecursive() {
    console.log('--- STORAGE RECURSIVE ---');

    // List user_uploads folder
    const { data: uploads, error } = await supabase.storage.from('songs').list('user_uploads', { limit: 100 });
    if (error) return console.log(error);

    for (const folder of uploads) {
        console.log(`Folder: user_uploads/${folder.name}`);
        const { data: files } = await supabase.storage.from('songs').list(`user_uploads/${folder.name}`, { limit: 100 });
        if (files) {
            files.forEach(f => console.log(`  - File: ${f.name}`));
        }
    }
}

checkRecursive();
