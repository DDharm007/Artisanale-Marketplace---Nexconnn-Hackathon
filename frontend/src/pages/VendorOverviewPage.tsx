import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { VendorOverviewStats, Order } from '@convocart/shared';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuthStore } from '../stores/useAuthStore';
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
  const { user } = useAuthStore();
  const vendorId = user?.vendorId || 'me';
  const [stats, setStats] = useState<VendorOverviewStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiRequest<{
      overview: VendorOverviewStats;
      chartData: any[];
      recentOrders: Order[];
    }>(`/vendors/${vendorId}/statistics`)
      .then((data) => {
        setStats(data.overview);
        setChartData(data.chartData);
        setRecentOrders(data.recentOrders);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [vendorId]);

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
      color: 'text-[#171717] bg-[#ECEAE4] border border-[#E4DEC8]',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      subtext: `${stats.pendingOrders} pending fulfillment`,
      icon: ShoppingBag,
      color: 'text-[#171717] bg-[#ECEAE4] border border-[#E4DEC8]',
    },
    {
      label: 'Active Products',
      value: stats.activeProducts.toString(),
      subtext: `Out of ${stats.totalProducts} total`,
      icon: Package,
      color: 'text-[#171717] bg-[#ECEAE4] border border-[#E4DEC8]',
    },
    {
      label: 'Unique Customers',
      value: stats.newCustomers.toString(),
      subtext: `AOV: ${formatCurrency(stats.averageOrderValue)}`,
      icon: Users,
      color: 'text-[#171717] bg-[#ECEAE4] border border-[#E4DEC8]',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Top Header */}
      <div>
        <h1
          className="text-3xl font-normal text-[#171717]"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
        >
          Vendor Performance Overview
        </h1>
        <p className="text-xs text-[#686359] mt-1">
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
              className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-5 shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8C867A]">
                  {card.label}
                </span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.color}`}>
                  <Icon className="h-5 w-5 text-[#D6B875]" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#171717] mb-1">
                {card.value}
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {card.growth ? (
                  <span className="flex items-center font-bold text-emerald-700">
                    <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> {card.growth} vs last week
                  </span>
                ) : (
                  <span className="text-[#8C867A] font-medium">{card.subtext}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Performance Chart (Recharts) */}
      <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-2xl font-normal text-[#171717]"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
            >
              Revenue Growth Over Time
            </h3>
            <p className="text-xs text-[#8C867A] mt-0.5">Authoritative sales data (USD)</p>
          </div>
          <span className="rounded-full bg-[#171717] px-3 py-1 text-xs font-semibold text-[#D6B875] border border-[#D6B875]/40">
            Live Database Synced
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D6B875" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#D6B875" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4DEC8" />
              <XAxis dataKey="day" stroke="#8C867A" fontSize={11} tickLine={false} />
              <YAxis stroke="#8C867A" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                formatter={(value: any) => [`$${value}`, 'Revenue']}
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid #E4DEC8',
                  backgroundColor: '#FAF8F3',
                  color: '#171717',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#D6B875"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-6 shadow-xs">
        <h3
          className="text-2xl font-normal text-[#171717] mb-4"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
        >
          Recent Store Purchases
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E4DEC8] text-[#8C867A] font-semibold uppercase tracking-wider text-[11px]">
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Items</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DEC8]">
              {recentOrders.map((ord) => (
                <tr key={ord.orderId} className="hover:bg-[#ECEAE4]/60 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-[#171717]">{ord.orderId}</td>
                  <td className="py-3.5 font-medium text-[#2B2B2B]">{ord.consumerName}</td>
                  <td className="py-3.5 text-[#555047]">{ord.items.length} items</td>
                  <td className="py-3.5 font-bold text-[#171717]">{formatCurrency(ord.total)}</td>
                  <td className="py-3.5">
                    <span className="rounded-full bg-[#171717] text-[#D6B875] px-2.5 py-0.5 font-semibold capitalize text-[10px]">
                      {ord.orderStatus}
                    </span>
                  </td>
                  <td className="py-3.5 text-[#8C867A]">{formatDate(ord.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
