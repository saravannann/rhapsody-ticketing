import { createClient } from '@supabase/supabase-js';

// Uses process.env directly — works at both build time and runtime on Vercel.
// Falls back to a dummy URL/key so the module loads cleanly during SvelteKit's
// post-build analyse phase even when env vars haven't been injected yet.
// Real requests will always have proper values set in Vercel's environment settings.

const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.PUBLIC_SUPABASE_URL ||
    'https://placeholder-build-only.supabase.co'; // safe dummy for build phase

const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'placeholder-build-only-key'; // safe dummy for build phase

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});
