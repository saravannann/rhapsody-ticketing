import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    login: async ({ request, locals, url }) => {
        const formData = await request.formData();
        let phone = formData.get('phone') as string;
        const password = formData.get('password') as string;

        // Strip non-digits and reliably parse the mobile number with country code
        let cleanPhone = phone ? phone.replace(/\D/g, '') : '';
        if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
        const pseudoEmail = `${cleanPhone}@rhapsody.local`;

        if (!cleanPhone || !password) {
            return fail(400, { error: 'Mobile number and password are required' });
        }

        // Bypass Supabase's native Phone Auth requirement by using a virtual email
        const { data, error } = await locals.supabase.auth.signInWithPassword({
            email: pseudoEmail,
            password
        });

        if (error) {
            console.error('Login Error:', error.message);
            return fail(400, { error: error.message });
        }

        const user = data.user;

        if (user) {
            // Fetch profile including role for redirection
            const { data: profile } = await locals.supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile) {
                console.log(`Login successful for ${user.id} (Role: ${profile.role})`);
                if (profile.role === 'Admin') throw redirect(303, '/admin/dashboard');
                if (profile.role === 'Organiser') throw redirect(303, '/portal/book');
                if (profile.role === 'FrontDesk') throw redirect(303, '/scan');
            }
        }

        // Fallback for generic users
        throw redirect(303, '/tickets');
    },
    logout: async ({ locals }) => {
        await locals.supabase.auth.signOut();
        throw redirect(303, '/');
    }
};
