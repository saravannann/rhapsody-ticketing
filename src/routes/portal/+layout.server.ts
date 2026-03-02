import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    // Must be logged in to access the organiser portal
    if (!locals.user) {
        throw redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }

    // Admins have their own dashboard — redirect them there
    if (locals.profile?.role === 'Admin') {
        throw redirect(303, '/admin/dashboard');
    }

    // FrontDesk only has the scanner — redirect away from the full portal
    if (locals.profile?.role === 'FrontDesk') {
        throw redirect(303, '/scan');
    }

    return {};
};
