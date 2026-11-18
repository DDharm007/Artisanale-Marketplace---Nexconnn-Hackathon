import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/useCartStore';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import { useChatStore } from '../stores/useChatStore';
import ModelViewer from '../components/ui/ModelViewer';
import {
  ARTISANAL_CATALOG_BY_ID,
  ARTISANAL_VENDORS,
} from '../data/artisanalCatalog';
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Tag,
  Check,
  MapPin,
  MessageSquare,
  Minus,
  Plus,
} from 'lucide-react';
import {
  DEFAULT_TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  Vendor,
} from '@convocart/shared';
import { apiRequest } from '../lib/api';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, fetchCart, updateQty, removeItem, clearCart, subtotal, itemCount } =
    useCartStore();
  const { formatPrice, location } = usePreferencesStore();
  const { startConversationWithVendor } = useChatStore();

  const [vendorNames, setVendorNames] = useState<Record<string, string>>({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    void fetchCart();
    apiRequest<Vendor[]>('/vendors')
      .then((list) => {
        const map: Record<string, string> = {};
        for (const v of list) map[v.vendorId] = v.businessName;
        setVendorNames(map);
      })
      .catch(() => {});
  }, []);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#ECEAE4] flex flex-col items-center justify-center px-4 py-20 text-center text-[#171717]">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-white text-[#8C867A] mb-5 border border-[#E4DEC8] shadow-xs">
          <ShoppingBag className="h-9 w-9" />
        </div>
        <h2
          className="text-3xl sm:text-4xl font-normal text-[#171717] mb-2"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
        >
          Your Collector Bag is Empty
        </h2>
        <p className="text-xs sm:text-sm text-[#686359] max-w-md mx-auto mb-6">
          Explore 50 handcrafted ceramic sculptures, botanical soy candles, hand-loomed textiles, and fine studio creations.
        </p>
        <Link
          to="/shop/products"
          className="inline-flex items-center gap-2 rounded-full bg-[#171717] px-7 py-3 text-xs font-semibold text-[#D6B875] hover:bg-black transition-colors"
        >
          Explore 50 Creations <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const discountRate = appliedCoupon === 'CONVO10' ? 0.1 : 0;
  const couponDiscount = Number((subtotal * discountRate).toFixed(2));
  const discountedSubtotal = subtotal - couponDiscount;
  const tax = Number((discountedSubtotal * DEFAULT_TAX_RATE).toFixed(2));
  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const total = Number((discountedSubtotal + tax + shipping).toFixed(2));

  const itemsByVendor: Record<string, typeof cart.items> = {};
  for (const item of cart.items) {
    if (!itemsByVendor[item.vendorId]) {
      itemsByVendor[item.vendorId] = [];
    }
    itemsByVendor[item.vendorId].push(item);
  }

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'CONVO10') {
      setAppliedCoupon('CONVO10');
      setCouponError(null);
    } else {
      setCouponError('Invalid code. Try "CONVO10" for 10% collector discount.');
    }
  };

  return (
    <div className="min-h-screen bg-[#ECEAE4] text-[#171717] py-8 px-4 sm:px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        {/* Delivery Address Banner */}
        <div className="mb-6 flex flex-wrap items-center justify-between rounded-2xl border border-[#E4DEC8] bg-[#FAF8F3] p-4 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 text-[#D6B875]" />
            <div className="text-xs">
              <span className="text-[#686359]">Delivering to: </span>
              <strong className="text-[#171717] font-semibold">
                {location.city}, {location.postalCode}
              </strong>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700">
            Plastic-Free Express Studio Shipping Available
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Cart Items (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-[#E4DEC8] bg-white p-5 shadow-2xs flex items-center justify-between">
              <div>
                <h1
                  className="text-2xl sm:text-3xl font-normal text-[#171717]"
                  style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                >
                  Collector Bag ({itemCount} {itemCount === 1 ? 'creation' : 'creations'})
                </h1>
                <p className="text-xs text-[#686359] mt-0.5">
                  Hand-packed across {Object.keys(itemsByVendor).length} independent artisan studio
                  {Object.keys(itemsByVendor).length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => void clearCart()}
                className="text-xs font-semibold text-rose-700 hover:underline cursor-pointer"
              >
                Clear bag
              </button>
            </div>

            {Object.entries(itemsByVendor).map(([vendorId, vendorItems]) => {
              const studioInfo = ARTISANAL_VENDORS[vendorId];
              const displayVendor =
                studioInfo?.studioName || vendorNames[vendorId] || 'Artisan Studio';
              return (
                <div
                  key={vendorId}
                  className="rounded-2xl border border-[#E4DEC8] bg-white shadow-2xs overflow-hidden"
                >
                  {/* Vendor Header */}
                  <div className="bg-[#FAF8F3] px-5 py-3 border-b border-[#E4DEC8] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-[#171717]">
                      <ShieldCheck className="h-4 w-4 text-[#D6B875]" />
                      <span>
                        Studio: {displayVendor}
                        {studioInfo ? ` · ${studioInfo.artisanName} (${studioInfo.location})` : ''}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        void startConversationWithVendor(vendorId, vendorItems[0]?.productId)
                      }
                      className="flex items-center gap-1.5 font-semibold text-[#171717] hover:text-[#D6B875] transition-colors cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-[#D6B875]" /> Chat with Artisan
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-[#F0EBE0]">
                    {vendorItems.map((item) => {
                      const catMeta = ARTISANAL_CATALOG_BY_ID[item.productId];
                      const modelUrl =
                        catMeta?.modelUrl ||
                        (item.image?.endsWith('.glb') ? item.image : undefined);
                      return (
                        <div
                          key={item.productId}
                          className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5"
                        >
                          {/* 3D Model or Image Preview */}
                          <div className="h-24 w-24 rounded-xl bg-white border border-[#E4DEC8] overflow-hidden shrink-0 relative pointer-events-none">
                            {modelUrl ? (
                              <ModelViewer
                                url={modelUrl}
                                textureUrl={catMeta?.textureUrl}
                                textureRepeat={catMeta?.textureRepeat}
                                bumpScale={catMeta?.bumpScale}
                                width="100%"
                                height="100%"
                                environment="studio"
                                environmentIntensity={0.45}
                                exposure={0.85}
                                autoRotate
                                autoRotateSpeed={0.3}
                                dragRotate={false}
                                zoom={false}
                                shadow
                                shadowOpacity={0.35}
                                intro="none"
                                startAngle={catMeta?.startAngle ?? -18}
                                tilt={catMeta?.tilt ?? 15}
                                fit={catMeta?.fit ?? 0.84}
                                className="w-full h-full"
                              />
                            ) : (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-contain p-2"
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-[#171717]">
                              {item.title}
                            </h3>
                            <p className="text-xs text-[#686359] mt-0.5">
                              {catMeta?.materials || 'Handcrafted studio edition · Signed provenance'}
                            </p>
                            <div className="mt-2 flex items-baseline gap-2">
                              <span className="text-base font-bold text-[#171717]">
                                {formatPrice(item.price)}
                              </span>
                              <span className="text-[11px] text-emerald-700 font-medium">
                                In Studio Stock
                              </span>
                            </div>
                          </div>

                          {/* Quantity + Remove */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                            <div className="flex items-center rounded-full border border-[#E4DEC8] bg-[#FAF8F3] px-1.5 py-1">
                              <button
                                onClick={() =>
                                  void updateQty(item.productId, item.quantity - 1)
                                }
                                className="h-6 w-6 rounded-full flex items-center justify-center text-[#171717] hover:bg-white cursor-pointer"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-7 text-center text-xs font-bold text-[#171717]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  void updateQty(item.productId, item.quantity + 1)
                                }
                                className="h-6 w-6 rounded-full flex items-center justify-center text-[#171717] hover:bg-white cursor-pointer"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-[#171717]">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                              <button
                                onClick={() => void removeItem(item.productId)}
                                className="text-[#8C867A] hover:text-rose-700 transition-colors cursor-pointer"
                                title="Remove creation"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Order Summary & Checkout (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-[#E4DEC8] bg-white p-6 shadow-2xs space-y-5 sticky top-20">
              <h2
                className="text-2xl font-normal text-[#171717] border-b border-[#E4DEC8] pb-3"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
              >
                Acquisition Summary
              </h2>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#8C867A] flex items-center gap-1">
                  <Tag className="h-3 w-3 text-[#D6B875]" /> Collector Privilege Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Try CONVO10"
                    className="flex-1 rounded-full border border-[#E4DEC8] bg-[#FAF8F3] px-3.5 py-2 text-xs text-[#171717] uppercase focus:border-[#171717] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[#171717] px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Code {appliedCoupon} applied (10% off)
                  </p>
                )}
                {couponError && (
                  <p className="text-xs text-rose-700">{couponError}</p>
                )}
              </form>

              <div className="space-y-2.5 text-xs border-t border-[#E4DEC8] pt-4">
                <div className="flex justify-between text-[#686359]">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-semibold text-[#171717]">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Collector Discount (10%)</span>
                    <span className="font-semibold">
                      -{formatPrice(couponDiscount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#686359]">
                  <span>Estimated Tax</span>
                  <span className="font-semibold text-[#171717]">
                    {formatPrice(tax)}
                  </span>
                </div>
                <div className="flex justify-between text-[#686359]">
                  <span>Insured Studio Courier</span>
                  <span className="font-semibold text-emerald-700">
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="border-t border-[#E4DEC8] pt-3 flex justify-between items-baseline text-base font-bold text-[#171717]">
                  <span>Total</span>
                  <span className="text-xl">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/shop/checkout')}
                className="w-full rounded-full bg-[#171717] py-3.5 text-xs font-bold text-[#D6B875] hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="space-y-2 pt-2 text-[11px] text-[#686359]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#D6B875] shrink-0" />
                  <span>100% Authentic Handcrafted Guarantee & Escrow Protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-[#D6B875] shrink-0" />
                  <span>Direct from Artisan Studio · Zero Plastic Packaging</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
