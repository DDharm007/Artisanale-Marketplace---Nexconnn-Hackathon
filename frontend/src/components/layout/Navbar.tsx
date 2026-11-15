import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  MessageSquare,
  User,
  Shield,
  Store,
  Headphones,
  LogOut,
  ChevronDown,
  Globe,
  Package,
  X,
  MapPin,
  Check,
  Database,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCartStore } from '../../stores/useCartStore';
import { useWishlistStore } from '../../stores/useWishlistStore';
import { useChatStore } from '../../stores/useChatStore';
import { usePreferencesStore, SUPPORTED_CURRENCIES, PRESET_LOCATIONS } from '../../stores/usePreferencesStore';
import { UserRole, DEFAULT_CATEGORIES } from '@convocart/shared';
import { cn } from '../../lib/utils';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const locationPath = useLocation().pathname;
  const { user, logout, switchDemoRole } = useAuthStore();
  const { itemCount } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { toggleDrawer, unreadTotal } = useChatStore();
  const { currency, setCurrency, location, setLocation } = usePreferencesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/shop/products?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/shop/products');
    }
  };

  const handleRoleSelect = async (role: UserRole, emailOverride?: string) => {
    setShowRoleMenu(false);
    await switchDemoRole(role, emailOverride);
    if (role === 'vendor') navigate('/vendor');
    else if (role === 'support_agent') navigate('/support');
    else if (role === 'admin') navigate('/admin');
    else navigate('/shop');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md text-zinc-100">
      {/* Top Main Navigation Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Left: Brand Logo & Location */}
        <div className="flex items-center gap-6">
          <Link to="/shop" className="flex items-center gap-2 shrink-0 py-0.5">
            <img src="/logo.png" alt="ConvoCart" className="h-10 sm:h-12 w-auto object-contain brightness-110 hover:opacity-90 transition-opacity" />
          </Link>

          {/* Quick Location Pill */}
          <button
            onClick={() => setShowLocationModal(true)}
            className="hidden lg:flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <MapPin className="h-3.5 w-3.5 text-zinc-500" />
            <span>Deliver to <strong className="text-zinc-200 font-medium">{location.city}</strong></span>
          </button>
        </div>

        {/* Center: Minimalist Dark Search Bar */}
        <form onSubmit={handleSearch} className="relative flex-1 max-w-lg hidden sm:block">
          <input
            type="text"
            placeholder="Search audio, mechanical keyboards, global imports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-zinc-800 bg-zinc-900/90 pl-10 pr-9 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-950 focus:border-zinc-700 focus:outline-none transition-all shadow-inner"
          />
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        {/* Right: Actions, Currency, Roles, Cart & Chat */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Currency Pill */}
          <div className="relative">
            <button
              onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
              className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <span>{currency.flag}</span>
              <span className="font-semibold">{currency.code}</span>
              <ChevronDown className="h-3 w-3 text-zinc-500" />
            </button>

            {showCurrencyMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-zinc-800 bg-[#121215] p-1.5 shadow-2xl z-50 text-xs">
                {SUPPORTED_CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCurrency(c.code);
                      setShowCurrencyMenu(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-zinc-300 hover:bg-zinc-800',
                      currency.code === c.code && 'bg-zinc-800 font-bold text-white'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span>{c.label}</span>
                    </span>
                    {currency.code === c.code && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Account Status / Dynamic Auth Actions */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700/80 px-3 py-1 text-xs font-medium hover:bg-zinc-700 hover:text-white transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="capitalize">{user.role.replace('_', ' ')}</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-[#121215] p-1.5 shadow-2xl z-50 text-xs">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Active Account
                  </div>
                  <div className="px-2.5 pb-2 mb-1 border-b border-zinc-800">
                    <p className="font-bold text-white truncate">{user.displayName}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/shop/profile"
                    onClick={() => setShowRoleMenu(false)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-zinc-200 hover:bg-zinc-800"
                  >
                    <User className="h-4 w-4 text-emerald-400" /> My Profile &amp; Addresses
                  </Link>
                  {user.role === 'vendor' && (
                    <Link
                      to="/vendor"
                      onClick={() => setShowRoleMenu(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-amber-300 hover:bg-zinc-800"
                    >
                      <Store className="h-4 w-4 text-amber-400" /> My Seller Studio
                    </Link>
                  )}
                  {user.role === 'support_agent' && (
                    <Link
                      to="/support"
                      onClick={() => setShowRoleMenu(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-sky-300 hover:bg-zinc-800"
                    >
                      <Headphones className="h-4 w-4 text-sky-400" /> Dispatch Center
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setShowRoleMenu(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-purple-300 hover:bg-zinc-800"
                    >
                      <Shield className="h-4 w-4 text-purple-400" /> Admin Console
                    </Link>
                  )}
                  <Link
                    to="/auth"
                    onClick={async (e) => {
                      e.preventDefault();
                      setShowRoleMenu(false);
                      await logout();
                      navigate('/auth');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-zinc-300 hover:bg-zinc-800"
                  >
                    <Shield className="h-4 w-4 text-zinc-400" /> Switch Account / Portal
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              <span>Sign In / Join</span>
            </Link>
          )}

          {/* Orders Link */}
          <Link
            to="/shop/orders"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white px-2 py-1 transition-colors"
          >
            <Package className="h-4 w-4 text-zinc-500" />
            <span>Orders</span>
          </Link>

          {/* Nexconn Support Hub Link */}
          <Link
            to="/shop/support"
            className={cn(
              'hidden md:flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs font-medium transition-colors',
              locationPath === '/shop/support'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            )}
          >
            <Headphones className="h-3.5 w-3.5 text-emerald-400" />
            <span>Support Hub</span>
          </Link>

          {/* Wishlist */}
          <Link
            to="/shop/wishlist"
            className="relative rounded-full p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Saved Items"
          >
            <Heart className="h-4 w-4" />
            {wishlistItems.length > 0 && (
              <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {/* Messages Drawer Pill */}
          <button
            onClick={() => toggleDrawer()}
            className="relative flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Messages"
          >
            <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden md:inline">Messages</span>
            {unreadTotal > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
                {unreadTotal}
              </span>
            )}
          </button>

          {/* Shopping Cart Pill */}
          <Link
            to="/shop/cart"
            className="flex items-center gap-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 px-3 py-1 text-xs font-semibold text-white transition-colors"
            title="Cart"
          >
            <ShoppingCart className="h-3.5 w-3.5 text-zinc-300" />
            <span>{itemCount}</span>
          </Link>

          {/* User Profile Avatar */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center rounded-full p-0.5 hover:ring-2 hover:ring-zinc-600 transition-all"
              >
                <img
                  src={
                    user.photoURL ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName)}`
                  }
                  alt={user.displayName}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-zinc-700"
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-[#121215] p-1.5 shadow-2xl z-50 text-xs">
                  <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                    <p className="font-bold text-white truncate">{user.displayName}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/shop/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <User className="h-4 w-4 text-emerald-400" /> Account Profile
                  </Link>
                  <Link
                    to="/shop/orders"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    <Package className="h-4 w-4 text-amber-400" /> Orders &amp; Tracking
                  </Link>

                  <div className="my-1 border-t border-zinc-800" />

                  <Link
                    to={user.role === 'vendor' ? '/vendor' : '/shop/support'}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  >
                    {user.role === 'vendor' ? (
                      <>
                        <Store className="h-4 w-4 text-amber-400" /> Seller Dashboard
                      </>
                    ) : (
                      <>
                        <Headphones className="h-4 w-4 text-blue-400" /> Customer Support
                      </>
                    )}
                  </Link>

                  <div className="my-1 border-t border-zinc-800" />

                  <button
                    onClick={async () => {
                      setShowUserMenu(false);
                      await logout();
                      navigate('/auth');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-rose-400 hover:bg-rose-950/40 font-medium"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Chips Sub-Navigation (Dark & Minimal) */}
      <div className="border-t border-zinc-800/80 bg-[#09090b] px-4 py-2 text-xs">
        <div className="mx-auto max-w-7xl flex items-center gap-6 overflow-x-auto scrollbar-none whitespace-nowrap">
          <Link
            to="/shop/products"
            className={cn(
              'font-medium transition-colors hover:text-white',
              locationPath === '/shop/products' ? 'text-white font-bold' : 'text-zinc-400'
            )}
          >
            All Products
          </Link>

          {DEFAULT_CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={`/shop/products?categoryId=${c.id}`}
              className="text-zinc-400 hover:text-white font-medium transition-colors"
            >
              {c.name}
            </Link>
          ))}

          <Link
            to="/shop/products?categoryId=cat-global"
            className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Ubuy Global Store</span>
          </Link>

          <Link
            to="/shop/support"
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            <Headphones className="h-3.5 w-3.5" />
            <span>Support & KB</span>
          </Link>

          <span
            className="ml-auto hidden lg:inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/70 px-2.5 py-0.5 text-[10px] text-amber-300 font-medium"
            title="Real-time Cloud Sync & Nexconn Chat + Call"
          >
            <Database className="h-3 w-3" />
            <span>Live Cloud Sync · Nexconn Chat &amp; Call</span>
          </span>
        </div>
      </div>

      {/* Minimal Location Selector Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#121215] p-5 shadow-2xl text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <h3 className="font-bold text-sm">Select Delivery City</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {PRESET_LOCATIONS.map((loc) => (
                <button
                  key={loc.postalCode}
                  onClick={() => {
                    setLocation(loc);
                    setShowLocationModal(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors',
                    location.postalCode === loc.postalCode
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'hover:bg-zinc-800/60 text-zinc-300'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span>{loc.flag}</span>
                    <span>{loc.city}, {loc.country}</span>
                  </span>
                  {location.postalCode === loc.postalCode && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
