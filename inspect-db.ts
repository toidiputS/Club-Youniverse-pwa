import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ktfezfnkghtwbkmhxdyd.supabase.co"
const supabaseKey = "sb_publishable_Cpca6J3OdRz7czjQJN-KeQ_RNFc9QQU"

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    console.log('--- FINAL PROBE ---')
    const { data, error } = await supabase.from('songs').select('*')
    console.log('Error:', error)
    console.log('Data Type:', typeof data)
    console.log('Data Length:', data?.length)
    console.log('Data Content:', JSON.stringify(data))
    process.exit(0)
}

debug()
