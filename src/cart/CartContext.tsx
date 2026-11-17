import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { Cart } from '../api/types'
import { useAuth } from '../auth/AuthContext'

const EMPTY_CART: Cart = { items: [], total: 0, itemCount: 0 }

interface CartState {
  cart: Cart
  /** False until the first answer from the server, so pages do not mistake "not loaded" for "empty". */
  loaded: boolean
  drawerOpen: boolean
  /** The product just added, so the drawer can point it out. */
  lastAddedId: number | null
  openDrawer: () => void
  closeDrawer: () => void
  refresh: () => Promise<void>
  add: (productId: number, quantity: number) => Promise<void>
  update: (productId: number, quantity: number) => Promise<void>
  remove: (productId: number) => Promise<void>
}

const CartContext = createContext<CartState | null>(null)

/** The cart lives on the server, so the badge, the drawer and the cart page always agree, on any device. */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [cart, setCart] = useState<Cart>(EMPTY_CART)
  const [loadedFor, setLoadedFor] = useState<number | null | undefined>(undefined)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [lastAddedId, setLastAddedId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setCart(user ? await api<Cart>('/api/cart') : EMPTY_CART)
  }, [user])

  useEffect(() => {
    const owner = user?.id ?? null
    refresh()
      .catch(() => setCart(EMPTY_CART))
      .finally(() => setLoadedFor(owner))
  }, [refresh, user])

  const loaded = loadedFor === (user?.id ?? null)

  const add = useCallback(async (productId: number, quantity: number) => {
    setCart(await api<Cart>('/api/cart/items', { method: 'POST', body: { productId, quantity } }))
    setLastAddedId(productId)
    setDrawerOpen(true)
  }, [])

  const update = useCallback(async (productId: number, quantity: number) => {
    setCart(await api<Cart>(`/api/cart/items/${productId}`, { method: 'PUT', body: { quantity } }))
  }, [])

  const remove = useCallback(async (productId: number) => {
    setCart(await api<Cart>(`/api/cart/items/${productId}`, { method: 'DELETE' }))
  }, [])

  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setLastAddedId(null)
  }, [])

  const value = useMemo(
    () => ({ cart, loaded, drawerOpen, lastAddedId, openDrawer, closeDrawer, refresh, add, update, remove }),
    [cart, loaded, drawerOpen, lastAddedId, openDrawer, closeDrawer, refresh, add, update, remove],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartState {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
