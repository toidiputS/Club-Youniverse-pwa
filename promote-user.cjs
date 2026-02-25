const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";
const supabase = createClient(supabaseUrl, supabaseKey);

async function promote() {
    const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .match({ name: 'Creator of the Youniverse' });

    if (error) console.log(error);
    else console.log('✅ Creator of the Youniverse is now an Admin.');
}
promote();
