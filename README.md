# artisanale — Full-Stack Conversation-First Marketplace

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey.svg)](https://expressjs.com/)
[![Nexconn SDK](https://img.shields.io/badge/Nexconn%20Chat%20SDK-v26.2.1-success.svg)](https://nexconn.com/)
[![Anime.js](https://img.shields.io/badge/Anime.js-v4.0-ff4b4b.svg)](https://animejs.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passed%20(9%2F9)-brightgreen.svg)](https://vitest.dev/)

artisanale is an enterprise-grade conversation-first commerce platform that seamlessly fuses:
- **Amazon-style product discovery & filtering** with comprehensive category hierarchies and rich specs.
- **Flipkart-style shopping, cart grouping, and order lifecycle management** with live milestone tracking.
- **Ubuy-inspired international commerce capabilities**, currency display, and cross-border delivery guarantees.
- **WhatsApp-inspired real-time communication** powered by the official **Nexconn Chat SDK v26.2.1** and WebRTC calling workflows.
- **Autonomous AI Vendor Assistants (Aria & Kai)** providing grounded product Q&A, FAQ resolution, and automatic human escalation.
- **Razorpay test payment processing** with server-side HMAC-SHA256 signature verification.
- **Fluid UI micro-interactions** leveraging **React-Bits** design paradigms animated with **Anime.js v4**.

---

## 1. System Architecture

artisanale is structured as a typed monorepo ensuring zero duplication of business logic and authoritative server-side validation.

```
convocart/
├── shared/                     # Universal Single Source of Truth
│   ├── types.ts                # Domain models (Users, Products, Orders, Carts, Messages, AI configs)
│   ├── schemas.ts              # Zod validation schemas for all mutations
│   ├── constants.ts            # Order status lifecycles, categories, and Nexconn config
│   └── index.ts
│
├── backend/                    # Authoritative Node.js + Express + TypeScript Engine
│   ├── src/
│   │   ├── config/             # Environment, Nexconn credentials, and Firebase Admin
│   │   ├── middleware/         # JWT authentication, role guards, Zod validators, error handling
│   │   ├── modules/            # Controllers and routing by domain
│   │   │   ├── auth/           # Login, registration, token issuance
│   │   │   ├── products/       # Search, filter, CRUD, stock management
│   │   │   ├── vendors/        # Vendor profiles, stats, and catalog
│   │   │   ├── carts/          # Server-recalculated pricing, discounts, and taxes
│   │   │   ├── orders/         # State machine transitions, cancellation, refunds
│   │   │   ├── payments/       # Razorpay order generation & signature verification
│   │   │   ├── conversations/  # Conversation threads, message persistence, unread counters
│   │   │   ├── ai-agent/       # Grounded knowledge extraction & automated response
│   │   │   ├── support/        # Ticket dispatch and resolution
│   │   │   └── admin/          # Governance, platform metrics, and user management
│   │   ├── services/
│   │   │   ├── dataStore.ts    # Authoritative disk database with Firebase Firestore sync
│   │   │   ├── nexconnService.ts # SHA1/HMAC user token generator and call session signer
│   │   │   ├── aiAgentService.ts # Multi-vendor grounded AI reasoning with escalation rules
│   │   │   └── razorpayService.ts# Test order creation & cryptographic signature validator
│   │   ├── app.ts              # Express application configuration & middleware stack
│   │   └── server.ts           # HTTP server listener (port 5000)
│   ├── test/                   # Vitest automated test suite (Calculations, AI, State Machines)
│   └── dataStore.json          # Persistent state (survives restarts)
│
└── frontend/                   # Modern React 18 + Vite + Tailwind CSS Client
    ├── src/
    │   ├── components/
    │   │   ├── ui/             # React-Bits design library (SpotlightCard, ShinyText, SplitText, BlurFade, MagnetButton, AnimatedTabs)
    │   │   ├── layout/         # ConsumerLayout, VendorLayout (3 columns), SupportLayout, AdminLayout
    │   │   ├── chat/           # MessageBubble, MessageComposer (voice notes, attachments, emojis)
    │   │   └── calling/        # CallModal (Nexconn voice/video call signaling & active session)
    │   ├── pages/              # 18 fully implemented application pages
    │   │   ├── consumer/       # HomePage, ProductListing, ProductDetail, Cart, Checkout, Orders, Wishlist, Profile
    │   │   ├── vendor/         # 12-item dashboard (Overview, Statistics, Products, New/Edit, Orders, Customers, Conversations, AI Agent, Profile, Settings, Support)
    │   │   └── support-admin/  # SupportDashboardPage, AdminDashboardPage
    │   ├── stores/             # Zustand stores (useAuthStore, useCartStore, useWishlistStore, useChatStore)
    │   ├── lib/
    │   │   ├── api.ts          # Axios client with automatic Bearer token injection
    │   │   └── nexconnClient.ts# Official Nexconn NCEngine singleton & DirectChannel wrapper
    │   ├── App.tsx             # React Router v6 setup with guarded routes
    │   └── main.tsx
```

---

## 2. Integrated Technologies

| Subsystem | Technologies & Libraries |
| :--- | :--- |
| **Frontend Framework** | React 18, TypeScript 5.5, Vite 5.4, Tailwind CSS 3.4 |
| **UI Components & Motion**| [React-Bits](https://github.com/DavidHDev/react-bits) component paradigms, Anime.js v4, Lucide React, Canvas Confetti |
| **State & Data Fetching** | Zustand 4.5, TanStack React Query 5.51 |
| **Backend Framework** | Node.js, Express.js 4.19, TypeScript 5.5, tsx runtime |
| **Validation & Schema** | Zod 3.23 (strictly shared between client & server) |
| **Real-Time Communication**| **Nexconn Chat SDK v26.2.1** (`@nexconn/chat`, `@nexconn/engine`) |
| **Payments Integration** | Razorpay Node.js SDK & Checkout JS (Test Mode with HMAC validation) |
| **Testing** | Vitest 1.6 (Unit, calculation, cryptographic, and AI grounding tests) |

---

## 3. Real-Time Communication Architecture (Nexconn SDK)

ConvoCart uses the official **Nexconn Chat SDK v26.2.1** with direct credential signing:


### SDK Initialization & Flow
1. **User Authentication:** When a user logs in, the backend securely generates an authoritative Nexconn user token signed with the `appSecret` using SHA1/HMAC.
2. **Engine Connection:** The frontend initializes `NCEngine.initialize({ appKey })` and establishes a persistent socket connection via `NCEngine.connect({ token })`.
3. **Direct Channels:** Conversations create real-time peer channels using `new DirectChannel(participantId)`.
4. **Message Dispatch:** Rich text messages, audio voice notes, and file attachments are sent with `new SendTextMessageParams({ text, pushContent })` and received via listener events.
5. **Persistent Chat Panel:** Every consumer screen features a collapsible right-hand drawer providing instant buyer-seller chat, order cards, and call buttons.
6. **Voice & Video Calling:** Audio and video calls are initiated via `CallModal` with real-time session duration tracking, mute, camera toggle, and ring states.

---

## 4. Vendor AI Assistant Engine (Aria & Kai)

Each vendor is equipped with an AI Assistant:
- **Nexconn Audio:** Assisted by **Aria**, an expert in acoustics, Bluetooth pairing, active noise cancellation, and high-fidelity sound.
- **Ubuy Global Express:** Assisted by **Kai**, an expert in international logistics, customs clearance, and global express shipping.

### Grounding & Safety Rules
1. **Grounded Fact Extraction:** The assistant searches the vendor's actual catalog and configured FAQs.
2. **Zero Hallucination Policy:** If a customer asks a question outside the product's verified specifications (e.g. asking if ANC headphones are suitable for scuba diving), the agent politely clarifies limitations.
3. **Automatic Human Escalation:** Inquiries regarding disputed refunds, damaged deliveries, or urgent order cancellations trigger an immediate escalation flag (`escalateToHuman: true`), alerting the human vendor manager in their real-time dashboard.

---

## 5. Demo Accounts

The database comes pre-seeded with authoritative credentials:

| Role | Email | Password | Persona & Privileges |
| :--- | :--- | :--- | :--- |
| **Consumer** | `consumer@convocart.com` | `password123` | John Consumer — Full marketplace shopping, cart, wishlist, orders, persistent chat |
| **Vendor 1** | `vendor@nexconnaudio.com` | `password123` | Nexconn Audio Store Manager — 3-column dashboard, catalog management, Aria AI setup |
| **Vendor 2** | `vendor@ubuyglobal.com` | `password123` | Ubuy Global Express Manager — International catalog, Kai AI assistant, shipping config |
| **Support Agent** | `support@convocart.com` | `password123` | Sarah Jenkins — Ticket queue, priority resolution, buyer-seller escalation triage |
| **Super Admin** | `admin@convocart.com` | `password123` | Platform Administrator — System health, user status, revenue metrics, vendor approvals |

---

## 6. API Reference Catalog

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register consumer or vendor account.
- `POST /api/auth/login` — Authenticate and receive JWT + signed Nexconn user token.
- `GET /api/auth/me` — Inspect current session profile.

### Marketplace & Products (`/api/products`)
- `GET /api/products` — Search, paginate, and filter by category, price, rating, and vendor.
- `GET /api/products/:productId` — Retrieve full product details, specs, and vendor identity.
- `POST /api/products` — Create new product (Vendor only).
- `PUT /api/products/:productId` — Update product details and inventory.
- `DELETE /api/products/:productId` — Delete product.

### Cart & Pricing Authority (`/api/cart`)
- `GET /api/cart` — Fetch user's cart with recalculation of subtotals, shipping, and taxes.
- `POST /api/cart/items` — Add product variant to cart.
- `PUT /api/cart/items/:productId` — Modify quantity with real-time stock check.
- `DELETE /api/cart/items/:productId` — Remove item from cart.
- `DELETE /api/cart` — Clear entire cart.

### Orders & Payment Verification (`/api/orders`, `/api/payments`)
- `POST /api/orders` — Create pending order from cart items.
- `GET /api/orders` — List consumer orders or vendor-scoped orders.
- `GET /api/orders/:orderId` — Inspect order details and tracking timeline.
- `PUT /api/orders/:orderId/status` — Advance order state machine (Shipped, Delivered, Cancelled).
- `POST /api/payments/razorpay/order` — Create Razorpay test transaction order.
- `POST /api/payments/razorpay/verify` — Authoritative HMAC-SHA256 signature verification.

### Real-Time Conversations & AI (`/api/conversations`)
- `GET /api/conversations` — List conversation threads for current user.
- `POST /api/conversations` — Start or retrieve direct thread between buyer and seller.
- `GET /api/conversations/:id/messages` — Load message history.
- `POST /api/conversations/:id/messages` — Send message with automated AI response triggering.
- `POST /api/conversations/:id/call-token` — Generate signed WebRTC voice/video call session token.

---

## 7. Setup & Execution Instructions

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Step 1: Install Dependencies
From the repository root, install all monorepo dependencies:
```bash
npm install
```

### Step 2: Start the Backend Server
In a terminal, start the authoritative Express backend:
```bash
npm run dev:backend
```
*The server will start on `http://localhost:5000` and automatically load or initialize `backend/dataStore.json`.*

### Step 3: Start the Frontend Client
In a second terminal, start the Vite development server:
```bash
npm run dev:frontend
```
*The client will start on `http://localhost:5173`. Open your browser to explore the ConvoCart marketplace.*

### Step 4: Run the Test Suite
Execute the automated test suite in the backend:
```bash
npm run test:backend
```
Expected output:
```
✓ test/backend.test.ts (9 tests)
  ✓ calculates order subtotal, shipping, and discount correctly
  ✓ enforces order state machine transitions
  ✓ rejects illegal order transitions
  ✓ generates valid HMAC SHA-256 Razorpay signatures
  ✓ verifies valid Razorpay payment signature
  ✓ rejects invalid Razorpay payment signature
  ✓ answers grounded product questions without inventing facts
  ✓ escalates refund and dispute inquiries to human
  ✓ creates and retrieves records in data store
```

### Step 5: Verify Production Builds
Build both backend and frontend to verify zero TypeScript errors:
```bash
npm run build:backend
npm run build:frontend
```

---

## 8. License
Built for the Nexconn Hackathon Project. All rights reserved.
