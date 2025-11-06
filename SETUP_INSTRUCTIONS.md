# Mezbaan-e-khaas Restaurant Management System - Setup Instructions

## 🎉 Your application is ready!

This is a complete restaurant staff and customer management system built with Next.js and Supabase.

## 🗄️ Database Setup (REQUIRED)

### Step 1: Run the SQL Schema in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **jucqxzcdrmyawfyjioom**
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of the file `supabase_schema.sql` from your project root
6. Paste it into the SQL Editor
7. Click **Run** button

This will create all the required tables:
- `users` - Customer and staff accounts
- `staff_codes` - Unique codes for staff registration
- `menu_items` - Restaurant menu with images
- `orders` - Customer orders
- `order_items` - Items in each order

### Default Staff Codes Created

The SQL script automatically creates these staff codes for testing:
- `MEZBAAN2025` ✅
- `STAFF001` ✅
- `STAFF002` ✅

Use any of these codes when signing up as staff.

## ✨ Features Implemented

### Customer Features:
✅ Separate login/signup (no staff code required)
✅ Choose dine-in or parcel option when ordering
✅ Browse menu with beautiful images and categories
✅ Add items to cart with quantity management
✅ Place orders with cash on delivery/dine-in payment
✅ Track order status in real-time
✅ Password visibility toggle on all password fields
✅ Proper error messages for wrong credentials

### Staff Features:
✅ Separate login/signup with unique staff code
✅ Staff code ONLY appears in signup page (not login)
✅ View all pending orders
✅ Accept or reject orders
✅ Update order status (pending → accepted → preparing → ready → completed)
✅ Menu management (add/edit/delete items)
✅ Upload images for menu items (via image URL)
✅ Mark menu items as available/unavailable
✅ Categorize menu items

### Design:
✅ Modern, responsive UI
✅ Custom restaurant logo with elegant design
✅ Color scheme: Charcoal Black, Matte Gold, Cream White, Warm Gray
✅ Smooth animations and transitions
✅ Beautiful gradients and shadows

## 🚀 How to Access

### Customer Flow:
1. Visit the application homepage
2. Click "Customer" card
3. Sign up with email and password
4. Browse menu, add items to cart
5. Select dine-in or parcel
6. Place order
7. Track order status in "My Orders" tab

### Staff Flow:
1. Visit the application homepage
2. Click "Staff" card
3. Sign up with email, password, and staff code (use: `MEZBAAN2025`)
4. Manage incoming orders (accept/reject/update status)
5. Manage menu items (add/edit/delete with images)

## 🔑 Test Credentials

### For Staff:
- Use signup with any email and one of these codes:
  - `MEZBAAN2025`
  - `STAFF001`
  - `STAFF002`

### For Customer:
- Just sign up with any email (no code needed)

## 📁 File Structure

```
/app/
├── supabase_schema.sql          # SQL file to run in Supabase
├── app/
│   ├── page.js                  # Main application (all features)
│   ├── layout.js                # App layout
│   ├── globals.css              # Custom styles
│   └── api/[[...path]]/route.js # Backend API routes
├── lib/
│   └── supabase.js              # Supabase client
├── components/ui/               # shadcn UI components
└── .env                         # Environment variables (already configured)
```

## 🛠️ Technologies Used

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: bcryptjs for password hashing
- **Icons**: lucide-react
- **State Management**: React hooks (useState, useEffect)

## ⚠️ Important Notes

1. **You MUST run the SQL schema** in Supabase before using the app
2. Staff codes are one-time use - each code can only be used once
3. Password toggle (eye icon) is available on all password fields
4. Orders show "pending" until staff accepts them
5. Image URLs must be valid image links (use Unsplash or similar)
6. The app uses session-based auth (stored in React state)

## 🎨 Color Palette

- **Charcoal Black**: #2B2B2B (Primary dark)
- **Matte Gold**: #D4AF37 (Accent/Buttons)
- **Cream White**: #FFFDD0 (Backgrounds)
- **Warm Gray**: #A8A8A8 (Secondary text)

## 📝 Sample Menu Data

The SQL script includes sample menu items:
- Butter Chicken (₹299)
- Biryani (₹349)
- Paneer Tikka (₹249)
- Gulab Jamun (₹99)

You can edit/delete these from the Staff Dashboard → Menu Management.

## 🔄 Order Status Flow

```
PENDING (Customer placed order)
    ↓
ACCEPTED (Staff accepted)
    ↓
PREPARING (Staff started preparing)
    ↓
READY (Order ready for delivery/pickup)
    ↓
COMPLETED (Order fulfilled)

OR

PENDING → REJECTED (Staff rejected order)
```

## 🐛 Troubleshooting

### "Failed to fetch menu" error:
- Make sure you ran the SQL schema in Supabase
- Check that your Supabase URL and API key are correct in `.env`

### "Invalid staff code" error:
- Use one of the default codes: `MEZBAAN2025`, `STAFF001`, or `STAFF002`
- Check that the code hasn't been used before

### Images not showing:
- Ensure image URLs are valid and publicly accessible
- Use image hosting services like Unsplash, Imgur, or Cloudinary

## 🎯 Next Steps

1. **Run the SQL schema in Supabase** (most important!)
2. Test the customer flow
3. Test the staff flow
4. Customize the menu items
5. Add your own staff codes if needed

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify Supabase connection
3. Ensure all required fields are filled in forms

---

**Built with ❤️ for Mezbaan-e-khaas Restaurant**
