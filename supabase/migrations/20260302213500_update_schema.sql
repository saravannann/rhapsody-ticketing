-- Update public.tickets to support receipt URL/paths
ALTER TABLE public.tickets ADD COLUMN receipt_path TEXT;

-- Generate Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rhapsody-media', 'rhapsody-media', false) 
ON CONFLICT (id) DO NOTHING;

-- Storage Level Security
-- Allow public buyers to upload their receipt (they do not have an active session context but need write power)
CREATE POLICY "Allow public uploads to rhapsody-media"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'rhapsody-media');

-- We also need to fix our previous RLS that blocked anon public.ticket inserts:
-- Overwrite to permit the /buy page ticket submissions
DROP POLICY IF EXISTS "Organisers can insert tickets" ON public.tickets;

CREATE POLICY "Anyone can insert tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (true);
