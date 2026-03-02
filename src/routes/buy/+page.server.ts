import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
    // Use category_totals_view which has both target_qty and total_sold
    const { data: categories, error: categoriesErr } = await locals.supabase
        .from('category_totals_view')
        .select('*')
        .order('price', { ascending: true });

    if (categoriesErr) {
        console.error('Buy Page Load Error:', categoriesErr);
        return { categories: [], referrerName: null };
    }

    // Only surface categories that still have availability
    // (target_qty = 0 means no target set — treat as unavailable)
    const available = (categories || []).filter(
        (c) => c.target_qty > 0 && c.total_sold < c.target_qty
    );

    // If a referrer ID is in the URL, fetch their name to personalise the banner
    const refId = url.searchParams.get('ref');
    let referrerName: string | null = null;

    if (refId) {
        const { data: referrer } = await locals.supabase
            .from('users')
            .select('full_name')
            .eq('id', refId)
            .single();

        referrerName = referrer?.full_name ?? null;
    }

    return {
        categories: available,
        referrerName,
        currentUser: locals.profile ?? null
    };
};
