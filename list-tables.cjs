const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co";
const supabaseKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU";

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('--- TABLE LIST ---');
    // We can't list tables directly with the client but we can try to query the information_schema via RPC if it exists,
    // or just try common names.
    // Better yet, let's just try to query 'songs' and see if we get ANY rows by removing any filters.
    const { data, error } = await supabase.from('songs').select('*');
    if (error) {
        console.log('Error querying songs:', error);
    } else {
        console.log('Songs columns:', data.length > 0 ? Object.keys(data[0]) : 'No data');
        console.log('Row count:', data.length);
    }
}

listTables();
