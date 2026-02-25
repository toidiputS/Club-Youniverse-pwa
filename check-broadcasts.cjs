const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('broadcasts').select('*');
    if (error) console.log('ERROR:', error);
    else console.log('BROADCASTS:', JSON.stringify(data, null, 2));
}
check();
