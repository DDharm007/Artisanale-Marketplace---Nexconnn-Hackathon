# Artisanale — Conversation-First Artisanal Marketplace

> **Important Notice:** This **Artisanale** app is made for the **Nexconn Hackathon** and created on the **Nexconn AI Chat and Call SDK** (`@nexconn/chat`, `@nexconn/engine`, `@nexconn/call`).
> All sensitive, crucial APIs and private app keys have been securely sanitized and decoupled into environment variables for safe open sharing and review.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey.svg)](https://expressjs.com/)
[![Nexconn AI Chat SDK](https://img.shields.io/badge/Nexconn%20Chat%20SDK-v26.2.1-success.svg)](https://nexconn.com/)
[![Nexconn Call SDK](https://img.shields.io/badge/Nexconn%20Call%20SDK-v26.2.1-orange.svg)](https://nexconn.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passed%20(26%2F26)-brightgreen.svg)](https://vitest.dev/)

---

## 🌟 Overview

**Artisanale** is a full-stack, conversation-first artisanal e-commerce marketplace built specifically for the **Nexconn Hackathon**. It is created on the **Nexconn AI Chat and Call SDK** to bridge the emotional and consultative gap between bespoke artisans and conscious consumers through seamless real-time interactions:

- **Nexconn AI Chat SDK Integration:** Real-time 1-on-1 direct channels between buyers and makers, supporting instant rich messaging, voice notes, webcam photo sharing, live typing indicators, and read receipts.
- **Nexconn Call SDK Voice & Video Calling:** Live crystal-clear WebRTC audio and video calling directly embedded in the buyer-seller chat pane, enabling live craft walkthroughs, custom bespoke order consultations, and maker verifications.
- **Autonomous AI Vendor Assistants (Artis AI, Aria & Kai):** Powered by LLM and grounded retrieval with automatic natural escalation to human artisan teams on cancellation, dispute, or custom commission requests.
- **Amazon & Etsy-Grade Artisanal Catalog:** Rich product discovery, category hierarchies (Ceramics, Pottery, Handcrafted Jewellery, Textiles, Leather, Woodcraft), multi-currency calculation, and live stock tracking.
- **Secure End-to-End Commerce:** Cart calculations with taxes & shipping thresholds, Razorpay payment verification, and encrypted chat state.
- **Elegantly Animated UI:** Built with React 18, Tailwind CSS, Lucide icons, and fluid micro-interactions with Anime.js.

---

## 🏗 System Architecture

Artisanale is designed as a typed monorepo ensuring shared data models, schema validation, and strict boundary separation between client and server:

```
Nexconn-Hackathon/
├── shared/                     # Universal Single Source of Truth
│   ├── types.ts                # TypeScript domain models (Users, Products, Orders, Carts, Messages, Call tokens)
│   ├── schemas.ts              # Shared Zod validation schemas
│   ├── constants.ts            # Order status transitions, categories, and Nexconn SDK configs
│   └── index.ts
│
├── backend/                    # Authoritative Node.js + Express + TypeScript Engine
│   ├── src/
│   │   ├── config/             # Environment loader and SDK initialization
│   │   ├── middleware/         # JWT authentication, role guards, and Zod validators
│   │   ├── modules/            # Controllers and routing by domain
│   │   │   ├── auth/           # Login, registration, token issuance
│   │   │   ├── products/       # Search, filter, CRUD, inventory
│   │   │   ├── vendors/        # Artisan profiles, stats, catalog
│   │   │   ├── carts/          # Server-recalculated pricing, discounts, taxes
│   │   │   ├── orders/         # Order state machine transitions, cancellation, refunds
│   │   │   ├── payments/       # Razorpay order generation & signature verification
│   │   │   ├── conversations/  # Conversation threads, message persistence, unread counters
│   │   │   ├── ai-agent/       # Grounded knowledge extraction & automated response
│   │   │   ├── support/        # Ticket dispatch and resolution
│   │   │   └── admin/          # Governance, platform metrics, user management
│   │   ├── services/
│   │   │   ├── dataStore.ts    # Authoritative disk database (dataStore.json)
│   │   │   ├── nexconnService.ts # SHA1/HMAC user token generator and Nexconn Call session signer
│   │   │   ├── aiAgentService.ts # Grounded AI reasoning with automated human escalation
│   │   │   ├── translationService.ts # Multilingual real-time translation for global commerce
│   │   │   └── razorpayService.ts# Payment order creation & cryptographic signature validator
│   │   ├── app.ts              # Express application configuration & middleware stack
│   │   └── server.ts           # HTTP server listener (port 5000)
│   ├── test/                   # Vitest automated test suite (26 comprehensive tests)
│   └── dataStore.json          # Persistent state (survives restarts)
│
└── frontend/                   # Modern React 18 + Vite + Tailwind CSS Client
    ├── src/
    │   ├── components/
    │   │   ├── ui/             # Modern UI library & animated components
    │   │   ├── layout/         # ConsumerLayout, VendorLayout (3 columns), SupportLayout, AdminLayout
    │   │   ├── chat/           # MessageBubble, MessageComposer (voice notes, attachments, emojis)
    │   │   └── calling/        # CallModal (Nexconn Call SDK voice/video signaling & active session)
    │   ├── pages/              # 18 fully implemented application pages
    │   │   ├── consumer/       # HomePage, ProductListing, ProductDetail, Cart, Checkout, Orders, Profile
    │   │   ├── vendor/         # Vendor dashboard (Overview, Catalog, Orders, Conversations, AI Setup)
    │   │   └── support-admin/  # SupportDashboardPage, AdminDashboardPage
    │   ├── stores/             # Zustand stores (useAuthStore, useCartStore, useChatStore)
    │   ├── lib/
    │   │   ├── api.ts          # Axios client with automatic Bearer token injection
    │   │   └── nexconnClient.ts# Official Nexconn NCEngine & NCCallEngine singleton wrapper
    │   ├── App.tsx             # React Router v6 setup with guarded routes
    │   └── main.tsx
```

---

## ⚡ Powered by Nexconn AI Chat and Call SDK

Artisanale utilizes the official **Nexconn AI Chat and Call SDK** suite:

1. **Nexconn NCEngine Initialization:**
   The frontend connects to Nexconn using your configured `appKey`:
   ```ts
   import { NCEngine, ConnectionStatusHandler, MessageHandler } from '@nexconn/chat';

   NCEngine.initialize({ appKey });
   ```

2. **Secure Token Issuance via Backend:**
   When a user authenticates, the backend signs an authoritative user session token using `appSecret` and `accessKey`:
   ```ts
   const token = nexconnService.generateUserToken(userId, userName);
   ```

3. **Direct Peer Channels & Real-Time Messaging:**
   One-on-one direct channels between buyer and artisan:
   ```ts
   const channel = new DirectChannel(artisanId);
   channel.sendTextMessage({ text, pushContent });
   ```

4. **Nexconn Call SDK WebRTC Voice & Video:**
   Artisans and customers can initiate audio or video calls directly within the chat modal using `NCCallEngine`:
   ```ts
   import { NCCallEngine } from '@nexconn/call';

   const callEngine = NCCallEngine.initialize({ logOutputLevel: 2 });
   // Session signaling, mute, camera toggle, and duration metrics
   ```

---

## 🔒 Security & Environment Variables

All crucial APIs, secret keys, and credentials have been decoupled from the codebase into `.env` files. To run with your own services, supply your keys in `backend/.env` and `frontend/.env`:

### Backend Configuration (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here

# Nexconn SDK Credentials (Obtained from Nexconn Developer Portal)
NEXCONN_APP_KEY=your_nexconn_app_key_here
NEXCONN_APP_SECRET=your_nexconn_app_secret_here
NEXCONN_ACCESS_KEY=your_nexconn_access_key_here

# Razorpay Configuration (Test Mode)
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here

# Groq Cloud API Configuration (Optional for fast LLM inference)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Google Gemini API Key (Optional)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration (Optional)
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Frontend Configuration (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api

# Nexconn Public Client App Key
VITE_NEXCONN_APP_KEY=your_nexconn_app_key_here

# Firebase Web Configuration (Optional)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

*(Note: The application includes full mock and fallback support, so it can run and pass all automated tests even before external keys are configured.)*

---

## 👥 Demo Personas & Test Credentials

The database comes pre-seeded with sample accounts for testing all user flows:

| Role | Email | Password | Persona & Privileges |
| :--- | :--- | :--- | :--- |
| **Consumer** | `consumer@convocart.com` | `password123` | John Consumer — Full artisanal shopping, cart, orders, 1-on-1 chat & calls |
| **Artisan Vendor 1** | `vendor@nexconnaudio.com` | `password123` | Audio & Tech Artisan — 3-column dashboard, catalog management, Aria AI |
| **Artisan Vendor 2** | `vendor@ubuyglobal.com` | `password123` | Ubuy Global Express — International goods, Kai AI assistant, custom shipping |
| **Support Agent** | `support@convocart.com` | `password123` | Sarah Jenkins — Ticket queue, priority resolution, buyer-seller triage |
| **Super Admin** | `admin@convocart.com` | `password123` | Platform Administrator — System health, revenue metrics, vendor approvals |

---

## 🚀 Setup & Execution

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Automated Test Suite
Run the 26 backend unit, cryptographic, and AI tests:
```bash
npm run test:backend
```

### 3. Start the Development Servers
Run both backend and frontend concurrently:
```bash
npm run dev
```
Or start them individually:
```bash
# Terminal 1: Authoritative Backend (http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend Client (http://localhost:5173)
npm run dev:frontend
```

### 4. Build for Production
```bash
npm run build:backend
npm run build:frontend
```

---

## 📜 License & Credits

- **Event:** Built for the **Nexconn Hackathon**.
- **Platform:** Created on **Nexconn AI Chat and Call SDK**.
- **Author:** Artisanale Engineering Team.
