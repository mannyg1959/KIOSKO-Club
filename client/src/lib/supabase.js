import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

console.log('Supabase Connection:', { url: supabaseUrl, hasKey: !!supabaseKey });

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration!');
}

// Configure Supabase to NOT persist sessions - force login every time
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false, // This forces users to login every time
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
})
