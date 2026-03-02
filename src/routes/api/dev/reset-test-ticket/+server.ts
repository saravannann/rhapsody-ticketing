import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

const TEST_TICKET_ID = 'a1b2c3d4-0000-0000-0000-000000000001';

// Dev-only endpoint — resets the test ticket back to Booked so you can scan again
export const POST: RequestHandler = async () => {
    const { error } = await supabaseAdmin
        .from('tickets')
        .update({ status: 'Booked', checked_in_at: null })
        .eq('id', TEST_TICKET_ID);

    if (error) {
        return json({ error: error.message }, { status: 500 });
    }

    return json({ success: true, message: 'Test ticket reset to Booked' });
};
