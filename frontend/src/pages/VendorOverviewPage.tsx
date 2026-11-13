import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { VendorOverviewStats, Order } from '@convocart/shared';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const VendorOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<VendorOverviewStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiRequest<{
      overview: VendorOverviewStats;
      chartData: any[];
      recentOrders: Order[];
    }>('/vendors/vendor_nexconn_audio/statistics')
      .then((data) => {
        setStats(data.overview);
        setChartData(data.chartData);
        setRecentOrders(data.recentOrders);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="h-8 w-8 mx-auto rounded-full border-2 border-brand-500 border-t-transparent animate-spin mb-3" />
        <p className="text-xs">Loading store analytics...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      growth: `+${stats.salesGrowthPercentage}%`,
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      subtext: `${stats.pendingOrders} pending fulfillment`,
      icon: ShoppingBag,
      color: 'text-brand-600 bg-brand-50',
    },
    {
      label: 'Active Products',
      value: stats.activeProducts.toString(),
      subtext: `Out of ${stats.totalProducts} total`,
      icon: Package,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Unique Customers',
      value: stats.newCustomers.toString(),
      subtext: `AOV: ${formatCurrency(stats.averageOrderValue)}`,
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Top Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Vendor Performance Overview</h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time metrics, store revenue trends, and customer purchase telemetry.
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {card.label}
                </span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                {card.value}
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {card.growth ? (
                  <span className="flex items-center font-bold text-emerald-600">
                    <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> {card.growth} vs last week
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">{card.subtext}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Performance Chart (Recharts) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Revenue Growth Over Time
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Authoritative sales data (USD)</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Live Database Synced
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                formatter={(value: any) => [`$${value}`, 'Revenue']}
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#7c3aed"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
          Recent Store Purchases
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Items</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((ord) => (
                <tr key={ord.orderId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-slate-900">{ord.orderId}</td>
                  <td className="py-3.5 font-medium text-slate-700">{ord.consumerName}</td>
                  <td className="py-3.5 text-slate-600">{ord.items.length} items</td>
                  <td className="py-3.5 font-bold text-slate-900">{formatCurrency(ord.total)}</td>
                  <td className="py-3.5">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-slate-700 capitalize">
                      {ord.orderStatus}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-400">{formatDate(ord.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
