-- Check if tables exist
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if profiles table has data
SELECT COUNT(*) as profile_count FROM profiles;

-- Check if user has profile (replace with your user ID)
SELECT * FROM profiles WHERE email = 'mohsinbhalli147@gmail.com';

-- Check if vehicle_type column exists in inventory_items
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inventory_items' 
AND column_name = 'vehicle_type';

-- Check if category_type column exists in categories
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'categories' 
AND column_name = 'category_type';
