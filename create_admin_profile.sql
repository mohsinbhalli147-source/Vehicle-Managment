-- Create admin profile for mohsinbhalli147@gmail.com
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'mohsinbhalli147@gmail.com'),
    'mohsinbhalli147@gmail.com',
    'Mohsin Halli',
    'admin',
    true
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
