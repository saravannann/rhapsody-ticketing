-- ============================================================
-- Test Ticket Seed — run in Supabase SQL Editor
-- Creates one Booked ticket with a known QR code for scanning
-- ============================================================

-- 1. Insert a test ticket directly with a known QR value
INSERT INTO public.tickets (
  id,
  supporter_name,
  supporter_phone,
  category,
  amount,
  status,
  qr_data,
  receipt_path,
  referred_by,
  created_at
)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Test Attendee',
  '9999999999',
  'Platinum',
  500.00,
  'Booked',
  'RHA-26-MOCK0001-testdata',   -- ← this is what the QR encodes
  NULL,
  NULL,
  NOW()
)
ON CONFLICT (id) DO UPDATE
  SET status   = 'Booked',
      qr_data  = 'RHA-26-MOCK0001-testdata',
      checked_in_at = NULL;   -- reset if previously checked-in

-- Verify
SELECT id, supporter_name, category, status, qr_data, checked_in_at
  FROM public.tickets
 WHERE id = 'a1b2c3d4-0000-0000-0000-000000000001';
