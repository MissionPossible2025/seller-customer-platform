import { useState, useEffect } from 'react'
import { getCurrentUser, getUserId } from '../utils/userUtils'

export const useCart = () => {
  const [cartItemCount, setCartItemCount] = useState(0)
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)


  // Fetch cart data
  const fetchCart = async () => {
    try {
      setLoading(true)
      const user = getCurrentUser()
      if (!user) {
        setCart({ items: [], totalAmount: 0 })
        setCartItemCount(0)
        return
      }

      const userId = getUserId(user)
      
      if (!userId) {
        setCart({ items: [], totalAmount: 0 })
        setCartItemCount(0)
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cart/${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Cart data:', data.cart) // Debug log
        
        // Test: Add tax percentage to cart items for testing
        if (data.cart && data.cart.items) {
          data.cart.items.forEach(item => {
            if (item.product) {
              item.product.taxPercentage = 10; // Test with 10% tax
            }
          });
          console.log('Test: Added 10% tax to all cart items')
        }
        
        setCart(data.cart)
        const itemCount = data.cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0
        setCartItemCount(itemCount)
      } else {
        setCart({ items: [], totalAmount: 0 })
        setCartItemCount(0)
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err)
      setCart({ items: [], totalAmount: 0 })
      setCartItemCount(0)
    } finally {
      setLoading(false)
    }
  }

  // Fetch only cart count (lighter operation)
  const fetchCartCount = async () => {
    try {
      const user = getCurrentUser()
      if (!user) {
        setCartItemCount(0)
        return
      }

      const userId = getUserId(user)
      
      if (!userId) {
        setCartItemCount(0)
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cart/${userId}`)
      const data = await response.json()
      
      if (response.ok) {
        const itemCount = data.cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0
        setCartItemCount(itemCount)
      } else {
        setCartItemCount(0)
      }
    } catch (err) {
      console.error('Failed to fetch cart count:', err)
      setCartItemCount(0)
    }
  }

  // Add item to cart
  const addToCart = async (product, quantity = 1, variant = null) => {
    try {
      const user = getCurrentUser()
      console.log('addToCart: User data from localStorage:', user)
      
      if (!user) {
        throw new Error('Please log in to add items to cart')
      }

      const userId = getUserId(user)
      console.log('addToCart: Extracted user ID:', userId)
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.')
      }

      const cartData = {
        userId: userId,
        productId: product._id,
        quantity: quantity
      }

      // Add variant data if product has variations
      if (product.hasVariations && variant) {
        cartData.variant = {
          combination: variant.combination,
          price: variant.discountedPrice && variant.discountedPrice < variant.price 
            ? variant.discountedPrice 
            : variant.price,
          originalPrice: variant.price,
          stock: variant.stock
        }
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartData)
      })

      const data = await response.json()
      
      if (response.ok) {
        // Refresh cart count after successful add
        await fetchCartCount()
        return { success: true, message: `₹{quantity} item(s) added to cart successfully!` }
      } else {
        throw new Error(data.error || 'Failed to add item to cart')
      }
    } catch (error) {
      return { success: false, message: error.message || 'Failed to add item to cart' }
    }
  }

  // Update cart item quantity
  const updateCartItem = async (productId, quantity) => {
    try {
      const user = getCurrentUser()
      const userId = getUserId(user)

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cart/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          productId: productId,
          quantity: quantity
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setCart(data.cart)
        const itemCount = data.cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0
        setCartItemCount(itemCount)
        return { success: true, message: 'Cart updated successfully!' }
      } else {
        throw new Error(data.error || 'Failed to update cart')
      }
    } catch (error) {
      return { success: false, message: error.message || 'Failed to update cart' }
    }
  }

  // Remove item from cart
  const removeFromCart = async (productId) => {
    try {
      const user = getCurrentUser()
      const userId = getUserId(user)

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cart/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          productId: productId
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setCart(data.cart)
        const itemCount = data.cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0
        setCartItemCount(itemCount)
        return { success: true, message: 'Item removed from cart!' }
      } else {
        throw new Error(data.error || 'Failed to remove item')
      }
    } catch (error) {
      return { success: false, message: error.message || 'Failed to remove item' }
    }
  }

  // Clear entire cart
  const clearCart = async () => {
    try {
      const user = getCurrentUser()
      const userId = getUserId(user)

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/cart/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setCart(data.cart)
        setCartItemCount(0)
        return { success: true, message: 'Cart cleared successfully!' }
      } else {
        throw new Error(data.error || 'Failed to clear cart')
      }
    } catch (error) {
      return { success: false, message: error.message || 'Failed to clear cart' }
    }
  }

  return {
    cart,
    cartItemCount,
    loading,
    fetchCart,
    fetchCartCount,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
  }
}
