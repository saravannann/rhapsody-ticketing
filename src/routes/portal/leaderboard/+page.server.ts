import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    // 1. Leaderboard with total confirmed tickets per organiser
    const { data: leaderboard, error: leaderboardErr } = await locals.supabase
        .from('leaderboard_view')
        .select('*')
        .order('confirmed_tickets', { ascending: false });

    if (leaderboardErr) {
        console.error('Leaderboard Page Load Error:', leaderboardErr);
        throw error(500, 'Error loading leaderboard data');
    }

    // 2. Category totals (for column labels)
    const { data: categoryTotals } = await locals.supabase
        .from('category_totals_view')
        .select('*')
        .order('price', { ascending: true });

    // 3. Per-organiser per-category breakdown (includes organiser_category_target)
    const { data: salesBreakdown } = await locals.supabase
        .from('category_sales_breakdown_view')
        .select('*');

    return {
        leaderboard: leaderboard || [],
        categoryTotals: categoryTotals || [],
        salesBreakdown: salesBreakdown || [],
        currentUser: locals.profile   // needed for the share link widget
    };
};
