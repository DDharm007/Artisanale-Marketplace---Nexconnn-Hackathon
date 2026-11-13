import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { DEFAULT_CATEGORIES, Product } from '@convocart/shared';
import { ArrowLeft, Save, Plus, Trash2, Image } from 'lucide-react';

export const VendorProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const isEditing = Boolean(productId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('cat-electronics');
  const [brand, setBrand] = useState('Nexconn Audio');
  const [sku, setSku] = useState(`NEX-${Math.floor(1000 + Math.random() * 9000)}`);
  const [price, setPrice] = useState<number>(199);
  const [discount, setDiscount] = useState<number>(10);
  const [stock, setStock] = useState<number>(30);
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
  );
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [specifications, setSpecifications] = useState<Record<string, string>>({
    Connectivity: 'Bluetooth 5.4 / USB-C',
    Battery: '50 Hours Active Playback',
  });
  const [shippingPolicy, setShippingPolicy] = useState('Ships within 24 hours via express courier.');
  const [returnPolicy, setReturnPolicy] = useState('30-day money-back guarantee with zero restocking fee.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productId) {
      apiRequest<Product>(`/products/${productId}`).then((p) => {
        setTitle(p.title);
        setDescription(p.description);
        setCategoryId(p.categoryId);
        setBrand(p.brand);
        setSku(p.sku);
        setPrice(p.price);
        setDiscount(p.discount);
        setStock(p.stock);
        if (p.images?.[0]) setImageUrl(p.images[0]);
        if (p.specifications) setSpecifications(p.specifications);
        if (p.shippingPolicy) setShippingPolicy(p.shippingPolicy);
        if (p.returnPolicy) setReturnPolicy(p.returnPolicy);
      });
    }
  }, [productId]);

  const handleAddSpec = () => {
    if (specKey.trim() && specVal.trim()) {
      setSpecifications({ ...specifications, [specKey.trim()]: specVal.trim() });
      setSpecKey('');
      setSpecVal('');
    }
  };

  const handleRemoveSpec = (key: string) => {
    const updated = { ...specifications };
    delete updated[key];
    setSpecifications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      title,
      description,
      categoryId,
      brand,
      sku,
      price: Number(price),
      discount: Number(discount),
      stock: Number(stock),
      images: [imageUrl],
      specifications,
      shippingPolicy,
      returnPolicy,
      status: 'active',
    };

    try {
      if (isEditing) {
        await apiRequest(`/products/${productId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      navigate('/vendor/products');
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <button
          onClick={() => navigate('/vendor/products')}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900">
            {isEditing ? 'Edit Product Catalog Entry' : 'Create New Marketplace Product'}
          </h1>
          <p className="text-xs text-slate-500">
            Fill in accurate descriptions, real image URLs, and technical specifications.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Core Product Info */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Basic Information
          </h3>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Product Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Nexconn SonicPro Studio Wireless Headphones"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Product Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation of features, materials, and benefits..."
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium bg-white focus:border-brand-500 focus:outline-none"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Brand Name</label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Stock Keeping Unit (SKU)</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Pricing & Inventory
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Base Price ($)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="90"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Stock Units</label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Primary Imagery URL
          </h3>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Image URL</label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
            />
          </div>
          {imageUrl && (
            <div className="h-28 w-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={imageUrl} alt="preview" className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        {/* Specifications Table Builder */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Technical Specifications
          </h3>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Spec Name (e.g. Battery Life)"
              value={specKey}
              onChange={(e) => setSpecKey(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 p-2 bg-white"
            />
            <input
              type="text"
              placeholder="Value (e.g. 50 Hours)"
              value={specVal}
              onChange={(e) => setSpecVal(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 p-2 bg-white"
            />
            <button
              type="button"
              onClick={handleAddSpec}
              className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800"
            >
              Add Spec
            </button>
          </div>

          <div className="space-y-2 pt-2">
            {Object.entries(specifications).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200"
              >
                <div>
                  <span className="font-bold text-slate-800">{k}:</span>{' '}
                  <span className="text-slate-600">{v}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(k)}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/vendor/products')}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-brand-600 px-6 py-2.5 font-bold text-white shadow-md hover:bg-brand-700 transition-colors flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" /> {isSubmitting ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};
