import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Plus, Search, Edit3, Trash2, Eye, EyeOff, Package } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useReviewStore } from '../stores/useReviewStore';
import { StarRatingDisplay } from '../components/ui/StarRating';

export const VendorProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getProductRatingStats } = useReviewStore();
  const vendorId = user?.vendorId || 'me';
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<Product[]>(`/vendors/${vendorId}/products`);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [vendorId]);

  const handleToggleStatus = async (productId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'draft' : 'active';
    try {
      await apiRequest(`/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to archive this product? Historical orders will be preserved.')) return;
    try {
      await apiRequest(`/products/${productId}`, {
        method: 'DELETE',
      });
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4DEC8]">
        <div>
          <h1
            className="text-3xl font-normal text-[#171717]"
            style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
          >
            Store Catalog Management
          </h1>
          <p className="text-xs text-[#686359] mt-1">
            Manage inventory, publish new variations, and update pricing models.
          </p>
        </div>

        <Link
          to="/vendor/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-[#171717] px-5 py-2.5 text-xs font-bold text-[#D6B875] shadow-xs hover:bg-black transition-colors"
        >
          <Plus className="h-4 w-4" /> Add New Product
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8C867A]" />
          <input
            type="text"
            placeholder="Search products by title or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] pl-9 pr-3 py-2 text-xs text-[#171717] focus:border-[#D6B875] focus:outline-none"
          />
        </div>

        <div className="flex rounded-xl bg-[#ECEAE4] border border-[#E4DEC8] p-1 text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1 transition-colors ${statusFilter === 'all' ? 'bg-[#171717] text-[#D6B875] shadow-xs' : 'text-[#686359] hover:text-[#171717]'}`}
          >
            All Products
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`rounded-lg px-3 py-1 transition-colors ${statusFilter === 'active' ? 'bg-[#171717] text-[#D6B875] shadow-xs' : 'text-[#686359] hover:text-[#171717]'}`}
          >
            Active Only
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`rounded-lg px-3 py-1 transition-colors ${statusFilter === 'archived' ? 'bg-[#171717] text-[#D6B875] shadow-xs' : 'text-[#686359] hover:text-[#171717]'}`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Product List Table */}
      <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#ECEAE4] border-b border-[#E4DEC8] text-[#8C867A] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Star Rating</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Inventory</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DEC8]">
              {filtered.map((prod) => {
                const stats = getProductRatingStats(prod.productId);
                return (
                <tr key={prod.productId} className="hover:bg-[#ECEAE4]/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white border border-[#E4DEC8] shrink-0 flex items-center justify-center text-[10px] font-bold text-[#D6B875]">
                        3D
                      </div>
                      <div className="truncate max-w-xs">
                        <h4 className="font-bold text-[#171717] truncate">{prod.title}</h4>
                        <span className="text-[11px] text-[#8C867A]">{prod.categoryName || prod.categoryId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StarRatingDisplay
                      rating={stats.rating}
                      count={stats.count}
                      size="xs"
                    />
                  </td>
                  <td className="py-3 px-4 font-mono text-[#555047]">{prod.sku}</td>
                  <td className="py-3 px-4 font-extrabold text-[#171717]">
                    {formatCurrency(prod.price)}
                    {prod.discount > 0 && (
                      <span className="ml-1 text-[10px] text-rose-600">(-{prod.discount}%)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${prod.stock > 10 ? 'text-emerald-700' : 'text-amber-700'}`}
                    >
                      {prod.stock} in stock
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                        prod.status === 'active'
                          ? 'bg-[#171717] text-[#D6B875]'
                          : 'bg-[#ECEAE4] text-[#686359]'
                      }`}
                    >
                      {prod.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(prod.productId, prod.status)}
                        className="rounded-lg p-1.5 text-[#8C867A] hover:bg-[#ECEAE4] hover:text-[#171717]"
                        title="Toggle Active Status"
                      >
                        {prod.status === 'active' ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => navigate(`/vendor/products/${prod.productId}/edit`)}
                        className="rounded-lg p-1.5 text-[#8C867A] hover:bg-[#ECEAE4] hover:text-[#171717]"
                        title="Edit Product"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.productId)}
                        className="rounded-lg p-1.5 text-[#8C867A] hover:bg-rose-50 hover:text-rose-600"
                        title="Archive Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
