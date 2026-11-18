import React, { useState } from 'react';
import ModelViewer from '../components/ui/ModelViewer';
import {
  StarRatingDisplay,
  InteractiveStarRating,
} from '../components/ui/StarRating';
import { useReviewStore } from '../stores/useReviewStore';
import {
  ARTISANAL_50_CATALOG,
  ARTISANAL_CATALOG_BY_ID,
  ArtisanalCatalogItem,
} from '../data/artisanalCatalog';
import { ArtisanalProductModal } from '../components/ui/ArtisanalProductModal';
import { useChatStore } from '../stores/useChatStore';
import { useAuthStore } from '../stores/useAuthStore';
import {
  Sparkles,
  PenLine,
  ThumbsUp,
  CheckCircle2,
  MessageSquare,
  Check,
  BookOpen,
} from 'lucide-react';

interface JournalArticle {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  author: string;
  readTime: string;
  date: string;
  modelUrl: string;
  textureUrl?: string;
  excerpt: string;
}

const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    id: 'journal-anagama-kiln',
    tag: 'KYOTO KILN NOTES',
    title: 'Inside a 36-Hour Anagama Wood Firing with Master Kenji Takahashi',
    subtitle: 'How natural pine ash and 1,280°C flame create unrepeatable celadon stoneware glazes.',
    author: 'Elena Rostova · Senior Curator',
    readTime: '5 min read',
    date: 'November 2026',
    modelUrl: '/assets/3d/ceramic_tea_set.glb',
    excerpt:
      'In the hills northeast of Kyoto, Kenji Takahashi feeds split red pine into a climbing tunnel kiln for thirty-six continuous hours. Where the wood ash settles on the raw Shigaraki clay, it melts into a natural olive-celadon glass that no electric kiln can replicate.',
  },
  {
    id: 'journal-grasse-botanicals',
    tag: 'APOTHECARY CRAFT',
    title: 'The Architecture of Scent: Cold-Pressed Fig Leaf & Organic Soy Wax',
    subtitle: 'Why Lumière Botanique pours every sculptural knot candle at exactly 54°C.',
    author: 'Camille Laurent · Grasse Studio',
    readTime: '4 min read',
    date: 'November 2026',
    modelUrl: '/assets/3d/soy_wax_candles.glb',
    excerpt:
      'True botanical soy wax is a living material. Poured too warm, it frosts; poured too cool, it loses the crisp flutes of our hand-carved silicone molds. We blend cold-pressed Grasse fig leaf with Atlas cedarwood for a clean, soot-free burn.',
  },
  {
    id: 'journal-atlas-weaving',
    tag: 'TEXTILE HERITAGE',
    title: 'Geometry of the High Atlas: Reading the Symbols in Berber Kilim Rugs',
    subtitle: 'How Amina Mansouri’s cooperative preserves ancestral diamond motifs in unbleached wool.',
    author: 'Amina Mansouri · Marrakech',
    readTime: '6 min read',
    date: 'October 2026',
    modelUrl: '/assets/3d/handwoven_rug.glb',
    excerpt:
      'Every tufted terracotta diamond in our High Atlas kilims is hand-knotted from unbleached mountain sheep wool dyed with crushed madder root, pomegranate rind, and saffron.',
  },
];

