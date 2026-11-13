import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { useChatStore } from '../stores/useChatStore';
import { Users, MessageSquare, ShoppingBag, Mail } from 'lucide-react';

export const VendorCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { startConversationWithVendor } = useChatStore();

  useEffect(() => {
    apiRequest('/vendors/vendor_nexconn_audio/customers')
      .then((data) => setCustomers(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900">Customer CRM & Relationship Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Directly reach out to verified buyers who placed orders with your store.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Completed Orders</th>
                <th className="py-3.5 px-4">Lifetime Spend</th>
                <th className="py-3.5 px-4">Last Order</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.uid} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{c.email}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{c.totalOrders}</td>
                  <td className="py-3.5 px-4 font-black text-slate-900">{formatCurrency(c.totalSpent)}</td>
                  <td className="py-3.5 px-4 text-slate-400">{formatDate(c.lastOrderDate)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => startConversationWithVendor('vendor_nexconn_audio')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Message Customer
                    </button>
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
