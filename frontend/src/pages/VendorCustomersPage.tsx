import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { useAuthStore } from '../stores/useAuthStore';
import { useChatStore } from '../stores/useChatStore';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  CheckCircle2,
  Eye,
  Fingerprint,
  Globe,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Search,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';

interface SellerCustomerRecord {
  uid: string;
  firebaseUid?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  preferredLanguage: string;
  authProvider?: string;
  createdAt?: string;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
  };
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  activeConversationId?: string;
  lastMessageText?: string;
  recentOrders: Array<{
    orderId: string;
    total: number;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
    itemsCount: number;
    trackingNumber?: string;
  }>;
}

const DEFAULT_AVATAR = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Customer';

export const VendorCustomersPage: React.FC = () => {
  const { user } = useAuthStore();
  const { selectConversation, startConversationWithCustomer } = useChatStore();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<SellerCustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<SellerCustomerRecord | null>(null);
  const [messagingUid, setMessagingUid] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.vendorId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await apiRequest<SellerCustomerRecord[]>(`/vendors/${user.vendorId}/customers`);
        setCustomers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [user?.vendorId]);

  const handleMessageCustomer = async (cust: SellerCustomerRecord) => {
    if (!user?.vendorId) return;
    setMessagingUid(cust.uid);
    try {
      if (cust.activeConversationId) {
        await selectConversation(cust.activeConversationId, false);
      } else {
        await startConversationWithCustomer(cust.uid, user.vendorId);
      }
      navigate('/vendor/conversations');
    } catch (err) {
      console.error('Failed to open customer chat:', err);
    } finally {
      setMessagingUid(null);
    }
  };

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phoneNumber || '').toLowerCase().includes(q) ||
      (c.shippingAddress?.city || '').toLowerCase().includes(q) ||
      (c.shippingAddress?.country || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-600" />
            Store Customers &amp; Fulfillment CRM
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verified customer contact, language, shipping, and store purchase records required for fulfillment and support.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, city..."
            className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Customer Identity</th>
                <th className="py-3.5 px-4">Verified Contact</th>
                <th className="py-3.5 px-4">Delivery Location</th>
                <th className="py-3.5 px-4">Language</th>
                <th className="py-3.5 px-4">Store Orders</th>
                <th className="py-3.5 px-4">Store Spend</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2 text-brand-600" />
                    Loading store customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    {customers.length === 0
                      ? 'No customers have chatted or ordered from your store yet.'
                      : 'No matching customers found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => {
                  const locationText = [cust.shippingAddress?.city, cust.shippingAddress?.state, cust.shippingAddress?.country]
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <tr key={cust.uid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={cust.photoURL || DEFAULT_AVATAR}
                            alt={cust.name}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200 bg-slate-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 truncate">{cust.name}</span>
                              {cust.firebaseUid && (
                                <span
                                  title={`Verified Account ID: ${cust.firebaseUid}`}
                                  className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700"
                                >
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[160px]">
                              {(cust.firebaseUid || cust.uid).slice(0, 14)}
                              {(cust.firebaseUid || cust.uid).length > 14 ? '...' : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[175px]">{cust.email}</span>
                          </span>
                          {(cust.phoneNumber || cust.shippingAddress?.phone) && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                              {cust.phoneNumber || cust.shippingAddress?.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {locationText ? (
                          <div className="max-w-[180px]">
                            <span className="flex items-center gap-1 font-medium text-slate-700 truncate">
                              <MapPin className="h-3 w-3 text-brand-500 shrink-0" />
                              {locationText}
                            </span>
                            {cust.shippingAddress?.street && (
                              <span className="text-[10px] text-slate-400 block truncate pl-4">
                                {cust.shippingAddress.street}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">No address yet</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-slate-700">
                          <Globe className="h-3 w-3 text-slate-500" />
                          {cust.preferredLanguage || 'en'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">{cust.totalOrders}</td>

                      <td className="py-3.5 px-4 font-black text-emerald-600">
                        {formatCurrency(cust.totalSpent)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {cust.lastOrderDate ? formatDate(cust.lastOrderDate) : 'Chat inquiry'}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomer(cust)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" /> Dossier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMessageCustomer(cust)}
                            disabled={messagingUid === cust.uid}
                            className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
                          >
                            {messagingUid === cust.uid ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <MessageSquare className="h-3.5 w-3.5" />
                            )}
                            Chat
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Dossier Modal / Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl border-l border-slate-200 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedCustomer.photoURL || DEFAULT_AVATAR}
                  alt={selectedCustomer.name}
                  className="h-12 w-12 rounded-full object-cover border border-slate-200 bg-white shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-base font-black text-slate-900 truncate">
                    {selectedCustomer.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Fingerprint className="h-3 w-3 text-slate-400" />
                    <span className="font-mono truncate">
                      {selectedCustomer.firebaseUid || selectedCustomer.uid}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1 text-xs">
              {/* Contact Details */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  Verified Contact &amp; Chat Preferences
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-700">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                    <span className="truncate">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                    <span>
                      {selectedCustomer.phoneNumber ||
                        selectedCustomer.shippingAddress?.phone ||
                        'Not provided'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                    <span>
                      Preferred Language:{' '}
                      <strong className="uppercase">{selectedCustomer.preferredLanguage || 'en'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="capitalize">
                      Auth: {selectedCustomer.authProvider === 'google' ? 'Google Sign-In' : 'Verified Email'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5">
                <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" />
                  Shipping / Fulfillment Address
                </h3>
                {selectedCustomer.shippingAddress?.street || selectedCustomer.shippingAddress?.city ? (
                  <div className="text-slate-700 space-y-0.5 pt-1">
                    {selectedCustomer.shippingAddress.street && (
                      <p className="font-semibold">{selectedCustomer.shippingAddress.street}</p>
                    )}
                    <p>
                      {[
                        selectedCustomer.shippingAddress.city,
                        selectedCustomer.shippingAddress.state,
                        selectedCustomer.shippingAddress.postalCode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                    {selectedCustomer.shippingAddress.country && (
                      <p className="text-slate-500">{selectedCustomer.shippingAddress.country}</p>
                    )}
                    {selectedCustomer.shippingAddress.phone && (
                      <p className="text-slate-500">Delivery Phone: {selectedCustomer.shippingAddress.phone}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400">Customer has not saved a delivery address yet.</p>
                )}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <span className="text-[11px] font-bold text-slate-500">Orders With Your Store</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{selectedCustomer.totalOrders}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <span className="text-[11px] font-bold text-slate-500">Lifetime Store Spend</span>
                  <p className="text-xl font-black text-emerald-600 mt-1">
                    {formatCurrency(selectedCustomer.totalSpent)}
                  </p>
                </div>
              </div>

              {/* Last Chat Snippet */}
              {selectedCustomer.lastMessageText && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <p className="text-[11px] font-bold text-indigo-800 mb-1">Latest Conversation Message</p>
                  <p className="text-slate-700 italic">&ldquo;{selectedCustomer.lastMessageText}&rdquo;</p>
                </div>
              )}

              {/* Store Orders */}
              <div className="space-y-2.5">
                <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-brand-600" />
                  Order History With Your Store ({selectedCustomer.recentOrders.length})
                </h3>
                {selectedCustomer.recentOrders.length ? (
                  <div className="space-y-2">
                    {selectedCustomer.recentOrders.map((ord) => (
                      <div
                        key={ord.orderId}
                        className="rounded-2xl border border-slate-200 p-3 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{ord.orderId}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                              {ord.orderStatus}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {ord.itemsCount} item{ord.itemsCount === 1 ? '' : 's'} • {formatDate(ord.createdAt)}
                            {ord.trackingNumber ? ` • Track: ${ord.trackingNumber}` : ''}
                          </p>
                        </div>
                        <span className="font-black text-emerald-600 shrink-0">
                          {formatCurrency(ord.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-slate-400">
                    <Package className="h-5 w-5 mx-auto mb-1 opacity-60" />
                    Pre-purchase inquiry — no orders placed with your store yet.
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleMessageCustomer(selectedCustomer)}
                disabled={messagingUid === selectedCustomer.uid}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 transition-colors disabled:opacity-60"
              >
                {messagingUid === selectedCustomer.uid ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MessageSquare className="h-3.5 w-3.5" />
                )}
                Message Customer in Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
