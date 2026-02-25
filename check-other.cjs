const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ksnjoyfsmbkvzqhpjhpr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbmpveWZzbWJrdnpxaHBqaHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNDIzNzYsImV4cCI6MjA3NzcxODM3Nn0.GZ8HiOnUgeMvkZfqewShAiHAQ26_IXqz3_qPALRu7pU";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- PROJECT KSN... ---');
    const { data, error } = await supabase.from('songs').select('*');
    if (error) console.log(error);
    else {
        console.log('Count:', data.length);
        data.forEach(s => console.log(`- [${s.status}] ${s.title}`));
    }
}

check();
