require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive() {
    console.log('Sending keep-alive ping to Supabase...');
    try {
        // A simple lightweight query to keep the database awake
        const { data, error } = await supabase.from('settings').select('key').limit(1);

        if (error) {
            console.error('Error querying database:', error);
            process.exit(1);
        }

        console.log('Supabase ping successful! Database is awake.');
    } catch (error) {
        console.error('Unexpected error:', error);
        process.exit(1);
    }
}

keepAlive();
