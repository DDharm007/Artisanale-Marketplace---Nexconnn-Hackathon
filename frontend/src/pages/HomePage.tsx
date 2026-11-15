import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product, Vendor } from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { ProductCard } from '../features/products/ProductCard';
import { useChatStore } from '../stores/useChatStore';
import { useCartStore } from '../stores/useCartStore';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import {
  ArrowRight,
  Globe,
  MessageSquare,
  Truck,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Star,
  CheckCircle2,
  Sparkles,
  Phone,
  Video,
  Eye,
  ShieldCheck,
  ShoppingBag,
  Store,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { startConversationWithVendor, startCall } = useChatStore();
  const { addItem } = useCartStore();
  const { formatPrice, location } = usePreferencesStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorsList, setVendorsList] = useState<Vendor[]>([]);
  const [vendorsMap, setVendorsMap] = useState<Record<string, Vendor>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      apiRequest<{ products: Product[] }>('/products?limit=24'),
      apiRequest<Vendor[]>('/vendors').catch(() => [] as Vendor[]),
    ])
      .then(([prodData, vendorList]) => {
        const liveProducts = prodData.products || [];
        setProducts(liveProducts);
        const activeVendorIds = new Set(liveProducts.map((p) => p.vendorId));
        const activeVendors = (vendorList || []).filter((v) => activeVendorIds.has(v.vendorId));
        setVendorsList(activeVendors);
        const map: Record<string, Vendor> = {};
        for (const v of vendorList || []) map[v.vendorId] = v;
        setVendorsMap(map);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const tickerEvents =
    products.length > 0
      ? [
          `📦 ${products.length} seller-uploaded product${products.length === 1 ? '' : 's'} live with direct 1-on-1 seller chat`,
          `🏪 ${vendorsList.length} verified seller store${vendorsList.length === 1 ? '' : 's'} active with voice & video concierge`,
          '🌐 Real-time auto-translated Buyer ↔ Seller chat & product support hub active',
        ]
      : [
          '🏪 Live Marketplace Ready — awaiting seller-uploaded products',
          '💬 Direct Product Support & real-time 1-on-1 Buyer ↔ Seller Chat active',
        ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIdx((prev) => (prev + 1) % tickerEvents.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [tickerEvents.length]);

  const featured = products.filter((p) => p.isFeatured);
  const trending = products.filter((p) => p.isTrending);
  const showcaseFeatured = featured.length > 0 ? featured : products.slice(0, 8);
  const showcaseTrending = trending.length > 0 ? trending : products.slice(0, 8);

  const slideSource = showcaseFeatured.length > 0 ? showcaseFeatured : products.slice(0, 3);
  const heroSlides =
    slideSource.length > 0
      ? slideSource.map((p, idx) => {
          const seller = vendorsMap[p.vendorId];
          const discounted = Number((p.price * (1 - (p.discount || 0) / 100)).toFixed(2));
          const specChips = Object.values(p.specifications || {}).slice(0, 4);
          return {
            id: idx + 1,
            tag: `${p.isFeatured ? 'Featured' : 'Live'} • ${seller?.businessName || p.categoryName || p.brand}`,
            title: p.title,
            description: p.description,
            specs: specChips.length > 0 ? specChips : [p.categoryName || p.brand, `In Stock: ${p.stock}`],
            price: discounted,
            mrp: p.price,
            image: p.images[0] || '',
            productId: p.productId,
            vendorId: p.vendorId,
            sellerName: seller?.businessName || p.vendorName || 'Verified Seller',
            rating: p.rating,
            reviewCount: p.reviewCount,
          };
        })
      : [
          {
            id: 1,
            tag: isLoading ? 'Loading Live Marketplace...' : 'Live Seller Marketplace',
            title: isLoading ? 'Discover Conversational Commerce' : 'Seller Catalog Ready for Launch',
            description: isLoading
              ? 'Fetching live seller-uploaded products and real-time support channels.'
              : 'Only real seller-uploaded products appear here. Sign in or register as a Seller to publish your first product and connect with buyers in real time.',
            specs: ['Seller-Uploaded Only', '1-on-1 Product Chat', 'Real-Time Support'],
            price: 0,
            mrp: 0,
            image: '',
            productId: '',
            vendorId: '',
            sellerName: 'ConvoCart Marketplace',
            rating: 5.0,
            reviewCount: 0,
          },
        ];

  const safeSlideIdx = activeSlide % heroSlides.length;
  const currentSlide = heroSlides[safeSlideIdx];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20">
      {/* 1. LUXURY DARK HERO SHOWCASE */}
      <section className="relative overflow-hidden border-b border-zinc-800/80 bg-[#0c0c0f]">
        {/* Ambient radial glow */}
        <div className="absolute top-0 right-1/4 h-[450px] w-[450px] rounded-full bg-white/5 blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Product Information & Controls */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1 text-xs text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold uppercase tracking-wider text-[11px]">{currentSlide.tag}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08]">
                {currentSlide.title}
              </h1>

              <p className="text-sm text-zinc-400 leading-relaxed max-w-lg font-normal">
                {currentSlide.description}
              </p>

              {/* Spec Chips (Apple / Sony style) */}
              <div className="flex flex-wrap gap-2 pt-1">
                {currentSlide.specs.map((spec) => (
                  <span
                    key={spec}
                    className="rounded-full bg-zinc-900/90 border border-zinc-800 px-3 py-1 text-[11px] font-medium text-zinc-300 shadow-2xs"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* Price Block (shown when a seller product is highlighted) */}
              {currentSlide.productId && (
                <div className="flex items-baseline gap-3 pt-2">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {formatPrice(currentSlide.price)}
                  </span>
                  {currentSlide.mrp > currentSlide.price && (
                    <>
                      <span className="text-base text-zinc-500 line-through font-medium">
                        {formatPrice(currentSlide.mrp)}
                      </span>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                        Save {Math.round(((currentSlide.mrp - currentSlide.price) / currentSlide.mrp) * 100)}%
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {currentSlide.productId ? (
                  <Link
                    to={`/shop/products/${currentSlide.productId}`}
                    className="rounded-full bg-white px-7 py-3 text-xs font-extrabold text-black hover:bg-zinc-200 transition-all shadow-lg shadow-white/5 active:scale-95 flex items-center gap-2"
                  >
                    View Details <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    className="rounded-full bg-white px-7 py-3 text-xs font-extrabold text-black hover:bg-zinc-200 transition-all shadow-lg shadow-white/5 active:scale-95 flex items-center gap-2"
                  >
                    Sign In as Seller to Upload Product <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}

                {currentSlide.vendorId && (
                  <button
                    onClick={() => startConversationWithVendor(currentSlide.vendorId, currentSlide.productId)}
                    className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-5 py-3 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
                  >
                    <MessageSquare className="h-4 w-4 text-zinc-400" />
                    Message Seller
                  </button>
                )}

                {slideSource[safeSlideIdx] && (
                  <button
                    onClick={() => setQuickViewProduct(slideSource[safeSlideIdx])}
                    className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
                  >
                    <Eye className="h-3.5 w-3.5 text-emerald-400" /> Quick View
                  </button>
                )}
              </div>

              {/* Slide Switcher */}
              <div className="flex items-center gap-4 pt-4 border-t border-zinc-800/80 text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                  {heroSlides.map((slide, i) => (
                    <button
                      key={slide.id}
                      onClick={() => setActiveSlide(i)}
                      className={cn(
                        'h-2 rounded-full transition-all',
                        safeSlideIdx === i ? 'w-8 bg-white' : 'w-2 bg-zinc-700 hover:bg-zinc-600'
                      )}
                      title={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
                <span>
                  0{safeSlideIdx + 1} / 0{heroSlides.length}
                </span>

                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                    className="p-1 rounded-full border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveSlide((prev) => (prev + 1) % heroSlides.length)}
                    className="p-1 rounded-full border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Premium Edge-to-Edge Showcase Card */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative aspect-[4/3] sm:aspect-square w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-800 bg-[#141418] shadow-2xl group flex items-center justify-center">
                {currentSlide.image ? (
                  <img
                    src={currentSlide.image}
                    alt={currentSlide.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <Store className="h-12 w-12 text-emerald-400 mx-auto" />
                    <p className="text-sm font-bold text-white">No Seller Products Uploaded Yet</p>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                      Sellers upload real products from their dashboard. Buyers can then browse, open product support tickets, and chat live with the product&apos;s seller.
                    </p>
                  </div>
                )}

                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d]/90 via-[#0a0a0d]/20 to-transparent pointer-events-none" />

                {/* Floating Top Badge */}
                {currentSlide.productId && (
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-xs font-semibold text-white">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{currentSlide.rating}</span>
                    <span className="text-zinc-400">({currentSlide.reviewCount} reviews)</span>
                  </div>
                )}

                {/* Floating Bottom Card */}
                {currentSlide.productId && (
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-xs">
                    <div>
                      <span className="text-white font-bold block">{currentSlide.title}</span>
                      <span className="text-zinc-400 text-[11px]">Sold by {currentSlide.sellerName}</span>
                    </div>
                    <Link
                      to={`/shop/products/${currentSlide.productId}`}
                      className="rounded-full bg-white text-black px-3.5 py-1.5 text-xs font-bold hover:bg-zinc-200 transition-colors"
                    >
                      Shop Now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE ACTIVITY TICKER & TRUST STRIP */}
      <section className="border-b border-zinc-800/80 bg-[#0d0d11] py-2.5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-medium">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{tickerEvents[tickerIdx]}</span>
          </div>
          <Link
            to="/shop/support"
            className="text-[11px] font-bold text-sky-400 hover:text-sky-300 whitespace-nowrap"
          >
            Need Live Support? Open Nexconn × ConvoCart Support Hub →
          </Link>
        </div>
      </section>

      <section className="border-b border-zinc-800/80 bg-[#09090b] py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-zinc-400">
            <div className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 text-zinc-500 shrink-0" />
              <span>Free delivery to <strong className="text-zinc-200">{location.city}</strong></span>
            </div>
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-zinc-500 shrink-0" />
              <span>Direct imports with pre-paid customs</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-zinc-500 shrink-0" />
              <span>Direct verified seller messaging</span>
            </div>
            <div className="flex items-center gap-2.5">
              <RotateCcw className="h-4 w-4 text-zinc-500 shrink-0" />
              <span>7-day replacement guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SELLER-UPLOADED PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Seller-Uploaded Products</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Live marketplace inventory published by verified sellers</p>
          </div>
          <Link
            to="/shop/products"
            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white"
          >
            <span>View all</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {products.length === 0 && !isLoading ? (
          <div className="rounded-3xl border border-dashed border-zinc-800 bg-[#121215] p-12 text-center space-y-3">
            <Store className="h-10 w-10 text-zinc-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Seller Products Listed Yet</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              All static placeholder products have been removed. Register or sign in as a Seller and upload a product to populate the marketplace and enable product-based customer support &amp; real-time buyer–seller chat.
            </p>
            <div className="pt-2">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-[#00a884] px-5 py-2.5 text-xs font-bold text-[#111b21] hover:bg-[#029676]"
              >
                Seller Sign In / Upload Product <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {showcaseFeatured.map((p) => (
              <div key={p.productId} className="relative group/wrap flex flex-col">
                <ProductCard product={p} />
                <div className="mt-2 flex items-center justify-between gap-2 px-1">
                  <button
                    onClick={() => setQuickViewProduct(p)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    <Eye className="h-3 w-3 text-emerald-400" /> Quick View
                  </button>
                  {vendorsMap[p.vendorId] && (
                    <button
                      onClick={() => setSelectedVendor(vendorsMap[p.vendorId])}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      <Store className="h-3 w-3" /> Seller Profile
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* VERIFIED SELLERS & LIVE CALL SHOWCASE */}
      {vendorsList.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" /> Verified Storefronts & Live Concierge
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Inspect seller ratings, open 1-on-1 translated chat, or launch a live @nexconn/call session
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {vendorsList.map((vendor) => (
              <div
                key={vendor.vendorId}
                className="rounded-2xl border border-zinc-800 bg-[#141418] p-5 flex flex-col justify-between gap-4 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={vendor.logo}
                    alt={vendor.businessName}
                    className="h-12 w-12 rounded-xl object-cover ring-1 ring-zinc-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-white truncate">{vendor.businessName}</h3>
                      {vendor.verificationStatus === 'approved' && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                      <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                        <Star className="h-3 w-3 fill-amber-400" /> {vendor.rating}
                      </span>
                      <span>({vendor.reviewCount} reviews)</span>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300 capitalize">
                        {vendor.availability}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2">{vendor.description}</p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedVendor(vendor)}
                    className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-800"
                  >
                    Seller Profile
                  </button>
                  <button
                    onClick={() => void startConversationWithVendor(vendor.vendorId)}
                    className="rounded-xl bg-[#00a884] px-3 py-1.5 text-[11px] font-bold text-[#111b21] hover:bg-[#029676] inline-flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" /> 1-on-1 Chat
                  </button>
                  <button
                    onClick={() => startCall(vendor.businessName, vendor.logo, false)}
                    className="rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 text-emerald-400 hover:bg-zinc-800"
                    title="Voice Call Seller"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => startCall(vendor.businessName, vendor.logo, true)}
                    className="rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 text-sky-400 hover:bg-zinc-800"
                    title="Video Call Seller"
                  >
                    <Video className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. PRODUCT SUPPORT HUB BANNER */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="rounded-3xl bg-[#141418] border border-zinc-800 text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Product-Based Support &amp; Real-Time Seller Chat
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">
              Direct 1-on-1 Seller Messaging for Every Product.
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Need sizing help, specs clarification, order updates, or warranty assistance? Pick any seller-uploaded product to message its exact seller in real time or open a tracked support ticket.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/shop/support"
                className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-2.5 text-xs font-bold hover:bg-zinc-200 transition-colors"
              >
                Open Product Support Hub <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/shop/products"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 text-white px-5 py-2.5 text-xs font-bold hover:bg-zinc-800 transition-colors"
              >
                Browse Seller Catalog
              </Link>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 max-w-xs w-full space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <MessageSquare className="h-4 w-4" /> Real-Time Marketplace Sync
            </div>
            <p className="text-zinc-400 leading-relaxed">
              {products.length} seller-uploaded product{products.length === 1 ? '' : 's'} currently connected to live multi-language buyer ↔ seller chat.
            </p>
          </div>
        </div>
      </section>

      {/* 5. TRENDING SECTION */}
      {showcaseTrending.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Trending Seller Listings</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Live products published by verified sellers</p>
            </div>
            <Link
              to="/shop/products"
              className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white"
            >
              <span>View all</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {showcaseTrending.map((p) => (
              <ProductCard key={p.productId} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* PRODUCT QUICK-VIEW MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-[#141418] p-6 text-zinc-100 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {quickViewProduct.brand} · {quickViewProduct.categoryName || 'Featured'}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{quickViewProduct.title}</h3>
              </div>
              <button
                onClick={() => setQuickViewProduct(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="aspect-square overflow-hidden rounded-2xl border border-zinc-800 bg-black flex items-center justify-center">
                <img
                  src={quickViewProduct.images[0]}
                  alt={quickViewProduct.title}
                  className="h-full w-full object-contain p-4"
                />
              </div>
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl font-black text-white">
                      {formatPrice(
                        quickViewProduct.price * (1 - (quickViewProduct.discount || 0) / 100)
                      )}
                    </span>
                    {quickViewProduct.discount > 0 && (
                      <span className="text-xs text-zinc-500 line-through">
                        {formatPrice(quickViewProduct.price)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {quickViewProduct.description}
                  </p>
                  <div className="space-y-1 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-[11px]">
                    {Object.entries(quickViewProduct.specifications || {})
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2">
                          <span className="text-zinc-500">{k}</span>
                          <span className="text-zinc-200 font-medium text-right">{String(v)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={async () => {
                        await addItem(quickViewProduct.productId, 1);
                        setQuickViewProduct(null);
                      }}
                      className="rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-black hover:bg-zinc-200 flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                    </button>
                    <button
                      onClick={() => {
                        const prod = quickViewProduct;
                        setQuickViewProduct(null);
                        void startConversationWithVendor(prod.vendorId, prod.productId);
                      }}
                      className="rounded-xl bg-[#00a884] px-4 py-2.5 text-xs font-bold text-[#111b21] hover:bg-[#029676] flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Ask Seller
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      const id = quickViewProduct.productId;
                      setQuickViewProduct(null);
                      navigate(`/shop/products/${id}`);
                    }}
                    className="w-full rounded-xl border border-zinc-700 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                  >
                    Open Full Product Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERIFIED SELLER PROFILE MODAL */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#141418] p-6 text-zinc-100 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedVendor.logo}
                  alt={selectedVendor.businessName}
                  className="h-14 w-14 rounded-2xl object-cover ring-2 ring-emerald-500/40"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-bold text-white">{selectedVendor.businessName}</h3>
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-zinc-400">
                    ★ {selectedVendor.rating} ({selectedVendor.reviewCount} verified reviews) ·{' '}
                    <span className="text-emerald-400 capitalize">{selectedVendor.availability}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">{selectedVendor.description}</p>

            <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs">
              <div>
                <span className="font-bold text-white">Shipping Policy:</span>{' '}
                <span className="text-zinc-400">{selectedVendor.businessPolicies?.shipping}</span>
              </div>
              <div>
                <span className="font-bold text-white">Returns:</span>{' '}
                <span className="text-zinc-400">{selectedVendor.businessPolicies?.returns}</span>
              </div>
              <div>
                <span className="font-bold text-white">Warranty:</span>{' '}
                <span className="text-zinc-400">{selectedVendor.businessPolicies?.warranty}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  const v = selectedVendor;
                  setSelectedVendor(null);
                  void startConversationWithVendor(v.vendorId);
                }}
                className="rounded-xl bg-[#00a884] px-3 py-2.5 text-xs font-bold text-[#111b21] hover:bg-[#029676] flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5" /> 1-on-1 Chat
              </button>
              <button
                onClick={() => {
                  const v = selectedVendor;
                  setSelectedVendor(null);
                  startCall(v.businessName, v.logo, false);
                }}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-xs font-bold text-emerald-300 hover:bg-zinc-800 flex items-center justify-center gap-1.5"
              >
                <Phone className="h-3.5 w-3.5" /> Voice Call
              </button>
              <button
                onClick={() => {
                  const v = selectedVendor;
                  setSelectedVendor(null);
                  startCall(v.businessName, v.logo, true);
                }}
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-xs font-bold text-sky-300 hover:bg-zinc-800 flex items-center justify-center gap-1.5"
              >
                <Video className="h-3.5 w-3.5" /> Video Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
