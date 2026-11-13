import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/useCartStore';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import { useChatStore } from '../stores/useChatStore';
import {
  Trash2,
  ArrowRight,
  ShoppingCart,
  ShieldCheck,
  Truck,
  Tag,
  Check,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import {
  DEFAULT_TAX_RATE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from '@convocart/shared';
import { cn } from '../lib/utils';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, fetchCart, updateQty, removeItem, clearCart, subtotal, itemCount } = useCartStore();
  const { formatPrice, location } = usePreferencesStore();
  const { startConversationWithVendor } = useChatStore();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-zinc-100">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-[#141418] text-zinc-400 mb-4 border border-zinc-800">
          <ShoppingCart className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Your Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-6">
          Explore curated audio gear, artisan mechanical keyboards, and global imports.
        </p>
        <Link
          to="/shop/products"
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold text-black hover:bg-zinc-200 transition-colors"
        >
          Explore Catalog <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  // Authoritative calculations
  const discountRate = appliedCoupon === 'CONVO10' ? 0.10 : 0;
  const couponDiscount = Number((subtotal * discountRate).toFixed(2));
  const discountedSubtotal = subtotal - couponDiscount;
  const tax = Number((discountedSubtotal * DEFAULT_TAX_RATE).toFixed(2));
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const total = Number((discountedSubtotal + tax + shipping).toFixed(2));

  // Group items by vendorId
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
      setCouponError('Invalid coupon code. Try "CONVO10" for 10% off.');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 py-8 px-4 sm:px-6 pb-20">
      <div className="mx-auto max-w-7xl">
        {/* Delivery Address Banner */}
        <div className="mb-6 flex flex-wrap items-center justify-between rounded-2xl border border-zinc-800 bg-[#121215] p-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 text-zinc-400" />
            <div className="text-xs">
              <span className="text-zinc-400">Deliver to: </span>
              <strong className="text-white font-bold">{location.city}, {location.postalCode}</strong>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-400">Free Express Delivery Available</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Cart Items (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-4 shadow-xs flex items-center justify-between">
              <div>
                <h1 className="text-base font-black text-white">
                  Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                </h1>
                <p className="text-[11px] text-zinc-400">
                  Fulfilled across {Object.keys(itemsByVendor).length} verified merchant{Object.keys(itemsByVendor).length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => clearCart()}
                className="text-xs font-bold text-rose-400 hover:underline"
              >
                Clear all
              </button>
            </div>

            {Object.entries(itemsByVendor).map(([vendorId, vendorItems]) => (
              <div
                key={vendorId}
                className="rounded-2xl border border-zinc-800 bg-[#121215] shadow-xs overflow-hidden"
              >
                {/* Vendor Header */}
                <div className="bg-[#16161a] px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-zinc-200">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Seller: {vendorItems[0]?.vendorId === 'vendor_nexconn_audio' ? 'Nexconn Audio & Smart Tech' : 'Ubuy Global Express'}</span>
                  </div>
                  <button
                    onClick={() => startConversationWithVendor(vendorId, vendorItems[0]?.productId)}
                    className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 hover:text-white"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Message Seller
                  </button>
                </div>

                {/* Vendor Items */}
                <div className="divide-y divide-zinc-800/80 p-4 space-y-4">
                  {vendorItems.map((item) => (
                    <div key={item.productId} className="flex gap-4 pt-4 first:pt-0">
                      <Link to={`/shop/products/${item.productId}`} className="shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-20 w-20 rounded-xl object-contain bg-[#0c0c0e] border border-zinc-800 p-1"
                        />
                      </Link>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <Link
                              to={`/shop/products/${item.productId}`}
                              className="text-xs font-bold text-zinc-100 hover:text-zinc-300 line-clamp-2 leading-snug"
                            >
                              {item.title}
                            </Link>
                            <span className="text-sm font-black text-white shrink-0">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>

                          {item.selectedVariant && (
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              {Object.entries(item.selectedVariant)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' • ')}
                            </p>
                          )}

                          <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                            <Truck className="h-3 w-3" /> Delivery by Tomorrow | Free Air Parcel
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-800/80">
                          {/* Stepper */}
                          <div className="flex items-center rounded-lg border border-zinc-800 bg-[#16161a]">
                            <button
                              onClick={() => updateQty(item.productId, item.quantity - 1)}
                              className="px-2.5 py-0.5 text-zinc-400 hover:text-white rounded-l-lg font-black text-xs"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-0.5 text-xs font-black text-white min-w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.productId, item.quantity + 1)}
                              className="px-2.5 py-0.5 text-zinc-400 hover:text-white rounded-r-lg font-black text-xs"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            <button
                              onClick={() => startConversationWithVendor(item.vendorId, item.productId)}
                              className="font-semibold text-zinc-400 hover:text-white flex items-center gap-1"
                            >
                              <MessageSquare className="h-3 w-3" /> Contact
                            </button>
                            <button
                              onClick={() => removeItem(item.productId)}
                              className="font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT: Price Details (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Coupon Box */}
            <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-4 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 mb-2 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-zinc-400" /> Promotional Coupon
              </h3>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. CONVO10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-800 bg-[#16161a] px-3 py-1.5 text-xs uppercase font-bold text-white focus:border-zinc-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-zinc-200"
                >
                  Apply
                </button>
              </form>
              {appliedCoupon && (
                <p className="mt-2 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Coupon "{appliedCoupon}" applied! 10% deducted.
                </p>
              )}
              {couponError && (
                <p className="mt-2 text-[11px] font-bold text-rose-400">
                  {couponError}
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-800 pb-2">
                Price Breakdown
              </h3>

              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-white">{formatPrice(subtotal)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping & Duties</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="font-bold text-emerald-400">FREE</span>
                    ) : (
                      <span className="font-bold">{formatPrice(shipping)}</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-bold">{formatPrice(tax)}</span>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-3 flex items-baseline justify-between text-sm">
                <span className="font-black text-white">Total Amount</span>
                <span className="text-xl font-black text-white">{formatPrice(total)}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center text-xs font-bold text-emerald-400">
                  You are saving {formatPrice(couponDiscount)} on this order!
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={() => navigate('/shop/checkout')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 py-3 text-xs font-black uppercase tracking-wider text-black shadow-lg transition-all active:scale-95"
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </button>

              <div className="pt-2 text-[10px] text-zinc-500 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Encrypted Razorpay Payment Gateway</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
