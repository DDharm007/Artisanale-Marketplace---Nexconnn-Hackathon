import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArtisanalCatalogItem } from '../../data/artisanalCatalog';
import { useCartStore } from '../../stores/useCartStore';
import { useChatStore } from '../../stores/useChatStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useReviewStore } from '../../stores/useReviewStore';
import ModelViewer from './ModelViewer';
import { StarRatingDisplay, InteractiveStarRating } from './StarRating';
import {
  X,
  CheckCircle2,
  MessageSquare,
  Phone,
  Video,
  ShoppingBag,
  Sparkles,
  Check,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  PenLine,
} from 'lucide-react';

interface ArtisanalProductModalProps {
  item: ArtisanalCatalogItem | null;
  onClose: () => void;
}

export const ArtisanalProductModal: React.FC<ArtisanalProductModalProps> = ({
  item,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const { startConversationWithVendor, startCall } = useChatStore();
  const { reviews, addReview, getProductRatingStats } = useReviewStore();

  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState<number>(5.0);
  const [reviewerName, setReviewerName] = useState(user?.displayName || '');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!item) return null;

  const stats = getProductRatingStats(item.id);
  const productReviews = reviews.filter((r) => r.productId === item.id);

  const handleAddToCart = async () => {
    await addItem(item.id, qty);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
  };

  const handleBuyNow = async () => {
    setIsBuying(true);
    try {
      await addItem(item.id, qty);
      onClose();
      navigate('/shop/checkout');
    } finally {
      setIsBuying(false);
    }
  };

  const handleChatWithArtisan = async () => {
    onClose();
    await startConversationWithVendor(
      item.vendorId,
      item.id,
      undefined,
      item.title,
      item.textureUrl || item.vendorAvatar
    );
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    addReview({
      productId: item.id,
      reviewerName: reviewerName || user?.displayName || 'Alex Johnson',
      rating: newRating,
      title: reviewTitle || `Loved this ${item.title}`,
      comment: reviewComment,
    });
    setReviewTitle('');
    setReviewComment('');
    setReviewSubmitted(true);
    setShowReviewForm(false);
    window.setTimeout(() => setReviewSubmitted(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-3xl border border-[#E4DEC8] bg-[#FAF8F3] text-[#171717] shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-[#E4DEC8] bg-white text-[#171717] hover:bg-[#171717] hover:text-white transition-colors cursor-pointer shadow-xs"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* LEFT: 3D INTERACTIVE STUDIO STAGE (5 Cols) */}
          <div className="md:col-span-5 bg-white p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E4DEC8] min-h-[340px] sm:min-h-[440px] relative">
            <div className="flex items-center justify-between z-10">
              <span className="rounded-full bg-[#F5F1E8] border border-[#E4DEC8] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#686359]">
                {item.categoryLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#686359]">
                <Sparkles className="h-3 w-3 text-[#D6B875]" /> Interactive 3D
              </span>
            </div>

            <div className="w-full h-[280px] sm:h-[330px] relative my-auto">
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
                  environmentIntensity={0.48}
                  exposure={0.86}
                  autoRotate
                  autoRotateSpeed={0.35}
                  dragRotate
                  turntable
                  hoverTilt={0.25}
                  float={0.18}
                  zoom
                  shadow
                  shadowOpacity={0.4}
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
                  className="w-full h-full object-contain select-none rounded-xl"
                />
              )}
            </div>

            <p className="text-[11px] text-center text-[#8C867A] z-10">
              {item.modelUrl &&
              (item.modelUrl.endsWith('.glb') ||
                item.modelUrl.endsWith('.gltf') ||
                item.modelUrl.includes('/assets/3d/'))
                ? 'Drag to rotate 360° · Scroll to inspect surface details'
                : 'Verified Atelier Creation · Handcrafted in small batches'}
            </p>
          </div>

          {/* RIGHT: PRODUCT DETAILS, VENDOR CHAT, REVIEWS & PURCHASE (7 Cols) */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5 max-h-[86vh] overflow-y-auto">
            <div>
              {/* Star Rating & Stock */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <StarRatingDisplay
                  rating={stats.rating}
                  count={stats.count}
                  size="sm"
                />
                <span className="text-[#E4DEC8]">•</span>
                <span className="text-emerald-700 font-medium">
                  In Studio Stock ({item.stock} available)
                </span>
              </div>

              {/* Title */}
              <h2
                className="mt-2 text-3xl sm:text-4xl font-normal text-[#171717] leading-tight"
                style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}
              >
                {item.title}
              </h2>

              {/* Price */}
              <div className="mt-2.5 flex items-baseline gap-2.5">
                <span className="text-2xl font-bold text-[#171717]">
                  {item.priceFormatted}
                </span>
                <span className="text-sm text-[#8C867A] line-through">
                  ${item.originalPrice.toFixed(2)}
                </span>
                <span className="rounded-full bg-[#D6B875]/25 px-2.5 py-0.5 text-[11px] font-semibold text-[#171717]">
                  Direct Atelier Price
                </span>
              </div>

              {/* Description */}
              <p className="mt-4 text-xs sm:text-sm text-[#4A463F] leading-relaxed">
                {item.description}
              </p>

              {/* Craft Specifications */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-2xl border border-[#E4DEC8] bg-white p-3.5 text-xs">
                <div>
                  <span className="font-semibold text-[#8C867A] uppercase tracking-wider text-[10px] block">
                    Materials
                  </span>
                  <span className="text-[#171717] font-medium mt-0.5 block">
                    {item.materials}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-[#8C867A] uppercase tracking-wider text-[10px] block">
                    Dimensions
                  </span>
                  <span className="text-[#171717] font-medium mt-0.5 block">
                    {item.dimensions}
                  </span>
                </div>
              </div>

              {/* Master Artisan Vendor Box + Direct Chat & Call */}
              <div className="mt-4 rounded-2xl border border-[#E4DEC8] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.vendorAvatar}
                      alt={item.artisanName}
                      className="h-11 w-11 rounded-xl object-cover border border-[#E4DEC8] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-[#171717] truncate">
                          {item.studio}
                        </span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#D6B875] shrink-0" />
                      </div>
                      <p className="text-xs text-[#686359] truncate">
                        Master Artisan:{' '}
                        <strong className="text-[#171717]">{item.artisanName}</strong> ·{' '}
                        {item.location}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#F0EBE0] flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => void handleChatWithArtisan()}
                    className="flex-1 rounded-full bg-[#171717] px-4 py-2 text-xs font-semibold text-white hover:bg-black transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-[#D6B875]" />
                    Chat with {item.artisanName.split(' ')[0]}
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      startCall(item.studio, item.vendorAvatar, false);
                    }}
                    className="rounded-full border border-[#E4DEC8] bg-[#FAF8F3] px-3.5 py-2 text-xs font-semibold text-[#171717] hover:border-[#171717] transition-colors inline-flex items-center gap-1 cursor-pointer"
                    title="Voice Call with Studio"
                  >
                    <Phone className="h-3.5 w-3.5" /> Voice
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      startCall(item.studio, item.vendorAvatar, true);
                    }}
                    className="rounded-full border border-[#E4DEC8] bg-[#FAF8F3] px-3.5 py-2 text-xs font-semibold text-[#171717] hover:border-[#171717] transition-colors inline-flex items-center gap-1 cursor-pointer"
                    title="Live Studio Video Call"
                  >
                    <Video className="h-3.5 w-3.5" /> Video
                  </button>
                </div>
              </div>

              {/* ── CUSTOMER REVIEWS & STAR RATING SECTION ──────────── */}
              <div className="mt-4 rounded-2xl border border-[#E4DEC8] bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                      Collector Reviews
                    </span>
                    <StarRatingDisplay rating={stats.rating} size="xs" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#171717] px-3 py-1 text-[11px] font-semibold text-[#171717] hover:bg-[#171717] hover:text-white transition-colors cursor-pointer"
                  >
                    <PenLine className="h-3 w-3" />
                    {showReviewForm ? 'Cancel' : 'Write a Review'}
                  </button>
                </div>

                {reviewSubmitted && (
                  <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Thank you! Your review has been published to this product &amp; the Collector Blog.
                  </p>
                )}

                {showReviewForm && (
                  <form
                    onSubmit={handleSubmitReview}
                    className="rounded-xl border border-[#E4DEC8] bg-[#FAF8F3] p-3.5 space-y-2.5 text-xs"
                  >
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#686359] block mb-1">
                        Your Star Rating
                      </label>
                      <InteractiveStarRating
                        value={newRating}
                        onChange={setNewRating}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="Your Name (e.g. Alex Johnson)"
                        className="rounded-lg border border-[#E4DEC8] bg-white px-3 py-1.5 text-xs focus:border-[#171717] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="Review Headline"
                        className="rounded-lg border border-[#E4DEC8] bg-white px-3 py-1.5 text-xs focus:border-[#171717] focus:outline-none"
                      />
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={`Share your experience with ${item.studio}'s craftsmanship...`}
                      className="w-full rounded-lg border border-[#E4DEC8] bg-white px-3 py-1.5 text-xs focus:border-[#171717] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-[#171717] px-4 py-1.5 text-xs font-semibold text-[#D6B875] hover:bg-black transition-colors cursor-pointer"
                    >
                      Publish Review
                    </button>
                  </form>
                )}

                {productReviews.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1 pt-1">
                    {productReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-xl bg-[#FAF8F3] p-2.5 text-xs border border-[#F0EBE0]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#171717]">
                            {rev.reviewerName}
                          </span>
                          <StarRatingDisplay rating={rev.rating} size="xs" />
                        </div>
                        <p className="font-medium text-[#171717] mt-0.5">
                          {rev.title}
                        </p>
                        <p className="text-[#686359] text-[11px] mt-0.5">
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#7A7872]">
                    Rated {stats.rating.toFixed(1)} ★ by {stats.count} collectors · Click "Write a Review" to share your thoughts.
                  </p>
                )}
              </div>
            </div>

            {/* Quantity + Add to Cart + Buy Now */}
            <div className="pt-3 border-t border-[#E4DEC8] space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Quantity Selector */}
                <div className="flex items-center rounded-full border border-[#E4DEC8] bg-white px-2 py-1">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-7 w-7 rounded-full flex items-center justify-center text-[#171717] hover:bg-[#F5F1E8] transition-colors cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-[#171717]">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(item.stock, q + 1))}
                    className="h-7 w-7 rounded-full flex items-center justify-center text-[#171717] hover:bg-[#F5F1E8] transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => void handleAddToCart()}
                  className="flex-1 rounded-full border-2 border-[#171717] bg-white px-5 py-2.5 text-xs font-bold text-[#171717] hover:bg-[#171717] hover:text-white transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {justAdded ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" /> Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" /> Add to Cart
                    </>
                  )}
                </button>

                {/* Buy Now Button */}
                <button
                  onClick={() => void handleBuyNow()}
                  disabled={isBuying}
                  className="flex-1 rounded-full bg-[#171717] px-5 py-2.5 text-xs font-bold text-[#D6B875] hover:bg-black transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>{isBuying ? 'Preparing...' : 'Buy Now'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#686359]">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#D6B875]" /> Signed Certificate of Provenance
                </span>
                <span className="inline-flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-[#D6B875]" /> Plastic-Free Express Delivery
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
