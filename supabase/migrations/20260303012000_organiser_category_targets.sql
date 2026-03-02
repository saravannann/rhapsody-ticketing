-- ============================================================
-- Organiser-level per-category sales targets
-- Replaces the single target_qty on public.users
-- ============================================================

-- 1. Create the junction table
CREATE TABLE IF NOT EXISTS public.user_category_targets (
  user_id     UUID    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id TEXT    NOT NULL REFERENCES public.ticket_categories(id) ON DELETE CASCADE,
  target_qty  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, category_id)
);

-- Enable RLS
ALTER TABLE public.user_category_targets ENABLE ROW LEVEL SECURITY;

-- Everyone can read targets (needed for leaderboard display)
CREATE POLICY "Public read on user_category_targets"
  ON public.user_category_targets FOR SELECT
  USING (true);

-- Only admins can insert / update targets
CREATE POLICY "Admins can manage user_category_targets"
  ON public.user_category_targets FOR ALL
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin'
  );

-- ============================================================
-- 2. Rebuild leaderboard_view to use per-category targets
--    total_target = SUM of all category targets for that user
-- ============================================================
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
  u.id                                          AS user_id,
  u.full_name,
  u.role,
  COALESCE(SUM(uct.target_qty), 0)::INTEGER    AS target_qty,   -- kept for backward compat
  COUNT(t.id)                                   AS confirmed_tickets
FROM
  public.users u
LEFT JOIN
  public.tickets t ON t.referred_by = u.id AND t.status = 'Booked'
LEFT JOIN
  public.user_category_targets uct ON uct.user_id = u.id
GROUP BY
  u.id, u.full_name, u.role
ORDER BY
  confirmed_tickets DESC;

-- ============================================================
-- 3. Re-create category_sales_breakdown_view to include
--    per-organiser per-category targets alongside actual sales
-- ============================================================
CREATE OR REPLACE VIEW public.category_sales_breakdown_view AS
SELECT
    t.category                                          AS category_id,
    COALESCE(u.full_name, 'Misc / Direct Public')      AS organiser_name,
    COALESCE(u.id::text, 'misc')                       AS organiser_id,
    COUNT(t.id)                                         AS tickets_sold,
    SUM(t.amount)                                       AS total_revenue,
    COALESCE(uct.target_qty, 0)                         AS organiser_category_target
FROM
    public.tickets t
LEFT JOIN
    public.users u ON t.referred_by = u.id
LEFT JOIN
    public.user_category_targets uct
        ON uct.user_id = u.id AND uct.category_id = t.category
WHERE
    t.status = 'Booked'
GROUP BY
    t.category, organiser_name, organiser_id, uct.target_qty;
