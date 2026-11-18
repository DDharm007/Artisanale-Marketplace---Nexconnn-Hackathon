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
  ArrowRight,
  Sparkles,
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
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-[#686359]">
        <div className="h-10 w-10 mx-auto rounded-full border-2 border-[#171717] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#171717]">Loading artisanal creation...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-[#171717]">
        <h2
          className="text-3xl font-normal mb-2"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
        >
          Creation Not Found
        </h2>
        <p className="text-xs text-[#686359] max-w-sm mx-auto mb-6">
          The requested studio piece may have been acquired or moved.
        </p>
        <button
          onClick={() => navigate('/shop/products')}
          className="rounded-full bg-[#171717] px-7 py-3 text-xs font-bold text-[#D6B875] hover:bg-black transition-colors"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.productId);

  const finalPrice =
    product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;

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
    <div className="min-h-screen bg-[#ECEAE4] text-[#171717] pb-20">
      {/* 1. BREADCRUMBS STRIP */}
      <div className="bg-[#FAF8F3] border-b border-[#E4DEC8] px-4 py-3 text-xs text-[#686359]">
        <div className="mx-auto max-w-7xl flex items-center gap-1.5 flex-wrap">
          <Link to="/shop" className="hover:text-[#171717] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-[#A8A29E]" />
          <Link to="/shop/products" className="hover:text-[#171717] transition-colors">
            Creations
          </Link>
          <ChevronRight className="h-3 w-3 text-[#A8A29E]" />
          <span className="text-[#8C867A]">{product.categoryName}</span>
          <ChevronRight className="h-3 w-3 text-[#A8A29E]" />
          <span className="font-semibold text-[#171717] truncate max-w-[200px]">
            {product.title}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Gallery (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-white border border-[#E4DEC8] p-6 flex items-center justify-center shadow-xs">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                className="max-h-full max-w-full object-contain"
              />

              {product.discount > 0 && (
                <span className="absolute top-4 left-4 rounded-full bg-[#171717] text-[#D6B875] px-3 py-1 text-xs font-bold shadow-xs">
                  {product.discount}% OFF
                </span>
              )}

              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-[#E4DEC8] shadow-xs transition-all active:scale-95 cursor-pointer',
                    isFavorited ? 'text-rose-600' : 'text-[#686359] hover:text-[#171717]'
                  )}
                  title="Save to Wishlist"
                  aria-label="Save to Wishlist"
                >
                  <Heart className={cn('h-4 w-4', isFavorited && 'fill-rose-600')} />
                </button>

                <button
                  onClick={handleShare}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-[#E4DEC8] shadow-xs text-[#686359] hover:text-[#171717] transition-all active:scale-95 cursor-pointer"
                  title="Share link"
                  aria-label="Share link"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              {copiedLink && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#171717] text-[#D6B875] text-[11px] px-3 py-1 rounded-full shadow-lg font-bold">
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
                      'h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 bg-white p-1 transition-all cursor-pointer',
                      activeImageIndex === idx
                        ? 'border-[#171717]'
                        : 'border-[#E4DEC8] hover:border-[#8C867A]'
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CENTER: Specifications & Overview (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C867A]">
                  {vendor?.businessName || product.brand || 'Artisan Studio'}
                </span>
                {product.categoryId === 'cat-global' && (
                  <span className="rounded-full bg-[#171717] text-[#D6B875] px-2 py-0.5 text-[10px] font-bold">
                    Kyoto Atelier
                  </span>
                )}
              </div>

              <h1
                className="text-2xl sm:text-3xl font-normal text-[#171717] leading-tight"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
              >
                {product.title}
              </h1>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 rounded-full bg-[#FAF8F3] border border-[#E4DEC8] px-2.5 py-0.5 text-xs font-semibold text-[#171717]">
                  <Star className="h-3 w-3 fill-[#D6B875] text-[#D6B875]" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-[#686359]">
                  ({product.reviewCount} verified collector critiques)
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="border-t border-b border-[#E4DEC8] py-3.5">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-[#171717]">
                  {formatPrice(finalPrice)}
                </span>
                {product.discount > 0 && (
                  <>
                    <span className="text-sm text-[#8C867A] line-through">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {product.discount}% privilege savings
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Privilege Code Pill Box */}
            <div className="rounded-2xl bg-[#FAF8F3] border border-[#E4DEC8] p-3.5 space-y-1 text-xs text-[#686359]">
              <span className="font-bold text-[#171717] flex items-center gap-1 text-[11px] uppercase tracking-wider">
                <Tag className="h-3.5 w-3.5 text-[#D6B875]" /> Collector Privilege Code
              </span>
              <p>
                Use code <strong className="text-[#171717]">CONVO10</strong> at checkout for 10% instant discount.
              </p>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3 pt-2">
                {product.variants.map((v) => (
                  <div key={v.id}>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#8C867A] mb-1.5 block">
                      {v.name}: <span className="text-[#171717]">{selectedVariants[v.name]}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {v.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() =>
                            setSelectedVariants((prev) => ({ ...prev, [v.name]: opt }))
                          }
                          className={cn(
                            'rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition-all cursor-pointer',
                            selectedVariants[v.name] === opt
                              ? 'border-[#171717] bg-[#171717] text-white'
                              : 'border-[#E4DEC8] text-[#686359] hover:border-[#171717] hover:text-[#171717] bg-white'
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C867A] mb-1.5">
                Provenance &amp; Overview
              </h3>
              <p className="text-xs sm:text-sm text-[#4A463F] leading-relaxed font-normal">
                {product.description}
              </p>
            </div>

            {/* Technical Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C867A] mb-2">
                  Atelier Specifications
                </h3>
                <div className="rounded-2xl border border-[#E4DEC8] bg-white divide-y divide-[#F0EBE0] text-xs">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="flex justify-between p-3">
                      <span className="text-[#686359] font-medium">{key}</span>
                      <span className="text-[#171717] font-semibold text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Buy Box (3 Cols) */}
          <div className="lg:col-span-3 w-full">
            <div className="rounded-3xl border border-[#E4DEC8] bg-white p-6 shadow-xs space-y-4">
              <div>
                <span className="text-2xl font-bold text-[#171717] block">
                  {formatPrice(finalPrice)}
                </span>
                <p className="text-xs text-[#686359] mt-1 flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-[#D6B875]" />
                  <span>
                    Direct delivery to <strong className="text-[#171717]">{location.city}</strong>
                  </span>
                </p>
              </div>

              <div>
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <Check className="h-4 w-4" /> In Studio Stock ({product.stock} units ready)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-700">Studio Batch Sold Out</span>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-bold text-[#8C867A] block mb-1.5">Quantity</label>
                <div className="flex items-center rounded-full border border-[#E4DEC8] bg-[#FAF8F3] w-32 p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-8 w-8 flex items-center justify-center text-[#171717] hover:bg-white rounded-full font-bold cursor-pointer transition-colors"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-xs font-bold text-[#171717]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="h-8 w-8 flex items-center justify-center text-[#171717] hover:bg-white rounded-full font-bold cursor-pointer transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isCartLoading || product.stock === 0}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 rounded-full py-3.5 px-4 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs',
                    isAddedSuccess
                      ? 'bg-emerald-700 text-white'
                      : 'bg-[#171717] hover:bg-black text-[#D6B875]'
                  )}
                >
                  {isAddedSuccess ? (
                    <>
                      <Check className="h-4 w-4" /> Added to Collector Bag
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" /> Add to Collector Bag
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-full border border-[#171717] bg-white hover:bg-[#FAF8F3] text-[#171717] py-3.5 px-4 text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Zap className="h-4 w-4 text-[#D6B875]" /> Instant Acquisition
                </button>
              </div>

              {/* Contact Maker & Studio Dialogue */}
              <div className="pt-4 border-t border-[#E4DEC8] space-y-2.5">
                <button
                  onClick={handleContactSeller}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#FAF8F3] border border-[#E4DEC8] hover:bg-[#F2ECE1] py-3 px-4 text-xs font-bold text-[#171717] transition-colors cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 text-[#D6B875]" />
                  Chat Directly with Maker
                </button>

                <Link
                  to={`/shop/support?productId=${product.productId}`}
                  className="w-full flex items-center justify-center gap-2 rounded-full border border-[#E4DEC8] bg-white hover:bg-[#FAF8F3] py-2.5 px-4 text-xs font-semibold text-[#686359] transition-colors"
                >
                  Open Provenance Inquiry
                </Link>

                <p className="text-[10px] text-[#8C867A] text-center leading-relaxed">
                  Real-time direct studio dialogue with master artisans
                </p>
              </div>

              {vendor && (
                <div className="pt-3 border-t border-[#E4DEC8] text-xs space-y-1.5 text-[#686359]">
                  <div className="flex justify-between">
                    <span className="text-[#8C867A]">Studio:</span>
                    <span className="font-bold text-[#171717]">{vendor.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C867A]">Guarantee:</span>
                    <span className="text-[#171717]">Signed Provenance &amp; Free Returns</span>
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
