import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  Shield,
  DollarSign,
  Users,
  Store,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Vendor, Product, UserProfile } from '@convocart/shared';

export const AdminDashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'users'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [ov, vens, usrs] = await Promise.all([
        apiRequest('/admin/overview'),
        apiRequest<Vendor[]>('/admin/vendors'),
        apiRequest<UserProfile[]>('/admin/users'),
      ]);
      setOverview(ov);
      setVendors(vens);
      setUsers(usrs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateVendorStatus = async (vendorId: string, status: string) => {
    try {
      await apiRequest(`/admin/vendors/${vendorId}/verification`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading || !overview) {
    return <div className="py-20 text-center text-slate-400">Loading Admin Governance Console...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-purple-100 p-1.5 text-purple-700">
              <Shield className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900">Platform Governance & Supervision</h1>
          </div>
          <p className="text-xs text-slate-500">
            Authoritative marketplace controls, vendor licensing, product moderation, and commission telemetry.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-200/60 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`rounded-lg px-3 py-1 transition-colors ${activeTab === 'overview' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`rounded-lg px-3 py-1 transition-colors ${activeTab === 'vendors' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
          >
            Vendors ({vendors.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`rounded-lg px-3 py-1 transition-colors ${activeTab === 'users' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
          >
            Users ({users.length})
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Gross Merchandise Value
              </span>
              <div className="text-2xl font-black text-slate-900 mt-2 mb-1">
                {formatCurrency(overview.totalGMV)}
              </div>
              <p className="text-xs text-emerald-600 font-semibold">100% processed via Razorpay</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Marketplace Commission (5%)
              </span>
              <div className="text-2xl font-black text-slate-900 mt-2 mb-1">
                {formatCurrency(overview.totalCommissions)}
              </div>
              <p className="text-xs text-slate-400 font-medium">Platform revenue retained</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Vendors
              </span>
              <div className="text-2xl font-black text-slate-900 mt-2 mb-1">
                {overview.totalVendors}
              </div>
              <p className="text-xs text-brand-600 font-semibold">Approved sellers</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pending Support Tickets
              </span>
              <div className="text-2xl font-black text-slate-900 mt-2 mb-1">
                {overview.pendingTickets}
              </div>
              <p className="text-xs text-amber-600 font-semibold">Active queue</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Vendor Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Verification Status</th>
                  <th className="py-3.5 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((v) => (
                  <tr key={v.vendorId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img src={v.logo} alt="" className="h-8 w-8 rounded-xl object-cover" />
                        <div>
                          <span className="font-bold text-slate-900 block">{v.businessName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{v.vendorId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{v.category}</td>
                    <td className="py-3.5 px-4 text-amber-500 font-bold">★ {v.rating.toFixed(1)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                          v.verificationStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {v.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {v.verificationStatus !== 'approved' && (
                          <button
                            onClick={() => handleUpdateVendorStatus(v.vendorId, 'approved')}
                            className="rounded-xl bg-emerald-600 px-3 py-1 font-bold text-white hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                        )}
                        {v.verificationStatus !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateVendorStatus(v.vendorId, 'rejected')}
                            className="rounded-xl bg-rose-600 px-3 py-1 font-bold text-white hover:bg-rose-700"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.displayName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-slate-700 capitalize">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
