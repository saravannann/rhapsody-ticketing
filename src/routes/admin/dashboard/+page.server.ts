import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const load: PageServerLoad = async ({ locals }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;

    // 1. Fetch Pending Tickets merging in the Organiser's name referencing the referred_by uuid
    const { data: pendingTickets, error: ticketsErr } = await locals.supabase
        .from('tickets')
        .select('*, referred_by_user:users!referred_by(full_name)')
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });

    if (ticketsErr) {
        console.error("Dashboard Load Error:", ticketsErr);
        throw error(500, 'Error loading verification queue');
    }

    // 2. Fetch Leaderboard View grouping Confirmed Bookings correctly
    const { data: leaderboard, error: leaderboardErr } = await locals.supabase
        .from('leaderboard_view')
        .select('*')
        .order('confirmed_tickets', { ascending: false });

    if (leaderboardErr) {
        console.error("Dashboard Load Error:", leaderboardErr);
        throw error(500, 'Error loading leaderboard data');
    }

    // 3. Fetch Ticket Category Totals vs Targets
    const { data: categoryTotals, error: totalsErr } = await locals.supabase
        .from('category_totals_view')
        .select('*')
        .order('price', { ascending: true });

    if (totalsErr) {
        console.error("Dashboard Load Error (Totals):", totalsErr);
        throw error(500, 'Error loading event sales totals');
    }

    // 4. Fetch Detailed Breakdown of Sales per Category per Organiser
    const { data: salesBreakdown, error: breakdownErr } = await locals.supabase
        .from('category_sales_breakdown_view')
        .select('*')
        .order('tickets_sold', { ascending: false });

    if (breakdownErr) {
        console.warn("Dashboard Load Warning (Breakdown):", breakdownErr);
    }

    // 5. Fetch all staff users with their per-category targets
    const { data: staffUsers } = await locals.supabase
        .from('users')
        .select('id, full_name, role, created_at, user_category_targets(category_id, target_qty)')
        .in('role', ['Organiser', 'FrontDesk'])
        .order('full_name', { ascending: true });

    return {
        pendingTickets: pendingTickets || [],
        leaderboard: leaderboard || [],
        categoryTotals: categoryTotals || [],
        salesBreakdown: salesBreakdown || [],
        staffUsers: staffUsers || [],
        userProfile: locals.profile,
        supabaseUrl
    };
};

export const actions: Actions = {
    updateCategoryTargets: async ({ request, locals }) => {
        if (locals.profile?.role !== 'Admin') {
            return fail(403, { actionError: 'Unauthorized' });
        }

        const formData = await request.formData();

        // Extract targets for all categories sent in form
        const updates = [];
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('target_')) {
                const categoryId = key.replace('target_', '');
                const targetQty = parseInt(value as string) || 0;

                updates.push(
                    locals.supabase
                        .from('ticket_categories')
                        .update({ target_qty: targetQty })
                        .eq('id', categoryId)
                );
            }
        }

        const results = await Promise.all(updates);
        const hasError = results.some(r => r.error);

        if (hasError) {
            return fail(400, { actionError: 'Failed to update some category targets' });
        }

        return { success: true, message: 'Category targets updated successfully' };
    },

    createUser: async ({ request, locals }) => {
        if (locals.profile?.role !== 'Admin') {
            return fail(403, { actionError: 'Unauthorized' });
        }

        const formData = await request.formData();
        const full_name = formData.get('full_name') as string;
        let phone = formData.get('phone') as string;
        const password = formData.get('password') as string;
        const role = formData.get('role') as string;

        // Collect per-category targets from form fields named target_<categoryId>
        const categoryTargets: { category_id: string; target_qty: number }[] = [];
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('target_')) {
                const categoryId = key.replace('target_', '');
                const qty = parseInt(value as string) || 0;
                if (qty > 0) {
                    categoryTargets.push({ category_id: categoryId, target_qty: qty });
                }
            }
        }

        let cleanPhone = phone ? phone.replace(/\D/g, '') : '';
        if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
        const pseudoEmail = `${cleanPhone}@rhapsody.local`;

        if (!cleanPhone || !full_name || !password || !role) {
            return fail(400, { actionError: 'All fields are required' });
        }

        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: pseudoEmail,
            password,
            email_confirm: true
        });

        if (authErr || !authData.user) {
            return fail(400, { actionError: authErr?.message || 'Failed to create User Auth Profile' });
        }

        const { error: dbErr } = await supabaseAdmin
            .from('users')
            .insert({ id: authData.user.id, full_name, role });

        if (dbErr) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return fail(400, { actionError: 'Database Insertion Error: ' + dbErr.message });
        }

        if (categoryTargets.length > 0) {
            const targetRows = categoryTargets.map(ct => ({
                user_id: authData.user!.id,
                category_id: ct.category_id,
                target_qty: ct.target_qty
            }));
            const { error: targetErr } = await supabaseAdmin
                .from('user_category_targets')
                .insert(targetRows);

            if (targetErr) {
                console.error('Failed to insert category targets:', targetErr.message);
            }
        }

        return { success: true, action: 'created' };
    },

    updateUser: async ({ request, locals }) => {
        if (locals.profile?.role !== 'Admin') {
            return fail(403, { actionError: 'Unauthorized' });
        }

        const formData = await request.formData();
        const user_id = formData.get('user_id') as string;
        const full_name = formData.get('full_name') as string;
        const role = formData.get('role') as string;

        if (!user_id || !full_name || !role) {
            return fail(400, { actionError: 'Missing required fields' });
        }

        // 1. Update the users table
        const { error: updateErr } = await supabaseAdmin
            .from('users')
            .update({ full_name, role })
            .eq('id', user_id);

        if (updateErr) {
            return fail(400, { actionError: 'Failed to update user: ' + updateErr.message });
        }

        // 2. Upsert per-category targets (replace all for this user)
        const categoryTargets: { user_id: string; category_id: string; target_qty: number }[] = [];
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('target_')) {
                const categoryId = key.replace('target_', '');
                categoryTargets.push({
                    user_id,
                    category_id: categoryId,
                    target_qty: parseInt(value as string) || 0
                });
            }
        }

        if (categoryTargets.length > 0) {
            const { error: upsertErr } = await supabaseAdmin
                .from('user_category_targets')
                .upsert(categoryTargets, { onConflict: 'user_id,category_id' });

            if (upsertErr) {
                console.error('Failed to upsert category targets:', upsertErr.message);
            }
        }

        return { success: true, action: 'updated', user_id };
    }
};
