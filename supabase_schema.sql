-- Mezbaan-e-khaas Restaurant Management System
-- Database Schema for Supabase PostgreSQL

-- Drop existing tables if recreating (for development only)
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS staff_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'staff')),
  "fullName" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Staff Codes Table
CREATE TABLE staff_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  "isUsed" BOOLEAN DEFAULT false,
  "usedBy" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("usedBy") REFERENCES users(id)
);

-- Create Menu Items Table
CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  "imageUrl" TEXT,
  "isAvailable" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Orders Table
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "orderType" TEXT NOT NULL CHECK ("orderType" IN ('dine', 'parcel')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'completed', 'rejected')),
  "paymentMethod" TEXT NOT NULL CHECK ("paymentMethod" IN ('cod', 'dine')),
  "totalAmount" DECIMAL(10,2) NOT NULL,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES users(id)
);

-- Create Order Items Table
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "menuItemId" TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  "itemName" TEXT NOT NULL,
  FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY ("menuItemId") REFERENCES menu_items(id)
);

-- Create Reservations Table
CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "reservationDate" DATE NOT NULL,
  "reservationTime" TIME NOT NULL,
  "numberOfPeople" INTEGER NOT NULL,
  "specialRequests" TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES users(id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for Public Access (for MVP - adjust for production)
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow public read staff_codes" ON staff_codes FOR SELECT USING (true);
CREATE POLICY "Allow public insert staff_codes" ON staff_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update staff_codes" ON staff_codes FOR UPDATE USING (true);

CREATE POLICY "Allow public read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert menu_items" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update menu_items" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete menu_items" ON menu_items FOR DELETE USING (true);

CREATE POLICY "Allow public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update orders" ON orders FOR UPDATE USING (true);

CREATE POLICY "Allow public read order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update order_items" ON order_items FOR UPDATE USING (true);

-- Create Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_staff_codes_code ON staff_codes(code);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items("isAvailable");
CREATE INDEX idx_orders_user ON orders("userId");
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders("createdAt" DESC);
CREATE INDEX idx_order_items_order ON order_items("orderId");

-- Auto-update timestamp trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_menu_items_timestamp ON menu_items;
CREATE TRIGGER update_menu_items_timestamp
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_orders_timestamp ON orders;
CREATE TRIGGER update_orders_timestamp
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Insert default staff code
INSERT INTO staff_codes (id, code, "isUsed", "createdAt")
VALUES 
  ('staff_code_1', 'MEZBAAN2025', false, NOW()),
  ('staff_code_2', 'STAFF001', false, NOW()),
  ('staff_code_3', 'STAFF002', false, NOW());

-- Insert sample menu items (optional - for testing)
INSERT INTO menu_items (id, name, description, price, category, "imageUrl", "isAvailable", "createdAt")
VALUES 
  ('menu_1', 'Butter Chicken', 'Creamy tomato-based curry with tender chicken', 299.00, 'Main Course', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398', true, NOW()),
  ('menu_2', 'Biryani', 'Aromatic basmati rice with spiced meat', 349.00, 'Main Course', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8', true, NOW()),
  ('menu_3', 'Paneer Tikka', 'Grilled cottage cheese with spices', 249.00, 'Appetizer', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7', true, NOW()),
  ('menu_4', 'Gulab Jamun', 'Sweet milk dumplings in sugar syrup', 99.00, 'Dessert', 'https://images.unsplash.com/photo-1589368081062-a215fb4e0e66', true, NOW());

-- Success message
SELECT 'Database schema created successfully! 🎉' as message;
