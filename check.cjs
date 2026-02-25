const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('songs').select('*').ilike('title', '%MEET%');
    console.log('SEARCH RESULTS:', data);
    if (error) console.log('ERROR:', error);
}
check();
