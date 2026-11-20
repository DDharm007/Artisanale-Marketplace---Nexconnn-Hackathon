import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import { useCartStore } from '../stores/useCartStore';
import { useChatStore } from '../stores/useChatStore';
import ModelViewer from '../components/ui/ModelViewer';
import { ArtisanalProductModal } from '../components/ui/ArtisanalProductModal';
import { StarRatingDisplay } from '../components/ui/StarRating';
import { useReviewStore } from '../stores/useReviewStore';
import { apiRequest } from '../lib/api';
import { Product, Vendor } from '@convocart/shared';
import {
  ARTISANAL_50_CATALOG,
  ARTISANAL_CATEGORIES,
  ArtisanalCatalogItem,
  mapProductToCatalogItem,
} from '../data/artisanalCatalog';
import {
  SlidersHorizontal,
  LayoutGrid,
  List,
  Search,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/utils';

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('categoryId') || '';
  const initialSearch = searchParams.get('search') || '';

  const { formatPrice } = usePreferencesStore();
  const { addItem } = useCartStore();
  const { startConversationWithVendor } = useChatStore();
  const { reviews, getProductRatingStats } = useReviewStore();

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedStudio, setSelectedStudio] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<ArtisanalCatalogItem | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Dynamic marketplace items: start with initial catalogue, then hydrate with live backend products
  const [catalogItems, setCatalogItems] = useState<ArtisanalCatalogItem[]>(() => {
    const list = ARTISANAL_50_CATALOG.slice();
    list.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return list;
  });

  const fetchMarketplaceProducts = useCallback(async () => {
    try {
      const [prodRes, vendorsRes] = await Promise.all([
        apiRequest<{ products: Product[] }>('/products?limit=250&sort=newest').catch(() => null),
        apiRequest<Vendor[]>('/vendors').catch(() => null),
      ]);

      if (prodRes && Array.isArray(prodRes.products) && prodRes.products.length > 0) {
        const vendorsMap: Record<string, Vendor> = {};
        if (vendorsRes && Array.isArray(vendorsRes)) {
          vendorsRes.forEach((v) => {
            vendorsMap[v.vendorId] = v;
          });
        }

        const mappedBackendItems = prodRes.products.map((p) =>
          mapProductToCatalogItem(p, vendorsMap)
        );

        const backendIds = new Set(mappedBackendItems.map((item) => item.id));
        const remainingCatalog = ARTISANAL_50_CATALOG.filter((item) => !backendIds.has(item.id));

        const combined = [...mappedBackendItems, ...remainingCatalog];
        // Strictly sort by creation date so any new vendor items are on top
        combined.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        setCatalogItems(combined);
      }
    } catch (err) {
      console.warn('Could not sync marketplace products:', err);
    }
  }, []);

  useEffect(() => {
    void fetchMarketplaceProducts();

    const handleRefresh = () => {
      void fetchMarketplaceProducts();
    };

    window.addEventListener('convocart:product_created', handleRefresh);
    window.addEventListener('focus', handleRefresh);

    const interval = window.setInterval(() => {
      void fetchMarketplaceProducts();
    }, 6000);

    return () => {
      window.removeEventListener('convocart:product_created', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      window.clearInterval(interval);
    };
  }, [fetchMarketplaceProducts]);

  useEffect(() => {
    setSelectedCategory(searchParams.get('categoryId') || '');
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const availableStudios = useMemo(
    () => Array.from(new Set(catalogItems.map((p) => p.studio).filter(Boolean))),
    [catalogItems]
  );

  const filteredItems = useMemo(() => {
    let list = catalogItems.slice();
    if (selectedCategory) {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.studio.toLowerCase().includes(q) ||
          p.artisanName.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q)
      );
    }
    if (selectedStudio) {
      list = list.filter((p) => p.studio === selectedStudio);
    }
    if (maxPrice < 200) {
      list = list.filter((p) => p.price <= maxPrice);
    }
    if (minRating > 0) {
      list = list.filter((p) => getProductRatingStats(p.id).rating >= minRating);
    }
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort(
        (a, b) =>
          getProductRatingStats(b.id).rating - getProductRatingStats(a.id).rating
      );
    } else {
      // 'featured', 'newest', or default: ALWAYS show newly added items on top!
      list.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }
    return list;
  }, [catalogItems, selectedCategory, searchQuery, selectedStudio, maxPrice, minRating, sortBy, reviews]);

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSelectedStudio('');
    setMaxPrice(200);
    setMinRating(0);
    setSortBy('featured');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#ECEAE4] text-[#171717]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* ── TOP BAR ──────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E4DEC8]">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-normal text-[#171717]"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
            >
              {searchQuery ? `Results for "${searchQuery}"` : 'Curated Marketplace'}
            </h1>
            <p className="text-xs text-[#686359] mt-1">
              Showing {filteredItems.length} of {catalogItems.length} handcrafted creations · Click any piece to inspect details, chat with the artisan, or purchase
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center gap-1.5 rounded-full border border-[#E4DEC8] bg-white px-3.5 py-1.5 text-xs font-medium text-[#171717] hover:bg-[#FAF8F3] transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#D6B875]" />
              <span>
                Filters
                {(selectedCategory ? 1 : 0) +
                  (selectedStudio ? 1 : 0) +
                  (maxPrice < 200 ? 1 : 0) +
                  (minRating > 0 ? 1 : 0) >
                0
                  ? ` (${
                      (selectedCategory ? 1 : 0) +
                      (selectedStudio ? 1 : 0) +
                      (maxPrice < 200 ? 1 : 0) +
                      (minRating > 0 ? 1 : 0)
                    })`
                  : ''}
              </span>
            </button>

            {/* Search input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[#8C867A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creations or studios..."
                className="rounded-full border border-[#E4DEC8] bg-white pl-8 pr-3.5 py-1.5 text-xs text-[#171717] placeholder:text-[#8C867A] focus:border-[#171717] focus:outline-none w-44 xs:w-52 sm:w-60"
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center rounded-full border border-[#E4DEC8] bg-white p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-full p-1.5 transition-colors cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-[#171717] text-white'
                    : 'text-[#8C867A] hover:text-[#171717]'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded-full p-1.5 transition-colors cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-[#171717] text-white'
                    : 'text-[#8C867A] hover:text-[#171717]'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-full border border-[#E4DEC8] bg-white px-3.5 py-1.5 text-xs font-medium text-[#171717] focus:border-[#171717] focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured (Newest First)</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ── FILTERS SIDEBAR ──────────────────────────────────────── */}
          <div className={cn('lg:col-span-1 space-y-5', showMobileFilters ? 'block' : 'hidden lg:block')}>
            <div className="rounded-2xl border border-[#E4DEC8] bg-white p-5 shadow-xs space-y-5 sticky top-20">
              <div className="flex items-center justify-between border-b border-[#E4DEC8] pb-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#171717]">
                  <SlidersHorizontal className="h-4 w-4 text-[#D6B875]" /> Filters
                </h3>
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-[#8C867A] hover:text-[#171717] transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              {/* Categories */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#8C867A] mb-2 block">
                  Craft Department
                </label>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setSearchParams({});
                    }}
                    className={cn(
                      'w-full text-left rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                      selectedCategory === ''
                        ? 'bg-[#F5F1E8] text-[#171717] font-semibold'
                        : 'text-[#686359] hover:bg-[#FAF8F3]'
                    )}
                  >
                    All {catalogItems.length} Creations
                  </button>
                  {ARTISANAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSearchParams({ categoryId: cat.id });
                      }}
                      className={cn(
                        'w-full text-left rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                        selectedCategory === cat.id
                          ? 'bg-[#F5F1E8] text-[#171717] font-semibold'
                          : 'text-[#686359] hover:bg-[#FAF8F3]'
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="border-t border-[#E4DEC8] pt-4">
                <div className="flex items-center justify-between text-xs font-bold text-[#8C867A] mb-2">
                  <span className="uppercase tracking-wider">Max Price</span>
                  <span className="font-semibold text-[#171717]">{formatPrice(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="5"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[#D6B875]"
                />
              </div>

              {/* Ratings */}
              <div className="border-t border-[#E4DEC8] pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8C867A] mb-2 block">
                  Star Rating
                </label>
                <div className="space-y-1">
                  {[5.0, 4.5, 4.0, 3.5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(minRating === r ? 0 : r)}
                      className={cn(
                        'flex items-center justify-between w-full text-left rounded-xl px-2.5 py-1.5 text-xs transition-colors cursor-pointer',
                        minRating === r
                          ? 'bg-[#F5F1E8] text-[#171717] font-semibold'
                          : 'text-[#686359] hover:bg-[#FAF8F3]'
                      )}
                    >
                      <StarRatingDisplay rating={r} showNumeric={false} size="xs" />
                      <span>{r === 5.0 ? '5.0 ★ Only' : `${r.toFixed(1)} ★ & Up`}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Studios */}
              <div className="border-t border-[#E4DEC8] pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8C867A] mb-2 block">
                  Artisan Studio
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {availableStudios.map((studio) => (
                    <label
                      key={studio}
                      className="flex items-center gap-2 text-xs text-[#686359] cursor-pointer hover:text-[#171717]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudio === studio}
                        onChange={() =>
                          setSelectedStudio(selectedStudio === studio ? '' : studio)
                        }
                        className="rounded border-[#E4DEC8] accent-[#171717]"
                      />
                      <span>{studio}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── MINIMAL CLICKABLE 3D PRODUCTS GRID OR LIST ────────────── */}
          <div className="lg:col-span-3">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E4DEC8] bg-white p-12 text-center">
                <h3
                  className="text-xl font-normal text-[#171717]"
                  style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                >
                  No creations match your criteria
                </h3>
                <p className="text-xs text-[#686359] max-w-sm mt-1 mb-4">
                  Try adjusting your search criteria, price range, or clearing active filters.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="rounded-full bg-[#171717] px-6 py-2.5 text-xs font-semibold text-white hover:bg-black transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="flex flex-col w-full cursor-pointer group"
                  >
                    {/* 3D Model Box / Media Preview */}
                    <div className="w-full h-[248px] xl:h-[264px] bg-white overflow-hidden relative transition-shadow duration-300 group-hover:shadow-md">
                      {Boolean(
                        item.isNew ||
                          (item.createdAt &&
                            Date.now() - new Date(item.createdAt).getTime() < 3 * 86400000)
                      ) && (
                        <span className="absolute top-2.5 left-2.5 z-20 rounded-full bg-[#171717] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D6B875] shadow-xs">
                          New
                        </span>
                      )}
                      <div className="w-full h-full pointer-events-none">
                        {item.modelUrl &&
                        (item.modelUrl.endsWith('.glb') ||
                          item.modelUrl.endsWith('.gltf') ||
                          item.modelUrl.includes('/assets/3d/')) ? (
                          <ModelViewer
                            url={item.modelUrl}
                            textureUrl={item.textureUrl}
                            textureRepeat={item.textureRepeat}
                            bumpScale={item.bumpScale}
                            width="100%"
                            height="100%"
                            environment="studio"
                            environmentIntensity={0.45}
                            exposure={0.85}
                            autoRotate
                            autoRotateSpeed={0.28}
                            dragRotate={false}
                            turntable={false}
                            hoverTilt={0}
                            float={0.16}
                            zoom={false}
                            shadow
                            shadowOpacity={0.38}
                            intro="fade"
                            startAngle={item.startAngle}
                            tilt={item.tilt}
                            fit={item.fit}
                            offsetY={item.offsetY ?? 0}
                            className="w-full h-full"
                          />
                        ) : (
                          <img
                            src={item.textureUrl || item.modelUrl || '/assets/3d/sculpture_v3.glb'}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                    </div>

                    {/* Minimal Title + Price Row */}
                    <div className="mt-2.5 flex items-center justify-between text-[13px]">
                      <span className="font-normal text-[#2B2B2B] group-hover:text-black transition-colors truncate pr-2">
                        {item.title}
                      </span>
                      <span className="font-semibold text-[#171717] shrink-0">
                        {item.priceFormatted}
                      </span>
                    </div>

                    {/* Star Rating + Studio Name + Quick Chat Trigger */}
                    <div className="mt-1 flex items-center justify-between text-[11px] text-[#7A7872]">
                      <div className="flex items-center gap-2 min-w-0">
                        <StarRatingDisplay
                          rating={getProductRatingStats(item.id).rating}
                          size="xs"
                        />
                        <span className="truncate">· {item.studio}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void startConversationWithVendor(
                            item.vendorId,
                            item.id,
                            undefined,
                            item.title,
                            item.textureUrl || item.vendorAvatar
                          );
                        }}
                        className="inline-flex items-center gap-1 text-[#171717] hover:text-[#D6B875] font-medium transition-colors shrink-0 cursor-pointer ml-1"
                        title={`Chat with ${item.artisanName}`}
                      >
                        <MessageSquare className="h-3 w-3" /> Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-5 cursor-pointer group hover:shadow-md transition-shadow rounded-2xl border border-[#E4DEC8]"
                  >
                    <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 min-w-0 flex-1">
                      <div className="w-28 h-28 xs:w-32 xs:h-32 bg-white overflow-hidden shrink-0 relative pointer-events-none rounded-xl">
                        {Boolean(
                          item.isNew ||
                            (item.createdAt &&
                              Date.now() - new Date(item.createdAt).getTime() < 3 * 86400000)
                        ) && (
                          <span className="absolute top-1.5 left-1.5 z-20 rounded-full bg-[#171717] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#D6B875]">
                            New
                          </span>
                        )}
                        {item.modelUrl &&
                        (item.modelUrl.endsWith('.glb') ||
                          item.modelUrl.endsWith('.gltf') ||
                          item.modelUrl.includes('/assets/3d/')) ? (
                          <ModelViewer
                            url={item.modelUrl}
                            textureUrl={item.textureUrl}
                            textureRepeat={item.textureRepeat}
                            bumpScale={item.bumpScale}
                            width="100%"
                            height="100%"
                            environment="studio"
                            environmentIntensity={0.45}
                            exposure={0.85}
                            autoRotate
                            autoRotateSpeed={0.28}
                            dragRotate={false}
                            zoom={false}
                            shadow
                            shadowOpacity={0.35}
                            intro="fade"
                            startAngle={item.startAngle}
                            tilt={item.tilt}
                            fit={item.fit}
                            offsetY={item.offsetY ?? 0}
                            className="w-full h-full"
                          />
                        ) : (
                          <img
                            src={item.textureUrl || item.modelUrl || '/assets/3d/sculpture_v3.glb'}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C867A]">
                            {item.studio} · {item.artisanName}
                          </span>
                          <StarRatingDisplay
                            rating={getProductRatingStats(item.id).rating}
                            count={getProductRatingStats(item.id).count}
                            size="xs"
                          />
                        </div>
                        <h3 className="text-base font-medium text-[#171717] group-hover:text-[#D6B875] transition-colors mt-0.5">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#686359] mt-1 line-clamp-2 max-w-xl">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                      <span className="text-base font-semibold text-[#171717]">
                        {item.priceFormatted}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void startConversationWithVendor(
                              item.vendorId,
                              item.id,
                              undefined,
                              item.title,
                              item.textureUrl || item.vendorAvatar
                            );
                          }}
                          className="rounded-full border border-[#E4DEC8] px-3 py-1 text-xs font-medium text-[#171717] hover:border-[#171717] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="h-3 w-3 text-[#D6B875]" /> Chat
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void addItem(item.id, 1);
                          }}
                          className="rounded-full bg-[#171717] px-3.5 py-1 text-xs font-semibold text-white hover:bg-black cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PRODUCT DETAIL POP-UP MODAL ──────────────────────────────── */}
      <ArtisanalProductModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
};
