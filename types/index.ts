// ─── Database Types ──────────────────────────────────────────────

export type UserRole = 'buyer' | 'artist' | 'admin'
export type ArtworkStatus = 'draft' | 'pending_review' | 'active' | 'sold' | 'archived'
export type AuctionStatus = 'upcoming' | 'active' | 'ended' | 'cancelled'
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type Medium = 'oil' | 'acrylic' | 'watercolor' | 'charcoal' | 'digital' | 'mixed' | 'sculpture' | 'print' | 'other'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: UserRole
  bio?: string
  location?: string
  website?: string
  instagram?: string
  created_at: string
  updated_at: string
}

export interface Artist extends Profile {
  artist_name?: string
  specialization?: string
  years_experience?: number
  total_sales: number
  rating: number
  verified: boolean
  bank_account_verified: boolean
  stripe_account_id?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
}

export interface Artwork {
  id: string
  artist_id: string
  title: string
  description: string
  price: number
  currency: string
  medium: Medium
  width_cm: number
  height_cm: number
  year_created: number
  status: ArtworkStatus
  is_original: boolean
  is_print_available: boolean
  print_price?: number
  images: string[]
  thumbnail: string
  tags: string[]
  category_id?: string
  certificate_id?: string
  views: number
  wishlisted_count: number
  created_at: string
  updated_at: string
  // Joined
  artist?: Artist
  category?: Category
}

export interface Auction {
  id: string
  artwork_id: string
  artist_id: string
  starting_price: number
  reserve_price?: number
  current_bid: number
  bid_count: number
  status: AuctionStatus
  starts_at: string
  ends_at: string
  winner_id?: string
  winner_bid?: number
  created_at: string
  // Joined
  artwork?: Artwork
  artist?: Artist
  bids?: Bid[]
}

export interface Bid {
  id: string
  auction_id: string
  bidder_id: string
  amount: number
  is_proxy: boolean
  max_proxy_amount?: number
  created_at: string
  // Joined
  bidder?: Profile
}

export interface Order {
  id: string
  buyer_id: string
  artwork_id: string
  auction_id?: string
  amount: number
  currency: string
  status: OrderStatus
  stripe_payment_intent_id?: string
  shipping_address: ShippingAddress
  tracking_number?: string
  is_gift: boolean
  gift_message?: string
  is_print: boolean
  print_size?: string
  invoice_url?: string
  created_at: string
  updated_at: string
  // Joined
  artwork?: Artwork
  buyer?: Profile
}

export interface ShippingAddress {
  full_name: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone: string
}

export interface Certificate {
  id: string
  artwork_id: string
  artist_id: string
  buyer_id?: string
  certificate_number: string
  image_hash: string
  blockchain_tx?: string
  issued_at: string
  metadata: Record<string, unknown>
}

export interface Wishlist {
  id: string
  user_id: string
  artwork_id: string
  created_at: string
}

// ─── API Response Types ─────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ─── Filter Types ───────────────────────────────────────────────

export interface ArtworkFilters {
  category?: string
  medium?: Medium
  min_price?: number
  max_price?: number
  artist_id?: string
  tags?: string[]
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
  search?: string
  page?: number
  per_page?: number
}
