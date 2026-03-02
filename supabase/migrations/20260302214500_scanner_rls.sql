-- Add specific update policies for Front Desk and Admin to modify tickets
CREATE POLICY "FrontDesk and Admins can update ticket status"
  ON public.tickets FOR UPDATE
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Admin', 'FrontDesk')
  );
