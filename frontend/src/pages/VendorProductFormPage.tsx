import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { uploadChatFile } from '../lib/firebase';
import { DEFAULT_CATEGORIES, Product } from '@convocart/shared';
import ModelViewer from '../components/ui/ModelViewer';
import {
  ArrowLeft,
  Save,
  Trash2,
  Upload,
  Loader2,
  Box,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const ARTISANAL_3D_PRESETS = [
  { label: 'Ceramic Tea Set (Kyusu Teapot & Cups)', url: '/assets/3d/ceramic_tea_set.glb' },
  { label: 'Monumental Amphora Granite Vessel', url: '/assets/3d/vase_granite.glb' },
  { label: 'Striped Teardrop Bud Vase', url: '/assets/3d/teardrop.glb' },
  { label: 'Botanical Incense Vessel with Wax Dishes', url: '/assets/3d/vessel_v3.glb' },
  { label: 'Soy Wax Fluted Pillar Candles', url: '/assets/3d/soy_wax_candles.glb' },
  { label: 'Glazed Apothecary Scented Jar Candle', url: '/assets/3d/scented_jar_candle.glb' },
  { label: 'Speckled Wheel-Thrown Coffee Mug', url: '/assets/3d/handmade_coffee_mug.glb' },
  { label: 'Terracotta Planter Herb Pot', url: '/assets/3d/terracotta_pot.glb' },
  { label: 'Decorative Stoneware Bowl', url: '/assets/3d/ceramic_bowl.glb' },
  { label: 'Ceramic Serving Pitcher', url: '/assets/3d/ceramic_pitcher.glb' },
  { label: 'Hand-Hammered Brass Choker Necklace', url: '/assets/3d/brass_necklace.glb' },
  { label: 'Raw Gemstone Solitaire Ring', url: '/assets/3d/gemstone_ring.glb' },
  { label: 'Organic Handwoven Wool Rug', url: '/assets/3d/handwoven_rug.glb' },
  { label: 'Natural Macramé Wall Hanging', url: '/assets/3d/macrame_hanging.glb' },
  { label: 'Embroidered Botanical Cushion Cover', url: '/assets/3d/embroidered_cushion.glb' },
  { label: 'Full Grain Leather Bound Journal', url: '/assets/3d/leather_journal.glb' },
  { label: 'Carved Walnut Serving Tray', url: '/assets/3d/wooden_tray.glb' },
  { label: 'Handcrafted Wooden Keepsake Frame', url: '/assets/3d/wooden_frame.glb' },
  { label: 'Handcrafted Artisan Gift Box', url: '/assets/3d/gift_box.glb' },
  { label: 'Handmade Natural Soap Bar', url: '/assets/3d/natural_soap.glb' },
];

export const VendorProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const isEditing = Boolean(productId);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const modelFileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('ceramics-pottery');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [price, setPrice] = useState<number>(64);
  const [discount, setDiscount] = useState<number>(0);
  const [stock, setStock] = useState<number>(20);
  const [imageUrl, setImageUrl] = useState('');
  const [modelUrl, setModelUrl] = useState('/assets/3d/ceramic_tea_set.glb');
  const [blendFileName, setBlendFileName] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploading3D, setIsUploading3D] = useState(false);
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [specifications, setSpecifications] = useState<Record<string, string>>({
    Craftsmanship: '100% Handcrafted in Studio',
    Material: 'Wheel-thrown stoneware clay with wood ash glaze',
  });
  const [shippingPolicy, setShippingPolicy] = useState(
    'Handcrafted and shipped within 2-3 business days via tracked express courier in reinforced packaging.'
  );
  const [returnPolicy, setReturnPolicy] = useState(
    '30-day money-back guarantee with zero restocking fee for undamaged artisanal goods.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productId) {
      apiRequest<Product>(`/products/${productId}`).then((p) => {
        setTitle(p.title);
        setDescription(p.description);
        setCategoryId(p.categoryId || 'ceramics-pottery');
        setBrand(p.brand);
        setSku(p.sku);
        setPrice(p.price);
        setDiscount(p.discount);
        setStock(p.stock);
        setIsFeatured(p.isFeatured ?? true);

        // Find 3D model if attached in images or specifications
        const found3d =
          p.images?.find((img) => img.endsWith('.glb') || img.endsWith('.gltf')) ||
          p.specifications?.Interactive3D;
        if (found3d) {
          setModelUrl(found3d);
        }
        if (p.specifications?.BlendSource) {
          setBlendFileName(p.specifications.BlendSource);
        }

        const standardImg = p.images?.find((img) => !img.endsWith('.glb') && !img.endsWith('.gltf'));
        if (standardImg) setImageUrl(standardImg);

        if (p.specifications) setSpecifications(p.specifications);
        if (p.shippingPolicy) setShippingPolicy(p.shippingPolicy);
        if (p.returnPolicy) setReturnPolicy(p.returnPolicy);
      });
    }
  }, [productId]);

  // Handle 2D image upload
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const { url } = await uploadChatFile(file, 'vendor_products');
      setImageUrl(url);
    } catch (err: any) {
      alert(err?.message || 'Image upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle 3D model upload (.glb, .gltf, or .blend)
  const handle3DModelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isBlend = fileName.endsWith('.blend');
    const isGlbOrGltf = fileName.endsWith('.glb') || fileName.endsWith('.gltf');

    if (!isBlend && !isGlbOrGltf) {
      alert('Please upload a 3D model file (.glb, .gltf, or .blend).');
      return;
    }

    if (isBlend) {
      setBlendFileName(file.name);
      setIsUploading3D(true);
      try {
        await uploadChatFile(file, 'product_3d_blend_sources').catch(() => {});
      } finally {
        setIsUploading3D(false);
      }
      return;
    }

    if (isGlbOrGltf) {
      // Create instant local blob URL for real-time 3D viewport rendering
      const localBlobUrl = URL.createObjectURL(file);
      setModelUrl(localBlobUrl);
      setIsUploading3D(true);
      try {
        const { url } = await uploadChatFile(file, 'product_3d_models');
        if (url) {
          setModelUrl(url);
        }
      } catch (err: any) {
        console.warn('Firebase upload error, maintaining local blob 3D URL:', err);
      } finally {
        setIsUploading3D(false);
      }
    }
  };

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

    const mergedSpecs: Record<string, string> = {
      ...specifications,
      Interactive3D: modelUrl,
    };
    if (blendFileName) {
      mergedSpecs.BlendSource = blendFileName;
    }

    const imageList: string[] = [];
    if (modelUrl) imageList.push(modelUrl);
    if (imageUrl.trim()) imageList.push(imageUrl.trim());

    const payload = {
      title,
      description,
      categoryId,
      brand,
      sku,
      price: Number(price),
      discount: Number(discount),
      stock: Number(stock),
      images: imageList,
      specifications: mergedSpecs,
      shippingPolicy,
      returnPolicy,
      isFeatured,
      status: 'active',
    };

    try {
      if (isEditing) {
        await apiRequest(`/products/${productId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        const createdProduct = await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        window.dispatchEvent(new CustomEvent('convocart:product_created', { detail: createdProduct }));
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
      <div className="flex items-center gap-3 pb-4 border-b border-[#E4DEC8]">
        <button
          onClick={() => navigate('/vendor/products')}
          className="rounded-lg p-1.5 text-[#8C867A] hover:bg-[#ECEAE4] hover:text-[#171717] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1
            className="text-3xl font-normal text-[#171717]"
            style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
          >
            {isEditing ? 'Edit Product Catalog Entry' : 'Create New Marketplace Product'}
          </h1>
          <p className="text-xs text-[#686359]">
            Publish handcrafted creations with interactive 3D WebGL inspection and verified artisan details.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* 1. Core Product Info */}
        <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C867A]">
            1. Basic Information
          </h3>

          <div>
            <label className="font-bold text-[#171717] block mb-1">Product Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Handmade Ceramic Tea Set or Scented Jar Candle"
              className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] p-2.5 text-xs font-medium focus:border-[#D6B875] focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-[#171717] block mb-1">Product Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation of studio techniques, clay composition, glaze finishes, and story..."
              className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] p-2.5 text-xs font-medium focus:border-[#D6B875] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-[#171717] block mb-1">Artisanal Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] p-2.5 text-xs font-medium focus:border-[#D6B875] focus:outline-none"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-[#171717] block mb-1">Studio / Brand Name</label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Kyoto Kiln Works or Oaxaca Earth Studio"
                className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] p-2.5 text-xs font-medium focus:border-[#D6B875] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#171717] block mb-1">Stock Keeping Unit (SKU)</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] p-2.5 text-xs font-mono font-medium focus:border-[#D6B875] focus:outline-none"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-[#E4DEC8] text-[#171717] focus:ring-[#D6B875]"
            />
            <span className="font-semibold text-[#171717]">
              Showcase in Storefront Featured Releases
            </span>
          </label>
        </div>

        {/* 2. Interactive 3D Model Asset (.glb / .blend) */}
        <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C867A] flex items-center gap-1.5">
                <Box className="h-4 w-4 text-[#D6B875]" />
                2. 3D Model Asset (.glb / .gltf / .blend)
              </h3>
              <p className="text-[11px] text-[#686359] mt-0.5">
                Upload your custom 3D model (.glb, .gltf, or .blend) or choose from our artisanal 3D library for instant WebGL turntable inspection.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={modelFileInputRef}
                type="file"
                accept=".glb,.gltf,.blend,model/gltf-binary"
                onChange={(e) => void handle3DModelFileUpload(e)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => modelFileInputRef.current?.click()}
                disabled={isUploading3D}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#171717] bg-[#171717] px-4 py-2 text-xs font-bold text-[#D6B875] hover:bg-black transition-colors disabled:opacity-60"
              >
                {isUploading3D ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {isUploading3D ? 'Processing 3D File...' : 'Upload 3D File (.glb / .blend)'}
              </button>
            </div>
          </div>

          {/* Quick Preset Selector & URL input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[#171717] block mb-1">
                Pick from Verified 3D Model Library
              </label>
              <select
                value={modelUrl}
                onChange={(e) => setModelUrl(e.target.value)}
                className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] p-2.5 text-xs font-medium focus:border-[#D6B875] focus:outline-none"
              >
                {ARTISANAL_3D_PRESETS.map((preset) => (
                  <option key={preset.url} value={preset.url}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-[#171717] block mb-1">
                3D Model Path or Web URL (.glb)
              </label>
              <input
                type="text"
                required
                value={modelUrl}
                onChange={(e) => setModelUrl(e.target.value)}
                placeholder="/assets/3d/... or https://..."
                className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] p-2.5 text-xs font-mono font-medium focus:border-[#D6B875] focus:outline-none"
              />
            </div>
          </div>

          {/* Attached .blend badge if present */}
          {blendFileName && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#D6B875]/50 px-3 py-1.5 text-xs text-[#171717]">
              <Layers className="h-4 w-4 text-[#D6B875]" />
              <span>
                Blender Source Asset: <strong>{blendFileName}</strong>
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Attached
              </span>
            </div>
          )}

          {/* Live Interactive 3D Model Viewport */}
          <div className="w-full h-80 bg-white rounded-2xl overflow-hidden border border-[#E4DEC8] relative shadow-inner">
            <ModelViewer
              url={modelUrl || '/assets/3d/ceramic_tea_set.glb'}
              width="100%"
              height="100%"
              environment="studio"
              environmentIntensity={0.5}
              exposure={0.88}
              autoRotate
              autoRotateSpeed={0.4}
              dragRotate
              turntable
              float={0.06}
              zoom
              shadow
              shadowOpacity={0.35}
              intro="fade"
              fit={0.92}
              className="w-full h-full"
            />

            <div className="absolute top-3 left-3 bg-[#171717]/85 text-[#D6B875] backdrop-blur-xs text-[10px] font-bold px-3 py-1 rounded-full border border-[#D6B875]/30 flex items-center gap-1.5">
              <Box className="h-3 w-3" /> Interactive 3D WebGL Viewport
            </div>

            <div className="absolute bottom-3 right-3 bg-[#FAF8F3]/90 text-[#686359] backdrop-blur-xs text-[10px] px-3 py-1 rounded-full border border-[#E4DEC8]">
              Drag to rotate · Scroll to zoom
            </div>
          </div>
        </div>

        {/* 3. Pricing & Inventory */}
        <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C867A]">
            3. Pricing & Studio Inventory
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-[#171717] block mb-1">Base Price ($)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] p-2.5 text-xs font-medium focus:border-[#D6B875] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#171717] block mb-1">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="90"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] p-2.5 text-xs font-medium focus:border-[#D6B875] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#171717] block mb-1">Stock Units</label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] p-2.5 text-xs font-medium focus:border-[#D6B875] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 4. Optional 2D Photo Gallery */}
        <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C867A]">
              4. Still Photo Gallery (Optional Secondary View)
            </h3>
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => void handleImageFileUpload(e)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => imageFileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E4DEC8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#171717] hover:bg-[#ECEAE4] disabled:opacity-60 transition-colors"
            >
              {isUploadingImage ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {isUploadingImage ? 'Uploading...' : 'Upload 2D Still Photo'}
            </button>
          </div>
          <div>
            <label className="font-bold text-[#171717] block mb-1">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... or click Upload 2D Still Photo above"
              className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] p-2.5 text-xs font-medium focus:border-[#D6B875] focus:outline-none"
            />
          </div>
          {imageUrl && (
            <div className="h-24 w-24 rounded-2xl overflow-hidden border border-[#E4DEC8] bg-white">
              <img src={imageUrl} alt="preview" className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        {/* 5. Specifications Builder */}
        <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C867A]">
            5. Handcrafted Specifications & Material Attributes
          </h3>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Attribute (e.g. Dimensions, Firing Temp, Origin)"
              value={specKey}
              onChange={(e) => setSpecKey(e.target.value)}
              className="flex-1 rounded-xl border border-[#E4DEC8] p-2 bg-white text-[#171717] placeholder:text-[#8C867A]"
            />
            <input
              type="text"
              placeholder="Value (e.g. 1280°C Reduction Firing, Kyoto)"
              value={specVal}
              onChange={(e) => setSpecVal(e.target.value)}
              className="flex-1 rounded-xl border border-[#E4DEC8] p-2 bg-white text-[#171717] placeholder:text-[#8C867A]"
            />
            <button
              type="button"
              onClick={handleAddSpec}
              className="rounded-full bg-[#171717] px-4 py-2 font-bold text-[#D6B875] hover:bg-black transition-colors"
            >
              Add Spec
            </button>
          </div>

          <div className="space-y-2 pt-2">
            {Object.entries(specifications).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-[#E4DEC8]"
              >
                <div>
                  <span className="font-bold text-[#171717]">{k}:</span>{' '}
                  <span className="text-[#555047]">{v}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(k)}
                  className="text-[#8C867A] hover:text-rose-600"
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
            className="rounded-full border border-[#E4DEC8] bg-white px-5 py-2.5 font-bold text-[#555047] hover:bg-[#ECEAE4] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-[#171717] px-6 py-2.5 font-bold text-[#D6B875] hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Save className="h-4 w-4" /> {isSubmitting ? 'Publishing...' : 'Save Creation'}
          </button>
        </div>
      </form>
    </div>
  );
};
