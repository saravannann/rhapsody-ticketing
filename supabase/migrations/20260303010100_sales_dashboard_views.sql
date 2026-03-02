-- 1. Detailed breakdown including 'Misc' for direct public sales
CREATE OR REPLACE VIEW public.category_sales_breakdown_view AS
SELECT 
    t.category as category_id,
    COALESCE(u.full_name, 'Misc / Direct Public') as organiser_name,
    COALESCE(u.id::text, 'misc') as organiser_id,
    COUNT(t.id) as tickets_sold,
    SUM(t.amount) as total_revenue
FROM 
    public.tickets t
LEFT JOIN 
    public.users u ON t.referred_by = u.id
WHERE 
    t.status = 'Booked'
GROUP BY 
    t.category, organiser_name, organiser_id;

-- 2. Aggregated category sales to compare against targets
CREATE OR REPLACE VIEW public.category_totals_view AS
SELECT 
    tc.id as category_id,
    tc.name as category_name,
    tc.target_qty,
    tc.price,
    COALESCE(SUM(t.tickets_sold), 0) as total_sold,
    COALESCE(SUM(t.total_revenue), 0) as total_revenue
FROM 
    public.ticket_categories tc
LEFT JOIN 
    public.category_sales_breakdown_view t ON t.category_id = tc.id
GROUP BY 
    tc.id, tc.name, tc.target_qty, tc.price;
