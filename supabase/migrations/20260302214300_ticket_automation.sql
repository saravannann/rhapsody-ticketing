-- 1. Add QR code column to tickets table
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS qr_data TEXT;

-- 2. Create the webhook trigger to call Edge Function automatically on status='Booked'
CREATE OR REPLACE FUNCTION public.handle_ticket_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes from 'Pending' to 'Booked'
  IF NEW.status = 'Booked' AND OLD.status = 'Pending' THEN
    -- Generate simple unique QR data identifying this ticket mathematically
    NEW.qr_data := 'RHA-26-' || split_part(NEW.id::text, '-', 1) || '-' || substr(md5(NEW.id::text || NEW.supporter_phone), 1, 8);
    
    -- Send to Edge Function to dispatch WhatsApp message asynchronously via Supabase net.http
    -- Note: Replacing generic http post with pg_net extension if active, but standard trigger logic for net usage.
    perform net.http_post(
      url:=(current_setting('app.settings.edge_function_base_url')) || '/send-ticket-whatsapp',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body:=jsonb_build_object(
        'ticket_id', NEW.id,
        'supporter_name', NEW.supporter_name,
        'supporter_phone', NEW.supporter_phone,
        'category', NEW.category,
        'qr_data', NEW.qr_data
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Register Trigger
DROP TRIGGER IF EXISTS on_ticket_approved ON public.tickets;
CREATE TRIGGER on_ticket_approved
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_ticket_approval();
