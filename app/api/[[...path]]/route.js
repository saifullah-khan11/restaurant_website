import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase.js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

// Helper function to handle errors
const handleError = (error, message = 'An error occurred') => {
  console.error(message, error)
  return NextResponse.json(
    { error: message, details: error.message },
    { status: 500 }
  )
}

// Helper function to validate email
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ============ AUTH ROUTES ============

// POST /api/auth/signup - Customer or Staff signup
export async function POST(request) {
  const url = new URL(request.url)
  const path = url.pathname

  try {
    // Auth Signup
    if (path === '/api/auth/signup') {
      const body = await request.json()
      const { email, password, fullName, role, staffCode } = body

      // Validation
      if (!email || !password || !fullName || !role) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        )
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single()

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        )
      }

      // Staff signup - no code required (simplified)

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Create user
      const userId = uuidv4()
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email,
          passwordHash,
          fullName,
          role,
          createdAt: new Date().toISOString()
        }])
        .select()
        .single()

      if (userError) {
        return handleError(userError, 'Failed to create user')
      }

      // Mark staff code as used if staff
      if (role === 'staff') {
        await supabase
          .from('staff_codes')
          .update({ isUsed: true, usedBy: userId })
          .eq('code', staffCode)
      }

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role
        }
      })
    }

    // Auth Login
    if (path === '/api/auth/login') {
      const body = await request.json()
      const { email, password, role } = body

      if (!email || !password || !role) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      // Find user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('role', role)
        .single()

      if (userError || !user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash)

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      })
    }

    // ============ MENU ROUTES ============

    // Create Menu Item
    if (path === '/api/menu/create') {
      const body = await request.json()
      const { name, description, price, category, imageUrl, isAvailable = true } = body

      if (!name || !price || !category) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      const menuId = uuidv4()
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          id: menuId,
          name,
          description: description || '',
          price: parseFloat(price),
          category,
          imageUrl: imageUrl || null,
          isAvailable,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        return handleError(error, 'Failed to create menu item')
      }

      return NextResponse.json({ success: true, data })
    }

    // Create Order
    if (path === '/api/orders/create') {
      const body = await request.json()
      const { userId, orderType, paymentMethod, items, notes } = body

      if (!userId || !orderType || !paymentMethod || !items || items.length === 0) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      // Calculate total
      let totalAmount = 0
      items.forEach(item => {
        totalAmount += parseFloat(item.price) * parseInt(item.quantity)
      })

      // Create order
      const orderId = uuidv4()
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          userId,
          orderType,
          status: 'pending',
          paymentMethod,
          totalAmount,
          notes: notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }])
        .select()
        .single()

      if (orderError) {
        return handleError(orderError, 'Failed to create order')
      }

      // Create order items
      const orderItems = items.map(item => ({
        id: uuidv4(),
        orderId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: parseFloat(item.price),
        itemName: item.name
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        return handleError(itemsError, 'Failed to create order items')
      }

      return NextResponse.json({ success: true, order })
    }

  } catch (error) {
    return handleError(error)
  }

  return NextResponse.json({ error: 'Route not found' }, { status: 404 })
}

// GET Routes
export async function GET(request) {
  const url = new URL(request.url)
  const path = url.pathname

  try {
    // Get all menu items
    if (path === '/api/menu') {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        return handleError(error, 'Failed to fetch menu items')
      }

      return NextResponse.json(data || [])
    }

    // Get orders (with optional filtering)
    if (path === '/api/orders') {
      const userId = url.searchParams.get('userId')
      const status = url.searchParams.get('status')

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            itemName,
            menuItemId
          )
        `)
        .order('createdAt', { ascending: false })

      if (userId) {
        query = query.eq('userId', userId)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        return handleError(error, 'Failed to fetch orders')
      }

      return NextResponse.json(data || [])
    }

    // Get single order
    if (path.startsWith('/api/orders/')) {
      const orderId = path.split('/').pop()

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            itemName,
            menuItemId
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) {
        return handleError(error, 'Failed to fetch order')
      }

      return NextResponse.json(data)
    }

    // Validate staff code
    if (path === '/api/staff-codes/validate') {
      const code = url.searchParams.get('code')

      if (!code) {
        return NextResponse.json({ valid: false })
      }

      const { data, error } = await supabase
        .from('staff_codes')
        .select('*')
        .eq('code', code)
        .eq('isUsed', false)
        .single()

      if (error || !data) {
        return NextResponse.json({ valid: false })
      }

      return NextResponse.json({ valid: true })
    }

  } catch (error) {
    return handleError(error)
  }

  return NextResponse.json({ message: 'Mezbaan-e-khaas API' })
}

// PUT/PATCH Routes
export async function PUT(request) {
  const url = new URL(request.url)
  const path = url.pathname

  try {
    // Update menu item
    if (path.startsWith('/api/menu/')) {
      const menuId = path.split('/').pop()
      const body = await request.json()

      const { data, error } = await supabase
        .from('menu_items')
        .update({
          ...body,
          updatedAt: new Date().toISOString()
        })
        .eq('id', menuId)
        .select()
        .single()

      if (error) {
        return handleError(error, 'Failed to update menu item')
      }

      return NextResponse.json({ success: true, data })
    }

    // Update order status
    if (path.startsWith('/api/orders/')) {
      const orderId = path.split('/').pop()
      const body = await request.json()
      const { status } = body

      if (!status) {
        return NextResponse.json(
          { error: 'Status is required' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('orders')
        .update({
          status,
          updatedAt: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        return handleError(error, 'Failed to update order')
      }

      return NextResponse.json({ success: true, data })
    }

  } catch (error) {
    return handleError(error)
  }

  return NextResponse.json({ error: 'Route not found' }, { status: 404 })
}

// DELETE Routes
export async function DELETE(request) {
  const url = new URL(request.url)
  const path = url.pathname

  try {
    // Delete menu item
    if (path.startsWith('/api/menu/')) {
      const menuId = path.split('/').pop()

      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', menuId)

      if (error) {
        return handleError(error, 'Failed to delete menu item')
      }

      return NextResponse.json({ success: true })
    }

  } catch (error) {
    return handleError(error)
  }

  return NextResponse.json({ error: 'Route not found' }, { status: 404 })
}

export const PATCH = PUT
