import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import type { RequestEvent } from './$types';

export const GET = async ({ url }: RequestEvent) => {
    // Read from query params or use defaults
    const rawPhone = url.searchParams.get('phone') || '9876543210';
    // Strip non-digits and construct a robust pseudo-email mapping
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    const pseudoEmail = `${cleanPhone}@rhapsody.local`;

    // We retain the name format without touching the country code directly in the identifier
    const password = url.searchParams.get('pass') || 'admin123';
    const name = url.searchParams.get('name') || 'System Admin';

    // 1. Create the Auth User dynamically using Service Role Key
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: pseudoEmail,
        password,
        email_confirm: true
    });

    if (authErr || !authData.user) {
        return json({ error: authErr?.message || 'Failed to create User Auth Profile. Check your Service Role Key.' }, { status: 400 });
    }

    // 2. Insert into custom Users schema mapping
    const { error: dbErr } = await supabaseAdmin
        .from('users')
        .insert({
            id: authData.user.id,
            full_name: name,
            role: 'Admin',
            target_qty: 0
        });

    if (dbErr) {
        // Rollback on failure
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return json({ error: 'Database Insertion Error: ' + dbErr.message }, { status: 400 });
    }

    return json({
        success: true,
        message: 'Admin account created successfully! You can now log into the Dashboard.',
        login_credentials: {
            phone: cleanPhone,
            password
        }
    });
};
