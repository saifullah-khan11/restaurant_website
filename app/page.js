'use client'

import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, ShoppingCart, Plus, Minus, Trash2, Clock, CheckCircle, XCircle, Edit, Upload, ChefHat, User, LogOut, Package, UtensilsCrossed, Menu as MenuIcon, X, Home as HomeIcon, ListOrdered, Store, Bike, Calendar, Users } from 'lucide-react'
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

const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export default function App() {
  const [currentPage, setCurrentPage] = useState('home') // home, login, signup, customer-dashboard, staff-dashboard
  const [user, setUser] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [currentTab, setCurrentTab] = useState('menu')
  const { toast } = useToast()
  const menuSectionRef = useRef(null)

  // Auth state
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    fullName: ''
  })
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Menu state
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState([])
  const [orderType, setOrderType] = useState('dine') // 'dine' or 'delivery'
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false)

  // Orders state
  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([])

  // Reservation state
  const [reservations, setReservations] = useState([])
  const [reservationForm, setReservationForm] = useState({
    date: '',
    time: '',
    numberOfPeople: '2',
    specialRequests: ''
  })

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

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('mezbaan_session')
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession)
        const now = new Date().getTime()
        if (session.expiresAt > now) {
          setUser(session.user)
          setCart(session.cart || [])
          setOrderType(session.orderType || 'dine')
          setCurrentPage(session.currentPage || (session.user.role === 'customer' ? 'customer-dashboard' : 'staff-dashboard'))
        } else {
          localStorage.removeItem('mezbaan_session')
        }
      } catch (error) {
        console.error('Failed to restore session:', error)
        localStorage.removeItem('mezbaan_session')
      }
    }
  }, [])

  // Save session to localStorage whenever user or cart changes
  useEffect(() => {
    if (user) {
      const session = {
        user,
        cart,
        orderType,
        currentPage,
        expiresAt: new Date().getTime() + SESSION_DURATION
      }
      localStorage.setItem('mezbaan_session', JSON.stringify(session))
    }
  }, [user, cart, orderType, currentPage])

  // Load menu items on mount
  useEffect(() => {
    fetchMenuItems()
  }, [])

  // Load orders and reservations when user changes
  useEffect(() => {
    if (user) {
      if (user.role === 'customer') {
        fetchCustomerOrders()
        fetchCustomerReservations()
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

  // Fetch customer reservations
  const fetchCustomerReservations = async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/reservations?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setReservations(data)
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
    }
  }

  // Create reservation
  const createReservation = async () => {
    if (!reservationForm.date || !reservationForm.time || !reservationForm.numberOfPeople) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          reservationDate: reservationForm.date,
          reservationTime: reservationForm.time,
          numberOfPeople: reservationForm.numberOfPeople,
          specialRequests: reservationForm.specialRequests
        })
      })

      if (response.ok) {
        toast({
          title: 'Reservation created!',
          description: 'Your table has been reserved successfully'
        })
        setReservationForm({
          date: '',
          time: '',
          numberOfPeople: '2',
          specialRequests: ''
        })
        fetchCustomerReservations()
      } else {
        toast({
          title: 'Failed to create reservation',
          description: 'Please try again',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Reservation error:', error)
      toast({
        title: 'Error',
        description: 'An error occurred while creating your reservation',
        variant: 'destructive'
      })
    }

    setIsLoading(false)
  }

  // Delete reservation
  const deleteReservation = async (id) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return

    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Reservation cancelled',
          description: 'Your reservation has been cancelled'
        })
        fetchCustomerReservations()
      }
    } catch (error) {
      console.error('Failed to delete reservation:', error)
    }
  }

  // Handle authentication - Merged login/signup
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

    try {
      if (type === 'login') {
        // Try customer login first
        let response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authForm.email,
            password: authForm.password,
            role: 'customer'
          })
        })

        let data = await response.json()

        // If customer login fails, try staff login
        if (!response.ok) {
          response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: authForm.email,
              password: authForm.password,
              role: 'staff'
            })
          })

          data = await response.json()
        }

        if (!response.ok) {
          setAuthError(data.error || 'Invalid email or password')
          setIsLoading(false)
          return
        }

        // Success
        setUser(data.user)
        setCurrentPage(data.user.role === 'customer' ? 'customer-dashboard' : 'staff-dashboard')
        setAuthForm({ email: '', password: '', fullName: '' })
        setShowMobileMenu(false)
        toast({
          title: 'Success!',
          description: `Welcome ${data.user.fullName}!`
        })
      } else {
        // Signup - default to customer role
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authForm.email,
            password: authForm.password,
            fullName: authForm.fullName,
            role: 'customer'
          })
        })

        const data = await response.json()

        if (!response.ok) {
          setAuthError(data.error || 'Signup failed')
          setIsLoading(false)
          return
        }

        // Success
        setUser(data.user)
        setCurrentPage('customer-dashboard')
        setAuthForm({ email: '', password: '', fullName: '' })
        setShowMobileMenu(false)
        toast({
          title: 'Success!',
          description: `Welcome ${data.user.fullName}!`
        })
      }
    } catch (error) {
      setAuthError('An error occurred. Please try again.')
      console.error('Auth error:', error)
    }

    setIsLoading(false)
  }

  // Add to cart with login check
  const addToCart = (item) => {
    if (!user) {
      // Show order type modal first, then login
      setShowOrderTypeModal(true)
      return
    }

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

  // Handle order type selection and proceed to login
  const handleOrderTypeSelect = (type) => {
    setOrderType(type)
    setShowOrderTypeModal(false)
    setCurrentPage('customer-login')
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
    setReservations([])
    setCurrentPage('home')
    setShowMobileMenu(false)
    localStorage.removeItem('mezbaan_session')
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully'
    })
  }

  // Scroll to category
  const scrollToCategory = (category) => {
    const element = document.getElementById(`category-${category}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Navigate to cart
  const goToCart = () => {
    if (!user) {
      setShowOrderTypeModal(true)
      return
    }
    setCurrentPage('customer-dashboard')
    // Optionally scroll to cart section or switch tab
  }

  // ========== RENDER COMPONENTS ==========

  // Header Component
  const renderHeader = () => (
    <header className="bg-brown text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu with proper color */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-lightBrown bg-lightBrown/80 p-2"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </Button>
          
          {/* Logo - Fully Circular, No White Background */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('home')}>
            <img 
              src="https://customer-assets.emergentagent.com/job_85cbbcde-4708-4a58-aa4c-eb9f7d1244f3/artifacts/2asasfb6_image.png" 
              alt="Mezbaan-e-Khaas" 
              className="w-10 h-10 rounded-full object-cover border-2 border-cream"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold">Mezbaan-e-Khaas</h1>
              <p className="text-xs text-cream">Your Special Mezbaan — Hospitality with Heart.</p>
            </div>
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          {user && user.role === 'customer' && (
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-brown/80"
                onClick={goToCart}
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-lightBrown text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {cart.length}
                  </span>
                )}
              </Button>
            </div>
          )}
          {!user ? (
            <Button 
              onClick={() => setCurrentPage('login')} 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-lightBrown bg-lightBrown/80 hidden sm:flex"
            >
              <User className="w-4 h-4 mr-1" />
              Login / Signup
            </Button>
          ) : (
            <Button 
              onClick={handleLogout} 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-brown/80 hidden sm:flex"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay - Close on outside click */}
      {showMobileMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="absolute top-full left-0 w-full max-w-xs bg-charcoal text-white shadow-xl animate-slideIn z-50">
            <nav className="container mx-auto px-4 py-6 space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-lg hover:bg-lightBrown/20"
                onClick={() => { setCurrentPage('home'); setShowMobileMenu(false); }}
              >
                <HomeIcon className="w-5 h-5 mr-3" />
                Home
              </Button>
              
              {user?.role === 'customer' && currentTab !== 'cart' && currentTab !== 'orders' && (
                <>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-lg hover:bg-lightBrown/20"
                    onClick={() => { setCurrentPage('customer-dashboard'); setCurrentTab('menu'); setShowMobileMenu(false); }}
                  >
                    <UtensilsCrossed className="w-5 h-5 mr-3" />
                    Menu
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-lg hover:bg-lightBrown/20"
                    onClick={() => { setCurrentPage('customer-dashboard'); setCurrentTab('reservations'); setShowMobileMenu(false); }}
                  >
                    <Calendar className="w-5 h-5 mr-3" />
                    Reservations
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-lg hover:bg-lightBrown/20"
                    onClick={() => { setCurrentPage('customer-dashboard'); setCurrentTab('orders'); setShowMobileMenu(false); }}
                  >
                    <ListOrdered className="w-5 h-5 mr-3" />
                    My Orders
                  </Button>
                </>
              )}

              {user?.role === 'staff' && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-lg hover:bg-lightBrown/20"
                  onClick={() => { setCurrentPage('staff-dashboard'); setShowMobileMenu(false); }}
                >
                  <ChefHat className="w-5 h-5 mr-3" />
                  Staff Dashboard
                </Button>
              )}

              {!user ? (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-lg hover:bg-lightBrown/20"
                  onClick={() => { setCurrentPage('login'); setShowMobileMenu(false); }}
                >
                  <User className="w-5 h-5 mr-3" />
                  Login / Signup
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-lg hover:bg-lightBrown/20 text-red-400"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </Button>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  )

  // Order Type Modal
  const renderOrderTypeModal = () => {
    if (!showOrderTypeModal) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md bg-white">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Select Order Type</CardTitle>
            <CardDescription className="text-center">Choose how you'd like to receive your order</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button
              onClick={() => handleOrderTypeSelect('dine')}
              className="h-24 bg-gradient-to-br from-brown to-brown/80 hover:from-brown/90 hover:to-brown/70 text-white flex flex-col gap-2"
            >
              <Store className="w-10 h-10" />
              <span className="text-lg font-semibold">Dine-In</span>
              <span className="text-xs opacity-90">Pay at table</span>
            </Button>
            <Button
              onClick={() => handleOrderTypeSelect('delivery')}
              className="h-24 bg-gradient-to-br from-lightBrown to-lightBrown/80 hover:from-lightBrown/90 hover:to-lightBrown/70 text-white flex flex-col gap-2"
            >
              <Bike className="w-10 h-10" />
              <span className="text-lg font-semibold">Delivery</span>
              <span className="text-xs opacity-90">Cash on delivery</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowOrderTypeModal(false)}
              className="mt-2"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Home/Landing Page with Menu
  const renderHome = () => {
    const categories = [...new Set(menuItems.map(item => item.category))]

    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-white to-warmBeige">
        {renderHeader()}

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-brown to-darkBrown text-white py-16 px-4">
          <div className="container mx-auto text-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_85cbbcde-4708-4a58-aa4c-eb9f7d1244f3/artifacts/2asasfb6_image.png" 
              alt="Mezbaan-e-Khaas" 
              className="w-32 h-32 mx-auto mb-6 rounded-full object-cover border-4 border-cream shadow-2xl"
            />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Mezbaan-e-Khaas</h1>
            <p className="text-xl md:text-2xl text-cream mb-6">Your Special Mezbaan — Hospitality with Heart.</p>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Experience authentic flavors and warm hospitality. Browse our menu and place your order today!
            </p>
          </div>
        </section>

        {/* Menu Section */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center text-charcoal mb-6">Our Menu</h2>
          
          {/* Category Bar */}
          <div className="flex justify-center mb-8 overflow-x-auto pb-2">
            <div className="flex gap-3 px-4">
              {categories.map(category => (
                <Button
                  key={category}
                  onClick={() => scrollToCategory(category)}
                  className="bg-lightBrown hover:bg-brown text-white whitespace-nowrap px-6 py-2 rounded-full shadow-md"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          
          {categories.map(category => {
            const categoryItems = menuItems.filter(item => item.category === category && item.isAvailable)
            if (categoryItems.length === 0) return null

            return (
              <div key={category} id={`category-${category}`} className="mb-12 scroll-mt-24">
                <h3 className="text-2xl font-bold text-brown mb-6 border-b-2 border-lightBrown pb-2">{category}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryItems.map(item => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all border-brown/20 group">
                      {item.imageUrl && (
                        <div className="h-48 overflow-hidden bg-gray-100">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-charcoal">{item.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-brown">₹{item.price}</span>
                        <Button 
                          onClick={() => addToCart(item)} 
                          className="bg-lightBrown hover:bg-lightBrown/90 text-white"
                        >
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
        </section>

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <div className="fixed bottom-6 right-6 z-40 animate-fadeIn">
            <Button
              onClick={goToCart}
              size="lg"
              className="bg-brown hover:bg-brown/90 text-white shadow-2xl rounded-full px-6 py-6"
            >
              <ShoppingCart className="w-6 h-6 mr-2" />
              View Cart ({cart.length})
            </Button>
          </div>
        )}

        {renderOrderTypeModal()}
      </div>
    )
  }

  // Auth Page (Merged Login/Signup)
  const renderAuth = () => {
    const isLogin = currentPage === 'login'

    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-white to-cream">
        {renderHeader()}
        
        <div className="flex items-center justify-center p-4 py-12">
          <Card className="w-full max-w-md bg-white border-brown/20 shadow-xl">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="bg-brown p-4 rounded-full">
                  <User className="w-10 h-10 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl text-center text-charcoal">
                {isLogin ? 'Login' : 'Sign Up'}
              </CardTitle>
              <CardDescription className="text-center">
                {isLogin ? 'Welcome back! Please login to continue' : 'Create your account to get started'}
              </CardDescription>
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
                    className="bg-white border-brown/30"
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
                  className="bg-white border-brown/30"
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
                    className="bg-white border-brown/30 pr-10"
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

              <Button
                onClick={() => handleAuth(isLogin ? 'login' : 'signup')}
                disabled={isLoading}
                className="w-full bg-brown hover:bg-brown/90 text-white font-semibold"
              >
                {isLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
              </Button>

              <div className="text-center text-sm text-warmGray">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setCurrentPage(isLogin ? 'signup' : 'login')}
                  className="text-brown hover:underline font-semibold"
                >
                  {isLogin ? 'Sign up' : 'Login'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Customer Dashboard
  const renderCustomerDashboard = () => {
    const categories = [...new Set(menuItems.map(item => item.category))]

    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-white to-cream">
        {renderHeader()}

        <div className="container mx-auto px-4 py-8">
          {/* Order Type Selector */}
          <Card className="mb-6 border-brown/20">
            <CardContent className="pt-6">
              <Label className="text-lg font-semibold mb-3 block">Order Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setOrderType('dine')}
                  variant={orderType === 'dine' ? 'default' : 'outline'}
                  className={`h-20 ${orderType === 'dine' ? 'bg-brown hover:bg-brown/90 text-white' : 'border-brown/30'}`}
                >
                  <Store className="w-6 h-6 mr-2" />
                  <div>
                    <div className="font-semibold">Dine-In</div>
                    <div className="text-xs opacity-80">Pay at table</div>
                  </div>
                </Button>
                <Button
                  onClick={() => setOrderType('delivery')}
                  variant={orderType === 'delivery' ? 'default' : 'outline'}
                  className={`h-20 ${orderType === 'delivery' ? 'bg-lightBrown hover:bg-lightBrown/90 text-white' : 'border-brown/30'}`}
                >
                  <Bike className="w-6 h-6 mr-2" />
                  <div>
                    <div className="font-semibold">Delivery</div>
                    <div className="text-xs opacity-80">Cash on delivery</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-brown/10">
              <TabsTrigger value="menu" className="data-[state=active]:bg-brown data-[state=active]:text-white">Menu</TabsTrigger>
              <TabsTrigger value="cart" className="data-[state=active]:bg-brown data-[state=active]:text-white">
                Cart ({cart.length})
              </TabsTrigger>
              <TabsTrigger value="reservations" className="data-[state=active]:bg-brown data-[state=active]:text-white">Reservations</TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-brown data-[state=active]:text-white">My Orders</TabsTrigger>
            </TabsList>

            {/* Menu Tab */}
            <TabsContent value="menu" className="space-y-6">
              {/* Category Bar */}
              <div className="flex justify-center mb-6 overflow-x-auto pb-2">
                <div className="flex gap-3 px-4">
                  {categories.map(category => (
                    <Button
                      key={category}
                      onClick={() => scrollToCategory(category)}
                      className="bg-lightBrown hover:bg-brown text-white whitespace-nowrap px-6 py-2 rounded-full shadow-md"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {categories.map(category => {
                const categoryItems = menuItems.filter(item => item.category === category && item.isAvailable)
                if (categoryItems.length === 0) return null

                return (
                  <div key={category} id={`category-${category}`} className="scroll-mt-24">
                    <h2 className="text-2xl font-bold text-brown mb-4 border-b-2 border-lightBrown pb-2">{category}</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryItems.map(item => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-shadow border-brown/20">
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
                            <span className="text-2xl font-bold text-brown">₹{item.price}</span>
                            <Button onClick={() => addToCart(item)} className="bg-lightBrown hover:bg-lightBrown/90 text-white">
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
              <Card className="border-brown/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Your Cart</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-center text-warmGray py-8">Your cart is empty</p>
                  ) : (
                    <>
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-cream/30 rounded-lg border border-brown/20">
                          <div className="flex-1">
                            <h3 className="font-semibold text-charcoal">{item.name}</h3>
                            <p className="text-sm text-warmGray">₹{item.price} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, -1)} className="border-brown/30">
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, 1)} className="border-brown/30">
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

                      <div className="border-t-2 border-brown pt-4 mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xl font-bold text-charcoal">Total:</span>
                          <span className="text-2xl font-bold text-brown">₹{getCartTotal().toFixed(2)}</span>
                        </div>
                        <Button onClick={placeOrder} disabled={isLoading} className="w-full bg-brown hover:bg-brown/90 text-white font-semibold text-lg py-6">
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
                <Card className="border-brown/20">
                  <CardContent className="py-12">
                    <p className="text-center text-warmGray">No orders yet</p>
                  </CardContent>
                </Card>
              ) : (
                orders.map(order => (
                  <Card key={order.id} className="border-brown/20">
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
                        <span className="font-semibold text-charcoal">{order.orderType === 'dine' ? 'Dine-in' : 'Delivery'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-warmGray">Payment:</span>
                        <span className="font-semibold text-charcoal">{order.paymentMethod === 'dine' ? 'Pay at table' : 'Cash on delivery'}</span>
                      </div>
                      <div className="border-t border-brown/20 pt-2 mt-2">
                        <h4 className="font-semibold text-charcoal mb-2">Items:</h4>
                        {order.order_items?.map(item => (
                          <div key={item.id} className="flex justify-between text-sm py-1">
                            <span className="text-warmGray">{item.itemName} x{item.quantity}</span>
                            <span className="text-charcoal">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t-2 border-brown">
                        <span className="font-bold text-charcoal">Total:</span>
                        <span className="text-xl font-bold text-brown">₹{order.totalAmount}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <div className="fixed bottom-6 right-6 z-40 animate-fadeIn">
            <Button
              onClick={goToCart}
              size="lg"
              className="bg-brown hover:bg-brown/90 text-white shadow-2xl rounded-full px-6 py-6"
            >
              <ShoppingCart className="w-6 h-6 mr-2" />
              View Cart ({cart.length})
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Staff Dashboard
  const renderStaffDashboard = () => {
    const pendingOrders = allOrders.filter(o => o.status === 'pending')
    const activeOrders = allOrders.filter(o => ['accepted', 'preparing'].includes(o.status))
    const completedOrders = allOrders.filter(o => ['ready', 'completed', 'rejected'].includes(o.status))

    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal via-warmGray/20 to-charcoal">
        {renderHeader()}

        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-cream/10">
              <TabsTrigger value="orders" className="data-[state=active]:bg-brown data-[state=active]:text-white">
                Orders Management {pendingOrders.length > 0 && `(${pendingOrders.length} pending)`}
              </TabsTrigger>
              <TabsTrigger value="menu" className="data-[state=active]:bg-brown data-[state=active]:text-white">Menu Management</TabsTrigger>
            </TabsList>

            {/* Orders Management Tab */}
            <TabsContent value="orders" className="space-y-8">
              {/* Pending Orders */}
              {pendingOrders.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
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
                            <p className="text-sm text-warmGray">Type: <span className="font-semibold text-charcoal">{order.orderType === 'dine' ? 'Dine-in' : 'Delivery'}</span></p>
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
                          <div className="flex justify-between items-center pt-2 border-t-2 border-brown">
                            <span className="font-bold">Total:</span>
                            <span className="text-xl font-bold text-brown">₹{order.totalAmount}</span>
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
                  <h2 className="text-2xl font-bold text-white mb-4">Active Orders ({activeOrders.length})</h2>
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
                            <p className="text-sm text-warmGray">Type: <span className="font-semibold text-charcoal">{order.orderType === 'dine' ? 'Dine-in' : 'Delivery'}</span></p>
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
                          <div className="flex justify-between items-center pt-2 border-t-2 border-brown">
                            <span className="font-bold">Total:</span>
                            <span className="text-xl font-bold text-brown">₹{order.totalAmount}</span>
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
                  <h2 className="text-2xl font-bold text-white mb-4">Recent Completed Orders</h2>
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
                          <p className="text-lg font-bold text-brown">₹{order.totalAmount}</p>
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
              <Card className="bg-cream border-brown/30">
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
                        className="bg-white border-brown/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price (₹) *</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={menuForm.price}
                        onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                        className="bg-white border-brown/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Item description"
                      value={menuForm.description}
                      onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                      className="bg-white border-brown/30"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={menuForm.category} onValueChange={(val) => setMenuForm({ ...menuForm, category: val })}>
                        <SelectTrigger className="bg-white border-brown/30">
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
                          className="bg-white border-brown/30"
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
                      className="w-4 h-4 text-brown border-brown/30 rounded focus:ring-brown"
                    />
                    <Label htmlFor="available" className="cursor-pointer">Mark as available</Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={saveMenuItem} disabled={isLoading} className="bg-brown hover:bg-brown/90 text-white">
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
                      }} variant="outline" className="border-brown text-charcoal">
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Menu Items List */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map(item => (
                  <Card key={item.id} className="bg-cream border-brown/20">
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
                      <p className="text-xl font-bold text-brown">₹{item.price}</p>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button onClick={() => startEditMenuItem(item)} size="sm" variant="outline" className="flex-1 border-brown/30">
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
      {currentPage === 'home' && renderHome()}
      {(currentPage.includes('login') || currentPage.includes('signup')) && renderAuth()}
      {currentPage === 'customer-dashboard' && renderCustomerDashboard()}
      {currentPage === 'staff-dashboard' && renderStaffDashboard()}
      <Toaster />
    </>
  )
}
