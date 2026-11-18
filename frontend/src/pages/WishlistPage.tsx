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
      <div className="pb-6 border-b border-[#E4DEC8]">
        <h1
          className="text-3xl font-normal text-[#171717]"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
        >
          My Saved Wishlist
        </h1>
        <p className="text-xs text-[#686359] mt-1">
          {items.length} {items.length === 1 ? 'item' : 'items'} saved for later
        </p>
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <Heart className="h-12 w-12 mx-auto text-[#C2BFB8] mb-3" />
          <h3 className="text-base font-bold text-[#171717]">Your wishlist is empty</h3>
          <p className="text-xs text-[#686359] mt-1 mb-4">
            Click the heart icon on any product to save it to your personal wishlist.
          </p>
          <button
            onClick={() => navigate('/shop/products')}
            className="rounded-full bg-[#171717] px-6 py-2.5 text-xs font-bold text-[#D6B875] hover:bg-black transition-colors"
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
                className="flex flex-col justify-between rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-4 shadow-xs"
              >
                <div>
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#ECEAE4] mb-3">
                    <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
                    <button
                      onClick={() => removeItem(p.productId)}
                      className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#8C867A] hover:text-rose-600 shadow-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C867A]">
                    {p.brand}
                  </span>
                  <Link to={`/shop/products/${p.productId}`}>
                    <h4 className="text-xs font-bold text-[#171717] hover:text-[#D6B875] line-clamp-2 mt-0.5">
                      {p.title}
                    </h4>
                  </Link>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E4DEC8]">
                  <div className="text-sm font-extrabold text-[#171717] mb-3">
                    {formatCurrency(finalPrice)}
                  </div>
                  <button
                    onClick={() => handleMoveToCart(p.productId)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-full bg-[#171717] py-2 text-xs font-bold text-[#D6B875] hover:bg-black transition-colors"
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
