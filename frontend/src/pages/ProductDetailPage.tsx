import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product, Vendor } from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { useCartStore } from '../stores/useCartStore';
import { useWishlistStore } from '../stores/useWishlistStore';
import { useChatStore } from '../stores/useChatStore';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import { cn } from '../lib/utils';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  MessageSquare,
  Heart,
  ShoppingCart,
  Check,
  Zap,
  Globe,
  Tag,
  Share2,
  ChevronRight,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const { addItem, isLoading: isCartLoading } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { startConversationWithVendor } = useChatStore();
  const { formatPrice, location } = usePreferencesStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setIsLoading(true);
    apiRequest<Product>(`/products/${productId}`)
      .then((prod) => {
        setProduct(prod);
        if (prod.variants && prod.variants.length > 0) {
          const init: Record<string, string> = {};
          prod.variants.forEach((v) => {
            init[v.name] = v.options[0];
          });
          setSelectedVariants(init);
        }
        return apiRequest<Vendor>(`/vendors/${prod.vendorId}`);
      })
      .then((v) => setVendor(v))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [productId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-zinc-500">
        <div className="h-10 w-10 mx-auto rounded-full border-2 border-white border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-zinc-400">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-zinc-100">
        <h2 className="text-2xl font-black mb-2">Product Not Found</h2>
        <button
          onClick={() => navigate('/shop/products')}
          className="rounded-full bg-white px-6 py-2.5 text-xs font-bold text-black hover:bg-zinc-200 mt-4"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.productId);

  const finalPrice = product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const handleAddToCart = async () => {
    await addItem(product.productId, quantity, selectedVariants);
    setIsAddedSuccess(true);
    setTimeout(() => setIsAddedSuccess(false), 2000);
  };

  const handleBuyNow = async () => {
    await addItem(product.productId, quantity, selectedVariants);
    navigate('/shop/checkout');
  };

  const handleContactSeller = () => {
    startConversationWithVendor(product.vendorId, product.productId);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20">
      {/* 1. BREADCRUMBS STRIP */}
      <div className="bg-[#0c0c0e] border-b border-zinc-800/80 px-4 py-2.5 text-xs text-zinc-400">
        <div className="mx-auto max-w-7xl flex items-center gap-1.5 flex-wrap">
          <Link to="/shop" className="hover:text-white">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/shop/products" className="hover:text-white">Products</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-zinc-500">{product.categoryName}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-zinc-200 truncate max-w-[200px]">{product.title}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Gallery (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#121215] border border-zinc-800 p-6 flex items-center justify-center shadow-xl">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                className="max-h-full max-w-full object-contain"
              />

              {product.discount > 0 && (
                <span className="absolute top-4 left-4 rounded-full bg-white text-black px-2.5 py-1 text-xs font-black shadow-md">
                  {product.discount}% OFF
                </span>
              )}

              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full bg-black/60 border border-zinc-800 backdrop-blur-sm transition-all active:scale-90',
                    isFavorited ? 'text-rose-500' : 'text-zinc-400 hover:text-white'
                  )}
                  title="Save to Wishlist"
                >
                  <Heart className={cn('h-4 w-4', isFavorited && 'fill-rose-500')} />
                </button>

                <button
                  onClick={handleShare}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 border border-zinc-800 backdrop-blur-sm text-zinc-400 hover:text-white transition-all active:scale-90"
                  title="Share link"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              {copiedLink && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black text-[11px] px-3 py-1 rounded-full shadow-lg font-bold">
                  Link copied!
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      'h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-[#121215] p-1 transition-all',
                      activeImageIndex === idx
                        ? 'border-white'
                        : 'border-zinc-800 hover:border-zinc-700'
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CENTER: Specifications (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  {product.brand}
                </span>
                {product.categoryId === 'cat-global' && (
                  <span className="rounded bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.5 text-[10px] font-bold">
                    Tokyo Import
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
                {product.title}
              </h1>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-xs font-bold text-white">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-zinc-400">
                  {product.reviewCount} Ratings & Verified Reviews
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="border-t border-b border-zinc-800 py-3">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {formatPrice(finalPrice)}
                </span>
                {product.discount > 0 && (
                  <>
                    <span className="text-sm text-zinc-500 line-through">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-400">
                      {product.discount}% off
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Bank Offers Pill Box */}
            <div className="rounded-xl bg-[#141418] border border-zinc-800 p-3 space-y-1 text-xs text-zinc-300">
              <span className="font-bold text-zinc-200 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                <Tag className="h-3.5 w-3.5 text-zinc-400" /> Promotional Discount
              </span>
              <p className="text-zinc-400">
                Use code <strong className="text-white">CONVO10</strong> at checkout for 10% instant discount.
              </p>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3 pt-2">
                {product.variants.map((v) => (
                  <div key={v.id}>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5 block">
                      {v.name}: <span className="text-white">{selectedVariants[v.name]}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {v.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() =>
                            setSelectedVariants((prev) => ({ ...prev, [v.name]: opt }))
                          }
                          className={cn(
                            'rounded-xl px-3 py-1.5 text-xs font-bold border transition-all',
                            selectedVariants[v.name] === opt
                              ? 'border-white bg-zinc-800 text-white'
                              : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white bg-[#121215]'
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Overview
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                {product.description}
              </p>
            </div>

            {/* Technical Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Specifications
                </h3>
                <div className="rounded-xl border border-zinc-800 bg-[#121215] divide-y divide-zinc-800/80 text-xs">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="flex justify-between p-2.5">
                      <span className="text-zinc-500 font-medium">{key}</span>
                      <span className="text-zinc-200 font-bold text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Buy Box (3 Cols) */}
          <div className="lg:col-span-3">
            <div className="sticky top-28 rounded-2xl border border-zinc-800 bg-[#121215] p-5 shadow-2xl space-y-4">
              <div>
                <span className="text-2xl font-black text-white block">
                  {formatPrice(finalPrice)}
                </span>
                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Free delivery to <strong className="text-white">{location.city}</strong></span>
                </p>
              </div>

              <div>
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <Check className="h-4 w-4" /> In Stock ({product.stock} units ready)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-400">Out of Stock</span>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1">Quantity</label>
                <div className="flex items-center rounded-xl border border-zinc-800 bg-[#16161a] w-28">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-2.5 py-1 text-zinc-400 hover:text-white rounded-l-xl font-bold"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-xs font-bold text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="px-2.5 py-1 text-zinc-400 hover:text-white rounded-r-xl font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isCartLoading || product.stock === 0}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all active:scale-95 disabled:opacity-50',
                    isAddedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white hover:bg-zinc-200 text-black'
                  )}
                >
                  {isAddedSuccess ? (
                    <>
                      <Check className="h-4 w-4" /> Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" /> Add to Cart
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black py-2.5 px-4 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" /> Buy Now
                </button>
              </div>

              {/* Contact Seller */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <button
                  onClick={handleContactSeller}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 py-2.5 px-4 text-xs font-bold text-zinc-200 transition-colors"
                >
                  <MessageSquare className="h-4 w-4 text-zinc-400" />
                  Message Seller
                </button>
                <p className="text-[10px] text-zinc-500 text-center">
                  Direct verified seller communication powered by Nexconn
                </p>
              </div>

              {vendor && (
                <div className="pt-3 border-t border-zinc-800 text-xs space-y-1 text-zinc-400">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Merchant:</span>
                    <span className="font-bold text-zinc-200">{vendor.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Guarantee:</span>
                    <span className="text-zinc-300">7 Days Replacement</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
