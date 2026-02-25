const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data } = await supabase.from('profiles').select('user_id, name, is_admin');
    console.log(JSON.stringify(data, null, 2));
}
check();
