import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { formatDate } from '../lib/utils';
import { useChatStore } from '../stores/useChatStore';
import { usePreferencesStore } from '../stores/usePreferencesStore';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  Download,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { startConversationWithVendor } = useChatStore();
  const { formatPrice } = usePreferencesStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<Order[]>('/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await apiRequest(`/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Buyer requested cancellation' }),
      });
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Error cancelling order');
    }
  };

  const handleRequestReturn = async (orderId: string) => {
    const reason = prompt('Please describe the reason for return:');
    if (!reason) return;
    try {
      await apiRequest(`/orders/${orderId}/return`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Error submitting return');
    }
  };

  // State Machine Step Tracker
  const steps: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered'];

  const getStepIndex = (status: OrderStatus) => {
    const idx = steps.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* BREADCRUMB STRIP */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex items-center gap-1.5">
          <Link to="/shop" className="hover:text-amber-600">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/shop/profile" className="hover:text-amber-600">Your Account</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-slate-800">Your Orders & Tracking</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Your Orders</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track packages, download invoices, and chat directly with verified merchants.
            </p>
          </div>
          <Link
            to="/shop/products"
            className="text-xs font-bold text-amber-600 hover:underline"
          >
            Continue Shopping →
          </Link>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="h-8 w-8 mx-auto rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-3" />
            <p className="text-xs font-bold">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 mt-6 p-8">
            <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">You have no placed orders yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Explore our curated marketplace and buy with real-time seller support.
            </p>
            <Link
              to="/shop/products"
              className="inline-flex rounded-xl bg-[#ffd814] hover:bg-[#f7ca00] text-slate-950 px-6 py-2.5 text-xs font-extrabold shadow-sm border border-[#fcd200]"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {orders.map((order) => {
              const currentStepIdx = getStepIndex(order.orderStatus);
              const isTerminalNegative = ['cancelled', 'rejected'].includes(order.orderStatus);

              return (
                <div
                  key={order.orderId}
                  className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden"
                >
                  {/* Amazon Style Header Bar */}
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">ORDER PLACED</span>
                        <span className="font-bold text-slate-800">{formatDate(order.createdAt)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">TOTAL</span>
                        <span className="font-black text-slate-900">{formatPrice(order.total)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">SHIP TO</span>
                        <span className="font-bold text-slate-800">{order.addressSnapshot?.fullName || order.consumerName || 'Alex Johnson'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400 text-[11px]">
                        ORDER # {order.orderId}
                      </span>
                      <button
                        onClick={() => alert(`Invoice generated for Order ${order.orderId}`)}
                        className="flex items-center gap-1 font-bold text-amber-600 hover:underline text-[11px]"
                      >
                        <Download className="h-3.5 w-3.5" /> Invoice
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-5">
                    {/* Status headline */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-sm font-extrabold text-slate-900 capitalize">
                          {order.orderStatus.replace('_', ' ')}
                        </h3>
                        <span className="text-xs text-slate-500">
                          • {order.shippingStatus}
                        </span>
                      </div>
                    </div>

                    {/* Progress line */}
                    {!isTerminalNegative && (
                      <div className="py-2">
                        <div className="relative flex justify-between">
                          <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-200 z-0">
                            <div
                              className="h-full bg-amber-500 transition-all duration-500"
                              style={{
                                width: `${(currentStepIdx / (steps.length - 1)) * 100}%`,
                              }}
                            />
                          </div>

                          {steps.map((st, idx) => {
                            const isCompleted = currentStepIdx >= idx;
                            return (
                              <div key={st} className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black transition-colors ${
                                    isCompleted
                                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-100'
                                      : 'bg-white border-2 border-slate-300 text-slate-400'
                                  }`}
                                >
                                  {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                                </div>
                                <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                  {st}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Items List */}
                    <div className="divide-y divide-slate-100 border-t border-b py-2">
                      {order.items.map((item) => (
                        <div key={item.productId} className="flex gap-4 py-3 items-center">
                          {item.image && (
                            <img
                              src={item.image}
                              alt=""
                              className="h-16 w-16 rounded-xl object-contain bg-slate-50 border p-1"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Qty: {item.quantity} • {formatPrice(item.price)} each
                            </p>
                          </div>
                          <span className="text-xs font-black text-slate-900">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      {/* Seller live chat */}
                      <button
                        onClick={() => startConversationWithVendor(order.vendorId, undefined, order.orderId)}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 font-bold text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs"
                      >
                        <MessageSquare className="h-4 w-4 text-amber-600" />
                        Chat with Seller ({order.vendorName || 'Merchant'})
                      </button>

                      <div className="flex items-center gap-2">
                        {['pending', 'confirmed'].includes(order.orderStatus) && (
                          <button
                            onClick={() => handleCancelOrder(order.orderId)}
                            className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                          >
                            Cancel Order
                          </button>
                        )}

                        {order.orderStatus === 'delivered' && (
                          <button
                            onClick={() => handleRequestReturn(order.orderId)}
                            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Return / Replace Items
                          </button>
                        )}

                        <button
                          onClick={() => navigate('/support')}
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1"
                        >
                          <HelpCircle className="h-3.5 w-3.5" /> Need Help?
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
  );
};
