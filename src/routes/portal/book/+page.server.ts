import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    // Use category_totals_view which has both target_qty and total_sold
    const { data: categories, error: categoriesErr } = await locals.supabase
        .from('category_totals_view')
        .select('*')
        .order('price', { ascending: true });

    if (categoriesErr) {
        console.error('Organiser Portal Load Error:', categoriesErr);
        return { categories: [] };
    }

    // Only surface categories that still have availability
    // (target_qty = 0 means no target set — treat as unavailable)
    const available = (categories || []).filter(
        (c) => c.target_qty > 0 && c.total_sold < c.target_qty
    );

    return {
        categories: available,
        currentUser: locals.profile
    };
};
