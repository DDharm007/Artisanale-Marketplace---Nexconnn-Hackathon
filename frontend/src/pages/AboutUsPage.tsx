import React from 'react';
import { Link } from 'react-router-dom';
import ModelViewer from '../components/ui/ModelViewer';
import { ARTISANAL_VENDORS } from '../data/artisanalCatalog';
import { useChatStore } from '../stores/useChatStore';
import { StarRatingDisplay } from '../components/ui/StarRating';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Globe,
  HeartHandshake,
  MessageSquare,
  Phone,
  CheckCircle2,
} from 'lucide-react';

export const AboutUsPage: React.FC = () => {
  const { startConversationWithVendor, startCall } = useChatStore();
  const studios = Object.values(ARTISANAL_VENDORS);

  return (
    <div className="min-h-screen bg-[#ECEAE4] text-[#171717] selection:bg-[#D6B875] selection:text-[#171717]">
      {/* ── 1. EDITORIAL HERO SECTION ──────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E4DEC8] bg-[#FAF8F3] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#686359]">
              <Sparkles className="h-3 w-3 text-[#D6B875]" /> Our Heritage &amp; Manifesto
            </span>
            <h1
              className="text-5xl sm:text-6xl lg:text-[72px] font-normal text-[#171717] leading-[0.96] tracking-[-0.015em]"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
            >
              Where Ancient Earth Meets Living Craft.
            </h1>
            <p className="text-xs sm:text-sm text-[#4A463F] leading-relaxed max-w-xl">
              Founded to preserve generational handcraft in an era of industrial mass production,{' '}
              <strong>Artisanale</strong> connects conscious collectors directly with 12 master
              workshops across Kyoto, Florence, Oaxaca, Marrakech, Jaipur, and Copenhagen.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/shop/products"
                className="inline-flex items-center gap-2 rounded-full bg-[#171717] px-7 py-3 text-xs font-semibold text-[#D6B875] hover:bg-black transition-colors"
              >
                Explore 50 Creations <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/shop/blog"
                className="inline-flex items-center gap-2 rounded-full border border-[#171717] bg-transparent px-6 py-3 text-xs font-semibold text-[#171717] hover:bg-[#171717] hover:text-white transition-colors"
              >
                Read Collector Journal &amp; Reviews
              </Link>
            </div>
          </div>

          {/* 3D Interactive Atelier Showcase Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-[#E4DEC8] bg-white p-6 shadow-sm">
              <div className="h-[320px] w-full relative">
                <ModelViewer
                  url="/assets/3d/sculpture_v3.glb"
                  textureUrl="/assets/3d/sculpture_sandstone.jpg"
                  textureRepeat={[3, 3]}
                  bumpScale={0.025}
                  width="100%"
                  height="100%"
                  environment="studio"
                  environmentIntensity={0.45}
                  exposure={0.84}
                  autoRotate
                  autoRotateSpeed={0.3}
                  dragRotate
                  turntable
                  zoom={false}
                  shadow
                  shadowOpacity={0.38}
                  intro="fade"
                  startAngle={-24}
                  tilt={14}
                  fit={0.86}
                  offsetY={-0.05}
                  className="w-full h-full"
                />
              </div>
              <div className="mt-3 pt-3 border-t border-[#F0EBE0] flex items-center justify-between text-xs">
                <div>
                  <p
                    className="text-lg italic text-[#171717]"
                    style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                  >
                    “Every mark of the hand is a signature of soul.”
                  </p>
                  <p className="text-[11px] text-[#7A7872]">
                    Atelier Terra · High-Fire Sandstone Sculpture
                  </p>
                </div>
                <span className="rounded-full bg-[#F5F1E8] px-3 py-1 text-[11px] font-semibold text-[#171717]">
                  360° Studio Piece
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. THREE PILLARS OF ARTISANALE ─────────────────────────────── */}
      <section className="border-y border-[#E4DEC8] bg-[#FAF8F3] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-[#E4DEC8] bg-white p-7 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-[#171717] text-[#D6B875] flex items-center justify-center">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3
                className="text-2xl font-normal text-[#171717]"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
              >
                88% Direct Maker Royalties
              </h3>
              <p className="text-xs text-[#686359] leading-relaxed">
                Unlike traditional luxury retail that marks up 400%, 88% of every acquisition on
                Artisanale flows directly to the independent workshop that shaped, glazed, or
                wove your piece.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E4DEC8] bg-white p-7 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-[#171717] text-[#D6B875] flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <h3
                className="text-2xl font-normal text-[#171717]"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
              >
                1-on-1 Translated Studio Chat
              </h3>
              <p className="text-xs text-[#686359] leading-relaxed">
                Speak directly with a master ceramist in Kyoto or a weaver in Marrakech. Our
                real-time AI translation and live video concierge bridge 8 languages effortlessly.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E4DEC8] bg-white p-7 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-[#171717] text-[#D6B875] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3
                className="text-2xl font-normal text-[#171717]"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
              >
                Signed Provenance &amp; 3D Inspection
              </h3>
              <p className="text-xs text-[#686359] leading-relaxed">
                Every creation is previewed in interactive 3D before purchase and arrives in
                plastic-free packaging with a hand-signed certificate of studio authenticity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. THE 12 MASTER ARTISAN GUILDS ────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8C867A]">
              Global Guild Directory
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-[44px] font-normal text-[#171717] mt-1 leading-tight"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
            >
              Meet Our 12 Master Studios
            </h2>
            <p className="text-xs sm:text-sm text-[#686359] mt-1">
              Click “Chat with Artisan” on any studio below to start a direct 1-on-1 conversation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {studios.map((st) => (
            <div
              key={st.vendorId}
              className="rounded-2xl border border-[#E4DEC8] bg-white p-6 flex flex-col justify-between gap-4 shadow-2xs hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <img
                    src={st.avatar}
                    alt={st.artisanName}
                    className="h-13 w-13 rounded-2xl object-cover border border-[#E4DEC8] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-[#171717] truncate">
                        {st.studioName}
                      </h3>
                      <CheckCircle2 className="h-4 w-4 text-[#D6B875] shrink-0" />
                    </div>
                    <p className="text-xs text-[#686359] mt-0.5">
                      Master: <strong className="text-[#171717]">{st.artisanName}</strong> ·{' '}
                      {st.location}
                    </p>
                    <div className="mt-1">
                      <StarRatingDisplay
                        rating={st.rating}
                        count={st.reviewCount}
                        size="xs"
                      />
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-[#4A463F] leading-relaxed">
                  {st.specialty}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F0EBE0] flex items-center gap-2">
                <button
                  onClick={() => void startConversationWithVendor(st.vendorId)}
                  className="flex-1 rounded-full bg-[#171717] px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-[#D6B875]" /> Chat with{' '}
                  {st.artisanName.split(' ')[0]}
                </button>
                <button
                  onClick={() => startCall(st.studioName, st.avatar, false)}
                  className="rounded-full border border-[#E4DEC8] bg-[#FAF8F3] px-3.5 py-2 text-xs font-medium text-[#171717] hover:border-[#171717] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Phone className="h-3.5 w-3.5" /> Call
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
