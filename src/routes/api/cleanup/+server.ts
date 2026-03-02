import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import type { RequestEvent } from './$types';

export const GET = async ({ url }: RequestEvent) => {
    // Read from query params
    const rawPhone = url.searchParams.get('phone');

    if (!rawPhone) {
        return json({ error: 'Please provide a phone number to delete (e.g., ?phone=9876543210)' }, { status: 400 });
    }

    // Strip non-digits to match how we construct the pseudo-email proxy
    let cleanPhone = rawPhone.replace(/\D/g, '');

    // Account for both the legacy proxy standard and the new global +91 standard
    let modernPhone = cleanPhone;
    if (modernPhone.length === 10) modernPhone = '91' + modernPhone;

    let targetEmailModern = `${modernPhone}@rhapsody.local`;
    let targetEmailLegacy = `${cleanPhone}@rhapsody.local`;

    // Fetch all users to find the matching UUID
    const { data, error: listErr } = await supabaseAdmin.auth.admin.listUsers();

    if (listErr || !data.users) {
        return json({ error: listErr?.message || 'Failed to list users from Auth.' }, { status: 400 });
    }

    // Find the user whose email matches our virtual proxy variants
    const userToDelete = data.users.find(u => {
        return u.email === targetEmailModern || u.email === targetEmailLegacy || u.phone === rawPhone;
    });

    if (!userToDelete) {
        return json({ error: `Could not find an account registered to ${rawPhone}` }, { status: 404 });
    }

    // Delete the Auth User. 
    // Because your 'public.users' table uses ON DELETE CASCADE referencing auth.users(id), 
    // this will automatically wipe their custom dashboard profile simultaneously!
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);

    if (deleteErr) {
        return json({ error: 'Failed to delete user: ' + deleteErr.message }, { status: 400 });
    }

    return json({
        success: true,
        message: `Admin / User account associated with ${rawPhone} has been permanently deleted!`,
        deleted_uuid: userToDelete.id
    });
};
