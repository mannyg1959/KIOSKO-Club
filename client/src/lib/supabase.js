import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

console.log('Supabase Connection:', { url: supabaseUrl, hasKey: !!supabaseKey });

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration!');
}

// Configure Supabase with standard persistence and auto-refresh to prevent connection hangs
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true, // Restore persistence to prevent loss of state
        autoRefreshToken: true, // CRITICAL: This fixes the "hanging after a few seconds" issue by keeping the token alive
        detectSessionInUrl: true
    }
})
