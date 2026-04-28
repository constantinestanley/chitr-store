# 🎨 Chitr.store — Kerala Art Marketplace

> Kerala's premier online art marketplace. Buy, sell, and auction original paintings, prints, and sculptures from verified Kerala artists.

Built with Next.js 14, Supabase, Stripe, and Claude AI. Hosted on Vercel with zero-cost free tiers.

---

## ✨ Features

- 🖼️ **Artist Storefront** — Profile pages, artwork gallery, sales tracking
- 🛒 **Fixed-Price Sales** — Stripe checkout, GST-compliant invoicing
- 🔨 **Live Auction Engine** — Real-time bidding via Supabase Realtime, proxy bids, countdown timers
- 🤖 **AI-Powered** — Claude AI for artwork description generation, auto-tagging
- 📜 **Blockchain Certificates** — Provenance certificate per artwork
- 🌍 **NRI-Friendly** — Multi-currency display, international shipping
- 🖨️ **Print-on-Demand** — Order museum-quality prints of any artwork
- 📱 **Mobile-First** — PWA-ready, fully responsive

---

## 🛠️ Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | Next.js 14 (App Router)           |
| Styling     | Tailwind CSS + shadcn/ui          |
| Database    | Supabase (PostgreSQL)             |
| Auth        | Supabase Auth (email + Google)    |
| Storage     | Supabase Storage                  |
| Realtime    | Supabase Realtime (auction bids)  |
| Payments    | Stripe Checkout + Webhooks        |
| AI          | Anthropic Claude API              |
| Email       | Resend.com                        |
| Hosting     | Vercel (free tier)                |
| SSL         | Auto via Vercel + Let's Encrypt   |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-org/chitr-store.git
cd chitr-store
npm install
```

### 2. Environment Setup

```bash
cp .env.local.example .env.local
```

Fill in all values in `.env.local`. See below for how to get each key.

### 3. Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
3. Go to **Storage** → Create bucket `artwork-images` (public) and `avatars` (public)
4. Go to **Authentication** → Enable Google OAuth provider
5. Copy your project URL and anon key to `.env.local`

### 4. Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Copy publishable + secret key from Dashboard → Developers → API Keys
3. For webhooks: `stripe listen --forward-to localhost:3000/api/webhook/stripe`
4. Copy webhook secret to `.env.local`

### 5. Anthropic API

1. Get API key from [console.anthropic.com](https://console.anthropic.com)
2. Add to `.env.local`

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
chitr/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── layout.tsx                  # Root layout
│   ├── gallery/                    # Browse artworks
│   ├── auction/                    # Live auctions
│   ├── artwork/[id]/               # Artwork detail
│   ├── artist/
│   │   ├── dashboard/              # Artist dashboard
│   │   └── upload/                 # Upload artwork
│   ├── auth/
│   │   ├── login/                  # Sign in
│   │   └── register/               # Sign up
│   └── api/
│       ├── artworks/               # Artworks API
│       ├── bids/                   # Bid API
│       ├── checkout/               # Stripe checkout
│       ├── webhook/stripe/         # Stripe webhooks
│       └── ai/describe/            # Claude AI description
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── artwork/
│   │   ├── ArtworkCard.tsx
│   │   └── BuyButton.tsx
│   └── auction/
│       └── AuctionCard.tsx
├── lib/
│   ├── supabase.ts                 # Supabase client helpers
│   └── utils.ts                   # Utility functions
├── types/
│   └── index.ts                   # TypeScript types
├── styles/
│   └── globals.css                 # Global CSS + design tokens
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Full DB schema
└── middleware.ts                   # Auth route protection
```

---

## 🌐 Deployment to Vercel

1. Push code to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local` in Vercel Dashboard
4. Add custom domain `chitr.store` in Vercel → Domains
5. Update your domain DNS to point to Vercel (auto SSL included)

---

## 💰 Cost Breakdown (Monthly)

| Service       | Free Tier          | When to Upgrade       |
|---------------|--------------------|-----------------------|
| Vercel        | 100GB bandwidth    | >100GB traffic        |
| Supabase      | 500MB DB, 1GB storage | >500 artists       |
| Stripe        | 2.9% + ₹2/txn     | N/A (pay per use)     |
| Anthropic     | — (pay per call)   | ~₹0.015/AI call       |
| Resend        | 3,000 emails/mo    | >3K transactional     |
| **Total**     | **₹0/month**       | **Scales with revenue** |

---

## 🔒 Security

- Row Level Security (RLS) on all Supabase tables
- Stripe webhook signature verification
- Auth-protected routes via Next.js middleware
- Artist payouts held 7 days post-delivery
- Image fingerprinting for duplicate detection (Phase 4)

---

## 📧 Contact

**Akani Enterprises**  
Thiruvananthapuram, Kerala  
hello@chitr.store | chitr.store

---

## 📄 License

Proprietary — © 2025 Akani Enterprises. All rights reserved.
