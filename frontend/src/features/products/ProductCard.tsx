import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@convocart/shared';
import { Heart, ShoppingBag, MessageSquare, Star, Check } from 'lucide-react';
import { useWishlistStore } from '../../stores/useWishlistStore';
import { useCartStore } from '../../stores/useCartStore';
import { useChatStore } from '../../stores/useChatStore';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { cn } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { addItem, isLoading: isCartLoading } = useCartStore();
  const { startConversationWithVendor } = useChatStore();
  const { formatPrice } = usePreferencesStore();

  const [isAdded, setIsAdded] = useState(false);
  const isFavorited = isInWishlist(product.productId);

  const finalPrice = product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const handleContactSeller = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startConversationWithVendor(product.vendorId, product.productId);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addItem(product.productId, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="group relative flex flex-col h-full rounded-2xl border border-zinc-800/80 bg-[#121215] p-4 transition-all duration-200 hover:border-zinc-700 hover:bg-[#15151a]">
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#0c0c0e] border border-zinc-800/50 flex items-center justify-center">
        <Link to={`/shop/products/${product.productId}`} className="h-full w-full">
          <img
            src={product.images[0]}
            alt={product.title}
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Subtle Discount Pill */}
        {product.discount > 0 && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-white/10 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white border border-white/10">
            -{product.discount}%
          </span>
        )}

        {/* Global Import Pill */}
        {product.categoryId === 'cat-global' && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-blue-500/10 text-sky-400 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur-xs">
            Tokyo Import
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={cn(
            'absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 border border-zinc-800 backdrop-blur-sm transition-transform active:scale-90',
            isFavorited ? 'text-rose-500' : 'text-zinc-400 hover:text-white'
          )}
          title="Save to Wishlist"
        >
          <Heart className={cn('h-3.5 w-3.5', isFavorited && 'fill-rose-500')} />
        </button>
      </div>

      {/* Product Details */}
      <div className="mt-3.5 flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">{product.brand}</span>
            <div className="flex items-center gap-1 font-semibold text-zinc-300">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          </div>

          <Link to={`/shop/products/${product.productId}`}>
            <h3 className="line-clamp-2 text-xs font-bold text-zinc-100 group-hover:text-zinc-300 transition-colors leading-snug">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* Price & Actions */}
        <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-white">
                {formatPrice(finalPrice)}
              </span>
              {product.discount > 0 && (
                <span className="text-[11px] text-zinc-500 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAddToCart}
              disabled={isCartLoading || product.stock === 0}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40',
                isAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-zinc-200 text-black font-bold'
              )}
            >
              {isAdded ? (
                <>
                  <Check className="h-3 w-3" /> Added
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3 w-3" /> Add
                </>
              )}
            </button>

            <button
              onClick={handleContactSeller}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white transition-colors"
              title="Message Seller"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
