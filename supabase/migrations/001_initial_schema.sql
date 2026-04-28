-- ═══════════════════════════════════════════════════════
-- CHITR.STORE — Database Schema
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ── Profiles (extends Supabase auth.users) ──────────────
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','artist','admin')),
  bio           TEXT,
  location      TEXT,
  website       TEXT,
  instagram     TEXT,
  artist_name   TEXT,
  specialization TEXT,
  years_experience INT,
  total_sales   INT DEFAULT 0,
  rating        DECIMAL(3,2) DEFAULT 0,
  verified      BOOLEAN DEFAULT FALSE,
  bank_account_verified BOOLEAN DEFAULT FALSE,
  stripe_account_id TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Categories ───────────────────────────────────────────
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id   UUID REFERENCES categories(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO categories (name, slug, description) VALUES
  ('Paintings',    'paintings',    'Original hand-painted works'),
  ('Watercolors',  'watercolors',  'Watercolor paintings'),
  ('Sculptures',   'sculptures',   'Three-dimensional art'),
  ('Digital Art',  'digital-art',  'Digitally created works'),
  ('Prints',       'prints',       'Limited edition prints'),
  ('Kerala Murals','kerala-murals','Traditional Kerala mural art'),
  ('Photography',  'photography',  'Fine art photography');

-- ── Artworks ─────────────────────────────────────────────
CREATE TABLE artworks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id         UUID REFERENCES categories(id),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  price               INT NOT NULL CHECK (price > 0),
  currency            TEXT NOT NULL DEFAULT 'INR',
  medium              TEXT NOT NULL CHECK (medium IN ('oil','acrylic','watercolor','charcoal','digital','mixed','sculpture','print','other')),
  width_cm            DECIMAL(8,2),
  height_cm           DECIMAL(8,2),
  year_created        INT,
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review','active','sold','archived')),
  is_original         BOOLEAN DEFAULT TRUE,
  is_print_available  BOOLEAN DEFAULT FALSE,
  print_price         INT,
  images              TEXT[] NOT NULL DEFAULT '{}',
  thumbnail           TEXT NOT NULL,
  tags                TEXT[] DEFAULT '{}',
  certificate_id      UUID,
  views               INT DEFAULT 0,
  wishlisted_count    INT DEFAULT 0,
  embedding           vector(1536), -- for AI similarity search
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX artworks_fts_idx ON artworks USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX artworks_status_idx ON artworks(status);
CREATE INDEX artworks_artist_idx ON artworks(artist_id);

-- ── Auctions ─────────────────────────────────────────────
CREATE TABLE auctions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artwork_id      UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  artist_id       UUID NOT NULL REFERENCES profiles(id),
  starting_price  INT NOT NULL CHECK (starting_price > 0),
  reserve_price   INT,
  current_bid     INT DEFAULT 0,
  bid_count       INT DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','active','ended','cancelled')),
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  winner_id       UUID REFERENCES profiles(id),
  winner_bid      INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX auctions_status_idx ON auctions(status);
CREATE INDEX auctions_ends_at_idx ON auctions(ends_at);

-- ── Bids ─────────────────────────────────────────────────
CREATE TABLE bids (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id        UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id         UUID NOT NULL REFERENCES profiles(id),
  amount            INT NOT NULL CHECK (amount > 0),
  is_proxy          BOOLEAN DEFAULT FALSE,
  max_proxy_amount  INT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX bids_auction_idx ON bids(auction_id);
CREATE INDEX bids_bidder_idx ON bids(bidder_id);

-- ── Orders ───────────────────────────────────────────────
CREATE TABLE orders (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id                  UUID NOT NULL REFERENCES profiles(id),
  artwork_id                UUID NOT NULL REFERENCES artworks(id),
  auction_id                UUID REFERENCES auctions(id),
  amount                    INT NOT NULL,
  currency                  TEXT DEFAULT 'INR',
  status                    TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','delivered','cancelled')),
  stripe_payment_intent_id  TEXT,
  shipping_address          JSONB DEFAULT '{}',
  tracking_number           TEXT,
  is_gift                   BOOLEAN DEFAULT FALSE,
  gift_message              TEXT,
  is_print                  BOOLEAN DEFAULT FALSE,
  print_size                TEXT,
  invoice_url               TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ── Certificates ─────────────────────────────────────────
CREATE TABLE certificates (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artwork_id         UUID NOT NULL REFERENCES artworks(id),
  artist_id          UUID NOT NULL REFERENCES profiles(id),
  buyer_id           UUID REFERENCES profiles(id),
  certificate_number TEXT NOT NULL UNIQUE,
  image_hash         TEXT,
  blockchain_tx      TEXT,
  issued_at          TIMESTAMPTZ DEFAULT NOW(),
  metadata           JSONB DEFAULT '{}'
);

-- ── Wishlists ────────────────────────────────────────────
CREATE TABLE wishlists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artwork_id  UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artwork_id)
);

-- ── Row Level Security ────────────────────────────────────
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE artworks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists   ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "profiles_read_all"  ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_write_own" ON profiles FOR ALL   USING (auth.uid() = id);

-- Artworks: public read active, artist write own
CREATE POLICY "artworks_read_active" ON artworks FOR SELECT USING (status = 'active' OR artist_id = auth.uid());
CREATE POLICY "artworks_insert_own"  ON artworks FOR INSERT WITH CHECK (artist_id = auth.uid());
CREATE POLICY "artworks_update_own"  ON artworks FOR UPDATE USING (artist_id = auth.uid());

-- Auctions: public read
CREATE POLICY "auctions_read_all"   ON auctions FOR SELECT USING (TRUE);
CREATE POLICY "auctions_insert_own" ON auctions FOR INSERT WITH CHECK (artist_id = auth.uid());

-- Bids: public read, auth insert
CREATE POLICY "bids_read_all"    ON bids FOR SELECT USING (TRUE);
CREATE POLICY "bids_insert_auth" ON bids FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND bidder_id = auth.uid());

-- Orders: buyer or artist see own
CREATE POLICY "orders_read_own" ON orders FOR SELECT
  USING (buyer_id = auth.uid() OR artwork_id IN (SELECT id FROM artworks WHERE artist_id = auth.uid()));

-- Wishlists: own only
CREATE POLICY "wishlists_own" ON wishlists FOR ALL USING (user_id = auth.uid());

-- Certificates: public read
CREATE POLICY "certs_read_all" ON certificates FOR SELECT USING (TRUE);

-- ── Storage buckets ───────────────────────────────────────
-- Run these in Supabase dashboard or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('artwork-images', 'artwork-images', TRUE);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', TRUE);
