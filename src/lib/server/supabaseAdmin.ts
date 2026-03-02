import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

// This client uses the Service Role Key, allowing it to bypass RLS and perform Admin actions (like creating auth users).
// It should NEVER be exposed to the client-side.
export const supabaseAdmin = createClient(
    publicEnv.PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || '',
    env.SUPABASE_SERVICE_ROLE_KEY || ''
);
