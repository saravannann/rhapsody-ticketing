import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

// Lazy singleton — the client is only created on first use (at request time),
// never at module-load / build-analysis time. This prevents Vercel build crashes
// when env vars haven't been injected yet during the analyse phase.
let _admin: ReturnType<typeof createClient> | null = null;

function getAdmin() {
    if (!_admin) {
        const url = publicEnv.PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL;
        const key = env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            throw new Error(
                '[supabaseAdmin] Missing env vars: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.'
            );
        }

        _admin = createClient(url, key, {
            auth: { autoRefreshToken: false, persistSession: false }
        });
    }
    return _admin;
}

// Proxy so existing code can keep calling `supabaseAdmin.from(...)` unchanged
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
    get(_: unknown, prop: string) {
        return (getAdmin() as Record<string, unknown>)[prop];
    }
});
