import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { apiRequest } from '../lib/api';
import { User, Mail, Phone, MapPin, Globe, Shield, Check, Plus } from 'lucide-react';
import { Address } from '@convocart/shared';

export const ProfilePage: React.FC = () => {
  const { user, fetchMe } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Address form modal state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddr, setNewAddr] = useState<Address>({
    id: `addr_${Date.now()}`,
    fullName: user?.displayName || '',
    phone: user?.phoneNumber || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ displayName, phoneNumber, preferredLanguage }),
      });
      await fetchMe();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedAddresses = [...(user?.addresses || []), newAddr];
    try {
      await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ addresses: updatedAddresses }),
      });
      await fetchMe();
      setShowAddAddress(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-black text-slate-900">User Account & Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details, default shipping destinations, and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: User Avatar & Role Overview */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center">
          <div className="relative mx-auto mb-4 h-24 w-24">
            <img
              src={
                user?.photoURL ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
              }
              alt=""
              className="h-24 w-24 rounded-full object-cover ring-4 ring-brand-100"
            />
          </div>
          <h3 className="text-base font-bold text-slate-900">{user?.displayName}</h3>
          <p className="text-xs text-slate-500">{user?.email}</p>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
            <span className="rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-bold text-brand-700 capitalize">
              Role: {user?.role}
            </span>
          </div>
        </div>

        {/* Right: Personal Info & Addresses */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Preferred Language</label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none font-medium"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="ja">日本語 (Japanese)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              {isSaved && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <Check className="h-4 w-4" /> Profile updated successfully!
                </span>
              )}
            </div>
          </form>

          {/* Saved Addresses */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Delivery Address Book
              </h3>
              <button
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add New Address
              </button>
            </div>

            {/* Address List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(user?.addresses || []).map((addr) => (
                <div
                  key={addr.id}
                  className="rounded-2xl border border-slate-200 p-4 text-xs space-y-1 relative bg-slate-50"
                >
                  <h4 className="font-bold text-slate-900">{addr.fullName}</h4>
                  <p className="text-slate-600">{addr.street}</p>
                  <p className="text-slate-600">
                    {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                  <p className="text-slate-500">{addr.phone}</p>
                </div>
              ))}
            </div>

            {/* Add Address Form Modal / Inline */}
            {showAddAddress && (
              <form onSubmit={handleAddAddress} className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 space-y-3 mt-4 text-xs">
                <h4 className="font-bold text-slate-900">Add New Shipping Address</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={newAddr.fullName}
                    onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                    className="rounded-xl border border-slate-300 p-2 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    required
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                    className="rounded-xl border border-slate-300 p-2 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Street Address"
                    required
                    value={newAddr.street}
                    onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                    className="col-span-2 rounded-xl border border-slate-300 p-2 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    required
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="rounded-xl border border-slate-300 p-2 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    required
                    value={newAddr.postalCode}
                    onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                    className="rounded-xl border border-slate-300 p-2 bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-600 px-4 py-2 font-bold text-white hover:bg-brand-700"
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
