import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Address,
  Conversation,
  Order,
  SUPPORTED_CHAT_LANGUAGES,
  SupportTicket,
  UserProfile,
} from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { uploadChatFile } from '../lib/firebase';
import {
  exportLocalRsaKeyBundle,
  getLocalRsaKeyInfo,
  syncMyRsaPublicKey,
} from '../lib/encryption';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuthStore } from '../stores/useAuthStore';
import { useChatStore } from '../stores/useChatStore';
import {
  Camera,
  Check,
  CheckCircle2,
  Fingerprint,
  Globe,
  Headphones,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  User as UserIcon,
} from 'lucide-react';

interface CustomerOverviewResponse {
  user: UserProfile;
  stats: {
    totalOrders: number;
    totalSpent: number;
    activeShipments: number;
    activeConversations: number;
    openSupportTickets: number;
  };
  recentOrders: Order[];
  conversations: Conversation[];
  supportTickets: SupportTicket[];
}

export const ProfilePage: React.FC = () => {
  const { user, isLoading: authLoading, updateUserProfile, logout } = useAuthStore();
  const { selectConversation } = useChatStore();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [overview, setOverview] = useState<CustomerOverviewResponse | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [rsaInfo, setRsaInfo] = useState<{
    publicKey: string;
    fingerprint: string;
    hasPrivateKey: boolean;
  } | null>(null);
  const [showPemModal, setShowPemModal] = useState(false);
  const [copiedKeyField, setCopiedKeyField] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
    fullName: user?.displayName || '',
    phone: user?.phoneNumber || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhoneNumber(user.phoneNumber || '');
      setPreferredLanguage(user.preferredLanguage || 'en');
      setNewAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || user.displayName || '',
        phone: prev.phone || user.phoneNumber || '',
      }));
      void (async () => {
        const info = await getLocalRsaKeyInfo(user.uid);
        if (info) {
          setRsaInfo(info);
        } else {
          const synced = await syncMyRsaPublicKey(user.uid, user.rsaPublicKey);
          if (synced) {
            setRsaInfo({ ...synced, hasPrivateKey: true });
          }
        }
      })();
    }
  }, [user]);

  const loadCustomerOverview = async () => {
    if (!user) return;
    setIsLoadingOverview(true);
    try {
      const data = await apiRequest<CustomerOverviewResponse>('/auth/customer-overview');
      setOverview(data);
    } catch (err) {
      console.error('Failed to load customer overview:', err);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      void loadCustomerOverview();
    } else {
      setOverview(null);
    }
  }, [user?.uid]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
        <p className="mt-3 text-sm font-medium text-slate-500">Loading your account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <UserIcon className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Sign In to View Your Account</h1>
          <p className="mt-2 text-sm text-slate-500">
            Access your synced profile, saved shipping addresses, order history, and seller chats.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth?redirect=/shop/profile"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Sign In or Create Account
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setErrorNotice(null);
    try {
      const { url } = await uploadChatFile(file, `avatars_${user.uid}`);
      await updateUserProfile({ photoURL: url });
      setSavedNotice('Profile photo updated across your account and active seller chats.');
      setTimeout(() => setSavedNotice(null), 3500);
    } catch (err: any) {
      setErrorNotice(err?.message || 'Failed to upload profile photo.');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorNotice('Display name cannot be empty.');
      return;
    }
    setIsSavingProfile(true);
    setErrorNotice(null);
    try {
      const primaryAddr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
      await updateUserProfile({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        preferredLanguage,
        ...(primaryAddr ? { city: primaryAddr.city, country: primaryAddr.country } : {}),
      });
      setSavedNotice('Profile saved and shared with your active sellers.');
      void loadCustomerOverview();
      setTimeout(() => setSavedNotice(null), 3500);
    } catch (err: any) {
      setErrorNotice(err?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.street.trim() || !newAddress.city.trim()) {
      setErrorNotice('Street address and city are required.');
      return;
    }
    setIsSavingAddress(true);
    setErrorNotice(null);
    try {
      const existing = user.addresses || [];
      const shouldBeDefault = newAddress.isDefault || existing.length === 0;
      const createdAddr: Address = {
        ...newAddress,
        id: `addr_${Date.now()}`,
        fullName: newAddress.fullName.trim() || user.displayName,
        phone: newAddress.phone.trim() || user.phoneNumber || '',
        isDefault: shouldBeDefault,
      };
      const updatedAddresses = [
        ...existing.map((a) => (shouldBeDefault ? { ...a, isDefault: false } : a)),
        createdAddr,
      ];
      await updateUserProfile({
        addresses: updatedAddresses,
        ...(shouldBeDefault ? { city: createdAddr.city, country: createdAddr.country } : {}),
      });
      setShowAddAddress(false);
      setNewAddress({
        fullName: user.displayName || '',
        phone: user.phoneNumber || '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: false,
      });
      setSavedNotice('Delivery address saved to your customer account.');
      setTimeout(() => setSavedNotice(null), 3500);
    } catch (err: any) {
      setErrorNotice(err?.message || 'Failed to add delivery address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (addrId: string) => {
    const existing = user.addresses || [];
    const target = existing.find((a) => a.id === addrId);
    if (!target) return;
    const updated = existing.map((a) => ({ ...a, isDefault: a.id === addrId }));
    try {
      await updateUserProfile({
        addresses: updated,
        city: target.city,
        country: target.country,
      });
      setSavedNotice(`Default delivery location updated to ${target.city}, ${target.country}.`);
      setTimeout(() => setSavedNotice(null), 3000);
    } catch (err: any) {
      setErrorNotice(err?.message || 'Failed to set default address.');
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    const existing = user.addresses || [];
    const filtered = existing.filter((a) => a.id !== addrId);
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0] = { ...filtered[0], isDefault: true };
    }
    const nextDefault = filtered.find((a) => a.isDefault) || filtered[0];
    try {
      await updateUserProfile({
        addresses: filtered,
        city: nextDefault?.city || '',
        country: nextDefault?.country || '',
      });
      setSavedNotice('Delivery address removed.');
      setTimeout(() => setSavedNotice(null), 3000);
    } catch (err: any) {
      setErrorNotice(err?.message || 'Failed to remove address.');
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/auth');
  };

  const providerLabel =
    user.authProvider === 'google'
      ? 'Google Sign-In'
      : 'Email & Password';

  const stats = overview?.stats || {
    totalOrders: 0,
    totalSpent: 0,
    activeShipments: 0,
    activeConversations: 0,
    openSupportTickets: 0,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Customer Account & Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Account details, delivery preferences, and marketplace activity.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>

      {savedNotice && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {savedNotice}
        </div>
      )}

      {errorNotice && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          {errorNotice}
        </div>
      )}

      {/* Firebase Identity Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <img
                src={
                  user.photoURL ||
                  `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.displayName || user.email)}`
                }
                alt={user.displayName}
                className="h-20 w-20 rounded-full object-cover border-2 border-brand-200 bg-slate-100"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                title="Upload profile photo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-brand-600 text-white shadow hover:bg-brand-700 transition-colors disabled:opacity-60"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">{user.displayName}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 capitalize">
                  <Sparkles className="h-3 w-3" /> {user.role.replace('_', ' ')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  <ShieldCheck className="h-3 w-3" /> {providerLabel}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> {user.email}
                </span>
                {user.phoneNumber && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {user.phoneNumber}
                  </span>
                )}
                {(user.city || user.country) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {[user.city, user.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                  <Fingerprint className="h-3 w-3 text-slate-500" />
                  Account ID: {user.firebaseUid || user.uid}
                </span>
                {user.createdAt && <span>Member since {formatDate(user.createdAt)}</span>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs space-y-1 shrink-0">
            <p className="font-bold text-slate-700">Seller Visibility Notice</p>
            <p className="text-[11px] text-slate-500 max-w-[240px]">
              Sellers you message or order from can view your name, contact info, language, and shipping address for fulfillment.
            </p>
          </div>
        </div>
      </div>

      {/* Live Customer Activity Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Orders</span>
            <ShoppingBag className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {isLoadingOverview ? '...' : stats.totalOrders}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.activeShipments} in transit</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Lifetime Spend</span>
            <Package className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {isLoadingOverview ? '...' : formatCurrency(stats.totalSpent)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across verified purchases</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Seller Chats</span>
            <MessageSquare className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {isLoadingOverview ? '...' : stats.activeConversations}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active Nexconn threads</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Support Tickets</span>
            <Headphones className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {isLoadingOverview ? '...' : stats.openSupportTickets}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Open dispatch requests</p>
        </div>
      </div>

      {/* Main Two-Column Profile & Address Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Personal Info Form */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 h-fit"
        >
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-brand-600" />
            Personal Information
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Account Email (Verified Identity)
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-1">
              <Globe className="h-3.5 w-3.5 text-brand-600" />
              Preferred Chat Language
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none"
            >
              {SUPPORTED_CHAT_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            {isSavingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save & Sync Account
          </button>
        </form>

        {/* Address Book */}
        <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" />
              Delivery Address Book ({user.addresses?.length || 0})
            </h3>
            <button
              type="button"
              onClick={() => setShowAddAddress((v) => !v)}
              className="inline-flex items-center gap-1 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Address
            </button>
          </div>

          {showAddAddress && (
            <form
              onSubmit={handleAddAddress}
              className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Recipient Full Name"
                  value={newAddress.fullName}
                  onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="Contact Phone Number"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Street Address, Apt / Suite"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="sm:col-span-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="State / Province"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Postal / ZIP Code"
                  value={newAddress.postalCode}
                  onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Country"
                  value={newAddress.country}
                  onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={!!newAddress.isDefault}
                  onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Set as default delivery address
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {isSavingAddress && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {user.addresses?.length ? (
              user.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`rounded-2xl border p-4 text-xs flex flex-col justify-between gap-3 ${
                    addr.isDefault ? 'border-brand-300 bg-brand-50/30' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-900">{addr.fullName}</span>
                      {addr.isDefault && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600">{addr.street}</p>
                    <p className="text-slate-600">
                      {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      {addr.country} {addr.phone ? `• ${addr.phone}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    {!addr.isDefault ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-[11px] font-bold text-brand-600 hover:underline"
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-600">Primary Shipping</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="sm:col-span-2 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                No saved shipping addresses yet. Add one above so checkout and sellers have your verified delivery details.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RSA-2048 Asymmetric E2EE Key Vault */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                RSA-2048 Asymmetric E2EE Keypair
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  {rsaInfo?.hasPrivateKey ? 'Private Key Active on Device' : 'Initializing...'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Messages and support tickets sent to you are encrypted with your RSA-2048 Public Key and decrypt strictly using your local RSA Private Key.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPemModal((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            {showPemModal ? 'Hide PEM Keys' : 'Inspect / Backup PEM Keys'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs">
          <div>
            <span className="font-bold text-slate-500 uppercase text-[10px] block">
              Public Key Fingerprint (SHA-256)
            </span>
            <span className="font-mono font-bold text-slate-900">
              {rsaInfo?.fingerprint || user.rsaKeyFingerprint || 'Pending generation...'}
            </span>
          </div>
          <div className="ml-auto text-[11px] text-slate-500">
            Algorithm: <span className="font-semibold text-slate-800">RSA-OAEP (2048-bit, SHA-256)</span>
          </div>
        </div>

        {showPemModal && (() => {
          const bundle = exportLocalRsaKeyBundle(user.uid);
          if (!bundle) return null;
          const copyKey = (label: string, val: string) => {
            void navigator.clipboard?.writeText(val);
            setCopiedKeyField(label);
            setTimeout(() => setCopiedKeyField(null), 1800);
          };
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Your Public Key (Shared with Senders)</span>
                  <button
                    type="button"
                    onClick={() => copyKey('pub', bundle.publicKeyPem)}
                    className="text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    {copiedKeyField === 'pub' ? 'Copied!' : 'Copy Public PEM'}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={5}
                  value={bundle.publicKeyPem}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono text-[10px] text-slate-700"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-700">Your Private Key (Never Leaves Device)</span>
                  <button
                    type="button"
                    onClick={() => copyKey('priv', bundle.privateKeyPem)}
                    className="text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    {copiedKeyField === 'priv' ? 'Copied!' : 'Copy Private PEM'}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={5}
                  value={bundle.privateKeyPem}
                  className="w-full rounded-xl border border-rose-200 bg-rose-50/40 p-2.5 font-mono text-[10px] text-slate-700"
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Live Orders, Chats, and Support Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-brand-600" />
              Recent Orders
            </h3>
            <Link to="/shop/orders" className="text-[11px] font-bold text-brand-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-2.5 flex-1">
            {overview?.recentOrders?.length ? (
              overview.recentOrders.map((order) => (
                <Link
                  key={order.orderId}
                  to="/shop/orders"
                  className="block rounded-2xl border border-slate-100 p-3 hover:border-brand-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900">{order.orderId}</span>
                    <span className="font-black text-emerald-600">{formatCurrency(order.total)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="capitalize">{order.orderStatus}</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No orders placed yet.</p>
            )}
          </div>
        </div>

        {/* Recent Seller Chats */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-600" />
              Active Seller Chats
            </h3>
          </div>
          <div className="space-y-2.5 flex-1">
            {overview?.conversations?.length ? (
              overview.conversations.map((conv) => (
                <button
                  key={conv.conversationId}
                  type="button"
                  onClick={() => void selectConversation(conv.conversationId, true)}
                  className="w-full text-left rounded-2xl border border-slate-100 p-3 hover:border-indigo-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate">
                      {conv.vendorBusinessName || 'Seller Store'}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                      {conv.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 truncate">
                    {conv.lastMessage?.text || conv.productTitle || 'Open conversation'}
                  </p>
                </button>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No conversations started yet.</p>
            )}
          </div>
        </div>

        {/* Support Tickets */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Headphones className="h-4 w-4 text-amber-600" />
              Support Tickets
            </h3>
            <Link to="/shop/support" className="text-[11px] font-bold text-brand-600 hover:underline">
              Support Hub
            </Link>
          </div>
          <div className="space-y-2.5 flex-1">
            {overview?.supportTickets?.length ? (
              overview.supportTickets.map((tkt) => (
                <Link
                  key={tkt.ticketId}
                  to="/shop/support"
                  className="block rounded-2xl border border-slate-100 p-3 hover:border-amber-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-bold text-slate-900 truncate">{tkt.subject}</span>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 capitalize shrink-0">
                      {tkt.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Ticket {tkt.ticketId} • Priority: <span className="uppercase font-semibold">{tkt.priority}</span>
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No support tickets filed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
