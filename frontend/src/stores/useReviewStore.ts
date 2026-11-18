import { create } from 'zustand';
import { ARTISANAL_50_CATALOG } from '../data/artisanalCatalog';

export interface ProductReview {
  id: string;
  productId: string;
  productTitle: string;
  productModelUrl: string;
  vendorId: string;
  studioName: string;
  artisanName: string;
  reviewerName: string;
  reviewerAvatar: string;
  reviewerLocation: string;
  rating: number; // Supports 3.5, 4.0, 4.5, 5.0, etc.
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

const STORAGE_KEY = 'artisanale_collector_reviews_v1';

const INITIAL_PAST_REVIEWS: ProductReview[] = [
  {
    id: 'rev_01',
    productId: 'art-01-abstract-ceramic-sculptures',
    productTitle: 'Abstract Ceramic Sculptures',
    productModelUrl: '/assets/3d/sculpture_v3.glb',
    vendorId: 'vendor_atelier_terra',
    studioName: 'Atelier Terra',
    artisanName: 'Lorenzo Moretti',
    reviewerName: 'Sophia Lindstrom',
    reviewerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    reviewerLocation: 'Stockholm, Sweden',
    rating: 5.0,
    title: 'Museum-worthy sandstone texture and presence',
    comment:
      'The grogged stoneware surface catches the morning light in our living room beautifully. Lorenzo even shared photos of the kiln firing in chat before shipping.',
    verifiedPurchase: true,
    helpfulCount: 34,
    createdAt: '2 days ago',
  },
  {
    id: 'rev_02',
    productId: 'art-14-ceramic-tea-sets',
    productTitle: 'Ceramic Tea Sets',
    productModelUrl: '/assets/3d/ceramic_tea_set.glb',
    vendorId: 'vendor_kyoto_kiln',
    studioName: 'Kyoto Kiln Works',
    artisanName: 'Kenji Takahashi',
    reviewerName: 'Marcus Sterling',
    reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    reviewerLocation: 'London, UK',
    rating: 4.5,
    title: 'Exquisite Kyusu pour and balanced bamboo handle',
    comment:
      'The teapot pours without a single drip and the slate tray grounds the whole ceremony. The Yunomi cups are slightly smaller than Western mugs, which is authentic for sencha.',
    verifiedPurchase: true,
    helpfulCount: 28,
    createdAt: '4 days ago',
  },
  {
    id: 'rev_03',
    productId: 'art-04-terracotta-pots',
    productTitle: 'Terracotta Pots',
    productModelUrl: '/assets/3d/terracotta_pot.glb',
    vendorId: 'vendor_oaxaca_earth',
    studioName: 'Oaxaca Earth Studio',
    artisanName: 'Mateo & Sofia Reyes',
    reviewerName: 'Elena Vance',
    reviewerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80',
    reviewerLocation: 'Austin, USA',
    rating: 3.5,
    title: 'Authentic breathable clay, slightly rustic finish',
    comment:
      'My olive tree loves the porous Oaxaca clay and custom saucer. Giving 3.5 stars only because international courier took two extra days, though Mateo was very helpful in chat.',
    verifiedPurchase: true,
    helpfulCount: 15,
    createdAt: '1 week ago',
  },
  {
    id: 'rev_04',
    productId: 'art-12-scented-jar-candles',
    productTitle: 'Scented Jar Candles',
    productModelUrl: '/assets/3d/scented_jar_candle.glb',
    vendorId: 'vendor_lumiere_botanique',
    studioName: 'Lumière Botanique',
    artisanName: 'Camille Laurent',
    reviewerName: 'Amélie Moreau',
    reviewerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
    reviewerLocation: 'Paris, France',
    rating: 5.0,
    title: 'Warm fig leaf & cedarwood scent fills the entire studio',
    comment:
      'The twin cotton wicks burn evenly right to the edge of the amber ceramic vessel, and the turned walnut lid keeps the fragrance fresh between burns.',
    verifiedPurchase: true,
    helpfulCount: 41,
    createdAt: '1 week ago',
  },
  {
    id: 'rev_05',
    productId: 'art-26-handwoven-rugs',
    productTitle: 'Handwoven Rugs',
    productModelUrl: '/assets/3d/handwoven_rug.glb',
    vendorId: 'vendor_atlas_loom',
    studioName: 'Atlas Loom Collective',
    artisanName: 'Amina Mansouri',
    reviewerName: 'David K.',
    reviewerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    reviewerLocation: 'Berlin, Germany',
    rating: 4.0,
    title: 'Rich High Atlas wool and raised tufted diamonds',
    comment:
      'Thick, organic unbleached wool under foot with striking terracotta diamond relief. Sheds a tiny bit during the first week as expected with pure hand-spun wool.',
    verifiedPurchase: true,
    helpfulCount: 22,
    createdAt: '2 weeks ago',
  },
  {
    id: 'rev_06',
    productId: 'art-21-gemstone-rings',
    productTitle: 'Gemstone Rings',
    productModelUrl: '/assets/3d/gemstone_ring.glb',
    vendorId: 'vendor_soleil_orfevre',
    studioName: 'Soleil Orfèvre',
    artisanName: 'Claire Beaumont',
    reviewerName: 'Priya Nair',
    reviewerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80',
    reviewerLocation: 'Mumbai, India',
    rating: 5.0,
    title: 'Heirloom bezel setting and deep emerald stone',
    comment:
      'Claire resized the band to a 6.5 for me before shipping. The hammered gold vermeil has a warm satin luster that looks like an ancient treasure.',
    verifiedPurchase: true,
    helpfulCount: 39,
    createdAt: '2 weeks ago',
  },
  {
    id: 'rev_07',
    productId: 'art-13-handmade-coffee-mugs',
    productTitle: 'Handmade Coffee Mugs',
    productModelUrl: '/assets/3d/handmade_coffee_mug.glb',
    vendorId: 'vendor_kyoto_kiln',
    studioName: 'Kyoto Kiln Works',
    artisanName: 'Kenji Takahashi',
    reviewerName: 'Liam O’Connor',
    reviewerAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80',
    reviewerLocation: 'Dublin, Ireland',
    rating: 4.0,
    title: 'My new favorite morning espresso & pour-over mug',
    comment:
      'You can feel the subtle wheel-throwing rings in your hand and the unglazed terracotta foot stays warm. Ribbon handle fits two fingers comfortably.',
    verifiedPurchase: true,
    helpfulCount: 19,
    createdAt: '3 weeks ago',
  },
  {
    id: 'rev_08',
    productId: 'art-41-handmade-leather-journals',
    productTitle: 'Handmade Leather Journals',
    productModelUrl: '/assets/3d/leather_journal.glb',
    vendorId: 'vendor_bottega_cuoio',
    studioName: 'Bottega Cuoio',
    artisanName: 'Marco Bellini',
    reviewerName: 'Hannah Abbott',
    reviewerAvatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=160&auto=format&fit=crop&q=80',
    reviewerLocation: 'Toronto, Canada',
    rating: 3.5,
    title: 'Beautiful Tuscan leather smell and deckle paper',
    comment:
      'The cognac leather wrap and brass stud are gorgeous. Fountain pen ink feathers slightly on the heaviest nibs, but for pencil and fineliner sketching it is wonderful.',
    verifiedPurchase: true,
    helpfulCount: 14,
    createdAt: '3 weeks ago',
  },
  {
    id: 'rev_09',
    productId: 'art-07-wooden-sculptures',
    productTitle: 'Wooden Sculptures',
    productModelUrl: '/assets/3d/wooden_sculpture.glb',
    vendorId: 'vendor_nordic_timber',
    studioName: 'Nordic Timber Craft',
    artisanName: 'Freja Lindqvist',
    reviewerName: 'Henrik Holm',
    reviewerAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=160&auto=format&fit=crop&q=80',
    reviewerLocation: 'Oslo, Norway',
    rating: 4.5,
    title: 'Seamless walnut grain flow from every angle',
    comment:
      'The way the continuous walnut ribbon twists over the brass mounting rods is mesmerizing. Beeswax oil finish smells subtly of natural wood.',
    verifiedPurchase: true,
    helpfulCount: 31,
    createdAt: '1 month ago',
  },
];

// Assign realistic varied base ratings (3.5, 4.0, 4.5, 5.0) across the 50 products
const BASE_RATING_PATTERN = [5.0, 4.5, 5.0, 3.5, 4.5, 4.0, 4.5, 4.0, 4.5, 5.0, 4.5, 5.0, 4.0, 4.5, 5.0, 3.5, 4.5, 4.0, 5.0, 4.5];

export function getBaseProductRating(productId: string): number {
  const idx = ARTISANAL_50_CATALOG.findIndex((p) => p.id === productId);
  if (idx === -1) return 4.5;
  return BASE_RATING_PATTERN[idx % BASE_RATING_PATTERN.length];
}

function loadStoredReviews(): ProductReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_PAST_REVIEWS;
}

