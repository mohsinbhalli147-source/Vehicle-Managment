
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables and types (for re-running migration)
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS business_settings CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS rentals CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS item_status CASCADE;
DROP TYPE IF EXISTS rental_status CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS log_activity() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'staff');
CREATE TYPE item_status AS ENUM ('available', 'sold', 'reserved', 'maintenance');
CREATE TYPE rental_status AS ENUM ('active', 'returned', 'overdue');

-- Users table (extends Supabase auth)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    role user_role DEFAULT 'staff',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Categories table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    category_type TEXT NOT NULL DEFAULT 'vehicle', -- 'vehicle', 'parts', 'batteries', 'other'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inventory items table
CREATE TABLE inventory_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Basic Information
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    model_year INTEGER,
    color TEXT,
    
    -- Vehicle Information
    chassis_number TEXT UNIQUE,
    engine_number TEXT,
    registration_number TEXT UNIQUE,
    mileage DECIMAL(10, 2),
    
    -- Vehicle Type
    vehicle_type TEXT NOT NULL, -- 'Bike', 'Rickshaw', 'Battery', 'Body Parts', 'Other'
    
    -- Purchase Information
    supplier TEXT,
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    
    -- Sale Information
    sale_price DECIMAL(12, 2),
    
    -- Other
    images TEXT[], -- Array of image URLs
    documents TEXT[], -- Array of document URLs
    notes TEXT,
    
    -- Status
    status item_status DEFAULT 'available',
    
    -- Tracking
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Customers table
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    cnic TEXT UNIQUE,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sales table
CREATE TABLE sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    
    sale_price DECIMAL(12, 2) NOT NULL,
    received_amount DECIMAL(12, 2) DEFAULT 0,
    remaining_amount DECIMAL(12, 2) DEFAULT 0,
    
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Tracking
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Rentals table
CREATE TABLE rentals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rental_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    
    start_date DATE NOT NULL,
    expected_return_date DATE,
    actual_return_date DATE,
    
    rent_amount DECIMAL(12, 2) NOT NULL,
    security_deposit DECIMAL(12, 2) DEFAULT 0,
    received_amount DECIMAL(12, 2) DEFAULT 0,
    remaining_amount DECIMAL(12, 2) DEFAULT 0,
    
    status rental_status DEFAULT 'active',
    notes TEXT,
    
    -- Tracking
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Payments table
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    amount DECIMAL(12, 2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    notes TEXT,
    
    -- Tracking
    received_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Expenses table
CREATE TABLE expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    category TEXT NOT NULL, -- e.g., 'Repair', 'Transport', 'Maintenance'
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL,
    
    -- Tracking
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Activity log table
CREATE TABLE activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    action TEXT NOT NULL, -- e.g., 'New Bike Added', 'Honda CD70 Sold', 'Payment Received'
    entity_type TEXT NOT NULL, -- e.g., 'inventory', 'sale', 'rental', 'payment'
    entity_id UUID,
    description TEXT,
    
    -- Tracking
    performed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Business settings table
CREATE TABLE business_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shop_name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    currency TEXT DEFAULT 'PKR',
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_chassis ON inventory_items(chassis_number);
CREATE INDEX idx_inventory_items_engine ON inventory_items(engine_number);
CREATE INDEX idx_inventory_items_registration ON inventory_items(registration_number);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_rentals_customer ON rentals(customer_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rentals_dates ON rentals(start_date, expected_return_date);
CREATE INDEX idx_payments_sale ON payments(sale_id);
CREATE INDEX idx_payments_rental ON payments(rental_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_activities_date ON activities(created_at);
CREATE INDEX idx_activities_performed_by ON activities(performed_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rentals_updated_at BEFORE UPDATE ON rentals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON business_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin (BEFORE policies)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on is_admin to authenticated
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- RLS Policies

-- Profiles: Users can see their own profile, admins can see all
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_admin());

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (is_admin());

-- Users can insert their own profile (for auto-creation on signup)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Admins can insert any profile
CREATE POLICY "Admins can insert profiles" ON profiles
    FOR INSERT TO authenticated WITH CHECK (is_admin());

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON profiles
    FOR DELETE TO authenticated USING (is_admin());

-- Categories: All authenticated users can read, only admins can write
CREATE POLICY "Authenticated users can view categories" ON categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert categories" ON categories
    FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories" ON categories
    FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete categories" ON categories
    FOR DELETE TO authenticated USING (is_admin());

-- Inventory items: All authenticated users can read, only admins can write
CREATE POLICY "Authenticated users can view inventory" ON inventory_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert inventory" ON inventory_items
    FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update inventory" ON inventory_items
    FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete inventory" ON inventory_items
    FOR DELETE TO authenticated USING (is_admin());

-- Customers: All authenticated users can read, only admins can write
CREATE POLICY "Authenticated users can view customers" ON customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert customers" ON customers
    FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update customers" ON customers
    FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete customers" ON customers
    FOR DELETE TO authenticated USING (is_admin());

-- Sales: All authenticated users can read, only admins can write
CREATE POLICY "Authenticated users can view sales" ON sales
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert sales" ON sales
    FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update sales" ON sales
    FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete sales" ON sales
    FOR DELETE TO authenticated USING (is_admin());

-- Payments: All authenticated users can read, only admins can write
CREATE POLICY "Authenticated users can view payments" ON payments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert payments" ON payments
    FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can delete payments" ON payments
    FOR DELETE TO authenticated USING (is_admin());

-- Rentals: All authenticated users can read, only admins can write
CREATE POLICY "Authenticated users can view rentals" ON rentals
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert rentals" ON rentals
    FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update rentals" ON rentals
    FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete rentals" ON rentals
    FOR DELETE TO authenticated USING (is_admin());

-- Expenses: All authenticated users can read, only admins can write
CREATE POLICY "Authenticated users can view expenses" ON expenses
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert expenses" ON expenses
    FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can delete expenses" ON expenses
    FOR DELETE TO authenticated USING (is_admin());

-- Activities: All authenticated users can read, system writes
CREATE POLICY "Authenticated users can view activities" ON activities
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert activities" ON activities
    FOR INSERT TO authenticated WITH CHECK (true);

-- Business settings: All authenticated users can read, only admins can write
CREATE POLICY "Authenticated users can view business settings" ON business_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update business settings" ON business_settings
    FOR UPDATE TO authenticated USING (is_admin());

-- Insert default business settings
INSERT INTO business_settings (shop_name, address, phone, currency, date_format)
VALUES ('My Vehicle Shop', 'Shop Address', 'Phone Number', 'PKR', 'DD/MM/YYYY');

-- Create function to log activities
CREATE OR REPLACE FUNCTION log_activity(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO activities (action, entity_type, entity_id, description, performed_by)
    VALUES (p_action, p_entity_type, p_entity_id, p_description, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on log_activity to authenticated
GRANT EXECUTE ON FUNCTION log_activity TO authenticated;
