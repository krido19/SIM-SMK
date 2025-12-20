
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkStudent() {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('nis', '2324061')
        .single();

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Student found:', data);
    }
}

checkStudent();
