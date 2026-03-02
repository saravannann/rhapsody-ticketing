import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
    // Let's resolve the form data sent by the frontend
    const formData = await request.formData();

    const supporter_name = formData.get('supporter_name')?.toString();
    const supporter_phone = formData.get('supporter_phone')?.toString();
    const category = formData.get('category')?.toString();
    const amount = parseFloat(formData.get('amount')?.toString() || '0');
    const quantity = parseInt(formData.get('quantity')?.toString() || '1');
    const referred_by = formData.get('referred_by')?.toString();
    const receipt = formData.get('receipt') as File | null;

    if (!supporter_name || !category || !amount) {
        return json({ error: 'Missing required fields' }, { status: 400 });
    }

    let receipt_path = null;

    // Process and upload the receipt if we have one
    if (receipt && receipt.size > 0 && (receipt.name || (receipt as any).name)) {
        const fileExt = (receipt.name || (receipt as any).name).split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `receipts/${fileName}`;

        // Push to the public storage bucket configured in SQL migrations
        const { error: uploadError } = await locals.supabase.storage
            .from('rhapsody-media')
            .upload(filePath, receipt);

        if (!uploadError) {
            receipt_path = filePath;
        } else {
            console.error('Storage Upload Error:', uploadError);
        }
    }

    // Split the amount among all tickets for granular tracking
    const perTicketAmount = amount / quantity;

    const ticketsToInsert = Array.from({ length: quantity }).map(() => {
        const ticket: any = {
            supporter_name,
            supporter_phone,
            category,
            amount: perTicketAmount,
            status: 'Pending',
            receipt_path
        };
        if (referred_by) ticket.referred_by = referred_by;
        return ticket;
    });

    // Insert ticket records into Supabase
    const { data: insertedTickets, error: insertError } = await locals.supabase
        .from('tickets')
        .insert(ticketsToInsert)
        .select();

    if (insertError) {
        return json({ error: insertError.message }, { status: 500 });
    }

    return json({ success: true, count: insertedTickets?.length || 0 });
};
