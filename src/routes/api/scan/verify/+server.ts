import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const POST: RequestHandler = async ({ request, locals }) => {
    // Guard: only FrontDesk or Admin can scan
    const role = locals.profile?.role ?? '';
    if (!locals.user || !['FrontDesk', 'Admin'].includes(role)) {
        return json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { qr_data, isOfflineSync } = body;

    if (!qr_data) {
        return json({ error: 'Missing QR data' }, { status: 400 });
    }

    // Fetch the ticket using supabaseAdmin so schema cache issues don't affect reads
    const { data: ticket, error: fetchErr } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('qr_data', qr_data)
        .single();

    if (fetchErr || !ticket) {
        console.error('[scan/verify] fetch error:', fetchErr);
        return json({ error: 'Invalid ticket — QR code not recognised', code: 'INVALID' }, { status: 404 });
    }

    // --- Duplicate scan: already checked in ---
    if (ticket.status === 'Checked-in') {
        // checked_in_at may be null if the column migration has not been applied yet.
        // We return it raw and let the client decide how to display it.
        return json({
            error: 'Already Checked-in',
            code: 'DUPLICATE',
            ticket,
            checked_in_at: ticket.checked_in_at ?? null
        }, { status: 409 });
    }

    // --- Not yet approved ---
    if (ticket.status !== 'Booked') {
        return json({
            error: `Ticket not approved yet (Status: ${ticket.status})`,
            code: 'NOT_BOOKED',
            ticket
        }, { status: 400 });
    }

    // --- Happy path: mark as Checked-in ---
    // Use supabaseAdmin to guarantee the update bypasses RLS and lands correctly.
    const now = new Date().toISOString();

    const { data: updatedTicket, error: updateErr } = await supabaseAdmin
        .from('tickets')
        .update({ status: 'Checked-in', checked_in_at: now })
        .eq('id', ticket.id)
        .select()
        .single();

    if (updateErr) {
        console.error('[scan/verify] update error:', updateErr);
        // If the column doesn't exist yet, fall back to updating just the status
        if (updateErr.message?.includes('checked_in_at')) {
            const { error: fallbackErr } = await supabaseAdmin
                .from('tickets')
                .update({ status: 'Checked-in' })
                .eq('id', ticket.id);

            if (fallbackErr) {
                return json({ error: fallbackErr.message, code: 'DB_ERROR' }, { status: 500 });
            }
            // Admitted but without timestamp — column migration not applied yet
            return json({
                success: true,
                code: 'ADMITTED',
                ticket: { ...ticket, status: 'Checked-in' },
                checked_in_at: now,  // use the JS time as best-effort
                offlineSynced: isOfflineSync ?? false,
                warning: 'checked_in_at column missing — run migration 20260303013000'
            });
        }
        return json({ error: updateErr.message, code: 'DB_ERROR' }, { status: 500 });
    }

    return json({
        success: true,
        code: 'ADMITTED',
        ticket: updatedTicket,
        checked_in_at: updatedTicket.checked_in_at ?? now,  // prefer DB value, fall back to JS time
        offlineSynced: isOfflineSync ?? false
    });
};
