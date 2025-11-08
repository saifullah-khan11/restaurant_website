'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, ShoppingCart, Plus, Minus, Trash2, Clock, CheckCircle, XCircle, Edit, Upload, ChefHat, User, LogOut, Package, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing') // landing, customer-login, customer-signup, staff-login, staff-signup, customer-dashboard, staff-dashboard
  const [user, setUser] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()

  // Auth state
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    fullName: '',
    staffCode: ''
  })
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Menu state
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState([])
  const [orderType, setOrderType] = useState('dine')

  // Orders state
  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([])

  // Menu management state
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Appetizer',
    imageUrl: '',
    isAvailable: true
  })
  const [editingMenuItem, setEditingMenuItem] = useState(null)

  // Load menu items on mount
  useEffect(() => {
    fetchMenuItems()
  }, [])

  // Load orders when user changes
  useEffect(() => {
    if (user) {
      if (user.role === 'customer') {
        fetchCustomerOrders()
      } else if (user.role === 'staff') {
        fetchAllOrders()
      }
    }
  }, [user])

  // Fetch menu items
  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu')
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data)
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error)
    }
  }

  // Fetch customer orders
  const fetchCustomerOrders = async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/orders?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  // Fetch all orders (staff)
  const fetchAllOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setAllOrders(data)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  // Handle authentication
  const handleAuth = async (type) => {
    setAuthError('')
    setIsLoading(true)

    // Validation
    if (!authForm.email || !authForm.password) {
      setAuthError('Please fill in all required fields')
      setIsLoading(false)
      return
    }

    if (type === 'signup' && !authForm.fullName) {
      setAuthError('Please enter your full name')
      setIsLoading(false)
      return
    }

    const role = currentPage.includes('customer') ? 'customer' : 'staff'

    if (type === 'signup' && role === 'staff' && !authForm.staffCode) {
      setAuthError('Staff code is required for staff registration')
      setIsLoading(false)
      return
    }

    try {
      const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const body = {
        email: authForm.email,
        password: authForm.password,
        role
      }

      if (type === 'signup') {
        body.fullName = authForm.fullName
        if (role === 'staff') {
          body.staffCode = authForm.staffCode
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        setAuthError(data.error || 'Authentication failed')
        setIsLoading(false)
        return
      }

      // Success
      setUser(data.user)
      setCurrentPage(role === 'customer' ? 'customer-dashboard' : 'staff-dashboard')
      setAuthForm({ email: '', password: '', fullName: '', staffCode: '' })
      toast({
        title: 'Success!',
        description: `Welcome ${data.user.fullName}!`
      })
    } catch (error) {
      setAuthError('An error occurred. Please try again.')
      console.error('Auth error:', error)
    }

    setIsLoading(false)
  }

  // Add to cart
  const addToCart = (item) => {
    const existingItem = cart.find(i => i.id === item.id)
    if (existingItem) {
      setCart(cart.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ))
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
    toast({
      title: 'Added to cart',
      description: `${item.name} added to your cart`
    })
  }

  // Update cart quantity
  const updateCartQuantity = (itemId, change) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + change
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null
      }
      return item
    }).filter(Boolean))
  }

  // Remove from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  // Calculate cart total
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // Place order
  const placeOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart first',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const orderItems = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          orderType,
          paymentMethod: orderType === 'dine' ? 'dine' : 'cod',
          items: orderItems
        })
      })

      if (response.ok) {
        toast({
          title: 'Order placed!',
          description: 'Your order has been placed successfully'
        })
        setCart([])
        fetchCustomerOrders()
      } else {
        toast({
          title: 'Failed to place order',
          description: 'Please try again',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Order error:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while placing your order',
        variant: 'destructive'
      })
    }

    setIsLoading(false)
  }

  // Update order status (staff)
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast({
          title: 'Order updated',
          description: `Order status changed to ${newStatus}`
        })
        fetchAllOrders()
      }
    } catch (error) {
      console.error('Failed to update order:', error)
    }
  }

  // Create/Update menu item
  const saveMenuItem = async () => {
    if (!menuForm.name || !menuForm.price || !menuForm.category) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const url = editingMenuItem ? `/api/menu/${editingMenuItem.id}` : '/api/menu/create'
      const method = editingMenuItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuForm)
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingMenuItem ? 'Menu item updated' : 'Menu item created'
        })
        setMenuForm({
          name: '',
          description: '',
          price: '',
          category: 'Appetizer',
          imageUrl: '',
          isAvailable: true
        })
        setEditingMenuItem(null)
        fetchMenuItems()
      }
    } catch (error) {
      console.error('Failed to save menu item:', error)
    }

    setIsLoading(false)
  }

  // Delete menu item
  const deleteMenuItem = async (id) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return

    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Deleted',
          description: 'Menu item deleted successfully'
        })
        fetchMenuItems()
      }
    } catch (error) {
      console.error('Failed to delete menu item:', error)
    }
  }

  // Start editing menu item
  const startEditMenuItem = (item) => {
    setEditingMenuItem(item)
    setMenuForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable
    })
  }

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      accepted: 'bg-blue-500',
      preparing: 'bg-purple-500',
      ready: 'bg-green-500',
      completed: 'bg-gray-500',
      rejected: 'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  // Logout
  const handleLogout = () => {
    setUser(null)
    setCart([])
    setOrders([])
    setAllOrders([])
    setCurrentPage('landing')
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully'
    })
  }

  // ========== RENDER COMPONENTS ==========

  // Landing Page
  const renderLanding = () => (
    <div className="min-h-screen bg-gradient-to-br from-charcoal via-warmGray to-charcoal flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-cream/95 backdrop-blur border-gold/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-gold to-yellow-600 p-6 rounded-full shadow-2xl">
              <UtensilsCrossed className="w-16 h-16 text-charcoal" />
            </div>
          </div>
          <CardTitle className="text-5xl font-bold text-charcoal tracking-wider">
            Mezbaan-e-khaas
          </CardTitle>
          <CardDescription className="text-lg text-warmGray">
            Where hospitality meets excellence
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6 p-8">
          <Card className="bg-gradient-to-br from-gold/10 to-gold/5 border-gold/30 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => setCurrentPage('customer-login')}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-gold/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                  <User className="w-12 h-12 text-gold" />
                </div>
              </div>
              <CardTitle className="text-2xl text-charcoal">Customer</CardTitle>
              <CardDescription>Browse menu and place orders</CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-charcoal/10 to-charcoal/5 border-charcoal/30 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => setCurrentPage('staff-login')}>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-charcoal/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                  <ChefHat className="w-12 h-12 text-charcoal" />
                </div>
              </div>
              <CardTitle className="text-2xl text-charcoal">Staff</CardTitle>
              <CardDescription>Manage orders and menu</CardDescription>
            </CardHeader>
          </Card>
        </CardContent>
      </Card>
    </div>
  )

  // Auth Page (Login/Signup)
  const renderAuth = () => {
    const isLogin = currentPage.includes('login')
    const isCustomer = currentPage.includes('customer')
    const role = isCustomer ? 'Customer' : 'Staff'

    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal via-warmGray to-charcoal flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-cream/95 backdrop-blur border-gold/20">
          <CardHeader>
            <Button variant="ghost" onClick={() => setCurrentPage('landing')} className="mb-4 text-charcoal">
              ← Back
            </Button>
            <div className="flex justify-center mb-4">
              <div className="bg-gold p-4 rounded-full">
                {isCustomer ? <User className="w-10 h-10 text-charcoal" /> : <ChefHat className="w-10 h-10 text-charcoal" />}
              </div>
            </div>
            <CardTitle className="text-3xl text-center text-charcoal">
              {role} {isLogin ? 'Login' : 'Signup'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {authError && (
              <Alert variant="destructive">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={authForm.fullName}
                  onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                  className="bg-white border-gold/30"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="bg-white border-gold/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="bg-white border-gold/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warmGray hover:text-charcoal"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {!isLogin && !isCustomer && (
              <div className="space-y-2">
                <Label htmlFor="staffCode">Staff Access Code</Label>
                <Input
                  id="staffCode"
                  placeholder="Enter staff code"
                  value={authForm.staffCode}
                  onChange={(e) => setAuthForm({ ...authForm, staffCode: e.target.value })}
                  className="bg-white border-gold/30"
                />
                <p className="text-xs text-warmGray">Contact admin for staff access code</p>
              </div>
            )}

            <Button
              onClick={() => handleAuth(isLogin ? 'login' : 'signup')}
              disabled={isLoading}
              className="w-full bg-gold hover:bg-gold/90 text-charcoal font-semibold"
            >
              {isLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
            </Button>

            <div className="text-center text-sm text-warmGray">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setCurrentPage(isLogin ? currentPage.replace('login', 'signup') : currentPage.replace('signup', 'login'))}
                className="text-gold hover:underline font-semibold"
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Customer Dashboard
  const renderCustomerDashboard = () => {
    const categories = [...new Set(menuItems.map(item => item.category))]

    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-white to-cream">
        {/* Header */}
        <header className="bg-charcoal text-cream shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gold p-2 rounded-full">
                <UtensilsCrossed className="w-6 h-6 text-charcoal" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Mezbaan-e-khaas</h1>
                <p className="text-xs text-gold">Welcome, {user?.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gold text-charcoal rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {cart.length}
                  </span>
                )}
              </div>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-cream hover:text-gold">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="menu" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-charcoal/10">
              <TabsTrigger value="menu" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal">Menu</TabsTrigger>
              <TabsTrigger value="cart" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal">
                Cart ({cart.length})
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal">My Orders</TabsTrigger>
            </TabsList>

            {/* Menu Tab */}
            <TabsContent value="menu" className="space-y-6">
              {categories.map(category => {
                const categoryItems = menuItems.filter(item => item.category === category && item.isAvailable)
                if (categoryItems.length === 0) return null

                return (
                  <div key={category}>
                    <h2 className="text-2xl font-bold text-charcoal mb-4 border-b-2 border-gold pb-2">{category}</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryItems.map(item => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-shadow border-gold/20">
                          {item.imageUrl && (
                            <div className="h-48 overflow-hidden bg-warmGray/10">
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle className="text-charcoal">{item.name}</CardTitle>
                            <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                          </CardHeader>
                          <CardFooter className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-gold">₹{item.price}</span>
                            <Button onClick={() => addToCart(item)} className="bg-gold hover:bg-gold/90 text-charcoal">
                              <Plus className="w-4 h-4 mr-2" />
                              Add
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </TabsContent>

            {/* Cart Tab */}
            <TabsContent value="cart" className="space-y-6">
              <Card className="border-gold/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Your Cart</CardTitle>
                  <div className="space-y-2 mt-4">
                    <Label>Order Type</Label>
                    <Select value={orderType} onValueChange={setOrderType}>
                      <SelectTrigger className="bg-white border-gold/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dine">Dine-in (Pay at table)</SelectItem>
                        <SelectItem value="parcel">Parcel (Cash on delivery)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-center text-warmGray py-8">Your cart is empty</p>
                  ) : (
                    <>
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-cream/50 rounded-lg border border-gold/20">
                          <div className="flex-1">
                            <h3 className="font-semibold text-charcoal">{item.name}</h3>
                            <p className="text-sm text-warmGray">₹{item.price} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, -1)} className="border-gold/30">
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, 1)} className="border-gold/30">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-charcoal">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      <div className="border-t-2 border-gold pt-4 mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xl font-bold text-charcoal">Total:</span>
                          <span className="text-2xl font-bold text-gold">₹{getCartTotal().toFixed(2)}</span>
                        </div>
                        <Button onClick={placeOrder} disabled={isLoading} className="w-full bg-gold hover:bg-gold/90 text-charcoal font-semibold text-lg py-6">
                          {isLoading ? 'Placing order...' : 'Place Order'}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              {orders.length === 0 ? (
                <Card className="border-gold/20">
                  <CardContent className="py-12">
                    <p className="text-center text-warmGray">No orders yet</p>
                  </CardContent>
                </Card>
              ) : (
                orders.map(order => (
                  <Card key={order.id} className="border-gold/20">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-charcoal">Order #{order.id.slice(0, 8)}</CardTitle>
                          <CardDescription>
                            {new Date(order.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-warmGray">Type:</span>
                        <span className="font-semibold text-charcoal">{order.orderType === 'dine' ? 'Dine-in' : 'Parcel'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-warmGray">Payment:</span>
                        <span className="font-semibold text-charcoal">{order.paymentMethod === 'dine' ? 'Pay at table' : 'Cash on delivery'}</span>
                      </div>
                      <div className="border-t border-gold/20 pt-2 mt-2">
                        <h4 className="font-semibold text-charcoal mb-2">Items:</h4>
                        {order.order_items?.map(item => (
                          <div key={item.id} className="flex justify-between text-sm py-1">
                            <span className="text-warmGray">{item.itemName} x{item.quantity}</span>
                            <span className="text-charcoal">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t-2 border-gold">
                        <span className="font-bold text-charcoal">Total:</span>
                        <span className="text-xl font-bold text-gold">₹{order.totalAmount}</span>
                      </div>
                      {order.status === 'pending' && (
                        <Alert className="bg-yellow-50 border-yellow-300 mt-4">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            Waiting for staff to accept your order
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  // Staff Dashboard
  const renderStaffDashboard = () => {
    const pendingOrders = allOrders.filter(o => o.status === 'pending')
    const activeOrders = allOrders.filter(o => ['accepted', 'preparing'].includes(o.status))
    const completedOrders = allOrders.filter(o => ['ready', 'completed', 'rejected'].includes(o.status))

    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal via-warmGray to-charcoal">
        {/* Header */}
        <header className="bg-charcoal text-cream shadow-lg sticky top-0 z-50 border-b-2 border-gold">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gold p-2 rounded-full">
                <ChefHat className="w-6 h-6 text-charcoal" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Staff Dashboard</h1>
                <p className="text-xs text-gold">{user?.fullName}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm" className="border-gold text-gold hover:bg-gold hover:text-charcoal">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-cream/10">
              <TabsTrigger value="orders" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal">
                Orders Management {pendingOrders.length > 0 && `(${pendingOrders.length} pending)`}
              </TabsTrigger>
              <TabsTrigger value="menu" className="data-[state=active]:bg-gold data-[state=active]:text-charcoal">Menu Management</TabsTrigger>
            </TabsList>

            {/* Orders Management Tab */}
            <TabsContent value="orders" className="space-y-8">
              {/* Pending Orders */}
              {pendingOrders.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-cream mb-4 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-yellow-500" />
                    Pending Orders ({pendingOrders.length})
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {pendingOrders.map(order => (
                      <Card key={order.id} className="bg-cream border-yellow-500 border-2">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-charcoal">Order #{order.id.slice(0, 8)}</CardTitle>
                              <CardDescription>{new Date(order.createdAt).toLocaleString()}</CardDescription>
                            </div>
                            <Badge className="bg-yellow-500 text-white">PENDING</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-1">
                            <p className="text-sm text-warmGray">Type: <span className="font-semibold text-charcoal">{order.orderType === 'dine' ? 'Dine-in' : 'Parcel'}</span></p>
                            <p className="text-sm text-warmGray">Payment: <span className="font-semibold text-charcoal">{order.paymentMethod === 'dine' ? 'Pay at table' : 'Cash on delivery'}</span></p>
                          </div>
                          <div className="border-t border-warmGray/20 pt-2">
                            <h4 className="font-semibold text-charcoal mb-2">Items:</h4>
                            {order.order_items?.map(item => (
                              <div key={item.id} className="flex justify-between text-sm py-1">
                                <span>{item.itemName} x{item.quantity}</span>
                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t-2 border-gold">
                            <span className="font-bold">Total:</span>
                            <span className="text-xl font-bold text-gold">₹{order.totalAmount}</span>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button onClick={() => updateOrderStatus(order.id, 'accepted')} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Accept
                            </Button>
                            <Button onClick={() => updateOrderStatus(order.id, 'rejected')} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Orders */}
              {activeOrders.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-cream mb-4">Active Orders ({activeOrders.length})</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {activeOrders.map(order => (
                      <Card key={order.id} className="bg-cream border-blue-500 border-2">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-charcoal">Order #{order.id.slice(0, 8)}</CardTitle>
                              <CardDescription>{new Date(order.createdAt).toLocaleString()}</CardDescription>
                            </div>
                            <Badge className={getStatusColor(order.status) + ' text-white'}>
                              {order.status.toUpperCase()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-1">
                            <p className="text-sm text-warmGray">Type: <span className="font-semibold text-charcoal">{order.orderType === 'dine' ? 'Dine-in' : 'Parcel'}</span></p>
                          </div>
                          <div className="border-t border-warmGray/20 pt-2">
                            <h4 className="font-semibold text-charcoal mb-2">Items:</h4>
                            {order.order_items?.map(item => (
                              <div key={item.id} className="flex justify-between text-sm py-1">
                                <span>{item.itemName} x{item.quantity}</span>
                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t-2 border-gold">
                            <span className="font-bold">Total:</span>
                            <span className="text-xl font-bold text-gold">₹{order.totalAmount}</span>
                          </div>
                          <div className="space-y-2 pt-2">
                            {order.status === 'accepted' && (
                              <Button onClick={() => updateOrderStatus(order.id, 'preparing')} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                Start Preparing
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button onClick={() => updateOrderStatus(order.id, 'ready')} className="w-full bg-green-600 hover:bg-green-700 text-white">
                                Mark as Ready
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Orders */}
              {completedOrders.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-cream mb-4">Recent Completed Orders</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    {completedOrders.slice(0, 6).map(order => (
                      <Card key={order.id} className="bg-cream/50">
                        <CardHeader>
                          <CardTitle className="text-sm text-charcoal">Order #{order.id.slice(0, 8)}</CardTitle>
                          <Badge className={getStatusColor(order.status) + ' text-white w-fit'}>
                            {order.status.toUpperCase()}
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-bold text-gold">₹{order.totalAmount}</p>
                          <p className="text-xs text-warmGray mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Menu Management Tab */}
            <TabsContent value="menu" className="space-y-6">
              {/* Add/Edit Menu Item Form */}
              <Card className="bg-cream border-gold/30">
                <CardHeader>
                  <CardTitle className="text-charcoal">
                    {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        placeholder="Item name"
                        value={menuForm.name}
                        onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                        className="bg-white border-gold/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price (₹) *</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={menuForm.price}
                        onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                        className="bg-white border-gold/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Item description"
                      value={menuForm.description}
                      onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                      className="bg-white border-gold/30"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={menuForm.category} onValueChange={(val) => setMenuForm({ ...menuForm, category: val })}>
                        <SelectTrigger className="bg-white border-gold/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Appetizer">Appetizer</SelectItem>
                          <SelectItem value="Main Course">Main Course</SelectItem>
                          <SelectItem value="Dessert">Dessert</SelectItem>
                          <SelectItem value="Beverage">Beverage</SelectItem>
                          <SelectItem value="Snacks">Snacks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://example.com/image.jpg"
                          value={menuForm.imageUrl}
                          onChange={(e) => setMenuForm({ ...menuForm, imageUrl: e.target.value })}
                          className="bg-white border-gold/30"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="available"
                      checked={menuForm.isAvailable}
                      onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })}
                      className="w-4 h-4 text-gold border-gold/30 rounded focus:ring-gold"
                    />
                    <Label htmlFor="available" className="cursor-pointer">Mark as available</Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={saveMenuItem} disabled={isLoading} className="bg-gold hover:bg-gold/90 text-charcoal">
                      {isLoading ? 'Saving...' : (editingMenuItem ? 'Update Item' : 'Add Item')}
                    </Button>
                    {editingMenuItem && (
                      <Button onClick={() => {
                        setEditingMenuItem(null)
                        setMenuForm({
                          name: '',
                          description: '',
                          price: '',
                          category: 'Appetizer',
                          imageUrl: '',
                          isAvailable: true
                        })
                      }} variant="outline" className="border-gold text-charcoal">
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Menu Items List */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map(item => (
                  <Card key={item.id} className="bg-cream border-gold/20">
                    {item.imageUrl && (
                      <div className="h-32 overflow-hidden bg-warmGray/10">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg text-charcoal">{item.name}</CardTitle>
                        <Badge className={item.isAvailable ? 'bg-green-500' : 'bg-red-500'}>
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">{item.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-warmGray line-clamp-2 mb-2">{item.description}</p>
                      <p className="text-xl font-bold text-gold">₹{item.price}</p>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button onClick={() => startEditMenuItem(item)} size="sm" variant="outline" className="flex-1 border-gold/30">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button onClick={() => deleteMenuItem(item.id)} size="sm" variant="destructive" className="flex-1">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  // Main render
  return (
    <>
      {currentPage === 'landing' && renderLanding()}
      {(currentPage.includes('login') || currentPage.includes('signup')) && renderAuth()}
      {currentPage === 'customer-dashboard' && renderCustomerDashboard()}
      {currentPage === 'staff-dashboard' && renderStaffDashboard()}
      <Toaster />
    </>
  )
}