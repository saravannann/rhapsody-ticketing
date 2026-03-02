import { createServerClient } from '@supabase/ssr';
import { type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

    event.locals.supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll: () => event.cookies.getAll(),
            setAll: (cookiesToSet) => {
                cookiesToSet.forEach(({ name, value, options }) => {
                    event.cookies.set(name, value, { ...options, path: '/' });
                });
            }
        }
    });

    // Helper to get session securely
    event.locals.safeGetSession = async () => {
        const {
            data: { session },
        } = await event.locals.supabase.auth.getSession();

        if (!session) return { session: null, user: null };

        const {
            data: { user },
            error
        } = await event.locals.supabase.auth.getUser();

        if (error) return { session: null, user: null };

        return { session, user };
    };

    const { session, user } = await event.locals.safeGetSession();
    event.locals.session = session;
    event.locals.user = user;
    event.locals.profile = null;

    // Fetch user profile to check role
    if (user) {
        const { data: profile } = await event.locals.supabase
            .from('users')
            .select('id, role, full_name')
            .eq('id', user.id)
            .single();

        if (profile) {
            event.locals.profile = profile;
        }
    }

    // --------------------------------------------------------------------------
    // INTERCEPTOR: Detect Organiser & automatically assign referred_by for tickets
    // --------------------------------------------------------------------------
    if (
        event.locals.profile?.role === 'Organiser' &&
        event.request.method === 'POST' &&
        event.url.pathname === '/api/tickets'
    ) {
        const clonedReq = event.request.clone();
        try {
            // Assuming an API route receiving JSON
            const body = await clonedReq.json();
            // Explicitly enforce the Organiser's ID
            body.referred_by = event.locals.profile.id;

            // Replace the original request with our intercepted one
            event.request = new Request(event.request.url, {
                method: 'POST',
                headers: event.request.headers,
                body: JSON.stringify(body)
            });
        } catch (err) {
            // If it's FormData, handle it here (fallback logic)
            const formData = await event.request.clone().formData();
            formData.set('referred_by', event.locals.profile.id);

            event.request = new Request(event.request.url, {
                method: 'POST',
                headers: event.request.headers,
                body: formData
            });
        }
    }

    return resolve(event, {
        filterSerializedResponseHeaders(name) {
            // SvelteKit requires this for supabase ssr cookies to pass through
            return name === 'content-range' || name === 'x-supabase-api-version';
        }
    });
};
