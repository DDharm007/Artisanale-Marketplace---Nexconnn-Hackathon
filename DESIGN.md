# DESIGN.md — Marketplace UI (Etsy-inspired)

Design reference for the marketplace app, modelled on etsy.com/in-en.
Use only the tokens and components listed here. Do not introduce new components.

> **Source note:** The Etsy page itself exposes structure and a few meta values (theme colour `#F1641E`) but not its stylesheet. Colour, type, spacing and radius values below are taken from community-extracted Etsy design-system specs (webdesignhot.com, shadcn.io/design/etsy), cross-checked against each other. They are close approximations, not official Etsy tokens. Graphik is a licensed font, so fallbacks are given.

---

## 1. Design Principles

- White canvas, near-black ink, **one** saturated orange for brand and primary action.
- Handmade warmth: warm cream/peach surfaces instead of cool greys for highlights.
- Image-first: product photography does the decorating; chrome stays quiet.
- Rounded but restrained: 8px base radius, pill shapes only for buttons, search and chips.
- Generous whitespace, 8px spacing rhythm.

---

## 2. Colour Tokens

### Brand
| Token | Hex | Use |
|---|---|---|
| `brand` | `#F1641E` | Primary buttons, logo, favourite heart, active accents |
| `brand-hover` | `#D9591A` | Button/link hover |
| `brand-active` (pressed) | `#B94816` | Pressed state (alt. `#D44E0D` in another source; pick one and keep it consistent) |
| `brand-pale` | `#FFD7C2` | Soft borders, badges on orange |
| `brand-deep` | `#7D4521` | Text on peach tags (Bestseller / Star Seller) |
| `etsy-brown` | `#A66523` | Seller-side accent only |
| `on-brand` | `#FFFFFF` | Text on orange |

### Surfaces
| Token | Hex | Use |
|---|---|---|
| `bg` / `surface` | `#FFFFFF` | Page and cards |
| `bg-page-warm` | `#FFF8F0` | Warm section background |
| `surface-soft` | `#F6F6F6` | Inputs, subtle panels, image placeholders |
| `surface-strong` | `#EEEEEE` | Pressed/secondary fills |
| `surface-orange` | `#FFF1EA` | Tags, highlighted rows |
| `scrim` | `rgba(0,0,0,0.5)` | Modal overlay |

### Text
| Token | Hex | Use |
|---|---|---|
| `text-strong` | `#111111` | Headlines |
| `text` / `ink` | `#222222` | Body, links |
| `body-alt` | `#3F3F3F` | Long-form body |
| `text-muted` | `#595959` | Secondary copy |
| `text-soft` | `#757575` | Captions, placeholders |
| `link-hover` | `#F1641E` | Link hover |

### Borders
| Token | Hex |
|---|---|
| `border-soft` | `#F0F0F0` |
| `border` | `#E6E6E6` |
| `border-strong` | `#CCCCCC` |
| `border-input` | `#999999` |

### Semantic
| Token | Hex | Use |
|---|---|---|
| `success` / `free-shipping` | `#067F5B` | Free shipping, success |
| `warning` | `#A35316` | Warnings |
| `danger` | `#A61B1B` | Errors |
| `info` | `#1E4DC4` | Info |
| `star` | `#F1641E` | Filled rating star |
| `star-empty` | `#DDDDDD` | Empty rating star |

---

## 3. Typography

