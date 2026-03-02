import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.session) {
        return { tickets: [] };
    }

    // Fetch tickets for the logged in user
    const { data: tickets, error: ticketsErr } = await locals.supabase
        .from('tickets')
        .select('*')
        .eq('supporter_phone', locals.user?.phone?.replace(/\+/g, '') || '') // Match by phone stored in session
        .order('created_at', { ascending: false });

    // Handle the proxy phone format too (919876543210)
    let phoneToMatch = '';
    if (locals.user?.email && locals.user.email.endsWith('@rhapsody.local')) {
        phoneToMatch = locals.user.email.split('@')[0];
    }

    const { data: proxyTickets, error: proxyErr } = await locals.supabase
        .from('tickets')
        .select('*')
        .eq('supporter_phone', phoneToMatch)
        .order('created_at', { ascending: false });

    if (ticketsErr || proxyErr) {
        console.error("Tickets Load Error:", ticketsErr || proxyErr);
        // We don't throw here to allow page to render empty state
    }

    // Combine and deduplicate
    const allTickets = [...(tickets || []), ...(proxyTickets || [])];
    const uniqueTickets = Array.from(new Map(allTickets.map(item => [item.id, item])).values());

    return {
        tickets: uniqueTickets
    };
};
