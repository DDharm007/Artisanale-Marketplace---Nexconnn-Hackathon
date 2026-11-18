import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { Vendor } from '@convocart/shared';
import { Store, Save, Check, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

export const VendorProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const vendorId = user?.vendorId || 'me';
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    apiRequest<Vendor>(`/vendors/${vendorId}`).then((v) => {
      setVendor(v);
      setBusinessName(v.businessName);
      setDescription(v.description);
      setLogo(v.logo);
      setContactEmail(v.contactEmail);
      setContactPhone(v.contactPhone);
    });
  }, [vendorId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiRequest(`/vendors/${vendorId}`, {
        method: 'PATCH',
        body: JSON.stringify({ businessName, description, logo, contactEmail, contactPhone }),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900">Store Profile & Branding</h1>
        <p className="text-xs text-slate-500 mt-1">
          Public storefront presence visible across all customer product pages and conversations.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <img src={logo} alt="" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-brand-200" />
            <div>
              <span className="font-bold text-slate-800 text-sm block">{businessName}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified Marketplace Vendor
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Business Store Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Logo URL</label>
              <input
                type="url"
                required
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Store Description</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Support Contact Email</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {isSaved && (
            <span className="flex items-center gap-1 font-bold text-emerald-600">
              <Check className="h-4 w-4" /> Profile saved!
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-[#171717] px-6 py-2.5 font-bold text-[#D6B875] hover:bg-black transition-colors flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" /> Save Profile
          </button>
        </div>
      </form>
    </div>
  );
};
