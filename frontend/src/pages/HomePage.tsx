import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product, Vendor } from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { useChatStore } from '../stores/useChatStore';
import { useCartStore } from '../stores/useCartStore';
import {
  ArrowRight,
  MessageSquare,
  ChevronRight,
  Star,
  CheckCircle2,
  X,
  ShieldCheck,
  Phone,
  Video,
  Sparkles,
} from 'lucide-react';
import ModelViewer from '../components/ui/ModelViewer';
import MagicBento from '../components/ui/MagicBento';
import { ArtisanalProductModal } from '../components/ui/ArtisanalProductModal';
import {
  ARTISANAL_50_CATALOG,
  ArtisanalCatalogItem,
  mapProductToCatalogItem,
} from '../data/artisanalCatalog';

interface BestSeller3DItem {
  id: string;
  title: string;
  price: string;
  modelUrl: string;
  textureUrl?: string;
  textureRepeat?: [number, number];
  bumpScale?: number;
  autoRotate?: boolean;
  tall?: boolean;
  fit: number;
  tilt: number;
  startAngle: number;
  offsetY?: number;
}

const BEST_SELLER_PAGES: BestSeller3DItem[][] = [
  [
    {
      id: 'art-sculpture',
      title: 'Abstract Sculpture',
      price: '$49.00',
      modelUrl: '/assets/3d/sculpture_v3.glb',
      textureUrl: '/assets/3d/sculpture_sandstone.jpg',
      textureRepeat: [2, 2],
      bumpScale: 0.025,
      autoRotate: false,
      tall: true,
      fit: 0.88,
      tilt: 8,
      startAngle: 12,
      offsetY: -0.02,
    },
    {
      id: 'art-candle',
      title: 'Bubble Candle',
      price: '$24.55',
      modelUrl: '/assets/3d/candle_v3.glb',
      textureUrl: '/assets/3d/candle_wax.jpg',
      textureRepeat: [2, 2],
      bumpScale: 0.008,
      autoRotate: true,
      tall: false,
      fit: 0.78,
      tilt: 16,
      startAngle: 24,
      offsetY: -0.04,
    },
    {
      id: 'art-vessel',
      title: 'Set of Candles',
      price: '$16.99',
      modelUrl: '/assets/3d/vessel_v3.glb',
      autoRotate: false,
      tall: false,
      fit: 0.88,
      tilt: 20,
      startAngle: 8,
      offsetY: -0.04,
    },
  ],
  [
    {
      id: 'art-vase-edition',
      title: 'Amphora Vessel',
      price: '$84.00',
      modelUrl: '/assets/3d/vase_granite.glb',
      textureUrl: '/assets/3d/pot_granite_balanced.jpg',
      textureRepeat: [3, 2],
      bumpScale: 0.04,
      autoRotate: true,
      tall: true,
      fit: 0.84,
      tilt: 8,
      startAngle: 20,
      offsetY: 0,
    },
    {
      id: 'art-teardrop-edition',
      title: 'Striped Teardrop Vase',
      price: '$38.50',
      modelUrl: '/assets/3d/teardrop.glb?v=2',
      autoRotate: true,
      tall: false,
      fit: 0.8,
      tilt: 10,
      startAngle: -20,
      offsetY: 0,
    },
    {
      id: 'art-vessel-edition',
      title: 'Terracotta Incense Vessel',
      price: '$34.00',
      modelUrl: '/assets/3d/vessel_v3.glb',
      autoRotate: true,
      tall: false,
      fit: 0.84,
      tilt: 16,
      startAngle: 15,
      offsetY: -0.04,
    },
  ],
];

