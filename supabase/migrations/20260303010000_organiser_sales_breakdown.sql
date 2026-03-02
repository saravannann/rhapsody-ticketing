-- Create a view for detailed organiser sales breakdown by category
CREATE OR REPLACE VIEW public.organiser_category_sales_view AS
SELECT 
    u.id as user_id,
    u.full_name,
    t.category,
    COUNT(t.id) as tickets_sold,
    SUM(t.amount) as total_revenue
FROM 
    public.users u
JOIN 
    public.tickets t ON t.referred_by = u.id
WHERE 
    t.status = 'Booked'
GROUP BY 
    u.id, u.full_name, t.category
ORDER BY 
    u.id, t.category;