export const BlogPage: React.FC = () => {
  const { user } = useAuthStore();
  const { reviews, addReview, markHelpful } = useReviewStore();
  const { startConversationWithVendor } = useChatStore();

  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [selectedProductModal, setSelectedProductModal] =
    useState<ArtisanalCatalogItem | null>(null);

  // New Review Form State
  const [selectedProductId, setSelectedProductId] = useState(
    ARTISANAL_50_CATALOG[0].id
  );
  const [newRating, setNewRating] = useState<number>(5.0);
  const [reviewerName, setReviewerName] = useState(user?.displayName || '');
  const [reviewerLocation, setReviewerLocation] = useState('San Francisco, USA');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [justPublished, setJustPublished] = useState(false);

  const filteredReviews =
    ratingFilter === 'all'
      ? reviews
      : reviews.filter((r) => r.rating === ratingFilter);

  const handlePublishReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    addReview({
      productId: selectedProductId,
      reviewerName: reviewerName || user?.displayName || 'Alex Johnson',
      reviewerLocation,
      rating: newRating,
      title: reviewTitle || 'Exceptional handcrafted quality',
      comment: reviewComment,
    });
    setReviewTitle('');
    setReviewComment('');
    setJustPublished(true);
    window.setTimeout(() => setJustPublished(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#ECEAE4] text-[#171717] selection:bg-[#D6B875] selection:text-[#171717]">
      {/* ── 1. JOURNAL & COLLECTOR REVIEWS HERO ────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-12 border-b border-[#E4DEC8]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E4DEC8] bg-[#FAF8F3] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#686359]">
              <BookOpen className="h-3 w-3 text-[#D6B875]" /> Atelier Stories &amp; Collector Reviews
            </span>
            <h1
              className="mt-3 text-5xl sm:text-6xl font-normal text-[#171717] leading-[0.98]"
              style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
            >
              The Artisanale Journal
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#4A463F] max-w-2xl">
              Field dispatches from our 12 global workshops alongside verified collector
              reviews (3.5 ★, 4.0 ★, 4.5 ★ &amp; 5.0 ★) and community critiques.
            </p>
          </div>
          <a
            href="#write-review-section"
            className="inline-flex items-center gap-2 rounded-full bg-[#171717] px-6 py-3 text-xs font-semibold text-[#D6B875] hover:bg-black transition-colors shrink-0"
          >
            <PenLine className="h-3.5 w-3.5" /> Review a Vendor’s Product
          </a>
        </div>
      </section>

      {/* ── 2. EDITORIAL STORIES ROW ───────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-b border-[#E4DEC8]">
        <div className="mb-7">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8C867A]">
            Craft Dispatches
          </span>
          <h2
            className="text-3xl sm:text-4xl font-normal text-[#171717] mt-1"
            style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
          >
            Stories from the Kiln &amp; Loom
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {JOURNAL_ARTICLES.map((art) => (
            <article
              key={art.id}
              className="rounded-3xl border border-[#E4DEC8] bg-white overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
            >
              <div>
                <div className="h-56 w-full bg-[#FAF8F3] border-b border-[#E4DEC8] relative pointer-events-none">
                  <ModelViewer
                    url={art.modelUrl}
                    textureUrl={art.textureUrl}
                    width="100%"
                    height="100%"
                    environment="studio"
                    environmentIntensity={0.45}
                    exposure={0.85}
                    autoRotate
                    autoRotateSpeed={0.28}
                    dragRotate={false}
                    zoom={false}
                    shadow
                    shadowOpacity={0.36}
                    intro="fade"
                    startAngle={-18}
                    tilt={16}
                    fit={0.84}
                    className="w-full h-full"
                  />
                </div>
                <div className="p-6 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#8C867A]">
                    <span className="font-bold uppercase tracking-wider text-[#171717]">
                      {art.tag}
                    </span>
                    <span>{art.readTime}</span>
                  </div>
                  <h3
                    className="text-2xl font-normal text-[#171717] leading-snug"
                    style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                  >
                    {art.title}
                  </h3>
                  <p className="text-xs text-[#686359] leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
              </div>
              <div className="px-6 py-3.5 bg-[#FAF8F3] border-t border-[#F0EBE0] flex items-center justify-between text-[11px] text-[#686359]">
                <span>{art.author}</span>
                <span>{art.date}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── 3. PAST COLLECTOR REVIEWS (3.5 ★, 4.0 ★, 4.5 ★, 5.0 ★) & FORM ── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT 8 COLS: Past Collector Reviews Feed */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4DEC8]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8C867A]">
                  Verified Collector Ledger
                </span>
                <h2
                  className="text-3xl sm:text-4xl font-normal text-[#171717] mt-1"
                  style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                >
                  Past Collector Reviews ({filteredReviews.length})
                </h2>
              </div>

              {/* Filter by 3.5, 4.0, 4.5, 5.0 Stars */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 5.0, 4.5, 4.0, 3.5] as const).map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => setRatingFilter(val)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      ratingFilter === val
                        ? 'bg-[#171717] text-[#D6B875]'
                        : 'border border-[#E4DEC8] bg-white text-[#686359] hover:border-[#171717] hover:text-[#171717]'
                    }`}
                  >
                    {val === 'all' ? 'All Stars' : `${val.toFixed(1)} ★`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredReviews.map((rev) => {
                const catItem = ARTISANAL_CATALOG_BY_ID[rev.productId];
                return (
                  <div
                    key={rev.id}
                    className="rounded-2xl border border-[#E4DEC8] bg-white p-5 sm:p-6 flex flex-col sm:flex-row gap-5 shadow-2xs"
                  >
                    {/* 3D Product Preview Box (Click to open product modal) */}
                    <div
                      onClick={() => catItem && setSelectedProductModal(catItem)}
                      className="w-full sm:w-32 h-32 rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] overflow-hidden shrink-0 relative cursor-pointer group"
                      title={`Inspect ${rev.productTitle} in 3D`}
                    >
                      <div className="w-full h-full pointer-events-none">
                        <ModelViewer
                          url={rev.productModelUrl}
                          textureUrl={catItem?.textureUrl}
                          textureRepeat={catItem?.textureRepeat}
                          bumpScale={catItem?.bumpScale}
                          width="100%"
                          height="100%"
                          environment="studio"
                          environmentIntensity={0.45}
                          exposure={0.85}
                          autoRotate
                          autoRotateSpeed={0.3}
                          dragRotate={false}
                          zoom={false}
                          shadow={false}
                          intro="none"
                          startAngle={catItem?.startAngle ?? -18}
                          tilt={catItem?.tilt ?? 15}
                          fit={catItem?.fit ?? 0.84}
                          className="w-full h-full"
                        />
                      </div>
                    </div>

                    {/* Review Body */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={rev.reviewerAvatar}
                              alt={rev.reviewerName}
                              className="h-7 w-7 rounded-full object-cover border border-[#E4DEC8]"
                            />
                            <span className="text-xs font-bold text-[#171717]">
                              {rev.reviewerName}
                            </span>
                            <span className="text-[11px] text-[#8C867A]">
                              · {rev.reviewerLocation}
                            </span>
                            {rev.verifiedPurchase && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F1E8] px-2 py-0.5 text-[10px] font-semibold text-[#171717]">
                                <CheckCircle2 className="h-3 w-3 text-[#D6B875]" /> Verified
                              </span>
                            )}
                          </div>
                          <StarRatingDisplay rating={rev.rating} size="sm" />
                        </div>

                        <h3 className="mt-2 text-base font-bold text-[#171717]">
                          “{rev.title}”
                        </h3>
                        <p className="mt-1 text-xs text-[#4A463F] leading-relaxed">
                          {rev.comment}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#F0EBE0] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#686359]">
                        <button
                          onClick={() => catItem && setSelectedProductModal(catItem)}
                          className="font-semibold text-[#171717] hover:text-[#D6B875] transition-colors cursor-pointer"
                        >
                          Product: {rev.productTitle} · {rev.studioName} ({rev.artisanName})
                        </button>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              void startConversationWithVendor(
                                rev.vendorId,
                                rev.productId
                              )
                            }
                            className="inline-flex items-center gap-1 font-semibold text-[#171717] hover:text-[#D6B875] cursor-pointer"
                          >
                            <MessageSquare className="h-3 w-3 text-[#D6B875]" /> Chat with Studio
                          </button>
                          <button
                            onClick={() => markHelpful(rev.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#E4DEC8] bg-[#FAF8F3] px-2.5 py-1 text-[11px] font-medium text-[#171717] hover:border-[#171717] cursor-pointer"
                          >
                            <ThumbsUp className="h-3 w-3 text-[#D6B875]" /> Helpful ({rev.helpfulCount})
                          </button>
                          <span className="text-[#8C867A]">{rev.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT 4 COLS: Write a Product Review Form */}
          <div id="write-review-section" className="lg:col-span-4 sticky top-20">
            <div className="rounded-3xl border border-[#E4DEC8] bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E4DEC8]">
                <Sparkles className="h-4 w-4 text-[#D6B875]" />
                <h3
                  className="text-2xl font-normal text-[#171717]"
                  style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
                >
                  Review a Vendor’s Creation
                </h3>
              </div>

              <p className="text-xs text-[#686359]">
                Select any of the 50 handcrafted vendor creations below, choose your star rating
                (3.0 ★ to 5.0 ★), and publish your collector review.
              </p>

              {justPublished && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  Your review is now live on the Blog &amp; Marketplace!
                </div>
              )}

              <form onSubmit={handlePublishReview} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold uppercase tracking-wider text-[#8C867A] text-[10px] block mb-1">
                    1. Select Vendor Creation
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] px-3 py-2 text-xs text-[#171717] focus:border-[#171717] focus:outline-none"
                  >
                    {ARTISANAL_50_CATALOG.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — {p.studio} ({p.priceFormatted})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-[#8C867A] text-[10px] block mb-1.5">
                    2. Star Rating (Supports 3.5, 4.0, 4.5, 5.0 ★)
                  </label>
                  <InteractiveStarRating
                    value={newRating}
                    onChange={setNewRating}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold uppercase tracking-wider text-[#8C867A] text-[10px] block mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="Alex Johnson"
                      className="w-full rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] px-3 py-2 text-xs focus:border-[#171717] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase tracking-wider text-[#8C867A] text-[10px] block mb-1">
                      City / Country
                    </label>
                    <input
                      type="text"
                      value={reviewerLocation}
                      onChange={(e) => setReviewerLocation(e.target.value)}
                      placeholder="New York, USA"
                      className="w-full rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] px-3 py-2 text-xs focus:border-[#171717] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-[#8C867A] text-[10px] block mb-1">
                    Review Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Remarkable glaze and studio packaging"
                    className="w-full rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] px-3 py-2 text-xs focus:border-[#171717] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-[#8C867A] text-[10px] block mb-1">
                    Your Review
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share details about the texture, dimensions, and your experience chatting with the artisan..."
                    className="w-full rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] px-3 py-2 text-xs focus:border-[#171717] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-[#171717] py-3 text-xs font-bold text-[#D6B875] hover:bg-black transition-all cursor-pointer shadow-xs"
                >
                  Publish Collector Review
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Product Detail Pop-Up Modal when clicking any reviewed product */}
      <ArtisanalProductModal
        item={selectedProductModal}
        onClose={() => setSelectedProductModal(null)}
      />
    </div>
  );
};
