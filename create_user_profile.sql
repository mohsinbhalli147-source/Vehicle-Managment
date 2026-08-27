-- Create profile for the authenticated user
-- Replace 'your-email@example.com' with your actual email

INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'your-email@example.com'),
    'your-email@example.com',
    'Admin User',
    'admin',
    true
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
