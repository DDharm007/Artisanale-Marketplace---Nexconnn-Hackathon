import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Product, DEFAULT_CATEGORIES } from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { ProductCard } from '../features/products/ProductCard';
import { Skeleton } from '../components/ui/Skeleton';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import { SlidersHorizontal, Star, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('categoryId') || '';
  const initialSearch = searchParams.get('search') || '';

  const { formatPrice } = usePreferencesStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  // Synchronize when URL searchParams change
  useEffect(() => {
    setSelectedCategory(searchParams.get('categoryId') || '');
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const fetchProducts = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory) params.set('categoryId', selectedCategory);
    if (searchQuery) params.set('search', searchQuery);
    if (selectedBrand) params.set('brand', selectedBrand);
    if (maxPrice < 1000) params.set('maxPrice', maxPrice.toString());
    if (sortBy) params.set('sort', sortBy);
    params.set('page', page.toString());
    params.set('limit', '12');

    try {
      const data = await apiRequest<{ products: Product[]; total: number }>(`/products?${params.toString()}`);
      let prods = data.products || [];
      if (minRating > 0) {
        prods = prods.filter((p) => p.rating >= minRating);
      }
      setProducts(prods);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, selectedBrand, maxPrice, minRating, sortBy, page]);

  const availableBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSelectedBrand('');
    setMaxPrice(1000);
    setMinRating(0);
    setSortBy('newest');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20">
      {/* BREADCRUMB STRIP */}
      <div className="bg-[#0c0c0e] border-b border-zinc-800/80 px-4 py-2.5 text-xs text-zinc-400">
        <div className="mx-auto max-w-7xl flex items-center gap-1.5">
          <Link to="/shop" className="hover:text-white">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-zinc-200">Catalog</span>
          {selectedCategory && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white font-bold capitalize">
                {DEFAULT_CATEGORIES.find((c) => c.id === selectedCategory)?.name || selectedCategory}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products & Imports'}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Over {total} items available with instant verified seller chat
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-400">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-[#121215] px-3 py-1.5 text-xs font-bold text-zinc-200 shadow-2xs focus:border-zinc-700 focus:outline-none"
            >
              <option value="newest">Featured & Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
            </select>
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
                    Brands
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

          {/* RIGHT: PRODUCTS GRID */}
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
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-[#121215] p-12 text-center">
                <h3 className="text-base font-bold text-white">No products found</h3>
                <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4">
                  Try adjusting your search criteria, widening price limits, or clearing applied filters.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black hover:bg-zinc-200"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {products.map((p) => (
                  <ProductCard key={p.productId} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
