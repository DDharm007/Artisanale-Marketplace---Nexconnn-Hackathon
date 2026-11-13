import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { ProductCard } from '../features/products/ProductCard';
import { useChatStore } from '../stores/useChatStore';
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
} from 'lucide-react';
import { cn } from '../lib/utils';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { startConversationWithVendor } = useChatStore();
  const { formatPrice, location } = usePreferencesStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  const heroSlides = [
    {
      id: 1,
      tag: 'Flagship Release • Nexconn Audio',
      title: 'SonicPro Studio Wireless',
      description: 'Engineered for audiophiles and producers. Hybrid 45dB Active Noise Cancellation with custom 40mm titanium diaphragm drivers and 65-hour battery.',
      specs: ['40mm Titanium Drivers', '45dB Hybrid ANC', '65h Battery', 'Bluetooth 5.4'],
      price: 254.15,
      mrp: 299.0,
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200&auto=format&fit=crop&q=80',
      productId: 'prod_nexconn_pro_anc',
      vendorId: 'vendor_nexconn_audio',
      sellerName: 'Nexconn Audio & Smart Tech',
      rating: 4.9,
      reviewCount: 148,
    },
    {
      id: 2,
      tag: 'Direct Tokyo Import • Ubuy Global',
      title: 'Akiba Keebs Master 75%',
      description: 'CNC carved aerospace aluminum chassis with gasket mount structure, pre-lubed Gateron Oil Kings, and south-facing RGB per-key illumination.',
      specs: ['CNC Aluminum Chassis', 'Gateron Oil Kings', 'Hot-Swappable 75%', 'Tri-Mode Wireless'],
      price: 224.1,
      mrp: 249.0,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&auto=format&fit=crop&q=80',
      productId: 'prod_tokyo_mech_keyboard',
      vendorId: 'vendor_ubuy_express',
      sellerName: 'Ubuy Express',
      rating: 4.8,
      reviewCount: 76,
    },
  ];

  useEffect(() => {
    apiRequest<{ products: Product[] }>('/products?limit=12')
      .then((data) => {
        setProducts(data.products || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const featured = products.filter((p) => p.isFeatured);
  const trending = products.filter((p) => p.isTrending);

  const currentSlide = heroSlides[activeSlide];

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

              {/* Price Block */}
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {formatPrice(currentSlide.price)}
                </span>
                <span className="text-base text-zinc-500 line-through font-medium">
                  {formatPrice(currentSlide.mrp)}
                </span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  Save {Math.round(((currentSlide.mrp - currentSlide.price) / currentSlide.mrp) * 100)}%
                </span>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to={`/shop/products/${currentSlide.productId}`}
                  className="rounded-full bg-white px-7 py-3 text-xs font-extrabold text-black hover:bg-zinc-200 transition-all shadow-lg shadow-white/5 active:scale-95 flex items-center gap-2"
                >
                  View Details <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <button
                  onClick={() => startConversationWithVendor(currentSlide.vendorId, currentSlide.productId)}
                  className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-5 py-3 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
                >
                  <MessageSquare className="h-4 w-4 text-zinc-400" />
                  Message Seller
                </button>
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
                        activeSlide === i ? 'w-8 bg-white' : 'w-2 bg-zinc-700 hover:bg-zinc-600'
                      )}
                      title={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
                <span>
                  0{activeSlide + 1} / 0{heroSlides.length}
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
              <div className="relative aspect-[4/3] sm:aspect-square w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-800 bg-[#141418] shadow-2xl group">
                <img
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d]/90 via-[#0a0a0d]/20 to-transparent pointer-events-none" />

                {/* Floating Top Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-xs font-semibold text-white">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{currentSlide.rating}</span>
                  <span className="text-zinc-400">({currentSlide.reviewCount} reviews)</span>
                </div>

                {/* Floating Bottom Card */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-xs">
                  <div>
                    <span className="text-white font-bold block">{currentSlide.title}</span>
                    <span className="text-zinc-400 text-[11px]">Free express delivery to {location.city}</span>
                  </div>
                  <Link
                    to={`/shop/products/${currentSlide.productId}`}
                    className="rounded-full bg-white text-black px-3.5 py-1.5 text-xs font-bold hover:bg-zinc-200 transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MINIMALIST DARK TRUST STRIP */}
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

      {/* 3. FEATURED PRODUCTS (Dark Grid) */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Featured Releases</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Carefully curated electronics and accessories</p>
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
          {featured.map((p) => (
            <ProductCard key={p.productId} product={p} />
          ))}
        </div>
      </section>

      {/* 4. CLEAN UBUY GLOBAL PROMO BANNER (Dark Editorial) */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="rounded-3xl bg-[#141418] border border-zinc-800 text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Ubuy Global Store
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">
              Direct Imports from Tokyo, Milan, and Zurich.
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Explore limited artisan mechanical keyboards and studio gear. Every shipment is delivered with door-to-door express air tracking and zero unexpected duties.
            </p>
            <div className="pt-2">
              <Link
                to="/shop/products?categoryId=cat-global"
                className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-2.5 text-xs font-bold hover:bg-zinc-200 transition-colors"
              >
                Explore Imports <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="shrink-0 w-64 h-48 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
            <img
              src="https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&auto=format&fit=crop&q=80"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 5. TRENDING SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Trending Now</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Popular gear viewed by our community</p>
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
          {trending.map((p) => (
            <ProductCard key={p.productId} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
};
