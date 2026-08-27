-- Add vehicle_type column to inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS vehicle_type TEXT NOT NULL DEFAULT 'Bike';

-- Add category_type column to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS category_type TEXT NOT NULL DEFAULT 'vehicle';

-- Add index for vehicle_type for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_vehicle_type ON inventory_items(vehicle_type);

-- Add index for category_type for better performance
CREATE INDEX IF NOT EXISTS idx_categories_category_type ON categories(category_type);
