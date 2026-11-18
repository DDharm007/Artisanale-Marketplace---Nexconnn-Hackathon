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
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          role,
          businessName: role === 'vendor' ? businessName.trim() : undefined,
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
      setErrorMsg(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setInfoBanner('');
    setSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (res.status === 'NEEDS_ONBOARDING') {
        applyPrefill(res.prefill);
        setOnboarding({ isNewAccount: res.isNewAccount, prefill: res.prefill });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google authentication was cancelled or failed.');
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
        ? `Creating your Maker Studio account for ${email}. Complete your studio and contact details below.`
        : `Creating your Collector account for ${email}. Complete your delivery and contact details below.`
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
        {/* Left: Artisanale Obsidian & Gold Passport Card */}
        <div className="lg:col-span-5 space-y-6 rounded-3xl bg-[#171717] p-7 sm:p-9 text-white shadow-2xl border border-[#2E2822] relative overflow-hidden">
          {/* Subtle Ambient Gold Radial Aura */}
          <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-[#D6B875]/15 blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 rounded-full bg-[#24201C] border border-[#3D352B] px-3.5 py-1 text-[11px] font-semibold text-[#D6B875]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Encrypted Studio Escrow &amp; Auth</span>
          </div>

          <h1
            className="text-3xl sm:text-4xl font-normal tracking-tight leading-[1.04] text-white"
            style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
          >
            Artisanale Passport &amp; Studio Identity
          </h1>

          <p className="text-xs sm:text-[12.5px] text-[#A8A29E] leading-relaxed font-normal">
            Sign in or create your live ConvoCart account. Your collector profile, delivery destination, and preferred language are securely synced and seamlessly shared with verified artisans during 1-on-1 chats and acquisitions.
          </p>

          <div className="space-y-3.5 pt-2 text-xs text-[#E5E0D5]">
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-[#D6B875] shrink-0 mt-0.5" />
              <span>Verified collector &amp; maker identities with real-time profile synchronization</span>
            </div>
            <div className="flex items-start gap-3">
              <Store className="h-4 w-4 text-[#D6B875] shrink-0 mt-0.5" />
              <span>Direct 1-on-1 dialogue with certified Kyoto, Florence, Oaxaca, and Grasse workshops</span>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 text-[#D6B875] shrink-0 mt-0.5" />
              <span>Multi-language Nexconn Chat &amp; WebRTC audio/video call engine personalized to your dialect</span>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-[#D6B875] shrink-0 mt-0.5" />
              <span>Damage-free studio transit guarantee with signed certificates of authenticity</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#2E2822]">
            <Link
              to="/shop/products"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#D6B875] hover:text-white transition-colors"
            >
              Browse 50 Creations as Guest <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Dynamic Sign In / Onboarding / Sign Up Card */}
        <div className="lg:col-span-7 rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] p-6 sm:p-9 shadow-xs">
          {onboarding ? (
            /* UNIFIED GOOGLE / PARTIAL PROFILE COMPLETION FLOW */
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCancelOnboarding}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#686359] hover:text-[#171717] cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Use a different account
                </button>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3" />
                  {onboarding.prefill.authProvider === 'google'
                    ? 'Google Profile Autofilled'
                    : 'Account Connected'}
                </span>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-[#E4DEC8] bg-white p-3.5">
                {onboarding.prefill.photoURL ? (
                  <img
                    src={onboarding.prefill.photoURL}
                    alt={onboarding.prefill.displayName || onboarding.prefill.email}
                    className="h-11 w-11 rounded-full object-cover border border-[#E4DEC8] shrink-0"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#171717] text-[#D6B875] font-bold shrink-0">
                    {(onboarding.prefill.displayName || onboarding.prefill.email)[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#171717] truncate">
                    {onboarding.isNewAccount
                      ? 'Complete Your New Account Setup'
                      : 'Complete Essential Profile Details'}
                  </p>
                  <p className="text-xs text-[#686359] truncate">{onboarding.prefill.email}</p>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCompleteOnboarding} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1.5">
                    Select Account Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole('consumer')}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition-all cursor-pointer',
                        role === 'consumer'
                          ? 'border-[#171717] bg-[#171717] text-[#D6B875]'
                          : 'border-[#E4DEC8] bg-white text-[#686359] hover:bg-[#FAF8F3]'
                      )}
                    >
                      <User className="h-4 w-4" /> Customer (Buyer)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('vendor')}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition-all cursor-pointer',
                        role === 'vendor'
                          ? 'border-[#171717] bg-[#171717] text-[#D6B875]'
                          : 'border-[#E4DEC8] bg-white text-[#686359] hover:bg-[#FAF8F3]'
                      )}
                    >
                      <Store className="h-4 w-4" /> Maker Studio
                    </button>
                  </div>
                </div>

                {role === 'vendor' && (
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1">
                      Studio / Business Name *
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8C867A]" />
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Atelier Terra Kyoto"
                        className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] pl-9 pr-3 py-2.5 focus:border-[#171717] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8C867A]" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] pl-9 pr-3 py-2.5 focus:border-[#171717] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8C867A]" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1-555-0199"
                        className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] pl-9 pr-3 py-2.5 focus:border-[#171717] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1">
                      Preferred Language
                    </label>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] px-3 py-2.5 font-medium focus:border-[#171717] focus:outline-none"
                    >
                      {SUPPORTED_CHAT_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.nativeName} ({l.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="United States / Japan / France"
                      className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] px-3 py-2.5 focus:border-[#171717] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E4DEC8] bg-white p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8C867A]">
                    <MapPin className="h-3.5 w-3.5 text-[#D6B875]" />
                    {role === 'vendor'
                      ? 'Studio / Dispatch Address *'
                      : 'Delivery Address * (Shared with artisans upon order)'}
                  </div>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Street Address (e.g. 742 Evergreen Terrace) *"
                    className="w-full rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] text-[#171717] placeholder:text-[#8C867A] px-3 py-2 focus:border-[#171717] focus:outline-none"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City *"
                      className="rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] text-[#171717] placeholder:text-[#8C867A] px-3 py-2 focus:border-[#171717] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      placeholder="State / Region"
                      className="rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] text-[#171717] placeholder:text-[#8C867A] px-3 py-2 focus:border-[#171717] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Postal Code"
                      className="rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] text-[#171717] placeholder:text-[#8C867A] px-3 py-2 focus:border-[#171717] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#171717] py-3.5 text-xs font-bold text-[#D6B875] hover:bg-black transition-all disabled:opacity-60 cursor-pointer shadow-md"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {role === 'vendor'
                    ? 'Complete Profile & Launch Maker Studio'
                    : 'Complete Profile & Explore Marketplace'}
                </button>
              </form>
            </div>
          ) : notFoundEmail ? (
            /* ACCOUNT NOT FOUND PROMPT -> CHOOSE SELLER VS CONSUMER FIRST */
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#E4DEC8] bg-[#FAF8F3] p-4">
                <div className="flex items-start gap-3">
                  <UserPlus className="h-5 w-5 text-[#D6B875] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-bold text-[#171717]">
                      No account found for {notFoundEmail}
                    </h2>
                    <p className="mt-1 text-xs text-[#686359]">
                      Would you like to create a new authenticated account? Choose your profile role:
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => handleChooseNotFoundRole('consumer')}
                  className="flex flex-col items-start gap-2 rounded-2xl border-2 border-[#E4DEC8] bg-white p-4 text-left hover:border-[#171717] hover:bg-[#FAF8F3] transition-all cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF8F3] text-[#171717] border border-[#E4DEC8]">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#171717]">Create Collector Account</p>
                    <p className="text-[11px] text-[#686359] mt-0.5">
                      Acquire creations, track deliveries, save addresses, and chat directly with verified artisans.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#171717] mt-1">
                    Continue as Collector <ArrowRight className="h-3 w-3 text-[#D6B875]" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChooseNotFoundRole('vendor')}
                  className="flex flex-col items-start gap-2 rounded-2xl border-2 border-[#E4DEC8] bg-white p-4 text-left hover:border-[#171717] hover:bg-[#FAF8F3] transition-all cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#171717] text-[#D6B875]">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#171717]">Create Maker Studio Account</p>
                    <p className="text-[11px] text-[#686359] mt-0.5">
                      Launch your studio storefront, manage collector orders, and engage in live translated chats.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#171717] mt-1">
                    Continue as Maker <ArrowRight className="h-3 w-3 text-[#D6B875]" />
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNotFoundEmail(null);
                  setErrorMsg('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#686359] hover:text-[#171717] cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </button>
            </div>
          ) : (
            /* STANDARD SIGN IN / CREATE ACCOUNT TABS */
            <>
              {/* Luxury Pill Switcher */}
              <div className="flex rounded-full bg-[#ECEAE4] p-1 mb-6 border border-[#E4DEC8]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg('');
                    setInfoBanner('');
                  }}
                  className={cn(
                    'flex-1 rounded-full py-2.5 text-xs font-bold transition-all cursor-pointer text-center',
                    mode === 'signin'
                      ? 'bg-[#171717] text-[#D6B875] shadow-xs'
                      : 'text-[#686359] hover:text-[#171717]'
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
                    'flex-1 rounded-full py-2.5 text-xs font-bold transition-all cursor-pointer text-center',
                    mode === 'signup'
                      ? 'bg-[#171717] text-[#D6B875] shadow-xs'
                      : 'text-[#686359] hover:text-[#171717]'
                  )}
                >
                  Create Account
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
                      <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1.5">
                        Account Type *
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setRole('consumer')}
                          className={cn(
                            'flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition-all cursor-pointer',
                            role === 'consumer'
                              ? 'border-[#171717] bg-[#171717] text-[#D6B875]'
                              : 'border-[#E4DEC8] bg-white text-[#686359] hover:bg-[#FAF8F3]'
                          )}
                        >
                          <User className="h-4 w-4" /> Customer (Buyer)
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('vendor')}
                          className={cn(
                            'flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition-all cursor-pointer',
                            role === 'vendor'
                              ? 'border-[#171717] bg-[#171717] text-[#D6B875]'
                              : 'border-[#E4DEC8] bg-white text-[#686359] hover:bg-[#FAF8F3]'
                          )}
                        >
                          <Store className="h-4 w-4" /> Maker Studio
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8C867A]" />
                          <input
                            type="text"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] pl-9 pr-3 py-2.5 focus:border-[#171717] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8C867A]" />
                          <input
                            type="tel"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+1-555-0199"
                            className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] pl-9 pr-3 py-2.5 focus:border-[#171717] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {role === 'vendor' && (
                      <div>
                        <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1">
                          Studio / Business Name *
                        </label>
                        <div className="relative">
                          <Store className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8C867A]" />
                          <input
                            type="text"
                            required
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="e.g. Atelier Terra Kyoto"
                            className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] pl-9 pr-3 py-2.5 focus:border-[#171717] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8C867A]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] pl-9 pr-3 py-2.5 focus:border-[#171717] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8C867A]" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] pl-9 pr-3 py-2.5 focus:border-[#171717] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {mode === 'signup' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1">
                          Preferred Language
                        </label>
                        <select
                          value={preferredLanguage}
                          onChange={(e) => setPreferredLanguage(e.target.value)}
                          className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] px-3 py-2.5 font-medium focus:border-[#171717] focus:outline-none"
                        >
                          {SUPPORTED_CHAT_LANGUAGES.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.flag} {l.nativeName} ({l.name})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold uppercase tracking-wider text-[#8C867A] mb-1">
                          Country *
                        </label>
                        <input
                          type="text"
                          required
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="United States / Japan"
                          className="w-full rounded-xl border border-[#E4DEC8] bg-white text-[#171717] placeholder:text-[#8C867A] px-3 py-2.5 focus:border-[#171717] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#E4DEC8] bg-white p-3.5 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8C867A]">
                        <MapPin className="h-3.5 w-3.5 text-[#D6B875]" />
                        {role === 'vendor'
                          ? 'Studio Dispatch Address *'
                          : 'Delivery Address * (Shared with artisans on acquisitions)'}
                      </div>
                      <input
                        type="text"
                        required
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Street Address (e.g. 742 Evergreen Terrace) *"
                        className="w-full rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] text-[#171717] placeholder:text-[#8C867A] px-3 py-2 focus:border-[#171717] focus:outline-none"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City *"
                          className="rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] text-[#171717] placeholder:text-[#8C867A] px-3 py-2 focus:border-[#171717] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={stateRegion}
                          onChange={(e) => setStateRegion(e.target.value)}
                          placeholder="State / Region"
                          className="rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] text-[#171717] placeholder:text-[#8C867A] px-3 py-2 focus:border-[#171717] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="Postal Code"
                          className="rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] text-[#171717] placeholder:text-[#8C867A] px-3 py-2 focus:border-[#171717] focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#171717] py-3.5 text-xs font-bold text-[#D6B875] hover:bg-black transition-all disabled:opacity-60 cursor-pointer shadow-md uppercase tracking-wider"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === 'signin' ? 'Sign In to Account' : 'Create Collector Account'}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3 text-[11px] text-[#8C867A]">
                <div className="h-px flex-1 bg-[#E4DEC8]" />
                <span className="font-semibold tracking-wider">OR</span>
                <div className="h-px flex-1 bg-[#E4DEC8]" />
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={handleGoogleAuth}
                className="flex w-full items-center justify-center gap-2.5 rounded-full border border-[#E4DEC8] bg-white py-3 text-xs font-semibold text-[#171717] hover:bg-[#FAF8F3] transition-colors cursor-pointer shadow-2xs"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="h-4 w-4"
                />
                <span>Continue with Google</span>
              </button>
              <p className="mt-2.5 text-center text-[11px] text-[#8C867A] leading-relaxed">
                Google details autofill automatically; new or incomplete profiles will choose Customer vs Maker and complete required details.
              </p>
            </>
          )}

          {/* Optional Maker / Support / Admin Staff Portal Access for Evaluation */}
          <div className="mt-7 pt-4 border-t border-[#E4DEC8]">
            <button
              type="button"
              onClick={() => setShowPortalTools((v) => !v)}
              className="flex w-full items-center justify-between text-[11px] font-semibold text-[#686359] hover:text-[#171717] cursor-pointer"
            >
              <span>Maker Studio, Support &amp; Admin Staff Portal Access</span>
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform text-[#D6B875]', showPortalTools && 'rotate-180')}
              />
            </button>

            {showPortalTools && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('vendor', 'vendor@convocart.com')}
                  className="flex items-center gap-1.5 rounded-xl border border-[#E4DEC8] bg-white px-3 py-2 text-[11px] font-semibold text-[#171717] hover:bg-[#FAF8F3] transition-colors cursor-pointer"
                >
                  <Store className="h-3.5 w-3.5 text-[#D6B875]" /> Atelier Terra
                </button>
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('vendor', 'studio@convocart.com')}
                  className="flex items-center gap-1.5 rounded-xl border border-[#E4DEC8] bg-white px-3 py-2 text-[11px] font-semibold text-[#171717] hover:bg-[#FAF8F3] transition-colors cursor-pointer"
                >
                  <Store className="h-3.5 w-3.5 text-[#D6B875]" /> Lumière Grasse
                </button>
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('vendor', 'global@convocart.com')}
                  className="flex items-center gap-1.5 rounded-xl border border-[#E4DEC8] bg-white px-3 py-2 text-[11px] font-semibold text-[#171717] hover:bg-[#FAF8F3] transition-colors cursor-pointer"
                >
                  <Store className="h-3.5 w-3.5 text-[#D6B875]" /> Casa Oaxaca
                </button>
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('support_agent', 'support@convocart.com')}
                  className="flex items-center gap-1.5 rounded-xl border border-[#E4DEC8] bg-white px-3 py-2 text-[11px] font-semibold text-[#171717] hover:bg-[#FAF8F3] transition-colors cursor-pointer"
                >
                  <Headphones className="h-3.5 w-3.5 text-[#D6B875]" /> Dispatch Support
                </button>
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('admin')}
                  className="flex items-center gap-1.5 rounded-xl border border-[#E4DEC8] bg-white px-3 py-2 text-[11px] font-semibold text-[#171717] hover:bg-[#FAF8F3] transition-colors cursor-pointer"
                >
                  <Shield className="h-3.5 w-3.5 text-[#D6B875]" /> Admin Console
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
