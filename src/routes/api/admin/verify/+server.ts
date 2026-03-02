import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
    const body = await request.json();

    if (!body.ticket_id || !body.status) {
        return json({ error: 'Missing Required Ticket Parameters' }, { status: 400 });
    }

    // For security, checking is done dynamically via PostgREST RLS in the database.
    const { data, error } = await locals.supabase
        .from('tickets')
        .update({ status: body.status })
        .eq('id', body.ticket_id)
        .select()
        .single();

    if (error) {
        return json({ error: error.message }, { status: 500 });
    }

    return json({ success: true, verifiedData: data });
};
