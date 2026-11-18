import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Store,
  Headphones,
  Shield,
  LogOut,
  Package,
  Heart,
  MessageSquare,
  ShoppingBag,
  Search,
  ChevronDown,
  X,
  Menu,
  ArrowRight,
  Compass,
  BookOpen,
  Info,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCartStore } from '../../stores/useCartStore';
import { useWishlistStore } from '../../stores/useWishlistStore';
import { useChatStore } from '../../stores/useChatStore';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { toggleDrawer, unreadTotal } = useChatStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
    setShowSearch(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: 'Explore', href: '/shop/products', icon: Compass },
    { label: 'About Us', href: '/shop/about', icon: Info },
    { label: 'Blog', href: '/shop/blog', icon: BookOpen },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setShowSearch(false);
    setIsMobileMenuOpen(false);
    if (q) {
      navigate(`/shop/products?search=${encodeURIComponent(q)}`);
    } else {
      navigate('/shop/products');
    }
  };

  return (
    <header className="w-full bg-[#ECEAE4] text-[#171717] z-40 relative">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="flex h-16 sm:h-[68px] items-center justify-between gap-2">
          {/* Left: "artisanale" serif wordmark */}
          <Link
            to="/shop"
            className="text-[21px] sm:text-[23px] font-normal text-[#171717] tracking-[-0.01em] origin-left scale-x-[1.08] hover:opacity-80 transition-opacity select-none shrink-0"
            style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
          >
            artisanale
          </Link>

          {/* Center: Minimalist desktop navigation links */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-11" aria-label="Main Navigation">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-[12.5px] font-normal text-[#222222] hover:text-black transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: Actions, Search, Icons, Cart, Account & Mobile Hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-5 text-[12.5px] font-normal text-[#222222]">
            {/* Desktop / Tablet Expandable Search */}
            <div className="hidden sm:block">
              {showSearch ? (
                <form onSubmit={handleSearch} className="flex items-center border-b border-[#171717] pb-0.5">
                  <Search className="h-3.5 w-3.5 text-[#171717] stroke-[1.6] mr-1.5 shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-28 sm:w-40 bg-transparent text-[12px] text-[#171717] placeholder:text-[#78756E] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSearch(false)}
                    className="text-[#78756E] hover:text-[#171717] ml-1 cursor-pointer p-1"
                    aria-label="Close search"
                  >
                    <X className="h-3.5 w-3.5 stroke-[1.6]" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="hover:text-black transition-colors cursor-pointer p-1.5"
                  title="Search"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4 stroke-[1.6]" />
                </button>
              )}
            </div>

            {/* Minimal Wishlist Icon (hidden on tiny mobile <360px, available in mobile menu) */}
            <Link
              to="/shop/wishlist"
              className="relative hover:text-black transition-colors p-1.5 hidden xs:inline-flex items-center justify-center min-h-[36px] min-w-[36px]"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="h-4 w-4 stroke-[1.6]" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#171717] px-1 text-[9px] font-medium text-white">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Minimal Messages Icon */}
            <button
              onClick={() => toggleDrawer()}
              className="relative hover:text-black transition-colors cursor-pointer p-1.5 inline-flex items-center justify-center min-h-[36px] min-w-[36px]"
              title="Messages"
              aria-label="Messages"
            >
              <MessageSquare className="h-4 w-4 stroke-[1.6]" />
              {unreadTotal > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#171717] px-1 text-[9px] font-medium text-white">
                  {unreadTotal}
                </span>
              )}
            </button>

            {/* Cart with Minimal Bag Icon */}
            <Link
              to="/shop/cart"
              className="inline-flex items-center gap-1.5 hover:text-black transition-colors whitespace-nowrap p-1.5"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="h-4 w-4 stroke-[1.6]" />
                {itemCount > 0 && (
                  <span className="md:hidden absolute -top-1 -right-1 flex h-3 min-w-[12px] items-center justify-center rounded-full bg-[#171717] px-0.5 text-[8px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline">Cart ({itemCount})</span>
            </Link>

            {/* Desktop User / Login */}
            <div className="hidden md:block">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu((v) => !v)}
                    className="inline-flex items-center gap-1.5 hover:text-black transition-colors cursor-pointer whitespace-nowrap py-1 px-1.5"
                    aria-expanded={showUserMenu}
                  >
                    <User className="h-4 w-4 stroke-[1.6]" />
                    <span>{user.displayName ? user.displayName.split(' ')[0] : 'Account'}</span>
                    <ChevronDown className="h-3 w-3 stroke-[1.6] text-[#686359]" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-52 rounded-xl border border-[#D8D4CA] bg-[#FAF8F3] p-1.5 shadow-lg z-50 text-xs text-[#171717]">
                      <div className="px-3 py-2 border-b border-[#E4DEC8] mb-1">
                        <p className="font-semibold text-[#171717] truncate">{user.displayName}</p>
                        <p className="text-[11px] text-[#78756E] truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/shop/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-white"
                      >
                        <User className="h-3.5 w-3.5 text-[#D6B875]" /> Profile
                      </Link>
                      <Link
                        to="/shop/orders"
                        onClick={() => setShowUserMenu(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-white"
                      >
                        <Package className="h-3.5 w-3.5 text-[#D6B875]" /> Orders
                      </Link>
                      <Link
                        to="/shop/wishlist"
                        onClick={() => setShowUserMenu(false)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-white"
                      >
                        <Heart className="h-3.5 w-3.5 text-[#D6B875]" /> Wishlist ({wishlistItems.length})
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          toggleDrawer();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-white cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-[#D6B875]" /> Messages
                        {unreadTotal > 0 && (
                          <span className="ml-auto rounded-full bg-[#171717] px-1.5 py-0.5 text-[10px] text-white">
                            {unreadTotal}
                          </span>
                        )}
                      </button>
                      {user.role === 'vendor' && (
                        <Link
                          to="/vendor"
                          onClick={() => setShowUserMenu(false)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-white font-semibold text-[#171717]"
                        >
                          <Store className="h-3.5 w-3.5 text-[#D6B875]" /> Seller Studio
                        </Link>
                      )}
                      {user.role === 'support_agent' && (
                        <Link
                          to="/support"
                          onClick={() => setShowUserMenu(false)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-white font-semibold text-[#171717]"
                        >
                          <Headphones className="h-3.5 w-3.5 text-[#D6B875]" /> Support Center
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-white font-semibold text-[#171717]"
                        >
                          <Shield className="h-3.5 w-3.5 text-[#D6B875]" /> Admin Console
                        </Link>
                      )}
                      <div className="my-1 border-t border-[#E4DEC8]" />
                      <button
                        onClick={async () => {
                          setShowUserMenu(false);
                          await logout();
                          navigate('/auth');
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1.5 hover:text-black transition-colors whitespace-nowrap py-1 px-1.5"
                >
                  <User className="h-4 w-4 stroke-[1.6]" />
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Menu Toggle Button (<md) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl text-[#171717] hover:bg-[#DED9CC]/60 transition-colors cursor-pointer"
              aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 stroke-[1.8]" />
              ) : (
                <Menu className="h-5 w-5 stroke-[1.8]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE SLIDE-OUT NAVIGATION DRAWER (<md) ────────────────── */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Pane */}
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[320px] xs:max-w-[340px] flex-col bg-[#FAF8F3] text-[#171717] shadow-2xl border-l border-[#E4DEC8] md:hidden animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="flex h-16 items-center justify-between px-5 border-b border-[#E4DEC8] bg-[#ECEAE4]">
              <Link
                to="/shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[22px] font-normal text-[#171717] tracking-tight origin-left scale-x-[1.08]"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
              >
                artisanale
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#686359] hover:bg-[#DED9CC]/60 hover:text-[#171717] transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 stroke-[1.8]" />
              </button>
            </div>

            {/* Search in Drawer */}
            <div className="p-4 border-b border-[#E4DEC8] bg-white">
              <form onSubmit={handleSearch} className="flex items-center rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] px-3 py-2">
                <Search className="h-4 w-4 text-[#8C867A] shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Search 50 creations, studios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#171717] placeholder:text-[#8C867A] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[#8C867A] hover:text-[#171717] ml-1 p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </form>
            </div>

            {/* Drawer Body Nav Links */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              {/* Primary Pages */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C867A] px-2 mb-2 block">
                  Marketplace
                </span>
                <nav className="space-y-1">
                  {navLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#171717] hover:bg-white transition-colors"
                      >
                        <Icon className="h-4 w-4 text-[#D6B875] shrink-0" />
                        <span>{item.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#C2BFB8] ml-auto" />
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Collector Quick Links */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C867A] px-2 mb-2 block">
                  Collector Hub
                </span>
                <div className="space-y-1">
                  <Link
                    to="/shop/cart"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#171717] hover:bg-white transition-colors"
                  >
                    <ShoppingBag className="h-4 w-4 text-[#D6B875] shrink-0" />
                    <span>Shopping Cart</span>
                    <span className="ml-auto rounded-full bg-[#171717] px-2 py-0.5 text-xs font-bold text-white">
                      {itemCount}
                    </span>
                  </Link>

                  <Link
                    to="/shop/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#171717] hover:bg-white transition-colors"
                  >
                    <Heart className="h-4 w-4 text-[#D6B875] shrink-0" />
                    <span>Saved Wishlist</span>
                    {wishlistItems.length > 0 && (
                      <span className="ml-auto rounded-full bg-[#171717] px-2 py-0.5 text-xs font-bold text-white">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Link>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      toggleDrawer(true);
                    }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#171717] hover:bg-white transition-colors cursor-pointer text-left"
                  >
                    <MessageSquare className="h-4 w-4 text-[#D6B875] shrink-0" />
                    <span>Artisan Messages</span>
                    {unreadTotal > 0 && (
                      <span className="ml-auto rounded-full bg-[#171717] px-2 py-0.5 text-xs font-bold text-white">
                        {unreadTotal}
                      </span>
                    )}
                  </button>

                  <Link
                    to="/shop/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#171717] hover:bg-white transition-colors"
                  >
                    <Package className="h-4 w-4 text-[#D6B875] shrink-0" />
                    <span>Track Orders</span>
                  </Link>
                </div>
              </div>

              {/* Portal Roles (Vendor / Support / Admin) */}
              {user && (user.role === 'vendor' || user.role === 'support_agent' || user.role === 'admin') && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C867A] px-2 mb-2 block">
                    Specialist Portals
                  </span>
                  <div className="space-y-1">
                    {user.role === 'vendor' && (
                      <Link
                        to="/vendor"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#171717] bg-[#ECEAE4] hover:bg-white transition-colors"
                      >
                        <Store className="h-4 w-4 text-[#D6B875] shrink-0" />
                        <span>Seller Studio</span>
                      </Link>
                    )}
                    {user.role === 'support_agent' && (
                      <Link
                        to="/support"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#171717] bg-[#ECEAE4] hover:bg-white transition-colors"
                      >
                        <Headphones className="h-4 w-4 text-[#D6B875] shrink-0" />
                        <span>Support Center</span>
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#171717] bg-[#ECEAE4] hover:bg-white transition-colors"
                      >
                        <Shield className="h-4 w-4 text-[#D6B875] shrink-0" />
                        <span>Admin Console</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Account Area */}
            <div className="p-4 border-t border-[#E4DEC8] bg-[#FAF8F3] pb-safe">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#171717] text-[#D6B875] font-bold text-sm shrink-0">
                      {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#171717] truncate">{user.displayName}</p>
                      <p className="text-[11px] text-[#78756E] truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to="/shop/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 rounded-xl border border-[#E4DEC8] bg-white py-2 text-center text-xs font-semibold text-[#171717] hover:bg-[#FAF8F3]"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        await logout();
                        navigate('/auth');
                      }}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] py-3 text-xs font-bold text-[#D6B875] hover:bg-black transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Sign In / Create Account</span>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
