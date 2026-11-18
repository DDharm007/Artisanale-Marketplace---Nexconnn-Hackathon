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
    <div className="group relative flex flex-col h-full rounded-2xl border border-[#E4DEC8] bg-white transition-all duration-200 hover:shadow-[0_8px_24px_rgba(23,23,23,.06)] hover:-translate-y-0.5">
      {/* Product Image on Warm Alabaster Stage */}
      <div className="relative overflow-hidden rounded-t-2xl bg-[#FAF8F3] aspect-square flex items-center justify-center">
        <Link to={`/shop/products/${product.productId}`} className="block h-full w-full">
          <img
            src={product.images[0]}
            alt={product.title}
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </Link>

        {/* Discount badge */}
        {product.discount > 0 && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-[#F5F1E8] border border-[#D6B875]/60 px-2 py-0.5 text-[10px] font-bold text-[#171717] tracking-wider uppercase">
            -{product.discount}%
          </span>
        )}

        {/* Wishlist heart */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product); }}
          className={cn(
            'absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 border border-[#E4DEC8] shadow-xs transition-transform active:scale-90 hover:scale-105 cursor-pointer',
            isFavorited ? 'text-[#D6B875]' : 'text-[#8C867A] hover:text-[#171717]'
          )}
          title="Save to Wishlist"
        >
          <Heart className={cn('h-4 w-4', isFavorited && 'fill-[#D6B875] text-[#D6B875]')} />
        </button>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          {/* Brand & rating row */}
          <div className="flex items-center justify-between text-xs text-[#8C867A] mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#686359]">{product.brand}</span>
            <div className="flex items-center gap-1 font-medium">
              <Star className="h-3 w-3 fill-[#D6B875] text-[#D6B875]" />
              <span className="text-[#171717] font-semibold">{product.rating.toFixed(1)}</span>
              <span className="text-[#8C867A]">({product.reviewCount})</span>
            </div>
          </div>

          <Link to={`/shop/products/${product.productId}`}>
            <h3 className="line-clamp-2 text-sm font-medium text-[#171717] hover:text-[#D6B875] transition-colors leading-snug">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* Price & actions */}
        <div className="mt-4 pt-3 border-t border-[#F0EBE0] flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-[#171717]">{formatPrice(finalPrice)}</span>
              {product.discount > 0 && (
                <span className="text-xs text-[#8C867A] line-through">{formatPrice(product.price)}</span>
              )}
            </div>
            {product.stock === 0 && (
              <span className="text-[10px] text-red-600 font-semibold uppercase tracking-wide">Out of stock</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAddToCart}
              disabled={isCartLoading || product.stock === 0}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 cursor-pointer',
                isAdded
                  ? 'bg-[#171717] text-[#D6B875]'
                  : 'bg-[#171717] text-white hover:bg-black shadow-xs'
              )}
            >
              {isAdded ? (
                <><Check className="h-3 w-3 text-[#D6B875]" /> Added</>
              ) : (
                <><ShoppingBag className="h-3 w-3" /> Add</>
              )}
            </button>
            <button
              onClick={handleContactSeller}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E4DEC8] bg-white text-[#686359] hover:border-[#171717] hover:text-[#171717] transition-colors cursor-pointer"
              title="Message Artisan"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
