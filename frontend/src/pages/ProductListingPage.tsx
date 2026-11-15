import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Product, Vendor, DEFAULT_CATEGORIES } from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { ProductCard } from '../features/products/ProductCard';
import { Skeleton } from '../components/ui/Skeleton';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import { useWishlistStore } from '../stores/useWishlistStore';
import { useCartStore } from '../stores/useCartStore';
import { useChatStore } from '../stores/useChatStore';
import {
  SlidersHorizontal,
  Star,
  ChevronRight,
  LayoutGrid,
  List,
  Heart,
  Sparkles,
  Tag,
  Eye,
  Store,
  MessageSquare,
  Phone,
  Video,
  ShoppingBag,
  ShieldCheck,
  MapPin,
  X,
  User,
} from 'lucide-react';
import { cn } from '../lib/utils';

export const ProductListingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('categoryId') || '';
  const initialSearch = searchParams.get('search') || '';

  const { formatPrice } = usePreferencesStore();
  const { items: wishlistItems, isInWishlist, toggleWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { startConversationWithVendor, startCall } = useChatStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [vendorsMap, setVendorsMap] = useState<Record<string, Vendor>>({});
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & view controls
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);

  // Quick-view & Seller modals
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Synchronize when URL searchParams change
  useEffect(() => {
    setSelectedCategory(searchParams.get('categoryId') || '');
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const fetchProductsAndVendors = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set('categoryId', selectedCategory);
    if (searchQuery) params.set('search', searchQuery);
    if (selectedBrand) params.set('brand', selectedBrand);
    if (maxPrice < 1000) params.set('maxPrice', maxPrice.toString());
    if (sortBy) params.set('sort', sortBy);
    params.set('page', '1');
    params.set('limit', '40');

    try {
      const [data, vendorList] = await Promise.all([
        apiRequest<{ products: Product[]; total: number }>(`/products?${params.toString()}`),
        apiRequest<Vendor[]>('/vendors').catch(() => [] as Vendor[]),
      ]);
      setProducts(data.products || []);
      setTotal(data.total || 0);
      const map: Record<string, Vendor> = {};
      for (const v of vendorList || []) map[v.vendorId] = v;
      setVendorsMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProductsAndVendors();
  }, [selectedCategory, searchQuery, selectedBrand, maxPrice, sortBy]);

  const filteredProducts = useMemo(() => {
    let list = products.slice();
    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);
    if (wishlistOnly) list = list.filter((p) => isInWishlist(p.productId));
    if (featuredOnly) list = list.filter((p) => p.isFeatured);
    if (onSaleOnly) list = list.filter((p) => (p.discount || 0) > 0);
    return list;
  }, [products, minRating, wishlistOnly, featuredOnly, onSaleOnly, wishlistItems]);

  const availableBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSelectedBrand('');
    setMaxPrice(1000);
    setMinRating(0);
    setWishlistOnly(false);
    setFeaturedOnly(false);
    setOnSaleOnly(false);
    setSortBy('newest');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20">
      {/* BREADCRUMB STRIP */}
      <div className="bg-[#0c0c0e] border-b border-zinc-800/80 px-4 py-2.5 text-xs text-zinc-400">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Link to="/shop" className="hover:text-white">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-zinc-200">Marketplace Catalog</span>
            {selectedCategory && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white font-bold capitalize">
                  {DEFAULT_CATEGORIES.find((c) => c.id === selectedCategory)?.name || selectedCategory}
                </span>
              </>
            )}
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Nexconn 1-on-1 Seller Chat & Call Enabled
          </span>
        </div>
      </div>

      {/* HORIZONTAL DEPARTMENT PILLS */}
      <div className="border-b border-zinc-800/60 bg-[#0d0d11] px-4 py-3">
        <div className="mx-auto max-w-7xl flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setSelectedCategory('');
              setSearchParams({});
            }}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
              selectedCategory === ''
                ? 'bg-white text-black'
                : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
            )}
          >
            All Categories
          </button>
          {DEFAULT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSearchParams({ categoryId: cat.id });
              }}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
                selectedCategory === cat.id
                  ? 'bg-white text-black'
                  : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Verified Multi-Vendor Marketplace'}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Showing {filteredProducts.length} of {total} curated items with instant translated seller chat & calls
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Highlight Toggles */}
            <button
              onClick={() => setFeaturedOnly((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors',
                featuredOnly
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-zinc-800 bg-[#121215] text-zinc-400 hover:text-white'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" /> Featured
            </button>
            <button
              onClick={() => setOnSaleOnly((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors',
                onSaleOnly
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                  : 'border-zinc-800 bg-[#121215] text-zinc-400 hover:text-white'
              )}
            >
              <Tag className="h-3.5 w-3.5" /> On Sale
            </button>
            <button
              onClick={() => setWishlistOnly((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors',
                wishlistOnly
                  ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                  : 'border-zinc-800 bg-[#121215] text-zinc-400 hover:text-white'
              )}
            >
              <Heart className="h-3.5 w-3.5" /> Wishlist ({wishlistItems.length})
            </button>

            {/* View Mode Toggle (Grid / List) */}
            <div className="flex items-center rounded-xl border border-zinc-800 bg-[#121215] p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-lg p-1.5 transition-colors',
                  viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                )}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded-lg p-1.5 transition-colors',
                  viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                )}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-zinc-400">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-zinc-800 bg-[#121215] px-3 py-1.5 text-xs font-bold text-zinc-200 focus:border-zinc-700 focus:outline-none"
              >
                <option value="newest">Featured & Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT: FILTERS SIDEBAR */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-[#121215] p-5 rounded-2xl border border-zinc-800/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white">
                  <SlidersHorizontal className="h-4 w-4 text-zinc-400" /> Filters
                </h3>
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Clear All
                </button>
              </div>

              {/* Department Categories */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-zinc-300 mb-2 block">
                  Department
                </label>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setSearchParams({});
                    }}
                    className={cn(
                      'w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                      selectedCategory === ''
                        ? 'bg-zinc-800 text-white font-bold'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    )}
                  >
                    All Departments
                  </button>
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSearchParams({ categoryId: cat.id });
                      }}
                      className={cn(
                        'w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                        selectedCategory === cat.id
                          ? 'bg-zinc-800 text-white font-bold'
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between text-xs font-black text-zinc-300 mb-2">
                  <span className="uppercase tracking-wider">Max Price</span>
                  <span className="text-white">{formatPrice(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-white cursor-pointer"
                />
              </div>

              {/* Ratings */}
              <div className="border-t border-zinc-800 pt-4">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-300 mb-2 block">
                  Customer Ratings
                </label>
                <div className="space-y-1.5">
                  {[4, 3, 2].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(minRating === r ? 0 : r)}
                      className={cn(
                        'flex items-center gap-1.5 w-full text-left rounded-lg px-2 py-1 text-xs transition-colors',
                        minRating === r ? 'bg-zinc-800 font-bold text-white' : 'text-zinc-400 hover:bg-zinc-800/50'
                      )}
                    >
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn('h-3.5 w-3.5', i < r ? 'fill-amber-400' : 'text-zinc-700')}
                          />
                        ))}
                      </div>
                      <span className="text-zinc-300 font-semibold">& Up</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              {availableBrands.length > 0 && (
                <div className="border-t border-zinc-800 pt-4">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-300 mb-2 block">
                    Brands & Studios
                  </label>
                  <div className="space-y-1">
                    {availableBrands.map((brand) => (
                      <label key={brand} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBrand === brand}
                          onChange={() => setSelectedBrand(selectedBrand === brand ? '' : brand)}
                          className="accent-white rounded"
                        />
                        <span>{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: PRODUCTS GRID OR LIST */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-zinc-800 bg-[#121215] p-4 space-y-3">
                    <Skeleton className="aspect-square w-full rounded-xl bg-zinc-800" />
                    <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                    <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                    <Skeleton className="h-9 w-full rounded-xl bg-zinc-800" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-[#121215] p-12 text-center">
                <h3 className="text-base font-bold text-white">
                  {products.length === 0 ? 'No Seller Products Uploaded Yet' : 'No products match your filters'}
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4">
                  {products.length === 0
                    ? 'Only verified seller-uploaded products are listed here. Sign in as a Seller to publish your first product.'
                    : 'Try adjusting your search criteria, widening price limits, or clearing applied filters.'}
                </p>
                {products.length === 0 ? (
                  <Link
                    to="/auth"
                    className="rounded-full bg-[#00a884] px-5 py-2 text-xs font-bold text-[#111b21] hover:bg-[#029676]"
                  >
                    Seller Sign In / Upload Product
                  </Link>
                ) : (
                  <button
                    onClick={handleClearFilters}
                    className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black hover:bg-zinc-200"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {filteredProducts.map((p) => (
                  <div key={p.productId} className="flex flex-col">
                    <ProductCard product={p} />
                    <div className="mt-1.5 flex items-center justify-between px-1">
                      <button
                        onClick={() => setQuickViewProduct(p)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white"
                      >
                        <Eye className="h-3 w-3 text-emerald-400" /> Quick View
                      </button>
                      {vendorsMap[p.vendorId] && (
                        <button
                          onClick={() => setSelectedVendor(vendorsMap[p.vendorId])}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300"
                        >
                          <Store className="h-3 w-3" /> {vendorsMap[p.vendorId].businessName.split(' ')[0]}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="space-y-4">
                {filteredProducts.map((p) => {
                  const discounted = p.price * (1 - (p.discount || 0) / 100);
                  const seller = vendorsMap[p.vendorId];
                  const faved = isInWishlist(p.productId);
                  return (
                    <div
                      key={p.productId}
                      className="rounded-2xl border border-zinc-800 bg-[#121215] p-4 flex flex-col sm:flex-row gap-4 hover:border-zinc-700 transition-colors"
                    >
                      <Link
                        to={`/shop/products/${p.productId}`}
                        className="sm:w-44 aspect-square rounded-xl bg-black border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center"
                      >
                        <img src={p.images[0]} alt={p.title} className="h-full w-full object-contain p-3" />
                      </Link>
                      <div className="flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                              {p.brand} · {p.categoryName}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                              <Star className="h-3.5 w-3.5 fill-amber-400" /> {p.rating}
                              <span className="text-zinc-500 font-normal">({p.reviewCount})</span>
                            </div>
                          </div>
                          <Link
                            to={`/shop/products/${p.productId}`}
                            className="text-base font-bold text-white hover:underline mt-1 block"
                          >
                            {p.title}
                          </Link>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{p.description}</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-black text-white">{formatPrice(discounted)}</span>
                            {p.discount > 0 && (
                              <span className="text-xs text-zinc-500 line-through">{formatPrice(p.price)}</span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => toggleWishlist(p)}
                              className={cn(
                                'rounded-xl border p-2 transition-colors',
                                faved
                                  ? 'border-rose-500/40 bg-rose-500/15 text-rose-400'
                                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                              )}
                              title="Toggle Wishlist"
                            >
                              <Heart className={cn('h-3.5 w-3.5', faved && 'fill-rose-400')} />
                            </button>
                            <button
                              onClick={() => setQuickViewProduct(p)}
                              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 inline-flex items-center gap-1"
                            >
                              <Eye className="h-3.5 w-3.5 text-emerald-400" /> Quick View
                            </button>
                            {seller && (
                              <button
                                onClick={() => setSelectedVendor(seller)}
                                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-zinc-800 inline-flex items-center gap-1"
                              >
                                <Store className="h-3.5 w-3.5" /> Seller
                              </button>
                            )}
                            <button
                              onClick={() => void startConversationWithVendor(p.vendorId, p.productId)}
                              className="rounded-xl bg-[#00a884] px-3 py-1.5 text-xs font-bold text-[#111b21] hover:bg-[#029676] inline-flex items-center gap-1"
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> Chat
                            </button>
                            <button
                              onClick={() => void addItem(p.productId, 1)}
                              className="rounded-xl bg-white px-3.5 py-1.5 text-xs font-extrabold text-black hover:bg-zinc-200 inline-flex items-center gap-1"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" /> Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK-VIEW MODAL */}
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
