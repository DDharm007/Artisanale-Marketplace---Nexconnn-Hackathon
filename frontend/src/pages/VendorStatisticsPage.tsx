import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { VendorOverviewStats } from '@convocart/shared';
import { useAuthStore } from '../stores/useAuthStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CheckCircle2, Languages, Bot } from 'lucide-react';

export const VendorStatisticsPage: React.FC = () => {
  const { user } = useAuthStore();
  const vendorId = user?.vendorId || 'me';
  const [stats, setStats] = useState<{ overview: VendorOverviewStats; chartData: any[] } | null>(null);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    apiRequest<{ overview: VendorOverviewStats; chartData: any[] }>(
      `/vendors/${vendorId}/statistics?timeframe=${timeframe}`
    )
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, [vendorId, timeframe]);

  if (!stats) {
    return <div className="py-20 text-center text-slate-400">Loading live commercial telemetry...</div>;
  }

  const ov = stats.overview;
  const avgMins = ((ov.avgResponseTimeSeconds ?? 48) / 60).toFixed(1);
  const convRate = ov.chatToSaleConversionRate ?? 0;
  const retentionRate = ov.customerRetentionRate ?? 0;
  const aiResRate = ov.aiResolutionRate ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E4DEC8]">
        <div>
          <h1
            className="text-3xl font-normal text-[#171717]"
            style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
          >
            Analytics & Commercial Telemetry
          </h1>
          <p className="text-xs text-[#686359] mt-1">
            Live order velocity, seller/AI response latency, translation telemetry, and conversion funnels.
          </p>
        </div>

        <div className="flex rounded-xl bg-[#ECEAE4] border border-[#E4DEC8] p-1 text-xs font-semibold">
          {(['daily', 'weekly', 'monthly'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-lg px-3 py-1 capitalize transition-colors ${
                timeframe === tf ? 'bg-[#171717] text-[#D6B875] shadow-xs' : 'text-[#686359] hover:text-[#171717]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-5 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C867A]">
            Average Response Time
          </span>
          <div className="text-2xl font-black text-[#171717] mt-2 mb-1">
            {avgMins} mins
          </div>
          <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> {ov.avgResponseTimeSeconds ?? 48}s computed from chats
          </p>
        </div>

        <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-5 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C867A]">
            Chat-to-Sale Conversion
          </span>
          <div className="text-2xl font-black text-[#171717] mt-2 mb-1">
            {convRate}%
          </div>
          <p className="text-xs text-[#686359] font-medium">
            {ov.totalOrders} orders from live store funnel
          </p>
        </div>

        <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-5 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C867A]">
            Customer Retention Rate
          </span>
          <div className="text-2xl font-black text-[#171717] mt-2 mb-1">
            {retentionRate}%
          </div>
          <p className="text-xs text-[#686359] font-medium">
            Active buyers & repeat engagement
          </p>
        </div>

        <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-5 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C867A]">
            AI Resolution Rate
          </span>
          <div className="text-2xl font-black text-[#171717] mt-2 mb-1">
            {aiResRate}%
          </div>
          <p className="text-xs text-[#171717] font-semibold flex items-center gap-1">
            <Bot className="h-3.5 w-3.5 text-[#D6B875]" /> {ov.escalatedConversations ?? 0} escalated threads
          </p>
        </div>

        <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-5 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C867A]">
            Multilingual Volume
          </span>
          <div className="text-2xl font-black text-[#171717] mt-2 mb-1">
            {ov.translatedMessagesCount ?? 0}
          </div>
          <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <Languages className="h-3.5 w-3.5 text-[#D6B875]" /> Auto-translated messages
          </p>
        </div>
      </div>

      {/* Orders Velocity Chart */}
      <div className="rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-6 shadow-xs">
        <h3
          className="text-2xl font-normal text-[#171717] mb-6 capitalize"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
        >
          {timeframe} Order Volume & Fulfillment Cadence
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4DEC8" />
              <XAxis dataKey="day" stroke="#8C867A" fontSize={11} tickLine={false} />
              <YAxis stroke="#8C867A" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid #E4DEC8',
                  backgroundColor: '#FAF8F3',
                  color: '#171717',
                }}
              />
              <Bar dataKey="orders" fill="#D6B875" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
