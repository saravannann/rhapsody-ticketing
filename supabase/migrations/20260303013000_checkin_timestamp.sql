-- Add check-in timestamp to tickets so we can show "Already Checked-in at HH:MM"
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- Backfill: any ticket already in Checked-in state gets now() as placeholder
UPDATE public.tickets
  SET checked_in_at = NOW()
  WHERE status = 'Checked-in' AND checked_in_at IS NULL;

-- CRITICAL: force PostgREST to reload its schema cache so it knows about the new column.
-- Without this, supabase-js silently ignores checked_in_at in UPDATE calls.
NOTIFY pgrst, 'reload schema';

-- Strengthen the FrontDesk update RLS policy to include WITH CHECK
-- (a USING-only policy can block writes in strict PostgREST evaluation)
DROP POLICY IF EXISTS "FrontDesk and Admins can update ticket status" ON public.tickets;

CREATE POLICY "FrontDesk and Admins can update ticket status"
  ON public.tickets FOR UPDATE
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Admin', 'FrontDesk')
  )
  WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Admin', 'FrontDesk')
  );