export const HomePage: React.FC = () => {
  const { startConversationWithVendor, startCall } = useChatStore();
  const { addItem } = useCartStore();
  const [vendorsList, setVendorsList] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedProductModal, setSelectedProductModal] = useState<ArtisanalCatalogItem | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const [curatedSellerCatalog, setCuratedSellerCatalog] = useState<ArtisanalCatalogItem[]>(() => {
    const list = ARTISANAL_50_CATALOG.slice();
    list.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return list.slice(0, 4);
  });

  useEffect(() => {
    const loadMarketplaceData = () => {
      Promise.all([
        apiRequest<{ products: Product[] }>('/products?limit=50&sort=newest'),
        apiRequest<Vendor[]>('/vendors').catch(() => [] as Vendor[]),
      ])
        .then(([prodData, vendorList]) => {
          const liveProducts = (prodData.products || []).filter(
            (p) => !p.title.toLowerCase().includes('headphone')
          );
          const activeVendorIds = new Set(liveProducts.map((p) => p.vendorId));
          const activeVendors = (vendorList || []).filter(
            (v) =>
              activeVendorIds.has(v.vendorId) &&
              !v.businessName.toLowerCase().includes('aura sound')
          );
          setVendorsList(activeVendors);

          const vendorsMap: Record<string, Vendor> = {};
          (vendorList || []).forEach((v) => {
            vendorsMap[v.vendorId] = v;
          });

          if (prodData.products && prodData.products.length > 0) {
            const mapped = prodData.products.map((p) => mapProductToCatalogItem(p, vendorsMap));
            mapped.sort(
              (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
            setCuratedSellerCatalog(mapped.slice(0, 4));
          }
        })
        .catch((err) => console.error(err));
    };

    loadMarketplaceData();
    window.addEventListener('convocart:product_created', loadMarketplaceData);
    window.addEventListener('focus', loadMarketplaceData);

    const interval = window.setInterval(loadMarketplaceData, 8000);

    return () => {
      window.removeEventListener('convocart:product_created', loadMarketplaceData);
      window.removeEventListener('focus', loadMarketplaceData);
      window.clearInterval(interval);
    };
  }, []);

  const activeSet = BEST_SELLER_PAGES[pageIdx % BEST_SELLER_PAGES.length];
  const card1 = activeSet[0];
  const card2 = activeSet[1];
  const card3 = activeSet[2];

  return (
    <div className="min-h-screen bg-[#ECEAE4] text-[#171717] selection:bg-[#D6B875] selection:text-[#171717]">
      {/* ══════════════════════════════════════════════════════════════════
          FIRST LANDING SECTION — EXACT ARTISANALE EDITORIAL + 3D STAGE
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-[#ECEAE4] min-h-fit pb-12 lg:pb-0 lg:h-[745px] xl:h-[775px]">
        <div className="relative mx-auto h-full max-w-[1440px] px-4 sm:px-8 lg:px-12 py-6 lg:py-0">
          
          {/* 1. MONUMENTAL 3D GRANITE-TEXTURED CERAMIC POT BLEEDING OFF LEFT EDGE */}
          <div
            className="hidden lg:block absolute -left-[460px] xl:-left-[490px] -top-[45px] bottom-[-55px] w-[920px] xl:w-[980px] z-10 opacity-[0.82] transition-opacity duration-300 hover:opacity-95"
            title="Drag to rotate 3D Ceramic Pot"
          >
            <ModelViewer
              url="/assets/3d/vase_granite.glb"
              textureUrl="/assets/3d/pot_granite_balanced.jpg"
              textureRepeat={[3, 2]}
              bumpScale={0.06}
              width="100%"
              height="100%"
              environment="studio"
              environmentIntensity={0.35}
              exposure={0.78}
              autoRotate
              autoRotateSpeed={0.18}
              dragRotate
              turntable
              zoom={false}
              float={0.04}
              shadow={false}
              intro="fade"
              startAngle={12}
              tilt={2}
              fit={1.34}
              offsetX={0}
              offsetY={-0.02}
              className="w-full h-full"
            />
          </div>

          {/* 2. TOP ROW: GIANT "artisanale" TITLE + DESCRIPTION + RIGHT 3D TEARDROP VASE */}
          <div className="relative z-20 pt-1 lg:pt-[18px] pointer-events-none">
            {/* Giant "artisanale" wordmark overlapping the right shoulder of the vase */}
            <h1
              className="text-[clamp(44px,13.5vw,68px)] sm:text-[116px] md:text-[148px] lg:text-[174px] xl:text-[190px] font-normal text-[#171717] leading-[0.86] tracking-[-0.015em] select-none origin-left lg:scale-x-[1.12]"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
            >
              artisanale
            </h1>

            {/* Description block aligned directly beneath the middle of "artisanale" (28% from left) */}
            <div className="mt-4 lg:mt-4 lg:ml-[26.8%] max-w-full sm:max-w-[335px] pointer-events-auto">
              <p className="text-[11.5px] sm:text-[12.5px] text-[#333333] leading-[1.62] font-normal tracking-[-0.005em]">
                Artisanale is a curated marketplace for handcrafted goods
                — where tradition meets modern design. Every item
                is made by real hands, telling real stories. We connect
                conscious buyers with passionate makers around the world.
              </p>
            </div>
          </div>

          {/* 3. TOP-RIGHT TEARDROP VASE CARD & ITALIC QUOTE */}
          <div className="mt-5 lg:mt-0 flex items-center gap-4 rounded-2xl border border-[#E4DEC8] bg-[#FAF8F3] p-3.5 lg:bg-transparent lg:border-none lg:p-0 lg:absolute lg:right-[8.5%] xl:right-[9.5%] lg:top-[38px] z-20 lg:flex-col lg:items-start pointer-events-auto">
            <div
              className="w-[88px] h-[106px] sm:w-[116px] sm:h-[142px] xl:w-[126px] xl:h-[154px] bg-[#544D4A] rounded-xl lg:rounded-none overflow-hidden shadow-xs relative shrink-0"
              title="Drag to rotate 3D Striped Teardrop Vase"
            >
              <ModelViewer
                url="/assets/3d/teardrop.glb?v=2"
                width="100%"
                height="100%"
                environment="studio"
                environmentIntensity={0.45}
                exposure={0.85}
                autoRotate
                autoRotateSpeed={0.45}
                dragRotate
                turntable
                zoom={false}
                float={0.12}
                shadow
                shadowOpacity={0.35}
                intro="fade"
                startAngle={-20}
                tilt={5}
                fit={0.84}
                className="w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[17px] sm:text-[20px] italic text-[#171717] leading-[1.24] tracking-[0.005em]"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
              >
                — A Place Where
                <br className="hidden lg:inline" /> Hands Create
                <br className="hidden lg:inline" /> &amp; Stories Begin.
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-[#8C867A] mt-1 lg:hidden">
                Kyoto Studio Edition
              </span>
            </div>
          </div>

          {/* 4. LOWER HALF: "Our Best Sellers" (OVER VASE) + 3D PRODUCT CARDS + DOTTED CIRCLE */}
          <div className="relative z-20 mt-8 lg:mt-0 lg:absolute lg:inset-x-12 lg:top-[352px] xl:top-[366px] lg:bottom-[42px] flex flex-col lg:flex-row items-start justify-between gap-6 lg:gap-8 pointer-events-auto">
            
            {/* Bottom-Left Text Column (Overlapping the lower body of the giant vase) */}
            <div className="w-full lg:w-[24%] flex flex-col">
              <div className="flex items-end justify-between">
                <h2
                  className="text-3xl xs:text-4xl sm:text-[52px] xl:text-[58px] font-normal text-[#171717] leading-[1.03] tracking-[-0.01em] origin-left lg:scale-x-[1.05]"
                  style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                >
                  Our Best
                  <br className="hidden lg:inline" /> Sellers
                </h2>

                {/* Mobile-only pagination at section top */}
                <div className="flex lg:hidden items-center gap-3 text-xs select-none pb-1">
                  <button
                    onClick={() => setPageIdx((p) => (p > 0 ? p - 1 : 5))}
                    className="text-[#C2BFB8] hover:text-[#171717] transition-colors cursor-pointer px-1 py-0.5"
                    aria-label="Previous page"
                  >
                    ←
                  </button>
                  <span className="tracking-wider text-[#7A7872]">
                    <strong className="font-semibold text-[#171717]">{(pageIdx % 6) + 1}</strong>/6
                  </span>
                  <button
                    onClick={() => setPageIdx((p) => (p + 1) % 6)}
                    className="text-[#171717] hover:opacity-70 transition-opacity cursor-pointer px-1 py-0.5"
                    aria-label="Next page"
                  >
                    →
                  </button>
                </div>
              </div>

              <p className="mt-2 lg:mt-11 text-[11.5px] sm:text-[12px] text-[#686359] lg:text-[#171717] leading-[1.6] max-w-sm lg:max-w-[235px] font-normal">
                Explore the handcrafted pieces and
                discover beauty. From timeless decor
                to everyday essentials, these popular
                finds blend artistry, quality, and soul.
              </p>
            </div>

            {/* Bottom-Right 3D Product Cards Grid (2-columns on mobile, inline row on desktop) */}
            <div className="w-full lg:w-[73.2%] lg:h-full relative flex flex-col justify-between">
              <div className="grid grid-cols-2 lg:flex lg:items-start gap-3 sm:gap-4 xl:gap-5 w-full">
                
                {/* CARD 1: Abstract Sculpture */}
                <div className="flex flex-col w-full lg:w-[218px] xl:w-[242px] shrink-0">
                  <div className="w-full h-[170px] xs:h-[190px] sm:h-[230px] lg:h-[256px] xl:h-[278px] bg-white overflow-hidden relative rounded-xl lg:rounded-none">
                    <ModelViewer
                      url={card1.modelUrl}
                      textureUrl={card1.textureUrl}
                      textureRepeat={card1.textureRepeat}
                      bumpScale={card1.bumpScale}
                      width="100%"
                      height="100%"
                      environment="studio"
                      environmentIntensity={0.42}
                      exposure={0.82}
                      autoRotate={card1.autoRotate ?? false}
                      autoRotateSpeed={0.25}
                      dragRotate
                      turntable
                      hoverTilt={0.28}
                      float={0.18}
                      zoom
                      shadow
                      shadowOpacity={0.38}
                      intro="fade"
                      startAngle={card1.startAngle}
                      tilt={card1.tilt}
                      fit={card1.fit}
                      offsetY={card1.offsetY ?? 0}
                      className="w-full h-full"
                    />
                  </div>
                  <div
                    onClick={() => void addItem(card1.id, 1)}
                    className="mt-2 flex flex-col xs:flex-row xs:items-center justify-between text-[11px] sm:text-[12px] cursor-pointer group gap-0.5"
                    title="Click to add to cart"
                  >
                    <span className="font-normal text-[#2B2B2B] group-hover:text-black transition-colors truncate">
                      {card1.title}
                    </span>
                    <span className="font-semibold text-[#171717] shrink-0">{card1.price}</span>
                  </div>
                </div>

                {/* CARD 2: Bubble Candle */}
                <div className="flex flex-col w-full lg:w-[218px] xl:w-[242px] shrink-0">
                  <div className="w-full h-[170px] xs:h-[190px] sm:h-[230px] lg:h-[196px] xl:h-[214px] bg-white overflow-hidden relative rounded-xl lg:rounded-none">
                    <ModelViewer
                      url={card2.modelUrl}
                      textureUrl={card2.textureUrl}
                      textureRepeat={card2.textureRepeat}
                      bumpScale={card2.bumpScale}
                      width="100%"
                      height="100%"
                      environment="studio"
                      environmentIntensity={0.42}
                      exposure={0.84}
                      autoRotate={card2.autoRotate ?? true}
                      autoRotateSpeed={0.25}
                      dragRotate
                      turntable
                      hoverTilt={0.28}
                      float={0.18}
                      zoom
                      shadow
                      shadowOpacity={0.36}
                      intro="fade"
                      startAngle={card2.startAngle}
                      tilt={card2.tilt}
                      fit={card2.fit}
                      offsetY={card2.offsetY ?? 0}
                      className="w-full h-full"
                    />
                  </div>
                  <div
                    onClick={() => void addItem(card2.id, 1)}
                    className="mt-2 flex flex-col xs:flex-row xs:items-center justify-between text-[11px] sm:text-[12px] cursor-pointer group gap-0.5"
                    title="Click to add to cart"
                  >
                    <span className="font-normal text-[#2B2B2B] group-hover:text-black transition-colors truncate">
                      {card2.title}
                    </span>
                    <span className="font-semibold text-[#171717] shrink-0">{card2.price}</span>
                  </div>
                </div>

                {/* CARD 3: Set of Candles */}
                <div className="flex flex-col w-full lg:w-[218px] xl:w-[242px] shrink-0">
                  <div className="w-full h-[170px] xs:h-[190px] sm:h-[230px] lg:h-[196px] xl:h-[214px] bg-white overflow-hidden relative rounded-xl lg:rounded-none">
                    <ModelViewer
                      url={card3.modelUrl}
                      textureUrl={card3.textureUrl}
                      textureRepeat={card3.textureRepeat}
                      bumpScale={card3.bumpScale}
                      width="100%"
                      height="100%"
                      environment="studio"
                      environmentIntensity={0.42}
                      exposure={0.82}
                      autoRotate={card3.autoRotate ?? false}
                      autoRotateSpeed={0.25}
                      dragRotate
                      turntable
                      hoverTilt={0.28}
                      float={0.18}
                      zoom
                      shadow
                      shadowOpacity={0.4}
                      intro="fade"
                      startAngle={card3.startAngle}
                      tilt={card3.tilt}
                      fit={card3.fit}
                      offsetY={card3.offsetY ?? 0}
                      className="w-full h-full"
                    />
                  </div>
                  <div
                    onClick={() => void addItem(card3.id, 1)}
                    className="mt-2 flex flex-col xs:flex-row xs:items-center justify-between text-[11px] sm:text-[12px] cursor-pointer group gap-0.5"
                    title="Click to add to cart"
                  >
                    <span className="font-normal text-[#2B2B2B] group-hover:text-black transition-colors truncate">
                      {card3.title}
                    </span>
                    <span className="font-semibold text-[#171717] shrink-0">{card3.price}</span>
                  </div>
                </div>

                {/* EXPLORE ALL 50 PIECES (Completes the 2x2 grid on mobile, beaded circle on desktop) */}
                <div className="flex flex-col w-full lg:w-auto shrink-0 lg:flex-1 lg:h-[196px] xl:h-[214px] lg:min-w-[140px] lg:items-center lg:justify-center">
                  <Link
                    to="/shop/products"
                    className="group relative flex flex-col lg:flex-row items-center justify-center w-full h-[170px] xs:h-[190px] sm:h-[230px] lg:h-[132px] lg:w-[132px] xl:h-[144px] xl:w-[144px] rounded-xl lg:rounded-full bg-white lg:bg-transparent border border-[#E4DEC8] lg:border-none p-4 transition-all duration-300 hover:border-[#171717] lg:hover:scale-105"
                  >
                    {/* Desktop Circular Beaded SVG Ring */}
                    <svg
                      viewBox="0 0 144 144"
                      className="hidden lg:block absolute inset-0 h-full w-full pointer-events-none transition-transform duration-700 group-hover:rotate-12"
                    >
                      <circle
                        cx="72"
                        cy="72"
                        r="66"
                        fill="none"
                        stroke="#6F6E6A"
                        strokeWidth="4.2"
                        strokeLinecap="round"
                        strokeDasharray="0.1 13.8"
                      />
                    </svg>

                    <div className="relative z-10 flex flex-col items-center justify-center text-center gap-1.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-[#D6B875] mb-0.5 transition-transform group-hover:scale-110">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                      <span className="text-[12px] font-bold text-[#171717] lg:hidden">
                        Explore All
                      </span>
                      <span className="text-[10px] text-[#8C867A] lg:hidden">
                        50 Studio Pieces →
                      </span>
                      <span className="hidden lg:inline text-[11.5px] font-medium text-[#171717]">
                        Explore All →
                      </span>
                    </div>
                  </Link>
                </div>

              </div>

              {/* Desktop Pagination: ←  1/6  → */}
              <div className="hidden lg:flex mt-6 lg:mt-0 lg:absolute lg:right-2 lg:bottom-1 items-center justify-end gap-4 text-[12px] select-none">
                <button
                  onClick={() => setPageIdx((p) => (p > 0 ? p - 1 : 5))}
                  className="text-[#C2BFB8] hover:text-[#171717] transition-colors cursor-pointer px-1"
                  aria-label="Previous page"
                >
                  ←
                </button>
                <span className="tracking-wider text-[#7A7872]">
                  <strong className="font-semibold text-[#171717]">{(pageIdx % 6) + 1}</strong>/6
                </span>
                <button
                  onClick={() => setPageIdx((p) => (p + 1) % 6)}
                  className="text-[#171717] hover:opacity-70 transition-opacity cursor-pointer px-1"
                  aria-label="Next page"
                >
                  →
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 1.5 MAGIC BENTO: THE ARTISANALE STANDARD ─────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-8 border-t border-[#E4DEC8]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#8C867A]">
              Platform Architecture
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#171717] mt-1.5 leading-[1.08]"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
            >
              The Artisanale Standard
            </h2>
            <p className="text-xs sm:text-sm text-[#686359] mt-1.5 max-w-xl">
              Engineered for conscious craft: transparent maker economics, tactile 3D surface inspection, and real-time studio co-creation.
            </p>
          </div>
        </div>

        <MagicBento
          columns={4}
          rowHeight={200}
          gap={12}
          radius={20}
          enableBorderGlow
          enableSpotlight
          spotlightRadius={300}
          clickEffect
          enableStars={false}
          particleCount={24}
          enableTilt={false}
          enableMagnetism={false}
          textAutoHide
          intro
          theme="light"
          glowColor="#D6B875"
        />
      </section>

      {/* ── 2. LIVE MARKETPLACE CATALOG IN BLACK + IVORY + GOLD ───────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 border-t border-[#E4DEC8]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-3xl sm:text-4xl font-normal text-[#171717]"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
            >
              Curated Seller Catalog
            </h2>
            <p className="text-xs sm:text-sm text-[#686359] mt-1">
              Live verified items published by independent artisans
            </p>
          </div>
          <Link
            to="/shop/products"
            className="flex items-center gap-1 text-sm font-semibold text-[#171717] hover:text-[#D6B875] transition-colors"
          >
            <span>View all creations</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {curatedSellerCatalog.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedProductModal(item)}
              className="flex flex-col w-full cursor-pointer group"
            >
              <div className="w-full h-[252px] xl:h-[268px] bg-white overflow-hidden relative transition-shadow duration-300 group-hover:shadow-md">
                {Boolean(
                  item.isNew ||
                    (item.createdAt &&
                      Date.now() - new Date(item.createdAt).getTime() < 3 * 86400000)
                ) && (
                  <span className="absolute top-2.5 left-2.5 z-20 rounded-full bg-[#171717] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D6B875] shadow-xs">
                    New
                  </span>
                )}
                <div className="w-full h-full pointer-events-none">
                  {item.modelUrl &&
                  (item.modelUrl.endsWith('.glb') ||
                    item.modelUrl.endsWith('.gltf') ||
                    item.modelUrl.includes('/assets/3d/')) ? (
                    <ModelViewer
                      url={item.modelUrl}
                      textureUrl={item.textureUrl}
                      textureRepeat={item.textureRepeat}
                      bumpScale={item.bumpScale}
                      width="100%"
                      height="100%"
                      environment="studio"
                      environmentIntensity={0.45}
                      exposure={0.85}
                      autoRotate
                      autoRotateSpeed={0.28}
                      dragRotate={false}
                      turntable={false}
                      hoverTilt={0}
                      float={0.16}
                      zoom={false}
                      shadow
                      shadowOpacity={0.38}
                      intro="fade"
                      startAngle={item.startAngle}
                      tilt={item.tilt}
                      fit={item.fit}
                      offsetY={item.offsetY ?? 0}
                      className="w-full h-full"
                    />
                  ) : (
                    <img
                      src={item.textureUrl || item.modelUrl || '/assets/3d/sculpture_v3.glb'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[13px]">
                <span className="font-normal text-[#2B2B2B] group-hover:text-black transition-colors">
                  {item.title}
                </span>
                <span className="font-semibold text-[#171717]">{item.priceFormatted}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. VERIFIED ARTISAN STOREFRONTS ───────────────────────────── */}
      {vendorsList.length > 0 && (
        <section className="bg-[#FAF8F3] border-y border-[#E4DEC8] py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2
                className="text-3xl sm:text-4xl font-normal text-[#171717]"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
              >
                Featured Independent Studios
              </h2>
              <p className="text-sm text-[#686359] mt-1">
                Direct 1-on-1 translated chat and concierge calls with every master artisan
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vendorsList.map((vendor) => (
                <div
                  key={vendor.vendorId}
                  className="rounded-2xl border border-[#E4DEC8] bg-white p-6 flex flex-col justify-between gap-4 shadow-2xs hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={vendor.logo}
                      alt={vendor.businessName}
                      className="h-12 w-12 rounded-xl object-cover border border-[#E4DEC8] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-semibold text-[#171717] truncate">{vendor.businessName}</h3>
                        {vendor.verificationStatus === 'approved' && (
                          <CheckCircle2 className="h-4 w-4 text-[#D6B875] shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#686359] mt-0.5">
                        <span className="flex items-center gap-0.5 text-[#D6B875] font-semibold">
                          <Star className="h-3.5 w-3.5 fill-[#D6B875]" /> {vendor.rating}
                        </span>
                        <span>({vendor.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#686359] line-clamp-2 leading-relaxed">{vendor.description}</p>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F0EBE0]">
                    <button
                      onClick={() => void startConversationWithVendor(vendor.vendorId)}
                      className="rounded-full bg-[#171717] px-4 py-1.5 text-xs font-semibold text-white hover:bg-black transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-[#D6B875]" /> Chat
                    </button>
                    <button
                      onClick={() => startCall(vendor.businessName, vendor.logo, false)}
                      className="rounded-full border border-[#E4DEC8] bg-white px-3 py-1.5 text-xs font-medium text-[#171717] hover:bg-[#FAF8F3] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title="Voice Call"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call
                    </button>
                    <button
                      onClick={() => startCall(vendor.businessName, vendor.logo, true)}
                      className="rounded-full border border-[#E4DEC8] bg-white px-3 py-1.5 text-xs font-medium text-[#171717] hover:bg-[#FAF8F3] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title="Video Call"
                    >
                      <Video className="h-3.5 w-3.5" /> Video
                    </button>
                    <button
                      onClick={() => setSelectedVendor(vendor)}
                      className="text-xs font-semibold text-[#171717] hover:text-[#D6B875] transition-colors ml-0 xs:ml-auto cursor-pointer py-1"
                    >
                      Studio Profile →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 4. ARTISAN ENGAGEMENT BANNER (BLACK + GOLD) ───────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl bg-[#171717] text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="max-w-xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D6B875]">
              Real-time Creator Connection
            </span>
            <h3
              className="text-3xl sm:text-4xl font-normal leading-tight text-white"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
            >
              Direct 1-on-1 dialogue with every maker.
            </h3>
            <p className="text-sm text-[#A8A29E] leading-relaxed font-normal">
              Curious about materials, bespoke commissions, custom dimensions, or care instructions? Open a live, direct conversation with any artisan before you purchase.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/shop/support"
                className="inline-flex items-center gap-2 rounded-full bg-[#D6B875] text-[#171717] px-7 py-3 text-xs font-bold hover:bg-[#C5A45E] transition-all shadow-sm"
              >
                Open Artisan Support Hub <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/shop/products"
                className="inline-flex items-center gap-2 rounded-full border border-[#57534E] bg-white/5 text-white px-6 py-3 text-xs font-semibold hover:bg-white/10 transition-all"
              >
                Browse Catalog
              </Link>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl bg-white/5 border border-white/10 p-6 max-w-xs w-full space-y-2">
            <div className="flex items-center gap-2 text-[#D6B875] font-semibold text-sm">
              <Sparkles className="h-4 w-4" /> Sustainable Commerce
            </div>
            <p className="text-xs text-[#A8A29E] leading-relaxed">
              Every creation is directly sourced from certified makers. 100% authenticity and damage-free replacement guarantee.
            </p>
          </div>
        </div>
      </section>

      {/* ── SELLER PROFILE MODAL ─────────────────────────────────────── */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedVendor(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-[#E4DEC8] bg-[#FAF8F3] p-6 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img src={selectedVendor.logo} alt={selectedVendor.businessName} className="h-14 w-14 rounded-2xl object-cover border border-[#E4DEC8]" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-bold text-[#171717]">{selectedVendor.businessName}</h3>
                    <ShieldCheck className="h-4 w-4 text-[#D6B875]" />
                  </div>
                  <p className="text-xs text-[#686359] mt-0.5">
                    ★ {selectedVendor.rating} ({selectedVendor.reviewCount} reviews) · <span className="capitalize">{selectedVendor.availability}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="rounded-lg p-1.5 text-[#8C867A] hover:bg-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#686359] leading-relaxed">{selectedVendor.description}</p>

            <div className="space-y-2 rounded-xl border border-[#E4DEC8] bg-white p-4 text-xs">
              <div><span className="font-semibold text-[#171717]">Shipping: </span><span className="text-[#686359]">{selectedVendor.businessPolicies?.shipping}</span></div>
              <div><span className="font-semibold text-[#171717]">Returns: </span><span className="text-[#686359]">{selectedVendor.businessPolicies?.returns}</span></div>
              <div><span className="font-semibold text-[#171717]">Craft Guarantee: </span><span className="text-[#686359]">{selectedVendor.businessPolicies?.warranty}</span></div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { const v = selectedVendor; setSelectedVendor(null); void startConversationWithVendor(v.vendorId); }}
                className="rounded-full bg-[#171717] px-3 py-2 text-xs font-semibold text-white hover:bg-black flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5 text-[#D6B875]" /> Chat
              </button>
              <button
                onClick={() => { const v = selectedVendor; setSelectedVendor(null); startCall(v.businessName, v.logo, false); }}
                className="rounded-full border border-[#E4DEC8] bg-white px-3 py-2 text-xs font-medium text-[#171717] hover:bg-[#FAF8F3] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Phone className="h-3.5 w-3.5" /> Voice
              </button>
              <button
                onClick={() => { const v = selectedVendor; setSelectedVendor(null); startCall(v.businessName, v.logo, true); }}
                className="rounded-full border border-[#E4DEC8] bg-white px-3 py-2 text-xs font-medium text-[#171717] hover:bg-[#FAF8F3] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Video className="h-3.5 w-3.5" /> Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCT DETAIL POP-UP MODAL ──────────────────────────────── */}
      <ArtisanalProductModal
        item={selectedProductModal}
        onClose={() => setSelectedProductModal(null)}
      />
    </div>
  );
};
