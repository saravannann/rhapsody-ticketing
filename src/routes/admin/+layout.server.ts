import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    // If no session at all → send to login
    if (!locals.user) {
        throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }

    // If logged in but NOT an Admin → send to their appropriate portal
    if (locals.profile?.role !== 'Admin') {
        throw redirect(303, '/portal');
    }

    return {};
};
