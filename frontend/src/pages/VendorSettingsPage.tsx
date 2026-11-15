import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { Vendor, VendorAvailability } from '@convocart/shared';
import { Settings, Save, Check, Radio } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

export const VendorSettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const vendorId = user?.vendorId || 'me';
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [availability, setAvailability] = useState<VendorAvailability>('online');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    apiRequest<Vendor>(`/vendors/${vendorId}`).then((v) => {
      setVendor(v);
      setAvailability(v.availability);
    });
  }, [vendorId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(`/vendors/${vendorId}`, {
        method: 'PATCH',
        body: JSON.stringify({ availability }),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900">Store Operational Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Control presence indicators, AI fallback auto-switch triggers, and communication preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Real-Time Presence & AI Fallback Trigger
          </h3>
          <p className="text-slate-500">
            When set to <strong>Away</strong> or <strong>Offline</strong>, your AI Vendor Agent will automatically greet buyers and handle inquiries.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { id: 'online', label: 'Online', desc: 'Direct chat enabled', color: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
              { id: 'busy', label: 'Busy', desc: 'Slower human replies', color: 'border-amber-500 bg-amber-50 text-amber-700' },
              { id: 'away', label: 'Away', desc: 'AI assistant active', color: 'border-purple-500 bg-purple-50 text-purple-700' },
              { id: 'offline', label: 'Offline', desc: '100% AI auto-response', color: 'border-slate-500 bg-slate-50 text-slate-700' },
            ].map((opt) => (
              <label
                key={opt.id}
                className={`rounded-2xl border-2 p-3.5 cursor-pointer transition-all ${
                  availability === opt.id ? opt.color : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="availability"
                  value={opt.id}
                  checked={availability === opt.id}
                  onChange={() => setAvailability(opt.id as VendorAvailability)}
                  className="sr-only"
                />
                <span className="font-bold text-xs block">{opt.label}</span>
                <span className="text-[10px] opacity-80 block mt-0.5">{opt.desc}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {isSaved && (
            <span className="flex items-center gap-1 font-bold text-emerald-600">
              <Check className="h-4 w-4" /> Settings saved!
            </span>
          )}
          <button
            type="submit"
            className="rounded-2xl bg-brand-600 px-6 py-2.5 font-bold text-white shadow-md hover:bg-brand-700"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};
