import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Clock, Users, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export const VendorStatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    apiRequest('/vendors/vendor_nexconn_audio/statistics')
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  if (!stats) return <div className="py-20 text-center text-slate-400">Loading deep analytics...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Analytics & Commercial Telemetry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Order velocity, seller response time, and conversion funnels.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-200/70 p-1 text-xs font-semibold">
          <button
            onClick={() => setTimeframe('daily')}
            className={`rounded-lg px-3 py-1 transition-colors ${timeframe === 'daily' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={`rounded-lg px-3 py-1 transition-colors ${timeframe === 'weekly' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={`rounded-lg px-3 py-1 transition-colors ${timeframe === 'monthly' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Average Response Time
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2 mb-1">
            1.2 mins
          </div>
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Enhanced by AI Vendor Agent
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Chat-to-Sale Conversion
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2 mb-1">
            28.4%
          </div>
          <p className="text-xs text-slate-500 font-medium">
            3x higher than industry non-conversational average
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Customer Retention Rate
          </span>
          <div className="text-2xl font-black text-slate-900 mt-2 mb-1">
            74.2%
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Repeat shoppers within 60 days
          </p>
        </div>
      </div>

      {/* Orders Velocity Chart */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 mb-6">
          Order Volume & Fulfillment Cadence
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                }}
              />
              <Bar dataKey="orders" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
