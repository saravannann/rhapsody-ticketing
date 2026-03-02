// Edge Function for WhatsApp QR Ticketing generated from Conversation 30293ca0-7947-4a21-a4ff-978f615fec49
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WHATSAPP_API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN") ?? "";
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";

serve(async (req) => {
  try {
    const payload = await req.json();

    const { ticket_id, supporter_name, supporter_phone, category, qr_data } = payload;

    // Quick validation
    if (!ticket_id || !supporter_phone || !qr_data) {
      return new Response(JSON.stringify({ error: "Missing payload data" }), { status: 400 });
    }

    // Format phone number to clean E.164 without '+'
    const recipientPhone = supporter_phone.replace(/\D/g, "");

    console.log(`Sending WhatsApp Ticket confirmation for: ${ticket_id} to ${recipientPhone}`);

    // Call official Meta WhatsApp Cloud API
    const whatsappResponse = await fetch(`https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipientPhone,
        type: "template",
        template: {
          // You must have approved this template name 'rhapsody_ticket_confirmation' in Meta BM
          name: "rhapsody_ticket_confirmation",
          language: {
            code: "en"
          },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "text",
                  text: supporter_name
                }
              ]
            },
            {
              type: "body",
              parameters: [
                { "type": "text", "text": category },
                { "type": "text", "text": qr_data }
              ]
            }
          ]
        }
      })
    });

    const responseText = await whatsappResponse.text();

    if (!whatsappResponse.ok) {
      console.error(`WhatsApp API Error: ${responseText}`);
      return new Response(JSON.stringify({ error: responseText }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, message_id: JSON.parse(responseText).messages?.[0]?.id }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
