# Reservation Feature Setup Instructions

## Database Schema Update Required

To enable the reservation feature, you need to add the `reservations` table to your Supabase database.

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the **SQL Editor** section in the left sidebar
3. Click **New Query**

### Step 2: Run the Following SQL Query

Copy and paste this SQL code into the editor and click **Run**:

```sql
-- Create Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
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

-- Enable Row Level Security
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Allow public read reservations" ON reservations FOR SELECT USING (true);
CREATE POLICY "Allow public insert reservations" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update reservations" ON reservations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete reservations" ON reservations FOR DELETE USING (true);

-- Create Indexes for Performance
CREATE INDEX idx_reservations_user ON reservations("userId");
CREATE INDEX idx_reservations_date ON reservations("reservationDate");
CREATE INDEX idx_reservations_status ON reservations(status);
```

### Step 3: Verify Table Creation

After running the query, you should see:
- Success message indicating the table was created
- The `reservations` table listed in your **Table Editor**

### Step 4: Test the Reservation Feature

1. Log in to your restaurant website as a customer
2. Navigate to the **Reservations** tab in the customer dashboard
3. Try creating a test reservation with:
   - Date (today or future date)
   - Time
   - Number of people
   - Special requests (optional)
4. Click "Reserve Table"
5. Your reservation should appear in the "My Reservations" section below

## Troubleshooting

If you encounter any errors:

1. **Foreign Key Constraint Error**: Make sure you have the `users` table created first
2. **Permission Error**: Ensure you're running the query with admin/owner privileges
3. **Already Exists Error**: The table already exists, no action needed

## Features Enabled

Once setup is complete, customers can:
- ✅ Book tables for specific dates and times
- ✅ Specify number of people
- ✅ Add special requests (dietary requirements, occasions, etc.)
- ✅ View all their reservations
- ✅ Cancel reservations

## Next Steps (Optional)

For production use, you may want to:
- Add email notifications for reservation confirmations
- Create a staff dashboard to manage reservations
- Implement time slot validation to prevent overbooking
- Add reservation reminders
