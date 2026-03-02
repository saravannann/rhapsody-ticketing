-- Create ticket_categories table
CREATE TABLE IF NOT EXISTS public.ticket_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  description TEXT,
  target_qty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read categories (needed for the booking form)
CREATE POLICY "Allow public read-only access to categories"
  ON public.ticket_categories FOR SELECT
  USING (true);

-- Only Admins can modify categories
CREATE POLICY "Admins can manage categories"
  ON public.ticket_categories FOR ALL
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin'
  );

-- Insert initial categories
INSERT INTO public.ticket_categories (id, name, price, description, target_qty)
VALUES 
  ('Student', 'Student Pass', 200, 'Special accessible rate for students with ID', 100),
  ('Bulk', 'Bulk Tickets', 500, 'Discounted rate for group bookings', 200),
  ('Platinum', 'Platinum Pass', 500, 'General access to the fundraiser event', 300),
  ('Donor', 'Donor Pass', 1000, 'Premium seating and exclusive access', 50)
ON CONFLICT (id) DO NOTHING;
