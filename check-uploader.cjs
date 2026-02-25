const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', '248f79f22-5743-4123-88cd-50045d34b4e6');
    console.log('Profile found:', data);

    const { data: all } = await supabase.from('profiles').select('user_id, name');
    console.log('All profiles:', all);
}

check();
