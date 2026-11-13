import { create } from 'zustand';
import { Product } from '@convocart/shared';

interface WishlistState {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  removeItem: (productId: string) => void;
}

const STORAGE_KEY = 'convocart_wishlist_items';

const getInitialWishlist = (): Product[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: getInitialWishlist(),

  toggleWishlist: (product: Product) => {
    const current = get().items;
    const exists = current.some((p) => p.productId === product.productId);
    const updated = exists
      ? current.filter((p) => p.productId !== product.productId)
      : [...current, product];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },

  isInWishlist: (productId: string) => {
    return get().items.some((p) => p.productId === productId);
  },

  removeItem: (productId: string) => {
    const updated = get().items.filter((p) => p.productId !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },
}));
