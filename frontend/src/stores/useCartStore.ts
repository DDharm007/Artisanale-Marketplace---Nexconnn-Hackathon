import { create } from 'zustand';
import { Cart, CartItem } from '@convocart/shared';
import { apiRequest } from '../lib/api';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  subtotal: number;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number, selectedVariant?: Record<string, string>) => Promise<void>;
  updateQty: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  itemCount: 0,
  subtotal: 0,

  fetchCart: async () => {
    try {
      const cart = await apiRequest<Cart>('/cart');
      const count = cart.items.reduce((acc, i) => acc + i.quantity, 0);
      const sub = cart.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      set({ cart, itemCount: count, subtotal: sub });
    } catch {
      // ignore guest cart error
    }
  },

  addItem: async (productId, quantity = 1, selectedVariant) => {
    set({ isLoading: true });
    try {
      const updated = await apiRequest<Cart>('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity, selectedVariant }),
      });
      const count = updated.items.reduce((acc, i) => acc + i.quantity, 0);
      const sub = updated.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      set({ cart: updated, itemCount: count, subtotal: sub, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  updateQty: async (productId, quantity) => {
    try {
      const updated = await apiRequest<Cart>(`/cart/items/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      const count = updated.items.reduce((acc, i) => acc + i.quantity, 0);
      const sub = updated.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      set({ cart: updated, itemCount: count, subtotal: sub });
    } catch (err) {
      throw err;
    }
  },

  removeItem: async (productId) => {
    try {
      const updated = await apiRequest<Cart>(`/cart/items/${productId}`, {
        method: 'DELETE',
      });
      const count = updated.items.reduce((acc, i) => acc + i.quantity, 0);
      const sub = updated.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      set({ cart: updated, itemCount: count, subtotal: sub });
    } catch (err) {
      throw err;
    }
  },

  clearCart: async () => {
    try {
      const updated = await apiRequest<Cart>('/cart', {
        method: 'DELETE',
      });
      set({ cart: updated, itemCount: 0, subtotal: 0 });
    } catch (err) {
      throw err;
    }
  },
}));
