import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Phone,
  Globe,
  MapPin,
  Store,
  ShieldCheck,
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Headphones,
  Shield,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';
import { SUPPORTED_CHAT_LANGUAGES, UserRole } from '@convocart/shared';
import { AccountPrefill, useAuthStore } from '../stores/useAuthStore';
import { cn } from '../lib/utils';

interface PendingOnboardingState {
  isNewAccount: boolean;
  prefill: AccountPrefill;
}

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login, loginWithGoogle, completeOnboarding, register, logout, switchDemoRole } =
    useAuthStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'consumer' | 'vendor'>('consumer');
  const [displayName, setDisplayName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');

  const [notFoundEmail, setNotFoundEmail] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState<PendingOnboardingState | null>(null);
  const [infoBanner, setInfoBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPortalTools, setShowPortalTools] = useState(false);

  useEffect(() => {
    if (user) {
      const redirect = searchParams.get('redirect');
      if (redirect && redirect.startsWith('/')) {
        navigate(redirect);
        return;
      }
      if (user.role === 'vendor') navigate('/vendor');
      else if (user.role === 'support_agent') navigate('/support');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/shop/profile');
    }
  }, [user, navigate, searchParams]);

  const applyPrefill = (prefill: AccountPrefill) => {
    const addr = prefill.addresses?.[0];
    setEmail(prefill.email || '');
    setDisplayName(prefill.displayName || '');
    setPhoneNumber(prefill.phoneNumber || '');
    setPreferredLanguage(prefill.preferredLanguage || 'en');
    setRole(prefill.role === 'vendor' ? 'vendor' : 'consumer');
    setBusinessName(prefill.businessName || '');
    setStreet(addr?.street || '');
    setCity(addr?.city || '');
    setStateRegion(addr?.state || '');
    setPostalCode(addr?.postalCode || '');
    setCountry(addr?.country || 'India');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoBanner('');
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await login(email, password);
        if (res.status === 'ACCOUNT_NOT_FOUND') {
          setNotFoundEmail(res.email);
        } else if (res.status === 'NEEDS_ONBOARDING') {
          applyPrefill(res.prefill);
          setOnboarding({ isNewAccount: res.isNewAccount, prefill: res.prefill });
        }
      } else {
        await register({
          email,
          password,
          displayName,
          role,
          businessName: role === 'vendor' ? businessName : undefined,
          phoneNumber: phoneNumber.trim(),
          preferredLanguage,
          address: {
            fullName: displayName.trim(),
            phone: phoneNumber.trim(),
            street: street.trim(),
            city: city.trim(),
            state: stateRegion.trim(),
            postalCode: postalCode.trim(),
            country: country.trim(),
          },
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setInfoBanner('');
    setNotFoundEmail(null);
    setSubmitting(true);
    try {
      const res = await loginWithGoogle(mode);
      if (res.status === 'NEEDS_ONBOARDING') {
        applyPrefill(res.prefill);
        setOnboarding({ isNewAccount: res.isNewAccount, prefill: res.prefill });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboarding) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      await completeOnboarding({
        firebaseUid: onboarding.prefill.firebaseUid,
        email: onboarding.prefill.email,
        displayName: displayName.trim(),
        role,
        businessName: role === 'vendor' ? businessName.trim() : undefined,
        phoneNumber: phoneNumber.trim(),
        preferredLanguage,
        photoURL: onboarding.prefill.photoURL,
        authProvider: onboarding.prefill.authProvider,
        emailVerified: onboarding.prefill.emailVerified,
        address: {
          fullName: displayName.trim(),
          phone: phoneNumber.trim(),
          street: street.trim(),
          city: city.trim(),
          state: stateRegion.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
        },
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete your profile details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOnboarding = async () => {
    setOnboarding(null);
    setErrorMsg('');
    setInfoBanner('');
    await logout();
  };

  const handleChooseNotFoundRole = (chosenRole: 'consumer' | 'vendor') => {
    setRole(chosenRole);
    setMode('signup');
    setNotFoundEmail(null);
    setErrorMsg('');
    setInfoBanner(
      chosenRole === 'vendor'
        ? `Creating your Seller Store account for ${email}. Complete your essential store and contact details below.`
        : `Creating your Customer account for ${email}. Complete your essential contact and delivery details below.`
    );
  };

  const handlePortalSwitch = async (targetRole: UserRole, emailOverride?: string) => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await switchDemoRole(targetRole, emailOverride);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not switch portal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Brand & Account Security Overview */}
        <div className="lg:col-span-5 space-y-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-7 text-white shadow-xl border border-slate-800">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Encrypted Cloud Sync &amp; Verified Accounts
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Dynamic Account Identity for Buyers &amp; Sellers
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sign in or create your live ConvoCart account. Your customer contact details, language preferences, and delivery addresses are securely stored and automatically shared with sellers when you chat or place orders.
          </p>

          <div className="space-y-3 pt-2 text-xs text-slate-200">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              <span>Verified account ID &amp; real-time profile syncing across Customer Profile, Orders, and Chat</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Store className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Sellers see essential fulfillment info (name, email, phone, delivery city/address, order history &amp; language)</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Globe className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Multi-language Nexconn Chat SDK &amp; Call SDK personalized to your account language</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <Link
              to="/shop/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-sky-200"
            >
              Browse Marketplace as Guest <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Dynamic Sign In / Onboarding / Sign Up Card */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {onboarding ? (
            /* UNIFIED GOOGLE / PARTIAL PROFILE COMPLETION FLOW */
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCancelOnboarding}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Use a different account
                </button>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {onboarding.prefill.authProvider === 'google'
                    ? 'Google Profile Autofilled'
                    : 'Account Connected'}
                </span>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                {onboarding.prefill.photoURL ? (
                  <img
                    src={onboarding.prefill.photoURL}
                    alt={onboarding.prefill.displayName || onboarding.prefill.email}
                    className="h-11 w-11 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold shrink-0">
                    {(onboarding.prefill.displayName || onboarding.prefill.email)[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">
                    {onboarding.isNewAccount
                      ? 'Complete Your New Account Setup'
                      : 'Complete Essential Profile Details'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{onboarding.prefill.email}</p>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCompleteOnboarding} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Select Account Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole('consumer')}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition-all',
                        role === 'consumer'
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <User className="h-4 w-4" /> Customer (Buyer)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('vendor')}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition-all',
                        role === 'vendor'
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <Store className="h-4 w-4" /> Seller Store
                    </button>
                  </div>
                </div>

                {role === 'vendor' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Store / Business Name *
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Nova Tech Store"
                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 pl-9 pr-3 py-2 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 pl-9 pr-3 py-2 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91-98765-43210"
                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 pl-9 pr-3 py-2 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Preferred Chat Language
                    </label>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 font-medium focus:border-brand-500 focus:outline-none"
                    >
                      {SUPPORTED_CHAT_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.nativeName} ({l.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="India / United States"
                      className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-brand-600" />
                    {role === 'vendor'
                      ? 'Business / Dispatch Address *'
                      : 'Delivery Address * (Visible to sellers on orders & support)'}
                  </div>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Street Address (e.g. 42 MG Road) *"
                    className="w-full rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-1.5 focus:border-brand-500 focus:outline-none"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City *"
                      className="rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-1.5 focus:border-brand-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      placeholder="State"
                      className="rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-1.5 focus:border-brand-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="PIN / ZIP"
                      className="rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-1.5 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {role === 'vendor'
                    ? 'Complete Profile & Launch Seller Store'
                    : 'Complete Profile & Start Shopping'}
                </button>
              </form>
            </div>
          ) : notFoundEmail ? (
            /* ACCOUNT NOT FOUND PROMPT -> CHOOSE SELLER VS CONSUMER FIRST */
            <div className="space-y-5">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <UserPlus className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-black text-slate-900">
                      No account found for {notFoundEmail}
                    </h2>
                    <p className="mt-1 text-xs text-slate-600">
                      Would you like to create a new account with this email and password? First choose your account type:
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => handleChooseNotFoundRole('consumer')}
                  className="flex flex-col items-start gap-2 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left hover:border-brand-600 hover:bg-brand-50/40 transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Create Customer Account</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Buy products, track deliveries, save addresses, and chat with verified sellers.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 mt-1">
                    Continue as Customer <ArrowRight className="h-3 w-3" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChooseNotFoundRole('vendor')}
                  className="flex flex-col items-start gap-2 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left hover:border-emerald-600 hover:bg-emerald-50/40 transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Create Seller Account</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Launch your store, view customer CRM &amp; orders, and reply in live translated chats.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                    Continue as Seller <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNotFoundEmail(null);
                  setErrorMsg('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </button>
            </div>
          ) : (
            /* STANDARD SIGN IN / CREATE DYNAMIC ACCOUNT TABS */
            <>
              <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg('');
                    setInfoBanner('');
                  }}
                  className={cn(
                    'flex-1 rounded-xl py-2 text-xs font-bold transition-all',
                    mode === 'signin'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                    setInfoBanner('');
                  }}
                  className={cn(
                    'flex-1 rounded-xl py-2 text-xs font-bold transition-all',
                    mode === 'signup'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  Create Dynamic Account
                </button>
              </div>

              {infoBanner && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800">
                  {infoBanner}
                </div>
              )}

              {errorMsg && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Account Type *</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setRole('consumer')}
                          className={cn(
                            'flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition-all',
                            role === 'consumer'
                              ? 'border-brand-600 bg-brand-50 text-brand-700'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          <User className="h-4 w-4" /> Customer (Buyer)
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('vendor')}
                          className={cn(
                            'flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition-all',
                            role === 'vendor'
                              ? 'border-brand-600 bg-brand-50 text-brand-700'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          <Store className="h-4 w-4" /> Seller Store
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g. Dharm Patel"
                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 pl-9 pr-3 py-2 focus:border-brand-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="tel"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+91-98765-43210"
                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 pl-9 pr-3 py-2 focus:border-brand-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {role === 'vendor' && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Store / Business Name *
                        </label>
                        <div className="relative">
                          <Store className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="e.g. Nova Tech Store"
                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 pl-9 pr-3 py-2 focus:border-brand-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 pl-9 pr-3 py-2 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 pl-9 pr-3 py-2 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {mode === 'signup' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Preferred Chat Language
                        </label>
                        <select
                          value={preferredLanguage}
                          onChange={(e) => setPreferredLanguage(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2 font-medium focus:border-brand-500 focus:outline-none"
                        >
                          {SUPPORTED_CHAT_LANGUAGES.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.flag} {l.nativeName} ({l.name})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Country *</label>
                        <input
                          type="text"
                          required
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="India / United States"
                          className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-brand-600" />
                        {role === 'vendor'
                          ? 'Business / Dispatch Address *'
                          : 'Delivery / Billing Address * (Visible to sellers on orders & support)'}
                      </div>
                      <input
                        type="text"
                        required
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Street Address (e.g. 42 MG Road) *"
                        className="w-full rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-1.5 focus:border-brand-500 focus:outline-none"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City *"
                          className="rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-1.5 focus:border-brand-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={stateRegion}
                          onChange={(e) => setStateRegion(e.target.value)}
                          placeholder="State"
                          className="rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-1.5 focus:border-brand-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="PIN / ZIP"
                          className="rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-1.5 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === 'signin' ? 'Sign In to Account' : 'Create Dynamic Account'}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3 text-[11px] text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                <span>OR</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={handleGoogleAuth}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="h-4 w-4"
                />
                Continue with Google
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                Google details autofill automatically; new or incomplete profiles will be asked to choose Customer vs Seller and complete required details.
              </p>
            </>
          )}

          {/* Optional Seller / Support / Admin Portal Access for Evaluation */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowPortalTools((v) => !v)}
              className="flex w-full items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800"
            >
              <span>Seller, Support &amp; Admin Staff Portal Sign-In</span>
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform', showPortalTools && 'rotate-180')}
              />
            </button>

            {showPortalTools && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('vendor', 'vendor@convocart.com')}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Store className="h-3.5 w-3.5 text-amber-600" /> Nexconn Audio
                </button>
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('vendor', 'studio@convocart.com')}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Store className="h-3.5 w-3.5 text-emerald-600" /> NexaDigital Studio
                </button>
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('vendor', 'global@convocart.com')}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Store className="h-3.5 w-3.5 text-orange-600" /> Ubuy Global
                </button>
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('support_agent', 'support@convocart.com')}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Headphones className="h-3.5 w-3.5 text-blue-600" /> Dispatch Support
                </button>
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('admin')}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  <Shield className="h-3.5 w-3.5 text-purple-600" /> Admin Console
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
