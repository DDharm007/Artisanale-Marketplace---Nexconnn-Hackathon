import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus } from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useChatStore } from '../stores/useChatStore';
import { formatCurrency, formatDate } from '../lib/utils';
import { ShoppingBag, ArrowRight, Truck, Check, X, Eye, MessageSquare, Mail, Phone, MapPin } from 'lucide-react';

export const VendorOrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const { startConversationWithCustomer } = useChatStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
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

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    let trackingNumber: string | undefined = undefined;
    let shippingCarrier: string | undefined = undefined;

    if (nextStatus === 'shipped') {
      trackingNumber = prompt('Enter parcel tracking number (e.g. TRK-FDX-9941):') || `TRK-EXP-${Math.floor(100000 + Math.random() * 900000)}`;
      shippingCarrier = prompt('Enter shipping carrier (e.g. FedEx, DHL Express, BlueDart):') || 'FedEx Express';
    }

    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          trackingNumber,
          shippingCarrier,
        }),
      });
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Status transition error');
    }
  };

  const filtered = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    return o.orderStatus === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Customer Order Fulfillment</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative order pipeline, validated status state machine, and shipping tracking.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-200/60 p-1 text-xs font-semibold">
          {['all', 'confirmed', 'processing', 'shipped', 'delivered'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-lg px-3 py-1 capitalize transition-colors ${
                filterStatus === st ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Ordered Products</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Fulfillment Status</th>
                <th className="py-3.5 px-4 text-right">Advance State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((order) => (
                <tr key={order.orderId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-slate-900">{order.orderId}</span>
                    <span className="text-[10px] text-slate-400 block">{formatDate(order.createdAt)}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{order.consumerName}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await startConversationWithCustomer(
                              order.consumerId,
                              user?.vendorId || order.vendorId,
                              order.orderId
                            );
                            navigate('/vendor/conversations');
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 hover:bg-brand-100 transition-colors shrink-0"
                        title="Open 1-on-1 Seller Chat with Buyer"
                      >
                        <MessageSquare className="h-3 w-3" /> Chat Buyer
                      </button>
                    </div>
                    <div className="mt-0.5 space-y-0.5 text-[11px] text-slate-500">
                      {order.consumerEmail && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          {order.consumerEmail}
                        </span>
                      )}
                      {(order.consumerPhone || order.addressSnapshot.phone) && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          {order.consumerPhone || order.addressSnapshot.phone}
                        </span>
                      )}
                      <span className="flex items-start gap-1 max-w-[220px]">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {order.addressSnapshot.street}, {order.addressSnapshot.city}
                          {order.addressSnapshot.state ? `, ${order.addressSnapshot.state}` : ''}
                          {order.addressSnapshot.postalCode ? ` ${order.addressSnapshot.postalCode}` : ''}
                          {order.addressSnapshot.country ? `, ${order.addressSnapshot.country}` : ''}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      {order.items.map((it) => (
                        <div key={it.productId} className="truncate max-w-xs text-slate-700">
                          <strong>{it.quantity}x</strong> {it.title}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    {formatCurrency(order.total)}
                    <span className="text-[10px] text-emerald-600 block font-semibold uppercase">
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-slate-700 capitalize">
                      {order.orderStatus.replace('_', ' ')}
                    </span>
                    {order.trackingNumber && (
                      <span className="text-[10px] font-mono text-slate-400 block mt-1">
                        {order.trackingNumber}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {order.orderStatus === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(order.orderId, 'processing')}
                          className="rounded-xl bg-slate-900 px-3 py-1.5 font-bold text-white hover:bg-brand-600"
                        >
                          Start Packing →
                        </button>
                      )}
                      {order.orderStatus === 'processing' && (
                        <button
                          onClick={() => handleUpdateStatus(order.orderId, 'shipped')}
                          className="rounded-xl bg-brand-600 px-3 py-1.5 font-bold text-white hover:bg-brand-700 flex items-center gap-1"
                        >
                          <Truck className="h-3.5 w-3.5" /> Ship Order →
                        </button>
                      )}
                      {order.orderStatus === 'shipped' && (
                        <button
                          onClick={() => handleUpdateStatus(order.orderId, 'delivered')}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700 flex items-center gap-1"
                        >
                          <Check className="h-3.5 w-3.5" /> Mark Delivered
                        </button>
                      )}
                      {order.orderStatus === 'delivered' && (
                        <span className="text-emerald-600 font-bold text-[11px]">
                          Fulfillment Complete
                        </span>
                      )}
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