**Font families**
- UI and body: `Graphik Webfont` → fallback `"Inter", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Wordmark / editorial headings (optional, used sparingly): a warm serif ("Guru" for the wordmark; sources also cite Guardian Egyptian for headings). Fallback: `"Georgia", serif`
- Mono label: `Monaco, ui-monospace, monospace`

**Weights:** 400 regular, 500 medium, 600 semibold.

| Role | Size | Weight | Line-height | Use |
|---|---|---|---|---|
| `display` | 56px | 600 | 1.1 | Hero statements (desktop only) |
| `h1` | 40px | 600 | 1.2 | Page titles |
| `h2` | 28px | 600 | 1.25 | Section headings ("Jump into featured interests") |
| `h3` | 22px | 500–600 | 1.3 | Card group titles |
| `body-lg` | 18px | 400 | 1.5 | Marketing paragraphs |
| `body` | 16px | 400 | 1.5 | Default text |
| `body-sm` | 14px | 400 | 1.45 | Captions, nav, secondary copy |
| `label` | 11px | 500 | 1.2 | Badges, uppercase micro-labels |

Mobile: step `display` → 32px, `h1` → 28px, `h2` → 22px; keep body at 16px.

---

## 4. Spacing Scale

| Token | px |
|---|---|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 16 |
| `lg` | 24 |
| `xl` | 32 |
| `2xl` | 48 |
| `3xl` | 64 |
| `4xl` | 96 |

- Section vertical gap: 48–64px
- Card grid gap: 16px (mobile) / 24px (desktop)
- Page side padding: 16px mobile, 24px tablet, 32px+ desktop

---

## 5. Radius & Elevation

**Radius:** `0`, `2px`, `4px`, `8px` (base, inputs and image tiles), `12px` (cards), `pill` (9999px for buttons, search, chips).

**Elevation**
| Level | Value | Use |
|---|---|---|
| 1 | `0 1px 2px rgba(0,0,0,0.08)` | Cards at rest |
| 2 | `0 2px 8px rgba(0,0,0,0.08)` | Card hover |
| 3 | `0 4px 16px rgba(0,0,0,0.12)` | Dropdowns, popovers |
| 4 | `0 8px 24px rgba(0,0,0,0.16)` | Modals |

---

## 6. Components (present on the Etsy home page)

### 6.1 Header
- White bar, 1px `border` bottom.
- Left: wordmark (brand orange, serif) and a **Categories** trigger with browse icon.
- Centre: full-width **search field** (pill, `surface-soft` or white with `border-input`, 44–48px high, search icon right, "Clear search" ✕ when filled; placeholder: "Search for items or shops").
- Right: **Sign in** text button, **Favourites** heart icon, **Cart** icon with count; locale picker (country + language) sits in the header/footer.
- "Skip to Content" link for accessibility.

### 6.2 Category Navigation Bar
- Horizontal text links below the header: Gifts, seasonal edit, Home Favourites, Fashion Finds, Vintage, Wedding Guide.
- `body-sm`, weight 500, colour `text`; hover underline or `link-hover`. Scrolls horizontally on mobile with no visible scrollbar.

### 6.3 Hero Banner (shoppable)
- Large image-led banner with a headline ("Set the scene for something spooky") and primary CTA pill ("Snag Halloween decor").
- Secondary tile beside it: 400×400 image, 12px radius, caption and "Shop now" link.
- Text over imagery uses `on-brand`/white; use a scrim only if contrast demands it.

### 6.4 Interest Tiles ("Jump into featured interests")
- Row of 4: image fills the tile, label below or overlaid. 12px radius, 1:1 or 4:3 images.
- Whole tile is the link; hover lifts to elevation 2.

### 6.5 Curated Collection Row ("Discover our best of …")
- 5 square 300×300 thumbnails with title beneath (`body`, weight 500, 2 lines max).
- Horizontal scroll with snap on mobile.

### 6.6 Buttons
| Variant | Style |
|---|---|
| Primary | `brand` fill, `on-brand` text, pill, 44px high, 16px/600; hover `brand-hover`; pressed `brand-active` |
| Secondary | White fill, 1px `text` border, `text` label, pill; hover `surface-soft` |
| Tertiary / text | No fill, underline on hover, colour `text` |
| Icon | 40–44px circle, `surface-soft` on hover (favourite heart fills `brand` when active) |

### 6.7 Product / Listing Card
- Square image (8–12px radius), heart button top-right on image.
- Below: title (`body-sm`, 2-line clamp), star rating (`star`, count in `text-soft`), price (`body`, 600), original price struck through in `text-soft`, "FREE shipping" in `free-shipping`.
- Tag chip for Bestseller / Star Seller: `surface-orange` bg, `brand-deep` text, `label` size, 4px radius.

### 6.8 Modals
- **Add to collection:** listing image thumbnail, collection list, "Create new collection" action.
- **Create collection:** name input with 50-char counter and inline error text, private/public toggle with helper text, Cancel (secondary) and Create (primary).
- **Locale / Update your settings:** region, language and currency selectors, Cancel and Save.
- **Privacy settings:** toggle rows (required cookies always on, personalised advertising on/off), Done/Saved.
- Shared style: white panel, 12px radius, elevation 4, `scrim` overlay, title `h3`, 24px padding, action buttons right-aligned.

### 6.9 Form Elements
- Text input: 44px high, 8px radius, 1px `border-input`, 12–16px horizontal padding; focus: 2px `text` outline (or `brand` ring); error: `danger` border and `body-sm` message below.
- Toggle: pill track, `brand` when on.
- Select: same as input with chevron.

### 6.10 Footer
- Four columns: **Shop**, **Sell**, **About**, **Help**. Column heading `body` 600, links `body-sm` `text-muted`, hover `text`.
- Mission line above ("We're on a mission to keep commerce human.") in `h3`.
- Bottom row: locale button, App Store / Google Play badges, social icons, © line, legal links in `body-sm`.
- Footer background `surface-soft` or `bg-page-warm`.

---

## 7. Chat / Messaging (built only from the components above)

Etsy's home page does not show a chat UI, so there is nothing to copy directly. Compose the chat from existing primitives:

- **Conversation list:** rows like the Listing Card meta area, with 40px circular image, name (`body` 600), last message (`body-sm`, `text-muted`), time (`label`, `text-soft`). Unread: `brand` dot.
- **Message bubbles:** received = `surface-soft` bg, `text`; sent = `brand` bg, `on-brand` text; 12px radius; max-width 75%.
- **Composer:** Search-field style pill input + Primary icon button.
- **Listing context strip:** Product Card thumbnail + title + price pinned at the top of the thread, with `surface-orange` background tag if relevant.
- **Empty and error states:** use the Modal text styles and Secondary button.

---

## 8. Layout & Responsiveness

- Max content width: 1280px, centred.
- Grid: 4 columns mobile-wide ≥ 480px → 2, ≥ 768px → 3, ≥ 1024px → 4–5 for listings.
- Breakpoints: 480 / 768 / 1024 / 1280.
- Touch targets ≥ 44×44px.

---

## 9. Motion & Interaction

- Transitions 150–200ms ease-out on colour, shadow, transform.
- Card hover: lift to elevation 2 and zoom image to 1.03.
- Focus: always visible, 2px outline, 2px offset.

---

## 10. Accessibility

- `text` on white ≈ 16:1; `brand` on white ≈ 3.2:1, so use `brand` for large text, icons and fills, not small body text. Use `brand-hover` or `text` for small orange-adjacent text.
- White text on `brand` passes for large/bold text (buttons at 16px/600 and above).
- Provide alt text for all product images and `aria-label` on icon-only buttons.

---

## 11. Quick CSS Variables

```css
:root {
  --brand: #F1641E;
  --brand-hover: #D9591A;
  --brand-active: #B94816;
  --brand-pale: #FFD7C2;
  --brand-deep: #7D4521;

  --bg: #FFFFFF;
  --bg-warm: #FFF8F0;
  --surface-soft: #F6F6F6;
  --surface-strong: #EEEEEE;
  --surface-orange: #FFF1EA;

  --text-strong: #111111;
  --text: #222222;
  --text-muted: #595959;
  --text-soft: #757575;

  --border-soft: #F0F0F0;
  --border: #E6E6E6;
  --border-strong: #CCCCCC;
  --border-input: #999999;

  --success: #067F5B;
  --warning: #A35316;
  --danger: #A61B1B;
  --info: #1E4DC4;

  --font-sans: "Graphik Webfont", "Inter", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-serif: Georgia, serif;

  --space-xs: 4px;  --space-sm: 8px;  --space-md: 16px; --space-lg: 24px;
  --space-xl: 32px; --space-2xl: 48px; --space-3xl: 64px; --space-4xl: 96px;

  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px; --radius-pill: 9999px;

  --shadow-1: 0 1px 2px rgba(0,0,0,.08);
  --shadow-2: 0 2px 8px rgba(0,0,0,.08);
  --shadow-3: 0 4px 16px rgba(0,0,0,.12);
  --shadow-4: 0 8px 24px rgba(0,0,0,.16);
}
```

## 12. Legal Note

Use these as a structural and stylistic reference. Do not copy Etsy's logo, wordmark, photography, copy or the licensed Graphik/Guru fonts. Use your own brand name and a free fallback font such as Inter.