function saveStoredReviews(reviews: ProductReview[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // ignore
  }
}

interface ReviewStoreState {
  reviews: ProductReview[];
  addReview: (payload: {
    productId: string;
    reviewerName: string;
    reviewerLocation?: string;
    rating: number;
    title: string;
    comment: string;
  }) => ProductReview;
  markHelpful: (reviewId: string) => void;
  getProductReviews: (productId: string) => ProductReview[];
  getProductRatingStats: (productId: string) => { rating: number; count: number };
}

export const useReviewStore = create<ReviewStoreState>((set, get) => ({
  reviews: loadStoredReviews(),

  addReview: ({ productId, reviewerName, reviewerLocation, rating, title, comment }) => {
    const item =
      ARTISANAL_50_CATALOG.find((p) => p.id === productId) || ARTISANAL_50_CATALOG[0];
    const newRev: ProductReview = {
      id: `rev_${Date.now()}`,
      productId: item.id,
      productTitle: item.title,
      productModelUrl: item.modelUrl,
      vendorId: item.vendorId,
      studioName: item.studio,
      artisanName: item.artisanName,
      reviewerName: reviewerName.trim() || 'Verified Collector',
      reviewerAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
      reviewerLocation: reviewerLocation?.trim() || 'San Francisco, USA',
      rating,
      title: title.trim() || 'Beautiful handcrafted quality',
      comment: comment.trim(),
      verifiedPurchase: true,
      helpfulCount: 1,
      createdAt: 'Just now',
    };

    const updated = [newRev, ...get().reviews];
    saveStoredReviews(updated);
    set({ reviews: updated });
    return newRev;
  },

  markHelpful: (reviewId) => {
    const updated = get().reviews.map((r) =>
      r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
    );
    saveStoredReviews(updated);
    set({ reviews: updated });
  },

  getProductReviews: (productId) => {
    return get().reviews.filter((r) => r.productId === productId);
  },

  getProductRatingStats: (productId) => {
    const prodRevs = get().reviews.filter((r) => r.productId === productId);
    const baseRating = getBaseProductRating(productId);
    const catItem = ARTISANAL_50_CATALOG.find((p) => p.id === productId);
    const baseCount = catItem ? catItem.reviewCount : 18;
    if (prodRevs.length === 0) {
      return { rating: baseRating, count: baseCount };
    }
    const totalScore =
      baseRating * 4 + prodRevs.reduce((sum, r) => sum + r.rating, 0);
    const rawAvg = totalScore / (4 + prodRevs.length);
    // Round to nearest 0.5 star (3.5, 4.0, 4.5, 5.0)
    const roundedHalf = Math.round(rawAvg * 2) / 2;
    return {
      rating: Math.min(5.0, Math.max(1.0, roundedHalf)),
      count: baseCount + prodRevs.length,
    };
  },
}));
