import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw redirect(303, '/login?redirectTo=/scan');
    }

    // Only FrontDesk and Admin can access the scanner
    if (!['FrontDesk', 'Admin'].includes(locals.profile?.role ?? '')) {
        throw redirect(303, '/portal');
    }

    return {
        profile: locals.profile
    };
};
