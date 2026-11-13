import React from 'react';
import { useWishlistStore } from '../stores/useWishlistStore';
import { useCartStore } from '../stores/useCartStore';
import { formatCurrency } from '../lib/utils';
import { Heart, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();

  const handleMoveToCart = async (productId: string) => {
    await addItem(productId, 1);
    removeItem(productId);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900">My Saved Wishlist</h1>
        <p className="text-xs text-slate-500 mt-1">
          {items.length} {items.length === 1 ? 'item' : 'items'} saved for later
        </p>
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <Heart className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">Your wishlist is empty</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Click the heart icon on any product to save it to your personal wishlist.
          </p>
          <button
            onClick={() => navigate('/shop/products')}
            className="rounded-2xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-brand-700"
          >
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((p) => {
            const finalPrice = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
            return (
              <div
                key={p.productId}
                className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 mb-3">
                    <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
                    <button
                      onClick={() => removeItem(p.productId)}
                      className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-400 hover:text-rose-600 shadow-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {p.brand}
                  </span>
                  <Link to={`/shop/products/${p.productId}`}>
                    <h4 className="text-xs font-bold text-slate-900 hover:text-brand-600 line-clamp-2 mt-0.5">
                      {p.title}
                    </h4>
                  </Link>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-sm font-extrabold text-slate-900 mb-3">
                    {formatCurrency(finalPrice)}
                  </div>
                  <button
                    onClick={() => handleMoveToCart(p.productId)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-brand-600 transition-colors"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Move to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
