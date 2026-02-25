const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    console.log('--- PROFILES CHECK ---');
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) console.log('ERROR:', error);
    else console.log('PROFILES:', data);
}

checkProfiles();
