-- Create custom enums for roles and ticket statuses
CREATE TYPE public.user_role AS ENUM ('Admin', 'Organiser', 'FrontDesk');
CREATE TYPE public.ticket_status AS ENUM ('Pending', 'Booked', 'Checked-in');

-- Create users table (extending native Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'Organiser',
  target_qty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supporter_name TEXT NOT NULL,
  supporter_phone TEXT,
  category TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'Pending',
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create the Leaderboard View to count confirmed tickets ('Booked') by Organiser
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
  u.id AS user_id,
  u.full_name,
  u.role,
  u.target_qty,
  COUNT(t.id) AS confirmed_tickets
FROM 
  public.users u
LEFT JOIN 
  public.tickets t ON t.referred_by = u.id AND t.status = 'Booked'
GROUP BY 
  u.id, u.full_name, u.role, u.target_qty
ORDER BY 
  confirmed_tickets DESC;

-- Basic Security RLS Policies (Example setup)
CREATE POLICY "Users can view their own profile or everyone"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Organisers can insert tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (
    auth.uid() = referred_by OR 
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Admin', 'FrontDesk')
  );

CREATE POLICY "Organisers can view tickets they referred"
  ON public.tickets FOR SELECT
  USING (
    referred_by = auth.uid() OR 
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Admin', 'FrontDesk')
  );
