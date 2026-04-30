import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

// GET /api/bids?auction_id=xxx
export async function GET(req: NextRequest) {
  const supabase     = createServerSupabaseClient()
  const auction_id   = new URL(req.url).searchParams.get('auction_id')
  if (!auction_id) return NextResponse.json({ error: 'auction_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('bids')
    .select('*, bidder:profiles(id, full_name, avatar_url)')
    .eq('auction_id', auction_id)
    .order('amount', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/bids — place a bid
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { auction_id, amount, is_proxy = false, max_proxy_amount } = await req.json()

  // Fetch auction
  const { data: auction } = await admin
    .from('auctions')
    .select('*')
    .eq('id', auction_id)
    .eq('status', 'active')
    .single()

  if (!auction) return NextResponse.json({ error: 'Auction not found or not active' }, { status: 404 })
  if (new Date(auction.ends_at) <= new Date()) return NextResponse.json({ error: 'Auction has ended' }, { status: 400 })
  if (auction.artist_id === user.id)           return NextResponse.json({ error: 'Cannot bid on your own artwork' }, { status: 400 })

  const minBid = (auction.current_bid || auction.starting_price) + 100 // min increment ₹100
  if (amount < minBid) return NextResponse.json({ error: `Minimum bid is ₹${minBid.toLocaleString('en-IN')}` }, { status: 400 })

  // Insert bid (use transaction via RPC in production)
  const { data: bid, error: bidError } = await admin.from('bids').insert({
    auction_id,
    bidder_id:        user.id,
    amount,
    is_proxy,
    max_proxy_amount: is_proxy ? max_proxy_amount : null,
  }).select().single()

  if (bidError) return NextResponse.json({ error: bidError.message }, { status: 500 })

  // Update auction current_bid & bid_count
  await admin.from('auctions').update({
    current_bid: amount,
    bid_count:   auction.bid_count + 1,
  }).eq('id', auction_id)

  return NextResponse.json({ data: bid, message: 'Bid placed successfully' })
}
