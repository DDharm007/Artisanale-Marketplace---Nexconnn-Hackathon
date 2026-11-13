import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { Plus, Search, Edit3, Trash2, Eye, EyeOff, Package } from 'lucide-react';

export const VendorProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<Product[]>('/vendors/vendor_nexconn_audio/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Store Catalog Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage inventory, publish new variations, and update pricing models.
          </p>
        </div>

        <Link
          to="/vendor/products/new"
          className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add New Product
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by title or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex rounded-xl bg-slate-200/60 p-1 text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-3 py-1 transition-colors ${statusFilter === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
          >
            All Products
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`rounded-lg px-3 py-1 transition-colors ${statusFilter === 'active' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
          >
            Active Only
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`rounded-lg px-3 py-1 transition-colors ${statusFilter === 'archived' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Product List Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Inventory</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((prod) => (
                <tr key={prod.productId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.images[0]}
                        alt=""
                        className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="truncate max-w-xs">
                        <h4 className="font-bold text-slate-900 truncate">{prod.title}</h4>
                        <span className="text-[11px] text-slate-400">{prod.categoryName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{prod.sku}</td>
                  <td className="py-3 px-4 font-extrabold text-slate-900">
                    {formatCurrency(prod.price)}
                    {prod.discount > 0 && (
                      <span className="ml-1 text-[10px] text-rose-600">(-{prod.discount}%)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${prod.stock > 10 ? 'text-emerald-600' : 'text-amber-600'}`}
                    >
                      {prod.stock} in stock
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                        prod.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {prod.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(prod.productId, prod.status)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                        title="Edit Product"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.productId)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Archive Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
